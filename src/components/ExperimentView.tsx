import { useEffect, useMemo, useState } from 'react';
import type { Experiment } from '../experiments/types';
import type { Topic } from '../content/topics';
import { SOURCES } from '../content/bibliography';
import { defaults } from '../experiments/types';
import { Checks, Control, Equation, Readouts } from './ui';
import { Stars } from './Home';
import type { Solved } from '../lib/storage';

type Status = 'idle' | 'fail' | 'ok';

export function ExperimentView({
  exp,
  topic,
  solved,
  quizAnswer,
  onVisit,
  onSolve,
  onQuiz,
  onBack,
  onNext,
}: {
  exp: Experiment;
  topic: Topic;
  solved?: Solved;
  quizAnswer?: string;
  onVisit: () => void;
  onSolve: (attempts: number, hint: boolean) => number;
  onQuiz: (id: string, option: string) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  const base = useMemo(() => defaults(exp), [exp]);
  const [p, setP] = useState(base);
  const [presetId, setPresetId] = useState(exp.presets[0]?.id ?? '');
  const [attempts, setAttempts] = useState(0);
  const [hint, setHint] = useState(false);
  const [status, setStatus] = useState<Status>('idle');
  const [stars, setStars] = useState(solved?.stars ?? 0);
  const [quizPick, setQuizPick] = useState<string | undefined>(quizAnswer);
  const [milestones, setMilestones] = useState<string[]>(() => (solved ? exp.goals.filter((g) => g.kind === 'exploracion').map((g) => g.id) : []));
  const Scene = exp.scene;
  const Chart = exp.plot;

  useEffect(() => {
    onVisit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exp.id]);

  const d = useMemo(() => exp.compute(p), [exp, p]);
  const readings = exp.readings(d, p);
  const equations = exp.equations(p, d);
  const checks = exp.checks ? exp.checks(p, d) : [];
  const goals = exp.goals.map((g) => ({
    ...g,
    pass: g.test(p, d),
    exploracion: g.kind === 'exploracion',
    visited: milestones.includes(g.id),
  }));
  const reqs = goals.filter((g) => !g.exploracion);
  const reqOk = reqs.every((g) => g.pass);
  const pending = goals.filter((g) => g.exploracion && !g.pass && !g.visited);
  const ready = reqOk && pending.length === 0 && goals.every((g) => !g.exploracion || g.pass || g.visited);
  const quizOk = !exp.quiz || quizPick === exp.quiz.correct;

  useEffect(() => {
    const hit = goals.filter((g) => g.exploracion && g.pass && !g.visited).map((g) => g.id);
    if (hit.length > 0) setMilestones((prev) => [...prev, ...hit]);
  }, [goals, milestones]);

  const setParam = (id: string, v: number) => {
    setP((prev) => ({ ...prev, [id]: v }));
    setPresetId('');
    setStatus('idle');
  };

  const loadPreset = (id: string) => {
    const preset = exp.presets.find((x) => x.id === id);
    if (!preset) return;
    setP({ ...base, ...preset.values });
    setPresetId(id);
    setStatus('idle');
  };

  const validate = () => {
    if (ready && quizOk) {
      const s = onSolve(attempts, hint);
      setStars(s);
      setStatus('ok');
    } else {
      setAttempts((a) => a + 1);
      setStatus('fail');
    }
  };

  return (
    <div className="wrap exp">
      <div className="crumbs">
        <button className="link" onClick={onBack}>
          ← Tema {topic.id}
        </button>
        <span>/</span>
        <span className="mono">{exp.id}</span>
        {solved && (
          <>
            <span className="sep">·</span>
            <Stars n={solved.stars} />
          </>
        )}
      </div>

      <header className="exp-head">
        <div>
          <span className="eyebrow">
            Tema {topic.id} · {topic.title}
          </span>
          <h1>{exp.title}</h1>
          <p className="tagline">{exp.tagline}</p>
          <p className="why">
            <strong>Para qué sirve:</strong> {exp.why}
          </p>
        </div>
        <div className="exp-badges">
          <span className="pill mono">fenómeno físico</span>
          <span className="pill mono">reto con 3 estrellas</span>
        </div>
      </header>

      <div className="lab">
        <div className="lab-main">
          <section className="card scene-card">
            <div className="card-head">
              <h2>La escena</h2>
              <span className="muted small">se anima con tus parámetros</span>
            </div>
            <Scene p={p} d={d} t={0} />
          </section>

          <section className="card">
            <div className="card-head">
              <h2>El comportamiento</h2>
              <span className="muted small">lo que hay que mirar</span>
            </div>
            <Chart p={p} d={d} />
          </section>

          <section className="card learn-card">
            <div className="card-head">
              <h2>Qué aprendes aquí</h2>
              <span className="pill accent">{exp.id}</span>
            </div>
            <div className="learn-grid">
              <div>
                <h3>El fenómeno</h3>
                <p>{exp.learn.phenomenon}</p>
              </div>
              <div>
                <h3>El objetivo</h3>
                <p>{exp.learn.objective}</p>
              </div>
            </div>
            <div className="learn-watch">
              <h3>Qué mirar para convencerte</h3>
              <ul>
                {exp.learn.watch.map((w) => (
                  <li key={w}>{w}</li>
                ))}
              </ul>
            </div>
            <div className="learn-miss">
              <h3>El error clásico</h3>
              <p>{exp.learn.misconception}</p>
            </div>
            {exp.learn.model && (
              <div className="learn-model">
                <h3>Límite del modelo</h3>
                <p>{exp.learn.model}</p>
              </div>
            )}
            {exp.notes && exp.notes.length > 0 && (
              <details className="notes">
                <summary>Notas de cálculo y convenciones ({exp.notes.length})</summary>
                <ul>
                  {exp.notes.map((n) => (
                    <li key={n}>{n}</li>
                  ))}
                </ul>
              </details>
            )}
            <div className="sources">
              {exp.sources.map((k) => (
                <span key={k} className="source" title={`${SOURCES[k].title} — ${SOURCES[k].role}`}>
                  <strong>{SOURCES[k].short}</strong>
                  <em>{SOURCES[k].pages}</em>
                </span>
              ))}
            </div>
          </section>
        </div>

        <aside className="lab-side">
          <section className="card">
            <div className="card-head">
              <h2>Parámetros</h2>
              <button
                className="link small"
                onClick={() => {
                  setP(base);
                  setPresetId('');
                  setStatus('idle');
                  setAttempts(0);
                  setHint(false);
                }}
              >
                reiniciar
              </button>
            </div>
            {exp.presets.length > 0 && (
              <div className="presets">
                {exp.presets.map((pr) => (
                  <button
                    key={pr.id}
                    className={`preset ${presetId === pr.id ? 'on' : ''}`}
                    onClick={() => loadPreset(pr.id)}
                    title={pr.note}
                  >
                    {pr.label}
                  </button>
                ))}
              </div>
            )}
            <div className="controls">
              {exp.params.map((def) => (
                <Control key={def.id} def={def} value={p[def.id]} onChange={(v) => setParam(def.id, v)} />
              ))}
            </div>
          </section>

          <section className="card">
            <div className="card-head">
              <h2>Lecturas</h2>
              <span className="muted small">resultado del modelo</span>
            </div>
            <Readouts items={readings} />
          </section>

          <section className={`card challenge ${status}`}>
            <div className="card-head">
              <h2>El reto</h2>
              <Stars n={stars} size={14} />
            </div>
            <p className="muted small">
              {ready
                ? 'Todo listo: valida para cerrar el reto.'
                : reqOk
                  ? `Faltan hitos por explorar: ${pending.map((g) => g.label).join(' · ') || 'ninguno'}.`
                  : 'Ajusta los parámetros hasta cumplir los requisitos marcados.'}
            </p>
            <ul className="goals">
              {goals.map((g) => {
                const done = g.exploracion ? g.pass || g.visited : g.pass;
                return (
                  <li key={g.id} className={done ? 'pass' : ''}>
                    <span className="dot" aria-hidden>
                      {done ? '✓' : '○'}
                    </span>
                    <span>
                      <strong>
                        {g.label}
                        <span className={`tag ${g.exploracion ? 'tag-exp' : 'tag-req'}`}>{g.exploracion ? 'hito' : 'requisito'}</span>
                      </strong>
                      <em>{g.detail(p, d)}</em>
                      {g.exploracion && g.visited && !g.pass && <em className="milestone-done">alcanzado antes en esta sesión</em>}
                    </span>
                  </li>
                );
              })}
            </ul>

            {exp.quiz && (
              <div className="quiz">
                <h3>Decisión</h3>
                <p>{exp.quiz.question}</p>
                <div className="quiz-options">
                  {exp.quiz.options.map((o) => (
                    <button
                      key={o.id}
                      className={`quiz-opt ${quizPick === o.id ? 'picked' : ''} ${
                        quizPick && o.id === exp.quiz!.correct ? 'right' : ''
                      }`}
                      onClick={() => {
                        setQuizPick(o.id);
                        onQuiz(exp.id, o.id);
                        setStatus('idle');
                      }}
                    >
                      {o.label}
                    </button>
                  ))}
                </div>
                {quizPick && (
                  <p className={`quiz-fb ${quizOk ? 'ok' : 'bad'}`}>
                    <strong>{quizOk ? 'Correcto. ' : 'Revisa. '}</strong>
                    {exp.quiz.explanation}
                  </p>
                )}
              </div>
            )}

            <div className="challenge-actions">
              <button className="btn btn-primary" onClick={validate}>
                Validar reto
              </button>
              <button className="btn btn-ghost" onClick={() => setHint((h) => !h)}>
                {hint ? 'Ocultar pista' : 'Pista'}
              </button>
            </div>
            {hint && (
              <p className="hintbox">
                {goals
                  .filter((g) => !g.pass)
                  .map((g) => `${g.label}: ${g.detail(p, d)}`)
                  .slice(0, 3)
                  .join(' · ') || 'Ya cumples todos los criterios; solo falta validar.'}
              </p>
            )}
            {status === 'fail' && (
              <p className="fb-line bad">
                Todavía no: {goals.filter((g) => (g.exploracion ? !(g.pass || g.visited) : !g.pass)).map((g) => g.label).join(', ') || 'falta la decisión de la derecha'}.
              </p>
            )}
            {status === 'ok' && (
              <p className="fb-line ok">
                Reto cerrado con {stars} {stars === 1 ? 'estrella' : 'estrellas'}. {attempts === 0 ? 'Sin intentos fallidos.' : `Intentos fallidos: ${attempts}.`}
              </p>
            )}
            {attempts > 0 && status !== 'ok' && <p className="muted small">Intentos fallidos: {attempts}.</p>}
          </section>

          {checks.length > 0 && (
            <section className="card">
              <div className="card-head">
                <h2>Verificaciones</h2>
                <span className="muted small">contraste con el material</span>
              </div>
              <Checks items={checks} />
            </section>
          )}

          <section className="card">
            <Equation lines={equations} />
          </section>

          <button className="btn btn-ghost next-btn" onClick={onNext}>
            Siguiente experimento →
          </button>
        </aside>
      </div>
    </div>
  );
}
