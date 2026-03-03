export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'API key not configured' });
  }

  try {
    const data = req.body;

    const systemPrompt = `Ты — эксперт по строительной теплотехнике и теплоизоляции зданий.
Пользователь показывает тебе конструкцию стены с расчётами. Проанализируй и дай 2-4 конкретных рекомендации по улучшению.

Формат ответа — СТРОГО JSON массив:
[
  { "priority": "high"|"medium"|"low", "title": "Краткий заголовок", "description": "Подробное описание на 1-2 предложения" }
]

Правила:
- Отвечай ТОЛЬКО валидным JSON массивом, без markdown, без пояснений
- Приоритет high — критические проблемы (не проходит норму, конденсат)
- Приоритет medium — значимые улучшения
- Приоритет low — необязательные оптимизации
- Указывай конкретные толщины в мм, названия материалов
- Учитывай порядок слоёв (первый слой — изнутри помещения)
- Если конструкция уже хорошая — похвали и предложи мелкие улучшения`;

    const userPrompt = `Конструкция стены (слои изнутри наружу):
${data.layers.map((l, i) => `${i + 1}. ${l.name} — ${l.thickness} мм (λ=${l.lambda}, μ=${l.mu}, ρ=${l.density} кг/м³)`).join('\n')}

Параметры:
- Регион: ${data.region}
- T внутри: ${data.tempInside}°C, T снаружи: ${data.tempOutside}°C
- Влажность внутри: ${data.humidityInside}%, снаружи: ${data.humidityOutside}%
- R конструкции: ${data.Rtotal?.toFixed(3)} (м²·°C)/Вт
- R требуемое: ${data.Rrequired?.toFixed(3)} (м²·°C)/Вт
- ${data.meetsNorm ? 'Соответствует нормам' : 'НЕ соответствует нормам'}
- Точка росы: ${data.dewPoint?.toFixed(1)}°C
- T внутренней поверхности: ${data.innerSurfaceTemp?.toFixed(1)}°C
- ${data.condensationRisk ? 'ЕСТЬ риск конденсата!' : 'Нет риска конденсата'}
- Теплопотери: ${data.qPerHour?.toFixed(1)} Вт/м²
- Общая толщина: ${data.totalThickness?.toFixed(0)} мм

Дай 2-4 рекомендации по оптимизации этой конструкции.`;

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://thermocalc-seven.vercel.app',
        'X-Title': 'ThermoCalc',
      },
      body: JSON.stringify({
        model: 'anthropic/claude-3.5-haiku',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        max_tokens: 1024,
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('OpenRouter error:', errText);
      return res.status(502).json({ error: 'AI service error' });
    }

    const result = await response.json();
    const content = result.choices?.[0]?.message?.content || '[]';

    // Parse JSON from response (strip markdown fences if present)
    let recommendations;
    try {
      const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      recommendations = JSON.parse(cleaned);
    } catch (parseErr) {
      console.error('JSON parse error:', parseErr, 'Content:', content);
      recommendations = [{ priority: 'medium', title: 'Рекомендация', description: content.slice(0, 300) }];
    }

    return res.status(200).json({ recommendations });
  } catch (err) {
    console.error('Handler error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
