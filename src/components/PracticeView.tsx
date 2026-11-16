import { useMemo, useState } from 'react';
import { DIAGNOSTICS, buildNumericBank, fmtAnswer, type Diagnostic, type NumericQuestion } from '../content/practica';
import { mulberry32 } from '../lib/num';
import { EXPERIMENT_BY_ID } from '../experiments';
import type { Progress } from '../lib/storage';

type Item = { kind: 'num'; q: NumericQuestion } | { kind: 'diag'; q: Diagnostic };

function parseInput(text: string): number | null {
  const t = text.trim().replace(/\s|kV|MΩ|Ω|m|%|mm|kW\/km|µs|pF|Hz/g, '').replace('−', '-');
  if (!t) return null;
  let norm = t;
  if (t.includes(',') && t.includes('.')) norm = t.replace(/\./g, '').replace(',', '.');
  else if (t.includes(',')) norm = t.replace(',', '.');
  else if (/^-?\d{1,3}(\.\d{3})+$/.test(t)) norm = t.replace(/\./g, '');
  const n = Number(norm);
  return Number.isFinite(n) ? n : null;
}

function buildRound(seed: number): Item[] {
  const rnd = mulberry32(seed);
  const bank = buildNumericBank();
  const numeric = [...bank];
  const chosen: Item[] = [];
  for (let i = 0; i < 5 && numeric.length > 0; i++) {
    const idx = Math.floor(rnd() * numeric.length);
    const [q] = numeric.splice(idx, 1);
    chosen.push({ kind: 'num', q });
  }
  const diag = [...DIAGNOSTICS];
  for (let i = 0; i < 3 && diag.length > 0; i++) {
    const idx = Math.floor(rnd() * diag.length);
    const [q] = diag.splice(idx, 1);
    chosen.push({ kind: 'diag', q });
  }
  // mezcla simple
  for (let i = chosen.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [chosen[i], chosen[j]] = [chosen[j], chosen[i]];
  }
  return chosen;
}

export function PracticeView({
  onExp,
  progress,
  onFinish,
}: {
  onExp: (id: string) => void;
  progress: Progress;
  onFinish: (score: number, total: number) => void;
}) {
  const [seed, setSeed] = useState(1);
  const items = useMemo(() => buildRound(seed), [seed]);
  const [numAnswers, setNumAnswers] = useState<Record<string, string>>({});
  const [diagAnswers, setDiagAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  const score = items.reduce((acc, it) => {
    if (it.kind === 'num') {
      const v = parseInput(numAnswers[it.q.id] ?? '');
      return acc + (v !== null && Math.abs(v - it.q.answer) <= it.q.tolerance ? 1 : 0);
    }
    const pick = diagAnswers[it.q.id];
    return acc + (pick === it.q.correct ? 1 : 0);
  }, 0);

  const answered = items.filter((it) =>
    it.kind === 'num' ? (numAnswers[it.q.id] ?? '').trim() !== '' : Boolean(diagAnswers[it.q.id]),
  ).length;

  return (
    <div className="wrap">
      <header className="page-head">
        <div>
          <span className="eyebrow">Simulacro de sustentación</span>
          <h1>Cinco cálculos y tres casos</h1>
          <p className="lead">
            Las preguntas numéricas salen de los mismos presets y modelos que usaste en el laboratorio, con una tolerancia del 2 %. Los
            casos piden decidir qué fenómeno ocurre y qué revisarías al sustentar.
          </p>
        </div>
        <div className="score-box card">
          <span className="muted small">{submitted ? 'Resultado' : 'En curso'}</span>
          <b className="mono">
            {submitted ? `${score}/${items.length}` : `${answered}/${items.length}`}
          </b>
          <span className="muted small">{submitted ? (score >= 6 ? 'Aprobado: puedes sustentar.' : 'Repasa los temas marcados.') : 'responde todo y califica'}</span>
        </div>
      </header>

      <ol className="quiz-list">
        {items.map((it, i) => {
          const idx = i + 1;
          if (it.kind === 'num') {
            const q = it.q;
            const exp = EXPERIMENT_BY_ID.get(q.exp);
            const raw = numAnswers[q.id] ?? '';
            const v = parseInput(raw);
            const ok = v !== null && Math.abs(v - q.answer) <= q.tolerance;
            return (
              <li key={q.id} className={`card quiz-item ${submitted ? (ok ? 'ok' : 'bad') : ''}`}>
                <div className="quiz-item-head">
                  <span className="pill mono">cálculo {idx}</span>
                  <span className="muted small">
                    {exp?.title} · tema {q.topicId}
                  </span>
                </div>
                <p className="quiz-q">{q.prompt}</p>
                <div className="answer-row">
                  <input
                    type="text"
                    inputMode="decimal"
                    placeholder="valor"
                    value={raw}
                    onChange={(e) => setNumAnswers({ ...numAnswers, [q.id]: e.target.value })}
                    disabled={submitted}
                  />
                  <span className="unit mono">{q.unit}</span>
                  {submitted && (
                    <span className={`verdict ${ok ? 'ok' : 'bad'}`}>
                      {ok ? '✓ correcto' : `✕ esperado ${fmtAnswer(q.answer, q.unit)}`}
                    </span>
                  )}
                </div>
                {submitted && (
                  <div className="solution">
                    <p className="mono">{q.solution}</p>
                    <button className="link small" onClick={() => onExp(q.exp)}>
                      abrir {q.exp} →
                    </button>
                  </div>
                )}
              </li>
            );
          }
          const q = it.q;
          const pick = diagAnswers[q.id];
          const ok = pick === q.correct;
          const exp = EXPERIMENT_BY_ID.get(q.exp);
          return (
            <li key={q.id} className={`card quiz-item ${submitted ? (ok ? 'ok' : 'bad') : ''}`}>
              <div className="quiz-item-head">
                <span className="pill mono">caso {idx}</span>
                <span className="muted small">
                  {exp?.title} · tema {exp?.topicId}
                  {progress.quiz[q.exp] === q.correct ? ' · ya lo resolviste' : ''}
                </span>
              </div>
              <p className="scenario">{q.scenario}</p>
              <p className="quiz-q">{q.question}</p>
              <div className="quiz-options">
                {q.options.map((o) => (
                  <button
                    key={o.id}
                    className={`quiz-opt ${pick === o.id ? 'picked' : ''} ${submitted && o.id === q.correct ? 'right' : ''}`}
                    onClick={() => !submitted && setDiagAnswers({ ...diagAnswers, [q.id]: o.id })}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
              {submitted && (
                <div className="solution">
                  <p>{q.explanation}</p>
                  <button className="link small" onClick={() => onExp(q.exp)}>
                    abrir {q.exp} →
                  </button>
                </div>
              )}
            </li>
          );
        })}
      </ol>

      <div className="practice-actions">
        {!submitted ? (
          <button
            className="btn btn-primary"
            onClick={() => {
              setSubmitted(true);
              onFinish(score, items.length);
            }}
          >
            Calificar
          </button>
        ) : (
          <>
            <button
              className="btn btn-primary"
              onClick={() => {
                setSubmitted(false);
                setNumAnswers({});
                setDiagAnswers({});
                setSeed((s) => s + 1);
              }}
            >
              Otra ronda
            </button>
            <span className="muted small">
              Obtenido {score}/{items.length}. Con 6 o más se considera aprobado.
            </span>
          </>
        )}
      </div>
    </div>
  );
}
