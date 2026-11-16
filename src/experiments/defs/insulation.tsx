import {
  airDensity,
  cfoFromInsulators,
  cfoRequired,
  clamp,
  creepageRequired,
  densityCorrected,
  fmt,
  insulatorsFromCfo,
  linspace,
  pressureAt,
  switchingSupport,
} from '../../lib/num';
import { C, arrow, backdrop, badge, circle, dimension, line, text, tower } from '../../lib/draw';
import { Plot, SceneCanvas } from '../../components/ui';
import type { Experiment } from '../types';
import { corner } from '../common';

/* =============================== e07 =============================== */

const e07: Experiment = {
  id: 'e07',
  topicId: 5,
  title: 'Altitud y temperatura: el aire de Bogotá no es el del mar',
  tagline: 'Densidad relativa y corrección de la tensión soportada',
  why: 'Cuantificar cuánto pierde un aislamiento externo cuando sube la altitud y por qué el aislamiento interno no se corrige igual.',
  params: [
    { id: 'h', label: 'Altitud sobre el nivel del mar', unit: 'm', min: 0, max: 4000, step: 10, def: 2640 },
    { id: 'temp', label: 'Temperatura ambiente', unit: '°C', min: 0, max: 35, step: 0.5, def: 14 },
    { id: 'n', label: 'Exponente de corrección n', unit: '', min: 0.5, max: 1, step: 0.05, def: 0.75, help: 'Depende del tipo de aislamiento, la geometría y la norma aplicable.' },
    { id: 'uref', label: 'Tensión soportada de referencia (nivel del mar)', unit: 'kV', min: 400, max: 1400, step: 10, def: 700 },
  ],
  presets: [
    { id: 'bogota', label: 'Bogotá (2 640 m, 14 °C)', values: { h: 2640, temp: 14, n: 0.75, uref: 700 } },
    { id: 'mar', label: 'Nivel del mar (0 m, 30 °C)', values: { h: 0, temp: 30, n: 0.75, uref: 700 } },
    { id: 'reto', label: 'Reto de la guía (δ 0,80–0,82)', values: { h: 1750, temp: 20, n: 0.75, uref: 700 } },
    { id: 'frio', label: 'Páramo (3 200 m, 5 °C)', values: { h: 3200, temp: 5, n: 0.75, uref: 700 } },
  ],
  compute: (p) => {
    const pressure = pressureAt(p.h);
    const delta = airDensity(p.h, p.temp);
    const corrected = densityCorrected(p.uref, delta, p.n);
    return { pressure, delta, corrected, loss: 1 - corrected / p.uref, internal: p.uref };
  },
  readings: (d, p) => [
    { label: 'Presión atmosférica', value: `${fmt(d.pressure, 2)} kPa`, sub: 'modelo barométrico' },
    { label: 'Densidad relativa δ', value: fmt(d.delta, 3), sub: 'p/p₀ · T₀/T', tone: d.delta < 0.8 ? 'warn' : 'ok' },
    { label: 'Tensión soportada corregida', value: `${fmt(d.corrected, 1)} kV`, sub: `U_ref · δ^${fmt(p.n, 2)}`, tone: 'neutral' },
    { label: 'Pérdida de capacidad', value: `${fmt(d.loss * 100, 1)} %`, sub: 'solo aislamiento externo', tone: d.loss > 0.15 ? 'bad' : 'warn' },
    { label: 'Aislamiento interno', value: `${fmt(d.internal, 0)} kV`, sub: 'sellado: no se corrige igual', tone: 'ok' },
  ],
  equations: (p, d) => [
    `p(h) ≈ 101,325·(1 − 2,25577×10⁻⁵·h)^5,25588 = ${fmt(d.pressure, 2)} kPa`,
    `δ = (p/p₀)·(T₀/T) = (${fmt(d.pressure, 2)}/101,325)×(293,15/${fmt(p.temp + 273.15, 2)}) = ${fmt(d.delta, 3)}`,
    `U_h = U_ref·δ^n = ${fmt(p.uref, 0)} × ${fmt(d.delta, 3)}^${fmt(p.n, 2)} = ${fmt(d.corrected, 1)} kV`,
    'Aislamiento externo: se corrige. Aislamiento interno sellado: no se aplica el mismo factor.',
  ],
  checks: (p, d) => [
    { label: 'La corrección se aplica solo al aislamiento externo', ok: true, detail: 'no al equipo sellado' },
    { label: 'El exponente está declarado', ok: true, detail: `n = ${fmt(p.n, 2)}` },
    { label: 'La altitud es mayor a 1 000 m: la corrección es obligatoria', ok: p.h > 1000 ? d.delta < 0.98 : true, detail: p.h > 1000 ? 'aplicada' : 'no requerida' },
  ],
  goals: [
    {
      id: 'g1',
      label: 'Encuentra altitud y temperatura con δ entre 0,80 y 0,82 y U corregida ≥ 575 kV',
      test: (_p, d) => d.delta >= 0.8 && d.delta <= 0.82 && d.corrected >= 575,
      detail: (_p, d) => `δ = ${fmt(d.delta, 3)} · U = ${fmt(d.corrected, 1)} kV`,
    },
    {
      id: 'g2',
      kind: 'exploracion',
      label: 'Reproduce una condición de alta montaña: δ ≤ 0,75',
      test: (_p, d) => d.delta <= 0.75,
      detail: (_p, d) => `δ = ${fmt(d.delta, 3)}`,
    },
  ],
  learn: {
    phenomenon:
      'Al subir, la presión baja y el aire se vuelve menos denso; con menos moléculas por volumen, la avalancha se forma con más dificultad y el espacio de aire soporta menos tensión.',
    objective:
      'Calcular δ, corregir una tensión soportada y explicar por qué la corrección no se aplica igual al aislamiento interno de un equipo sellado.',
    watch: [
      'La escena compara la densidad de moléculas al nivel del mar y en la montaña: los puntos se separan.',
      'La gráfica muestra tres curvas de temperatura: a igual altitud, un día caluroso reduce aún más la densidad.',
      'La lectura «pérdida de capacidad» traduce δ a un porcentaje entendible.',
    ],
    misconception:
      'Aplicar el factor de altitud a todo el equipo, o usar δ como si fuera la tensión soportada. δ corrige el medio; el exponente y el alcance dependen de la norma.',
    model: 'Atmósfera estándar aproximada y exponente didáctico n. No incluye humedad, lluvia ni contaminación.',
  },
  sources: ['guion', 'slides', 'diana', 'cardona'],
  scene: ({ p, t }) => {
    const delta = airDensity(p.h, p.temp);
    return (
      <SceneCanvas
        draw={(ctx, w, h) => {
          backdrop(ctx, w, h);
          corner(ctx, 'Perfil de la línea', `h = ${fmt(p.h, 0)} m · δ = ${fmt(delta, 3)}`);
          // montaña
          ctx.save();
          ctx.fillStyle = 'rgba(60,90,80,0.4)';
          ctx.beginPath();
          ctx.moveTo(0, h * 0.9);
          ctx.lineTo(w * 0.2, h * 0.55);
          ctx.lineTo(w * 0.4, h * 0.78);
          ctx.lineTo(w * 0.7, h * 0.42);
          ctx.lineTo(w, h * 0.86);
          ctx.lineTo(w, h);
          ctx.lineTo(0, h);
          ctx.closePath();
          ctx.fill();
          ctx.restore();
          const groundY = h * 0.42 + (p.h / 4000) * h * 0.42;
          line(ctx, w * 0.62, groundY, w * 0.9, groundY, { color: C.earth, width: 2 });
          tower(ctx, w * 0.76, groundY, h * 0.3, { crossarms: [{ y: h * 0.25, half: w * 0.08 }] });
          // moléculas
          for (let i = 0; i < 70; i++) {
            const x = w * 0.06 + ((i * 37) % (w * 0.5));
            const y = h * 0.16 + ((i * 61) % (h * 0.6));
            const a = 0.15 + 0.55 * delta;
            circle(ctx, x + Math.sin(t * 0.6 + i) * 3, y, 1.5, { fill: `rgba(127,200,255,${a.toFixed(2)})` });
          }
          // comparación de soporte
          const barW = w * 0.16;
          const baseY = h * 0.14;
          text(ctx, 'soporte relativo', w - 20, baseY - 20, { size: 10, color: C.muted, align: 'right' });
          line(ctx, w - 20 - barW, baseY, w - 20, baseY, { color: 'rgba(160,210,225,0.4)' });
          line(ctx, w - 20 - barW, baseY - 8, w - 20, baseY - 8, { color: C.muted, width: 6, alpha: 0.4 });
          line(ctx, w - 20 - barW, baseY - 24, w - 20 - barW + barW * delta, baseY - 24, { color: C.accent, width: 6 });
          text(ctx, `δ = ${fmt(delta, 2)}`, w - 20, baseY - 36, { size: 10, color: C.accent, align: 'right', mono: true });
          text(ctx, `T = ${fmt(p.temp, 1)} °C`, 14, h - 14, { size: 10.5, color: C.muted });
          badge(ctx, `p = ${fmt(pressureAt(p.h), 1)} kPa`, w * 0.06, h * 0.1, C.phase);
        }}
        footer="Cada punto es una molécula de aire: con menos densidad, el mismo campo ioniza menos. El aislamiento externo pierde capacidad."
      />
    );
  },
  plot: ({ p }) => {
    const curve = (temp: number, color: string, dash?: string) => ({
      pts: linspace(0, 4000, 120).map((h) => [h, densityCorrected(p.uref, airDensity(h, temp), p.n)] as [number, number]),
      color,
      dash,
      width: 2,
    });
    return (
      <Plot
        xDomain={[0, 4000]}
        yDomain={[Math.max(300, p.uref * 0.5), p.uref * 1.05]}
        xLabel="altitud (m)"
        yLabel="tensión soportada corregida (kV)"
        series={[curve(0, C.phase), curve(15, C.accent), curve(30, C.amber)]}
        refs={[{ at: 575, label: 'objetivo 575 kV', color: C.bad }]}
        markers={[{ x: p.h, y: densityCorrected(p.uref, airDensity(p.h, p.temp), p.n), color: C.violet, label: 'tu caso' }]}
        caption="Tres temperaturas: 0 °C (azul), 15 °C (verde) y 30 °C (ámbar). La curva de mayor temperatura cae antes."
      />
    );
  },
};

/* =============================== e08 =============================== */

const e08: Experiment = {
  id: 'e08',
  topicId: 6,
  title: 'Fuga, contaminación y el número de discos',
  tagline: 'La distancia que recorre la corriente sobre la superficie',
  why: 'Distinguir distancia de fuga de distancia de arco y aplicar el criterio de contaminación sin equivocar la base de tensión.',
  params: [
    { id: 'um', label: 'Tensión máxima entre fases Uₘ', unit: 'kV', min: 72.5, max: 500, step: 0.5, def: 245 },
    { id: 'kf', label: 'Coeficiente de fuga k_f', unit: 'mm/kV', min: 12, max: 35, step: 1, def: 25, help: 'IEC: 16 insignificante · 20 medio · 25 fuerte · 31 muy fuerte.' },
    { id: 'base', label: 'Base del coeficiente', unit: '', min: 1, max: 2, step: 1, def: 1, options: [{ value: 1, label: 'entre fases (ejercicio del guion)' }, { value: 2, label: 'fase–tierra (IEC/Cardona)' }] },
    { id: 'altura', label: 'Corrección por altitud', unit: '', min: 0, max: 1, step: 1, def: 0, options: [{ value: 0, label: 'sin corregir' }, { value: 1, label: 'corregir con δ a 2 640 m' }] },
    { id: 'fuga', label: 'Fuga por unidad', unit: 'mm', min: 200, max: 450, step: 2, def: 292 },
    { id: 'paso', label: 'Paso de montaje', unit: 'm', min: 0.1, max: 0.2, step: 0.002, def: 0.146 },
  ],
  presets: [
    { id: 'curso', label: 'Ejemplo del curso (245 kV, 25 mm/kV)', values: { um: 245, kf: 25, base: 1, altura: 0, fuga: 292, paso: 0.146 } },
    { id: 'iec', label: 'Base fase–tierra con altitud (IEC)', values: { um: 245, kf: 25, base: 2, altura: 1, fuga: 292, paso: 0.146 } },
    { id: 'limpio', label: 'Zona limpia (16 mm/kV)', values: { um: 245, kf: 16, base: 2, altura: 0, fuga: 292, paso: 0.146 } },
    { id: 'costero', label: 'Zona muy contaminada (31 mm/kV)', values: { um: 245, kf: 31, base: 2, altura: 0, fuga: 292, paso: 0.146 } },
  ],
  compute: (p) => {
    const ka = p.altura === 1 ? airDensity(2640, 14) : 1;
    const required = creepageRequired(p.um, p.kf, p.base === 2 ? 2 : 1, ka);
    const nRaw = required / p.fuga;
    const n = Math.max(1, Math.ceil(nRaw));
    const real = n * p.fuga;
    const length = n * p.paso;
    const slack = real - required;
    return { ka, required, nRaw, n, real, length, slack };
  },
  readings: (d, p) => [
    { label: 'Fuga requerida', value: `${fmt(d.required, 0)} mm`, sub: `${fmt(p.kf, 0)} mm/kV · base ${p.base === 2 ? 'fase–tierra' : 'entre fases'} · k_a = ${fmt(d.ka, 3)}`, tone: 'neutral' },
    { label: 'Unidades necesarias', value: `${fmt(d.n, 0)}`, sub: `${fmt(d.nRaw, 2)} → se redondea hacia arriba`, tone: 'ok' },
    { label: 'Fuga instalada', value: `${fmt(d.real, 0)} mm`, sub: `excedente ${fmt(d.slack, 0)} mm` },
    { label: 'Longitud aproximada', value: `${fmt(d.length, 3)} m`, sub: `${fmt(d.n, 0)} × ${fmt(p.paso, 3)} m` },
    { label: 'Distancia de arco en seco', value: 'no es la fuga', sub: 'camino directo entre extremos' },
  ],
  equations: (p, d) => [
    `L_f = k_f · U / (k_a · ${p.base === 2 ? '√3' : '1'}) = ${fmt(p.kf, 0)} × ${fmt(p.um, 1)} / (${fmt(d.ka, 3)} × ${p.base === 2 ? '1,7321' : '1'}) = ${fmt(d.required, 0)} mm`,
    `N = ⌈L_f / fuga_unidad⌉ = ⌈${fmt(d.required, 0)} / ${fmt(p.fuga, 0)}⌉ = ⌈${fmt(d.nRaw, 2)}⌉ = ${fmt(d.n, 0)}`,
    `L_cadena ≈ N · paso = ${fmt(d.n, 0)} × ${fmt(p.paso, 3)} = ${fmt(d.length, 3)} m`,
    'Cambiar la base del coeficiente no es un error de redondeo: cambia el resultado en √3. Hay que declarar la convención.',
  ],
  checks: (p, d) => [
    { label: 'La base de tensión está declarada', ok: true, detail: p.base === 2 ? 'fase–tierra (IEC)' : 'entre fases (ejercicio del guion)' },
    { label: 'El número de unidades es entero', ok: Number.isInteger(d.n), detail: `${fmt(d.n, 0)} discos` },
    { label: 'Se distingue fuga de arco y de longitud', ok: true, detail: 'tres magnitudes diferentes' },
    { label: 'Se verifica además maniobra, rayo y mecánica', ok: true, info: true, detail: 'este criterio solo cubre contaminación' },
  ],
  goals: [
    {
      id: 'g1',
      kind: 'exploracion',
      label: 'Reproduce el ejemplo del curso: 21 discos y 3,066 m de cadena',
      test: (p, d) => d.n === 21 && Math.abs(d.length - 3.066) < 0.002 && p.base === 1,
      detail: (p, d) => `N = ${fmt(d.n, 0)} · L = ${fmt(d.length, 3)} m · base ${p.base === 1 ? 'entre fases' : 'fase–tierra'}`,
    },
    {
      id: 'g2',
      label: 'Con la base fase–tierra y corrección por altitud, obtén 18 discos o menos',
      test: (p, d) => p.base === 2 && p.altura === 1 && d.n <= 18,
      detail: (_p, d) => `N = ${fmt(d.n, 0)} con k_a = ${fmt(d.ka, 3)}`,
    },
  ],
  learn: {
    phenomenon:
      'La contaminación depositada se vuelve conductora al humedecerse; la corriente superficial crea bandas secas y descargas parciales que pueden llevar al contorneo.',
    objective:
      'Calcular la fuga requerida, elegir el número de unidades y explicar por qué la base del coeficiente y la altitud cambian el resultado.',
    watch: [
      'La escena resalta el camino de fuga en zigzag sobre los faldones y la recta de arco: no miden lo mismo.',
      'La gráfica muestra cómo el número de discos salta en escalones al subir k_f.',
      'Cambia la base y observa el salto de 21 a 17 unidades: es el error de convención más costoso.',
    ],
    misconception:
      'Copiar «25 mm/kV» sin saber si se refiere a tensión entre fases o fase–tierra. Y creer que la cadena ya está lista: falta maniobra, rayo y mecánica.',
    model:
      'Criterio de fuga específica con k_a = δ. La selección real bajo contaminación requiere el procedimiento de IEC TS 60815 y datos del sitio.',
  },
  sources: ['guion', 'slides', 'cardona', 'iec60815', 'ejercicios'],
  notes: [
    'El ajuste del material [1] también permite estimar el número por maniobra; ese criterio se trabaja en el experimento e09.',
    'La guía de ejercicios advierte que la versión 1 usaba la tensión entre fases como base, igual que el ejercicio del guion.',
  ],
  scene: ({ p, d }) => (
    <SceneCanvas
      draw={(ctx, w, h) => {
        backdrop(ctx, w, h);
        corner(ctx, 'Cadena de suspensión', `${fmt(d.n, 0)} unidades · fuga ${fmt(d.real, 0)} mm`);
        const x = w * 0.5;
        const y = h * 0.12;
        const nShow = Math.min(d.n, 14);
        const st = ((h * 0.72) / Math.max(6, d.n)) * (d.n / nShow);
        line(ctx, x, y, x, y + st * nShow, { color: C.steel });
        for (let i = 0; i < nShow; i++) {
          const cy = y + st * (i + 0.5);
          ctx.save();
          ctx.strokeStyle = C.steel;
          ctx.fillStyle = 'rgba(180,205,220,0.28)';
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.ellipse(x, cy, w * 0.05, st * 0.22, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          ctx.restore();
          // banda de contaminación
          ctx.save();
          ctx.strokeStyle = 'rgba(200,170,120,0.5)';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.ellipse(x, cy + st * 0.1, w * 0.05, st * 0.08, 0, 0, Math.PI);
          ctx.stroke();
          ctx.restore();
        }
        // camino de fuga
        ctx.save();
        ctx.strokeStyle = C.accent;
        ctx.lineWidth = 2;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        for (let i = 0; i <= nShow * 4; i++) {
          const u = i / (nShow * 4);
          const yy = y + u * st * nShow;
          const xx = x + Math.sin(u * nShow * Math.PI * 2) * w * 0.048;
          if (i === 0) ctx.moveTo(xx, yy);
          else ctx.lineTo(xx, yy);
        }
        ctx.stroke();
        ctx.restore();
        // arco en seco
        line(ctx, x, y, x, y + st * nShow, { color: C.bad, width: 1.2, dash: [6, 5] });
        dimension(ctx, x + w * 0.16, y, x + w * 0.16, y + st * nShow, `${fmt(d.length, 2)} m`, C.amber);
        dimension(ctx, x - w * 0.16, y, x - w * 0.16, y + st * nShow, `${fmt(d.real / 1000, 2)} m fuga`, C.accent);
        badge(ctx, 'fuga (superficie)', w * 0.06, h * 0.2, C.accent);
        badge(ctx, 'arco en seco (aire)', w * 0.62, h * 0.2, C.bad);
        // gotas
        for (let i = 0; i < 12; i++) {
          const gx = x + Math.sin(i * 2.1) * w * 0.1;
          const gy = y + ((i * 37) % (st * nShow));
          circle(ctx, gx, gy, 1.6, { fill: 'rgba(127,200,255,0.6)' });
        }
        text(ctx, `k_f = ${fmt(p.kf, 0)} mm/kV · base ${p.base === 2 ? 'fase–tierra' : 'entre fases'}`, 14, h - 18, { size: 10.5, color: C.muted });
      }}
      footer="El zigzag es el camino real de la corriente sobre la superficie; la línea recta es el arco en seco. La longitud de la cadena es una tercera cosa."
    />
  ),
  plot: ({ p, d }) => {
    const pts: [number, number][] = [];
    for (let kf = 12; kf <= 35; kf += 0.2) {
      const req = creepageRequired(p.um, kf, p.base === 2 ? 2 : 1, p.altura === 1 ? airDensity(2640, 14) : 1);
      pts.push([kf, Math.max(1, Math.ceil(req / p.fuga))]);
    }
    return (
      <Plot
        xDomain={[12, 35]}
        yDomain={[0, Math.max(30, Math.max(...pts.map((q) => q[1])) + 3)]}
        xLabel="coeficiente de fuga k_f (mm/kV)"
        yLabel="unidades necesarias"
        series={[{ pts, color: C.accent, width: 2.2, steps: true }]}
        refs={[
          { at: 16, label: 'I', color: 'rgba(140,200,160,0.7)', dash: '2 5', axis: 'x' },
          { at: 20, label: 'II', color: 'rgba(200,200,140,0.7)', dash: '2 5', axis: 'x' },
          { at: 25, label: 'III', color: 'rgba(220,160,120,0.7)', dash: '2 5', axis: 'x' },
          { at: 31, label: 'IV', color: 'rgba(230,120,120,0.7)', dash: '2 5', axis: 'x' },
        ]}
        markers={[{ x: p.kf, y: Math.max(1, Math.ceil(d.required / p.fuga)), color: C.amber, label: `${fmt(d.n, 0)}` }]}
        caption="Escalones porque no se instalan fracciones de disco. Las líneas verticales marcan los cuatro niveles de contaminación de la tabla IEC del material."
      />
    );
  },
};

/* =============================== e09 =============================== */

const e09: Experiment = {
  id: 'e09',
  topicId: 6,
  title: 'La cadena también se dimensiona por maniobra',
  tagline: 'CFO requerido, dispersión y el criterio que manda',
  why: 'Aplicar el método del CFO con σ = 6 % y comparar el resultado con el criterio de contaminación.',
  params: [
    { id: 'um', label: 'Tensión máxima entre fases Uₘ', unit: 'kV', min: 72.5, max: 500, step: 0.5, def: 245 },
    { id: 'fv', label: 'Factor de sobretensión F_v', unit: 'p.u.', min: 1.5, max: 4, step: 0.05, def: 2.5 },
    { id: 'fs', label: 'Factor de seguridad F_s', unit: '', min: 1, max: 1.3, step: 0.01, def: 1.15 },
    { id: 'k', label: 'Desviaciones k (probabilidad de flameo)', unit: 'σ', min: 0, max: 3, step: 0.05, def: 1.3, help: '10 % → k ≈ 1,3 · 1 % → k ≈ 2,33.' },
    { id: 'sigma', label: 'Desviación estándar σ', unit: '% de CFO', min: 2, max: 10, step: 0.5, def: 6 },
    { id: 'h', label: 'Altitud del sitio', unit: 'm', min: 0, max: 4000, step: 10, def: 0 },
    { id: 'kf', label: 'Coeficiente de fuga k_f (para comparar)', unit: 'mm/kV', min: 12, max: 35, step: 1, def: 25 },
    { id: 'adicional', label: 'Discos adicionales de margen', unit: '', min: 0, max: 2, step: 1, def: 0, options: [{ value: 0, label: 'ninguno' }, { value: 1, label: '+1 suspensión' }, { value: 2, label: '+2 amarre' }] },
  ],
  presets: [
    { id: 'curso', label: 'Ejemplo del curso (245 kV, 2,5 p.u., 10 %)', values: { um: 245, fv: 2.5, fs: 1.15, k: 1.3, sigma: 6, h: 0, kf: 25, adicional: 0 } },
    { id: 'riesgo1', label: 'Exigir 1 % de flameo (k = 2,33)', values: { um: 245, fv: 2.5, fs: 1.15, k: 2.33, sigma: 6, h: 0, kf: 25, adicional: 0 } },
    { id: 'bogota', label: 'Misma línea a 2 640 m', values: { um: 245, fv: 2.5, fs: 1.15, k: 1.3, sigma: 6, h: 2640, kf: 25, adicional: 0 } },
  ],
  compute: (p) => {
    const delta = airDensity(p.h, (p.h / 1000) * -6.5 + 20);
    const uSupport = switchingSupport(p.um, p.fv, p.fs);
    const cfoReq = cfoRequired(p.um, p.fv, p.fs, p.k, p.sigma, delta, 1);
    const nIdeal = insulatorsFromCfo(cfoReq);
    const nMan = Math.max(1, Math.ceil(nIdeal));
    const fugaReq = creepageRequired(p.um, p.kf, 1, 1);
    const nFuga = Math.max(1, Math.ceil(fugaReq / 292));
    const nFinal = Math.max(nMan, nFuga) + p.adicional;
    const cfoString = cfoFromInsulators(nFinal);
    return { delta, uSupport, cfoReq, nIdeal, nMan, fugaReq, nFuga, nFinal, cfoString };
  },
  readings: (d, p) => [
    { label: 'Tensión de soporte requerida', value: `${fmt(d.uSupport, 2)} kV cresta`, sub: `F_s·F_v·Û_f = ${fmt(p.fs, 2)}·${fmt(p.fv, 2)}·${fmt(p.um * Math.sqrt(2 / 3), 1)}`, tone: 'ok' },
    { label: 'CFO requerido (sea level)', value: `${fmt(d.cfoReq, 1)} kV`, sub: `U_soporte/(1 − ${fmt(p.k, 2)}·σ)`, tone: 'warn' },
    { label: 'Discos por maniobra', value: `${fmt(d.nMan, 0)}`, sub: `${fmt(d.nIdeal, 2)} equivalentes → entero superior` },
    { label: 'Discos por contaminación', value: `${fmt(d.nFuga, 0)}`, sub: `k_f = ${fmt(p.kf, 0)} mm/kV, 292 mm por unidad` },
    { label: 'Cadena final', value: `${fmt(d.nFinal, 0)} discos`, sub: `manda ${d.nMan >= d.nFuga ? 'maniobra' : 'contaminación'}`, tone: 'ok' },
    { label: 'CFO de la cadena instalada', value: `${fmt(d.cfoString, 0)} kV`, sub: 'según el ajuste del material', tone: d.cfoString >= d.cfoReq ? 'ok' : 'bad' },
  ],
  equations: (p, d) => [
    `U_soporte = F_s·F_v·√(2/3)·Uₘ = ${fmt(p.fs, 2)} × ${fmt(p.fv, 2)} × 0,8165 × ${fmt(p.um, 1)} = ${fmt(d.uSupport, 2)} kV`,
    `CFO_req = U_soporte / (1 − k·σ) = ${fmt(d.uSupport, 2)} / (1 − ${fmt(p.k, 2)}×${fmt(p.sigma / 100, 3)}) = ${fmt(d.cfoReq, 1)} kV`,
    `CFO_corregido = CFO_req / δ^n = ${fmt(d.cfoReq, 1)} / ${fmt(d.delta, 3)} = ${fmt(d.cfoReq / d.delta, 1)} kV`,
    `N_maniobra = ⌈ajuste CFO↔N⌉ = ⌈${fmt(d.nIdeal, 2)}⌉ = ${fmt(d.nMan, 0)} · N_fuga = ${fmt(d.nFuga, 0)} → N = ${fmt(d.nFinal, 0)}`,
    'El ajuste CFO–N es no lineal y solo válido hasta ~20 unidades: no es una regla de 60 kV por disco.',
  ],
  checks: (p, d) => [
    { label: 'La tensión de soporte se compara en cresta', ok: true, detail: `${fmt(d.uSupport, 1)} kV` },
    { label: 'El riesgo de flameo está declarado', ok: true, detail: `k = ${fmt(p.k, 2)} (${fmt(100 * (1 - 0.5 * (1 + erfApprox(p.k / Math.SQRT2))), 1)} % aprox.)` },
    { label: 'Se toma el criterio más exigente', ok: true, detail: `maniobra ${fmt(d.nMan, 0)} · fuga ${fmt(d.nFuga, 0)}` },
    { label: 'La altitud se aplicó al CFO', ok: d.delta > 0, detail: `δ = ${fmt(d.delta, 3)}` },
  ],
  goals: [
    {
      id: 'g1',
      kind: 'exploracion',
      label: 'Reproduce el caso del curso: U_soporte ≈ 575,1 kV y cadena final de 21 discos',
      test: (_p, d) => Math.abs(d.uSupport - 575.12) < 0.4 && d.nFinal === 21,
      detail: (_p, d) => `U_soporte = ${fmt(d.uSupport, 1)} kV · N = ${fmt(d.nFinal, 0)}`,
    },
    {
      id: 'g2',
      label: 'Exige 1 % de probabilidad de flameo (k ≈ 2,33) y observa el efecto en el CFO requerido',
      test: (p, d) => p.k >= 2.3 && d.cfoReq > 690,
      detail: (_p, d) => `CFO_req = ${fmt(d.cfoReq, 1)} kV con k = ${fmt(2.33, 2)}`,
    },
  ],
  learn: {
    phenomenon:
      'Una sobretensión de maniobra no rompe siempre el aislamiento: cada cadena tiene una distribución de CFO. El diseño elige la probabilidad de flameo admisible.',
    objective:
      'Calcular la tensión de soporte, el CFO requerido con dispersión, el número de unidades y decidir cuál criterio gobierna la cadena.',
    watch: [
      'La escena dibuja solo los discos que realmente se instalan y compara la barra de maniobra con la de contaminación.',
      'La gráfica CFO–N: la línea horizontal es el requisito; el cruce da las unidades necesarias.',
      'Sube k de 1,3 a 2,33: el CFO requerido crece y la cadena también.',
    ],
    misconception:
      'Usar una regla fija de kV por disco. El CFO de una cadena no es lineal y el criterio de maniobra suele ser menos exigente que el de contaminación en zonas sucias.',
    model:
      'Ajuste CFO–N del material [1], válido en su rango; δ aplicado con exponente 1. La selección real combina además rayo y mecánica.',
  },
  sources: ['guion', 'cardona', 'ejercicios', 'iec60071'],
  scene: ({ d }) => (
    <SceneCanvas
      draw={(ctx, w, h) => {
        backdrop(ctx, w, h);
        corner(ctx, 'Cadena dimensionada', `${fmt(d.nFinal, 0)} discos · CFO ${fmt(d.cfoString, 0)} kV`);
        const x = w * 0.34;
        const y = h * 0.14;
        const nShow = Math.min(12, d.nFinal);
        const span = h * 0.6;
        const st = span / nShow;
        line(ctx, x, y, x, y + st * nShow, { color: C.steel });
        for (let i = 0; i < nShow; i++) {
          const cy = y + st * (i + 0.5);
          ctx.save();
          ctx.strokeStyle = C.steel;
          ctx.fillStyle = 'rgba(180,205,220,0.3)';
          ctx.beginPath();
          ctx.ellipse(x, cy, w * 0.035, st * 0.24, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          ctx.restore();
        }
        if (d.nFinal > nShow) text(ctx, `+${fmt(d.nFinal - nShow, 0)}`, x, y + span + 14, { size: 10, color: C.muted, align: 'center', mono: true });
        dimension(ctx, x - w * 0.1, y, x - w * 0.1, y + span, `${fmt(d.nFinal, 0)} × paso`, C.amber);
        // barras de criterios
        const bx = w * 0.62;
        const maxN = Math.max(d.nMan, d.nFuga, 1);
        const barMax = w * 0.3;
        const bar = (yy: number, label: string, v: number, col: string) => {
          text(ctx, label, bx, yy - 12, { size: 10, color: C.muted });
          line(ctx, bx, yy, bx, yy, { color: col });
          ctx.save();
          ctx.fillStyle = col;
          ctx.fillRect(bx, yy - 8, (v / maxN) * barMax, 14);
          ctx.restore();
          text(ctx, `${fmt(v, 0)} discos`, bx + (v / maxN) * barMax + 8, yy - 1, { size: 10, color: col, mono: true });
        };
        bar(h * 0.32, 'contaminación', d.nFuga, C.phase);
        bar(h * 0.5, 'maniobra', d.nMan, C.amber);
        bar(h * 0.68, 'instalada', d.nFinal, C.accent);
        text(ctx, `δ = ${fmt(d.delta, 3)}`, bx, h * 0.85, { size: 10.5, color: C.muted, mono: true });
        text(ctx, `CFO_req = ${fmt(d.cfoReq, 0)} kV`, bx, h * 0.92, { size: 10.5, color: C.amber, mono: true });
      }}
      footer="La cadena se instala con el mayor de los criterios; los discos adicionales de suspensión o amarre son una práctica, no un cálculo."
    />
  ),
  plot: ({ p, d }) => {
    const pts: [number, number][] = linspace(1, 26, 120).map((n) => [n, cfoFromInsulators(n)]);
    return (
      <Plot
        xDomain={[0, 26]}
        yDomain={[0, Math.max(1600, d.cfoReq * 1.2)]}
        xLabel="número de aisladores"
        yLabel="CFO de la cadena (kV)"
        series={[{ pts, color: C.accent, width: 2.2 }]}
        refs={[{ at: d.cfoReq, label: `CFO requerido ${fmt(d.cfoReq, 0)} kV`, color: C.bad }]}
        markers={[{ x: d.nFinal, y: d.cfoString, color: C.amber, label: `${fmt(d.nFinal, 0)} discos` }]}
        caption={
          p.h > 0
            ? `La curva se desplaza al corregir por altitud; el requisito ya incluye δ = ${fmt(d.delta, 3)}.`
            : 'La curva CFO–N es no lineal: por eso no se puede extrapolar «tantos kV por disco».'
        }
      />
    );
  },
};

function erfApprox(x: number): number {
  const t = 1 / (1 + 0.3275911 * Math.abs(x));
  const y = 1 - ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x);
  return x >= 0 ? y : -y;
}

/* =============================== e10 =============================== */

const e10: Experiment = {
  id: 'e10',
  topicId: 7,
  title: 'El viento acerca la fase a la estructura',
  tagline: 'Oscilación de la cadena y distancia mínima real',
  why: 'Ver que la distancia de diseño en reposo no es la que existe cuando la cadena se inclina.',
  params: [
    { id: 'l', label: 'Longitud de la cadena', unit: 'm', min: 0.8, max: 6, step: 0.01, def: 3.066 },
    { id: 'theta', label: 'Inclinación por viento θ', unit: '°', min: 0, max: 55, step: 0.5, def: 30, help: 'Ángulo respecto de la vertical.' },
    { id: 'd0', label: 'Distancia horizontal en reposo', unit: 'm', min: 1.5, max: 6, step: 0.01, def: 3.5 },
    { id: 'dreq', label: 'Distancia requerida', unit: 'm', min: 1.2, max: 4, step: 0.01, def: 2.42, help: 'Valor del ejemplo del material: no es universal.' },
  ],
  presets: [
    { id: 'curso', label: 'Ejemplo del curso (3,066 m, 30°, 3,50 m)', values: { l: 3.066, theta: 30, d0: 3.5, dreq: 2.42 } },
    { id: 'viento', label: 'Viento fuerte (40°)', values: { l: 3.066, theta: 40, d0: 3.5, dreq: 2.42 } },
    { id: 'reto', label: 'Reto: cumplir la separación', values: { l: 3.066, theta: 20, d0: 3.5, dreq: 2.42 } },
  ],
  compute: (p) => {
    const theta = clamp(p.l * 0 + p.theta, 0, 90);
    const dx = p.l * Math.sin((theta * Math.PI) / 180);
    const dh = p.d0 - dx;
    const margin = dh - p.dreq;
    const thetaMax = (Math.asin(clamp((p.d0 - p.dreq) / p.l, -1, 1)) * 180) / Math.PI;
    return { dx, dh, margin, thetaMax, ok: margin >= 0 ? 1 : 0 };
  },
  readings: (d, p) => [
    { label: 'Desplazamiento horizontal Δx', value: `${fmt(d.dx, 3)} m`, sub: `L·sen θ = ${fmt(p.l, 3)}·sen ${fmt(p.theta, 1)}°` },
    { label: 'Distancia restante d_h', value: `${fmt(d.dh, 3)} m`, sub: `d₀ − Δx = ${fmt(p.d0, 2)} − ${fmt(d.dx, 3)}` },
    { label: 'Margen frente al requisito', value: `${fmt(d.margin, 3)} m`, sub: `requisito ${fmt(p.dreq, 2)} m`, tone: d.margin >= 0 ? 'ok' : 'bad' },
    { label: 'Ángulo máximo admisible', value: `${fmt(d.thetaMax, 1)}°`, sub: 'para esta geometría', tone: 'warn' },
    { label: 'Veredicto', value: d.ok ? 'cumple' : 'no cumple', sub: 'en el plano simplificado', tone: d.ok ? 'ok' : 'bad' },
  ],
  equations: (p, d) => [
    `Δx = L·sen θ = ${fmt(p.l, 3)} × sen(${fmt(p.theta, 1)}°) = ${fmt(d.dx, 3)} m`,
    `d_h = d₀ − Δx = ${fmt(p.d0, 2)} − ${fmt(d.dx, 3)} = ${fmt(d.dh, 3)} m`,
    `margen = d_h − d_req = ${fmt(d.dh, 3)} − ${fmt(p.dreq, 2)} = ${fmt(d.margin, 3)} m`,
    `θ_max = arcsen((d₀ − d_req)/L) = ${fmt(d.thetaMax, 1)}°`,
    'La geometría real es tridimensional: la distancia mínima puede ocurrir en otro punto de la cadena y del vano.',
  ],
  checks: (_p, d) => [
    { label: 'La distancia se evalúa con la cadena inclinada', ok: true, detail: `${fmt(d.dh, 2)} m` },
    { label: 'Se comparan magnitudes de la misma configuración', ok: true, detail: 'fase–estructura con fase–estructura' },
    { label: 'El requisito no es universal', ok: true, detail: 'depende del estudio y de la norma' },
  ],
  goals: [
    {
      id: 'g1',
      label: 'Logra que d_h ≥ 2,42 m sin pasar de 22° de inclinación',
      test: (p, d) => d.ok === 1 && p.theta <= 22,
      detail: (p, d) => `d_h = ${fmt(d.dh, 3)} m a ${fmt(p.theta, 1)}°`,
    },
  ],
  learn: {
    phenomenon:
      'La cadena de suspensión oscila con el viento: el conductor se acerca a la estructura y a las otras fases. La distancia que importa es la mínima durante la oscilación.',
    objective:
      'Calcular el desplazamiento, comparar con el requisito y encontrar un ángulo que cumpla; entender que el requisito es del estudio, no una constante.',
    watch: [
      'La cadena de la escena se inclina y la cota d_h se reduce en vivo.',
      'La gráfica de d_h contra θ cruza la línea del requisito: ese cruce es el ángulo máximo.',
      'La lectura «ángulo máximo admisible» da el límite exacto para esta geometría.',
    ],
    misconception:
      'Aprobar un reto por quedar dentro de un rango numérico aunque la distancia siga por debajo del requisito. Aquí el requisito manda: si está por debajo, no cumple.',
    model: 'Plano, cadena recta y desplazamiento solo horizontal. No incluye flecha del conductor, viento diferencial ni tercer dimensión.',
  },
  sources: ['guion', 'slides', 'velasco', 'ejercicios'],
  notes: ['La guía de ejercicios detectó que el reto de la versión 1 se aprobaba con 28° y 2,061 m, por debajo de los 2,42 m exigidos. En v2 el reto exige cumplir la distancia.'],
  scene: ({ p, d, t }) => (
    <SceneCanvas
      draw={(ctx, w, h) => {
        backdrop(ctx, w, h);
        corner(ctx, 'Torre y cadena de suspensión', 'viento transversal');
        const gy = h * 0.9;
        tower(ctx, w * 0.3, gy, h * 0.66, { crossarms: [{ y: h * 0.58, half: w * 0.2 }] });
        const ax = w * 0.3 + w * 0.2;
        const ay = gy - h * 0.58;
        const sway = Math.sin(t * 1.6) * 2;
        const ang = (p.theta + sway) * Math.PI / 180;
        const lx = ax + Math.sin(ang) * h * 0.5;
        const ly = ay + Math.cos(ang) * h * 0.5;
        line(ctx, ax, ay, lx, ly, { color: C.steel });
        for (let i = 0; i < 8; i++) {
          const u = (i + 0.5) / 8;
          const cx = ax + (lx - ax) * u;
          const cy = ay + (ly - ay) * u;
          ctx.save();
          ctx.strokeStyle = C.steel;
          ctx.fillStyle = 'rgba(180,205,220,0.35)';
          ctx.beginPath();
          ctx.ellipse(cx, cy, 7, 3, -ang, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          ctx.restore();
        }
        circle(ctx, lx, ly, 5, { fill: C.phase, stroke: C.phase });
        // fase en reposo (fantasma)
        const rx = ax + Math.sin(0) * h * 0.5;
        const ry = ay + Math.cos(0) * h * 0.5;
        circle(ctx, rx, ry, 4, { stroke: 'rgba(127,200,255,0.4)', width: 1.2 });
        line(ctx, rx, ry, rx, ry + 30, { color: 'rgba(127,200,255,0.25)', dash: [3, 4] });
        // viento
        for (let i = 0; i < 5; i++) {
          const y = h * 0.2 + i * 18;
          arrow(ctx, w * 0.06, y, w * 0.06 + 34 + Math.sin(t * 3 + i) * 6, y, 'rgba(127,200,255,0.5)', 1.2);
        }
        text(ctx, 'viento', w * 0.06, h * 0.16, { size: 10, color: C.muted });
        dimension(ctx, w * 0.3, gy - h * 0.58 + 8, lx, gy - h * 0.58 + 8, `d₀ = ${fmt(p.d0, 2)} m`, 'rgba(160,210,225,0.6)');
        dimension(ctx, w * 0.3, gy - h * 0.44, lx, gy - h * 0.44, `d_h = ${fmt(d.dh, 2)} m`, d.ok ? C.accent : C.bad);
        line(ctx, w * 0.3 + w * 0.2 + p.dreq * 30, gy - h * 0.5, w * 0.3 + w * 0.2 + p.dreq * 30, gy, { color: 'rgba(255,107,107,0.4)', dash: [4, 5] });
        badge(ctx, d.ok ? 'cumple' : 'no cumple', w - 90, 24, d.ok ? C.accent : C.bad);
        text(ctx, `θ = ${fmt(p.theta, 1)}°`, 14, h - 16, { size: 11, color: C.amber, mono: true });
      }}
      footer="La fase fantasma marca la posición en reposo; el viento reduce la distancia real a la estructura."
    />
  ),
  plot: ({ p }) => {
    const pts: [number, number][] = linspace(0, 55, 120).map((th) => [th, p.d0 - p.l * Math.sin((th * Math.PI) / 180)]);
    return (
      <Plot
        xDomain={[0, 55]}
        yDomain={[0, Math.max(p.d0, p.dreq) + 0.6]}
        xLabel="inclinación de la cadena θ (°)"
        yLabel="distancia horizontal restante d_h (m)"
        series={[{ pts, color: C.accent, width: 2.2 }]}
        refs={[{ at: p.dreq, label: `requisito ${fmt(p.dreq, 2)} m`, color: C.bad }]}
        markers={[{ x: p.theta, y: Math.max(0, p.d0 - p.l * Math.sin((p.theta * Math.PI) / 180)), color: dColor(p.dreq, p.d0 - p.l * Math.sin((p.theta * Math.PI) / 180)), label: 'tu caso' }]}
        caption="El cruce con la línea roja es el ángulo máximo. Pasado ese punto, la cadena ya no cumple la separación."
      />
    );
  },
};

function dColor(dreq: number, dh: number) {
  return dh >= dreq ? C.accent : C.bad;
}

/* =============================== e11 =============================== */

const e11: Experiment = {
  id: 'e11',
  topicId: 7,
  title: 'Separación entre fases: una fórmula de predimensionamiento',
  tagline: 'Vano, flecha y tensión: la geometría antes del diseño normativo',
  why: 'Aplicar la expresión empírica del material y compararla con un criterio normativo de distancia a estructura.',
  params: [
    { id: 'K', label: 'Coeficiente empírico K', unit: '', min: 0.5, max: 1, step: 0.01, def: 0.75 },
    { id: 'F', label: 'Flecha máxima F', unit: 'm', min: 1, max: 20, step: 0.1, def: 8 },
    { id: 'L', label: 'Longitud de cadena L', unit: 'm', min: 0.5, max: 6, step: 0.01, def: 3 },
    { id: 'Vn', label: 'Tensión nominal entre fases Vₙ', unit: 'kV', min: 66, max: 550, step: 1, def: 230 },
    { id: 'delta', label: 'Densidad relativa para el criterio NESC', unit: '', min: 0.6, max: 1, step: 0.01, def: 1 },
  ],
  presets: [
    { id: 'curso', label: 'Ejemplo del curso (K 0,75 · F 8 · L 3 · 230 kV)', values: { K: 0.75, F: 8, L: 3, Vn: 230, delta: 1 } },
    { id: 'bogota', label: 'Mismo caso corregido a δ = 0,74', values: { K: 0.75, F: 8, L: 3, Vn: 230, delta: 0.74 } },
  ],
  compute: (p) => {
    const demp = p.K * Math.sqrt(p.F + p.L) + p.Vn / 150;
    const vCorr = p.Vn / p.delta;
    const dnescIn = 3 + 0.2 * (vCorr - 8.7);
    const dnesc = (dnescIn * 0.0254) * 1.15;
    const req = Math.max(demp, dnesc);
    return { demp, dnesc, dnescIn, req, vCorr, governs: demp >= dnesc ? 1 : 0 };
  },
  readings: (d, p) => [
    { label: 'Separación empírica', value: `${fmt(d.demp, 3)} m`, sub: `K√(F+L) + Vₙ/150 = ${fmt(p.K, 2)}·√${fmt(p.F + p.L, 1)} + ${fmt(p.Vn, 0)}/150`, tone: 'neutral' },
    { label: 'Criterio conductor–estructura', value: `${fmt(d.dnesc, 3)} m`, sub: 'NESC 3 + 0,2(V−8,7) pulgadas × 1,15', tone: 'neutral' },
    { label: 'Distancia de diseño', value: `${fmt(d.req, 3)} m`, sub: `manda ${d.governs ? 'la fórmula empírica' : 'el criterio normativo'}`, tone: 'ok' },
    { label: 'Tensión corregida V/δ', value: `${fmt(d.vCorr, 1)} kV`, sub: 'altitud incluida en el criterio NESC' },
  ],
  equations: (p, d) => [
    `D ≈ K√(F + L) + Vₙ/150 = ${fmt(p.K, 2)}·√(${fmt(p.F, 1)} + ${fmt(p.L, 2)}) + ${fmt(p.Vn, 0)}/150 = ${fmt(d.demp, 3)} m`,
    `NESC: D = 3 + 0,2·(V/δ − 8,7) = ${fmt(d.dnescIn, 2)} pulg = ${fmt(d.dnescIn * 0.0254, 3)} m; × 1,15 = ${fmt(d.dnesc, 3)} m`,
    `D_diseño = máx(${fmt(d.demp, 2)}, ${fmt(d.dnesc, 2)}) = ${fmt(d.req, 2)} m`,
    'La expresión empírica incorpora las unidades de su metodología: no cambies unidades sin ajustar el coeficiente.',
  ],
  checks: () => [
    { label: 'El resultado es de predimensionamiento', ok: true, detail: 'no reemplaza el diseño normativo' },
    { label: 'Se revisa la flecha y la cadena', ok: true, detail: `F y L entran en el cálculo` },
    { label: 'Se consideran seguridad a personas y suelo', ok: true, info: true, detail: 'requisitos aparte de la coordinación' },
  ],
  goals: [
    {
      id: 'g1',
      kind: 'exploracion',
      label: 'Reproduce el ejemplo del curso: D ≈ 4,02 m',
      test: (_p, d) => Math.abs(d.demp - 4.02) < 0.03,
      detail: (_p, d) => `D = ${fmt(d.demp, 3)} m`,
    },
    {
      id: 'g2',
      label: 'Muestra que al corregir por δ = 0,74 el criterio normativo exige más de 4,2 m',
      test: (p, d) => p.delta <= 0.75 && d.dnesc > 4.2,
      detail: (_p, d) => `NESC corregido = ${fmt(d.dnesc, 3)} m`,
    },
  ],
  learn: {
    phenomenon:
      'La separación entre fases debe soportar esfuerzos fase–fase y permitir que los conductores se muevan por viento, temperatura y cargas sin acercarse demasiado.',
    objective:
      'Aplicar la fórmula empírica con sus unidades y contrastarla con un criterio normativo corregido por altitud, entendiendo que el resultado es preliminar.',
    watch: [
      'La escena muestra las dos fases en la torre y la flecha a mitad del vano: la distancia crítica no está en la torre.',
      'La gráfica barre la tensión nominal manteniendo K, F y L: la parte geométrica no cambia.',
      'Al bajar δ, el criterio normativo crece y puede pasar a gobernar.',
    ],
    misconception:
      'Tomar una fórmula empírica como distancia mínima universal, o cambiar las unidades del coeficiente K. Los coeficientes están atados a su metodología.',
    model: 'Expresión histórica de predimensionamiento y criterio NESC simplificado con factor 1,15. No sustituye el diseño normativo.',
  },
  sources: ['guion', 'slides', 'cardona', 'velasco'],
  scene: ({ p, d }) => (
    <SceneCanvas
      draw={(ctx, w, h) => {
        backdrop(ctx, w, h);
        corner(ctx, 'Sección de la torre', `D de diseño = ${fmt(d.req, 2)} m`);
        const gy = h * 0.88;
        tower(ctx, w * 0.32, gy, h * 0.72, { crossarms: [{ y: h * 0.64, half: w * 0.2 }, { y: h * 0.46, half: w * 0.14 }] });
        const ax = w * 0.32 - w * 0.2;
        const ay = gy - h * 0.64;
        const bx = ax + Math.min(w * 0.5, d.req * 40);
        const by = ay + 8;
        circle(ctx, ax, ay + 14, 5, { fill: C.phase });
        circle(ctx, bx, by + 14, 5, { fill: C.amber });
        // flecha hacia mitad de vano
        ctx.save();
        ctx.strokeStyle = 'rgba(127,200,255,0.5)';
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(ax, ay + 14);
        ctx.quadraticCurveTo((ax + bx) / 2, ay + 14 + p.F * 6, bx, by + 14);
        ctx.stroke();
        ctx.restore();
        dimension(ctx, ax, ay + 40, bx, ay + 40, `${fmt(d.req, 2)} m`, C.accent);
        dimension(ctx, ax, ay + 14, ax + p.L * 20, ay + 14, `L = ${fmt(p.L, 2)} m`, C.muted);
        text(ctx, `F = ${fmt(p.F, 1)} m`, (ax + bx) / 2, ay + 14 + p.F * 6 + 12, { size: 10, color: C.muted, align: 'center', mono: true });
        // viento
        for (let i = 0; i < 3; i++) arrow(ctx, w * 0.72, h * 0.3 + i * 20, w * 0.9, h * 0.3 + i * 20, 'rgba(127,200,255,0.4)', 1.2);
        text(ctx, `Vₙ = ${fmt(p.Vn, 0)} kV`, w - 16, 22, { size: 11, color: C.phase, align: 'right', mono: true });
        text(ctx, `K = ${fmt(p.K, 2)} · δ = ${fmt(p.delta, 2)}`, 14, h - 16, { size: 10.5, color: C.muted });
      }}
      footer="La distancia entre fases se mide donde el viento y la flecha la reducen, no solo en el punto de amarre."
    />
  ),
  plot: ({ p }) => {
    const series = [0.6, p.K, 0.9].map((K, i) => ({
      pts: linspace(66, 550, 100).map((v) => [v, K * Math.sqrt(p.F + p.L) + v / 150] as [number, number]),
      color: [C.muted, C.accent, C.violet][i],
      dash: i === 1 ? undefined : '4 4',
      width: i === 1 ? 2.2 : 1.4,
    }));
    return (
      <Plot
        xDomain={[66, 550]}
        yDomain={[0, 8]}
        xLabel="tensión nominal entre fases (kV)"
        yLabel="separación estimada D (m)"
        series={series}
        markers={[{ x: p.Vn, y: p.K * Math.sqrt(p.F + p.L) + p.Vn / 150, color: C.amber, label: 'tu caso' }]}
        caption="Tres coeficientes K: la curva central es la tuya. La parte geométrica es la ordenada al origen; la tensión aporta la pendiente."
      />
    );
  },
};


export const insulationExperiments: Experiment[] = [e07, e08, e09, e10, e11];
