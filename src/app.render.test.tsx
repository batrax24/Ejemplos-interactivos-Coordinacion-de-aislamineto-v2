import { describe, expect, it } from 'vitest';
import { renderToString } from 'react-dom/server';
import { Home } from './components/Home';
import { TopicView } from './components/TopicView';
import { ExperimentView } from './components/ExperimentView';
import { PracticeView } from './components/PracticeView';
import { SourcesView } from './components/SourcesView';
import { EXPERIMENTS } from './experiments';
import { TOPICS } from './content/topics';
import { buildNumericBank, DIAGNOSTICS } from './content/practica';
import { emptyProgress } from './lib/storage';

const noop = () => 0;
const baseProps = {
  onVisit: () => undefined,
  onSolve: noop,
  onQuiz: () => undefined,
  onBack: () => undefined,
  onNext: () => undefined,
};

describe('render del laboratorio', () => {
  it('la portada muestra los 13 temas y sus experimentos', () => {
    const html = renderToString(
      <Home
        progress={emptyProgress()}
        onTopic={() => undefined}
        onExp={() => undefined}
        onPractice={() => undefined}
        onSources={() => undefined}
        onExport={() => undefined}
        onImport={() => undefined}
        onReset={() => undefined}
      />,
    );
    expect(html).toContain('Coordinación de aislamiento');
    for (const t of TOPICS) expect(html).toContain(t.title.slice(0, 18));
  });

  it('cada tema se renderiza', () => {
    for (const t of TOPICS) {
      const html = renderToString(<TopicView topic={t} progress={emptyProgress()} onExp={() => undefined} onTopic={() => undefined} />);
      expect(html.length).toBeGreaterThan(500);
    }
  });

  it('cada experimento se renderiza con su escena, gráfica y tarjeta de aprendizaje', () => {
    for (const e of EXPERIMENTS) {
      const topic = TOPICS.find((t) => t.id === e.topicId) ?? TOPICS[0];
      const html = renderToString(<ExperimentView exp={e} topic={topic} {...baseProps} />);
      expect(html).toContain('Qué aprendes aquí');
      expect(html).toContain('El reto');
      expect(html).toContain('<canvas');
      expect(html).toContain('<svg');
      expect(html).not.toContain('undefined');
      expect(html).not.toContain('NaN');
    }
  });

  it('simulacro y fuentes se renderizan', () => {
    const practice = renderToString(<PracticeView onExp={() => undefined} progress={emptyProgress()} onFinish={() => undefined} />);
    expect(practice).toContain('Simulacro');
    expect(renderToString(<SourcesView />)).toContain('Trazabilidad');
  });
});

describe('banco de preguntas', () => {
  it('genera suficientes preguntas numéricas y con solución', () => {
    const bank = buildNumericBank();
    expect(bank.length).toBeGreaterThan(30);
    for (const q of bank) {
      expect(Number.isFinite(q.answer)).toBe(true);
      expect(q.unit.length).toBeGreaterThan(0);
      expect(q.solution).toContain(q.unit);
      expect(q.tolerance).toBeGreaterThan(0);
    }
    const ids = new Set(bank.map((q) => q.id));
    expect(ids.size).toBe(bank.length);
  });

  it('los diagnósticos tienen una opción correcta válida', () => {
    for (const d of DIAGNOSTICS) {
      expect(d.options.some((o) => o.id === d.correct)).toBe(true);
      expect(EXPERIMENTS.some((e) => e.id === d.exp)).toBe(true);
    }
  });
});
