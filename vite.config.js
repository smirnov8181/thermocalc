import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// Dev middleware to handle /api/recommend locally (in prod, Vercel serverless handles it)
function apiDevPlugin() {
  let envVars;
  return {
    name: 'api-dev',
    configResolved(config) {
      envVars = loadEnv(config.mode, config.root, '');
    },
    configureServer(server) {
      server.middlewares.use('/api/recommend', async (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.end(JSON.stringify({ error: 'Method not allowed' }));
          return;
        }

        const apiKey = envVars.OPENROUTER_API_KEY;
        if (!apiKey) {
          res.statusCode = 500;
          res.end(JSON.stringify({ error: 'OPENROUTER_API_KEY not set in .env' }));
          return;
        }

        // Parse body
        let body = '';
        for await (const chunk of req) body += chunk;
        let data;
        try { data = JSON.parse(body); } catch {
          res.statusCode = 400;
          res.end(JSON.stringify({ error: 'Invalid JSON' }));
          return;
        }

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

        try {
          const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${apiKey}`,
              'HTTP-Referer': 'http://localhost:5173',
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
            res.statusCode = 502;
            res.end(JSON.stringify({ error: 'AI service error' }));
            return;
          }

          const result = await response.json();
          const content = result.choices?.[0]?.message?.content || '[]';

          let recommendations;
          try {
            const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
            recommendations = JSON.parse(cleaned);
          } catch {
            recommendations = [{ priority: 'medium', title: 'Рекомендация', description: content.slice(0, 300) }];
          }

          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ recommendations }));
        } catch (err) {
          console.error('API error:', err);
          res.statusCode = 500;
          res.end(JSON.stringify({ error: 'Internal error' }));
        }
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), apiDevPlugin()],
});
