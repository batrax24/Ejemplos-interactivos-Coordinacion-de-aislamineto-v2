import { ALL_SOURCES, cite } from '../content/bibliography';

const CORRECTIONS = [
  {
    title: '28° no cumplía y la v1 aprobaba',
    body: 'La separación horizontal requerida era 2,42 m y el caso de 28° daba 2,061 m. Ahora la verificación compara explícitamente contra el requisito y falla si no se cumple.',
  },
  {
    title: 'Puesta a tierra sin longitud de contrapeso',
    body: 'La fórmula de contrapeso depende de s; la v1 la evaluaba con L = 0. Ahora s es un parámetro y el resultado se contrasta con la varilla equivalente.',
  },
  {
    title: 'Corona fuera de la fórmula de Peek',
    body: 'El haz de conductores se resolvía con el radio aparente pero sin el factor de superficie ni la densidad del aire. Ahora se aplican m, δ y el radio equivalente del haz.',
  },
  {
    title: 'Velocidad de onda inconsistente',
    body: 'Se usaba una velocidad fija distinta de 1/√(LC). Ahora v, Zc y el tiempo de viaje salen del mismo modelo de parámetros distribuidos.',
  },
  {
    title: 'Cifras sin condición declarada',
    body: 'Cada resultado indica altitud, humedad, base de tensión u onda aplicada. Un número sin condición no es comparable y esa es una de las ideas centrales del curso.',
  },
];

export function SourcesView() {
  return (
    <div className="wrap">
      <header className="page-head">
        <div>
          <span className="eyebrow">Trazabilidad</span>
          <h1>De dónde sale cada número</h1>
          <p className="lead">
            Los experimentos no inventan datos: cada preset viene del guion, de la guía de ejercicios o de las diapositivas, y cada
            modelo está contrastado con las normas listadas. Esta página es la que se abre cuando alguien pregunta «¿y eso de dónde
            sale?».
          </p>
        </div>
        <div className="card legend-card">
          <span className="pill mono">norma</span>
          <p className="muted small">Documento normativo citado como referencia, no como texto reproducido.</p>
          <span className="pill mono">clase</span>
          <p className="muted small">Material del curso: estructura, ejercicios y cifras de los presets.</p>
        </div>
      </header>

      <div className="sources-grid">
        {ALL_SOURCES.map((s) => (
          <article className="card source-card" key={s.key}>
            <div className="source-card-head">
              <span className={`pill ${s.normative ? 'accent' : ''} mono`}>{s.normative ? 'norma' : 'clase'}</span>
              <span className="muted small mono">{s.pages}</span>
            </div>
            <h3>{s.short}</h3>
            <p className="source-title">{s.title}</p>
            <p className="muted small">{s.author}</p>
            <p className="source-role">{s.role}</p>
            <p className="mono file">{s.file}</p>
          </article>
        ))}
      </div>

      <section className="card">
        <h2>Qué se corrigió respecto a la versión 1</h2>
        <p className="muted">
          La v1 fue el punto de partida de la interfaz y de los experimentos. Estas son las diferencias que cambian una conclusión, no
          solo la presentación.
        </p>
        <div className="fix-list">
          {CORRECTIONS.map((f) => (
            <div key={f.title}>
              <h3>{f.title}</h3>
              <p>{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="card">
        <h2>Convenciones de cita</h2>
        <p className="mono">{cite(['iec60071', 'iec60060', 'iec60099', 'iec60815'])}</p>
        <ul className="bullets">
          <li>Los ejemplos y ejercicios del curso se usan como casos didácticos; no son especificaciones de diseño.</li>
          <li>Las tensiones se declaran con su onda: impulso tipo rayo, impulso tipo maniobra, 50 Hz o valor de cresta.</li>
          <li>Las normas se citan por edición porque los valores de ensayo cambian entre versiones.</li>
          <li>Los modelos tienen límites explícitos en la tarjeta «Qué aprendes aquí» de cada experimento.</li>
        </ul>
      </section>
    </div>
  );
}
