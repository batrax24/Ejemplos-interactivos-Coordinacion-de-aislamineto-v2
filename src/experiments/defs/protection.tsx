import {
  clamp,
  counterpoiseResistance,
  fmt,
  lineParams,
  linspace,
  parallelRods,
  reflection,
  rodResistance,
  towerPotential,
  transmission,
} from '../../lib/num';
import { C, backdrop, badge, circle, dimension, glow, line, person, rayo, soil, text, tower } from '../../lib/draw';
import { Plot, SceneCanvas } from '../../components/ui';
import type { Experiment, Params } from '../types';
import { corner } from '../common';

/* =============================== e12 =============================== */

const e12: Experiment = {
  id: 'e12',
  topicId: 8,
  title: 'Cable de guarda: el ángulo no es un certificado',
  tagline: 'Geometría, distancia de choque y método electrogeométrico',
  why: 'Usar el ángulo de apantallamiento y, al mismo tiempo, ver sus límites frente a un modelo de desempeño.',
  params: [
    { id: 'dh', label: 'Diferencia vertical guarda–fase Δh', unit: 'm', min: 1, max: 15, step: 0.1, def: 5 },
    { id: 'dx', label: 'Separación horizontal Δx', unit: 'm', min: 0, max: 12, step: 0.1, def: 4 },
    { id: 'i', label: 'Corriente de rayo considerada', unit: 'kA', min: 2, max: 100, step: 1, def: 31 },
    { id: 'hg', label: 'Altura media de la guarda', unit: 'm', min: 15, max: 70, step: 1, def: 40 },
  ],
  presets: [
    { id: 'curso', label: 'Ejemplo del curso (Δh 5 m, Δx 4 m, 31 kA)', values: { dh: 5, dx: 4, i: 31, hg: 40 } },
    { id: 'cero', label: 'Guarda vertical sobre la fase (0°)', values: { dh: 5, dx: 0, i: 31, hg: 40 } },
    { id: 'abierto', label: 'Guarda muy desplazada (45°)', values: { dh: 5, dx: 5, i: 10, hg: 40 } },
  ],
  compute: (p) => {
    const alpha = (Math.atan2(p.dx, p.dh) * 180) / Math.PI;
    const rc = 10 * Math.pow(p.i, 0.65);
    const rg = p.hg < 40 ? (3.6 + 1.7 * Math.log(43 - p.hg)) * Math.pow(p.i, 0.65) : 5.51 * Math.pow(p.i, 0.65);
    const ratio = p.dh / rc;
    const alphaCrit = ratio < 1 ? (Math.acos(ratio) * 180) / Math.PI : 0;
    const dentroEsfera = ratio < 1 ? 1 : 0;
    const alphaSub = Math.abs(alpha) <= 30 ? 1 : 0;
    const angleOk = alpha <= 30 ? 1 : 0;
    return { alpha, rc, rg, ratio, alphaCrit, dentroEsfera, alphaSub, angleOk, dist: Math.hypot(p.dh, p.dx) };
  },
  readings: (d, p) => [
    { label: 'Ángulo de apantallamiento α', value: `${fmt(d.alpha, 1)}°`, sub: `arctan(${fmt(p.dx, 1)}/${fmt(p.dh, 1)}) desde la vertical`, tone: d.angleOk ? 'ok' : 'bad' },
    { label: 'Distancia de choque r_c', value: `${fmt(d.rc, 1)} m`, sub: `10·I^0,65 con I = ${fmt(p.i, 0)} kA` },
    { label: 'Distancia al suelo r_g', value: `${fmt(d.rg, 1)} m`, sub: 'modelo del material para la guarda' },
    { label: 'Ángulo límite del modelo EGM', value: d.dentroEsfera ? `${fmt(d.alphaCrit, 1)}°` : 'no aplica', sub: 'construcción 2D con esferas de atracción' },
    { label: 'Criterio de referencia α ≤ 30°', value: d.angleOk ? 'cumple' : 'no cumple', sub: 'referencia de diseño, no universal', tone: d.angleOk ? 'ok' : 'bad' },
    { label: 'Distancia guarda–fase', value: `${fmt(d.dist, 2)} m`, sub: 'comparar con r_c' },
  ],
  equations: (p, d) => [
    `α = arctan(Δx/Δh) = arctan(${fmt(p.dx, 1)}/${fmt(p.dh, 1)}) = ${fmt(d.alpha, 1)}°`,
    `r_c = 10·I^0,65 = 10 × ${fmt(p.i, 0)}^0,65 = ${fmt(d.rc, 1)} m`,
    `r_g = ${p.hg < 40 ? '[3,6 + 1,7·ln(43 − y_c)]·I^0,65' : '5,51·I^0,65'} = ${fmt(d.rg, 1)} m`,
    `α_crítico ≈ arccos(Δh/r_c) = arccos(${fmt(p.dh, 1)}/${fmt(d.rc, 1)}) = ${d.dentroEsfera ? `${fmt(d.alphaCrit, 1)}°` : 'fase fuera de la esfera'}`,
    'El ángulo describe la posición. La protección se evalúa con el modelo y con el comportamiento en el vano, no con un solo número.',
  ],
  checks: (_p, d) => [
    { label: 'El ángulo se mide desde la vertical y con convención declarada', ok: true, detail: 'positivo hacia la fase considerada' },
    { label: 'La fase queda dentro de la esfera de atracción de la guarda', ok: d.dentroEsfera === 1, detail: d.dentroEsfera ? `α ≤ ${fmt(d.alphaCrit, 1)}°` : 'no' },
    { label: 'El criterio de 30° es solo una referencia', ok: true, detail: 'depende de la altura y del método' },
    { label: 'Se evalúa también el vano y la flecha', ok: true, info: true, detail: 'este modelo es 2D en la torre' },
  ],
  goals: [
    {
      id: 'g1',
      kind: 'exploracion',
      label: 'Reproduce el ejemplo: Δh = 5 m y Δx = 4 m → α = 38,7°',
      test: (_p, d) => Math.abs(d.alpha - 38.66) < 0.2,
      detail: (_p, d) => `α = ${fmt(d.alpha, 1)}° · r_c = ${fmt(d.rc, 1)} m`,
    },
    {
      id: 'g2',
      label: 'Logra α ≤ 25° manteniendo Δh ≥ 4,5 m',
      test: (p, d) => d.alpha <= 25 && p.dh >= 4.5,
      detail: (p, d) => `α = ${fmt(d.alpha, 1)}° con Δh = ${fmt(p.dh, 1)} m`,
    },
  ],
  learn: {
    phenomenon:
      'La guarda se ubica sobre las fases para interceptar descargas. Su posición se describe con el ángulo desde la vertical, pero la probabilidad de que un líder alcance una fase depende de la corriente y de la geometría.',
    objective:
      'Calcular α y la distancia de choque, distinguir una descripción geométrica de una evaluación de desempeño y reconocer que «38,7°» no demuestra protección.',
    watch: [
      'Las esferas de atracción de la escena crecen con la corriente: la zona cubierta cambia.',
      'La gráfica muestra α contra Δx para varios Δh: el mismo desplazamiento pesa distinto según la altura.',
      'La lectura «criterio α ≤ 30°» es una referencia separada del cálculo: no la confundas con el resultado.',
    ],
    misconception:
      'Concluir «la línea está protegida» a partir del ángulo. También hay fallas de apantallamiento por rayos de baja corriente, y el flameo inverso es un mecanismo distinto.',
    model:
      'Construcción electrogeométrica 2D con r_c = 10·I^0,65 y r_g del material. No incluye flecha, terreno, líderes ascendentes ni distribución de corriente.',
  },
  sources: ['guion', 'slides', 'cardona', 'expo'],
  notes: ['El valor 38,7° aparece en el guion y en las diapositivas como cálculo geométrico, no como prueba de protección.'],
  scene: ({ p, d, t }) => (
    <SceneCanvas
      draw={(ctx, w, h) => {
        backdrop(ctx, w, h);
        corner(ctx, 'Sección de la torre', 'esferas de atracción');
        const gy = h * 0.9;
        const tx = w * 0.34;
        const th = h * 0.74;
        tower(ctx, tx, gy, th, { crossarms: [{ y: th * 0.96, half: w * 0.13 }] });
        const gx = tx;
        const gyy = gy - th * 0.96;
        const px = gx + p.dx * (w * 0.035);
        const py = gyy + p.dh * (w * 0.035);
        const scale = (w * 0.035) / 1; // px por metro
        // esferas
        circle(ctx, gx, gyy, d.rc * scale, { stroke: 'rgba(255,200,87,0.25)', width: 1.2 });
        circle(ctx, gx, gyy, d.rg * scale * 0.15, { stroke: 'rgba(168,137,106,0.35)', width: 1.2 });
        line(ctx, gx, gyy, gx, gyy + d.rg * scale * 0.15, { color: 'rgba(168,137,106,0.5)', dash: [3, 4] });
        // guarda y fase
        line(ctx, gx - w * 0.16, gyy, gx + w * 0.16, gyy, { color: C.guard, width: 2.2 });
        circle(ctx, px, py, 6, { fill: C.phase, stroke: C.phase });
        circle(ctx, gx, gyy, 4, { fill: C.guard });
        line(ctx, gx, gyy, gx, gyy - 34, { color: 'rgba(220,235,245,0.35)', dash: [4, 3] });
        line(ctx, gx, gyy, px, py, { color: C.amber, width: 1.4 });
        dimension(ctx, px + 8, gyy, px + 8, py, `Δh = ${fmt(p.dh, 1)} m`, C.muted);
        dimension(ctx, gx, py + 14, px, py + 14, `Δx = ${fmt(p.dx, 1)} m`, C.muted);
        badge(ctx, `α = ${fmt(d.alpha, 1)}°`, gx + 22, gyy + 18, d.angleOk ? C.accent : C.bad);
        // rayo
        const flick = 0.55 + 0.45 * Math.sin(t * 8);
        rayo(ctx, gx - 20, h * 0.1, gyy - 6, 11, C.violet, 1.8 + flick);
        glow(ctx, gx - 20, gyy, 26, C.violet, 0.3 * flick);
        text(ctx, `r_c = ${fmt(d.rc, 1)} m`, 14, h - 34, { size: 10.5, color: C.guard, mono: true });
        text(ctx, `dist = ${fmt(d.dist, 2)} m`, 14, h - 16, { size: 10.5, color: C.muted, mono: true });
      }}
      footer="La esfera amarilla es la zona de atracción de la guarda para esta corriente; la fase queda dentro o fuera según la geometría."
    />
  ),
  plot: ({ p }) => {
    const series = [2, p.dh, 10].map((dh, i) => ({
      pts: linspace(0, 12, 100).map((dx) => [dx, (Math.atan2(dx, dh) * 180) / Math.PI] as [number, number]),
      color: [C.muted, C.accent, C.violet][i],
      dash: i === 1 ? undefined : '4 4',
      width: i === 1 ? 2.2 : 1.4,
    }));
    return (
      <Plot
        xDomain={[0, 12]}
        yDomain={[0, 60]}
        xLabel="separación horizontal Δx (m)"
        yLabel="ángulo de apantallamiento α (°)"
        series={series}
        refs={[{ at: 30, label: 'referencia 30°', color: C.bad }]}
        markers={[{ x: p.dx, y: (Math.atan2(p.dx, p.dh) * 180) / Math.PI, color: C.amber, label: 'tu caso' }]}
        caption="Tres alturas relativas: la curva central es la tuya. La referencia de 30° es una guía de diseño, no una frontera física."
      />
    );
  },
};

/* =============================== e13 =============================== */

const e13: Experiment = {
  id: 'e13',
  topicId: 9,
  title: 'Puesta a tierra: resistividad, geometría y temporada',
  tagline: 'De ρ del terreno a una resistencia útil',
  why: 'Entender que la resistencia no es una propiedad del suelo sino del conjunto suelo–electrodo, y que la temporada seca cambia el diseño.',
  params: [
    { id: 'rho', label: 'Resistividad del terreno ρ', unit: 'Ω·m', min: 30, max: 1000, step: 10, def: 300 },
    { id: 's', label: 'Longitud del electrodo', unit: 'm', min: 0.5, max: 12, step: 0.1, def: 3 },
    { id: 'r', label: 'Radio del electrodo', unit: 'm', min: 0.005, max: 0.03, step: 0.001, def: 0.01 },
    { id: 'tipo', label: 'Tipo de electrodo', unit: '', min: 1, max: 2, step: 1, def: 1, options: [{ value: 1, label: 'varilla vertical' }, { value: 2, label: 'contrapeso horizontal' }] },
    { id: 'n', label: 'Electrodos en paralelo', unit: '', min: 1, max: 10, step: 1, def: 1 },
    { id: 'seco', label: 'Temporada', unit: '', min: 0, max: 1, step: 1, def: 0, options: [{ value: 0, label: 'húmeda (ρ de diseño)' }, { value: 1, label: 'seca (ρ × 2)' }] },
    { id: 'i', label: 'Corriente inyectada al terreno', unit: 'kA', min: 2, max: 40, step: 1, def: 10 },
  ],
  presets: [
    { id: 'varilla', label: 'Varilla de 3 m en ρ = 300 Ω·m', values: { rho: 300, s: 3, r: 0.01, tipo: 1, n: 1, seco: 0, i: 10 } },
    { id: 'seco', label: 'Misma varilla en temporada seca', values: { rho: 300, s: 3, r: 0.01, tipo: 1, n: 1, seco: 1, i: 10 } },
    { id: 'contrapeso', label: 'Contrapeso de 12 m', values: { rho: 300, s: 12, r: 0.01, tipo: 2, n: 1, seco: 0, i: 10 } },
    { id: 'red', label: 'Seis varillas de 6 m', values: { rho: 300, s: 6, r: 0.01, tipo: 1, n: 6, seco: 1, i: 10 } },
  ],
  compute: (p) => {
    const rhoEff = p.rho * (p.seco === 1 ? 2 : 1);
    const r1 = p.tipo === 2 ? counterpoiseResistance(rhoEff, p.s, p.r, 0.6) : rodResistance(rhoEff, p.s, p.r);
    const rTotal = parallelRods(r1, p.n);
    const epr = rTotal * p.i;
    return { rhoEff, r1, rTotal, epr, eprUnsafe: epr > 100 ? 1 : 0 };
  },
  readings: (d, p) => [
    { label: 'Resistividad efectiva', value: `${fmt(d.rhoEff, 0)} Ω·m`, sub: p.seco === 1 ? 'temporada seca: ρ × 2' : 'temporada húmeda' },
    { label: 'Resistencia de un electrodo', value: `${fmt(d.r1, 1)} Ω`, sub: p.tipo === 2 ? 'contrapeso horizontal' : 'varilla vertical' },
    { label: 'Resistencia del conjunto', value: `${fmt(d.rTotal, 1)} Ω`, sub: `${fmt(p.n, 0)} electrodo(s) en paralelo`, tone: d.rTotal <= 20 ? 'ok' : d.rTotal <= 40 ? 'warn' : 'bad' },
    { label: 'Elevación de potencial', value: `${fmt(d.epr, 1)} kV`, sub: `V ≈ R·I con I = ${fmt(p.i, 0)} kA`, tone: d.eprUnsafe ? 'bad' : 'warn' },
    { label: 'Referencia de estructuras con guarda', value: '20 Ω', sub: 'valor de referencia; no exime verificar paso y contacto' },
  ],
  equations: (p, d) => [
    p.tipo === 2
      ? `R₁ = (ρ/πs)·[ln(2s/√(4rd)) − 1] = (${fmt(d.rhoEff, 0)}/(π·${fmt(p.s, 1)}))·[ln(2·${fmt(p.s, 1)}/√(4·${fmt(p.r, 3)}·0,6)) − 1] = ${fmt(d.r1, 1)} Ω`
      : `R₁ = (ρ/2πs)·ln(2s/r) = (${fmt(d.rhoEff, 0)}/(2π·${fmt(p.s, 1)}))·ln(2·${fmt(p.s, 1)}/${fmt(p.r, 3)}) = ${fmt(d.r1, 1)} Ω`,
    `R_n ≈ R₁ / n^0,78 = ${fmt(d.r1, 1)} / ${fmt(p.n, 0)}^0,78 = ${fmt(d.rTotal, 1)} Ω`,
    `V_t ≈ R·I = ${fmt(d.rTotal, 1)} × ${fmt(p.i, 0)} = ${fmt(d.epr, 1)} kV`,
    'ρ es del terreno; R depende de ρ y de la geometría. El rendimiento de varios electrodos no es proporcional al número.',
  ],
  checks: () => [
    { label: 'Se distingue ρ (Ω·m) de R (Ω)', ok: true, detail: 'no son intercambiables' },
    { label: 'La temporada crítica está considerada', ok: true, detail: 'ρ puede duplicarse en sequía' },
    { label: 'Una R baja no demuestra seguridad de personas', ok: true, detail: 'faltan paso y contacto' },
    { label: 'El modelo resistivo no cubre impulsos', ok: true, detail: 'en rayo aparecen L·di/dt y reparto de corriente' },
  ],
  goals: [
    {
      id: 'g1',
      label: 'Con ρ = 300 Ω·m y temporada seca, logra R ≤ 30 Ω',
      test: (p, d) => p.rho === 300 && p.seco === 1 && d.rTotal <= 30,
      detail: (p, d) => `R = ${fmt(d.rTotal, 1)} Ω con ${fmt(p.n, 0)} electrodo(s) de ${fmt(p.s, 1)} m`,
    },
    {
      id: 'g2',
      kind: 'exploracion',
      label: 'Muestra que una sola varilla de 3 m en ρ = 300 Ω·m supera los 90 Ω',
      test: (p, d) => p.tipo === 1 && p.n === 1 && Math.abs(p.s - 3) < 0.05 && Math.abs(p.rho - 300) < 1 && d.r1 > 90,
      detail: (_p, d) => `R₁ = ${fmt(d.r1, 1)} Ω`,
    },
  ],
  learn: {
    phenomenon:
      'La corriente de una descarga o de una falla se dispersa por el terreno. La resistencia del electrodo y la forma en que el potencial decae alrededor de la torre determinan la elevación de potencial y el riesgo para personas.',
    objective:
      'Calcular R para varilla y contrapeso, ver el efecto de la temporada y de varios electrodos, y explicar por qué una R baja no basta para la seguridad.',
    watch: [
      'Las capas de suelo y las líneas equipotenciales de la escena se separan al aumentar ρ.',
      'La gráfica muestra R contra longitud: alargar el electrodo ayuda, pero cada vez menos.',
      'Cambia a temporada seca: la resistencia se duplica y el diseño que «cumplía» deja de cumplir.',
    ],
    misconception:
      'Elegir el electrodo solo con una medición de verano y sin margen estacional, o creer que enterrar más electrodos divide la resistencia entre n.',
    model:
      'Fórmulas de estado estable del material y rendimiento didáctico n^0,78 para electrodos en paralelo. No incluye estratificación, ionización del suelo ni respuesta impulsiva.',
  },
  sources: ['guion', 'slides', 'velasco', 'expo'],
  scene: ({ p, d, t }) => (
    <SceneCanvas
      draw={(ctx, w, h) => {
        backdrop(ctx, w, h);
        corner(ctx, 'Sistema de puesta a tierra', `R = ${fmt(d.rTotal, 1)} Ω · V ≈ ${fmt(d.epr, 0)} kV`);
        const gy = h * 0.34;
        soil(ctx, 0, gy, w, h - gy, 3);
        const baseX = w * 0.42;
        tower(ctx, baseX, gy, h * 0.3, { crossarms: [{ y: h * 0.26, half: w * 0.06 }] });
        // electrodos
        const nShow = Math.min(6, p.n);
        for (let i = 0; i < nShow; i++) {
          const x = baseX + (i - (nShow - 1) / 2) * 34;
          if (p.tipo === 2) {
            line(ctx, x - 40, gy + 26, x + 40, gy + 26, { color: C.earth, width: 3 });
          } else {
            line(ctx, x, gy, x, gy + Math.min(h * 0.42, p.s * 20), { color: C.earth, width: 3 });
          }
        }
        // corriente y equipotenciales
        const pulse = (t * 1.4) % 1;
        for (let i = 0; i < 5; i++) {
          const rr = 16 + i * 22 + pulse * 12;
          ctx.save();
          ctx.strokeStyle = `rgba(255,200,87,${0.32 - i * 0.05})`;
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.arc(baseX, gy + 40, rr, 0.1 * Math.PI, 0.9 * Math.PI);
          ctx.stroke();
          ctx.restore();
        }
        for (let i = 0; i < 6; i++) {
          const yy = gy + 12 + ((i * 13 + pulse * 30) % (h - gy - 20));
          circle(ctx, baseX + Math.sin(i * 2 + t) * 26, yy, 2, { fill: C.amber, alpha: 0.7 });
        }
        dimension(ctx, baseX + w * 0.2, gy, baseX + w * 0.2, gy + Math.min(h * 0.42, p.s * 20), `${fmt(p.s, 1)} m`, C.amber);
        person(ctx, w * 0.82, gy, h * 0.16, C.ok);
        text(ctx, 'paso y contacto', w * 0.82, gy + 22, { size: 9.5, color: C.muted, align: 'center' });
        badge(ctx, `ρ = ${fmt(d.rhoEff, 0)} Ω·m`, 14, 22, C.earth);
        badge(ctx, p.seco === 1 ? 'temporada seca' : 'temporada húmeda', 14, 44, p.seco === 1 ? C.bad : C.ok);
        text(ctx, `V = ${fmt(d.epr, 0)} kV`, 14, h - 16, { size: 11, color: d.eprUnsafe ? C.bad : C.amber, mono: true });
      }}
      footer="La corriente se dispersa en el terreno: el potencial no es igual en todos los puntos, y de ahí nacen las tensiones de paso y contacto."
    />
  ),
  plot: ({ p }) => {
    const curve = (n: number, color: string, dash?: string, seco = false) => ({
      pts: linspace(0.5, 12, 100).map((s) => {
        const rho = p.rho * (seco ? 2 : 1);
        const r1 = p.tipo === 2 ? counterpoiseResistance(rho, s, p.r, 0.6) : rodResistance(rho, s, p.r);
        return [s, parallelRods(r1, n)] as [number, number];
      }),
      color,
      dash,
      width: 2,
    });
    return (
      <Plot
        xDomain={[0.5, 12]}
        yDomain={[0, 240]}
        xLabel="longitud del electrodo (m)"
        yLabel="resistencia del conjunto (Ω)"
        series={[curve(p.n, C.accent, undefined, p.seco === 1), curve(1, C.phase, '4 4'), curve(6, C.violet, '2 5')]}
        refs={[{ at: 20, label: 'referencia 20 Ω', color: C.bad }]}
        markers={[{ x: p.s, y: dValue(p), color: C.amber, label: 'tu caso' }]}
        caption="Curva continua: tu número de electrodos. Punteadas: uno solo y seis. Alargar ayuda, pero el rendimiento de varios electrodos no es lineal."
      />
    );
  },
};

function dValue(p: Params) {
  const rho = p.rho * (p.seco === 1 ? 2 : 1);
  const r1 = p.tipo === 2 ? counterpoiseResistance(rho, p.s, p.r, 0.6) : rodResistance(rho, p.s, p.r);
  return parallelRods(r1, p.n);
}

/* =============================== e14 =============================== */

const e14: Experiment = {
  id: 'e14',
  topicId: 3,
  title: 'Flameo inverso: la torre también sube de potencial',
  tagline: 'R·i(t) + L·di/dt frente al CFO de la cadena',
  why: 'Ver por qué bajar la resistencia de tierra no es el único factor y por qué el di/dt puede decidir el flameo.',
  params: [
    { id: 'i', label: 'Corriente del rayo', unit: 'kA', min: 5, max: 150, step: 1, def: 60 },
    { id: 'ncomparten', label: 'Torres que comparten la corriente', unit: '', min: 1, max: 5, step: 1, def: 1 },
    { id: 'rt', label: 'Resistencia de puesta a tierra R_t', unit: 'Ω', min: 1, max: 60, step: 0.5, def: 30 },
    { id: 'l', label: 'Inductancia equivalente de torre', unit: 'µH', min: 0.2, max: 3, step: 0.1, def: 1 },
    { id: 'didt', label: 'Pendiente de corriente di/dt', unit: 'kA/µs', min: 2, max: 60, step: 1, def: 20 },
    { id: 'k', label: 'Factor de acoplamiento con la fase', unit: '', min: 0, max: 0.4, step: 0.01, def: 0.25 },
    { id: 'cfo', label: 'CFO de la cadena', unit: 'kV', min: 700, max: 1800, step: 10, def: 1400 },
  ],
  presets: [
    { id: 'reto', label: 'Caso exigente (60 kA, 20 kA/µs)', values: { i: 60, ncomparten: 1, rt: 25, l: 1, didt: 20, k: 0.25, cfo: 1400 } },
    { id: 'curso', label: 'Ejemplo del curso (10 kA, 15 Ω)', values: { i: 10, ncomparten: 1, rt: 15, l: 1, didt: 10, k: 0, cfo: 1400 } },
    { id: 'buena', label: 'Tierra mejorada (60 kA, 8 Ω)', values: { i: 60, ncomparten: 1, rt: 8, l: 1, didt: 20, k: 0.25, cfo: 1400 } },
  ],
  compute: (p) => {
    const it = p.i / p.ncomparten;
    const vt = towerPotential(it, p.rt, p.l, p.didt);
    const vacross = vt * (1 - p.k);
    const margin = p.cfo - vacross;
    const flash = vacross >= p.cfo ? 1 : 0;
    const rtMax = Math.max(0, (p.cfo / (1 - p.k) - p.l * p.didt) / Math.max(0.01, it));
    return { it, vt, vacross, margin, flash, rtMax };
  },
  readings: (d, p) => [
    { label: 'Corriente por la torre', value: `${fmt(d.it, 1)} kA`, sub: `I/${fmt(p.ncomparten, 0)} torres que comparten` },
    { label: 'Potencial de la torre V_t', value: `${fmt(d.vt, 1)} kV`, sub: `R_t·i + L·di/dt = ${fmt(p.rt, 1)}·${fmt(d.it, 1)} + ${fmt(p.l, 1)}·${fmt(p.didt, 0)}` },
    { label: 'Tensión sobre la cadena', value: `${fmt(d.vacross, 1)} kV`, sub: `V_t·(1 − k) con k = ${fmt(p.k, 2)}` },
    { label: 'CFO de la cadena', value: `${fmt(p.cfo, 0)} kV`, sub: 'de la distribución, no una garantía', tone: 'neutral' },
    { label: 'Veredicto', value: d.flash ? 'flameo inverso' : 'sostiene', sub: `margen ${fmt(d.margin, 0)} kV`, tone: d.flash ? 'bad' : 'ok' },
    { label: 'R_t máxima para sostener', value: `${fmt(d.rtMax, 1)} Ω`, sub: 'para este conjunto de supuestos', tone: 'warn' },
  ],
  equations: (p, d) => [
    `i_torre = ${fmt(p.i, 0)}/${fmt(p.ncomparten, 0)} = ${fmt(d.it, 1)} kA`,
    `V_t = R_t·i + L·(di/dt) = ${fmt(p.rt, 1)}×${fmt(d.it, 1)} + ${fmt(p.l, 1)}×${fmt(p.didt, 0)} = ${fmt(d.vt, 1)} kV`,
    `V_cadena = V_t·(1 − k) = ${fmt(d.vt, 1)}×${fmt(1 - p.k, 2)} = ${fmt(d.vacross, 1)} kV`,
    `${d.flash ? 'flameo: V_cadena ≥ CFO' : 'sostiene: V_cadena < CFO'} (${fmt(d.vacross, 1)} frente a ${fmt(p.cfo, 0)} kV)`,
    'El modelo concentrado R–L es interpretativo: la torre real tiene propagación, reparto y dependencia temporal.',
  ],
  checks: (p, d) => [
    { label: 'Se incluye la caída inductiva', ok: p.l * p.didt > 0, detail: `${fmt(p.l * p.didt, 1)} kV` },
    { label: 'Se considera el reparto de corriente', ok: true, detail: `${fmt(d.it, 1)} kA por torre` },
    { label: 'El CFO se toma como distribución', ok: true, detail: 'no como límite garantizado' },
    { label: 'La tensión de la fase en el instante del rayo', ok: true, info: true, detail: 'no modelada aquí' },
    { label: 'La respuesta impulsiva real del electrodo', ok: true, info: true, detail: 'requiere modelo dependiente de frecuencia' },
  ],
  goals: [
    {
      id: 'g1',
      label: 'Con 60 kA, 20 kA/µs, L = 1 µH, k = 0,25 y CFO = 1400 kV, evita el flameo',
      test: (p, d) => p.i >= 59 && p.didt >= 19 && Math.abs(p.l - 1) < 0.05 && Math.abs(p.k - 0.25) < 0.01 && d.flash === 0,
      detail: (p, d) => `R_t = ${fmt(p.rt, 1)} Ω → V_cadena = ${fmt(d.vacross, 1)} kV`,
    },
    {
      id: 'g2',
      kind: 'exploracion',
      label: 'Reproduce el ejemplo simple del curso: 10 kA × 15 Ω = 150 kV (más la caída inductiva)',
      test: (p) => Math.abs(p.i - 10) < 0.5 && Math.abs(p.rt - 15) < 0.2 && Math.abs((p.i / p.ncomparten) * p.rt - 150) < 1.5,
      detail: (_p, d) => `R_t·i = ${fmt(_p.rt * d.it, 0)} kV · V_t total = ${fmt(d.vt, 1)} kV`,
    },
  ],
  learn: {
    phenomenon:
      'Cuando el rayo impacta guarda o torre, la corriente baja por la estructura y el terreno. El potencial de la torre sube y aparece una tensión entre la torre y la fase que puede superar el CFO de la cadena.',
    objective:
      'Calcular la elevación de potencial con el modelo R–L, compararla con el CFO y decidir si hay flameo inverso; entender el papel de la puesta a tierra y del reparto de corriente.',
    watch: [
      'La escena colorea la cadena cuando la tensión supera el CFO y dibuja el arco torre–fase.',
      'La gráfica de tensión sobre la cadena contra R_t cruza la línea del CFO: ese cruce es la resistencia límite.',
      'Sube di/dt: la caída inductiva crece aunque la resistencia no cambie.',
    ],
    misconception:
      'Creer que el flameo inverso depende solo de la resistencia de tierra y que «más tierra» siempre resuelve. La inductancia, el reparto y el acoplamiento también deciden.',
    model:
      'Modelo concentrado R–L con acoplamiento constante y reparto equitativo. La torre real exige propagación y modelos dependientes de la frecuencia.',
  },
  sources: ['guion', 'slides', 'velasco', 'expo'],
  scene: ({ p, d, t }) => (
    <SceneCanvas
      draw={(ctx, w, h) => {
        backdrop(ctx, w, h);
        corner(ctx, 'Impacto en la guarda', d.flash ? 'flameo inverso' : 'la cadena sostiene');
        const gy = h * 0.9;
        const tx = w * 0.46;
        const th = h * 0.72;
        tower(ctx, tx, gy, th, { crossarms: [{ y: th * 0.9, half: w * 0.17 }] });
        const gyy = gy - th;
        const py = gy - th * 0.9;
        line(ctx, tx - w * 0.17, gyy, tx + w * 0.17, gyy, { color: C.guard, width: 1.8 });
        line(ctx, tx - w * 0.3, py, tx - w * 0.04, py, { color: C.phase, width: 2 });
        line(ctx, tx + w * 0.04, py, tx + w * 0.3, py, { color: C.phase, width: 2 });
        const fl = 0.55 + 0.45 * Math.sin(t * 7);
        rayo(ctx, tx, h * 0.06, gyy, 5, C.violet, 2 + fl);
        glow(ctx, tx, gyy, 30, C.violet, 0.3 * fl);
        // corriente bajando
        for (let i = 0; i < 5; i++) {
          const u = ((t * 1.6 + i * 0.2) % 1);
          circle(ctx, tx + 2, gyy + (gy - gyy) * u, 2.6, { fill: C.violet, alpha: 0.85 });
        }
        // potencial
        const lvl = clamp(d.vacross / Math.max(1, p.cfo), 0, 1.2);
        ctx.save();
        ctx.fillStyle = `rgba(255,107,107,${0.05 + 0.22 * lvl})`;
        ctx.fillRect(tx - w * 0.2, gyy - 6, w * 0.4, gy - gyy + 12);
        ctx.restore();
        badge(ctx, `V_t = ${fmt(d.vt, 0)} kV`, tx + 12, gyy + 22, C.violet);
        badge(ctx, `V cadena = ${fmt(d.vacross, 0)} kV`, tx - w * 0.24, py - 24, d.flash ? C.bad : C.accent);
        if (d.flash) {
          ctx.save();
          ctx.strokeStyle = C.accent;
          ctx.lineWidth = 2.4;
          ctx.shadowColor = C.accent;
          ctx.shadowBlur = 10;
          ctx.beginPath();
          for (let i = 0; i <= 10; i++) {
            const u = i / 10;
            const x = tx + (tx - (tx - w * 0.17)) * u;
            const y = gyy + (py - gyy) * u;
            if (i === 0) ctx.moveTo(tx - 4, gyy + 4);
            else ctx.lineTo(x + Math.sin(i * 2.2 + t * 6) * 4, y);
          }
          ctx.stroke();
          ctx.restore();
        }
        person(ctx, w * 0.9, gy, h * 0.14, C.ok);
        text(ctx, `R_t = ${fmt(p.rt, 1)} Ω · I = ${fmt(p.i, 0)} kA`, 14, h - 16, { size: 10.5, color: C.muted, mono: true });
      }}
      footer="El potencial de la torre se transmite a la cadena; si supera su CFO, la descarga salta de la estructura a la fase."
    />
  ),
  plot: ({ p }) => {
    const pts: [number, number][] = linspace(0, 60, 120).map((rt) => [rt, (rt * (p.i / p.ncomparten) + p.l * p.didt) * (1 - p.k)]);
    return (
      <Plot
        xDomain={[0, 60]}
        yDomain={[0, Math.max(1800, p.cfo * 1.3)]}
        xLabel="resistencia de puesta a tierra R_t (Ω)"
        yLabel="tensión sobre la cadena (kV)"
        series={[{ pts, color: C.accent, width: 2.2 }]}
        refs={[{ at: p.cfo, label: `CFO ${fmt(p.cfo, 0)} kV`, color: C.bad }]}
        markers={[{ x: p.rt, y: (p.rt * (p.i / p.ncomparten) + p.l * p.didt) * (1 - p.k), color: C.amber, label: 'tu caso' }]}
        caption={`La curva incluye la caída inductiva (${fmt(p.l * p.didt, 0)} kV), por eso no arranca en cero. El cruce con el CFO marca la R_t límite.`}
      />
    );
  },
};

/* =============================== e15 =============================== */

const e15: Experiment = {
  id: 'e15',
  topicId: 10,
  title: 'Ondas viajeras: lo que llega al equipo no es lo que salió',
  tagline: 'Reflexión, transmisión y diagrama de Bewley',
  why: 'Entender por qué la distancia al pararrayos cambia la tensión que soporta el transformador.',
  params: [
    { id: 'z1', label: 'Impedancia de la línea incidente Z₁', unit: 'Ω', min: 100, max: 700, step: 5, def: 400 },
    { id: 'z2', label: 'Impedancia de la segunda línea Z₂', unit: 'Ω', min: 5, max: 2000, step: 5, def: 100 },
    { id: 'vi', label: 'Onda incidente V_i', unit: 'kV', min: 20, max: 400, step: 5, def: 100 },
    { id: 'd', label: 'Distancia al equipo', unit: 'm', min: 0, max: 600, step: 5, def: 300 },
    { id: 'l', label: "Inductancia L'", unit: 'mH/km', min: 0.5, max: 1.5, step: 0.01, def: 1 },
    { id: 'c', label: "Capacitancia C'", unit: 'nF/km', min: 6, max: 20, step: 0.1, def: 12 },
  ],
  presets: [
    { id: 'curso', label: 'Ejemplo del curso (400 → 100 Ω, 100 kV)', values: { z1: 400, z2: 100, vi: 100, d: 300, l: 1, c: 12 } },
    { id: 'abierto', label: 'Extremo abierto (Z₂ = 2000 Ω)', values: { z1: 400, z2: 2000, vi: 100, d: 300, l: 1, c: 12 } },
    { id: 'corto', label: 'Cortocircuito ideal (Z₂ = 0)', values: { z1: 400, z2: 0, vi: 100, d: 300, l: 1, c: 12 } },
    { id: 'acople', label: 'Acople perfecto (Z₂ = 400 Ω)', values: { z1: 400, z2: 400, vi: 100, d: 300, l: 1, c: 12 } },
  ],
  compute: (p) => {
    const gamma = reflection(p.z1, p.z2);
    const tau = transmission(p.z1, p.z2);
    const vr = gamma * p.vi;
    const vt = tau * p.vi;
    const { zc, v } = lineParams(p.l, p.c);
    const tRound = (2 * p.d) / Math.max(1, v) * 1e6;
    // c = 299 792 458 m/s: una línea sin pérdidas no puede superarla.
    return { gamma, tau, vr, vt, zc, v, tRound, fast: v > 2.998e8 ? 1 : 0, check: p.vi + vr };
  },
  readings: (d, p) => [
    { label: 'Coeficiente de reflexión Γ', value: fmt(d.gamma, 3), sub: `(Z₂−Z₁)/(Z₂+Z₁) = (${fmt(p.z2, 0)}−${fmt(p.z1, 0)})/(${fmt(p.z2 + p.z1, 0)})`, tone: Math.abs(d.gamma + 0.6) < 0.03 ? 'ok' : 'neutral' },
    { label: 'Coeficiente de transmisión τ', value: fmt(d.tau, 3), sub: '1 + Γ = 2Z₂/(Z₂+Z₁)' },
    { label: 'Onda reflejada', value: `${fmt(d.vr, 1)} kV`, sub: 'el signo indica polaridad, no energía negativa', tone: d.vr < 0 ? 'warn' : 'ok' },
    { label: 'Onda transmitida', value: `${fmt(d.vt, 1)} kV`, sub: `V_i + V_r = ${fmt(d.check, 1)} kV`, tone: 'ok' },
    { label: 'Z_c y velocidad', value: `${fmt(d.zc, 0)} Ω · ${fmt(d.v / 1e8, 3)}×10⁸ m/s`, sub: 'de L′ y C′ por unidad de longitud', tone: d.fast ? 'warn' : 'neutral' },
    { label: 'Ida y vuelta al equipo', value: `${fmt(d.tRound, 2)} µs`, sub: `2d/v con d = ${fmt(p.d, 0)} m` },
  ],
  equations: (p, d) => [
    `Γ = (Z₂ − Z₁)/(Z₂ + Z₁) = (${fmt(p.z2, 0)} − ${fmt(p.z1, 0)})/(${fmt(p.z2 + p.z1, 0)}) = ${fmt(d.gamma, 3)}`,
    `τ = 1 + Γ = ${fmt(d.tau, 3)} · V_r = Γ·V_i = ${fmt(d.vr, 1)} kV · V_t = τ·V_i = ${fmt(d.vt, 1)} kV`,
    `Z_c = √(L′/C′) = ${fmt(d.zc, 0)} Ω · v = 1/√(L′C′) = ${fmt(d.v / 1e8, 3)}×10⁸ m/s`,
    `t_ida_vuelta = 2d/v = ${fmt(d.tRound, 2)} µs`,
    'En el extremo abierto ideal Γ → +1 y la tensión puede duplicarse; en cortocircuito Γ = −1 y cae a cero.',
  ],
  checks: (_p, d) => [
    { label: 'Se compara la misma onda (tensión) en la unión', ok: true, detail: 'V_i + V_r = V_t' },
    { label: 'El signo de Γ se interpreta como polaridad', ok: true, detail: 'no como energía negativa' },
    { label: 'La velocidad es físicamente posible', ok: d.fast === 0, detail: d.fast ? 'los datos dados superan c: revisa el par L′–C′' : 'por debajo de c' },
    { label: 'El caso «abierto» es un límite, no un valor finito', ok: true, detail: 'Z₂ = 2000 Ω da Γ = 0,667' },
  ],
  goals: [
    {
      id: 'g1',
      kind: 'exploracion',
      label: 'Reproduce el ejemplo: Z₁ = 400 Ω, Z₂ = 100 Ω, V_i = 100 kV → Γ = −0,60 y V_t = 40 kV',
      test: (p, d) => Math.abs(p.z1 - 400) < 1 && Math.abs(p.z2 - 100) < 1 && Math.abs(d.gamma + 0.6) < 0.005 && Math.abs(d.vt - 40) < 0.5,
      detail: (_p, d) => `Γ = ${fmt(d.gamma, 3)} · V_t = ${fmt(d.vt, 1)} kV`,
    },
    {
      id: 'g2',
      label: 'Encuentra Z₂ para Γ ≥ 0,6 (reflexión positiva fuerte) y observa la sobretensión en el extremo',
      test: (_p, d) => d.gamma >= 0.6,
      detail: (_p, d) => `Γ = ${fmt(d.gamma, 3)} → V en el extremo ≈ ${fmt(d.vt, 1)} kV`,
    },
  ],
  learn: {
    phenomenon:
      'Una variación rápida de tensión viaja por la línea con velocidad finita. Al encontrar un cambio de impedancia, parte se refleja y parte se transmite; en un extremo abierto la tensión puede duplicarse.',
    objective:
      'Calcular Γ y τ, interpretar el signo, estimar Z_c y la velocidad, y explicar por qué la distancia entre pararrayos y equipo importa.',
    watch: [
      'La escena muestra el pulso incidente, el reflejado y el transmitido con amplitudes proporcionales.',
      'El diagrama de Bewley de la derecha traza los rebotes en el plano posición–tiempo.',
      'Cambia Z₂ al máximo y observa que Γ se acerca a +1 sin llegar: el abierto es un límite.',
    ],
    misconception:
      'Leer un Γ = +1 con Z₂ finita, o confundir la velocidad de la onda con la de la corriente de carga. Y olvidar que la tensión en el transformador depende de la distancia al descargador.',
    model:
      'Línea ideal sin pérdidas, unión resistiva y coeficientes reales. No incluye atenuación por corona, dispersión ni capacidad del equipo.',
  },
  sources: ['guion', 'slides', 'velasco', 'pararrayos', 'ejercicios'],
  notes: ['La guía de ejercicios detectó dos defectos en la versión 1: escala de la velocidad y etiqueta «extremo abierto» con Z₂ = 2000 Ω (Γ = 0,667). Aquí se corrigen ambos.'],
  scene: ({ p, d, t }) => (
    <SceneCanvas
      draw={(ctx, w, h) => {
        backdrop(ctx, w, h);
        corner(ctx, 'Línea y unión', `Γ = ${fmt(d.gamma, 2)} · τ = ${fmt(d.tau, 2)}`);
        const y = h * 0.36;
        const x0 = w * 0.08;
        const xj = w * 0.55;
        const x1 = w * 0.92;
        line(ctx, x0, y, x1, y, { color: C.steel, width: 3 });
        line(ctx, x0, y - 10, x0, y + 10, { color: C.muted });
        line(ctx, x1, y - 10, x1, y + 10, { color: C.muted });
        text(ctx, `Z₁ = ${fmt(p.z1, 0)} Ω`, x0 + 6, y - 16, { size: 10.5, color: C.phase, mono: true });
        text(ctx, `Z₂ = ${fmt(p.z2, 0)} Ω`, x1 - 6, y - 16, { size: 10.5, color: C.amber, mono: true, align: 'right' });
        line(ctx, xj, y - 16, xj, y + 16, { color: C.accent, dash: [4, 3] });
        text(ctx, 'unión', xj, y + 26, { size: 9.5, color: C.muted, align: 'center' });
        // pulsos
        const speed = 0.22;
        const pos = ((t * speed) % 1.4);
        const incX = x0 + Math.min(1, pos) * (xj - x0);
        const amp = 18;
        ctx.save();
        ctx.strokeStyle = C.accent;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(incX - 40, y);
        ctx.lineTo(incX - 16, y);
        ctx.lineTo(incX - 16, y - amp * 1.4);
        ctx.lineTo(incX + 16, y - amp * 1.4);
        ctx.lineTo(incX + 16, y);
        ctx.lineTo(incX + 40, y);
        ctx.stroke();
        ctx.restore();
        if (pos > 1) {
          const u = Math.min(1, pos - 1);
          const rx = xj - u * (xj - x0);
          const tx = xj + u * (x1 - xj);
          ctx.save();
          ctx.strokeStyle = d.gamma < 0 ? C.bad : C.ok;
          ctx.lineWidth = 1.8;
          ctx.beginPath();
          ctx.moveTo(rx - 30, y);
          ctx.lineTo(rx - 10, y);
          ctx.lineTo(rx - 10, y - amp * 1.4 * Math.abs(d.gamma));
          ctx.lineTo(rx + 10, y - amp * 1.4 * Math.abs(d.gamma));
          ctx.lineTo(rx + 10, y);
          ctx.lineTo(rx + 30, y);
          ctx.stroke();
          ctx.restore();
          ctx.save();
          ctx.strokeStyle = C.amber;
          ctx.lineWidth = 1.8;
          ctx.beginPath();
          ctx.moveTo(tx - 30, y);
          ctx.lineTo(tx - 10, y);
          ctx.lineTo(tx - 10, y - amp * 1.4 * Math.abs(d.tau));
          ctx.lineTo(tx + 10, y - amp * 1.4 * Math.abs(d.tau));
          ctx.lineTo(tx + 10, y);
          ctx.lineTo(tx + 30, y);
          ctx.stroke();
          ctx.restore();
          text(ctx, `V_r = ${fmt(d.vr, 0)} kV`, rx, y - amp * 1.4 - 12, { size: 9.5, color: d.gamma < 0 ? C.bad : C.ok, mono: true, align: 'center' });
          text(ctx, `V_t = ${fmt(d.vt, 0)} kV`, tx, y - amp * 1.4 - 12, { size: 9.5, color: C.amber, mono: true, align: 'center' });
        }
        text(ctx, `V_i = ${fmt(p.vi, 0)} kV`, incX - 6, y - amp * 1.4 - 10, { size: 9.5, color: C.accent, mono: true, align: 'center' });
        // Bewley
        const bx = w * 0.1;
        const by = h * 0.62;
        const bw = w * 0.8;
        const bh = h * 0.3;
        line(ctx, bx, by + bh, bx + bw, by + bh, { color: 'rgba(160,210,225,0.3)' });
        line(ctx, bx, by + bh, bx, by, { color: 'rgba(160,210,225,0.3)' });
        text(ctx, 'x', bx + bw + 4, by + bh, { size: 9, color: C.muted });
        text(ctx, 't', bx - 4, by + 4, { size: 9, color: C.muted });
        const cells = 4;
        for (let i = 0; i < cells; i++) {
          const xx = bx + (i % 2 === 0 ? 0 : bw);
          const x2 = bx + (i % 2 === 0 ? bw : 0);
          const y1 = by + bh - (bh * i) / cells;
          const y2 = by + bh - (bh * (i + 1)) / cells;
          line(ctx, xx, y1, x2, y2, { color: i === 0 ? C.accent : 'rgba(255,200,87,0.55)', width: i === 0 ? 2 : 1.2, dash: i === 0 ? undefined : [4, 3] });
        }
        text(ctx, `ida y vuelta = ${fmt(d.tRound, 1)} µs`, bx + bw, by + 12, { size: 9.5, color: C.muted, align: 'right', mono: true });
        badge(ctx, d.fast ? 'v > c: revisa L′–C′' : 'v ≤ c', w - 120, 22, d.fast ? C.bad : C.ok);
      }}
      footer="Arriba: pulso viajando y amplitudes reflejada y transmitida. Abajo: diagrama de Bewley, donde cada rebote cambia de amplitud por Γ."
    />
  ),
  plot: ({ p }) => {
    const gpts: [number, number][] = linspace(0, 2000, 200).map((z) => [z, reflection(p.z1, z)]);
    const tpts: [number, number][] = linspace(0, 2000, 200).map((z) => [z, transmission(p.z1, z)]);
    return (
      <Plot
        xDomain={[0, 2000]}
        yDomain={[-1.05, 2.05]}
        xLabel="impedancia de la segunda línea Z₂ (Ω)"
        yLabel="coeficiente"
        series={[
          { pts: gpts, color: C.accent, width: 2.2 },
          { pts: tpts, color: C.amber, width: 2, dash: '5 4' },
        ]}
        refs={[
          { at: 1, label: 'Γ = +1 (abierto ideal)', color: C.ok },
          { at: -1, label: 'Γ = −1 (cortocircuito)', color: C.bad },
          { at: 0, label: 'Γ = 0 (acople)', color: C.muted, dash: '2 4' },
          { at: p.z1, label: 'Z₂ = Z₁', color: C.phase, dash: '2 4', axis: 'x' },
        ]}
        markers={[
          { x: p.z2, y: reflection(p.z1, p.z2), color: C.violet, label: 'Γ' },
          { x: p.z2, y: transmission(p.z1, p.z2), color: C.phase, label: 'τ', shape: 'ring' },
        ]}
        caption="Γ (verde) y τ (ámbar). El extremo abierto es una asíntota: con Z₂ finita, Γ se acerca a +1 sin alcanzarlo."
      />
    );
  },
};

export const protectionExperiments: Experiment[] = [e12, e13, e14, e15];
