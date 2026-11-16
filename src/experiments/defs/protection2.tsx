import {
  airDensity,
  bundleEquivalentRadius,
  clamp,
  coronaInception,
  correctTo20,
  cfoFromInsulators,
  cfoRequired,
  creepageRequired,
  dar,
  effectiveProtection,
  fmt,
  insulationResistance,
  insulatorsFromCfo,
  peekLoss,
  piIndex,
  protectionMargin,
  tovCapability,
  tovEquivalent,
  ucMin,
} from '../../lib/num';
import { C, backdrop, badge, circle, dimension, glow, line, soil, text, tower } from '../../lib/draw';
import { Plot, SceneCanvas } from '../../components/ui';
import type { Experiment, Params } from '../types';
import { corner } from '../common';

/* =============================== e16 =============================== */

const e16: Experiment = {
  id: 'e16',
  topicId: 11,
  title: 'Pararrayos: cinco verificaciones a la vez',
  tagline: 'Uc, TOV, tensión residual, distancia y margen',
  why: 'Seleccionar un descargador como se hace en un proyecto: varias condiciones simultáneas, no una sola cifra.',
  params: [
    { id: 'um', label: 'Tensión máxima del sistema Uₘ', unit: 'kV', min: 72.5, max: 500, step: 0.5, def: 245 },
    { id: 'uc', label: 'Tensión continua del descargador U_c', unit: 'kV eficaces', min: 60, max: 300, step: 1, def: 150 },
    { id: 'ur', label: 'Tensión asignada U_r', unit: 'kV eficaces', min: 60, max: 360, step: 1, def: 180 },
    { id: 'tovPu', label: 'Sobretensión temporal (falla)', unit: 'p.u. de U_f', min: 1, max: 1.8, step: 0.01, def: 1.25 },
    { id: 'tovDur', label: 'Duración de la TOV', unit: 's', min: 0.1, max: 10, step: 0.1, def: 1 },
    { id: 'cap1s', label: 'Capacidad TOV del catálogo a 1 s', unit: 'kV eficaces', min: 100, max: 350, step: 1, def: 195 },
    { id: 'ures', label: 'Tensión residual U_res (8/20 µs)', unit: 'kV cresta', min: 300, max: 1200, step: 5, def: 600 },
    { id: 'd', label: 'Distancia descargador–equipo', unit: 'm', min: 0, max: 30, step: 0.5, def: 6 },
    { id: 'lc', label: 'Inductancia de conexión', unit: 'µH/m', min: 0, max: 2, step: 0.05, def: 1 },
    { id: 'didt', label: 'Pendiente de la corriente', unit: 'kA/µs', min: 2, max: 30, step: 0.5, def: 10 },
    { id: 'bil', label: 'Nivel soportado del equipo (BIL)', unit: 'kV cresta', min: 550, max: 1800, step: 10, def: 1050 },
  ],
  presets: [
    { id: 'curso', label: 'Ejemplo del curso (U_res 600, +60 kV)', values: { um: 245, uc: 150, ur: 180, tovPu: 1.25, tovDur: 1, cap1s: 195, ures: 600, d: 6, lc: 1, didt: 10, bil: 1050 } },
    { id: 'cerca', label: 'Descargador a 1 m del equipo', values: { um: 245, uc: 150, ur: 180, tovPu: 1.25, tovDur: 1, cap1s: 195, ures: 600, d: 1, lc: 1, didt: 10, bil: 1050 } },
    { id: 'tov10', label: 'TOV de 10 s (más exigente)', values: { um: 245, uc: 150, ur: 180, tovPu: 1.25, tovDur: 10, cap1s: 195, ures: 600, d: 6, lc: 1, didt: 10, bil: 1050 } },
    { id: 'bajo', label: 'Descargador con U_res alta (750 kV)', values: { um: 245, uc: 150, ur: 180, tovPu: 1.25, tovDur: 1, cap1s: 195, ures: 750, d: 6, lc: 1, didt: 10, bil: 1050 } },
  ],
  compute: (p) => {
    const uf = p.um / Math.sqrt(3);
    const ucReq = ucMin(p.um, true);
    const uTov = p.tovPu * uf;
    const ueq = tovEquivalent(uTov, p.tovDur);
    const capAtDur = tovCapability(p.cap1s, p.tovDur);
    const urMin = 1.05 * ueq;
    const uEff = effectiveProtection(p.ures, p.d, p.lc, p.didt);
    const margin = protectionMargin(p.bil, uEff);
    const okUc = p.uc >= ucReq ? 1 : 0;
    const okTov = ueq <= capAtDur ? 1 : 0;
    const okUr = p.ur >= urMin ? 1 : 0;
    const okMargin = margin >= 20 ? 1 : 0;
    return { uf, ucReq, uTov, ueq, capAtDur, urMin, uEff, margin, okUc, okTov, okUr, okMargin, all: okUc * okTov * okUr * okMargin };
  },
  readings: (d, p) => [
    { label: 'Tensión continua mínima exigida', value: `${fmt(d.ucReq, 1)} kV eficaces`, sub: `1,05·Uₘ/√3 = 1,05·${fmt(d.uf, 1)}`, tone: d.okUc ? 'ok' : 'bad' },
    { label: 'TOV equivalente de 10 s', value: `${fmt(d.ueq, 1)} kV eficaces`, sub: `${fmt(p.tovPu, 2)}·U_f = ${fmt(d.uTov, 1)} kV durante ${fmt(p.tovDur, 1)} s`, tone: d.okTov ? 'ok' : 'bad' },
    { label: 'Capacidad del catálogo a esa duración', value: `${fmt(d.capAtDur, 1)} kV eficaces`, sub: 'curva TOV, no un valor único', tone: d.okTov ? 'ok' : 'bad' },
    { label: 'U_r mínima requerida', value: `${fmt(d.urMin, 1)} kV eficaces`, sub: 'con 5 % de margen', tone: d.okUr ? 'ok' : 'bad' },
    { label: 'Tensión en el equipo protegido', value: `${fmt(d.uEff, 1)} kV cresta`, sub: `U_res + L_c·d·di/dt = ${fmt(p.ures, 0)} + ${fmt(p.lc * p.d * p.didt, 0)}` },
    { label: 'Margen de protección', value: `${fmt(d.margin, 1)} %`, sub: `(${fmt(p.bil, 0)}/${fmt(d.uEff, 0)} − 1)·100`, tone: d.okMargin ? 'ok' : 'bad' },
  ],
  equations: (p, d) => [
    `U_c ≥ 1,05·Uₘ/√3 = 1,05 × ${fmt(d.uf, 1)} = ${fmt(d.ucReq, 1)} kV`,
    `U_TOV = ${fmt(p.tovPu, 2)} × ${fmt(d.uf, 1)} = ${fmt(d.uTov, 1)} kV · U_eq(10 s) = U_TOV·(t/10)^0,02 = ${fmt(d.ueq, 1)} kV`,
    `U_r ≥ 1,05·U_eq = ${fmt(d.urMin, 1)} kV · capacidad(t) = ${fmt(p.cap1s, 0)}·(1/t)^0,02 = ${fmt(d.capAtDur, 1)} kV`,
    `U_equipo = U_res + L_c·d·di/dt = ${fmt(p.ures, 0)} + ${fmt(p.lc, 2)}×${fmt(p.d, 1)}×${fmt(p.didt, 1)} = ${fmt(d.uEff, 1)} kV`,
    `M = (U_soportada/U_equipo − 1)·100 = (${fmt(p.bil, 0)}/${fmt(d.uEff, 0)} − 1)·100 = ${fmt(d.margin, 1)} %`,
  ],
  checks: (_p, d) => [
    { label: 'U_c suficiente para la tensión continua', ok: d.okUc === 1, detail: `${fmt(d.ucReq, 1)} kV exigidos` },
    { label: 'La TOV equivalente cabe en la capacidad del catálogo', ok: d.okTov === 1, detail: `${fmt(d.ueq, 1)} ≤ ${fmt(d.capAtDur, 1)} kV` },
    { label: 'La tensión asignada cubre la TOV con margen', ok: d.okUr === 1, detail: `${fmt(d.urMin, 1)} kV mínimos` },
    { label: 'Margen de protección ≥ 20 % (criterio del ejemplo)', ok: d.okMargin === 1, detail: `${fmt(d.margin, 1)} %` },
    { label: 'Se comparan crestas con crestas', ok: true, detail: 'impulso tipo rayo' },
  ],
  goals: [
    {
      id: 'g1',
      kind: 'exploracion',
      label: 'Reproduce el ejemplo del curso: margen ≈ 59,1 % con U_res 600 kV y 60 kV de conexiones',
      test: (_p, d) => Math.abs(d.margin - 59.09) < 0.4 && d.all === 1,
      detail: (_p, d) => `M = ${fmt(d.margin, 1)} % · U_equipo = ${fmt(d.uEff, 0)} kV`,
    },
    {
      id: 'g2',
      label: 'Acerca el descargador a 1 m y comprueba que el margen supera el 70 %',
      test: (p, d) => p.d <= 1.01 && d.margin >= 70 && d.all === 1,
      detail: (p, d) => `d = ${fmt(p.d, 1)} m → M = ${fmt(d.margin, 1)} %`,
    },
  ],
  learn: {
    phenomenon:
      'Un descargador de ZnO conduce muy poco a tensión normal y limita la tensión durante un transitorio, pero esa tensión residual no es la que ve el equipo si el descargador está lejos.',
    objective:
      'Verificar las condiciones de selección —Uc, TOV, Ur, energía, tensión residual y margen— y ver por qué la ubicación y las conexiones cambian el nivel de protección.',
    watch: [
      'La escena mueve la tensión del equipo al alejar el descargador: la caída inductiva se suma a U_res.',
      'La gráfica de capacidad TOV: tu punto de operación debe quedar por debajo de la curva.',
      'Al cambiar la duración de la TOV, el punto se mueve sobre la curva: la capacidad no es un solo número.',
    ],
    misconception:
      'Comparar la tensión residual con el BIL ignorando las conexiones, o creer que la corriente nominal de descarga resume toda la capacidad energética.',
    model:
      'TOV equivalente según UNE/IEC 60099-5 con m_d = 0,02 y suma aditiva conservadora de la caída inductiva. La evaluación real requiere curvas del fabricante y ondas viajeras.',
  },
  sources: ['guion', 'slides', 'pararrayos', 'velasco', 'iec60099'],
  scene: ({ p, d, t }) => (
    <SceneCanvas
      draw={(ctx, w, h) => {
        backdrop(ctx, w, h);
        corner(ctx, 'Descargador y equipo protegido', `M = ${fmt(d.margin, 0)} %`);
        const gy = h * 0.84;
        line(ctx, 0, gy, w, gy, { color: 'rgba(160,210,225,0.25)' });
        // fase superior
        const fy = h * 0.2;
        line(ctx, w * 0.08, fy, w * 0.94, fy, { color: C.phase, width: 2.4 });
        text(ctx, `Uₘ = ${fmt(p.um, 0)} kV`, w * 0.08, fy - 14, { size: 10.5, color: C.phase, mono: true });
        // descargador
        const ax = w * 0.34;
        for (let i = 0; i < 6; i++) {
          const y = fy + 14 + i * 14;
          ctx.save();
          ctx.fillStyle = i % 2 ? 'rgba(183,155,255,0.55)' : 'rgba(220,235,245,0.35)';
          ctx.strokeStyle = 'rgba(220,235,245,0.5)';
          ctx.beginPath();
          ctx.roundRect(ax - 12, y, 24, 12, 3);
          ctx.fill();
          ctx.stroke();
          ctx.restore();
        }
        line(ctx, ax, fy, ax, fy + 10, { color: C.steel });
        line(ctx, ax, fy + 96, ax, gy, { color: C.steel });
        badge(ctx, 'ZnO', ax - 16, fy + 110, C.violet);
        // equipo (transformador)
        const ex = ax + 24 + p.d * (w * 0.02);
        const ey = gy - h * 0.26;
        ctx.save();
        ctx.fillStyle = 'rgba(100,140,160,0.3)';
        ctx.strokeStyle = C.steel;
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.roundRect(ex, ey, w * 0.16, h * 0.26, 6);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        line(ctx, ex + w * 0.08, ey, ex + w * 0.08, fy, { color: C.phase, width: 1.6 });
        for (let i = 0; i < 3; i++) {
          ctx.save();
          ctx.strokeStyle = 'rgba(160,210,225,0.5)';
          ctx.beginPath();
          ctx.arc(ex + w * 0.03 + i * 12, ey + h * 0.1, 8, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        }
        text(ctx, 'equipo', ex + w * 0.08, ey - 10, { size: 10, color: C.muted, align: 'center' });
        text(ctx, `BIL ${fmt(p.bil, 0)} kV`, ex + w * 0.08, ey + h * 0.2, { size: 10, color: C.amber, align: 'center', mono: true });
        dimension(ctx, ax, fy - 26, ex + w * 0.08, fy - 26, `d = ${fmt(p.d, 1)} m`, C.amber);
        // onda de tensión en el equipo
        const waveY = h * 0.1;
        const ww = w * 0.3;
        const wx = w * 0.63;
        line(ctx, wx, waveY + 24, wx + ww, waveY + 24, { color: 'rgba(160,210,225,0.25)' });
        ctx.save();
        ctx.strokeStyle = d.okMargin ? C.accent : C.bad;
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let i = 0; i <= 120; i++) {
          const u = i / 120;
          const x = wx + u * ww;
          const v = Math.exp(-u * 4) * (1 - Math.exp(-u * 30));
          const y = waveY + 24 - v * 22 * clamp(d.uEff / Math.max(1, p.bil), 0.2, 1.2);
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
        ctx.restore();
        text(ctx, `U_equipo = ${fmt(d.uEff, 0)} kV`, wx, waveY + 40, { size: 10, color: d.okMargin ? C.accent : C.bad, mono: true });
        const pulse = (t % 2) / 2;
        circle(ctx, ax, fy + 14 + pulse * 80, 3, { fill: C.violet, alpha: 0.8 });
        text(ctx, `U_c ${fmt(p.uc, 0)} · U_r ${fmt(p.ur, 0)} kV`, 14, h - 16, { size: 10.5, color: C.muted, mono: true });
      }}
      footer="La tensión residual se mide en los bornes del descargador; el equipo ve además la caída inductiva de las conexiones."
    />
  ),
  plot: ({ p, d }) => {
    const pts: [number, number][] = [0.05, 0.1, 0.2, 0.5, 1, 2, 5, 10].map((t) => [t, tovCapability(p.cap1s, t)]);
    return (
      <Plot
        xDomain={[0.05, 10]}
        yDomain={[100, 320]}
        xLog
        xLabel="duración de la sobretensión (s, escala logarítmica)"
        yLabel="tensión soportada TOV (kV eficaces)"
        series={[{ pts, color: C.violet, width: 2.2 }]}
        markers={[
          { x: p.tovDur, y: d.ueq, color: d.okTov ? C.accent : C.bad, label: 'TOV aplicada' },
          { x: p.tovDur, y: d.capAtDur, color: C.amber, label: 'capacidad', shape: 'ring' },
        ]}
        caption="La capacidad TOV baja al aumentar la duración. La comparación debe hacerse a la misma duración, no con el valor de 1 s."
      />
    );
  },
};

/* =============================== e17 =============================== */

const e17: Experiment = {
  id: 'e17',
  topicId: 12,
  title: 'Corona: cuando el aire se ioniza junto al conductor',
  tagline: 'Incepción, gradiente superficial y pérdidas de Peek',
  why: 'Ver de dónde sale la tensión de incepción y por qué el radio y el haz de conductores cambian las pérdidas.',
  params: [
    { id: 'u', label: 'Tensión fase–tierra', unit: 'kV eficaces', min: 40, max: 450, step: 2, def: 150 },
    { id: 'r', label: 'Radio del subconductor', unit: 'cm', min: 0.3, max: 3, step: 0.05, def: 1.5 },
    { id: 'n', label: 'Subconductores por fase', unit: '', min: 1, max: 4, step: 1, def: 1 },
    { id: 'sep', label: 'Separación en el haz', unit: 'cm', min: 20, max: 100, step: 5, def: 40 },
    { id: 's', label: 'Separación equivalente entre fases', unit: 'cm', min: 200, max: 1200, step: 10, def: 600 },
    { id: 'delta', label: 'Densidad relativa del aire δ', unit: '', min: 0.6, max: 1, step: 0.01, def: 0.9 },
    { id: 'm', label: 'Factor superficial del conductor m', unit: '', min: 0.6, max: 1, step: 0.01, def: 1 },
    { id: 'f', label: 'Frecuencia', unit: 'Hz', min: 50, max: 60, step: 10, def: 60 },
    { id: 'mode', label: 'Tensión de incepción U₀', unit: '', min: 0, max: 1, step: 1, def: 0, options: [{ value: 0, label: 'dato del ejemplo (120 kV)' }, { value: 1, label: 'calculada con el gradiente' }] },
    { id: 'u0in', label: 'U₀ de entrada (modo dato)', unit: 'kV eficaces', min: 60, max: 250, step: 1, def: 120 },
  ],
  presets: [
    { id: 'curso', label: 'Ejemplo de Peek (10,29 kW/km)', values: { u: 150, r: 1.5, n: 1, sep: 40, s: 600, delta: 0.9, m: 1, f: 60, mode: 0, u0in: 120 } },
    { id: 'calculada', label: 'Incepción calculada (sin corona a 150 kV)', values: { u: 150, r: 1.5, n: 1, sep: 40, s: 600, delta: 0.9, m: 1, f: 60, mode: 1, u0in: 120 } },
    { id: 'haz', label: 'Haz de 2 subconductores', values: { u: 150, r: 1.5, n: 2, sep: 40, s: 600, delta: 0.9, m: 1, f: 60, mode: 1, u0in: 120 } },
    { id: 'fino', label: 'Conductor fino en altura', values: { u: 150, r: 0.5, n: 1, sep: 40, s: 300, delta: 0.74, m: 0.9, f: 60, mode: 1, u0in: 120 } },
  ],
  compute: (p) => {
    const rEq = bundleEquivalentRadius(p.r, p.n, p.sep / 2);
    const inc = coronaInception(rEq, p.s, p.delta, p.m);
    const u0 = p.mode === 1 ? inc.u0 : p.u0in;
    const loss = peekLoss(rEq, p.s, p.f, p.delta, p.u, u0);
    const gradient = p.u / (rEq * Math.log(Math.max(1.01, p.s / rEq)));
    const over = (p.u - u0) / u0;
    // Gradiente implícito en el dato de U₀: sirve para mostrar si el ejemplo es coherente con la geometría.
    const e0impl = u0 / (rEq * Math.log(Math.max(1.01, p.s / rEq)));
    const coherent = Math.abs(e0impl - inc.e0) / inc.e0 < 0.1 ? 1 : 0;
    return { rEq, e0: inc.e0, u0calc: inc.u0, u0, loss, gradient, over, e0impl, coherent, on: p.u > u0 ? 1 : 0, ratio: gradient / inc.e0 };
  },
  readings: (d, p) => [
    { label: 'Radio equivalente del conductor', value: `${fmt(d.rEq, 2)} cm`, sub: p.n > 1 ? `haz de ${fmt(p.n, 0)}` : 'conductor simple' },
    { label: 'Gradiente de incepción E₀', value: `${fmt(d.e0, 2)} kV/cm`, sub: '21,1·δ·m (valor eficaz)' },
    { label: 'Tensión de incepción U₀', value: `${fmt(d.u0, 1)} kV`, sub: p.mode === 1 ? `E₀·r_eq·ln(s/r_eq) = ${fmt(d.u0calc, 1)}` : 'dato de entrada del ejemplo' },
    { label: 'Gradiente superficial actual', value: `${fmt(d.gradient, 2)} kV/cm`, sub: `${fmt(d.ratio * 100, 0)} % del gradiente de incepción`, tone: d.on ? 'bad' : 'ok' },
    { label: 'Estado', value: d.on ? 'en corona' : 'sin corona', sub: d.on ? `U − U₀ = ${fmt(p.u - d.u0, 1)} kV` : 'U < U₀: no hay pérdidas por Peek', tone: d.on ? 'bad' : 'ok' },
    { label: 'Coherencia dato–geometría', value: d.coherent ? 'consistente' : 'no consistente', sub: `el dato implica E₀ = ${fmt(d.e0impl, 2)} kV/cm frente a ${fmt(d.e0, 2)} del modelo`, tone: d.coherent ? 'ok' : 'warn' },
    { label: 'Pérdidas por corona', value: `${fmt(d.loss, 2)} kW/km`, sub: 'por conductor, buen tiempo', tone: d.loss > 0 ? 'warn' : 'neutral' },
  ],
  equations: (p, d) => [
    `r_eq = (n·r·R^(n−1))^(1/n) = ${fmt(d.rEq, 2)} cm`,
    `E₀ = 21,1·δ·m = 21,1 × ${fmt(p.delta, 2)} × ${fmt(p.m, 2)} = ${fmt(d.e0, 2)} kV/cm`,
    `U₀ = E₀·r_eq·ln(s/r_eq) = ${fmt(d.e0, 2)} × ${fmt(d.rEq, 2)} × ln(${fmt(p.s, 0)}/${fmt(d.rEq, 2)}) = ${fmt(d.u0calc, 1)} kV`,
    `P = (242/δ)(f+25)√(r_eq/s)(U − U₀)²·10⁻⁵ = (242/${fmt(p.delta, 2)})(${fmt(p.f, 0)}+25)√(${fmt(d.rEq, 2)}/${fmt(p.s, 0)})(${fmt(p.u, 0)} − ${fmt(d.u0, 1)})²·10⁻⁵ = ${fmt(d.loss, 2)} kW/km`,
    'La fórmula solo aplica si U > U₀. Con U ≤ U₀ el modelo entrega cero pérdidas, no un valor negativo.',
    'Ojo: el U₀ del ejemplo (120 kV) no sale del gradiente de esta geometría. Es un dato de entrada; con U₀ calculada, esta línea estaría por debajo de la incepción.',
  ],
  checks: (p, d) => [
    { label: 'La fórmula se aplica solo por encima de la incepción', ok: p.u > d.u0, detail: `U = ${fmt(p.u, 0)} · U₀ = ${fmt(d.u0, 1)} kV` },
    { label: 'La incepción depende de r, δ y de la superficie', ok: true, detail: 'no es una constante de 21,1 kV/cm' },
    { label: 'El haz se refleja en el radio equivalente', ok: true, detail: `r_eq = ${fmt(d.rEq, 2)} cm` },
    { label: 'El dato de U₀ es coherente con la geometría', ok: d.coherent === 1, detail: d.coherent ? 'sí' : 'el ejemplo es un dato, no un cálculo' },
    { label: 'El resultado es por conductor, no trifásico', ok: true, detail: 'no multiplicar sin declarar el alcance' },
  ],
  goals: [
    {
      id: 'g1',
      label: 'Reproduce el ejemplo de Peek: 10,29 kW/km con U₀ = 120 kV',
      test: (p, d) => p.mode === 0 && Math.abs(d.loss - 10.29) < 0.15,
      detail: (_p, d) => `P = ${fmt(d.loss, 2)} kW/km`,
    },
    {
      id: 'g2',
      kind: 'exploracion',
      label: 'Con U₀ calculada, adelgaza el conductor hasta que 141,5 kV entre en corona',
      test: (p, d) => p.mode === 1 && Math.abs(p.u - 141.5) < 1.5 && d.on === 1,
      detail: (p, d) => `r = ${fmt(p.r, 2)} cm · U₀ = ${fmt(d.u0, 1)} kV · P = ${fmt(d.loss, 1)} kW/km`,
    },
  ],
  learn: {
    phenomenon:
      'Cuando el gradiente local supera la rigidez del aire, se ioniza una capa alrededor del conductor. No hace falta un arco: aparecen luz, ruido, ozono, interferencia y pérdidas.',
    objective:
      'Calcular la incepción a partir de r, δ y el estado superficial, y estimar pérdidas con Peek entendiendo sus límites.',
    watch: [
      'El halo de la escena crece con el exceso U − U₀: la corona no aparece de golpe en toda la línea.',
      'La parábola de pérdidas de la gráfica muestra la dependencia cuadrática: duplicar el exceso cuadruplica la pérdida.',
      'Pasa de 1 a 2 subconductores: el radio equivalente sube y la incepción se aleja.',
    ],
    misconception:
      'Usar la fórmula de Peek con U < U₀, o creer que cambiar el radio no cambia la incepción. En la versión 1 el control de haz no afectaba la fórmula; aquí la incepción sí depende de r_eq.',
    model:
      'Incepción coaxial con E₀ = 21,1 kV/cm y pérdidas de Peek para buen tiempo. La lluvia, el estado superficial y la geometría real pueden aumentar las pérdidas.',
  },
  sources: ['guion', 'slides', 'corona', 'ejercicios'],
  notes: ['La guía de ejercicios señala que en la versión 1 el control visual de haz no intervenía en la ecuación; en v2 el radio equivalente modifica U₀ y las pérdidas.'],
  scene: ({ p, d, t }) => {
    const intensity = clamp(d.over, 0, 1);
    return (
      <SceneCanvas
        draw={(ctx, w, h) => {
          backdrop(ctx, w, h);
          corner(ctx, 'Conductor en servicio', d.on ? 'corona activa' : 'sin corona');
          const cy = h * 0.46;
          const rx = d.rEq * 3.2;
          if (d.on) {
            for (let i = 0; i < 26; i++) {
              const a = (i / 26) * Math.PI * 2;
              const len = 10 + intensity * 26 * (0.6 + 0.4 * Math.sin(t * 3 + i));
              const x1 = w * 0.5 + Math.cos(a) * (rx + 4);
              const y1 = cy + Math.sin(a) * (rx + 4) * 0.5;
              const x2 = w * 0.5 + Math.cos(a + 0.4) * (rx + 4 + len);
              const y2 = cy + Math.sin(a + 0.4) * (rx + 4 + len) * 0.5;
              line(ctx, x1, y1, x2, y2, { color: 'rgba(160,190,255,0.5)', width: 1 });
            }
            glow(ctx, w * 0.5, cy, rx * 2.6, 'rgba(150,170,255,0.9)', 0.25 + 0.35 * intensity);
          }
          // conductor
          ctx.save();
          const grad = ctx.createLinearGradient(0, cy - rx, 0, cy + rx);
          grad.addColorStop(0, 'rgba(220,235,245,0.9)');
          grad.addColorStop(0.5, 'rgba(150,175,190,0.9)');
          grad.addColorStop(1, 'rgba(90,110,125,0.9)');
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.roundRect(w * 0.08, cy - rx, w * 0.84, rx * 2, rx);
          ctx.fill();
          ctx.restore();
          // haz
          if (p.n > 1) {
            const R = p.sep * 0.7;
            for (let k = 0; k < p.n; k++) {
              const a = (k / p.n) * Math.PI * 2 + t * 0.1;
              circle(ctx, w * 0.5 + Math.cos(a) * R, cy + Math.sin(a) * R * 0.6, Math.max(4, rx * 0.8), { fill: 'rgba(200,220,235,0.5)', stroke: C.steel });
            }
            circle(ctx, w * 0.5, cy, R * 1.15, { stroke: 'rgba(120,160,180,0.3)', width: 1, });
          }
          dimension(ctx, w * 0.9, cy - rx, w * 0.9, cy + rx, `2r_eq = ${fmt(2 * d.rEq, 1)} cm`, C.muted);
          // lluvia si δ baja
          for (let i = 0; i < 22; i++) {
            const x = (i * 53 + ((t * 40) % 40)) % w;
            const y = (i * 31 + ((t * 60) % 60)) % h;
            line(ctx, x, y, x - 2, y + 7, { color: 'rgba(127,200,255,0.22)', width: 1 });
          }
          badge(ctx, d.on ? `P = ${fmt(d.loss, 2)} kW/km` : 'U < U₀', w - 150, 22, d.on ? C.bad : C.ok);
          text(ctx, `E = ${fmt(d.gradient, 2)} kV/cm · E₀ = ${fmt(d.e0, 2)} kV/cm`, 14, h - 16, { size: 10.5, color: C.muted, mono: true });
        }}
        footer="El halo azulado solo existe donde el gradiente supera el de incepción; el conductor no necesita arco a tierra para perder energía."
      />
    );
  },
  plot: ({ p, d }) => {
    const pts: [number, number][] = [];
    for (let u = 10; u <= 450; u += 4) {
      const rEq = bundleEquivalentRadius(p.r, p.n, p.sep / 2);
      pts.push([u, peekLoss(rEq, p.s, p.f, p.delta, u, d.u0)]);
    }
    const pts2: [number, number][] = [];
    for (let u = 10; u <= 450; u += 4) {
      const rEq = bundleEquivalentRadius(Math.max(0.3, p.r * 1.6), p.n, p.sep / 2);
      const inc = coronaInception(rEq, p.s, p.delta, p.m).u0;
      pts2.push([u, peekLoss(rEq, p.s, p.f, p.delta, u, p.mode === 1 ? inc : d.u0)]);
    }
    return (
      <Plot
        xDomain={[0, 450]}
        yDomain={[0, Math.max(40, Math.max(...pts.map((q) => q[1])) * 1.1)]}
        xLabel="tensión fase–tierra (kV eficaces)"
        yLabel="pérdidas por corona (kW/km)"
        series={[
          { pts, color: C.violet, width: 2.4, area: true },
          { pts: pts2, color: C.phase, width: 1.6, dash: '5 4' },
        ]}
        refs={[{ at: d.u0, label: `U₀ = ${fmt(d.u0, 1)} kV`, color: C.amber, axis: 'x' }]}
        markers={[{ x: p.u, y: d.loss, color: C.accent, label: 'tu caso' }]}
        caption="Curva llena: tu conductor. Punteada: un conductor 60 % más grueso, con menor gradiente y pérdidas más bajas."
      />
    );
  },
};

/* =============================== e18 =============================== */

const e18: Experiment = {
  id: 'e18',
  topicId: 13,
  title: 'Misión: coordinar la línea completa',
  tagline: 'Cadena, altitud, guarda, tierra, descargador y margen',
  why: 'Integrar todos los criterios en una sola decisión y comprobar que una solución verde en un renglón puede fallar en otro.',
  params: [
    { id: 'um', label: 'Tensión máxima Uₘ', unit: 'kV', min: 72.5, max: 500, step: 0.5, def: 245 },
    { id: 'h', label: 'Altitud del sitio', unit: 'm', min: 0, max: 4000, step: 10, def: 2640 },
    { id: 'temp', label: 'Temperatura', unit: '°C', min: 0, max: 35, step: 1, def: 20 },
    { id: 'kf', label: 'Coeficiente de fuga k_f', unit: 'mm/kV', min: 12, max: 35, step: 1, def: 25 },
    { id: 'fuga', label: 'Fuga por unidad', unit: 'mm', min: 200, max: 450, step: 2, def: 292 },
    { id: 'paso', label: 'Paso de montaje', unit: 'm', min: 0.1, max: 0.2, step: 0.002, def: 0.146 },
    { id: 'dh', label: 'Δh guarda–fase', unit: 'm', min: 2, max: 12, step: 0.1, def: 6 },
    { id: 'dx', label: 'Δx guarda–fase', unit: 'm', min: 0, max: 10, step: 0.1, def: 3 },
    { id: 'rt', label: 'Resistencia de tierra', unit: 'Ω', min: 1, max: 50, step: 0.5, def: 20 },
    { id: 'iRayo', label: 'Corriente de rayo de diseño', unit: 'kA', min: 10, max: 120, step: 1, def: 60 },
    { id: 'didt', label: 'di/dt de diseño', unit: 'kA/µs', min: 5, max: 40, step: 1, def: 20 },
    { id: 'kc', label: 'Acoplamiento guarda–fase', unit: '', min: 0, max: 0.4, step: 0.01, def: 0.25 },
    { id: 'cfo', label: 'CFO de la cadena', unit: 'kV', min: 900, max: 1800, step: 10, def: 1400 },
    { id: 'uc', label: 'U_c del descargador', unit: 'kV eficaces', min: 80, max: 300, step: 1, def: 150 },
    { id: 'ures', label: 'U_res del descargador', unit: 'kV cresta', min: 350, max: 900, step: 5, def: 600 },
    { id: 'bil', label: 'BIL del equipo', unit: 'kV cresta', min: 650, max: 1800, step: 10, def: 1050 },
    { id: 'dArr', label: 'Distancia descargador–equipo', unit: 'm', min: 0, max: 20, step: 0.5, def: 6 },
  ],
  presets: [
    { id: 'referencia', label: 'Proyecto de referencia (245 kV, 2 640 m)', values: { um: 245, h: 2640, temp: 20, kf: 25, fuga: 292, paso: 0.146, dh: 6, dx: 3, rt: 20, iRayo: 60, didt: 20, kc: 0.25, cfo: 1400, uc: 150, ures: 600, bil: 1050, dArr: 6 } },
    { id: 'curso', label: 'Geometría del ejemplo (38,7°)', values: { um: 245, h: 2640, temp: 20, kf: 25, fuga: 292, paso: 0.146, dh: 5, dx: 4, rt: 20, iRayo: 60, didt: 20, kc: 0.25, cfo: 1400, uc: 150, ures: 600, bil: 1050, dArr: 6 } },
    { id: 'debil', label: 'Descargador insuficiente y tierra alta', values: { um: 245, h: 2640, temp: 20, kf: 25, fuga: 292, paso: 0.146, dh: 6, dx: 3, rt: 45, iRayo: 60, didt: 20, kc: 0.25, cfo: 1400, uc: 140, ures: 760, bil: 1050, dArr: 12 } },
  ],
  compute: (p) => {
    const delta = airDensity(p.h, p.temp);
    const uf = p.um / Math.sqrt(3);
    // cadena: criterio del proyecto (base entre fases) y maniobra
    const fugaReq = creepageRequired(p.um, p.kf, 1, 1);
    const nFuga = Math.max(1, Math.ceil(fugaReq / p.fuga));
    const cfoReq = cfoRequired(p.um, 2.5, 1.15, 1.3, 6, delta, 1);
    const nMan = Math.max(1, Math.ceil(insulatorsFromCfo(cfoReq)));
    const n = Math.max(nFuga, nMan);
    const length = n * p.paso;
    const cfoString = cfoFromInsulators(n);
    // guarda
    const alpha = (Math.atan2(p.dx, p.dh) * 180) / Math.PI;
    // tierra
    const vt = p.rt * p.iRayo + 1 * p.didt;
    const vChain = vt * (1 - p.kc);
    // pararrayos
    const ucReq = ucMin(p.um, true);
    const uTov = 1.25 * uf;
    const ueq = tovEquivalent(uTov, 1, 0.02);
    const cap = tovCapability(195, 1, 0.02);
    const uEff = effectiveProtection(p.ures, p.dArr, 1, 10);
    const margin = protectionMargin(p.bil, uEff);
    const checks = {
      chain: cfoString >= cfoReq ? 1 : 0,
      guard: alpha <= 30 ? 1 : 0,
      ground: vChain < p.cfo ? 1 : 0,
      uc: p.uc >= ucReq ? 1 : 0,
      tov: ueq <= cap ? 1 : 0,
      marginOk: margin >= 20 ? 1 : 0,
    };
    const all = Object.values(checks).reduce((a, b) => a * b, 1);
    return { delta, uf, fugaReq, nFuga, cfoReq, nMan, n, length, cfoString, alpha, vt, vChain, ucReq, uTov, ueq, cap, uEff, margin, ...checks, all };
  },
  readings: (d, p) => [
    { label: 'Altitud y densidad', value: `${fmt(p.h, 0)} m · δ = ${fmt(d.delta, 3)}`, sub: `T = ${fmt(p.temp, 0)} °C` },
    { label: 'Cadena dimensionada', value: `${fmt(d.n, 0)} discos · ${fmt(d.length, 2)} m`, sub: `fuga ${fmt(d.nFuga, 0)} · maniobra ${fmt(d.nMan, 0)}` },
    { label: 'CFO instalado vs requerido', value: `${fmt(d.cfoString, 0)} / ${fmt(d.cfoReq, 0)} kV`, sub: 'maniobra corregida por altitud', tone: d.chain ? 'ok' : 'bad' },
    { label: 'Ángulo de guarda', value: `${fmt(d.alpha, 1)}°`, sub: 'referencia ≤ 30°', tone: d.guard ? 'ok' : 'bad' },
    { label: 'Tensión sobre la cadena (rayo)', value: `${fmt(d.vChain, 0)} kV`, sub: `frente a CFO ${fmt(p.cfo, 0)} kV`, tone: d.ground ? 'ok' : 'bad' },
    { label: 'Margen del descargador', value: `${fmt(d.margin, 1)} %`, sub: `U_equipo ${fmt(d.uEff, 0)} · BIL ${fmt(p.bil, 0)}`, tone: d.margin >= 20 ? 'ok' : 'bad' },
    { label: 'Proyecto completo', value: d.all ? 'coordinado' : 'revisar', sub: d.all ? 'todas las verificaciones pasan' : 'al menos una falla', tone: d.all ? 'ok' : 'bad' },
  ],
  equations: (p, d) => [
    `L_f = ${fmt(p.kf, 0)} × ${fmt(p.um, 1)} = ${fmt(d.fugaReq, 0)} mm → N_fuga = ${fmt(d.nFuga, 0)}`,
    `CFO_req = (1,15 × 2,5 × Û_f)/(1 − 1,3 × 0,06)/δ = ${fmt(d.cfoReq, 0)} kV → N_maniobra = ${fmt(d.nMan, 0)}`,
    `N = máx(${fmt(d.nFuga, 0)}, ${fmt(d.nMan, 0)}) = ${fmt(d.n, 0)} · L = ${fmt(d.n, 0)} × ${fmt(p.paso, 3)} = ${fmt(d.length, 2)} m`,
    `α = arctan(${fmt(p.dx, 1)}/${fmt(p.dh, 1)}) = ${fmt(d.alpha, 1)}° · V_cadena = (${fmt(p.rt, 1)}×${fmt(p.iRayo, 0)} + ${fmt(p.didt, 0)})·(1 − ${fmt(p.kc, 2)}) = ${fmt(d.vChain, 0)} kV`,
    `U_c ≥ 1,05·U_f = ${fmt(d.ucReq, 1)} kV · U_eq = ${fmt(d.ueq, 1)} ≤ ${fmt(d.cap, 1)} kV · M = (${fmt(p.bil, 0)}/${fmt(d.uEff, 0)} − 1)·100 = ${fmt(d.margin, 1)} %`,
  ],
  checks: (_p, d) => [
    { label: 'Cadena: CFO instalado ≥ CFO requerido', ok: d.chain === 1, detail: `${fmt(d.cfoString, 0)} ≥ ${fmt(d.cfoReq, 0)} kV` },
    { label: 'Guarda: α ≤ 30°', ok: d.guard === 1, detail: `${fmt(d.alpha, 1)}°` },
    { label: 'Tierra y rayo: V_cadena < CFO', ok: d.ground === 1, detail: `${fmt(d.vChain, 0)} < ${fmt(1400, 0)} kV` },
    { label: 'Descargador: U_c ≥ 1,05·U_f', ok: d.uc === 1, detail: `${fmt(d.ucReq, 1)} kV` },
    { label: 'Descargador: TOV equivalente ≤ capacidad', ok: d.tov === 1, detail: `${fmt(d.ueq, 1)} ≤ ${fmt(d.cap, 1)} kV` },
    { label: 'Equipo: margen ≥ 20 %', ok: d.marginOk === 1, detail: `${fmt(d.margin, 1)} %` },
  ],
  goals: [
    {
      id: 'g1',
      label: 'Haz que todas las verificaciones pasen (proyecto coordinado)',
      test: (_p, d) => d.all === 1,
      detail: (_p, d) => `verificaciones superadas · N = ${fmt(d.n, 0)} · M = ${fmt(d.margin, 0)} %`,
    },
    {
      id: 'g2',
      label: 'Logra el proyecto coordinado con α ≤ 25° y margen ≥ 40 %',
      test: (_p, d) => d.all === 1 && d.alpha <= 25 && d.margin >= 40,
      detail: (_p, d) => `α = ${fmt(d.alpha, 1)}° · M = ${fmt(d.margin, 1)} %`,
    },
  ],
  learn: {
    phenomenon:
      'La coordinación de aislamiento no es la suma de componentes óptimos por separado: es un conjunto donde la cadena, la altitud, la guarda, la tierra y el descargador se condicionan entre sí.',
    objective:
      'Ejecutar el ciclo completo de verificación y explicar por qué cambiar una pieza obliga a revisar las demás.',
    watch: [
      'La escena completa se colorea por verificación: un renglón en rojo invalida el proyecto.',
      'El diagrama de barras compara esfuerzo y soporte en tres frentes: maniobra, rayo y equipo.',
      'Ajusta una sola pieza y observa cuántas comprobaciones se mueven.',
    ],
    misconception:
      'Presentar un cálculo aislado como solución. La cifra verde en un renglón no compensa un rojo en otro: el proyecto es el conjunto.',
    model:
      'Modelos didácticos de los experimentos anteriores (ajuste CFO–N, TOV equivalente, suma inductiva). Los factores 1,05/1,15/1,25/20 % son hipótesis del ejercicio.',
  },
  sources: ['guion', 'slides', 'cardona', 'pararrayos', 'velasco', 'iec60071'],
  scene: ({ p, d }) => (
    <SceneCanvas
      draw={(ctx, w, h) => {
        backdrop(ctx, w, h);
        corner(ctx, 'Línea completa', d.all ? 'proyecto coordinado' : 'revisar verificaciones');
        const gy = h * 0.86;
        ctx.save();
        ctx.fillStyle = 'rgba(60,90,80,0.35)';
        ctx.beginPath();
        ctx.moveTo(0, gy);
        ctx.lineTo(w * 0.22, gy - h * 0.16);
        ctx.lineTo(w * 0.5, gy - h * 0.05);
        ctx.lineTo(w * 0.78, gy - h * 0.2);
        ctx.lineTo(w, gy - h * 0.04);
        ctx.lineTo(w, gy);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
        soil(ctx, 0, gy, w, h - gy, 2);
        const tx = w * 0.36;
        const th = h * 0.62;
        tower(ctx, tx, gy, th, { crossarms: [{ y: th * 0.94, half: w * 0.11 }, { y: th * 0.74, half: w * 0.08 }] });
        const gyy = gy - th * 0.94;
        line(ctx, tx - w * 0.16, gyy, tx + w * 0.16, gyy, { color: C.guard, width: 1.8 });
        // cadena
        const chx = tx + w * 0.08;
        const chy = gy - th * 0.74;
        line(ctx, chx, chy, chx, chy + d.length * 9, { color: C.steel });
        for (let i = 0; i < Math.min(10, d.n); i++) {
          ctx.save();
          ctx.strokeStyle = C.steel;
          ctx.fillStyle = 'rgba(180,205,220,0.3)';
          ctx.beginPath();
          ctx.ellipse(chx, chy + (i + 0.5) * (d.length * 9 / Math.min(10, d.n)), 10, 3, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          ctx.restore();
        }
        circle(ctx, chx, chy + d.length * 9, 4, { fill: C.phase });
        text(ctx, `${fmt(d.n, 0)} discos`, chx + 18, chy + d.length * 4.5, { size: 10, color: C.phase, mono: true });
        // línea a descargador
        line(ctx, chx, chy + d.length * 9, w * 0.72, chy + d.length * 9, { color: C.phase, width: 2 });
        const ax = w * 0.74;
        for (let i = 0; i < 5; i++) {
          ctx.save();
          ctx.fillStyle = 'rgba(183,155,255,0.5)';
          ctx.beginPath();
          ctx.roundRect(ax - 8, chy + d.length * 9 + 8 + i * 11, 16, 9, 2);
          ctx.fill();
          ctx.restore();
        }
        line(ctx, ax, chy + d.length * 9 + 63, ax, gy, { color: C.steel });
        text(ctx, 'descargador', ax, chy - 16, { size: 10, color: C.violet, align: 'center' });
        // equipo
        ctx.save();
        ctx.fillStyle = 'rgba(100,140,160,0.3)';
        ctx.strokeStyle = C.steel;
        ctx.beginPath();
        ctx.roundRect(w * 0.86, gy - h * 0.22, w * 0.1, h * 0.22, 4);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        text(ctx, 'equipo', w * 0.91, gy - h * 0.25, { size: 10, color: C.muted, align: 'center' });
        // ángulo de guarda
        line(ctx, tx, gyy, tx + p.dx * 9, gyy + p.dh * 9, { color: C.amber });
        text(ctx, `${fmt(d.alpha, 1)}°`, tx + p.dx * 4.5 + 8, gyy + p.dh * 4.5, { size: 10, color: C.amber, mono: true });
        // resumen de verificaciones
        const items: [string, boolean][] = [
          ['cadena', d.chain === 1],
          ['guarda', d.guard === 1],
          ['tierra/rayo', d.ground === 1],
          ['U_c', d.uc === 1],
          ['TOV', d.tov === 1],
          ['margen', d.margin === 1],
        ];
        items.forEach(([lab, ok], i) => {
          const x = 14 + (i % 3) * 92;
          const y = 22 + Math.floor(i / 3) * 20;
          badge(ctx, `${ok ? '✓' : '✕'} ${lab}`, x, y, ok ? C.ok : C.bad);
        });
        text(ctx, `N = ${fmt(d.n, 0)} · δ = ${fmt(d.delta, 2)} · M = ${fmt(d.margin, 0)} %`, 14, h - 16, { size: 10.5, color: C.muted, mono: true });
      }}
      footer="Seis verificaciones simultáneas. Un solo renglón rojo invalida el conjunto: eso es coordinación."
    />
  ),
  plot: ({ p, d }) => {
    const bars: [number, number][] = [];
    const labels = ['maniobra', 'rayo/tierra', 'equipo'];
    const stress = [d.cfoReq, d.vChain, d.uEff];
    const withstand = [d.cfoString, p.cfo, p.bil];
    void bars;
    return (
      <Plot
        xDomain={[0, 3]}
        yDomain={[0, Math.max(...withstand, ...stress) * 1.2]}
        xLabel="frente de verificación"
        yLabel="tensión (kV de cresta)"
        series={[
          { pts: stress.map((v, i) => [i + 0.35, v] as [number, number]), color: C.bad, width: 12 },
          { pts: withstand.map((v, i) => [i + 0.65, v] as [number, number]), color: C.ok, width: 12 },
        ]}
        markers={[
          { x: 0.5, y: d.cfoReq, color: C.bad, label: labels[0] },
          { x: 1.5, y: d.vChain, color: C.bad, label: labels[1] },
          { x: 2.5, y: d.uEff, color: C.bad, label: labels[2] },
        ]}
        caption={`Rojo: esfuerzo (${fmt(stress[0], 0)} · ${fmt(stress[1], 0)} · ${fmt(stress[2], 0)} kV). Verde: soporte (${fmt(withstand[0], 0)} · ${fmt(withstand[1], 0)} · ${fmt(withstand[2], 0)} kV). El margen es la distancia entre ambos.`}
      />
    );
  },
};

/* =============================== e19 =============================== */

const stateOf = (p: Params) => ({
  conductionUA: p.ic,
  absorptionUA: p.ia,
  absTau: p.tau,
  testV: p.vtest,
});

const e19: Experiment = {
  id: 'e19',
  topicId: 5,
  title: 'Medir el aislamiento: la aguja cuenta una historia',
  tagline: 'Carga, absorción, fuga y los índices DAR y PI',
  why: 'Interpretar una medición de resistencia de aislamiento y no confundir un valor bajo con una causa.',
  params: [
    { id: 'ic', label: 'Corriente de conducción (fuga)', unit: 'µA', min: 0.2, max: 40, step: 0.1, def: 1, help: 'Aumenta con humedad, suciedad y envejecimiento.' },
    { id: 'ia', label: 'Corriente de absorción inicial', unit: 'µA', min: 5, max: 80, step: 1, def: 45 },
    { id: 'tau', label: 'Constante de absorción', unit: 's', min: 5, max: 120, step: 1, def: 25 },
    { id: 'vtest', label: 'Tensión de ensayo', unit: 'V', min: 500, max: 5000, step: 100, def: 5000 },
    { id: 'temp', label: 'Temperatura del devanado', unit: '°C', min: 0, max: 60, step: 1, def: 25 },
    { id: 'hum', label: 'Humedad relativa', unit: '%', min: 20, max: 95, step: 1, def: 55 },
  ],
  presets: [
    { id: 'sano', label: 'Aislamiento sano (seco y limpio)', values: { ic: 0.6, ia: 45, tau: 25, vtest: 5000, temp: 25, hum: 50 } },
    { id: 'humedo', label: 'Aislamiento húmedo y sucio', values: { ic: 30, ia: 30, tau: 25, vtest: 5000, temp: 25, hum: 88 } },
    { id: 'viejo', label: 'Envejecido, con fugas', values: { ic: 5, ia: 12, tau: 20, vtest: 2500, temp: 45, hum: 60 } },
  ],
  compute: (p) => {
    const st = stateOf(p);
    const r15 = insulationResistance(15, st);
    const r30 = insulationResistance(30, st);
    const r60 = insulationResistance(60, st);
    const r10 = insulationResistance(600, st);
    const darV = dar(st);
    const piV = piIndex(st);
    const rCorr = correctTo20(r60, p.temp);
    const invalid = p.hum > 80 || p.temp < 0 ? 1 : 0;
    return { r15, r30, r60, r10, dar: darV, pi: piV, rCorr, invalid, darOk: darV >= 1.25 ? 1 : 0 };
  },
  readings: (d, p) => [
    { label: 'R a 30 s / 60 s', value: `${fmt(d.r30, 0)} / ${fmt(d.r60, 0)} MΩ`, sub: `a ${fmt(p.vtest, 0)} V de ensayo` },
    { label: 'R a 10 min', value: `${fmt(d.r10, 0)} MΩ`, sub: 'cerca del valor estable de fuga' },
    { label: 'DAR = R60/R30', value: fmt(d.dar, 2), sub: d.dar < 1.25 ? 'insuficiente' : d.dar < 1.6 ? 'aceptable' : 'excelente', tone: d.dar < 1.25 ? 'bad' : d.dar < 1.6 ? 'warn' : 'ok' },
    { label: 'PI = R10min/R1min', value: fmt(d.pi, 2), sub: d.pi < 2 ? 'problema potencial' : d.pi > 4 ? 'excelente' : 'aceptable', tone: d.pi < 2 ? 'bad' : d.pi > 4 ? 'ok' : 'warn' },
    { label: 'R60 corregida a 20 °C', value: `${fmt(d.rCorr, 0)} MΩ`, sub: 'se duplica por cada −10 °C' },
    { label: 'Condiciones del ensayo', value: d.invalid ? 'no concluyente' : 'válidas', sub: d.invalid ? 'humedad > 80 %: puede dominar la superficie' : 'temperatura y humedad declaradas', tone: d.invalid ? 'bad' : 'ok' },
  ],
  equations: (_p, d) => [
    `i(t) = I_conducción + I_absorción·e^(−t/τ) + I_carga capacitiva`,
    `R(t) = V_ensayo / i(t) → R₃₀ = ${fmt(d.r30, 1)} MΩ · R₆₀ = ${fmt(d.r60, 1)} MΩ`,
    `DAR = R₆₀/R₃₀ = ${fmt(d.dar, 2)} · PI = R₁₀ₘᵢₙ/R₁ₘᵢₙ = ${fmt(d.pi, 2)}`,
    `R(20 °C) = R_medida · 2^((T − 20)/10) = ${fmt(d.rCorr, 0)} MΩ`,
    'Un valor bajo estable en el tiempo sugiere fuga; un valor que sube lento sugiere aislamiento sano. La tendencia importa tanto como el número.',
  ],
  checks: (_p, d) => [
    { label: 'Se distingue prueba dieléctrica de medición de resistencia', ok: true, detail: 'la medición es no destructiva' },
    { label: 'Se corrigen las condiciones de temperatura', ok: true, detail: `R(20 °C) = ${fmt(d.rCorr, 0)} MΩ` },
    { label: 'La humedad y el punto de rocío se consideran', ok: d.invalid === 0, detail: d.invalid ? 'ensayo no concluyente' : 'condiciones declaradas' },
    { label: 'PI no se aplica igual a transformadores de aceite', ok: true, detail: 'la guía lo advierte' },
  ],
  goals: [
    {
      id: 'g1',
      label: 'Ajusta un aislamiento sano: DAR ≥ 1,6 y R60 ≥ 100 MΩ',
      test: (_p, d) => d.dar >= 1.6 && d.r60 >= 100,
      detail: (_p, d) => `DAR = ${fmt(d.dar, 2)} · R60 = ${fmt(d.r60, 0)} MΩ`,
    },
    {
      id: 'g2',
      kind: 'exploracion',
      label: 'Reproduce un caso húmedo: DAR < 1,25 y R60 < 150 MΩ',
      test: (_p, d) => d.dar < 1.25 && d.r60 < 150,
      detail: (_p, d) => `DAR = ${fmt(d.dar, 2)} · R60 = ${fmt(d.r60, 0)} MΩ`,
    },
  ],
  quiz: {
    question:
      'Un motor de 5 kV se mide con 5 000 V: R30 = 90 MΩ, R60 = 98 MΩ y R10min = 140 MΩ. La temperatura es 25 °C y la humedad 88 %. ¿Cuál es la lectura más defendible?',
    options: [
      { id: 'a', label: 'Aislamiento húmedo o contaminado en la superficie: el DAR es bajo y el ensayo está afectado por la humedad.' },
      { id: 'b', label: 'El aislamiento está sano porque R10min es mayor que R30.' },
      { id: 'c', label: 'Hay una perforación franca del devanado.' },
      { id: 'd', label: 'El megóhmetro está mal calibrado porque la resistencia sube con el tiempo.' },
    ],
    correct: 'a',
    explanation:
      'DAR = 98/90 = 1,09 (<1,25) y PI = 140/(R1min) es bajo: la corriente de fuga domina sobre la absorción, típico de humedad o contaminación superficial. Con 88 % de humedad el ensayo no es concluyente: hay que secar, limpiar y repetir. Una perforación daría un valor muy bajo y estable, no este patrón.',
  },
  learn: {
    phenomenon:
      'Al aplicar tensión continua, la corriente total tiene tres partes: carga capacitiva, absorción y fuga. La resistencia aparente crece con el tiempo; cómo crece revela el estado del aislamiento.',
    objective:
      'Interpretar R(t), calcular DAR y PI, corregir por temperatura y distinguir humedad superficial de daño interno.',
    watch: [
      'La curva R(t) de la gráfica: un aislamiento sano sigue subiendo; uno húmedo se aplana pronto.',
      'El instrumento de la escena muestra el valor en el instante seleccionado por el barrido.',
      'Sube la corriente de conducción y mira cómo DAR y PI caen aunque la absorción sea la misma.',
    ],
    misconception:
      'Diagnosticar con un solo valor puntual, sin temperatura ni humedad, o aplicar los umbrales de PI a cualquier equipo.',
    model:
      'Modelo de tres corrientes con exponencial de absorción. Los umbrales provienen de la guía (DAR < 1,25 insuficiente; PI < 2 problema potencial; IEEE 43 fija PI ≥ 2 para máquinas rotativas).',
  },
  sources: ['medicion', 'guion', 'slides'],
  scene: ({ p, d, t }) => (
    <SceneCanvas
      draw={(ctx, w, h) => {
        backdrop(ctx, w, h);
        corner(ctx, 'Megóhmetro', 'medición de resistencia de aislamiento');
        // instrumento
        const ix = w * 0.62;
        const iy = h * 0.18;
        const iw = w * 0.3;
        const ih = h * 0.44;
        ctx.save();
        ctx.fillStyle = 'rgba(14,30,42,0.95)';
        ctx.strokeStyle = C.steel;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(ix, iy, iw, ih, 8);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        ctx.save();
        ctx.fillStyle = 'rgba(20,50,40,0.9)';
        ctx.beginPath();
        ctx.roundRect(ix + 12, iy + 12, iw - 24, 42, 4);
        ctx.fill();
        ctx.restore();
        const tt = 15 + ((t * 8) % 585);
        const st = stateOf(p);
        const rNow = insulationResistance(tt, st);
        text(ctx, `${rNow > 1000 ? fmt(rNow / 1000, 2) + ' GΩ' : fmt(rNow, 0) + ' MΩ'}`, ix + iw / 2, iy + 33, { size: 18, weight: 800, color: C.accent, align: 'center', mono: true });
        text(ctx, `t = ${fmt(tt, 0)} s`, ix + iw / 2, iy + 66, { size: 10, color: C.muted, align: 'center', mono: true });
        text(ctx, `U = ${fmt(p.vtest, 0)} V`, ix + iw / 2, iy + 82, { size: 10, color: C.phase, align: 'center', mono: true });
        // mini traza
        ctx.save();
        ctx.strokeStyle = C.accent;
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        for (let i = 0; i <= 100; i++) {
          const u = i / 100;
          const tsec = u * 600;
          const rr = insulationResistance(Math.max(1, tsec), st);
          const x = ix + 12 + u * (iw - 24);
          const y = iy + ih - 12 - (Math.log10(Math.max(1, rr)) / 4) * (ih - 110);
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
        ctx.restore();
        text(ctx, 'R(t)', ix + 14, iy + ih - 18, { size: 9, color: C.muted });
        // equipo bajo ensayo
        const ex = w * 0.18;
        const ey = h * 0.3;
        ctx.save();
        ctx.fillStyle = 'rgba(90,120,140,0.28)';
        ctx.strokeStyle = C.steel;
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.roundRect(ex, ey, w * 0.22, h * 0.4, 6);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        for (let i = 0; i < 4; i++) {
          ctx.save();
          ctx.strokeStyle = p.ic > 5 ? 'rgba(255,107,107,0.7)' : 'rgba(127,200,255,0.5)';
          ctx.lineWidth = 1.3;
          ctx.beginPath();
          for (let k = 0; k <= 10; k++) {
            const u = k / 10;
            const x = ex + 10 + i * (w * 0.05) + u * 10;
            const y = ey + 14 + u * (h * 0.34) + Math.sin(u * 12 + t * 4 + i) * 4;
            if (k === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.stroke();
          ctx.restore();
        }
        text(ctx, 'aislamiento', ex + w * 0.11, ey + h * 0.45, { size: 10, color: C.muted, align: 'center' });
        line(ctx, ex + w * 0.11, ey, ex + w * 0.11, iy + ih, { color: 'rgba(56,225,198,0.4)', dash: [4, 4] });
        // condiciones
        text(ctx, `T = ${fmt(p.temp, 0)} °C · HR = ${fmt(p.hum, 0)} %`, 14, h - 16, { size: 10.5, color: d.invalid ? C.bad : C.muted, mono: true });
        badge(ctx, `DAR ${fmt(d.dar, 2)}`, 14, 22, d.dar < 1.25 ? C.bad : d.dar < 1.6 ? C.amber : C.ok);
        badge(ctx, `PI ${fmt(d.pi, 2)}`, 14, 44, d.pi < 2 ? C.bad : d.pi > 4 ? C.ok : C.amber);
      }}
      footer="El instrumento aplica tensión continua y mide la corriente; lo que se lee es una resistencia que cambia con el tiempo."
    />
  ),
  plot: ({ p, d }) => {
    const st = stateOf(p);
    const pts: [number, number][] = [];
    for (let i = 0; i <= 120; i++) {
      const tt = Math.pow(10, Math.log10(1) + (i / 120) * (Math.log10(600) - Math.log10(1)));
      pts.push([tt, Math.log10(Math.max(1, insulationResistance(tt, st)))]);
    }
    const wet: [number, number][] = [];
    for (let i = 0; i <= 120; i++) {
      const tt = Math.pow(10, (i / 120) * Math.log10(600));
      wet.push([tt, Math.log10(Math.max(1, insulationResistance(tt, { ...st, conductionUA: 18, absorptionUA: 30, absTau: 40 })))]);
    }
    return (
      <Plot
        xDomain={[1, 600]}
        yDomain={[0, 5]}
        xLog
        xLabel="tiempo de aplicación de la tensión (s, logarítmica)"
        yLabel="log₁₀ R (MΩ)"
        series={[
          { pts, color: C.accent, width: 2.4 },
          { pts: wet, color: 'rgba(255,107,107,0.7)', width: 1.6, dash: '5 4' },
        ]}
        refs={[
          { at: 2, label: '60 s', color: C.muted, dash: '2 4', axis: 'x' },
          { at: Math.log10(Math.max(1, d.r60)), label: `R60 = ${fmt(d.r60, 0)} MΩ`, color: C.amber },
        ]}
        caption="Curva verde: tu aislamiento. Roja punteada: uno húmedo, que se aplana porque la fuga domina. La escala vertical es logarítmica."
      />
    );
  },
};

export const protection2Experiments: Experiment[] = [e16, e17, e18, e19];
