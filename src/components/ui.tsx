import { useEffect, useRef, type ReactNode } from 'react';
import { fmt } from '../lib/num';
import type { CheckItem, ParamDef, Reading } from '../experiments/types';

/* ------------------------------- Botones ------------------------------- */

export function Btn({
  children,
  onClick,
  tone = 'ghost',
  disabled,
  title,
}: {
  children: ReactNode;
  onClick?: () => void;
  tone?: 'primary' | 'ghost' | 'warn';
  disabled?: boolean;
  title?: string;
}) {
  return (
    <button className={`btn btn-${tone}`} onClick={onClick} disabled={disabled} title={title} type="button">
      {children}
    </button>
  );
}

export function Chip({ children, tone = 'neutral' }: { children: ReactNode; tone?: 'neutral' | 'ok' | 'warn' | 'bad' | 'accent' }) {
  return <span className={`chip chip-${tone}`}>{children}</span>;
}

/* -------------------------------- Escena ------------------------------- */

export function SceneCanvas({
  draw,
  aspect = 16 / 9,
  footer,
}: {
  draw: (ctx: CanvasRenderingContext2D, w: number, h: number, t: number) => void;
  aspect?: number;
  footer?: ReactNode;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const drawRef = useRef(draw);
  drawRef.current = draw;

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    let raf = 0;
    let stop = false;
    const start = performance.now();
    const loop = () => {
      if (stop) return;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const dpr = Math.min(2, globalThis.devicePixelRatio || 1);
        const rect = canvas.getBoundingClientRect();
        const w = Math.max(280, Math.round(rect.width));
        const h = Math.max(160, Math.round(rect.height));
        if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
          canvas.width = Math.round(w * dpr);
          canvas.height = Math.round(h * dpr);
        }
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, w, h);
        drawRef.current(ctx, w, h, (performance.now() - start) / 1000);
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      stop = true;
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div className="scene">
      <canvas ref={ref} style={{ aspectRatio: String(aspect) }} aria-label="Escena animada del fenómeno" />
      {footer && <div className="scene-foot">{footer}</div>}
    </div>
  );
}

/* ------------------------------- Controles ----------------------------- */

export function Control({
  def,
  value,
  onChange,
  format,
}: {
  def: ParamDef;
  value: number;
  onChange: (v: number) => void;
  format?: (v: number) => string;
}) {
  const dec = def.decimals ?? (def.step < 0.01 ? 3 : def.step < 1 ? 2 : 0);
  if (def.options) {
    return (
      <label className="control">
        <span className="control-head">
          <span className="control-label">{def.label}</span>
          <span className="control-value mono">{def.options.find((o) => o.value === value)?.label ?? String(value)}</span>
        </span>
        <select value={value} onChange={(e) => onChange(Number(e.target.value))}>
          {def.options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        {def.help && <span className="control-help">{def.help}</span>}
      </label>
    );
  }
  return (
    <label className="control">
      <span className="control-head">
        <span className="control-label">{def.label}</span>
        <span className="control-value mono">
          {format ? format(value) : fmt(value, dec)} {def.unit}
        </span>
      </span>
      <input
        type="range"
        min={def.min}
        max={def.max}
        step={def.step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      {def.help && <span className="control-help">{def.help}</span>}
    </label>
  );
}

/* ------------------------------- Lecturas ------------------------------ */

export function Readouts({ items }: { items: Reading[] }) {
  return (
    <div className="readouts">
      {items.map((r) => (
        <div key={r.label} className={`reading tone-${r.tone ?? 'neutral'}`}>
          <span className="reading-label">{r.label}</span>
          <span className="reading-value mono">{r.value}</span>
          {r.sub && <span className="reading-sub">{r.sub}</span>}
        </div>
      ))}
    </div>
  );
}

export function Equation({ lines, title = 'Ecuación viva' }: { lines: string[]; title?: string }) {
  return (
    <div className="equation">
      <div className="equation-title">{title}</div>
      {lines.map((l, i) => (
        <div className="equation-line mono" key={i}>
          {l}
        </div>
      ))}
    </div>
  );
}

export function Checks({ items }: { items: CheckItem[] }) {
  return (
    <ul className="checks">
      {items.map((c) => (
        <li key={c.label} className={c.info ? 'info' : c.ok ? 'ok' : 'bad'}>
          <span className="check-icon" aria-hidden>
            {c.info ? 'i' : c.ok ? '✓' : '✕'}
          </span>
          <span>
            <strong>{c.label}</strong>
            {c.detail && <em>{c.detail}</em>}
          </span>
        </li>
      ))}
    </ul>
  );
}

/* ------------------------------- Gráficas ------------------------------ */

export type Series = {
  pts: [number, number][];
  color: string;
  width?: number;
  dash?: string;
  area?: boolean;
  opacity?: number;
  label?: string;
  steps?: boolean;
};
export type Marker = { x: number; y: number; label?: string; color?: string; shape?: 'dot' | 'ring' | 'cross' };
export type RefLine = { at: number; label?: string; color?: string; dash?: string; axis?: 'x' | 'y' };
export type Band = { x1?: number; x2?: number; y1?: number; y2?: number; color?: string; label?: string };

export function Plot({
  xDomain,
  yDomain,
  xLabel,
  yLabel,
  series = [],
  markers = [],
  refs = [],
  bands = [],
  xLog = false,
  yLog = false,
  caption,
  height = 250,
  ticksX = 5,
  ticksY = 5,
}: {
  xDomain: [number, number];
  yDomain: [number, number];
  xLabel: string;
  yLabel: string;
  series?: Series[];
  markers?: Marker[];
  refs?: RefLine[];
  bands?: Band[];
  xLog?: boolean;
  yLog?: boolean;
  caption?: string;
  height?: number;
  ticksX?: number;
  ticksY?: number;
}) {
  const W = 560;
  const H = height;
  const m = { l: 58, r: 16, t: 16, b: 40 };
  const iw = W - m.l - m.r;
  const ih = H - m.t - m.b;

  const sx = (x: number) => {
    const [a, b] = xDomain;
    if (xLog) return m.l + (Math.log10(Math.max(1e-9, x)) - Math.log10(Math.max(1e-9, a))) / (Math.log10(Math.max(1e-9, b)) - Math.log10(Math.max(1e-9, a))) * iw;
    return m.l + ((x - a) / (b - a || 1)) * iw;
  };
  const sy = (y: number) => {
    const [a, b] = yDomain;
    if (yLog) return m.t + ih - (Math.log10(Math.max(1e-9, y)) - Math.log10(Math.max(1e-9, a))) / (Math.log10(Math.max(1e-9, b)) - Math.log10(Math.max(1e-9, a))) * ih;
    return m.t + ih - ((y - a) / (b - a || 1)) * ih;
  };

  const ticks = (domain: [number, number], n: number, log: boolean) => {
    const [a, b] = domain;
    if (log) {
      const out: number[] = [];
      for (let e = Math.floor(Math.log10(a)); e <= Math.ceil(Math.log10(b)); e++) {
        for (const k of [1, 2, 5]) {
          const v = k * Math.pow(10, e);
          if (v >= a * 0.999 && v <= b * 1.001) out.push(v);
        }
      }
      return out;
    }
    const step = (b - a) / n;
    const mag = Math.pow(10, Math.floor(Math.log10(Math.abs(step) || 1)));
    const norm = step / mag;
    const nice = norm < 1.5 ? 1 : norm < 3.5 ? 2 : norm < 7.5 ? 5 : 10;
    const s2 = nice * mag;
    const start = Math.ceil(a / s2) * s2;
    const out: number[] = [];
    for (let v = start; v <= b + 1e-9; v += s2) out.push(Number(v.toFixed(10)));
    return out;
  };

  const labelNum = (v: number) => {
    if (Math.abs(v) >= 10000) return `${(v / 1000).toFixed(0)}k`;
    if (Math.abs(v) >= 100) return v.toFixed(0);
    if (Math.abs(v) >= 10) return v.toFixed(0);
    if (Math.abs(v) >= 1) return v.toFixed(1);
    return v.toFixed(2);
  };

  const path = (s: Series) => {
    const pts = s.pts.filter(([x, y]) => Number.isFinite(x) && Number.isFinite(y));
    return pts
      .map(([x, y], i) => {
        const X = Math.max(m.l - 2, Math.min(W - m.r + 2, sx(x)));
        const Y = Math.max(m.t - 2, Math.min(H - m.b + 2, sy(y)));
        if (i === 0) return `M${X.toFixed(1)},${Y.toFixed(1)}`;
        if (s.steps) {
          const [px] = pts[i - 1];
          const pxSvg = Math.max(m.l - 2, Math.min(W - m.r + 2, sx(px)));
          return `L${pxSvg.toFixed(1)},${Y.toFixed(1)} L${X.toFixed(1)},${Y.toFixed(1)}`;
        }
        return `L${X.toFixed(1)},${Y.toFixed(1)}`;
      })
      .join(' ');
  };

  const areaPath = (s: Series) => {
    const p = path(s);
    if (!p) return '';
    const base = sy(Math.max(yDomain[0], Math.min(yDomain[1], 0)));
    const first = s.pts[0];
    const last = s.pts[s.pts.length - 1];
    return `${p} L${sx(last[0]).toFixed(1)},${base.toFixed(1)} L${sx(first[0]).toFixed(1)},${base.toFixed(1)} Z`;
  };

  return (
    <figure className="plot">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`${yLabel} en función de ${xLabel}`}>
        <rect x={m.l} y={m.t} width={iw} height={ih} fill="rgba(6,18,28,0.55)" stroke="rgba(120,190,220,0.18)" />
        {bands.map((b, i) => {
          const x = sx(b.x1 ?? xDomain[0]);
          const w = sx(b.x2 ?? xDomain[1]) - x;
          const y = sy(b.y2 ?? yDomain[1]);
          const h = sy(b.y1 ?? yDomain[0]) - y;
          return (
            <g key={`b${i}`}>
              <rect x={Math.min(x, x + w)} y={Math.min(y, y + h)} width={Math.abs(w)} height={Math.abs(h)} fill={b.color ?? 'rgba(56,225,198,0.07)'} />
              {b.label && (
                <text x={Math.min(x, x + w) + 6} y={Math.min(y, y + h) + 13} fontSize="9.5" fill="rgba(220,240,245,0.65)">
                  {b.label}
                </text>
              )}
            </g>
          );
        })}
        {ticks(xDomain, ticksX, xLog).map((v) => (
          <g key={`x${v}`}>
            <line x1={sx(v)} y1={m.t} x2={sx(v)} y2={H - m.b} stroke="rgba(120,190,220,0.10)" />
            <text x={sx(v)} y={H - m.b + 15} fontSize="9.5" fill="#8fb0bf" textAnchor="middle" fontFamily="ui-monospace, monospace">
              {xLog ? labelNum(v) : labelNum(v)}
            </text>
          </g>
        ))}
        {ticks(yDomain, ticksY, yLog).map((v) => (
          <g key={`y${v}`}>
            <line x1={m.l} y1={sy(v)} x2={W - m.r} y2={sy(v)} stroke="rgba(120,190,220,0.10)" />
            <text x={m.l - 8} y={sy(v) + 3} fontSize="9.5" fill="#8fb0bf" textAnchor="end" fontFamily="ui-monospace, monospace">
              {labelNum(v)}
            </text>
          </g>
        ))}
        {refs.map((r, i) =>
          r.axis === 'y' || r.axis === undefined ? (
            <g key={`r${i}`}>
              <line x1={m.l} y1={sy(r.at)} x2={W - m.r} y2={sy(r.at)} stroke={r.color ?? '#ff6b6b'} strokeDasharray={r.dash ?? '5 4'} strokeWidth="1.2" />
              {r.label && (
                <text x={W - m.r - 4} y={sy(r.at) - 5} fontSize="9.5" fill={r.color ?? '#ff6b6b'} textAnchor="end">
                  {r.label}
                </text>
              )}
            </g>
          ) : (
            <g key={`r${i}`}>
              <line x1={sx(r.at)} y1={m.t} x2={sx(r.at)} y2={H - m.b} stroke={r.color ?? '#ffc857'} strokeDasharray={r.dash ?? '5 4'} strokeWidth="1.2" />
              {r.label && (
                <text x={sx(r.at) + 4} y={m.t + 12} fontSize="9.5" fill={r.color ?? '#ffc857'}>
                  {r.label}
                </text>
              )}
            </g>
          ),
        )}
        {series.map((s, i) => (
          <g key={`s${i}`}>
            {s.area && <path d={areaPath(s)} fill={s.color} opacity={s.opacity ?? 0.13} />}
            <path d={path(s)} fill="none" stroke={s.color} strokeWidth={s.width ?? 2} strokeDasharray={s.dash} opacity={s.opacity ?? 1} strokeLinejoin="round" />
          </g>
        ))}
        {markers.map((mk, i) => {
          const X = sx(mk.x);
          const Y = sy(mk.y);
          const col = mk.color ?? '#ffc857';
          return (
            <g key={`m${i}`}>
              {mk.shape === 'cross' ? (
                <>
                  <line x1={X - 4} y1={Y - 4} x2={X + 4} y2={Y + 4} stroke={col} strokeWidth="2" />
                  <line x1={X - 4} y1={Y + 4} x2={X + 4} y2={Y - 4} stroke={col} strokeWidth="2" />
                </>
              ) : (
                <>
                  <circle cx={X} cy={Y} r={4.5} fill={mk.shape === 'ring' ? 'none' : col} stroke={col} strokeWidth="2" />
                  {mk.shape === 'ring' && <circle cx={X} cy={Y} r={4.5} fill={col} opacity={0.25} />}
                </>
              )}
              {mk.label && (
                <text x={X + 8} y={Y - 8} fontSize="10" fill={col} fontFamily="ui-monospace, monospace">
                  {mk.label}
                </text>
              )}
            </g>
          );
        })}
        <text x={m.l + iw / 2} y={H - 6} fontSize="10.5" fill="#8fb0bf" textAnchor="middle">
          {xLabel}
        </text>
        <text x={13} y={m.t + ih / 2} fontSize="10.5" fill="#8fb0bf" textAnchor="middle" transform={`rotate(-90 13 ${m.t + ih / 2})`}>
          {yLabel}
        </text>
      </svg>
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}
