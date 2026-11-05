# UNOChess ♚🃏

Ajedrez donde las cartas deciden tu turno. App web instalable en el móvil (PWA), para jugar 1 vs 1 en el mismo móvil u online con un código de sala.

**Jugar:** https://tabares7.github.io/UNOChess/

## Reglas

- Ajedrez normal, pero cada turno juegas una de tus **3 cartas** y robas otra de un mazo compartido.
- El tablero tiene **4 zonas de color** (cuadrantes): rojo a1–d4, azul e1–h4, verde a5–d8, amarillo e5–h8.
- Si estás en **jaque**, puedes ignorar tu carta y mover libremente para salir.
- Si ninguna carta te sirve, descarta una y pasa.
- Se gana por jaque mate. Hay enroque y coronación, no captura al paso. Tablas clásicas.

| Carta | Efecto |
|---|---|
| Número 0–9 | Mueve una pieza que salga o llegue a la zona de su color, máximo N casillas (0 = sin límite) |
| +2 | Dos movimientos seguidos con piezas distintas |
| Bloqueo | Mueves libremente y el rival pierde su turno (si no está en jaque) |
| Reversa | Los jugadores se intercambian las piezas |
| Comodín | Mueve una pieza como caballo, alfil, torre o dama |
| +1 ficha | Revive una pieza capturada en su casilla inicial (si está ocupada, la carta se pierde) |
| Escudo | Una pieza tuya no puede ser capturada hasta tu próximo turno |
| Teletransporte | Intercambia dos piezas tuyas (no puede dar jaque) |
| Congelar | Una pieza rival no puede moverse en su próximo turno |

## Desarrollo

```bash
npm install
npm run dev     # servidor local
npm test        # pruebas del motor
npm run build   # build de producción
```

- React + Vite + TypeScript, PWA con `vite-plugin-pwa`.
- Online peer-to-peer con [PeerJS](https://peerjs.com/): el anfitrión guarda el estado de la partida y el invitado se conecta con el código.
- Motor de reglas en `src/engine/` (puro y con pruebas).
- Se publica en GitHub Pages con cada push a `main`.
