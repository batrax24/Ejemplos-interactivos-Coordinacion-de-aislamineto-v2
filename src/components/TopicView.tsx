import { TOPICS, type Topic } from '../content/topics';
import { SOURCES } from '../content/bibliography';
import { experimentsFor } from '../experiments';
import type { Progress } from '../lib/storage';
import { Stars } from './Home';

export function TopicView({
  topic,
  progress,
  onExp,
  onTopic,
}: {
  topic: Topic;
  progress: Progress;
  onExp: (id: string) => void;
  onTopic: (id: number) => void;
}) {
  const exps = experimentsFor(topic.experiments);
  const prev = TOPICS.find((t) => t.id === topic.id - 1);
  const next = TOPICS.find((t) => t.id === topic.id + 1);

  return (
    <div className="wrap">
      <div className="crumbs">
        <button className="link" onClick={() => onTopic(1)}>
          Temas
        </button>
        <span>/</span>
        <span className="mono">tema {String(topic.id).padStart(2, '0')}</span>
      </div>

      <header className="topic-head">
        <div>
          <span className="eyebrow">
            Tema {topic.id} · {topic.minutes} · diapositivas {topic.slides}
          </span>
          <h1>{topic.title}</h1>
          <p className="lead">{topic.idea}</p>
        </div>
        <div className="topic-keys card">
          <h3>Conceptos que debes poder explicar</h3>
          <ul>
            {topic.keys.map((k) => (
              <li key={k}>{k}</li>
            ))}
          </ul>
        </div>
      </header>

      <section className="topic-exps-list">
        <h2>Experimentos de este tema</h2>
        {exps.length === 0 && (
          <p className="muted">
            Este es el bloque de apertura: la idea de coordinar esfuerzo y soporte se ve en la misión integradora del tema 13.
          </p>
        )}
        <div className="exp-grid">
          {exps.map((e) => (
            <button key={e.id} className="exp-card" onClick={() => onExp(e.id)}>
              <div className="exp-card-top">
                <span className="mono badgeless">{e.id}</span>
                {progress.solved[e.id] ? <Stars n={progress.solved[e.id].stars} /> : <span className="muted small">sin resolver</span>}
              </div>
              <h3>{e.title}</h3>
              <p>{e.tagline}</p>
              <span className="exp-card-why">{e.why}</span>
              <span className="exp-card-go">Abrir →</span>
            </button>
          ))}
        </div>
      </section>

      <section className="card">
        <h3>Fuentes de este bloque</h3>
        <ul className="source-inline">
          {topic.sources.map((k) => (
            <li key={k}>
              <strong>{SOURCES[k].short}</strong> · {SOURCES[k].pages}
            </li>
          ))}
        </ul>
      </section>

      <nav className="pager">
        {prev ? (
          <button className="btn btn-ghost" onClick={() => onTopic(prev.id)}>
            ← Tema {prev.id}: {prev.title}
          </button>
        ) : (
          <span />
        )}
        {next ? (
          <button className="btn btn-ghost" onClick={() => onTopic(next.id)}>
            Tema {next.id}: {next.title} →
          </button>
        ) : (
          <button className="btn btn-primary" onClick={() => onTopic(13)}>
            Ir a la misión final →
          </button>
        )}
      </nav>
    </div>
  );
}
