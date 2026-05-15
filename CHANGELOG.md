# Changelog — Verdaderos Reales

Formato basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/).

---

## [Sin publicar]

---

## [0.1.0] - 2026-05-14

### Añadido
- Castigo por fallo: resta puntos al fallar (puede resultar en puntaje negativo).
- Puntuación por pregunta en modo personalizado: el King define puntos de acierto y castigo al crear cada pregunta.
- Badge de valor de pregunta en la pantalla de juego (acierto y castigo).
- Scoreboard en `CreateQuestionScreen` y `WaitingForQuestionScreen`.
- Toast global de errores (reemplaza `alert()`).
- Detección de sala cerrada: jugadores son redirigidos al menú si el admin resetea.
- `answeredQuestions` persiste en `localStorage` y se restaura al reconectarse.

### Cambiado
- Controles de rondas y puntos cambiaron de botones a sliders (rondas: 2–20, puntos: 1–10).
- Scoreboard unificado en todas las pantallas: lista ordenada con indicador de estado por ronda.
- Polling de sala estabilizado (sin intervals zombies).

### Corregido
- Doble submit en respuestas de texto libre.
- Límite de caracteres faltante en `CreateQuestionScreen`.
- `answeredQuestions` no se limpiaba al hacer revancha para los aspirantes.
- Reconexión restauraba índices incorrectos de preguntas respondidas.

---

## [0.0.6] - 2026-04-28
### Añadido
- Agregado el modo personalizado.
- creado la pantalla de creación de preguntas.
- creado la pantalla de espera mientras se crea la pregunta.
- creado la pantalla de selección del rey.
- añadido un nuevo rol que maneja toda la sala (admin).
- añadido el boton de revancha para volver a jugar en la misma sala.


---

## [0.0.5] - 2026-04-18
### Añadido
- Modal de configuración para selección de rondas y puntajes.
- las respuestas pueden tener diferentes valores.
- selección entre diferentes opciones de numero de preguntas y puntos.

---

## [0.0.4] - 2026-03-05
### Añadido
- Límite de caracteres en respuestas de texto.
- Tabla final de resultados ordenada por puntaje con desglose de respuestas.
- Duración de partida calculada desde `startedAt` hasta `finishedAt`.
- Instrucciones para el rey visibles durante la partida.

### Corregido
- Estados de participantes no cargaban si no habían respondido.
- Visualización incorrecta de respuestas de los reales.

---

## [0.0.3] — 2026-03-04
### Añadido
- Espacios publicitarios (`AdBanner`) en la parte superior e inferior de todas las pantallas.
- 101 preguntas genéricas nuevas (total: 199).

### Cambiado
- Pantallas adaptadas a móvil, tablet y desktop con ancho máximo en contenedores.

---

## [0.0.2] — 2026-03-03
### Añadido
- Estados visuales de respuesta por jugador en el scoreboard: azul (respondió), verde (correcto), rojo (incorrecto).
- Historial de respuestas por jugador visible durante la partida.
- Historial de respuestas con detalle de pregunta, respuesta y resultado en pantalla de resultados.

### Cambiado
- Optimización general del código base.

---

## [0.0.1] — 2026-02-17
### Añadido
- Flujo completo de partida: menú → lobby → juego → resultados.
- Creación y unión a salas con código de 6 caracteres.
- Modo genérico: 99 preguntas predefinidas en español mezcladas aleatoriamente.
- Sistema de validación: el King marca cada respuesta como correcta o incorrecta.
- Scoreboard en tiempo real actualizado tras cada validación.
- Configuración de partida: número de rondas y puntos por acierto.
- Soporte multijugador en tiempo real vía polling cada 3 segundos.
- API serverless en Vercel con endpoints: `join`, `answer`, `validate`.

