import { fmt, linspace, normalCdf, normalQuantile } from '../../lib/num';
import { C, arrow, backdrop, badge, circle, dimension, glow, line, rayo, text, tower } from '../../lib/draw';
import { Plot, SceneCanvas } from '../../components/ui';
import type { Experiment } from '../types';
import { corner } from '../common';

/* =============================== e04 =============================== */

const e04: Experiment = {
  id: 'e04',
  topicId: 3,
  title: 'El rayo: una distribución, no un valor',
  tagline: 'Corriente de cresta, di/dt y los tres mecanismos de afectación',
  why: 'Entender por qué se habla de probabilidad de corriente y cómo un rayo puede entrar a la línea por tres caminos distintos.',
  params: [
    { id: 'i', label: 'Corriente de cresta', unit: 'kA', min: 2, max: 200, step: 1, def: 31 },
    { id: 'didt', label: 'Pendiente di/dt', unit: 'kA/µs', min: 2, max: 120, step: 1, def: 30 },
    { id: 'gfd', label: 'Densidad de descargas', unit: 'rayos/km²·año', min: 0.5, max: 20, step: 0.5, def: 5 },
    { id: 'largo', label: 'Longitud de línea', unit: 'km', min: 10, max: 300, step: 5, def: 100 },
    { id: 'h', label: 'Altura media de la estructura', unit: 'm', min: 15, max: 80, step: 1, def: 40 },
  ],
  presets: [
    { id: 'mediana', label: 'Corriente mediana (31 kA)', values: { i: 31, didt: 30, gfd: 5, largo: 100, h: 40 } },
    { id: 'severa', label: 'Descarga severa (100 kA, 80 kA/µs)', values: { i: 100, didt: 80, gfd: 5, largo: 100, h: 40 } },
    { id: 'debil', label: 'Descarga débil (10 kA)', values: { i: 10, didt: 12, gfd: 5, largo: 100, h: 40 } },
  ],
  compute: (p) => {
    const median = 31;
    const sigmaLn = 0.65;
    const exceed = 1 - normalCdf(Math.log(p.i / median) / sigmaLn);
    const rc = 10 * Math.pow(p.i, 0.65);
    const anchoKm = (28 * Math.pow(p.h, 0.6)) / 1000;
    const flashes = p.gfd * anchoKm * p.largo;
    const lDidt = p.didt; // kV por µH
    return { exceed, rc, anchoKm, flashes, lDidt };
  },
  readings: (d, p) => [
    { label: 'Probabilidad de superar esta cresta', value: `${fmt(d.exceed * 100, 1)} %`, sub: 'distribución lognormal, mediana 31 kA', tone: d.exceed < 0.05 ? 'ok' : d.exceed < 0.2 ? 'warn' : 'bad' },
    { label: 'Distancia de choque r_c = 10·I^0,65', value: `${fmt(d.rc, 1)} m`, sub: 'modelo electrogeométrico' },
    { label: 'Caída inductiva por µH', value: `${fmt(p.didt, 0)} kV/µH`, sub: 'relevante en torre y conexiones' },
    { label: 'Descargas esperadas a la línea', value: `${fmt(d.flashes, 0)} /año`, sub: `${fmt(d.anchoKm * 1000, 0)} m de ancho de captura` },
    { label: 'Carga y descargas múltiples', value: 'no modeladas aquí', sub: 'varían entre eventos: usa distribuciones' },
  ],
  equations: (p) => [
    `P(I > ${fmt(p.i, 0)} kA) = 1 − Φ( ln(${fmt(p.i, 0)}/31) / 0,65 ) = ${fmt(1 - normalCdf(Math.log(p.i / 31) / 0.65), 3)}`,
    `r_c = 10·I^0,65 = 10 × ${fmt(p.i, 0)}^0,65 = ${fmt(10 * Math.pow(p.i, 0.65), 1)} m`,
    `N ≈ N_g · (28·h^0,6/1000) · L = ${fmt(p.gfd, 1)} × ${fmt((28 * Math.pow(p.h, 0.6)) / 1000, 3)} × ${fmt(p.largo, 0)} = ${fmt(p.gfd * (28 * Math.pow(p.h, 0.6) / 1000) * p.largo, 0)}/año`,
    `elevación inductiva ≈ L·di/dt: con 1 µH y ${fmt(p.didt, 0)} kA/µs → ${fmt(p.didt, 0)} kV`,
  ],
  checks: () => [
    { label: 'La corriente es una variable estadística', ok: true, detail: 'se describe con una distribución, no con un valor único' },
    { label: 'Se distingue falla de apantallamiento de flameo inverso', ok: true, detail: 'son mecanismos diferentes' },
    { label: 'La descarga cercana no requiere contacto', ok: true, detail: 'los campos inducen sobretensión' },
    { label: 'La corriente de cresta no resume el evento', ok: true, detail: 'faltan di/dt, carga y descargas sucesivas' },
  ],
  goals: [
    {
      id: 'g1',
      label: 'Elige una corriente con probabilidad de excedencia ≤ 5 %',
      test: (_p, d) => d.exceed <= 0.05,
      detail: (_p, d) => `${fmt(d.exceed * 100, 1)} % de excedencia`,
    },
    {
      id: 'g2',
      kind: 'exploracion',
      label: 'Lleva la distancia de choque a 60 m o más',
      test: (_p, d) => d.rc >= 60,
      detail: (_p, d) => `r_c = ${fmt(d.rc, 1)} m`,
    },
  ],
  learn: {
    phenomenon:
      'En una nube de tormenta se separan cargas; un líder ionizado avanza y, al conectarse, circula una corriente de retorno intensa. La descarga puede tener varios impulsos.',
    objective:
      'Explicar con qué magnitudes se describe un rayo, por qué se usan distribuciones, y diferenciar impacto directo en fase, impacto en guarda o torre y descarga cercana.',
    watch: [
      'Los tres caminos de la escena se iluminan en momentos distintos: solo uno atraviesa el aislamiento desde la estructura.',
      'La gráfica de excedencia muestra que bajar la corriente objetivo casi siempre es alcanzable: el diseño se hace por riesgo.',
      'El ancho de captura y la densidad de descargas producen las salidas esperadas por año, no un número exacto.',
    ],
    misconception:
      'Decir «el rayo es de 30 kA». No existe ese rayo: hay una distribución con mediana cercana a 31 kA, y el di/dt puede ser tanto o más exigente que la cresta.',
    model:
      'Lognormal con mediana 31 kA y σ_ln = 0,65, y r_c = 10·I^0,65 del modelo electrogeométrico citado en el material. Los coeficientes cambian entre escuelas y normas.',
  },
  sources: ['guion', 'slides', 'velasco', 'expo'],
  notes: ['La guía de ejercicios y el material de clase insisten: la corriente 8/20 µs del pararrayos es una onda de corriente, no la onda de tensión 1,2/50 µs.'],
  scene: ({ p, t }) => (
    <SceneCanvas
      draw={(ctx, w, h) => {
        backdrop(ctx, w, h);
        corner(ctx, 'Tormenta sobre la línea', 'tres mecanismos de afectación');
        const gy = h * 0.86;
        const tx = w * 0.5;
        const th = h * 0.56;
        // nube
        for (let k = 0; k < 5; k++) {
          circle(ctx, w * (0.22 + k * 0.14), h * 0.16 + Math.sin(k) * 6, 24 + (k % 3) * 8, { fill: 'rgba(80,105,140,0.28)', stroke: 'rgba(150,180,210,0.25)' });
        }
        line(ctx, 0, gy, w, gy, { color: 'rgba(168,137,106,0.6)', width: 2 });
        soilHatch(ctx, w, gy, h);
        tower(ctx, tx, gy, th, { crossarms: [{ y: th * 0.86, half: w * 0.13 }, { y: th * 0.66, half: w * 0.1 }] });
        const guardY = gy - th;
        const phaseY = gy - th * 0.86;
        line(ctx, tx - w * 0.13, guardY, tx + w * 0.13, guardY, { color: C.guard, width: 1.6 });
        // conductor de fase izquierdo con cadena
        line(ctx, tx - w * 0.19, phaseY, tx - w * 0.05, phaseY, { color: C.phase, width: 2 });
        line(ctx, tx + w * 0.05, phaseY, tx + w * 0.19, phaseY, { color: C.phase, width: 2 });
        // rayo sobre guarda
        const flick = 0.6 + 0.4 * Math.sin(t * 9);
        rayo(ctx, tx, h * 0.2, guardY, 7, C.violet, 2 + flick);
        glow(ctx, tx, guardY, 26, C.violet, 0.35 * flick);
        // corriente por la torre
        for (let i = 0; i < 4; i++) {
          const yy = guardY + ((gy - guardY) * (i + ((t * 2) % 1))) / 4;
          circle(ctx, tx + 3, yy, 2.4, { fill: C.violet, alpha: 0.8 });
        }
        // flameo inverso: arco torre -> fase
        if (Math.sin(t * 3) > 0.2) {
          ctx.save();
          ctx.strokeStyle = C.accent;
          ctx.lineWidth = 2;
          ctx.beginPath();
          for (let i = 0; i <= 8; i++) {
            const u = i / 8;
            const x = tx + (tx - w * 0.19 - tx) * u * 0.55;
            const y = guardY + (phaseY - guardY) * u;
            if (i === 0) ctx.moveTo(tx, guardY - 8);
            else ctx.lineTo(x + Math.sin(i * 2.4 + t * 6) * 3, y);
          }
          ctx.stroke();
          ctx.restore();
          badge(ctx, 'flameo inverso', tx + 10, (guardY + phaseY) / 2, C.accent);
        }
        // descarga cercana
        const nx = w * 0.18;
        rayo(ctx, nx, h * 0.22, gy - 8, 21, 'rgba(183,155,255,0.55)', 1.2);
        for (let k = 0; k < 3; k++) {
          const rr = 14 + ((t * 24 + k * 18) % 60);
          circle(ctx, nx, gy - 10, rr, { stroke: 'rgba(183,155,255,0.35)', width: 1 });
        }
        badge(ctx, 'descarga cercana', nx - 58, gy - 74, C.violet);
        // impacto directo en fase
        badge(ctx, 'impacto directo en fase', tx - w * 0.34, phaseY - 24, C.phase);
        arrow(ctx, tx - w * 0.2, phaseY - 34, tx - w * 0.18, phaseY - 6, C.phase, 1.4);
        text(ctx, `I = ${fmt(p.i, 0)} kA`, 14, h - 16, { size: 11, color: C.violet, mono: true });
        text(ctx, `r_c = ${fmt(10 * Math.pow(p.i, 0.65), 0)} m`, 14, h - 34, { size: 11, color: C.muted, mono: true });
      }}
      footer="Un mismo rayo puede producir impacto directo, flameo inverso o sobretensión inducida; el diseño debe cubrir los tres."
    />
  ),
  plot: ({ p }) => {
    const pts: [number, number][] = linspace(2, 200, 200).map((x) => [x, (1 - normalCdf(Math.log(x / 31) / 0.65)) * 100]);
    return (
      <Plot
        xDomain={[2, 200]}
        yDomain={[0, 100]}
        xLog
        xLabel="corriente de cresta (kA, escala logarítmica)"
        yLabel="P(I > valor) en %"
        series={[{ pts, color: C.violet, width: 2.2, area: true }]}
        refs={[{ at: 5, label: '5 % de excedencia', color: C.ok }]}
        markers={[{ x: p.i, y: 100 * (1 - normalCdf(Math.log(p.i / 31) / 0.65)), color: C.amber, label: `${fmt(p.i, 0)} kA` }]}
        caption="La curva es una distribución de excedencia: cuanto mayor la corriente, menos probable. El diseño elige el nivel de riesgo aceptable."
      />
    );
  },
};

function soilHatch(ctx: CanvasRenderingContext2D, w: number, gy: number, h: number) {
  ctx.save();
  ctx.strokeStyle = 'rgba(168,137,106,0.28)';
  ctx.lineWidth = 1;
  for (let x = -h; x < w; x += 16) {
    ctx.beginPath();
    ctx.moveTo(x, gy);
    ctx.lineTo(x + 18, gy + 14);
    ctx.stroke();
  }
  ctx.restore();
}

/* =============================== e05 =============================== */

const e05: Experiment = {
  id: 'e05',
  topicId: 4,
  title: 'Avalancha: por qué el aire aguanta hasta cierto campo',
  tagline: 'Ionización por choque, densidad del aire y separación mínima',
  why: 'Ver el mecanismo detrás de la rigidez dieléctrica: no es un umbral mágico, es una avalancha que necesita campo y camino.',
  params: [
    { id: 'e', label: 'Campo eléctrico medio', unit: 'kV/cm', min: 10, max: 80, step: 0.5, def: 30 },
    { id: 'd', label: 'Separación entre electrodos', unit: 'cm', min: 0.1, max: 20, step: 0.05, def: 1 },
    { id: 'delta', label: 'Densidad relativa del aire δ', unit: '', min: 0.6, max: 1, step: 0.01, def: 1 },
  ],
  presets: [
    { id: 'std', label: 'Aire estándar, 1 cm, 30 kV/cm', values: { e: 30, d: 1, delta: 1 } },
    { id: 'bogota', label: 'Bogotá: δ = 0,74', values: { e: 30, d: 1, delta: 0.74 } },
    { id: 'gap', label: 'Separación de 8 cm a 25 kV/cm', values: { e: 25, d: 8, delta: 1 } },
  ],
  compute: (p) => {
    // α/p depende de E/p: con p ∝ δ, α = A·(E − 25·δ). El umbral de streamer es α·d = ln(10⁸).
    const A = 3.7;
    const kStreamer = Math.log(1e8);
    const eff = p.e * p.delta;
    const alpha = A * (p.e - 25 * p.delta);
    const lnN = alpha * p.d;
    const n = Math.exp(Math.min(60, Math.max(-10, lnN)));
    const logN = lnN / Math.LN10;
    const breakdown = lnN >= kStreamer - 1e-9;
    // U₀ tal que α·d = ln(10⁸): U₀ = 25·δ·d + ln(10⁸)/A. Coincide con la simulación por construcción.
    const u0 = Math.max(0, 25 * p.delta * p.d + kStreamer / A);
    const uApplied = p.e * p.d;
    return { eff, alpha, lnN, n, logN, breakdown: breakdown ? 1 : 0, u0, uApplied };
  },
  readings: (d, p) => [
    { label: 'Campo efectivo E·δ', value: `${fmt(d.eff, 1)} kV/cm`, sub: `E = ${fmt(p.e, 1)} kV/cm · δ = ${fmt(p.delta, 2)}` },
    { label: 'Coeficiente neto α−η', value: `${fmt(d.alpha, 2)} cm⁻¹`, sub: 'ionización menos adherencia; α = 3,7·(E − 25·δ)' },
    { label: 'Electrones al final', value: `10^${fmt(d.logN, 1)}`, sub: 'criterio de streamer: 10⁸' },
    { label: 'Rigidez de la separación', value: `${fmt(d.u0, 1)} kV`, sub: 'U₀ = 25·δ·d + ln(10⁸)/3,7', tone: d.breakdown ? 'bad' : 'ok' },
    { label: 'Tensión aplicada', value: `${fmt(d.uApplied, 1)} kV`, sub: d.breakdown ? 'supera la rigidez: descarga' : 'sostiene', tone: d.breakdown ? 'bad' : 'ok' },
  ],
  equations: (p, d) => [
    `n = n₀·e^((α−η)·d) → log₁₀(n/n₀) = ${fmt(d.logN, 2)}`,
    `α−η ≈ 3,7·(E − 25·δ) = 3,7 × (${fmt(p.e, 1)} − ${fmt(25 * p.delta, 1)}) = ${fmt(d.alpha, 2)} cm⁻¹`,
    `criterio de streamer: n ≥ 10⁸ → ${d.breakdown ? 'se forma el canal' : 'no se alcanza el canal'}`,
    `rigidez de la simulación: U₀ = 25·δ·d + ln(10⁸)/3,7 = ${fmt(25 * p.delta * p.d, 1)} + ${fmt(Math.log(1e8) / 3.7, 1)} = ${fmt(d.u0, 1)} kV (d en cm)`,
  ],
  checks: (_p, d) => [
    { label: 'La avalancha exige α > η', ok: d.alpha > 0, detail: `α−η = ${fmt(d.alpha, 2)} cm⁻¹` },
    { label: 'Se alcanza el criterio de 10⁸ electrones', ok: d.breakdown === 1, detail: `log₁₀ n = ${fmt(d.logN, 1)}` },
    { label: 'Mayor densidad implica mayor rigidez', ok: true, detail: 'a igual E, menos densidad reduce el campo efectivo' },
  ],
  goals: [
    {
      id: 'g1',
      kind: 'exploracion',
      label: 'En aire estándar (δ = 1), encuentra la separación mínima que sostiene 200 kV',
      test: (p, d) => Math.abs(p.delta - 1) < 0.02 && d.u0 >= 200 && d.u0 <= 212,
      detail: (p, d) => `U₀ = ${fmt(d.u0, 1)} kV con d = ${fmt(p.d, 2)} cm`,
    },
    {
      id: 'g2',
      label: 'Con δ = 0,74 (Bogotá), aumenta la separación hasta volver a sostener 200 kV',
      test: (p, d) => Math.abs(p.delta - 0.74) < 0.02 && d.u0 >= 200 && d.u0 <= 215,
      detail: (_p, d) => `U₀ = ${fmt(d.u0, 1)} kV`,
    },
  ],
  learn: {
    phenomenon:
      'Cuando el campo acelera electrones libres, estos ionizan moléculas por choque y el número de electrones crece exponencialmente. Si α supera η y la avalancha llega a ~10⁸ electrones, aparece un streamer y luego la descarga.',
    objective:
      'Explicar por qué la rigidez depende del campo, de la separación y de la densidad del aire, y por qué dos electrodos a la misma distancia pueden romperse a tensiones distintas.',
    watch: [
      'La nube de electrones crece mientras el campo efectivo supere el umbral; al alcanzar 10⁸ se dibuja el canal.',
      'Baja δ con el mismo campo: la avalancha se apaga, igual que en la montaña.',
      'La gráfica compara U₀ contra separación para dos densidades: la curva de Bogotá queda por encima.',
    ],
    misconception:
      'Pensar que el aire «rompe a 30 kV/cm» siempre. Ese valor es de referencia en campo uniforme y aire estándar; con puntas, distancias cortas o baja densidad cambia.',
    model:
      'Modelo exponencial con α−η lineal en el campo, calibrado con α = 3,7·(E − 25·δ) para dar ~30 kV/cm a 1 cm en aire estándar. No reproduce el efecto de puntas ni la polaridad: el campo es uniforme y el coeficiente constante.',
  },
  sources: ['guion', 'slides', 'velasco', 'corona'],
  scene: ({ p, t }) => {
    const eff = p.e * p.delta;
    const alpha = 3.68 * (eff - 25 * p.delta);
    const lnN = alpha * p.d;
    const on = lnN >= Math.log(1e8);
    return (
      <SceneCanvas
        draw={(ctx, w, h) => {
          backdrop(ctx, w, h);
          corner(ctx, 'Cámara de ensayo', 'avalancha entre electrodos');
          const x1 = w * 0.22;
          const x2 = w * 0.78;
          const cy = h * 0.52;
          const gap = x2 - x1;
          line(ctx, x1 - 26, cy - 26, x1, cy - 26, { color: C.muted, width: 3 });
          line(ctx, x1 - 26, cy + 26, x1, cy + 26, { color: C.muted, width: 3 });
          line(ctx, x2, cy - 26, x2 + 26, cy - 26, { color: C.muted, width: 3 });
          line(ctx, x2, cy + 26, x2 + 26, cy + 26, { color: C.muted, width: 3 });
          line(ctx, x1, cy - 30, x1, cy + 30, { color: C.steel, width: 4 });
          line(ctx, x2, cy - 30, x2, cy + 30, { color: C.steel, width: 4 });
          for (const [x, s] of [
            [x1, 1],
            [x2, -1],
          ] as const) {
            circle(ctx, x + s * 6, cy - 18, 3, { fill: C.bad });
            circle(ctx, x + s * 6, cy + 18, 3, { fill: C.bad });
          }
          dimension(ctx, x1, cy + 46, x2, cy + 46, `${fmt(p.d, 2)} cm`, C.amber);
          const count = 60;
          for (let i = 0; i < count; i++) {
            const u = (i + 0.5) / count;
            const x = x1 + u * gap;
            const grow = Math.min(1, Math.log10(Math.max(1, Math.exp(Math.min(60, alpha * p.d * u)))) / 8);
            const spread = 10 + 22 * grow;
            const y = cy + Math.sin(i * 2.399 + t * 2) * spread;
            circle(ctx, x, y, 1.2 + 1.8 * grow, { fill: on ? C.bad : C.phase, alpha: 0.25 + 0.6 * grow });
          }
          if (on) {
            ctx.save();
            ctx.strokeStyle = C.accent;
            ctx.lineWidth = 2.4;
            ctx.shadowColor = C.accent;
            ctx.shadowBlur = 14;
            ctx.beginPath();
            for (let i = 0; i <= 12; i++) {
              const u = i / 12;
              const x = x1 + u * gap;
              const y = cy + Math.sin(u * 20 + t * 8) * 5;
              if (i === 0) ctx.moveTo(x, y);
              else ctx.lineTo(x, y);
            }
            ctx.stroke();
            ctx.restore();
            badge(ctx, 'DESCARGA', x2 - 34, cy - h * 0.3, C.accent);
          } else {
            badge(ctx, 'sin canal', x2 - 34, cy - h * 0.3, C.phase);
          }
          text(ctx, `E = ${fmt(p.e, 1)} kV/cm · δ = ${fmt(p.delta, 2)}`, 14, h - 32, { size: 10.5, color: C.muted, mono: true });
          text(ctx, `10^${fmt(Math.log10(Math.max(1, Math.exp(Math.min(60, lnN)))), 1)} electrones`, 14, h - 14, { size: 10.5, color: on ? C.bad : C.accent, mono: true });
          badge(ctx, on ? 'α > η y n ≥ 10⁸' : 'α > 0 pero n < 10⁸', w * 0.5 - 60, 22, on ? C.bad : C.ok);
        }}
        footer="Cada punto es un electrón; el tamaño de la nube crece con la distancia recorrida. La descarga aparece solo al alcanzar el criterio."
      />
    );
  },
  plot: ({ p }) => {
    const curve = (delta: number, color: string, dash?: string) => ({
      pts: linspace(0.2, 20, 160).map((d) => [d, 25 * delta * d + 5] as [number, number]),
      color,
      dash,
      width: 2,
    });
    return (
      <Plot
        xDomain={[0, 20]}
        yDomain={[0, 400]}
        xLabel="separación entre electrodos (cm)"
        yLabel="tensión de ruptura estimada (kV)"
        series={[curve(1, C.phase), curve(0.74, C.amber, '5 4'), { pts: [[0, 200], [20, 200]], color: 'rgba(255,107,107,0.5)', dash: '3 4', width: 1.2 }]}
        markers={[{ x: p.d, y: Math.max(0, 25 * p.delta * p.d + 5), color: C.accent, label: 'tu caso' }]}
        caption="Misma separación, menos densidad: la curva de Bogotá (δ = 0,74) exige más centímetros para la misma tensión."
      />
    );
  },
};

/* =============================== e06 =============================== */

const e06: Experiment = {
  id: 'e06',
  topicId: 4,
  title: 'U₅₀ no es una garantía: probabilidad de disrupción',
  tagline: 'Media, dispersión y riesgo aceptable',
  why: 'Comprender qué significa U50, cómo se obtiene una tensión para cierta probabilidad y por qué el diseño trabaja con riesgo.',
  params: [
    { id: 'u50', label: 'Tensión al 50 % (U₅₀ o CFO)', unit: 'kV', min: 400, max: 1600, step: 5, def: 700 },
    { id: 'sigma', label: 'Desviación estándar σ', unit: '% de U₅₀', min: 2, max: 15, step: 0.5, def: 6 },
    { id: 'ptarget', label: 'Probabilidad objetivo', unit: '%', min: 1, max: 50, step: 0.5, def: 10 },
    { id: 'uapp', label: 'Tensión aplicada', unit: 'kV', min: 300, max: 1800, step: 5, def: 650 },
  ],
  presets: [
    { id: 'curso', label: 'Ejemplo del curso (700 kV, 6 %, 10 %)', values: { u50: 700, sigma: 6, ptarget: 10, uapp: 646 } },
    { id: 'maniobra', label: 'Maniobra: σ = 6 % y 1 % de riesgo', values: { u50: 1200, sigma: 6, ptarget: 1, uapp: 1100 } },
    { id: 'rayo', label: 'Rayo: dispersión menor (σ = 3 %)', values: { u50: 700, sigma: 3, ptarget: 10, uapp: 646 } },
  ],
  compute: (p) => {
    const sigma = (p.sigma / 100) * p.u50;
    const z = normalQuantile(p.ptarget / 100);
    const up = p.u50 + z * sigma;
    const pApplied = normalCdf(p.uapp, p.u50, sigma);
    return { sigma, z, up, pApplied, p50: 0.5, margin: (p.u50 - p.uapp) / Math.max(1, sigma) };
  },
  readings: (d, p) => [
    { label: 'Desviación σ en kV', value: `${fmt(d.sigma, 1)} kV`, sub: `${fmt(p.sigma, 1)} % de ${fmt(p.u50, 0)} kV` },
    { label: 'Cuantil z objetivo', value: fmt(d.z, 3), sub: `para P = ${fmt(p.ptarget, 1)} %` },
    { label: 'Tensión para esa probabilidad', value: `${fmt(d.up, 1)} kV`, sub: 'de cresta, bajo esta distribución', tone: 'warn' },
    { label: 'Probabilidad a la tensión aplicada', value: `${fmt(d.pApplied * 100, 2)} %`, sub: `${fmt(p.uapp, 0)} kV`, tone: d.pApplied < 0.1 ? 'ok' : d.pApplied < 0.5 ? 'warn' : 'bad' },
    { label: 'Distancia a la media', value: `${fmt(d.margin, 2)} σ`, sub: 'cuántas dispersiones separan el esfuerzo de U₅₀' },
  ],
  equations: (p, d) => [
    `σ = ${fmt(p.sigma, 1)} % × ${fmt(p.u50, 0)} = ${fmt(d.sigma, 1)} kV`,
    `U_p = U₅₀ + z_p·σ = ${fmt(p.u50, 0)} + (${fmt(d.z, 3)}) × ${fmt(d.sigma, 1)} = ${fmt(d.up, 1)} kV`,
    `P(U ≤ ${fmt(p.uapp, 0)} kV) = Φ(( ${fmt(p.uapp, 0)} − ${fmt(p.u50, 0)} ) / ${fmt(d.sigma, 1)}) = ${fmt(d.pApplied * 100, 2)} %`,
    'U₅₀ corresponde al 50 %, no al 100 %. El 10 % de este ejemplo es un supuesto didáctico, no un criterio universal.',
  ],
  checks: (p, d) => [
    { label: 'La probabilidad se declara junto con la onda y la polaridad', ok: true, detail: 'σ depende del tipo de esfuerzo' },
    { label: 'Se distingue U₅₀ de tensión soportada garantizada', ok: p.uapp < p.u50, detail: `P falla a ${fmt(p.uapp, 0)} kV = ${fmt(d.pApplied * 100, 2)} %` },
    { label: 'El criterio no es universal', ok: true, detail: 'el riesgo admisible depende del proyecto' },
  ],
  goals: [
    {
      id: 'g1',
      label: 'Reproduce el ejemplo: U₅₀ = 700 kV, σ = 6 %, P = 10 % → 646,2 kV',
      test: (_p, d) => Math.abs(d.up - 646.17) <= 1.5,
      detail: (_p, d) => `U₁₀ = ${fmt(d.up, 1)} kV`,
    },
    {
      id: 'g2',
      kind: 'exploracion',
      label: 'Con U₅₀ = 700 kV y σ = 6 %, baja la tensión aplicada hasta un riesgo ≤ 1 %',
      test: (p, d) => Math.abs(p.u50 - 700) < 1 && Math.abs(p.sigma - 6) < 0.1 && d.pApplied <= 0.01,
      detail: (p, d) => `${fmt(d.pApplied * 100, 2)} % a ${fmt(p.uapp, 0)} kV`,
    },
  ],
  learn: {
    phenomenon:
      'Al repetir ensayos de disrupción sobre un aislamiento autorrecuperable, no siempre se rompe a la misma tensión. La curva de probabilidad relaciona amplitud con proporción de descargas.',
    objective:
      'Interpretar U₅₀/CFO, usar la dispersión para calcular una tensión con cierta probabilidad y explicar por qué el diseño admite un riesgo pequeño.',
    watch: [
      'La escena lanza ensayos y marca cuántos fallan: el porcentaje se acerca a la probabilidad calculada.',
      'La curva acumulada muestra la cola izquierda: bajar la tensión reduce el riesgo muy rápido.',
      'El marcador de tu tensión aplicada se mueve sobre la curva al cambiar σ.',
    ],
    misconception:
      'Decir «el aislamiento soporta U₅₀». U₅₀ significa que la mitad de los impulsos lo romperían; para soportar con alta probabilidad hay que quedar por debajo.',
    model:
      'Normal con σ constante en porcentaje. Un estudio completo combina la distribución del esfuerzo con la de la resistencia; σ = 6 % es el valor sugerido para maniobra en el material.',
  },
  sources: ['guion', 'slides', 'cardona', 'velasco'],
  scene: ({ p, t }) => {
    const sigma = (p.sigma / 100) * p.u50;
    const prob = normalCdf(p.uapp, p.u50, sigma);
    const trials = 40;
    return (
      <SceneCanvas
        draw={(ctx, w, h) => {
          backdrop(ctx, w, h);
          corner(ctx, 'Serie de ensayos de impulso', `${trials} impulsos · P = ${fmt(prob * 100, 1)} %`);
          const gx = w * 0.5;
          const gy = h * 0.86;
          const gap = h * 0.36;
          line(ctx, gx - 40, gy - gap, gx + 40, gy - gap, { color: C.steel, width: 5 });
          line(ctx, gx - 40, gy, gx + 40, gy, { color: C.steel, width: 5 });
          for (let i = 0; i < 40; i++) {
            const ang = (i / 40) * Math.PI;
            const x = gx + Math.cos(ang) * 46;
            const y = gy - gap * 0.5 - Math.sin(ang) * 10;
            circle(ctx, x, y, 1.6, { fill: 'rgba(127,200,255,0.5)' });
          }
          const seed = (n: number) => {
            const v = Math.sin(n * 12.9898 + 78.233) * 43758.5453;
            return v - Math.floor(v);
          };
          const idx = Math.floor(t * 2.4) % trials;
          let fired = 0;
          for (let i = 0; i <= idx; i++) if (seed(i) < prob) fired++;
          for (let i = 0; i < trials; i++) {
            const col = i <= idx ? (seed(i) < prob ? C.bad : C.ok) : 'rgba(140,170,185,0.25)';
            circle(ctx, 18 + (i % 20) * 9, h - 26 - Math.floor(i / 20) * 12, 2.6, { fill: col });
          }
          if (seed(idx) < prob) {
            ctx.save();
            ctx.strokeStyle = C.accent;
            ctx.lineWidth = 2.4;
            ctx.shadowColor = C.accent;
            ctx.shadowBlur = 12;
            ctx.beginPath();
            for (let i = 0; i <= 10; i++) {
              const u = i / 10;
              ctx.lineTo(gx - 20 + u * 40 + Math.sin(u * 18 + t * 9) * 4, gy - gap + u * gap);
            }
            ctx.stroke();
            ctx.restore();
            badge(ctx, 'DISRUPCIÓN', gx + 46, gy - gap * 0.5, C.bad);
          }
          text(ctx, `U₅₀ = ${fmt(p.u50, 0)} kV · σ = ${fmt(sigma, 1)} kV`, 14, h - 62, { size: 10.5, color: C.muted, mono: true });
          text(ctx, `aplicada ${fmt(p.uapp, 0)} kV → ${fmt(prob * 100, 1)} %`, 14, h - 44, { size: 10.5, color: C.amber, mono: true });
          text(ctx, `fallas: ${fired} de ${idx + 1}`, w - 16, h - 16, { size: 10.5, color: C.muted, align: 'right', mono: true });
        }}
        footer="Cada punto es un impulso: verde sostiene, rojo rompe. La proporción converge a la probabilidad del modelo."
      />
    );
  },
  plot: ({ p }) => {
    const sigma = (p.sigma / 100) * p.u50;
    const pts: [number, number][] = linspace(p.u50 - 4 * sigma, p.u50 + 4 * sigma, 220).map((x) => [x, normalCdf(x, p.u50, sigma) * 100]);
    return (
      <Plot
        xDomain={[p.u50 - 4 * sigma, p.u50 + 4 * sigma]}
        yDomain={[0, 100]}
        xLabel="tensión de cresta aplicada (kV)"
        yLabel="probabilidad de disrupción (%)"
        series={[{ pts, color: C.amber, width: 2.4, area: true }]}
        refs={[
          { at: 50, label: 'U₅₀ = 50 %', color: C.bad },
          { at: 10, label: '10 %', color: C.ok, dash: '2 4' },
        ]}
        markers={[{ x: p.uapp, y: normalCdf(p.uapp, p.u50, sigma) * 100, color: C.accent, label: 'aplicada' }]}
        caption={`σ = ${fmt(sigma, 1)} kV. La forma de la curva es una normal acumulada: la probabilidad depende de cuántas σ separan el esfuerzo de U₅₀.`}
      />
    );
  },
};

export const lightningExperiments: Experiment[] = [e04, e05, e06];
