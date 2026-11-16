import { useCallback, useEffect, useMemo, useState } from 'react';
import { TOPICS } from './content/topics';
import { getExperiment } from './experiments';
import { rankFor, loadProgress, saveProgress, resetProgress, starsFor, type Progress, exportProgress, importProgress } from './lib/storage';
import { Home } from './components/Home';
import { TopicView } from './components/TopicView';
import { ExperimentView } from './components/ExperimentView';
import { PracticeView } from './components/PracticeView';
import { SourcesView } from './components/SourcesView';
import { ErrorBoundary } from './components/ErrorBoundary';

type Route =
  | { name: 'home' }
  | { name: 'tema'; id: number }
  | { name: 'exp'; id: string }
  | { name: 'practica' }
  | { name: 'fuentes' };

function parseHash(): Route {
  const h = decodeURIComponent(window.location.hash.replace(/^#\/?/, ''));
  if (h.startsWith('tema/')) return { name: 'tema', id: Number(h.slice(5)) || 1 };
  if (h.startsWith('exp/')) return { name: 'exp', id: h.slice(4) };
  if (h === 'practica') return { name: 'practica' };
  if (h === 'fuentes') return { name: 'fuentes' };
  return { name: 'home' };
}

export function App() {
  const [route, setRoute] = useState<Route>(() => parseHash());
  const [progress, setProgress] = useState<Progress>(() => loadProgress().progress);
  const [notice, setNotice] = useState<string | null>(null);

  const recovered = useMemo(() => loadProgress().recovered, []);

  useEffect(() => {
    const onHash = () => {
      setRoute(parseHash());
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  useEffect(() => {
    if (recovered) setNotice('Se recuperó el progreso desde la copia de seguridad.');
  }, [recovered]);

  const update = useCallback((next: Progress) => {
    setProgress(next);
    saveProgress(next);
  }, []);

  const markVisit = useCallback(
    (id: string) => {
      if (progress.visits.includes(id)) return;
      update({ ...progress, visits: [...progress.visits, id], xp: progress.xp + 5 });
    },
    [progress, update],
  );

  const solve = useCallback(
    (expId: string, attempts: number, hint: boolean) => {
      const prev = progress.solved[expId];
      const stars = starsFor(attempts, hint);
      if (prev && prev.stars >= stars) {
        update({ ...progress, solved: { ...progress.solved, [expId]: { ...prev, attempts } } });
        return prev.stars;
      }
      const gained = prev ? 0 : 20;
      update({
        ...progress,
        xp: progress.xp + gained,
        solved: { ...progress.solved, [expId]: { stars, attempts, hint, at: Date.now() } },
      });
      return stars;
    },
    [progress, update],
  );

  const saveQuiz = useCallback(
    (expId: string, optionId: string) => {
      update({ ...progress, quiz: { ...progress.quiz, [expId]: optionId } });
    },
    [progress, update],
  );

  const go = (hash: string) => {
    window.location.hash = hash;
  };

  const rank = rankFor(progress.xp);
  const solvedCount = Object.keys(progress.solved).length;

  return (
    <div className="app">
      <header className="topbar">
        <button className="brand" onClick={() => go('#/')} aria-label="Ir al inicio">
          <span className="brand-mark">LAB·CA</span>
          <span className="brand-sub">coordinación de aislamiento · v2</span>
        </button>
        <nav className="nav">
          <button className={route.name === 'home' ? 'active' : ''} onClick={() => go('#/')}>
            Temas
          </button>
          <button className={route.name === 'practica' ? 'active' : ''} onClick={() => go('#/practica')}>
            Simulacro
          </button>
          <button className={route.name === 'fuentes' ? 'active' : ''} onClick={() => go('#/fuentes')}>
            Fuentes
          </button>
        </nav>
        <div className="rank" title={`${solvedCount} de 19 retos resueltos`}>
          <div className="rank-text">
            <span className="rank-name">{rank.name}</span>
            <span className="rank-xp mono">
              {progress.xp} XP · {solvedCount}/19
            </span>
          </div>
          <div className="rank-bar">
            <span style={{ width: `${rank.pct}%` }} />
          </div>
        </div>
      </header>

      {notice && (
        <div className="notice" role="status">
          {notice}
          <button onClick={() => setNotice(null)} aria-label="Cerrar aviso">
            ×
          </button>
        </div>
      )}

      <main>
        <ErrorBoundary>
          {route.name === 'home' && (
            <Home
              progress={progress}
              onTopic={(id) => go(`#/tema/${id}`)}
              onExp={(id) => go(`#/exp/${id}`)}
              onPractice={() => go('#/practica')}
              onSources={() => go('#/fuentes')}
              onExport={() => {
                const blob = new Blob([exportProgress(progress)], { type: 'application/json' });
                const a = document.createElement('a');
                a.href = URL.createObjectURL(blob);
                a.download = 'labca-progreso.json';
                a.click();
                URL.revokeObjectURL(a.href);
              }}
              onImport={(text) => {
                const p = importProgress(text);
                if (p) {
                  update(p);
                  setNotice('Progreso importado.');
                } else {
                  setNotice('El archivo no es un progreso válido de LAB·CA v2.');
                }
              }}
              onReset={() => {
                if (confirm('¿Reiniciar todo el progreso? No se puede deshacer.')) {
                  update(resetProgress());
                  setNotice('Progreso reiniciado.');
                }
              }}
            />
          )}

          {route.name === 'tema' && (
            <TopicView
              topic={TOPICS.find((t) => t.id === route.id) ?? TOPICS[0]}
              progress={progress}
              onExp={(id) => go(`#/exp/${id}`)}
              onTopic={(id) => go(`#/tema/${id}`)}
            />
          )}

          {route.name === 'exp' &&
            (() => {
              const exp = getExperiment(route.id);
              if (!exp) return <div className="wrap">Experimento no encontrado.</div>;
              const topic = TOPICS.find((t) => t.id === exp.topicId) ?? TOPICS[1];
              return (
                <ExperimentView
                  key={exp.id}
                  exp={exp}
                  topic={topic}
                  solved={progress.solved[exp.id]}
                  quizAnswer={progress.quiz[exp.id]}
                  onVisit={() => markVisit(exp.id)}
                  onSolve={(attempts, hint) => solve(exp.id, attempts, hint)}
                  onQuiz={saveQuiz}
                  onBack={() => go(`#/tema/${exp.topicId}`)}
                  onNext={() => {
                    const next = TOPICS.find((t) => t.id === exp.topicId + 1);
                    const nid = next?.experiments[0];
                    if (nid) go(`#/exp/${nid}`);
                    else go('#/practica');
                  }}
                />
              );
            })()}

          {route.name === 'practica' && <PracticeView onExp={(id) => go(`#/exp/${id}`)} progress={progress} onFinish={(score, total) => setNotice(`Simulacro: ${score}/${total} correctas.`)} />}

          {route.name === 'fuentes' && <SourcesView />}
        </ErrorBoundary>
      </main>

      <footer className="foot">
        <p>
          LAB·CA v2 · 19 experimentos construidos sobre el guion de 120 minutos y la bibliografía del curso. Las cifras son modelos
          didácticos: no reemplazan normas, catálogos ni estudios de diseño.
        </p>
        <p className="mono">React + canvas + SVG · progreso local, sin servidor</p>
      </footer>
    </div>
  );
}
