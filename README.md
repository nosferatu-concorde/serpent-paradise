# Serpent in the Paradise

A grid-based action puzzle game built with Phaser 3.

## Gameplay

Control a warrior on a grid arena fighting against intelligent snakes. The unique twist:

- **Hit snake body**: Splits into two independent snakes
- **Hit snake tail**: Shrinks the snake
- **Hit snake head**: Nothing happens (head is invulnerable)
- **Kill condition**: Reduce snake to head only

Snakes seek and eat food to grow. Don't let any snake head touch you!

## Controls

- **Arrow Keys** or **WASD**: Move warrior
- **R**: Restart game

## Development

```bash
# Install dependencies
npm install

# Start dev server (http://localhost:3000)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Tech Stack

- Phaser 3 (game framework)
- Vite (build tool with HMR)
- ES6 modules

## Project Structure

```
src/
├── entities/         # Game entities (Warrior, Snake, Food)
├── managers/         # Game logic managers
├── scenes/           # Phaser scenes
├── config.js         # Game constants
└── main.js           # Entry point
```

## Game Mechanics

All core mechanics are implemented:
- ✓ Grid-based movement with wrapping
- ✓ Snake AI (food-seeking pathfinding)
- ✓ Split mechanic (hit body)
- ✓ Damage mechanic (hit tail)
- ✓ Win/lose conditions
- ✓ Food spawning system
