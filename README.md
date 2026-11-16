# LAB·CA v2 — Coordinación de aislamiento, para mover y ver

Laboratorio interactivo para la exposición de **coordinación de aislamiento** (13 bloques, 120 minutos).
Diecinueve experimentos convierten los fenómenos del guion —sobretensiones, rayo, ruptura, atmósfera, cadenas,
distancias, cable de guarda, puesta a tierra, ondas viajeras, pararrayos, corona y medición— en escenas que se pueden
mover, medir y verificar.

Cada experimento declara, antes de cualquier fórmula:

- **qué fenómeno** está mostrando,
- **qué debe poder explicar** quien lo usa,
- **qué mirar** para convencerse,
- **qué error clásico** desactiva,
- **hasta dónde llega** el modelo.

El detalle de los 19 juegos está en [`docs/DISENO_JUEGOS.md`](docs/DISENO_JUEGOS.md).

## Arrancar

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # tsc -b && vite build
npm run preview  # http://localhost:4173
npm test         # 34 pruebas: numéricas, de render y de interacción
```

Requiere Node 20+. El progreso se guarda en `localStorage` (con copia de seguridad) y se puede exportar e importar como
JSON.

## Los 13 temas y sus experimentos

| # | Tema | Min | Experimentos |
| --- | --- | --- | --- |
| 1 | Introducción y coordinación | 0–8 | — (se cierra con la misión del tema 13) |
| 2 | Sobretensiones y ensayos normalizados | 8–18 | e01 clases de sobretensión · e02 √3·√2 en 245 kV · e03 onda 1,2/50 µs |
| 3 | El rayo y sus efectos | 18–30 | e04 descarga y distancia de choque · e14 flameo inverso |
| 4 | Ruptura y probabilidad | 30–43 | e05 avalancha y densidad · e06 U₅₀, σ y riesgo |
| 5 | Atmósfera y altitud | 43–51 | e07 corrección por δ · e19 DAR, PI y medición |
| 6 | Cadenas de aisladores | 51–61 | e08 fuga y discos · e09 CFO de maniobra |
| 7 | Distancias fases–estructura | 61–71 | e10 viento y balanceo · e11 separación mínima |
| 8 | Cable de guarda | 71–79 | e12 ángulo, esfera de atracción y límites |
| 9 | Puesta a tierra | 79–87 | e13 varilla y contrapeso · e14 flameo inverso |
| 10 | Ondas viajeras | 87–96 | e15 reflexión, transmisión y Bewley |
| 11 | Pararrayos | 96–109 | e16 cinco verificaciones de selección |
| 12 | Corona | 109–116 | e17 incepción, haz y pérdidas de Peek |
| 13 | Integración | 116–120 | e18 misión: coordinación completa |

## Cómo se juega

- **Requisitos**: deben cumplirse en el estado actual al validar. **Hitos**: deben haberse alcanzado alguna vez en la
  sesión (reproducir el ejemplo del material, ver el caso opuesto). Así un mismo experimento enseña dos cosas que no
  ocurren con los mismos parámetros.
- **Estrellas**: 3 sin pista y sin fallos; 2 con pista o hasta dos intentos; 1 en el resto. Cada reto cerrado da 20 XP.
- **Simulacro**: ocho preguntas por ronda —cinco cálculos generados desde los mismos presets y modelos del laboratorio
  (tolerancia 2 %) y tres casos diagnósticos— con solución y enlace al experimento correspondiente.
- **Pistas**: muestran solo las condiciones que faltan, nunca la respuesta.

## Reglas de diseño del contenido

1. **Primero el fenómeno.** La escena muestra dónde salta el arco, cómo viaja la onda, qué se ioniza; la ecuación aparece
   al lado.
2. **Toda magnitud lleva su condición**: onda, altitud, humedad, base de tensión o configuración.
3. **La verificación puede fallar.** Los retos se evalúan contra la física, no contra un número cercano: 2,061 m no
   cumple un requisito de 2,42 m.
4. **El límite del modelo se declara** en cada experimento.
5. **Los ejemplos del curso no son especificaciones.** Los presets reproducen el guion y la guía de ejercicios; las
   normas se citan como referencia de método con su edición.

## Correcciones respecto a la versión 1

- **e10**: 28° de inclinación daba 2,061 m frente a un requisito de 2,42 m y la v1 aprobaba. Ahora falla.
- **e13**: la resistencia del contrapeso se evaluaba con L = 0; ahora la longitud es un parámetro y se contrasta con la
  varilla equivalente.
- **e17**: el haz de conductores se resolvía sin factor de superficie ni densidad; ahora se aplican `m`, `δ` y el radio
  equivalente del haz, y se advierte cuándo el dato de U₀ no es coherente con la geometría.
- **e15**: la velocidad de onda salía de un par L′–C′ que superaba la velocidad de la luz; ahora v, Z_c y el tiempo de
  viaje salen del mismo modelo y se verifica v < c.
- **e05**: el coeficiente de ionización estaba escalado con δ de forma que la rigidez crecía con la altitud; ahora
  U₀ = 25·δ·d + ln(10⁸)/3,7 y la simulación coincide con la fórmula.
- **Todas**: las cifras declaran su condición y las metas son alcanzables (lo comprueba la suite de pruebas).

## Estructura

```
src/
  App.tsx                  ruteo por hash, progreso, rangos
  components/              portada, tema, experimento, simulacro, fuentes
  content/topics.ts        los 13 bloques del guion
  content/bibliography.ts  fuentes y su papel en cada cifra
  content/practica.ts      banco numérico + diagnósticos
  experiments/types.ts     contrato: escena, gráfica, lecturas, reto, aprendizaje
  experiments/defs/        19 experimentos en cinco archivos
  lib/num.ts               núcleo numérico compartido
  lib/draw.ts              utilidades de canvas
  lib/storage.ts           progreso, copia de seguridad, rangos
docs/DISENO_JUEGOS.md      diseño pedagógico de cada experimento (generado desde el código)
```

## Verificación

`npm test` ejecuta 34 pruebas:

- **numéricas**: anclajes del material (141,45 kV; 200,04 kV; 575,12 kV; 623,8 kV ⇒ ≈7,1 unidades; 101,8 Ω; Γ = −0,60;
  660 kV ⇒ 59,1 %; 10,29 kW/km; 646,2 kV; DAR/PI);
- **render**: la portada, los 13 temas, los 19 experimentos, el simulacro y las fuentes;
- **interacción** (jsdom): cada experimento monta, cambia de preset y valida sin `NaN` ni excepciones; navegación completa
  por los 13 temas; una ronda del simulacro.

## Publicación

`vite.config.ts` usa `base: './'`, así que el contenido de `dist/` funciona en GitHub Pages, Netlify o cualquier
servidor estático. El flujo `.github/workflows/deploy.yml` publica en Pages al hacer push a `main`.

## Fuentes

Guion de exposición (120 min), diapositivas del curso, guía de ejercicios, Cardona, Velasco, Diana y los documentos de
pararrayos, corona y medición, junto con IEC 60071-1:2019, IEC 60071-2:2023, IEC 60060-1:2025, IEC 60099-4:2014 y
IEC TS 60815-1:2025. La página **Fuentes** de la aplicación lista el papel de cada documento.

> Las cifras son modelos didácticos acotados. No reemplazan normas, catálogos ni estudios de diseño.
