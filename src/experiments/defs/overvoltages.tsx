import { fmt, impulseMetrics, impulseShape, linspace } from '../../lib/num';
import { C, arrow, backdrop, badge, circle, dimension, line, text } from '../../lib/draw';
import { Plot, SceneCanvas } from '../../components/ui';
import type { Experiment, Params } from '../types';
import { classifyFront, corner, FRONT_COLOR } from '../common';

/* =============================== e01 =============================== */

const e01class = (p: Params) => classifyFront(p.tFront, p.tTail);

const e01: Experiment = {
  id: 'e01',
  topicId: 2,
  title: 'Tres sobretensiones, tres formas de onda',
  tagline: 'Amplitud, frente y duración: la firma de cada esfuerzo',
  why: 'Aprender a clasificar una sobretensión por su forma de onda antes de compararla con un ensayo.',
  params: [
    { id: 'um', label: 'Tensión máxima entre fases Uₘ', unit: 'kV', min: 72.5, max: 500, step: 0.5, def: 245 },
    { id: 'pu', label: 'Amplitud en por unidad de Û_f', unit: 'p.u.', min: 1, max: 4, step: 0.05, def: 2.5 },
    {
      id: 'tFront',
      label: 'Tiempo de frente',
      unit: 'µs',
      min: 0.5,
      max: 6000,
      step: 0.5,
      def: 250,
      help: 'Rayo ≈ 1 µs · maniobra ≈ 100–300 µs · temporal: medio ciclo de 50 Hz = 10 000 µs.',
    },
    { id: 'tTail', label: 'Tiempo hasta la cola', unit: 'µs', min: 20, max: 20000, step: 10, def: 2500 },
  ],
  presets: [
    { id: 'rayo', label: 'Impulso tipo rayo 1,2/50 µs', values: { um: 245, pu: 3.2, tFront: 1.2, tTail: 50 } },
    { id: 'maniobra', label: 'Maniobra 250/2500 µs', values: { um: 245, pu: 2.5, tFront: 250, tTail: 2500 } },
    { id: 'temporal', label: 'Temporal: falla a tierra 1,4 p.u.', values: { um: 245, pu: 1.4, tFront: 5000, tTail: 10000 } },
    { id: 'curso', label: 'Ejemplo del curso: 2,5 p.u. en 245 kV', values: { um: 245, pu: 2.5, tFront: 250, tTail: 2500 } },
  ],
  compute: (p) => {
    const ufPeak = p.um * Math.sqrt(2 / 3);
    const crest = p.pu * ufPeak;
    const ratio = p.tTail / Math.max(0.001, p.tFront);
    return { ufPeak, ufRms: p.um / Math.sqrt(3), crest, ratio };
  },
  readings: (d, p) => {
    const cls = e01class(p);
    const test =
      cls === 'atmosférica'
        ? 'Impulso tipo rayo 1,2/50 µs (cresta)'
        : cls === 'maniobra'
          ? 'Impulso de maniobra 170–250/2500 µs (cresta)'
          : 'Frecuencia industrial (kV eficaces, no cresta)';
    return [
      { label: 'Cresta fase–tierra', value: `${fmt(d.crest, 1)} kV`, sub: `${fmt(p.pu, 2)} · Û_f`, tone: 'neutral' },
      { label: 'Base Û_f', value: `${fmt(d.ufPeak, 2)} kV`, sub: `Uₘ = ${fmt(p.um, 1)} kV` },
      { label: 'Clasificación', value: cls, sub: 'según frente y duración', tone: cls === 'atmosférica' ? 'warn' : cls === 'maniobra' ? 'ok' : 'bad' },
      { label: 'Ensayo comparable', value: test, sub: 'misma unidad y misma forma' },
      { label: 'Relación cola/frente', value: fmt(d.ratio, 0), sub: 'describe la forma, no la amplitud' },
    ];
  },
  equations: (p, d) => [
    `Û_f = √(2/3) · Uₘ = 0,8165 × ${fmt(p.um, 1)} = ${fmt(d.ufPeak, 2)} kV`,
    `U_cresta = ${fmt(p.pu, 2)} × ${fmt(d.ufPeak, 2)} = ${fmt(d.crest, 1)} kV`,
    `forma: frente ≈ ${fmt(p.tFront, p.tFront < 10 ? 1 : 0)} µs · cola ≈ ${fmt(p.tTail, 0)} µs → ${e01class(p)}`,
    'La amplitud en p.u. no clasifica la sobretensión: dos ondas de 2,5 p.u. pueden ser de maniobra o atmosféricas.',
  ],
  checks: (p, d) => [
    { label: 'Se compara en la unidad correcta', ok: true, detail: 'impulsos en cresta; frecuencia industrial en eficaces' },
    { label: 'La duración está declarada', ok: true, detail: `cola/frente = ${fmt(d.ratio, 0)}` },
    { label: 'El caso cabe en un ensayo normalizado', ok: e01class(p) !== 'temporal', detail: e01class(p) === 'temporal' ? 'las sobretensiones temporales no se reproducen con un impulso' : 'sí' },
  ],
  goals: [
    {
      id: 'g1',
      kind: 'exploracion',
      label: 'Configura una sobretensión de maniobra con frente entre 100 y 400 µs y cresta ≥ 500 kV',
      test: (p, d) => d.crest >= 500 && p.tFront >= 100 && p.tFront <= 400 && e01class(p) === 'maniobra',
      detail: (p, d) => `cresta ${fmt(d.crest, 1)} kV · frente ${fmt(p.tFront, 0)} µs`,
    },
    {
      id: 'g2',
      kind: 'exploracion',
      label: 'Muestra un rayo de frente ≤ 5 µs y cola ≤ 100 µs',
      test: (p) => p.tFront <= 5 && p.tTail <= 100,
      detail: (p) => `frente ${fmt(p.tFront, 1)} µs · cola ${fmt(p.tTail, 0)} µs`,
    },
  ],
  learn: {
    phenomenon:
      'Una sobretensión es una tensión que supera la referencia de operación. Lo que la hace peligrosa no es solo su cresta: también su tiempo de subida y cuánto dura.',
    objective:
      'Que puedas mirar una forma de onda y decir a qué grupo pertenece, qué ensayo la representa y en qué unidad se compara.',
    watch: [
      'La escena dibuja la misma cresta con frentes distintos: la de frente rápido casi no da tiempo de reaccionar.',
      'La gráfica de amplitud contra frente muestra las tres bandas y dónde cayó tu caso.',
      'La lectura «ensayo comparable» impide mezclar kV eficaces con kV de cresta.',
    ],
    misconception:
      'Creer que «2,5 p.u.» ya dice todo. Una maniobra de 2,5 p.u. y un rayo de 2,5 p.u. se parecen en altura y se ensayan distinto: 1,2/50 µs frente a 170–250/2500 µs.',
    model: 'La forma es una doble exponencial descriptiva: separa frente, cresta y cola; no modela propagación.',
  },
  sources: ['guion', 'slides', 'diana', 'iec60060'],
  notes: [
    'Frecuencia industrial en kV eficaces; impulsos tipo rayo y de maniobra en kV de cresta.',
    'IEC 60060-1:2025 expresa el impulso de maniobra como 170/2500 µs; textos anteriores usan 250/2500 µs con otra definición del frente.',
  ],
  scene: ({ p, t }) => {
    const cls = e01class(p);
    const col = FRONT_COLOR[cls];
    return (
      <SceneCanvas
        draw={(ctx, w, h) => {
          backdrop(ctx, w, h);
          corner(ctx, 'Osciloscopio', 'tensión fase–tierra');
          const x0 = 44;
          const y0 = h * 0.64;
          const ww = w - 88;
          const hh = h * 0.44;
          line(ctx, x0, y0, x0 + ww, y0, { color: 'rgba(160,210,225,0.35)' });
          line(ctx, x0, y0, x0, y0 - hh, { color: 'rgba(160,210,225,0.35)' });
          text(ctx, 't', x0 + ww, y0 + 14, { size: 10, color: C.muted });
          text(ctx, 'u', x0 - 18, y0 - hh / 2, { size: 10, color: C.muted });
          const tp = Math.max(4, p.tTail * 3);
          const norm = 1 - Math.exp(-2.2);
          ctx.save();
          ctx.strokeStyle = col;
          ctx.lineWidth = 2.2;
          ctx.shadowColor = col;
          ctx.shadowBlur = 10;
          ctx.beginPath();
          for (let i = 0; i <= 420; i++) {
            const tt = (i / 420) * tp;
            const v = Math.exp(-tt / p.tTail) * (1 - Math.exp(-tt / Math.max(0.25, p.tFront / 2.2)));
            const x = x0 + (tt / tp) * ww;
            const y = y0 - (v / norm) * hh;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.stroke();
          ctx.restore();
          const phase = (t % 4) / 4;
          circle(ctx, x0 + phase * ww, y0 - hh, 3, { fill: col });
          badge(ctx, `${fmt(p.pu * p.um * Math.sqrt(2 / 3), 1)} kV`, x0 + 6, y0 - hh - 12, col);
          text(ctx, cls.toUpperCase(), w - 16, 22, { size: 13, weight: 800, color: col, align: 'right' });
          text(ctx, `frente ${fmt(p.tFront, p.tFront < 10 ? 1 : 0)} µs`, w - 16, 40, { size: 10.5, color: C.muted, align: 'right' });
          text(ctx, 'escala de tiempo del barrido', x0, h - 14, { size: 9.5, color: C.muted });
        }}
        footer={
          <>
            <strong>{cls}</strong> · {p.tFront < 10 ? 'frente rápido' : p.tFront < 3000 ? 'frente lento' : 'frecuencia industrial'} · misma cresta no implica
            mismo esfuerzo
          </>
        }
      />
    );
  },
  plot: ({ p }) => {
    const pts: [number, number][] = linspace(0.5, 6000, 120).map((x) => [x, p.pu]);
    return (
      <Plot
        xDomain={[0.5, 6000]}
        yDomain={[1, 4]}
        xLog
        xLabel="tiempo de frente (µs, escala logarítmica)"
        yLabel="amplitud (p.u. de Û_f)"
        bands={[
          { x1: 0.5, x2: 20, color: 'rgba(183,155,255,0.10)', label: 'atmosférica' },
          { x1: 20, x2: 3000, color: 'rgba(255,200,87,0.10)', label: 'maniobra' },
          { x1: 3000, x2: 6000, color: 'rgba(255,107,107,0.10)', label: 'temporal' },
        ]}
        series={[{ pts, color: 'rgba(56,225,198,0.35)', width: 1.2, dash: '4 4' }]}
        markers={[{ x: p.tFront, y: p.pu, color: FRONT_COLOR[e01class(p)], label: 'tu caso' }]}
        caption="La altura es la amplitud; la posición horizontal, el frente. Para comparar con un ensayo hay que leer las dos coordenadas."
      />
    );
  },
};

/* =============================== e02 =============================== */

const e02: Experiment = {
  id: 'e02',
  topicId: 2,
  title: 'De entre fases a fase–tierra (y de eficaz a cresta)',
  tagline: 'La conversión que hay detrás de casi todos los ejemplos',
  why: 'Evitar el error más común del curso: comparar una tensión entre fases en kV eficaces con un impulso en kV de cresta.',
  params: [{ id: 'um', label: 'Tensión máxima entre fases Uₘ', unit: 'kV eficaces', min: 72.5, max: 420, step: 0.5, def: 245 }],
  presets: [
    { id: 'curso', label: '245 kV (ejemplo del curso)', values: { um: 245 } },
    { id: '230', label: 'Sistema de 230 kV (Uₘ = 245 kV)', values: { um: 245 } },
    { id: '115', label: 'Sistema de 115 kV (Uₘ = 123 kV)', values: { um: 123 } },
    { id: '500', label: 'Sistema de 500 kV (Uₘ = 550 kV)', values: { um: 420 } },
  ],
  compute: (p) => {
    const uf = p.um / Math.sqrt(3);
    const up = p.um * Math.sqrt(2 / 3);
    return { uf, up, factor: up / uf, ratioUm: p.um / uf };
  },
  readings: (d, p) => [
    { label: 'Tensión fase–tierra eficaz', value: `${fmt(d.uf, 2)} kV`, sub: `Uₘ/√3 con Uₘ = ${fmt(p.um, 1)} kV`, tone: 'ok' },
    { label: 'Cresta fase–tierra', value: `${fmt(d.up, 2)} kV`, sub: 'valor de cresta, no eficaz', tone: 'warn' },
    { label: 'Relación cresta/eficaz', value: fmt(d.factor, 3), sub: '√2 en senoide ideal' },
    { label: 'Relación Uₘ/U_f', value: fmt(d.ratioUm, 3), sub: '√3 del sistema equilibrado' },
  ],
  equations: (p, d) => [
    `U_f = Uₘ/√3 = ${fmt(p.um, 1)}/1,7321 = ${fmt(d.uf, 2)} kV eficaces`,
    `Û_f = √2 · U_f = ${fmt(d.up, 2)} kV de cresta`,
    `Û_f = √(2/3) · Uₘ = 0,8165 × ${fmt(p.um, 1)} = ${fmt(d.up, 2)} kV`,
    'Una falla a tierra cambia las tensiones de las fases sanas: esto vale para la condición equilibrada previa.',
  ],
  goals: [
    {
      id: 'g1',
      kind: 'exploracion',
      label: 'Reproduce el caso del curso: Uₘ = 245 kV → 141,5 kV eficaces y 200,0 kV de cresta',
      test: (_p, d) => Math.abs(d.uf - 141.45) < 0.4 && Math.abs(d.up - 200.04) < 0.5,
      detail: (_p, d) => `U_f = ${fmt(d.uf, 2)} kV · Û_f = ${fmt(d.up, 2)} kV`,
    },
    {
      id: 'g2',
      label: 'Encuentra un Uₘ tal que la cresta fase–tierra quede entre 190 y 200 kV',
      test: (_p, d) => d.up >= 190 && d.up <= 200,
      detail: (_p, d) => `Û_f = ${fmt(d.up, 2)} kV`,
    },
  ],
  learn: {
    phenomenon:
      'En una red trifásica equilibrada, la tensión entre fase y tierra es la entre fases dividida por √3, y su cresta es √2 veces ese valor.',
    objective:
      'Manejar con soltura las dos conversiones y declarar siempre qué tensión usas: entre fases o fase–tierra, eficaz o cresta.',
    watch: [
      'La escena muestra los tres fasores girando y la senoide de una fase con sus dos niveles.',
      'La gráfica marca el valor eficaz y la cresta sobre la misma onda: no son intercambiables.',
      'Las lecturas separan «eficaz» de «cresta» con colores distintos.',
    ],
    misconception:
      'Multiplicar por √2 una tensión que ya era entre fases, o comparar 200 kV de cresta con 245 kV eficaces. Primero se pasa a fase–tierra; después, a cresta.',
    model: 'Sistema sinusoidal equilibrado antes de la falla. No incluye desbalance ni sobretensiones temporales.',
  },
  sources: ['guion', 'slides', 'cardona'],
  scene: ({ p, t }) => (
    <SceneCanvas
      draw={(ctx, w, h) => {
        backdrop(ctx, w, h);
        corner(ctx, 'Sistema equilibrado', 'fasores y senoide de fase');
        const cx = w * 0.25;
        const cy = h * 0.52;
        const R = Math.min(w, h) * 0.26;
        const rot = (t * 0.35) % (Math.PI * 2);
        for (let k = 0; k < 3; k++) {
          const a = rot + (k * 2 * Math.PI) / 3;
          const col = [C.phase, C.amber, C.accent][k];
          arrow(ctx, cx, cy, cx + Math.cos(a) * R, cy - Math.sin(a) * R, col, 2);
          text(ctx, ['a', 'b', 'c'][k], cx + Math.cos(a) * (R + 14), cy - Math.sin(a) * (R + 14), { size: 11, color: col, align: 'center', mono: true });
        }
        circle(ctx, cx, cy, 3, { fill: C.muted });
        const x0 = w * 0.48;
        const ww = w * 0.46;
        const y0 = h * 0.54;
        const amp = h * 0.3;
        line(ctx, x0, y0, x0 + ww, y0, { color: 'rgba(160,210,225,0.28)' });
        ctx.save();
        ctx.strokeStyle = C.phase;
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let i = 0; i <= 220; i++) {
          const u = i / 220;
          const x = x0 + u * ww;
          const y = y0 - Math.sin(u * Math.PI * 2 * 2.4 + t * 2) * amp * 0.8;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
        ctx.restore();
        const yrms = y0 - amp * 0.8 * Math.SQRT1_2;
        const ypk = y0 - amp * 0.8;
        line(ctx, x0, yrms, x0 + ww, yrms, { color: C.accent, dash: [5, 4] });
        line(ctx, x0, ypk, x0 + ww, ypk, { color: C.amber, dash: [5, 4] });
        dimension(ctx, x0 + ww * 0.7, y0, x0 + ww * 0.7, yrms, `${fmt(p.um / Math.sqrt(3), 1)} kV eficaz`, C.accent);
        dimension(ctx, x0 + ww * 0.88, yrms, x0 + ww * 0.88, ypk, `${fmt(p.um * (Math.SQRT2 - 1) / Math.sqrt(3), 1)} kV`, C.amber);
        text(ctx, `Uₘ = ${fmt(p.um, 1)} kV entre fases`, x0, h - 16, { size: 10.5, color: C.muted });
      }}
      footer="La senoide es de fase–tierra; la tensión entre fases es √3 veces mayor."
    />
  ),
  plot: ({ p }) => {
    const uf = p.um / Math.sqrt(3);
    const pts: [number, number][] = linspace(0, 40, 240).map((ms) => [ms, uf * Math.SQRT2 * Math.sin((2 * Math.PI * 50 * ms) / 1000)]);
    return (
      <Plot
        xDomain={[0, 40]}
        yDomain={[-uf * Math.SQRT2 * 1.1, uf * Math.SQRT2 * 1.1]}
        xLabel="tiempo (ms)"
        yLabel="tensión fase–tierra (kV)"
        series={[{ pts, color: C.phase }]}
        refs={[
          { at: uf, label: `${fmt(uf, 2)} kV eficaz`, color: C.accent },
          { at: -uf, color: C.accent, dash: '2 4' },
          { at: uf * Math.SQRT2, label: `${fmt(uf * Math.SQRT2, 2)} kV cresta`, color: C.amber },
        ]}
        caption="La línea eficaz está √2 veces por debajo de la cresta. La cresta ocurre dos veces por ciclo."
      />
    );
  },
};

/* =============================== e03 =============================== */

const e03: Experiment = {
  id: 'e03',
  topicId: 2,
  title: 'La forma 1,2/50 µs no son dos constantes de tiempo',
  tagline: 'Frente, cola y origen virtual medidos sobre la onda',
  why: 'Entender qué significan los dos números de una onda normalizada y por qué no son τ₁ y τ₂.',
  params: [
    { id: 'amp', label: 'Cresta del impulso', unit: 'kV', min: 200, max: 1600, step: 10, def: 1050 },
    { id: 'tau1', label: 'Constante rápida τ₁', unit: 'µs', min: 0.1, max: 2, step: 0.01, def: 0.41 },
    { id: 'tau2', label: 'Constante lenta τ₂', unit: 'µs', min: 10, max: 120, step: 0.5, def: 66 },
  ],
  presets: [
    { id: 'rayo', label: 'Impulso rayo 1,2/50 µs (1050 kV)', values: { amp: 1050, tau1: 0.41, tau2: 66 } },
    { id: 'curso', label: 'Ejemplo del curso (0,41 / 66 µs)', values: { amp: 1050, tau1: 0.41, tau2: 66 } },
    { id: 'mal', label: 'Forma parecida pero mal ajustada', values: { amp: 1050, tau1: 1.5, tau2: 30 } },
  ],
  compute: (p) => {
    const m = impulseMetrics(p.tau1, p.tau2);
    return { tau1: m.tau1, tau2: m.tau2, tp: m.tp, t30: m.t30, t90: m.t90, t1: m.t1, t0: m.t0, t2: m.t2, amp: p.amp };
  },
  readings: (d, p) => [
    {
      label: 'Frente t₁ = 1,67(t₉₀−t₃₀)',
      value: `${fmt(d.t1, 2)} µs`,
      sub: `t₃₀ = ${fmt(d.t30, 2)} · t₉₀ = ${fmt(d.t90, 2)} µs`,
      tone: Math.abs(d.t1 - 1.2) <= 0.15 ? 'ok' : 'warn',
    },
    {
      label: 'Semiamplitud t₂',
      value: `${fmt(d.t2, 2)} µs`,
      sub: `origen virtual t₀ = ${fmt(d.t0, 2)} µs`,
      tone: Math.abs(d.t2 - 50) <= 5 ? 'ok' : 'warn',
    },
    { label: 'Etiqueta de la onda', value: impulseMetrics(p.tau1, p.tau2).label, sub: 'redondeo convencional del ensayo' },
    { label: 'Instante de cresta', value: `${fmt(d.tp, 2)} µs`, sub: `cresta ${fmt(d.amp, 0)} kV` },
    { label: 'Constantes del modelo', value: `τ₁ = ${fmt(d.tau1, 2)} · τ₂ = ${fmt(d.tau2, 1)} µs`, sub: 'no son 1,2 ni 50' },
  ],
  equations: (p, d) => [
    `v(t) = ${fmt(p.amp, 0)}·(e^(−t/${fmt(p.tau2, 1)}) − e^(−t/${fmt(p.tau1, 2)})) normalizada a la cresta`,
    `t₃₀ = ${fmt(d.t30, 2)} µs · t₉₀ = ${fmt(d.t90, 2)} µs`,
    `t₁ = 1,67·(t₉₀ − t₃₀) = ${fmt(d.t1, 2)} µs`,
    `t₀ = ${fmt(d.t0, 2)} µs · t₂ = t₅₀ − t₀ = ${fmt(d.t2, 2)} µs`,
    `etiqueta resultante: ${impulseMetrics(p.tau1, p.tau2).label}`,
  ],
  checks: (_p, d) => [
    { label: 'Frente dentro de ±0,15 µs de 1,2 µs', ok: Math.abs(d.t1 - 1.2) <= 0.15, detail: `${fmt(d.t1, 2)} µs` },
    { label: 'Cola dentro de ±5 µs de 50 µs', ok: Math.abs(d.t2 - 50) <= 5, detail: `${fmt(d.t2, 2)} µs` },
  ],
  goals: [
    {
      id: 'g1',
      label: 'Ajusta τ₁ y τ₂ para obtener una onda 1,2/50 µs (frente ±0,15 µs, cola ±5 µs)',
      test: (_p, d) => Math.abs(d.t1 - 1.2) <= 0.15 && Math.abs(d.t2 - 50) <= 5,
      detail: (_p, d) => `t₁ = ${fmt(d.t1, 2)} µs · t₂ = ${fmt(d.t2, 2)} µs`,
    },
  ],
  learn: {
    phenomenon:
      'Un impulso de ensayo se describe por el tiempo de frente (30–90 %) y el tiempo hasta la semiamplitud en la cola, medidos desde un origen virtual.',
    objective:
      'Leer una onda normalizada y distinguir «etiqueta del ensayo» de «constantes del modelo»; además, no confundir 1,2/50 µs de tensión con 8/20 µs de corriente.',
    watch: [
      'Los puntos del 30 % y 90 % y la recta que los une: su cruce por cero es el origen virtual.',
      'La gráfica marca t₃₀, t₉₀, la tangente y la semiamplitud de la cola.',
      'Cambia τ₂: t₁ apenas se mueve, pero la cola cambia mucho.',
    ],
    misconception: 'Suponer que 1,2 y 50 son las constantes exponenciales. Son tiempos convencionales deducidos de la forma.',
    model: 'Doble exponencial ideal. La onda real tiene tolerancias y puede oscilar; el origen virtual se obtiene de la recta 30–90 %.',
  },
  sources: ['guion', 'slides', 'iec60060', 'ejercicios'],
  notes: ['La guía de ejercicios reporta 49,3 µs en la versión 1 por la expresión del origen virtual; aquí se aplica la definición completa (≈48,5 µs).'],
  scene: ({ p, t }) => {
    const m = impulseMetrics(p.tau1, p.tau2);
    return (
      <SceneCanvas
        draw={(ctx, w, h) => {
          backdrop(ctx, w, h);
          corner(ctx, 'Generador de impulso', 'onda de tensión normalizada');
          const x0 = 46;
          const y0 = h * 0.76;
          const ww = w - 92;
          const hh = h * 0.56;
          const tMax = Math.max(20, p.tau2 * 1.6);
          line(ctx, x0, y0, x0 + ww, y0, { color: 'rgba(160,210,225,0.3)' });
          line(ctx, x0, y0, x0, y0 - hh, { color: 'rgba(160,210,225,0.3)' });
          const sweep = ((t * 0.5) % 1.25) * tMax;
          ctx.save();
          ctx.strokeStyle = C.accent;
          ctx.lineWidth = 2.4;
          ctx.shadowColor = C.accent;
          ctx.shadowBlur = 8;
          ctx.beginPath();
          for (let i = 0; i <= 300; i++) {
            const tt = (i / 300) * tMax;
            if (tt > sweep) break;
            const v = impulseShape(tt, p.tau1, p.tau2);
            const x = x0 + (tt / tMax) * ww;
            const y = y0 - v * hh;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.stroke();
          ctx.restore();
          const marks: [number, string, string][] = [
            [m.t30, '30 %', C.phase],
            [m.t90, '90 %', C.phase],
            [m.tp, 'cresta', C.amber],
          ];
          for (const [tt, lab, col] of marks) {
            const x = x0 + (Math.min(tt, tMax) / tMax) * ww;
            line(ctx, x, y0, x, y0 - hh * 0.95, { color: col, dash: [3, 4], alpha: 0.6 });
            text(ctx, lab, x, y0 + 13, { size: 9.5, color: col, align: 'center', mono: true });
          }
          dimension(ctx, x0 + ww * 0.05, y0 - hh * 0.92, x0 + ww * 0.05, y0, `${fmt(p.amp, 0)} kV`, C.amber);
          text(ctx, m.label, w - 16, 22, { size: 14, weight: 800, color: C.accent, align: 'right' });
          text(ctx, 'τ₁ y τ₂ no son los números de la etiqueta', x0, h - 12, { size: 10, color: C.muted });
        }}
        footer="La traza se dibuja con el barrido; el origen virtual está a la izquierda del inicio visible."
      />
    );
  },
  plot: ({ p }) => {
    const m = impulseMetrics(p.tau1, p.tau2);
    const pts: [number, number][] = linspace(0, Math.max(20, p.tau2 * 1.5), 260).map((x) => [x, impulseShape(x, p.tau1, p.tau2) * p.amp]);
    const slope = (0.9 - 0.3) / Math.max(1e-6, m.t90 - m.t30);
    const tang: [number, number][] = linspace(Math.max(0, m.t0), m.t90, 20).map((x) => [x, slope * (x - m.t0) * p.amp]);
    return (
      <Plot
        xDomain={[0, Math.max(20, p.tau2 * 1.5)]}
        yDomain={[0, p.amp * 1.08]}
        xLabel="tiempo desde el inicio de la onda (µs)"
        yLabel="tensión (kV)"
        series={[
          { pts, color: C.accent, width: 2.2 },
          { pts: tang, color: C.phase, dash: '5 4', width: 1.4 },
        ]}
        markers={[
          { x: m.t30, y: 0.3 * p.amp, color: C.phase, label: '30 %' },
          { x: m.t90, y: 0.9 * p.amp, color: C.phase, label: '90 %' },
          { x: m.tp, y: p.amp, color: C.amber, label: 'cresta' },
          { x: m.t0, y: 0, color: C.muted, shape: 'cross', label: 'origen virtual' },
        ]}
        refs={[{ at: 0.5 * p.amp, label: '50 % en la cola', color: C.violet }]}
        caption={`t₁ = 1,67(t₉₀−t₃₀) = ${fmt(m.t1, 2)} µs · t₂ = ${fmt(m.t2, 2)} µs · origen virtual ${fmt(m.t0, 2)} µs.`}
      />
    );
  },
};

export const overvoltageExperiments: Experiment[] = [e01, e02, e03];
