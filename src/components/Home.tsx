import { useRef } from 'react';
import { TOPICS } from '../content/topics';
import { experimentsFor } from '../experiments';
import { rankFor, type Progress } from '../lib/storage';
import { buildNumericBank } from '../content/practica';
import { Chip } from './ui';

const BANK_SIZE = buildNumericBank().length;

export function Stars({ n, size = 11 }: { n: number; size?: number }) {
  return (
    <span className="stars" style={{ fontSize: size }} aria-label={`${n} de 3 estrellas`}>
      {[1, 2, 3].map((i) => (
        <span key={i} className={i <= n ? 'on' : ''}>
          ★
        </span>
      ))}
    </span>
  );
}

export function Home({
  progress,
  onTopic,
  onExp,
  onPractice,
  onSources,
  onExport,
  onImport,
  onReset,
}: {
  progress: Progress;
  onTopic: (id: number) => void;
  onExp: (id: string) => void;
  onPractice: () => void;
  onSources: () => void;
  onExport: () => void;
  onImport: (text: string) => void;
  onReset: () => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const rank = rankFor(progress.xp);
  const solved = Object.keys(progress.solved).length;
  const totalGoals = 19;

  return (
    <div className="wrap">
      <section className="hero">
        <div className="hero-copy">
          <span className="eyebrow">Laboratorio interactivo · versión 2</span>
          <h1>
            Coordinación de aislamiento,
            <br />
            para mover y ver.
          </h1>
          <p className="lead">
            Diecinueve experimentos sobre los fenómenos de la exposición: sobretensiones, rayo, disrupción, atmósfera, cadenas,
            distancias, guarda, tierra, ondas viajeras, pararrayos y corona. Cada uno dice <strong>qué fenómeno muestra</strong>,{' '}
            <strong>qué deberías aprender</strong> y <strong>qué mirar</strong> para convencerte.
          </p>
          <div className="hero-actions">
            <button className="btn btn-primary" onClick={() => onTopic(1)}>
              Empezar por el tema 1
            </button>
            <button className="btn btn-ghost" onClick={onPractice}>
              Simulacro de sustentación
            </button>
            <button className="btn btn-ghost" onClick={onSources}>
              Ver bibliografía
            </button>
          </div>
          <div className="hero-stats">
            <div>
              <b>19</b>
              <span>experimentos</span>
            </div>
            <div>
              <b>13</b>
              <span>temas del guion</span>
            </div>
            <div>
              <b>8</b>
              <span>diagnósticos</span>
            </div>
            <div>
              <b>{BANK_SIZE}</b>
              <span>preguntas numéricas</span>
            </div>
          </div>
        </div>
        <div className="hero-art" aria-hidden>
          <div className="art-line" />
          <div className="art-tower">
            <span />
            <span />
            <span />
          </div>
          <div className="art-wave">
            {Array.from({ length: 28 }).map((_, i) => (
              <i key={i} style={{ height: `${12 + Math.abs(Math.sin(i * 0.7)) * 46}px` }} />
            ))}
          </div>
          <div className="art-label mono">245 kV · δ 0,74 · 21 discos · Γ −0,60</div>
        </div>
      </section>

      <section className="principles">
        <article className="principle">
          <span className="pnum">1</span>
          <h3>Primero el fenómeno</h3>
          <p>La escena animada muestra qué está pasando físicamente antes de cualquier fórmula: dónde salta el arco, cómo viaja la onda, qué se calienta.</p>
        </article>
        <article className="principle">
          <span className="pnum">2</span>
          <h3>Después el número</h3>
          <p>Mueves parámetros y la ecuación se escribe con tus valores. La gráfica dice si tu caso cae dentro o fuera del criterio.</p>
        </article>
        <article className="principle">
          <span className="pnum">3</span>
          <h3>Al final, la verificación</h3>
          <p>Los retos se ganan cumpliendo la física, no acercándose a una cifra: si el requisito es 2,42 m, 2,06 m no aprueba.</p>
        </article>
      </section>

      <section className="progress-card card">
        <div>
          <span className="eyebrow">Tu avance</span>
          <h2>{rank.name}</h2>
          <p className="muted">
            {progress.xp} XP · {solved} de {totalGoals} retos resueltos · {Object.keys(progress.quiz).length} diagnósticos respondidos
          </p>
          <div className="progress-line">
            <span style={{ width: `${rank.pct}%` }} />
          </div>
          {rank.next && <p className="muted small">Siguen {rank.next - progress.xp} XP para el siguiente rango.</p>}
        </div>
        <div className="progress-actions">
          <button className="btn btn-ghost" onClick={onExport}>
            Descargar progreso
          </button>
          <button className="btn btn-ghost" onClick={() => fileRef.current?.click()}>
            Cargar progreso
          </button>
          <button className="btn btn-warn" onClick={onReset}>
            Reiniciar
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json"
            hidden
            onChange={(ev) => {
              const file = ev.target.files?.[0];
              if (!file) return;
              const reader = new FileReader();
              reader.onload = () => onImport(String(reader.result ?? ''));
              reader.readAsText(file);
              ev.target.value = '';
            }}
          />
        </div>
      </section>

      <section className="topics-head">
        <h2>Los 13 temas de la exposición</h2>
        <p className="muted">
          Ordenados como el guion de 120 minutos. Cada tarjeta abre los experimentos de ese bloque; el tiempo y las diapositivas son los
          del material original.
        </p>
      </section>

      <div className="topic-grid">
        {TOPICS.map((t) => {
          const exps = experimentsFor(t.experiments);
          return (
            <article className="topic-card" key={t.id}>
              <header>
                <span className="topic-num mono">{String(t.id).padStart(2, '0')}</span>
                <div>
                  <h3>{t.title}</h3>
                  <span className="muted small mono">
                    {t.minutes} · diap. {t.slides}
                  </span>
                </div>
              </header>
              <p className="topic-idea">{t.idea}</p>
              <div className="topic-exps">
                {exps.length === 0 && <span className="muted small">Concepto de apertura: se desarrolla en el tema 13.</span>}
                {exps.map((e) => (
                  <button key={e.id} className="exp-chip" onClick={() => onExp(e.id)}>
                    <span className="mono">{e.id}</span>
                    <span className="exp-chip-title">{e.title}</span>
                    {progress.solved[e.id] ? <Stars n={progress.solved[e.id].stars} /> : <Chip tone="neutral">nuevo</Chip>}
                  </button>
                ))}
              </div>
              <footer>
                <button className="link" onClick={() => onTopic(t.id)}>
                  Abrir tema {t.id} →
                </button>
              </footer>
            </article>
          );
        })}
      </div>

      <section className="closing card">
        <h2>Cómo se juega</h2>
        <ol className="steps">
          <li>Elige un tema y abre uno de sus experimentos.</li>
          <li>Lee la tarjeta «Qué aprendes aquí» antes de tocar los controles: te dice qué mirar.</li>
          <li>Mueve los parámetros o carga un preset del material (245 kV, 21 discos, δ = 0,90, Γ = −0,60…).</li>
          <li>
            Cumple los <strong>requisitos</strong> del estado actual y recorre los <strong>hitos</strong> (reproducir el ejemplo, ver el caso
            opuesto). Sin pista y con pocos intentos: 3 estrellas.
          </li>
          <li>Cierra con el simulacro: preguntas numéricas de los presets y diagnósticos de casos reales.</li>
        </ol>
        <p className="muted small">
          Todos los modelos son didácticos y están acotados en la tarjeta de cada experimento. Las cifras reproducen el guion y la guía de
          ejercicios; para un proyecto real se consultan las normas y los catálogos vigentes.
        </p>
      </section>
    </div>
  );
}
