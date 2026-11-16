import { Component, type ReactNode } from 'react';

type State = { error: Error | null };

export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div className="wrap">
          <section className="card" style={{ padding: 28 }}>
            <h1>Algo se rompió en este experimento</h1>
            <p className="muted">
              El resto del laboratorio sigue funcionando. Puedes volver al inicio; si el error se repite, reinicia el progreso desde la
              página de temas.
            </p>
            <pre className="mono" style={{ whiteSpace: 'pre-wrap', opacity: 0.7 }}>{this.state.error.message}</pre>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button className="btn btn-primary" onClick={() => { window.location.hash = '#/'; this.setState({ error: null }); }}>
                Volver a los temas
              </button>
              <button className="btn btn-ghost" onClick={() => window.location.reload()}>
                Recargar
              </button>
            </div>
          </section>
        </div>
      );
    }
    return this.props.children;
  }
}
