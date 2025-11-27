Serpent in the Paradise
Game Design Document

---

PROJECT OVERVIEW

Title: Serpent in the Paradise
Genre: Action Puzzle
Platform: Web (Phaser 3)
Target Audience: Casual gamers, arcade enthusiasts
Development Timeline: 1 week (prototype + mechanics)
Art Pass: Post-launch (hand-drawn graphics)
Build System: Vite with HMR

CORE CONCEPT

The player controls a warrior on a grid-based arena, facing off against serpents that grow when they eat food. The twist: striking a serpent anywhere except the head or tail causes it to split into two independent snakes, while hitting the tail makes it shrink. Only by eliminating the head can you permanently defeat a snake.

DESIGN PILLARS

1. Strategic Combat - Positioning and timing matter; hitting the wrong spot has consequences
2. Emergent Complexity - Simple mechanics that create surprising interactions
3. Satisfying Feedback - Clear cause-and-effect for every action
4. Arcade Feel - Quick sessions, high replayability

GAMEPLAY MECHANICS

Player (Warrior)

Movement: 4-directional grid-based movement (up, down, left, right)
Input: Keyboard controls (Arrow Keys or WASD)
Collision: Dies if touched by any snake head
Interaction: Can attack snakes by moving into them
Health: Single hit = death (restart game)

Snakes

Composition: Chain of segments (head, body segments, tail)
Movement: Grid-based, constant velocity
Behavior: AI-driven food-seeking toward nearest food
Growth: Eating food adds a new tail segment
Splitting Mechanic (THE CORE TWIST):

- Hit on any BODY segment (between head and tail) → snake splits into two complete, independent snakes at that position
- Both new snakes continue with original direction and behavior
  Damage Mechanic:
- Hit on TAIL → tail segment removed (snake shrinks)
- Hit on HEAD → nothing happens (no damage)
  Death Condition: Only head remaining → snake dies

Food

Spawn: Random grid locations (not occupied by snakes/warrior)
Behavior: Stationary until eaten
Effect: Snakes actively seek and move toward nearest food
Respawn: New food appears after being eaten or on timer
Limit: 2-3 food items max on grid at once

Win Condition

All snakes eliminated (destroyed when only head remains)

Lose Condition

Player's warrior touches any snake head

GAME LOOP

1. Spawn initial snake(s) and food (2-3 items)
2. Each frame:
   - Process keyboard input → update warrior direction
   - Move warrior one grid tile
   - Update all snakes:
     - Calculate direction toward nearest food (greedy pathfinding)
     - Move snake forward (head moves, tail follows)
     - Check if snake ate food → grow
   - Respawn food if needed
   - Check all collisions:
     - Warrior vs Snake Head → Lose condition
     - Warrior vs Snake Body → Split snake at that segment
     - Warrior vs Snake Tail → Shrink snake
3. Remove dead snakes (only head remaining)
4. Check win condition (no snakes left)
5. Draw everything
6. Repeat

TECHNICAL REQUIREMENTS

Grid System

- Dimensions: 16x12 tiles
- Tile size: 32px
- Canvas: 512x384px
- Boundary behavior: Grid wrapping (arcade feel)
- Coordinate system: {x, y} where x ∈ [0,15], y ∈ [0,11]

Movement

- All entities move one grid tile per frame
- Movement is discrete (not pixel-perfect)
- No diagonal movement

Collision Detection

- Grid-based (position checking, not physics)
- Warrior occupies one tile
- Each snake segment occupies one tile
- Food occupies one tile
- Multiple entities cannot occupy same tile (except logic during collision resolution)

Rendering (Prototype Phase)

- Grid visualization: 16x12 colored rectangles
- Warrior: Green square
- Snake head: Red
- Snake body segments: Yellow
- Snake tail: Orange
- Food: Magenta/pink dot
- Optional: Light gray grid lines for debugging
- No animations needed for prototype (static rectangles acceptable)

ARCHITECTURE OVERVIEW

This is NOT prescriptive code. Use your best judgment on implementation.

Core Components (Responsibilities)

InputManager

- Listen to keyboard input (Arrow Keys + WASD)
- Buffer direction changes (nextDirection)
- Prevent 180° reversals (can't go directly backward)
- Update warrior direction each frame

SnakeManager

- Create snakes with initial segments (spawn)
- Move snakes toward nearest food (AI food-seeking using greedy pathfinding)
- Advance snake position (head moves, tail follows)
- Handle snake eating food → add segment to tail
- Implement split mechanic: when hit on body segment, create two new independent snakes
- Implement tail damage: when hit on tail, remove tail segment
- Track alive/dead snakes
- Remove dead snakes from game

FoodManager

- Spawn food at random valid positions
- Track food (eaten vs available)
- Provide nearest food lookup (for snake AI)
- Respawn food when eaten or below limit
- Ensure food spawns in valid locations (not on snakes/warrior)

CollisionManager

- Detect warrior position vs all snake positions
- Warrior vs Snake Head → trigger lose condition
- Warrior vs Snake Body (non-head, non-tail) → split that snake
- Warrior vs Snake Tail → shrink that snake
- Handle collision resolution order

GameScene (Phaser Scene)

- Orchestrate all managers
- Update loop: input → movement → collision → rendering
- Win/lose condition checks
- Restart logic

Warrior Entity

- Track position {x, y}
- Track direction {x, y}
- Move based on direction each frame
- Handle grid wrapping

Snake Entity

- Maintain array of segments
- Each segment: position, isHead flag, isTail flag
- Track current direction
- Calculate and move toward nearest food
- Handle growth (add segment)
- Handle splitting (create new snakes)
- Handle tail damage (remove segment)
- Track alive/dead state

Food Entity

- Position {x, y}
- Eaten flag
- Simple data structure (no behavior)

Data Flow (Not Prescriptive)

Frame Update Sequence:

1. InputManager.update() → updates warrior.direction
2. Warrior.update() → moves warrior
3. SnakeManager.update() → moves all snakes, checks food collision
4. FoodManager.update() → respawns food as needed
5. CollisionManager.update() → checks warrior vs snakes, resolves outcomes
6. SnakeManager.removeDeadSnakes() → cleanup
7. Check win condition
8. Render all entities

INSTRUCTIONS FOR CLAUDE CODE AGENT

This document defines WHAT to build, not HOW to code it.

FIXED DECISIONS (Non-negotiable)

Build System: Vite with hot module reload (HMR)
Module System: ES6 modules (import/export)
Game Framework: Phaser 3
Grid System: 16x12 tiles, 32px/tile, wrapping boundaries
Rendering: Phaser Graphics API (colored rectangles for prototype)
Architecture: Manager pattern with entity classes (InputManager, SnakeManager, FoodManager, CollisionManager, Warrior, Snake, Food)
Mechanics: Split, damage, food-seeking, collision as specified above

IMPLEMENTATION DECISIONS (Claude Code's Call)

You decide:

- Class vs functional architecture (within managers)
- State management approach (what data lives where)
- Specific pathfinding algorithm for snake AI (greedy/random hybrid is fine)
- Code organization (file structure, method naming)
- Testing strategy
- Error handling approach
- Performance optimizations (if needed)
- UI/UX details (menu, restart, score display)

NON-NEGOTIABLE REQUIREMENTS

All mechanics must work perfectly:
✓ Warrior moves smoothly, wraps at grid edges
✓ Snakes move toward food (AI behavior feels natural)
✓ Food spawns and respawns correctly
✓ Split mechanic: hitting body creates two independent snakes
✓ Damage mechanic: hitting tail shrinks snake
✓ Collision detection is accurate (no missed collisions)
✓ Win condition: all snakes dead = victory
✓ Lose condition: warrior touches snake head = game over

Code Quality:
✓ Clean, readable code
✓ No game-breaking bugs
✓ Maintainable structure
✓ Comments where needed

Performance:
✓ Game runs at 60 FPS
✓ No lag or stuttering
✓ Smooth movement

Timeline:
✓ Complete within one week
✓ Ship with mechanics working, no features cut mid-dev

PRIORITY IMPLEMENTATION ORDER

Phase 1 (Foundations)

1. Warrior movement + keyboard input
2. Basic snake movement (no AI yet, just directional movement)
3. Collision detection: warrior vs snake head (lose condition)
4. Basic rendering: grid + entities as rectangles

Phase 2 (Smart Behavior)

1. Food spawning system
2. Snake AI: food-seeking using greedy pathfinding
3. Snake eating food: growth mechanic
4. Respawning food

Phase 3 (Advanced Mechanics)

1. Split mechanic: hitting body creates two snakes
2. Damage mechanic: hitting tail shrinks snake
3. Death condition: head only = dead snake
4. Win condition: no snakes left = victory

Phase 4 (Polish)

1. Score/UI (optional for MVP, post-launch ok)
2. Restart button/game over screen
3. Visual feedback (optional: screen flash on collision, etc.)

DEVELOPMENT WORKFLOW

Setup:
npm install
npm run dev # Start dev server with HMR

Building:
npm run build # Production build
npm run preview # Test production build locally

Testing:
Test mechanics frequently during development
Focus on split/damage behavior (most complex)
Verify no collision edge cases

RENDERING STRATEGY

Prototype Graphics (Good Enough)

- Use Phaser Graphics API
- Draw colored rectangles (no sprites needed)
- Color coding for clarity:
  - Warrior = Green (#00ff00)
  - Snake head = Red (#ff0000)
  - Snake body = Yellow (#ffff00)
  - Snake tail = Orange (#ff9900)
  - Food = Magenta (#ff00ff)
  - Grid (optional) = Light gray (#333333)

Post-Launch Art Pass

- Hand-drawn 2D sprites (Aseprite, GIMP, etc.)
- Warm, earthy tones (paradise theme)
- Smooth animations
- Particle effects (optional)

SCOPE - ONE WEEK SPRINT

MUST HAVE (MVP)
✓ All core mechanics working (split, damage, food-seeking)
✓ Warrior control (movement, wrapping)
✓ Snake AI (seeking food)
✓ Collision detection
✓ Win/lose conditions
✓ Placeholder graphics
✓ Playable game (start to finish)

SHOULD HAVE
✓ Score tracking
✓ Game over screen with restart

NICE TO HAVE (POST-LAUNCH)

- Hand-drawn art
- Sound effects & music
- Difficulty progression (waves, spawning multiple snakes)
- Power-ups
- Leaderboard
- Mobile touch controls
- Advanced animations

DO NOT INCLUDE THIS WEEK

- Polished art
- Audio
- Advanced difficulty
- Anything that cuts into mechanic perfection time

SUCCESS METRICS

By end of week:

- Game is playable from start to finish
- All mechanics (split, damage, food-seeking) feel solid
- No game-breaking bugs
- Code is clean and maintainable
- Mechanics are tuned (difficulty feels right)

FUTURE ENHANCEMENTS (Post-Launch)

Difficulty Progression

- Wave 1: 1 snake, slow speed
- Wave 2: 1-2 snakes, faster speed
- Wave 3+: Multiple snakes, aggressive spawning

Gameplay Features

- Power-ups: speed boost, invincibility, multi-hit
- Score multipliers based on snake size
- Time attack mode
- Leaderboard/high scores

Content

- Hand-drawn art (all entities)
- Background music
- Sound effects (move, hit, split, death, food pickup)
- Visual effects (screen shake, particles)

Quality of Life

- Mobile touch controls
- Pause button
- Settings menu
- Tutorial/help screen

GAME BALANCE NOTES (For Tuning During Dev)

Snake Speed: Should be catchable but challenging
Food Spawn Rate: Food appears frequently enough to drive snake behavior
Snake Initial Length: 5 segments is good starting point (adjust if too easy/hard)
Warrior Starting Position: Grid center (8, 6)
Initial Snake Spawn: Position (2, 2) with 5 segments, or multiple snakes
Food Limit: 2-3 items on grid at once (adjust for pacing)

FINAL NOTES FOR CLAUDE CODE

You're building a prototype. Mechanics > Polish > Art.

Focus on:

1. Making split/damage behavior feel right (test frequently)
2. Snake AI feeling natural (not stupid, not impossible)
3. Collision detection being perfect (no missed hits)
4. Code being maintainable (for future art pass)

Make smart calls on implementation. This architecture is your blueprint, but you own the code.

Ship with something you're proud of, even if it's "just colored rectangles." Good mechanics > pretty graphics.
