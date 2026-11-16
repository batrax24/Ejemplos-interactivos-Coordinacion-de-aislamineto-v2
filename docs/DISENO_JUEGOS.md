# Diseño de los juegos: qué se aprende en cada experimento

Este documento es la justificación pedagógica del laboratorio. Para cada uno de los 19 experimentos dice **qué fenómeno físico se muestra**, **qué debe poder explicar quien lo usa**, **qué mirar** para convencerse, **qué error clásico desactiva** y **hasta dónde llega el modelo**. Está generado desde el propio código (`src/experiments/defs/*`), de modo que el documento y el juego no se pueden separar.

## La regla de diseño

1. **Primero el fenómeno, después la cifra.** Ninguna escena arranca con una fórmula: la fórmula aparece al lado de lo que se está viendo.
2. **Toda magnitud lleva su condición.** Onda, altitud, humedad, base de tensión o configuración. Una cifra sin condición no se compara con nada (fue el defecto principal de la v1).
3. **La verificación puede fallar.** Los retos se evalúan contra la física, no contra una cifra aproximada: si el requisito es 2,42 m, 2,06 m no aprueba.
4. **El límite se declara.** Cada modelo termina con una frase que dice qué no incluye. Un experimento que se cree completo enseña peor que uno honesto.
5. **Los ejemplos del curso no son especificaciones.** Los presets reproducen el guion y la guía de ejercicios; las normas se citan como referencia de método.

## Cómo se gana un experimento

- **Requisitos**: condiciones que deben cumplirse en el estado actual al pulsar «Validar reto».
- **Hitos**: condiciones que deben haberse alcanzado alguna vez en la sesión (reproducir el ejemplo, ver el caso opuesto). Permiten que un mismo experimento enseñe dos cosas que no ocurren con los mismos parámetros.
- **Estrellas**: 3 sin pista y sin intentos fallidos; 2 con pista o hasta dos intentos; 1 en el resto. Cada experimento cerrado da 20 XP.

## Mapa de temas

| Tema | Min | Diapositivas | Experimentos |
| --- | --- | --- | --- |
| 1. Introducción y coordinación de aislamiento | 0–8 min | 1–4 | — |
| 2. Sobretensiones y ensayos normalizados | 8–18 min | 5–9 | e01, e02, e03 |
| 3. El rayo y sus efectos en una línea | 18–30 min | 10–13 | e04, e14 |
| 4. Ruptura dieléctrica y probabilidad de disrupción | 30–43 min | 14–19 | e05, e06 |
| 5. Atmósfera, altitud y temperatura | 43–51 min | 20–21 | e07, e19 |
| 6. Longitud y selección de cadenas de aisladores | 51–61 min | 22–27 | e08, e09 |
| 7. Distancias entre fases y a la estructura | 61–71 min | 28–32 | e10, e11 |
| 8. Ubicación del cable de guarda | 71–79 min | 33–36 | e12 |
| 9. Puesta a tierra y efecto de la temperatura | 79–87 min | 37–41 | e13, e14 |
| 10. Ondas viajeras, reflexión y transmisión | 87–96 min | 42–45 | e15 |
| 11. Selección y ubicación del pararrayos | 96–109 min | 46–53 | e16 |
| 12. Efecto y pérdidas por corona | 109–116 min | 54–58 | e17 |
| 13. Integración y conclusiones | 116–120 min | 59–62 | e18 |

## e01 · Tres sobretensiones, tres formas de onda

*Tema 2 — Sobretensiones y ensayos normalizados · Amplitud, frente y duración: la firma de cada esfuerzo*

**Por qué está en el juego.** Aprender a clasificar una sobretensión por su forma de onda antes de compararla con un ensayo.

**Fenómeno.** Una sobretensión es una tensión que supera la referencia de operación. Lo que la hace peligrosa no es solo su cresta: también su tiempo de subida y cuánto dura.

**Objetivo de aprendizaje.** Que puedas mirar una forma de onda y decir a qué grupo pertenece, qué ensayo la representa y en qué unidad se compara.

**Qué mirar.**
- La escena dibuja la misma cresta con frentes distintos: la de frente rápido casi no da tiempo de reaccionar.
- La gráfica de amplitud contra frente muestra las tres bandas y dónde cayó tu caso.
- La lectura «ensayo comparable» impide mezclar kV eficaces con kV de cresta.

**Error clásico que desactiva.** Creer que «2,5 p.u.» ya dice todo. Una maniobra de 2,5 p.u. y un rayo de 2,5 p.u. se parecen en altura y se ensayan distinto: 1,2/50 µs frente a 170–250/2500 µs.

**Modelo y límite.** La forma es una doble exponencial descriptiva: separa frente, cresta y cola; no modela propagación.

**Controles.**
- Tensión máxima entre fases Uₘ (72.5–500 kV)
- Amplitud en por unidad de Û_f (1–4 p.u.)
- Tiempo de frente (0.5–6000 µs)
- Tiempo hasta la cola (20–20000 µs)

**Presets del material.**
- Impulso tipo rayo 1,2/50 µs
- Maniobra 250/2500 µs
- Temporal: falla a tierra 1,4 p.u.
- Ejemplo del curso: 2,5 p.u. en 245 kV

**Reto.**
- [hito] Configura una sobretensión de maniobra con frente entre 100 y 400 µs y cresta ≥ 500 kV
- [hito] Muestra un rayo de frente ≤ 5 µs y cola ≤ 100 µs

**Fuentes.** Guion de exposición (pp. 1–14) · Diapositivas 2 h (62 diapositivas) · Ruiz & Lozano, La Salle (pp. 4–22) · IEC 60060-1:2025 (definición de impulso de maniobra 170/2500 µs)

**Notas de cálculo.**
- Frecuencia industrial en kV eficaces; impulsos tipo rayo y de maniobra en kV de cresta.
- IEC 60060-1:2025 expresa el impulso de maniobra como 170/2500 µs; textos anteriores usan 250/2500 µs con otra definición del frente.

## e02 · De entre fases a fase–tierra (y de eficaz a cresta)

*Tema 2 — Sobretensiones y ensayos normalizados · La conversión que hay detrás de casi todos los ejemplos*

**Por qué está en el juego.** Evitar el error más común del curso: comparar una tensión entre fases en kV eficaces con un impulso en kV de cresta.

**Fenómeno.** En una red trifásica equilibrada, la tensión entre fase y tierra es la entre fases dividida por √3, y su cresta es √2 veces ese valor.

**Objetivo de aprendizaje.** Manejar con soltura las dos conversiones y declarar siempre qué tensión usas: entre fases o fase–tierra, eficaz o cresta.

**Qué mirar.**
- La escena muestra los tres fasores girando y la senoide de una fase con sus dos niveles.
- La gráfica marca el valor eficaz y la cresta sobre la misma onda: no son intercambiables.
- Las lecturas separan «eficaz» de «cresta» con colores distintos.

**Error clásico que desactiva.** Multiplicar por √2 una tensión que ya era entre fases, o comparar 200 kV de cresta con 245 kV eficaces. Primero se pasa a fase–tierra; después, a cresta.

**Modelo y límite.** Sistema sinusoidal equilibrado antes de la falla. No incluye desbalance ni sobretensiones temporales.

**Controles.**
- Tensión máxima entre fases Uₘ (72.5–420 kV eficaces)

**Presets del material.**
- 245 kV (ejemplo del curso)
- Sistema de 230 kV (Uₘ = 245 kV)
- Sistema de 115 kV (Uₘ = 123 kV)
- Sistema de 500 kV (Uₘ = 550 kV)

**Reto.**
- [hito] Reproduce el caso del curso: Uₘ = 245 kV → 141,5 kV eficaces y 200,0 kV de cresta
- [requisito] Encuentra un Uₘ tal que la cresta fase–tierra quede entre 190 y 200 kV

**Fuentes.** Guion de exposición (pp. 1–14) · Diapositivas 2 h (62 diapositivas) · Cardona, UNAL (pp. 1–9)

## e03 · La forma 1,2/50 µs no son dos constantes de tiempo

*Tema 2 — Sobretensiones y ensayos normalizados · Frente, cola y origen virtual medidos sobre la onda*

**Por qué está en el juego.** Entender qué significan los dos números de una onda normalizada y por qué no son τ₁ y τ₂.

**Fenómeno.** Un impulso de ensayo se describe por el tiempo de frente (30–90 %) y el tiempo hasta la semiamplitud en la cola, medidos desde un origen virtual.

**Objetivo de aprendizaje.** Leer una onda normalizada y distinguir «etiqueta del ensayo» de «constantes del modelo»; además, no confundir 1,2/50 µs de tensión con 8/20 µs de corriente.

**Qué mirar.**
- Los puntos del 30 % y 90 % y la recta que los une: su cruce por cero es el origen virtual.
- La gráfica marca t₃₀, t₉₀, la tangente y la semiamplitud de la cola.
- Cambia τ₂: t₁ apenas se mueve, pero la cola cambia mucho.

**Error clásico que desactiva.** Suponer que 1,2 y 50 son las constantes exponenciales. Son tiempos convencionales deducidos de la forma.

**Modelo y límite.** Doble exponencial ideal. La onda real tiene tolerancias y puede oscilar; el origen virtual se obtiene de la recta 30–90 %.

**Controles.**
- Cresta del impulso (200–1600 kV)
- Constante rápida τ₁ (0.1–2 µs)
- Constante lenta τ₂ (10–120 µs)

**Presets del material.**
- Impulso rayo 1,2/50 µs (1050 kV)
- Ejemplo del curso (0,41 / 66 µs)
- Forma parecida pero mal ajustada

**Reto.**
- [requisito] Ajusta τ₁ y τ₂ para obtener una onda 1,2/50 µs (frente ±0,15 µs, cola ±5 µs)

**Fuentes.** Guion de exposición (pp. 1–14) · Diapositivas 2 h (62 diapositivas) · IEC 60060-1:2025 (definición de impulso de maniobra 170/2500 µs) · Guía de ejercicios (17 pp.)

**Notas de cálculo.**
- La guía de ejercicios reporta 49,3 µs en la versión 1 por la expresión del origen virtual; aquí se aplica la definición completa (≈48,5 µs).

## e04 · El rayo: una distribución, no un valor

*Tema 3 — El rayo y sus efectos en una línea · Corriente de cresta, di/dt y los tres mecanismos de afectación*

**Por qué está en el juego.** Entender por qué se habla de probabilidad de corriente y cómo un rayo puede entrar a la línea por tres caminos distintos.

**Fenómeno.** En una nube de tormenta se separan cargas; un líder ionizado avanza y, al conectarse, circula una corriente de retorno intensa. La descarga puede tener varios impulsos.

**Objetivo de aprendizaje.** Explicar con qué magnitudes se describe un rayo, por qué se usan distribuciones, y diferenciar impacto directo en fase, impacto en guarda o torre y descarga cercana.

**Qué mirar.**
- Los tres caminos de la escena se iluminan en momentos distintos: solo uno atraviesa el aislamiento desde la estructura.
- La gráfica de excedencia muestra que bajar la corriente objetivo casi siempre es alcanzable: el diseño se hace por riesgo.
- El ancho de captura y la densidad de descargas producen las salidas esperadas por año, no un número exacto.

**Error clásico que desactiva.** Decir «el rayo es de 30 kA». No existe ese rayo: hay una distribución con mediana cercana a 31 kA, y el di/dt puede ser tanto o más exigente que la cresta.

**Modelo y límite.** Lognormal con mediana 31 kA y σ_ln = 0,65, y r_c = 10·I^0,65 del modelo electrogeométrico citado en el material. Los coeficientes cambian entre escuelas y normas.

**Controles.**
- Corriente de cresta (2–200 kA)
- Pendiente di/dt (2–120 kA/µs)
- Densidad de descargas (0.5–20 rayos/km²·año)
- Longitud de línea (10–300 km)
- Altura media de la estructura (15–80 m)

**Presets del material.**
- Corriente mediana (31 kA)
- Descarga severa (100 kA, 80 kA/µs)
- Descarga débil (10 kA)

**Reto.**
- [requisito] Elige una corriente con probabilidad de excedencia ≤ 5 %
- [hito] Lleva la distancia de choque a 60 m o más

**Fuentes.** Guion de exposición (pp. 1–14) · Diapositivas 2 h (62 diapositivas) · Martínez Velasco, UPC (pp. 5–9, 20–38, 47–55, 88–90) · Documento de estudio (pp. 19–133)

**Notas de cálculo.**
- La guía de ejercicios y el material de clase insisten: la corriente 8/20 µs del pararrayos es una onda de corriente, no la onda de tensión 1,2/50 µs.

## e05 · Avalancha: por qué el aire aguanta hasta cierto campo

*Tema 4 — Ruptura dieléctrica y probabilidad de disrupción · Ionización por choque, densidad del aire y separación mínima*

**Por qué está en el juego.** Ver el mecanismo detrás de la rigidez dieléctrica: no es un umbral mágico, es una avalancha que necesita campo y camino.

**Fenómeno.** Cuando el campo acelera electrones libres, estos ionizan moléculas por choque y el número de electrones crece exponencialmente. Si α supera η y la avalancha llega a ~10⁸ electrones, aparece un streamer y luego la descarga.

**Objetivo de aprendizaje.** Explicar por qué la rigidez depende del campo, de la separación y de la densidad del aire, y por qué dos electrodos a la misma distancia pueden romperse a tensiones distintas.

**Qué mirar.**
- La nube de electrones crece mientras el campo efectivo supere el umbral; al alcanzar 10⁸ se dibuja el canal.
- Baja δ con el mismo campo: la avalancha se apaga, igual que en la montaña.
- La gráfica compara U₀ contra separación para dos densidades: la curva de Bogotá queda por encima.

**Error clásico que desactiva.** Pensar que el aire «rompe a 30 kV/cm» siempre. Ese valor es de referencia en campo uniforme y aire estándar; con puntas, distancias cortas o baja densidad cambia.

**Modelo y límite.** Modelo exponencial con α−η lineal en el campo, calibrado con α = 3,7·(E − 25·δ) para dar ~30 kV/cm a 1 cm en aire estándar. No reproduce el efecto de puntas ni la polaridad: el campo es uniforme y el coeficiente constante.

**Controles.**
- Campo eléctrico medio (10–80 kV/cm)
- Separación entre electrodos (0.1–20 cm)
- Densidad relativa del aire δ (0.6–1)

**Presets del material.**
- Aire estándar, 1 cm, 30 kV/cm
- Bogotá: δ = 0,74
- Separación de 8 cm a 25 kV/cm

**Reto.**
- [hito] En aire estándar (δ = 1), encuentra la separación mínima que sostiene 200 kV
- [requisito] Con δ = 0,74 (Bogotá), aumenta la separación hasta volver a sostener 200 kV

**Fuentes.** Guion de exposición (pp. 1–14) · Diapositivas 2 h (62 diapositivas) · Martínez Velasco, UPC (pp. 5–9, 20–38, 47–55, 88–90) · Documento de corona (pp. 1–4 y 19–26)

## e06 · U₅₀ no es una garantía: probabilidad de disrupción

*Tema 4 — Ruptura dieléctrica y probabilidad de disrupción · Media, dispersión y riesgo aceptable*

**Por qué está en el juego.** Comprender qué significa U50, cómo se obtiene una tensión para cierta probabilidad y por qué el diseño trabaja con riesgo.

**Fenómeno.** Al repetir ensayos de disrupción sobre un aislamiento autorrecuperable, no siempre se rompe a la misma tensión. La curva de probabilidad relaciona amplitud con proporción de descargas.

**Objetivo de aprendizaje.** Interpretar U₅₀/CFO, usar la dispersión para calcular una tensión con cierta probabilidad y explicar por qué el diseño admite un riesgo pequeño.

**Qué mirar.**
- La escena lanza ensayos y marca cuántos fallan: el porcentaje se acerca a la probabilidad calculada.
- La curva acumulada muestra la cola izquierda: bajar la tensión reduce el riesgo muy rápido.
- El marcador de tu tensión aplicada se mueve sobre la curva al cambiar σ.

**Error clásico que desactiva.** Decir «el aislamiento soporta U₅₀». U₅₀ significa que la mitad de los impulsos lo romperían; para soportar con alta probabilidad hay que quedar por debajo.

**Modelo y límite.** Normal con σ constante en porcentaje. Un estudio completo combina la distribución del esfuerzo con la de la resistencia; σ = 6 % es el valor sugerido para maniobra en el material.

**Controles.**
- Tensión al 50 % (U₅₀ o CFO) (400–1600 kV)
- Desviación estándar σ (2–15 % de U₅₀)
- Probabilidad objetivo (1–50 %)
- Tensión aplicada (300–1800 kV)

**Presets del material.**
- Ejemplo del curso (700 kV, 6 %, 10 %)
- Maniobra: σ = 6 % y 1 % de riesgo
- Rayo: dispersión menor (σ = 3 %)

**Reto.**
- [requisito] Reproduce el ejemplo: U₅₀ = 700 kV, σ = 6 %, P = 10 % → 646,2 kV
- [hito] Con U₅₀ = 700 kV y σ = 6 %, baja la tensión aplicada hasta un riesgo ≤ 1 %

**Fuentes.** Guion de exposición (pp. 1–14) · Diapositivas 2 h (62 diapositivas) · Cardona, UNAL (pp. 1–9) · Martínez Velasco, UPC (pp. 5–9, 20–38, 47–55, 88–90)

## e07 · Altitud y temperatura: el aire de Bogotá no es el del mar

*Tema 5 — Atmósfera, altitud y temperatura · Densidad relativa y corrección de la tensión soportada*

**Por qué está en el juego.** Cuantificar cuánto pierde un aislamiento externo cuando sube la altitud y por qué el aislamiento interno no se corrige igual.

**Fenómeno.** Al subir, la presión baja y el aire se vuelve menos denso; con menos moléculas por volumen, la avalancha se forma con más dificultad y el espacio de aire soporta menos tensión.

**Objetivo de aprendizaje.** Calcular δ, corregir una tensión soportada y explicar por qué la corrección no se aplica igual al aislamiento interno de un equipo sellado.

**Qué mirar.**
- La escena compara la densidad de moléculas al nivel del mar y en la montaña: los puntos se separan.
- La gráfica muestra tres curvas de temperatura: a igual altitud, un día caluroso reduce aún más la densidad.
- La lectura «pérdida de capacidad» traduce δ a un porcentaje entendible.

**Error clásico que desactiva.** Aplicar el factor de altitud a todo el equipo, o usar δ como si fuera la tensión soportada. δ corrige el medio; el exponente y el alcance dependen de la norma.

**Modelo y límite.** Atmósfera estándar aproximada y exponente didáctico n. No incluye humedad, lluvia ni contaminación.

**Controles.**
- Altitud sobre el nivel del mar (0–4000 m)
- Temperatura ambiente (0–35 °C)
- Exponente de corrección n (0.5–1)
- Tensión soportada de referencia (nivel del mar) (400–1400 kV)

**Presets del material.**
- Bogotá (2 640 m, 14 °C)
- Nivel del mar (0 m, 30 °C)
- Reto de la guía (δ 0,80–0,82)
- Páramo (3 200 m, 5 °C)

**Reto.**
- [requisito] Encuentra altitud y temperatura con δ entre 0,80 y 0,82 y U corregida ≥ 575 kV
- [hito] Reproduce una condición de alta montaña: δ ≤ 0,75

**Fuentes.** Guion de exposición (pp. 1–14) · Diapositivas 2 h (62 diapositivas) · Ruiz & Lozano, La Salle (pp. 4–22) · Cardona, UNAL (pp. 1–9)

## e08 · Fuga, contaminación y el número de discos

*Tema 6 — Longitud y selección de cadenas de aisladores · La distancia que recorre la corriente sobre la superficie*

**Por qué está en el juego.** Distinguir distancia de fuga de distancia de arco y aplicar el criterio de contaminación sin equivocar la base de tensión.

**Fenómeno.** La contaminación depositada se vuelve conductora al humedecerse; la corriente superficial crea bandas secas y descargas parciales que pueden llevar al contorneo.

**Objetivo de aprendizaje.** Calcular la fuga requerida, elegir el número de unidades y explicar por qué la base del coeficiente y la altitud cambian el resultado.

**Qué mirar.**
- La escena resalta el camino de fuga en zigzag sobre los faldones y la recta de arco: no miden lo mismo.
- La gráfica muestra cómo el número de discos salta en escalones al subir k_f.
- Cambia la base y observa el salto de 21 a 17 unidades: es el error de convención más costoso.

**Error clásico que desactiva.** Copiar «25 mm/kV» sin saber si se refiere a tensión entre fases o fase–tierra. Y creer que la cadena ya está lista: falta maniobra, rayo y mecánica.

**Modelo y límite.** Criterio de fuga específica con k_a = δ. La selección real bajo contaminación requiere el procedimiento de IEC TS 60815 y datos del sitio.

**Controles.**
- Tensión máxima entre fases Uₘ (72.5–500 kV)
- Coeficiente de fuga k_f (12–35 mm/kV)
- Base del coeficiente (entre fases (ejercicio del guion) / fase–tierra (IEC/Cardona))
- Corrección por altitud (sin corregir / corregir con δ a 2 640 m)
- Fuga por unidad (200–450 mm)
- Paso de montaje (0.1–0.2 m)

**Presets del material.**
- Ejemplo del curso (245 kV, 25 mm/kV)
- Base fase–tierra con altitud (IEC)
- Zona limpia (16 mm/kV)
- Zona muy contaminada (31 mm/kV)

**Reto.**
- [hito] Reproduce el ejemplo del curso: 21 discos y 3,066 m de cadena
- [requisito] Con la base fase–tierra y corrección por altitud, obtén 18 discos o menos

**Fuentes.** Guion de exposición (pp. 1–14) · Diapositivas 2 h (62 diapositivas) · Cardona, UNAL (pp. 1–9) · IEC TS 60815-1 (línea de fuga específica) · Guía de ejercicios (17 pp.)

**Notas de cálculo.**
- El ajuste del material [1] también permite estimar el número por maniobra; ese criterio se trabaja en el experimento e09.
- La guía de ejercicios advierte que la versión 1 usaba la tensión entre fases como base, igual que el ejercicio del guion.

## e09 · La cadena también se dimensiona por maniobra

*Tema 6 — Longitud y selección de cadenas de aisladores · CFO requerido, dispersión y el criterio que manda*

**Por qué está en el juego.** Aplicar el método del CFO con σ = 6 % y comparar el resultado con el criterio de contaminación.

**Fenómeno.** Una sobretensión de maniobra no rompe siempre el aislamiento: cada cadena tiene una distribución de CFO. El diseño elige la probabilidad de flameo admisible.

**Objetivo de aprendizaje.** Calcular la tensión de soporte, el CFO requerido con dispersión, el número de unidades y decidir cuál criterio gobierna la cadena.

**Qué mirar.**
- La escena dibuja solo los discos que realmente se instalan y compara la barra de maniobra con la de contaminación.
- La gráfica CFO–N: la línea horizontal es el requisito; el cruce da las unidades necesarias.
- Sube k de 1,3 a 2,33: el CFO requerido crece y la cadena también.

**Error clásico que desactiva.** Usar una regla fija de kV por disco. El CFO de una cadena no es lineal y el criterio de maniobra suele ser menos exigente que el de contaminación en zonas sucias.

**Modelo y límite.** Ajuste CFO–N del material [1], válido en su rango; δ aplicado con exponente 1. La selección real combina además rayo y mecánica.

**Controles.**
- Tensión máxima entre fases Uₘ (72.5–500 kV)
- Factor de sobretensión F_v (1.5–4 p.u.)
- Factor de seguridad F_s (1–1.3)
- Desviaciones k (probabilidad de flameo) (0–3 σ)
- Desviación estándar σ (2–10 % de CFO)
- Altitud del sitio (0–4000 m)
- Coeficiente de fuga k_f (para comparar) (12–35 mm/kV)
- Discos adicionales de margen (ninguno / +1 suspensión / +2 amarre)

**Presets del material.**
- Ejemplo del curso (245 kV, 2,5 p.u., 10 %)
- Exigir 1 % de flameo (k = 2,33)
- Misma línea a 2 640 m

**Reto.**
- [hito] Reproduce el caso del curso: U_soporte ≈ 575,1 kV y cadena final de 21 discos
- [requisito] Exige 1 % de probabilidad de flameo (k ≈ 2,33) y observa el efecto en el CFO requerido

**Fuentes.** Guion de exposición (pp. 1–14) · Cardona, UNAL (pp. 1–9) · Guía de ejercicios (17 pp.) · IEC 60071-1/2 (procedimiento y factores de corrección)

## e10 · El viento acerca la fase a la estructura

*Tema 7 — Distancias entre fases y a la estructura · Oscilación de la cadena y distancia mínima real*

**Por qué está en el juego.** Ver que la distancia de diseño en reposo no es la que existe cuando la cadena se inclina.

**Fenómeno.** La cadena de suspensión oscila con el viento: el conductor se acerca a la estructura y a las otras fases. La distancia que importa es la mínima durante la oscilación.

**Objetivo de aprendizaje.** Calcular el desplazamiento, comparar con el requisito y encontrar un ángulo que cumpla; entender que el requisito es del estudio, no una constante.

**Qué mirar.**
- La cadena de la escena se inclina y la cota d_h se reduce en vivo.
- La gráfica de d_h contra θ cruza la línea del requisito: ese cruce es el ángulo máximo.
- La lectura «ángulo máximo admisible» da el límite exacto para esta geometría.

**Error clásico que desactiva.** Aprobar un reto por quedar dentro de un rango numérico aunque la distancia siga por debajo del requisito. Aquí el requisito manda: si está por debajo, no cumple.

**Modelo y límite.** Plano, cadena recta y desplazamiento solo horizontal. No incluye flecha del conductor, viento diferencial ni tercer dimensión.

**Controles.**
- Longitud de la cadena (0.8–6 m)
- Inclinación por viento θ (0–55 °)
- Distancia horizontal en reposo (1.5–6 m)
- Distancia requerida (1.2–4 m)

**Presets del material.**
- Ejemplo del curso (3,066 m, 30°, 3,50 m)
- Viento fuerte (40°)
- Reto: cumplir la separación

**Reto.**
- [requisito] Logra que d_h ≥ 2,42 m sin pasar de 22° de inclinación

**Fuentes.** Guion de exposición (pp. 1–14) · Diapositivas 2 h (62 diapositivas) · Martínez Velasco, UPC (pp. 5–9, 20–38, 47–55, 88–90) · Guía de ejercicios (17 pp.)

**Notas de cálculo.**
- La guía de ejercicios detectó que el reto de la versión 1 se aprobaba con 28° y 2,061 m, por debajo de los 2,42 m exigidos. En v2 el reto exige cumplir la distancia.

## e11 · Separación entre fases: una fórmula de predimensionamiento

*Tema 7 — Distancias entre fases y a la estructura · Vano, flecha y tensión: la geometría antes del diseño normativo*

**Por qué está en el juego.** Aplicar la expresión empírica del material y compararla con un criterio normativo de distancia a estructura.

**Fenómeno.** La separación entre fases debe soportar esfuerzos fase–fase y permitir que los conductores se muevan por viento, temperatura y cargas sin acercarse demasiado.

**Objetivo de aprendizaje.** Aplicar la fórmula empírica con sus unidades y contrastarla con un criterio normativo corregido por altitud, entendiendo que el resultado es preliminar.

**Qué mirar.**
- La escena muestra las dos fases en la torre y la flecha a mitad del vano: la distancia crítica no está en la torre.
- La gráfica barre la tensión nominal manteniendo K, F y L: la parte geométrica no cambia.
- Al bajar δ, el criterio normativo crece y puede pasar a gobernar.

**Error clásico que desactiva.** Tomar una fórmula empírica como distancia mínima universal, o cambiar las unidades del coeficiente K. Los coeficientes están atados a su metodología.

**Modelo y límite.** Expresión histórica de predimensionamiento y criterio NESC simplificado con factor 1,15. No sustituye el diseño normativo.

**Controles.**
- Coeficiente empírico K (0.5–1)
- Flecha máxima F (1–20 m)
- Longitud de cadena L (0.5–6 m)
- Tensión nominal entre fases Vₙ (66–550 kV)
- Densidad relativa para el criterio NESC (0.6–1)

**Presets del material.**
- Ejemplo del curso (K 0,75 · F 8 · L 3 · 230 kV)
- Mismo caso corregido a δ = 0,74

**Reto.**
- [hito] Reproduce el ejemplo del curso: D ≈ 4,02 m
- [requisito] Muestra que al corregir por δ = 0,74 el criterio normativo exige más de 4,2 m

**Fuentes.** Guion de exposición (pp. 1–14) · Diapositivas 2 h (62 diapositivas) · Cardona, UNAL (pp. 1–9) · Martínez Velasco, UPC (pp. 5–9, 20–38, 47–55, 88–90)

## e12 · Cable de guarda: el ángulo no es un certificado

*Tema 8 — Ubicación del cable de guarda · Geometría, distancia de choque y método electrogeométrico*

**Por qué está en el juego.** Usar el ángulo de apantallamiento y, al mismo tiempo, ver sus límites frente a un modelo de desempeño.

**Fenómeno.** La guarda se ubica sobre las fases para interceptar descargas. Su posición se describe con el ángulo desde la vertical, pero la probabilidad de que un líder alcance una fase depende de la corriente y de la geometría.

**Objetivo de aprendizaje.** Calcular α y la distancia de choque, distinguir una descripción geométrica de una evaluación de desempeño y reconocer que «38,7°» no demuestra protección.

**Qué mirar.**
- Las esferas de atracción de la escena crecen con la corriente: la zona cubierta cambia.
- La gráfica muestra α contra Δx para varios Δh: el mismo desplazamiento pesa distinto según la altura.
- La lectura «criterio α ≤ 30°» es una referencia separada del cálculo: no la confundas con el resultado.

**Error clásico que desactiva.** Concluir «la línea está protegida» a partir del ángulo. También hay fallas de apantallamiento por rayos de baja corriente, y el flameo inverso es un mecanismo distinto.

**Modelo y límite.** Construcción electrogeométrica 2D con r_c = 10·I^0,65 y r_g del material. No incluye flecha, terreno, líderes ascendentes ni distribución de corriente.

**Controles.**
- Diferencia vertical guarda–fase Δh (1–15 m)
- Separación horizontal Δx (0–12 m)
- Corriente de rayo considerada (2–100 kA)
- Altura media de la guarda (15–70 m)

**Presets del material.**
- Ejemplo del curso (Δh 5 m, Δx 4 m, 31 kA)
- Guarda vertical sobre la fase (0°)
- Guarda muy desplazada (45°)

**Reto.**
- [hito] Reproduce el ejemplo: Δh = 5 m y Δx = 4 m → α = 38,7°
- [requisito] Logra α ≤ 25° manteniendo Δh ≥ 4,5 m

**Fuentes.** Guion de exposición (pp. 1–14) · Diapositivas 2 h (62 diapositivas) · Cardona, UNAL (pp. 1–9) · Documento de estudio (pp. 19–133)

**Notas de cálculo.**
- El valor 38,7° aparece en el guion y en las diapositivas como cálculo geométrico, no como prueba de protección.

## e13 · Puesta a tierra: resistividad, geometría y temporada

*Tema 9 — Puesta a tierra y efecto de la temperatura · De ρ del terreno a una resistencia útil*

**Por qué está en el juego.** Entender que la resistencia no es una propiedad del suelo sino del conjunto suelo–electrodo, y que la temporada seca cambia el diseño.

**Fenómeno.** La corriente de una descarga o de una falla se dispersa por el terreno. La resistencia del electrodo y la forma en que el potencial decae alrededor de la torre determinan la elevación de potencial y el riesgo para personas.

**Objetivo de aprendizaje.** Calcular R para varilla y contrapeso, ver el efecto de la temporada y de varios electrodos, y explicar por qué una R baja no basta para la seguridad.

**Qué mirar.**
- Las capas de suelo y las líneas equipotenciales de la escena se separan al aumentar ρ.
- La gráfica muestra R contra longitud: alargar el electrodo ayuda, pero cada vez menos.
- Cambia a temporada seca: la resistencia se duplica y el diseño que «cumplía» deja de cumplir.

**Error clásico que desactiva.** Elegir el electrodo solo con una medición de verano y sin margen estacional, o creer que enterrar más electrodos divide la resistencia entre n.

**Modelo y límite.** Fórmulas de estado estable del material y rendimiento didáctico n^0,78 para electrodos en paralelo. No incluye estratificación, ionización del suelo ni respuesta impulsiva.

**Controles.**
- Resistividad del terreno ρ (30–1000 Ω·m)
- Longitud del electrodo (0.5–12 m)
- Radio del electrodo (0.005–0.03 m)
- Tipo de electrodo (varilla vertical / contrapeso horizontal)
- Electrodos en paralelo (1–10)
- Temporada (húmeda (ρ de diseño) / seca (ρ × 2))
- Corriente inyectada al terreno (2–40 kA)

**Presets del material.**
- Varilla de 3 m en ρ = 300 Ω·m
- Misma varilla en temporada seca
- Contrapeso de 12 m
- Seis varillas de 6 m

**Reto.**
- [requisito] Con ρ = 300 Ω·m y temporada seca, logra R ≤ 30 Ω
- [hito] Muestra que una sola varilla de 3 m en ρ = 300 Ω·m supera los 90 Ω

**Fuentes.** Guion de exposición (pp. 1–14) · Diapositivas 2 h (62 diapositivas) · Martínez Velasco, UPC (pp. 5–9, 20–38, 47–55, 88–90) · Documento de estudio (pp. 19–133)

## e14 · Flameo inverso: la torre también sube de potencial

*Tema 3 — El rayo y sus efectos en una línea · R·i(t) + L·di/dt frente al CFO de la cadena*

**Por qué está en el juego.** Ver por qué bajar la resistencia de tierra no es el único factor y por qué el di/dt puede decidir el flameo.

**Fenómeno.** Cuando el rayo impacta guarda o torre, la corriente baja por la estructura y el terreno. El potencial de la torre sube y aparece una tensión entre la torre y la fase que puede superar el CFO de la cadena.

**Objetivo de aprendizaje.** Calcular la elevación de potencial con el modelo R–L, compararla con el CFO y decidir si hay flameo inverso; entender el papel de la puesta a tierra y del reparto de corriente.

**Qué mirar.**
- La escena colorea la cadena cuando la tensión supera el CFO y dibuja el arco torre–fase.
- La gráfica de tensión sobre la cadena contra R_t cruza la línea del CFO: ese cruce es la resistencia límite.
- Sube di/dt: la caída inductiva crece aunque la resistencia no cambie.

**Error clásico que desactiva.** Creer que el flameo inverso depende solo de la resistencia de tierra y que «más tierra» siempre resuelve. La inductancia, el reparto y el acoplamiento también deciden.

**Modelo y límite.** Modelo concentrado R–L con acoplamiento constante y reparto equitativo. La torre real exige propagación y modelos dependientes de la frecuencia.

**Controles.**
- Corriente del rayo (5–150 kA)
- Torres que comparten la corriente (1–5)
- Resistencia de puesta a tierra R_t (1–60 Ω)
- Inductancia equivalente de torre (0.2–3 µH)
- Pendiente de corriente di/dt (2–60 kA/µs)
- Factor de acoplamiento con la fase (0–0.4)
- CFO de la cadena (700–1800 kV)

**Presets del material.**
- Caso exigente (60 kA, 20 kA/µs)
- Ejemplo del curso (10 kA, 15 Ω)
- Tierra mejorada (60 kA, 8 Ω)

**Reto.**
- [requisito] Con 60 kA, 20 kA/µs, L = 1 µH, k = 0,25 y CFO = 1400 kV, evita el flameo
- [hito] Reproduce el ejemplo simple del curso: 10 kA × 15 Ω = 150 kV (más la caída inductiva)

**Fuentes.** Guion de exposición (pp. 1–14) · Diapositivas 2 h (62 diapositivas) · Martínez Velasco, UPC (pp. 5–9, 20–38, 47–55, 88–90) · Documento de estudio (pp. 19–133)

## e15 · Ondas viajeras: lo que llega al equipo no es lo que salió

*Tema 10 — Ondas viajeras, reflexión y transmisión · Reflexión, transmisión y diagrama de Bewley*

**Por qué está en el juego.** Entender por qué la distancia al pararrayos cambia la tensión que soporta el transformador.

**Fenómeno.** Una variación rápida de tensión viaja por la línea con velocidad finita. Al encontrar un cambio de impedancia, parte se refleja y parte se transmite; en un extremo abierto la tensión puede duplicarse.

**Objetivo de aprendizaje.** Calcular Γ y τ, interpretar el signo, estimar Z_c y la velocidad, y explicar por qué la distancia entre pararrayos y equipo importa.

**Qué mirar.**
- La escena muestra el pulso incidente, el reflejado y el transmitido con amplitudes proporcionales.
- El diagrama de Bewley de la derecha traza los rebotes en el plano posición–tiempo.
- Cambia Z₂ al máximo y observa que Γ se acerca a +1 sin llegar: el abierto es un límite.

**Error clásico que desactiva.** Leer un Γ = +1 con Z₂ finita, o confundir la velocidad de la onda con la de la corriente de carga. Y olvidar que la tensión en el transformador depende de la distancia al descargador.

**Modelo y límite.** Línea ideal sin pérdidas, unión resistiva y coeficientes reales. No incluye atenuación por corona, dispersión ni capacidad del equipo.

**Controles.**
- Impedancia de la línea incidente Z₁ (100–700 Ω)
- Impedancia de la segunda línea Z₂ (5–2000 Ω)
- Onda incidente V_i (20–400 kV)
- Distancia al equipo (0–600 m)
- Inductancia L' (0.5–1.5 mH/km)
- Capacitancia C' (6–20 nF/km)

**Presets del material.**
- Ejemplo del curso (400 → 100 Ω, 100 kV)
- Extremo abierto (Z₂ = 2000 Ω)
- Cortocircuito ideal (Z₂ = 0)
- Acople perfecto (Z₂ = 400 Ω)

**Reto.**
- [hito] Reproduce el ejemplo: Z₁ = 400 Ω, Z₂ = 100 Ω, V_i = 100 kV → Γ = −0,60 y V_t = 40 kV
- [requisito] Encuentra Z₂ para Γ ≥ 0,6 (reflexión positiva fuerte) y observa la sobretensión en el extremo

**Fuentes.** Guion de exposición (pp. 1–14) · Diapositivas 2 h (62 diapositivas) · Martínez Velasco, UPC (pp. 5–9, 20–38, 47–55, 88–90) · Sánchez Tenorio (pp. 3–18) · Guía de ejercicios (17 pp.)

**Notas de cálculo.**
- La guía de ejercicios detectó dos defectos en la versión 1: escala de la velocidad y etiqueta «extremo abierto» con Z₂ = 2000 Ω (Γ = 0,667). Aquí se corrigen ambos.

## e16 · Pararrayos: cinco verificaciones a la vez

*Tema 11 — Selección y ubicación del pararrayos · Uc, TOV, tensión residual, distancia y margen*

**Por qué está en el juego.** Seleccionar un descargador como se hace en un proyecto: varias condiciones simultáneas, no una sola cifra.

**Fenómeno.** Un descargador de ZnO conduce muy poco a tensión normal y limita la tensión durante un transitorio, pero esa tensión residual no es la que ve el equipo si el descargador está lejos.

**Objetivo de aprendizaje.** Verificar las condiciones de selección —Uc, TOV, Ur, energía, tensión residual y margen— y ver por qué la ubicación y las conexiones cambian el nivel de protección.

**Qué mirar.**
- La escena mueve la tensión del equipo al alejar el descargador: la caída inductiva se suma a U_res.
- La gráfica de capacidad TOV: tu punto de operación debe quedar por debajo de la curva.
- Al cambiar la duración de la TOV, el punto se mueve sobre la curva: la capacidad no es un solo número.

**Error clásico que desactiva.** Comparar la tensión residual con el BIL ignorando las conexiones, o creer que la corriente nominal de descarga resume toda la capacidad energética.

**Modelo y límite.** TOV equivalente según UNE/IEC 60099-5 con m_d = 0,02 y suma aditiva conservadora de la caída inductiva. La evaluación real requiere curvas del fabricante y ondas viajeras.

**Controles.**
- Tensión máxima del sistema Uₘ (72.5–500 kV)
- Tensión continua del descargador U_c (60–300 kV eficaces)
- Tensión asignada U_r (60–360 kV eficaces)
- Sobretensión temporal (falla) (1–1.8 p.u. de U_f)
- Duración de la TOV (0.1–10 s)
- Capacidad TOV del catálogo a 1 s (100–350 kV eficaces)
- Tensión residual U_res (8/20 µs) (300–1200 kV cresta)
- Distancia descargador–equipo (0–30 m)
- Inductancia de conexión (0–2 µH/m)
- Pendiente de la corriente (2–30 kA/µs)
- Nivel soportado del equipo (BIL) (550–1800 kV cresta)

**Presets del material.**
- Ejemplo del curso (U_res 600, +60 kV)
- Descargador a 1 m del equipo
- TOV de 10 s (más exigente)
- Descargador con U_res alta (750 kV)

**Reto.**
- [hito] Reproduce el ejemplo del curso: margen ≈ 59,1 % con U_res 600 kV y 60 kV de conexiones
- [requisito] Acerca el descargador a 1 m y comprueba que el margen supera el 70 %

**Fuentes.** Guion de exposición (pp. 1–14) · Diapositivas 2 h (62 diapositivas) · Sánchez Tenorio (pp. 3–18) · Martínez Velasco, UPC (pp. 5–9, 20–38, 47–55, 88–90) · IEC 60099-4/5 (ensayos, TOV y energía)

## e17 · Corona: cuando el aire se ioniza junto al conductor

*Tema 12 — Efecto y pérdidas por corona · Incepción, gradiente superficial y pérdidas de Peek*

**Por qué está en el juego.** Ver de dónde sale la tensión de incepción y por qué el radio y el haz de conductores cambian las pérdidas.

**Fenómeno.** Cuando el gradiente local supera la rigidez del aire, se ioniza una capa alrededor del conductor. No hace falta un arco: aparecen luz, ruido, ozono, interferencia y pérdidas.

**Objetivo de aprendizaje.** Calcular la incepción a partir de r, δ y el estado superficial, y estimar pérdidas con Peek entendiendo sus límites.

**Qué mirar.**
- El halo de la escena crece con el exceso U − U₀: la corona no aparece de golpe en toda la línea.
- La parábola de pérdidas de la gráfica muestra la dependencia cuadrática: duplicar el exceso cuadruplica la pérdida.
- Pasa de 1 a 2 subconductores: el radio equivalente sube y la incepción se aleja.

**Error clásico que desactiva.** Usar la fórmula de Peek con U < U₀, o creer que cambiar el radio no cambia la incepción. En la versión 1 el control de haz no afectaba la fórmula; aquí la incepción sí depende de r_eq.

**Modelo y límite.** Incepción coaxial con E₀ = 21,1 kV/cm y pérdidas de Peek para buen tiempo. La lluvia, el estado superficial y la geometría real pueden aumentar las pérdidas.

**Controles.**
- Tensión fase–tierra (40–450 kV eficaces)
- Radio del subconductor (0.3–3 cm)
- Subconductores por fase (1–4)
- Separación en el haz (20–100 cm)
- Separación equivalente entre fases (200–1200 cm)
- Densidad relativa del aire δ (0.6–1)
- Factor superficial del conductor m (0.6–1)
- Frecuencia (50–60 Hz)
- Tensión de incepción U₀ (dato del ejemplo (120 kV) / calculada con el gradiente)
- U₀ de entrada (modo dato) (60–250 kV eficaces)

**Presets del material.**
- Ejemplo de Peek (10,29 kW/km)
- Incepción calculada (sin corona a 150 kV)
- Haz de 2 subconductores
- Conductor fino en altura

**Reto.**
- [requisito] Reproduce el ejemplo de Peek: 10,29 kW/km con U₀ = 120 kV
- [hito] Con U₀ calculada, adelgaza el conductor hasta que 141,5 kV entre en corona

**Fuentes.** Guion de exposición (pp. 1–14) · Diapositivas 2 h (62 diapositivas) · Documento de corona (pp. 1–4 y 19–26) · Guía de ejercicios (17 pp.)

**Notas de cálculo.**
- La guía de ejercicios señala que en la versión 1 el control visual de haz no intervenía en la ecuación; en v2 el radio equivalente modifica U₀ y las pérdidas.

## e18 · Misión: coordinar la línea completa

*Tema 13 — Integración y conclusiones · Cadena, altitud, guarda, tierra, descargador y margen*

**Por qué está en el juego.** Integrar todos los criterios en una sola decisión y comprobar que una solución verde en un renglón puede fallar en otro.

**Fenómeno.** La coordinación de aislamiento no es la suma de componentes óptimos por separado: es un conjunto donde la cadena, la altitud, la guarda, la tierra y el descargador se condicionan entre sí.

**Objetivo de aprendizaje.** Ejecutar el ciclo completo de verificación y explicar por qué cambiar una pieza obliga a revisar las demás.

**Qué mirar.**
- La escena completa se colorea por verificación: un renglón en rojo invalida el proyecto.
- El diagrama de barras compara esfuerzo y soporte en tres frentes: maniobra, rayo y equipo.
- Ajusta una sola pieza y observa cuántas comprobaciones se mueven.

**Error clásico que desactiva.** Presentar un cálculo aislado como solución. La cifra verde en un renglón no compensa un rojo en otro: el proyecto es el conjunto.

**Modelo y límite.** Modelos didácticos de los experimentos anteriores (ajuste CFO–N, TOV equivalente, suma inductiva). Los factores 1,05/1,15/1,25/20 % son hipótesis del ejercicio.

**Controles.**
- Tensión máxima Uₘ (72.5–500 kV)
- Altitud del sitio (0–4000 m)
- Temperatura (0–35 °C)
- Coeficiente de fuga k_f (12–35 mm/kV)
- Fuga por unidad (200–450 mm)
- Paso de montaje (0.1–0.2 m)
- Δh guarda–fase (2–12 m)
- Δx guarda–fase (0–10 m)
- Resistencia de tierra (1–50 Ω)
- Corriente de rayo de diseño (10–120 kA)
- di/dt de diseño (5–40 kA/µs)
- Acoplamiento guarda–fase (0–0.4)
- CFO de la cadena (900–1800 kV)
- U_c del descargador (80–300 kV eficaces)
- U_res del descargador (350–900 kV cresta)
- BIL del equipo (650–1800 kV cresta)
- Distancia descargador–equipo (0–20 m)

**Presets del material.**
- Proyecto de referencia (245 kV, 2 640 m)
- Geometría del ejemplo (38,7°)
- Descargador insuficiente y tierra alta

**Reto.**
- [requisito] Haz que todas las verificaciones pasen (proyecto coordinado)
- [requisito] Logra el proyecto coordinado con α ≤ 25° y margen ≥ 40 %

**Fuentes.** Guion de exposición (pp. 1–14) · Diapositivas 2 h (62 diapositivas) · Cardona, UNAL (pp. 1–9) · Sánchez Tenorio (pp. 3–18) · Martínez Velasco, UPC (pp. 5–9, 20–38, 47–55, 88–90) · IEC 60071-1/2 (procedimiento y factores de corrección)

## e19 · Medir el aislamiento: la aguja cuenta una historia

*Tema 5 — Atmósfera, altitud y temperatura · Carga, absorción, fuga y los índices DAR y PI*

**Por qué está en el juego.** Interpretar una medición de resistencia de aislamiento y no confundir un valor bajo con una causa.

**Fenómeno.** Al aplicar tensión continua, la corriente total tiene tres partes: carga capacitiva, absorción y fuga. La resistencia aparente crece con el tiempo; cómo crece revela el estado del aislamiento.

**Objetivo de aprendizaje.** Interpretar R(t), calcular DAR y PI, corregir por temperatura y distinguir humedad superficial de daño interno.

**Qué mirar.**
- La curva R(t) de la gráfica: un aislamiento sano sigue subiendo; uno húmedo se aplana pronto.
- El instrumento de la escena muestra el valor en el instante seleccionado por el barrido.
- Sube la corriente de conducción y mira cómo DAR y PI caen aunque la absorción sea la misma.

**Error clásico que desactiva.** Diagnosticar con un solo valor puntual, sin temperatura ni humedad, o aplicar los umbrales de PI a cualquier equipo.

**Modelo y límite.** Modelo de tres corrientes con exponencial de absorción. Los umbrales provienen de la guía (DAR < 1,25 insuficiente; PI < 2 problema potencial; IEEE 43 fija PI ≥ 2 para máquinas rotativas).

**Controles.**
- Corriente de conducción (fuga) (0.2–40 µA)
- Corriente de absorción inicial (5–80 µA)
- Constante de absorción (5–120 s)
- Tensión de ensayo (500–5000 V)
- Temperatura del devanado (0–60 °C)
- Humedad relativa (20–95 %)

**Presets del material.**
- Aislamiento sano (seco y limpio)
- Aislamiento húmedo y sucio
- Envejecido, con fugas

**Reto.**
- [requisito] Ajusta un aislamiento sano: DAR ≥ 1,6 y R60 ≥ 100 MΩ
- [hito] Reproduce un caso húmedo: DAR < 1,25 y R60 < 150 MΩ

**Fuentes.** Guía de medición (pp. 2–6) · Guion de exposición (pp. 1–14) · Diapositivas 2 h (62 diapositivas)

## Verificación automática

El repositorio comprueba en cada ejecución que:

- cada experimento produce lecturas finitas y se renderiza (escena, gráfica, tarjeta de aprendizaje) sin `NaN` ni `undefined`;
- cada meta es alcanzable y los requisitos pueden cumplirse simultáneamente (búsqueda sobre los presets, barridos de un parámetro y muestreo aleatorio);
- los anclajes numéricos del material siguen dando lo que dice el guion (141,45 kV; 575,12 kV; 623,8 kV ⇒ ≈7,1 unidades; 101,8 Ω; Γ = −0,60; 660 kV ⇒ 59,1 %; 10,29 kW/km; 646,2 kV).

## De dónde sale cada número

- **Guion de exposición** — Guion de exposición: Coordinación de aislamiento (120 min) (pp. 1–14). Estructura de los 13 temas, tiempos y criterios didácticos.
- **Diapositivas 2 h** — Coordinación de aislamiento: sobretensiones, aislamiento y protección de líneas (62 diapositivas). Soporte visual de cada bloque y ejemplos numéricos.
- **Cardona, UNAL** — Selección aislamiento para líneas de transmisión (pp. 1–9). Fuga, número de aisladores por maniobra, distancias y apantallamiento.
- **Ruiz & Lozano, La Salle** — Coordinación de aislamiento en centrales y subestaciones (pp. 4–22). Tipos de sobretensión, protección y corrección por altura.
- **Martínez Velasco, UPC** — Coordinación de aislamiento en redes eléctricas de alta tensión (pp. 5–9, 20–38, 47–55, 88–90). Mecanismos de disrupción, pararrayos de ZnO, puesta a tierra y distancias con viento.
- **Sánchez Tenorio** — Cálculos para la selección del pararrayos (pp. 3–18). Uc, Ur, TOV equivalente, energía, niveles de protección y margen.
- **Documento de corona** — Corona: mecanismo, tipos de descarga y pérdidas (pp. 1–4 y 19–26). Avalancha, incepción, tipos de corona y fórmulas de pérdidas.
- **Guía de medición** — Guía de la medición de aislamiento (pp. 2–6). Corrientes de carga, absorción y fuga; DAR, PI e influencia de temperatura y humedad.
- **Documento de estudio** — Expo coordinación: desarrollo conceptual de los 13 temas (pp. 19–133). Detalle de fórmulas de tierra, contrapesos, separaciones y apantallamiento.
- **Guía de ejercicios** — Guía de estudio: 14 actividades con solución manual y comprobación (17 pp.). Verificación de los valores de la versión 1 y de los errores detectados.
- **IEC 60060-1:2025** — High-voltage test techniques — Part 1: General definitions and test requirements (definición de impulso de maniobra 170/2500 µs). Formas de onda normalizadas y origen virtual.
- **IEC 60071-1/2** — Insulation co-ordination (procedimiento y factores de corrección). Marco normativo de la coordinación de aislamiento.
- **IEC 60099-4/5** — Surge arresters — Metal-oxide surge arresters / Selection and application (ensayos, TOV y energía). Parámetros y verificación del descargador.
- **IEC TS 60815-1** — Selection and dimensioning of high-voltage insulators intended for use in polluted conditions (línea de fuga específica). Criterio de contaminación.
