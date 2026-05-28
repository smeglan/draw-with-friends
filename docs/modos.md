# Modos de juego

Cada modo define:
- **Objetivo** — qué intenta lograr cada jugador
- **Flujo** — rondas, turnos, fases
- **Puntuación** — cómo se gana
- **Eventos clave** — mensajes que emite el sistema para sincronización

---

## Obra maestra

> Cada jugador dibuja una obra sobre una temática, y todos votan.

### Objetivo
Crear el dibujo más votado por la sala.

### Flujo
1. El anfitrión elige tiempo (definido o indefinido)
2. Se define la temática:
   - Temática predefinida por el sistema
   - Lista de sugerencias de los participantes (votación)
   - Ruleta aleatoria
3. Todos dibujan simultáneamente (o por turnos, según config)
4. Al terminar, cada jugador puntúa cada dibujo del 1 al 5
5. Se muestra ranking final con puntuaciones

### Puntuación
- Cada jugador puntúa los dibujos ajenos del 1 al 5
- Puntuación propia no cuenta
- Gana el que tiene mayor promedio

### Eventos
- `ROUND_STARTED { theme, duration }`
- `SUBMISSION { playerId, drawingData }`
- `VOTE_CAST { voterId, targetId, score }`
- `ROUND_ENDED { rankings }`

---

## Fusión

> Dos rondas: dibujar personajes base, luego fusionarlos.

### Objetivo
Crear la fusión más creativa a partir de dos personajes base.

### Flujo
1. **Ronda 1 — Personajes base**: Cada jugador dibuja un personaje
2. Se asignan dos personajes al azar a cada jugador (o la sala vota pares)
3. **Ronda 2 — Fusión**: Cada jugador fusiona los dos personajes en uno nuevo
4. Votación y ranking

### Puntuación
- Misma dinámica que Obra maestra (voto del 1 al 5)
- Se puede puntuar por separado: creatividad, parecido a los originales, humor

### Eventos
- `ROUND_STARTED { phase: "characters" | "fusion", ... }`
- `CHARACTER_SUBMITTED { playerId, drawing }`
- `PAIR_ASSIGNED { playerId, characterAId, characterBId }`
- `FUSION_SUBMITTED { playerId, drawing }`
- `VOTE_CAST { ... }`
- `ROUND_ENDED { rankings }`

---

## Teléfono roto

> Cadena de dibujo y descripción.

### Objetivo
Ver cómo una idea se transforma a través de la cadena.

### Flujo
1. Cada jugador escribe una frase corta
2. Se asignan las frases al azar, cada jugador dibuja la frase que le tocó
3. Se barajan los dibujos, cada jugador describe el dibujo que ve
4. Se barajan las descripciones, cada jugador dibuja la descripción que lee
5. Se repite por N rondas (configurable, ej: 3 rondas)
6. Al final se revela la cadena completa de cada frase original

### Puntuación
- Sin puntuación (modo party / diversión)
- Opcional: la sala vota la cadena más graciosa o más fiel

### Eventos
- `CHAIN_STARTED { phrases[] }`
- `PHRASE_ASSIGNED { playerId, phrase }`
- `DRAWING_SUBMITTED { playerId, drawing }`
- `DESCRIPTION_SUBMITTED { playerId, description }`
- `CHAIN_REVEALED { chains[] }`

---

## Pinturillo / Adivinanza

> Un jugador dibuja, los otros adivinan.

### Objetivo
Adivinar lo que el dibujante está dibujando.

### Flujo
1. Se asigna una palabra al azar al dibujante
2. El dibujante dibuja (sin letras ni números)
3. Los demás escriben sus intentos en un chat
4. Puntos por adivinar rápido, y puntos para el dibujante si alguien adivina
5. Se rota el rol de dibujante

### Puntuación
- El que adivina: más puntos cuanto más rápido (ej: 100 - tiempoSegundos * 2)
- El dibujante: 50 puntos si alguien adivina
- Gana el que acumula más puntos tras N rondas

### Eventos
- `WORD_ASSIGNED { drawerId, word }` (solo se envía al drawer)
- `TURN_STARTED { drawerId, duration }`
- `STROKE_ADDED { ... }` (eventos de canvas compartidos)
- `GUESS_ATTEMPT { playerId, guess }`
- `GUESS_CORRECT { playerId, timeMs, points }`
- `TURN_ENDED { drawerId, correctGuess }`
