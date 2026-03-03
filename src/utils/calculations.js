export function calcR(layers) {
  const Rint = 1 / 8.7;
  const Rext = 1 / 23;
  let Rwall = 0;
  layers.forEach(l => {
    Rwall += (l.thickness / 1000) / l.material.lambda;
  });
  return { Rint, Rext, Rwall, Rtotal: Rint + Rwall + Rext };
}

export function calcTemperatures(layers, tIn, tOut) {
  const { Rint, Rext, Rtotal } = calcR(layers);
  if (Rtotal === 0) return [];
  const q = (tIn - tOut) / Rtotal;
  const points = [];
  let cumR = 0;
  let cumThick = 0;

  points.push({ x: 0, t: tIn, label: "Внутри" });
  cumR += Rint;
  points.push({ x: 0, t: tIn - q * cumR, label: "Пов-сть (в)" });

  layers.forEach((l) => {
    const Rl = (l.thickness / 1000) / l.material.lambda;
    cumR += Rl;
    cumThick += l.thickness;
    points.push({
      x: cumThick,
      t: tIn - q * cumR,
      label: l.material.name
    });
  });

  cumR += Rext;
  points.push({ x: cumThick, t: tOut, label: "Пов-сть (н)" });
  points.push({ x: cumThick + 5, t: tOut, label: "Снаружи" });

  return points;
}

export function dewPoint(t, rh) {
  const a = 17.27, b = 237.7;
  const alpha = (a * t) / (b + t) + Math.log(rh / 100);
  return (b * alpha) / (a - alpha);
}

export function getRequired(gsop) {
  return 0.00035 * gsop + 1.4;
}

export function getSanitary(tIn, tOut, n, deltaT, alphaInt) {
  return n * (tIn - tOut) / (deltaT * alphaInt);
}

export function drawTempGraph(canvas, temps, dewP, isDark, layers) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  ctx.scale(dpr, dpr);
  const W = rect.width, H = rect.height;
  const pad = { top: 24, right: 16, bottom: 28, left: 44 };

  if (temps.length < 2) {
    ctx.fillStyle = getComputedStyle(document.body).getPropertyValue('--muted-foreground').trim();
    ctx.font = '13px Inter';
    ctx.textAlign = 'center';
    ctx.fillText('Добавьте слои для визуализации', W / 2, H / 2);
    return;
  }

  const tMin = Math.min(...temps.map(p => p.t), dewP) - 3;
  const tMax = Math.max(...temps.map(p => p.t), dewP) + 3;
  const xMax = temps[temps.length - 1].x || 1;

  const toX = (x) => pad.left + (x / xMax) * (W - pad.left - pad.right);
  const toY = (t) => pad.top + ((tMax - t) / (tMax - tMin)) * (H - pad.top - pad.bottom);

  // Grid
  ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
  ctx.lineWidth = 1;
  const tStep = Math.ceil((tMax - tMin) / 6);
  for (let t = Math.ceil(tMin); t <= tMax; t += tStep) {
    const y = toY(t);
    ctx.beginPath();
    ctx.moveTo(pad.left, y);
    ctx.lineTo(W - pad.right, y);
    ctx.stroke();
    ctx.fillStyle = isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.35)';
    ctx.font = '10px JetBrains Mono';
    ctx.textAlign = 'right';
    ctx.fillText(`${t}°`, pad.left - 6, y + 3);
  }

  // Layer backgrounds
  let cumulX = 0;
  layers.forEach((l) => {
    const x1 = toX(cumulX);
    cumulX += l.thickness;
    const x2 = toX(cumulX);
    ctx.fillStyle = l.material.color + '30';
    ctx.fillRect(x1, pad.top, x2 - x1, H - pad.top - pad.bottom);
    ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';
    ctx.beginPath();
    ctx.moveTo(x2, pad.top);
    ctx.lineTo(x2, H - pad.bottom);
    ctx.stroke();
  });

  // Dew point line
  const dewY = toY(dewP);
  ctx.strokeStyle = isDark ? 'rgba(100,180,255,0.35)' : 'rgba(0,100,200,0.3)';
  ctx.setLineDash([4, 4]);
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(pad.left, dewY);
  ctx.lineTo(W - pad.right, dewY);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.fillStyle = isDark ? 'rgba(100,180,255,0.6)' : 'rgba(0,100,200,0.5)';
  ctx.font = '9px JetBrains Mono';
  ctx.textAlign = 'left';
  ctx.fillText(`Точка росы ${dewP.toFixed(1)}°`, pad.left + 4, dewY - 5);

  // Temperature line
  ctx.strokeStyle = isDark ? '#ff7070' : '#d44';
  ctx.lineWidth = 2.5;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.beginPath();
  temps.forEach((p, i) => {
    const x = toX(p.x);
    const y = toY(p.t);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();

  // Points
  temps.forEach((p, i) => {
    if (i === 0 || i === temps.length - 1) return;
    const x = toX(p.x);
    const y = toY(p.t);
    ctx.fillStyle = isDark ? '#ff7070' : '#d44';
    ctx.beginPath();
    ctx.arc(x, y, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = isDark ? '#333' : '#fff';
    ctx.beginPath();
    ctx.arc(x, y, 1.5, 0, Math.PI * 2);
    ctx.fill();
  });
}
