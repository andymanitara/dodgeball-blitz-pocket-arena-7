import { gameInput, physicsState, useGameStore } from '@/store/useGameStore';
// Constants
const COURT_WIDTH = 10;
const COURT_LENGTH = 18; // -9 to 9
const PLAYER_RADIUS = 0.5;
const BALL_RADIUS = 0.3;
const PLAYER_SPEED = 8;
const DODGE_SPEED = 18;
const FRICTION = 0.92;
const GRAVITY = 25;
const THROW_FORCE = 20;
const THROW_UP_FORCE = 6;
interface Entity {
  x: number;
  z: number;
  vx: number;
  vz: number;
  radius: number;
  cooldown: number; // For dodge or throw
  holdingBallId: number | null;
  invulnerable: number;
}
interface Ball {
  id: number;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  state: 'idle' | 'held' | 'flying';
  owner: 'player' | 'bot' | null;
  grounded: boolean;
}
class PhysicsEngine {
  player: Entity;
  bot: Entity;
  balls: Ball[];
  constructor() {
    this.player = this.createEntity(0, 6);
    this.bot = this.createEntity(0, -6);
    this.balls = [];
    this.resetBalls();
  }
  createEntity(x: number, z: number): Entity {
    return {
      x, z, vx: 0, vz: 0,
      radius: PLAYER_RADIUS,
      cooldown: 0,
      holdingBallId: null,
      invulnerable: 0
    };
  }
  resetBalls() {
    this.balls = Array.from({ length: 5 }).map((_, i) => ({
      id: i,
      x: (Math.random() * 6) - 3,
      y: BALL_RADIUS,
      z: 0,
      vx: 0, vy: 0, vz: 0,
      state: 'idle',
      owner: null,
      grounded: true
    }));
  }
  resetPositions() {
    this.player = this.createEntity(0, 6);
    this.bot = this.createEntity(0, -6);
    this.resetBalls();
    // Sync initial state
    this.syncState();
  }
  update(dt: number) {
    // 1. Player Movement
    this.handlePlayerInput(dt);
    // 2. Bot Logic (Simple Dummy for Phase 1)
    this.handleBotLogic(dt);
    // 3. Physics Integration
    this.integratePhysics(dt);
    // 4. Collisions
    this.handleCollisions();
    // 5. Sync to Shared State
    this.syncState();
  }
  handlePlayerInput(dt: number) {
    const { joystick, isThrowing, isDodging } = gameInput;
    // Cooldown management
    if (this.player.cooldown > 0) this.player.cooldown -= dt;
    if (this.player.invulnerable > 0) this.player.invulnerable -= dt;
    // Movement
    if (this.player.cooldown <= 0.7) { // Can move if not mid-dodge
        this.player.vx = joystick.x * PLAYER_SPEED;
        this.player.vz = joystick.y * PLAYER_SPEED; // Joystick Y is inverted in UI usually, but we'll handle it there
    }
    // Dodge
    if (isDodging && this.player.cooldown <= 0) {
        const dodgeDirX = joystick.x || 0;
        const dodgeDirZ = joystick.y || 0;
        // Only dodge if moving
        if (Math.abs(dodgeDirX) > 0.1 || Math.abs(dodgeDirZ) > 0.1) {
            const len = Math.sqrt(dodgeDirX*dodgeDirX + dodgeDirZ*dodgeDirZ);
            this.player.vx = (dodgeDirX / len) * DODGE_SPEED;
            this.player.vz = (dodgeDirZ / len) * DODGE_SPEED;
            this.player.cooldown = 1.0; // 1s cooldown
            this.player.invulnerable = 0.3; // 0.3s invuln
            // Reset input trigger
            gameInput.isDodging = false;
        }
    }
    // Throw
    if (isThrowing && this.player.holdingBallId !== null) {
        this.throwBall(this.player, 'player');
        gameInput.isThrowing = false;
    }
    // Pickup Ball (Auto)
    if (this.player.holdingBallId === null) {
        this.tryPickup(this.player, 'player');
    }
  }
  handleBotLogic(dt: number) {
    // Simple dummy movement: slide left/right
    const time = Date.now() / 1000;
    this.bot.vx = Math.sin(time) * 3;
    // Bot pickup
    if (this.bot.holdingBallId === null) {
        this.tryPickup(this.bot, 'bot');
    } else {
        // Random throw
        if (Math.random() < 0.01) {
            this.throwBall(this.bot, 'bot');
        }
    }
  }
  integratePhysics(dt: number) {
    // Player Integration
    this.player.x += this.player.vx * dt;
    this.player.z += this.player.vz * dt;
    // Player Bounds (Bottom Half: z > 0)
    this.player.x = Math.max(-COURT_WIDTH/2 + PLAYER_RADIUS, Math.min(COURT_WIDTH/2 - PLAYER_RADIUS, this.player.x));
    this.player.z = Math.max(0 + PLAYER_RADIUS, Math.min(COURT_LENGTH/2 - PLAYER_RADIUS, this.player.z));
    // Bot Integration
    this.bot.x += this.bot.vx * dt;
    this.bot.z += this.bot.vz * dt;
    // Bot Bounds (Top Half: z < 0)
    this.bot.x = Math.max(-COURT_WIDTH/2 + PLAYER_RADIUS, Math.min(COURT_WIDTH/2 - PLAYER_RADIUS, this.bot.x));
    this.bot.z = Math.max(-COURT_LENGTH/2 + PLAYER_RADIUS, Math.min(0 - PLAYER_RADIUS, this.bot.z));
    // Ball Integration
    this.balls.forEach(ball => {
        if (ball.state === 'held') {
            const holder = ball.owner === 'player' ? this.player : this.bot;
            // Position ball in front of holder
            const offsetZ = ball.owner === 'player' ? -0.8 : 0.8;
            ball.x = holder.x;
            ball.y = 1.0; // Held height
            ball.z = holder.z + offsetZ;
            ball.vx = 0; ball.vy = 0; ball.vz = 0;
        } else {
            // Gravity
            if (!ball.grounded) {
                ball.vy -= GRAVITY * dt;
            }
            // Move
            ball.x += ball.vx * dt;
            ball.y += ball.vy * dt;
            ball.z += ball.vz * dt;
            // Floor Collision
            if (ball.y <= BALL_RADIUS) {
                ball.y = BALL_RADIUS;
                ball.vy = -ball.vy * 0.6; // Bounce dampening
                ball.vx *= FRICTION;
                ball.vz *= FRICTION;
                if (Math.abs(ball.vy) < 1 && Math.abs(ball.vx) < 0.5 && Math.abs(ball.vz) < 0.5) {
                    ball.grounded = true;
                    ball.state = 'idle';
                    ball.owner = null; // Reset ownership on stop
                } else {
                    ball.grounded = false;
                }
            } else {
                ball.grounded = false;
            }
            // Wall Collisions
            if (ball.x > COURT_WIDTH/2 - BALL_RADIUS) {
                ball.x = COURT_WIDTH/2 - BALL_RADIUS;
                ball.vx = -ball.vx * 0.8;
            }
            if (ball.x < -COURT_WIDTH/2 + BALL_RADIUS) {
                ball.x = -COURT_WIDTH/2 + BALL_RADIUS;
                ball.vx = -ball.vx * 0.8;
            }
            if (ball.z > COURT_LENGTH/2 - BALL_RADIUS) {
                ball.z = COURT_LENGTH/2 - BALL_RADIUS;
                ball.vz = -ball.vz * 0.8;
            }
            if (ball.z < -COURT_LENGTH/2 + BALL_RADIUS) {
                ball.z = -COURT_LENGTH/2 + BALL_RADIUS;
                ball.vz = -ball.vz * 0.8;
            }
        }
    });
  }
  tryPickup(entity: Entity, type: 'player' | 'bot') {
    const pickupRange = 1.5;
    const ball = this.balls.find(b => 
        b.state === 'idle' && 
        Math.abs(b.x - entity.x) < pickupRange && 
        Math.abs(b.z - entity.z) < pickupRange
    );
    if (ball) {
        ball.state = 'held';
        ball.owner = type;
        ball.grounded = false;
        entity.holdingBallId = ball.id;
    }
  }
  throwBall(entity: Entity, type: 'player' | 'bot') {
    if (entity.holdingBallId === null) return;
    const ball = this.balls.find(b => b.id === entity.holdingBallId);
    if (!ball) return;
    // Throw direction
    let dirX = 0;
    let dirZ = 0;
    if (type === 'player') {
        // Aim at bot (simple auto-aim for MVP) or straight forward
        // For MVP: Throw straight forward with slight joystick influence
        dirZ = -1;
        dirX = gameInput.joystick.x * 0.5; 
    } else {
        // Bot throws at player
        const dx = this.player.x - this.bot.x;
        const dz = this.player.z - this.bot.z;
        const len = Math.sqrt(dx*dx + dz*dz);
        dirX = dx / len;
        dirZ = dz / len;
    }
    // Normalize
    const len = Math.sqrt(dirX*dirX + dirZ*dirZ);
    dirX /= len;
    dirZ /= len;
    ball.state = 'flying';
    ball.vx = dirX * THROW_FORCE;
    ball.vz = dirZ * THROW_FORCE;
    ball.vy = THROW_UP_FORCE;
    ball.grounded = false;
    entity.holdingBallId = null;
  }
  handleCollisions() {
    // Ball vs Player/Bot
    this.balls.forEach(ball => {
        if (ball.state === 'flying') {
            // Check Player Hit
            if (ball.owner !== 'player' && this.player.invulnerable <= 0) {
                if (this.checkSphereCapsule(ball, this.player)) {
                    this.onHit('player');
                    this.bounceBallOff(ball);
                }
            }
            // Check Bot Hit
            if (ball.owner !== 'bot' && this.bot.invulnerable <= 0) {
                if (this.checkSphereCapsule(ball, this.bot)) {
                    this.onHit('bot');
                    this.bounceBallOff(ball);
                }
            }
        }
    });
  }
  checkSphereCapsule(ball: Ball, entity: Entity): boolean {
    // Simple distance check for MVP (treating capsule as cylinder/sphere approx)
    const dx = ball.x - entity.x;
    const dz = ball.z - entity.z;
    const dist = Math.sqrt(dx*dx + dz*dz);
    // Height check
    const dy = Math.abs(ball.y - 1.0); // Assume entity center mass is at y=1.0
    return dist < (entity.radius + BALL_RADIUS) && dy < 1.0;
  }
  bounceBallOff(ball: Ball) {
    ball.vx = -ball.vx * 0.5;
    ball.vz = -ball.vz * 0.5;
    ball.vy = 5; // Pop up
    ball.owner = null; // Neutralize
  }
  onHit(victim: 'player' | 'bot') {
    // Register hit event for particles
    physicsState.events.push({
        type: 'hit',
        x: victim === 'player' ? this.player.x : this.bot.x,
        z: victim === 'player' ? this.player.z : this.bot.z
    });
    // Update Game Store
    if (victim === 'player') {
        useGameStore.getState().decrementPlayerLives();
        this.player.invulnerable = 1.5;
    } else {
        useGameStore.getState().decrementBotLives();
        this.bot.invulnerable = 1.5;
    }
    // Check for round end
    const { playerLives, botLives } = useGameStore.getState();
    if (playerLives <= 0) {
        useGameStore.getState().winRound('bot');
        this.resetPositions();
    } else if (botLives <= 0) {
        useGameStore.getState().winRound('player');
        this.resetPositions();
    }
  }
  syncState() {
    physicsState.player.x = this.player.x;
    physicsState.player.z = this.player.z;
    physicsState.player.isHit = this.player.invulnerable > 0;
    physicsState.bot.x = this.bot.x;
    physicsState.bot.z = this.bot.z;
    physicsState.bot.isHit = this.bot.invulnerable > 0;
    physicsState.balls = this.balls.map(b => ({
        id: b.id,
        x: b.x,
        y: b.y,
        z: b.z,
        state: b.state
    }));
  }
}
export const physicsEngine = new PhysicsEngine();