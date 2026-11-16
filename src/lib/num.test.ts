import { describe, expect, it } from 'vitest';
import {
  airDensity,
  bundleEquivalentRadius,
  cfoFromInsulators,
  cfoRequired,
  coronaInception,
  counterpoiseResistance,
  creepageRequired,
  dar,
  flashoverVoltage,
  impulseMetrics,
  impulseShape,
  insulatorsFromCfo,
  insulationResistance,
  lineParams,
  parallelRods,
  peekLoss,
  piIndex,
  pressureAt,
  protectionMargin,
  reflection,
  rodResistance,
  switchingSupport,
  tovCapability,
  tovEquivalent,
  ucMin,
  type InsulationState,
} from './num';

const rel = (a: number, b: number, tol = 0.01) => expect(Math.abs(a - b) / Math.abs(b)).toBeLessThan(tol);

describe('tensiones de referencia', () => {
  it('245 kV: fase–tierra eficaz y de cresta', () => {
    rel(245 / Math.sqrt(3), 141.45, 1e-3);
    rel((245 / Math.sqrt(3)) * Math.SQRT2, 200.04, 1e-3);
  });

  it('2,5 p.u. de maniobra sobre 200 kV de cresta y factor 1,15', () => {
    rel(2.5 * 200.04, 500.1, 1e-3);
    rel(1.15 * 2.5 * 200.04, 575.1, 1e-3);
  });

  it('onda 1,2/50 µs: frente y cola convencionales', () => {
    const m = impulseMetrics(0.41, 66);
    rel(m.t1, 1.21, 0.01);
    rel(m.t2, 48.5, 0.01);
    rel(m.tp, 2.1, 0.01);
    expect(m.t0).toBeLessThan(0);
  });

  it('impulso tipo maniobra 170/2500 µs', () => {
    const m = impulseMetrics(110, 2500);
    expect(m.t1).toBeGreaterThan(230);
    expect(m.t1).toBeLessThan(265);
    expect(m.label).toContain('/');
  });

  it('la forma normalizada vale 0,5 en la cola y 1 en el pico', () => {
    const m = impulseMetrics(0.41, 66);
    rel(impulseShape(m.tp, 0.41, 66), 1, 1e-6);
    rel(impulseShape(m.t0 + m.t2, 0.41, 66), 0.5, 1e-6);
    expect(impulseShape(m.tp * 3, 0.41, 66)).toBeLessThan(1);
  });
});

describe('probabilidad de disrupción', () => {
  it('U50 = 700 kV y σ = 6 % ⇒ U10 ≈ 646 kV', () => {
    const u10 = flashoverVoltage(700, 6, 10);
    expect(u10).toBeGreaterThan(640);
    expect(u10).toBeLessThan(652);
    rel(flashoverVoltage(700, 6, 50), 700, 1e-9);
  });
});

describe('atmósfera', () => {
  it('Bogotá: 2640 m y 14 °C', () => {
    rel(pressureAt(2640), 73.38, 0.01);
    rel(airDensity(2640, 14), 0.739, 0.01);
  });

  it('1950 m y 20 °C', () => {
    rel(pressureAt(1950), 79.99, 0.01);
    rel(airDensity(1950, 20), 0.7887, 0.01);
  });

  it('más altitud ⇒ menos densidad', () => {
    expect(airDensity(2640, 14)).toBeLessThan(airDensity(0, 14));
  });
});

describe('cadena de aisladores', () => {
  it('fuga requerida y discos del ejemplo', () => {
    rel(creepageRequired(245, 25, 1), 6125, 1e-9);
    rel(Math.ceil(6125 / 292), 21, 1e-9);
    rel(creepageRequired(245, 25, 2), 6125 / Math.sqrt(3), 1e-9);
  });

  it('CFO de maniobra 623,8 kV exige ≈7,1 unidades y la inversa regresa', () => {
    const n = insulatorsFromCfo(623.8);
    rel(n, 7.1, 0.05);
    rel(cfoFromInsulators(n), 623.8, 0.02);
  });

  it('soporte de maniobra y CFO requerido son coherentes', () => {
    const support = switchingSupport(245, 2.5, 1.15);
    rel(support, 1.15 * 2.5 * 245 * Math.sqrt(2 / 3), 1e-9);
    const cfo = cfoRequired(245, 2.5, 1.15, 1.3, 0.06, 0.739);
    expect(cfo).toBeGreaterThan(support);
  });
});

describe('puesta a tierra', () => {
  it('varilla de 3 m en ρ = 300 Ω·m', () => {
    rel(rodResistance(300, 3, 0.01), 101.8, 0.02);
  });

  it('contrapeso largo baja la resistencia y dos varillas también', () => {
    expect(counterpoiseResistance(300, 30, 0.01, 0.5)).toBeLessThan(counterpoiseResistance(300, 10, 0.01, 0.5));
    expect(parallelRods(100, 2)).toBeLessThan(100);
  });
});

describe('ondas viajeras', () => {
  it('Z2 = 100 frente a Z1 = 400: Γ = −0,60 y τ = 0,40', () => {
    rel(reflection(400, 100), -0.6, 1e-6);
    rel(1 + reflection(400, 100), 0.4, 1e-6);
  });

  it('300 m de línea tardan ≈2 µs', () => {
    const { v, zc } = lineParams(0.9, 11);
    expect(v).toBeGreaterThan(2.9e8);
    expect(v).toBeLessThan(3.3e8);
    rel((300 / v) * 1e6, 0.944, 0.05);
    expect(zc).toBeGreaterThan(250);
    expect(zc).toBeLessThan(310);
  });
});

describe('pararrayos', () => {
  it('margen de protección con 660 kV aplicados y 1050 kV de BIL', () => {
    rel(protectionMargin(1050, 660), 59.09, 1e-3);
  });

  it('Uc mínimo para 245 kV con neutro sólidamente aterrizado', () => {
    rel(ucMin(245, true), 1.05 * (245 / Math.sqrt(3)), 1e-9);
    rel(ucMin(245, false), 1.05 * 245, 1e-9);
  });

  it('TOV equivalente y capacidad dependen de la duración', () => {
    expect(tovEquivalent(195, 1)).toBeLessThan(195);
    rel(tovEquivalent(195, 10), 195, 1e-9);
    expect(tovCapability(195, 10)).toBeLessThan(tovCapability(195, 1));
  });
});

describe('corona', () => {
  it('radio equivalente del haz crece con el número de subconductores', () => {
    expect(bundleEquivalentRadius(1.4, 2, 40)).toBeGreaterThan(1.4);
    expect(bundleEquivalentRadius(1.4, 1, 40)).toBeCloseTo(1.4, 6);
  });

  it('el campo de incepción escala con la densidad del aire', () => {
    const alto = coronaInception(1.4, 400, 0.739);
    const costa = coronaInception(1.4, 400, 1.0);
    expect(costa.e0).toBeGreaterThan(alto.e0);
    expect(alto.u0).toBeGreaterThan(0);
  });

  it('pérdida de Peek: nula bajo incepción y creciente con la tensión', () => {
    const u0 = coronaInception(1.4, 400, 0.739).u0;
    expect(peekLoss(1.4, 400, 50, 0.739, u0 * 0.9, u0)).toBe(0);
    expect(peekLoss(1.4, 400, 50, 0.739, u0 * 1.2, u0)).toBeGreaterThan(0);
    expect(peekLoss(1.4, 400, 50, 0.739, u0 * 1.4, u0)).toBeGreaterThan(peekLoss(1.4, 400, 50, 0.739, u0 * 1.2, u0));
  });
});

describe('medición del aislamiento', () => {
  const sano: InsulationState = { conductionUA: 1, absorptionUA: 4, absTau: 40, testV: 5000 };
  const humedo: InsulationState = { conductionUA: 6, absorptionUA: 4, absTau: 40, testV: 5000 };

  it('la resistencia aparente sube con el tiempo de aplicación', () => {
    expect(insulationResistance(60, sano)).toBeGreaterThan(insulationResistance(30, sano));
  });

  it('DAR y PI bajan cuando aumenta la conducción', () => {
    expect(dar(sano)).toBeGreaterThan(dar(humedo));
    expect(piIndex(sano)).toBeGreaterThan(piIndex(humedo));
    expect(dar(sano)).toBeGreaterThan(1.25);
  });
});
