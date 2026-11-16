// @vitest-environment jsdom
import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { ExperimentView } from './components/ExperimentView';
import { App } from './App';
import { EXPERIMENTS } from './experiments';
import { TOPICS } from './content/topics';

/** Canvas 2D no existe en jsdom: se sustituye por un contexto que ignora todo. */
beforeAll(() => {
  const ctx = new Proxy(
    {},
    {
      get: (_t, key) => {
        if (key === 'measureText') return () => ({ width: 10 });
        if (key === 'createLinearGradient' || key === 'createRadialGradient') return () => ({ addColorStop: () => undefined });
        if (key === 'getImageData') return () => ({ data: new Uint8ClampedArray(4) });
        if (key === 'canvas') return { width: 300, height: 160 };
        return () => undefined;
      },
      set: () => true,
    },
  );
  Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', { value: () => ctx, writable: true });
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (q: string) => ({ matches: false, media: q, addEventListener: () => undefined, removeEventListener: () => undefined }),
  });
  globalThis.scrollTo = () => undefined;
  globalThis.confirm = () => true;
});

afterEach(() => cleanup());

describe('interacción del experimento', () => {
  it('cada experimento monta, cambia de preset y valida sin romper', () => {
    for (const e of EXPERIMENTS) {
      const topic = TOPICS.find((t) => t.id === e.topicId) ?? TOPICS[0];
      const onSolve = () => 1;
      const { unmount } = render(
        <ExperimentView
          exp={e}
          topic={topic}
          onVisit={() => undefined}
          onSolve={onSolve}
          onQuiz={() => undefined}
          onBack={() => undefined}
          onNext={() => undefined}
        />,
      );
      // el selector de presets existe y el segundo preset se puede cargar
      const presets = screen.getAllByRole('button', { name: /./ });
      expect(presets.length).toBeGreaterThan(3);
      if (e.presets[1]) fireEvent.click(screen.getByRole('button', { name: e.presets[1].label }));
      fireEvent.click(screen.getByRole('button', { name: 'Validar reto' }));
      expect(document.body.textContent).not.toContain('NaN');
      unmount();
    }
  }, 60000);

  it('la pista se abre y el reto se puede cerrar moviendo controles', () => {
    const e = EXPERIMENTS.find((x) => x.id === 'e02')!;
    render(
      <ExperimentView
        exp={e}
        topic={TOPICS[1]}
        onVisit={() => undefined}
        onSolve={() => 3}
        onQuiz={() => undefined}
        onBack={() => undefined}
        onNext={() => undefined}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Pista' }));
    expect(screen.getAllByText(/requisito|hito|α/i).length).toBeGreaterThan(0);
    const sliders = screen.getAllByRole('slider') as HTMLInputElement[];
    fireEvent.change(sliders[0], { target: { value: '300' } });
    expect(screen.getAllByText(/Tensión fase–tierra eficaz/).length).toBeGreaterThan(0);
  });
});

describe('aplicación completa', () => {
  it('la portada abre cada tema y cada tema lista sus experimentos', () => {
    window.location.hash = '#/';
    render(<App />);
    expect(screen.getByText(/Coordinación de aislamiento,/)).toBeTruthy();
    for (const t of TOPICS) {
      fireEvent.click(screen.getByRole('button', { name: `Abrir tema ${t.id} →` }));
      expect(screen.getAllByText(t.title).length).toBeGreaterThan(0);
      fireEvent.click(screen.getByRole('button', { name: 'Temas' }));
    }
  });

  it('el simulacro califica una ronda', () => {
    window.location.hash = '#/practica';
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Calificar' }));
    expect(screen.getAllByText(/Resultado|Otra ronda/).length).toBeGreaterThan(0);
  });
});
