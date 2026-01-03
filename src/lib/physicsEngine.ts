import { gameInput, physicsState, useGameStore } from '@/store/useGameStore';
import { audioController } from '@/lib/audioController';
import { 
  COURT_WIDTH, 
  COURT_LENGTH, 
  PLAYER_RADIUS, 
  BALL_RADIUS,
  DODGE_COOLDOWN,
  DODGE_SPEED,
  DODGE_DURATION
} from '@/lib/constants';
// Constants
const PLAYER_SPEED = 8;
const BOT_SPEED = 5;
const FRICTION = 0.92;
const GRAVITY = 25;
const THROW_FORCE = 20;
const THROW_UP_FORCE = 6;
enum BotState {
  IDLE,
  SEEKING,
  ATTACKING,
  DODGING
}
interface Entity {
  x: number;
  z: number;
  vx: number;
  vz: number;
  radius: number;
  cooldown: number; // For dodge or throw
  holdingBallId: number | null;
  invulnerable: number;
  stunTimer: number; // Time remaining for stun (immobilized)
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
  isLethal: boolean;
}
class PhysicsEngine {
  player: Entity;
  bot: Entity;
  balls: Ball[];
  botState: BotState = BotState.IDLE;
  botTargetBallId: number | null = null;
  botActionTimer: number = 0;
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
      invulnerable: 0,
      stunTimer: 0
    };
  }
  resetBalls() {
    // Spawn balls at specific locations requiring pickup
    this.balls = Array.from({ length: 5 }).map((_, i) => {
        let x = 0, z = 0;
        if (i === 0) { x = 0; z = 4; } // Near Player (Player at 6)
        else if (i === 1) { x = 0; z = -4; } // Near Bot (Bot at -6)
        else {
            // Distribute remaining 3 on center line
            // i=2 -> -2, i=3 -> 0, i=4 -> 2
            x = (i - 3) * 2;
            z = 0;
        }
        return {
            id: i,
            x,
            y: BALL_RADIUS,
            z,
            vx: 0, vy: 0, vz: 0,
            state: 'idle',
            owner: null,
            grounded: true,
            isLethal: false
        };
    });
  }
  resetPositions() {
    this.player = this.createEntity(0, 6);
    this.bot = this.createEntity(0, -6);
    this.botState = BotState.IDLE;
    this.botTargetBallId = null;
    this.botActionTimer = 0;
    this.resetBalls();
    physicsState.events = []; // Clear events
    this.syncState();
  }
  update(dt: number) {
    // Pause physics during countdown
    if (useGameStore.getState().countdown > 0) return;
    // Decrement stun timers
    if (this.player.stunTimer > 0) this.player.stunTimer -= dt;
    if (this.bot.stunTimer > 0) this.bot.stunTimer -= dt;
    // 1. Player Movement
    this.handlePlayerInput(dt);
    // 2. Bot Logic (State Machine)
    this.handleBotLogic(dt);
    // 3. Physics Integration
    this.integratePhysics(dt);
    // 4. Collisions
    this.handleCollisions();
    // 5. Sync to Shared State
    this.syncState();
  }
  handlePlayerInput(dt: number) {
    // STUN CHECK: Block all input if stunned
    if (this.player.stunTimer > 0) {
        this.player.vx = 0;
        this.player.vz = 0;
        // Clear input flags so actions don't queue up
        gameInput.isThrowing = false;
        gameInput.isDodging = false;
        return;
    }
    const { joystick, isThrowing, isDodging } = gameInput;
    // Cooldown management
    if (this.player.cooldown > 0) this.player.cooldown -= dt;
    if (this.player.invulnerable > 0) this.player.invulnerable -= dt;
    // Movement
    if (this.player.cooldown <= (DODGE_COOLDOWN - DODGE_DURATION)) { // Can move if not mid-dodge
        this.player.vx = joystick.x * PLAYER_SPEED;
        this.player.vz = joystick.y * PLAYER_SPEED;
    }
    // Dodge
    if (isDodging && this.player.cooldown <= 0) {
        const dodgeDirX = joystick.x || 0;
        const dodgeDirZ = joystick.y || 0;
        // Only dodge if moving or default backward
        let dx = dodgeDirX;
        let dz = dodgeDirZ;
        if (Math.abs(dx) < 0.1 && Math.abs(dz) < 0.1) {
            dz = 1; // Dodge back
        }
        const len = Math.sqrt(dx*dx + dz*dz);
        this.player.vx = (dx / len) * DODGE_SPEED;
        this.player.vz = (dz / len) * DODGE_SPEED;
        this.player.cooldown = DODGE_COOLDOWN;
        this.player.invulnerable = 0.35; // Invulnerability window
        gameInput.isDodging = false;
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
    // STUN CHECK: Block AI if stunned
    if (this.bot.stunTimer > 0) {
        this.bot.vx = 0;
        this.bot.vz = 0;
        return;
    }
    // Cooldowns
    if (this.bot.cooldown > 0) this.bot.cooldown -= dt;
    if (this.bot.invulnerable > 0) this.bot.invulnerable -= dt;
    // 1. Check for Dodge Opportunity (Highest Priority)
    // Look for incoming LETHAL balls
    const incomingBall = this.balls.find(b => 
        b.state === 'flying' && 
        b.owner === 'player' && 
        b.isLethal && // Only dodge lethal balls
        b.z < 0 && // In bot's half
        b.vz < 0 && // Moving towards bot
        Math.abs(b.x - this.bot.x) < 2.0 && // Close in X
        Math.abs(b.z - this.bot.z) < 4.0 // Close in Z
    );
    // TUNING: Reduced dodge chance from 0.05 to 0.01 (1% per frame)
    if (incomingBall && this.bot.cooldown <= 0 && Math.random() < 0.01) {
        this.botState = BotState.DODGING;
        this.botActionTimer = 0.3;
        // Dodge perpendicular to ball
        const dodgeDir = incomingBall.x > this.bot.x ? -1 : 1;
        this.bot.vx = dodgeDir * DODGE_SPEED;
        this.bot.vz = 0;
        this.bot.cooldown = DODGE_COOLDOWN;
        this.bot.invulnerable = 0.35;
    }
    // State Machine
    switch (this.botState) {
        case BotState.DODGING: {
            this.botActionTimer -= dt;
            if (this.botActionTimer <= 0) {
                this.botState = BotState.IDLE;
                this.bot.vx = 0;
                this.bot.vz = 0;
            }
            break;
        }
        case BotState.IDLE: {
            if (this.bot.holdingBallId !== null) {
                this.botState = BotState.ATTACKING;
                // TUNING: Increased aim time to 1.0-2.5s (was 0.5-1.5s)
                this.botActionTimer = 1.0 + Math.random() * 1.5;
            } else {
                this.botState = BotState.SEEKING;
            }
            break;
        }
        case BotState.SEEKING: {
            if (this.bot.holdingBallId !== null) {
                this.botState = BotState.ATTACKING;
                // TUNING: Increased aim time
                this.botActionTimer = 1.0 + Math.random() * 1.5;
                break;
            }
            // Find nearest idle or safe ball
            let nearestDist = Infinity;
            let targetBall: Ball | null = null;
            this.balls.forEach(b => {
                // Can seek idle balls OR flying non-lethal balls
                const isPickable = b.state === 'idle' || (b.state === 'flying' && !b.isLethal);
                if (isPickable && b.z < 2) { // Only seek balls in own half or near center
                    const dist = Math.sqrt(Math.pow(b.x - this.bot.x, 2) + Math.pow(b.z - this.bot.z, 2));
                    if (dist < nearestDist) {
                        nearestDist = dist;
                        targetBall = b;
                    }
                }
            });
            if (targetBall) {
                const dx = targetBall.x - this.bot.x;
                const dz = targetBall.z - this.bot.z;
                const len = Math.sqrt(dx*dx + dz*dz);
                if (len > 0.1) {
                    this.bot.vx = (dx / len) * BOT_SPEED;
                    this.bot.vz = (dz / len) * BOT_SPEED;
                }
                this.tryPickup(this.bot, 'bot');
            } else {
                // No balls? Move to center
                const dx = 0 - this.bot.x;
                const dz = -4 - this.bot.z;
                const len = Math.sqrt(dx*dx + dz*dz);
                if (len > 0.1) {
                    this.bot.vx = (dx / len) * BOT_SPEED;
                    this.bot.vz = (dz / len) * BOT_SPEED;
                }
            }
            break;
        }
        case BotState.ATTACKING: {
            // Move towards throwing position (e.g., z = -3)
            const targetZ = -3;
            const dz = targetZ - this.bot.z;
            if (Math.abs(dz) > 0.5) {
                this.bot.vz = Math.sign(dz) * BOT_SPEED;
                // Strafe a bit
                this.bot.vx = Math.sin(Date.now() / 500) * 2;
            } else {
                this.bot.vz = 0;
                this.bot.vx = 0;
            }
            this.botActionTimer -= dt;
            if (this.botActionTimer <= 0) {
                this.throwBall(this.bot, 'bot');
                this.botState = BotState.IDLE;
            }
            break;
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
            const offsetZ = ball.owner === 'player' ? -0.8 : 0.8;
            ball.x = holder.x;
            ball.y = 1.0;
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
                // CRITICAL: Ball loses lethality immediately upon touching the floor
                ball.isLethal = false;
                if (Math.abs(ball.vy) < 2 && Math.abs(ball.vx) < 0.5 && Math.abs(ball.vz) < 0.5) {
                    ball.grounded = true;
                    ball.state = 'idle';
                    ball.owner = null;
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
        // Can pick up if idle OR (flying but not lethal)
        (b.state === 'idle' || (b.state === 'flying' && !b.isLethal)) &&
        Math.abs(b.x - entity.x) < pickupRange &&
        Math.abs(b.z - entity.z) < pickupRange
    );
    if (ball) {
        ball.state = 'held';
        ball.owner = type;
        ball.grounded = false;
        ball.isLethal = false; // Ensure it's not lethal when held
        entity.holdingBallId = ball.id;
        // Event & Audio
        this.addEvent('pickup', entity.x, entity.z);
        audioController.play('pickup');
    }
  }
  throwBall(entity: Entity, type: 'player' | 'bot') {
    if (entity.holdingBallId === null) return;
    const ball = this.balls.find(b => b.id === entity.holdingBallId);
    if (!ball) return;
    let dirX = 0;
    let dirZ = 0;
    if (type === 'player') {
        // Auto-aim at bot with joystick influence
        const dx = this.bot.x - this.player.x;
        const dz = this.bot.z - this.player.z;
        const len = Math.sqrt(dx*dx + dz*dz);
        // Base aim
        dirX = dx / len;
        dirZ = dz / len;
        // Joystick influence (bend the throw)
        dirX += gameInput.joystick.x * 0.5;
    } else {
        // Bot throws at player with inaccuracy
        const dx = this.player.x - this.bot.x;
        const dz = this.player.z - this.bot.z;
        const len = Math.sqrt(dx*dx + dz*dz);
        dirX = dx / len;
        dirZ = dz / len;
        // TUNING: Increased inaccuracy from 0.2 to 0.5
        dirX += (Math.random() - 0.5) * 0.5;
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
    ball.isLethal = true; // Ball becomes lethal when thrown
    entity.holdingBallId = null;
    this.addEvent('throw', entity.x, entity.z);
    audioController.play('throw');
  }
  handleCollisions() {
    this.balls.forEach(ball => {
        if (ball.state === 'flying') {
            // Check Player Hit
            // Only count hit if ball is lethal
            if (ball.owner !== 'player' && this.player.invulnerable <= 0 && ball.isLethal) {
                if (this.checkSphereCapsule(ball, this.player)) {
                    this.onHit('player');
                    this.bounceBallOff(ball);
                }
            }
            // Check Bot Hit
            // Only count hit if ball is lethal
            if (ball.owner !== 'bot' && this.bot.invulnerable <= 0 && ball.isLethal) {
                if (this.checkSphereCapsule(ball, this.bot)) {
                    this.onHit('bot');
                    this.bounceBallOff(ball);
                }
            }
        }
    });
  }
  checkSphereCapsule(ball: Ball, entity: Entity): boolean {
    const dx = ball.x - entity.x;
    const dz = ball.z - entity.z;
    const dist = Math.sqrt(dx*dx + dz*dz);
    const dy = Math.abs(ball.y - 1.0);
    // More generous hit detection
    return dist < (entity.radius + BALL_RADIUS + 0.2) && dy < 1.2;
  }
  bounceBallOff(ball: Ball) {
    ball.vx = -ball.vx * 0.5;
    ball.vz = -ball.vz * 0.5;
    ball.vy = 8; // High pop up
    ball.owner = null;
    ball.isLethal = false; // Ball loses lethality after hitting someone
  }
  onHit(victim: 'player' | 'bot') {
    const x = victim === 'player' ? this.player.x : this.bot.x;
    const z = victim === 'player' ? this.player.z : this.bot.z;
    // Visuals & Audio
    useGameStore.getState().addShake(0.8);
    audioController.play('hit');
    this.addEvent('hit', x, z, victim === 'player' ? "OOF!" : "BONK!");
    // Check for Killing Blow
    const currentLives = victim === 'player' ? useGameStore.getState().playerLives : useGameStore.getState().botLives;
    const isKillingBlow = currentLives <= 1;
    // Logic
    if (victim === 'player') {
        useGameStore.getState().decrementPlayerLives();
        // STUN MECHANIC:
        // 1.5s immobilized
        // 2.0s invulnerable (gives 0.5s grace after standing up)
        this.player.stunTimer = 1.5;
        this.player.invulnerable = 2.0;
    } else {
        useGameStore.getState().decrementBotLives();
        this.bot.stunTimer = 1.5;
        this.bot.invulnerable = 2.0;
    }
    if (isKillingBlow) {
        // Cinematic Death: Super slow motion for 3.5s
        useGameStore.getState().setTimeScale(0.1);
        setTimeout(() => {
            useGameStore.getState().setTimeScale(1.0);
            // Round End Check
            const { playerLives, botLives } = useGameStore.getState();
            if (playerLives <= 0) {
                useGameStore.getState().winRound('bot');
                audioController.play('lose');
                this.resetPositions();
            } else if (botLives <= 0) {
                useGameStore.getState().winRound('player');
                audioController.play('win');
                this.resetPositions();
            }
        }, 3500);
    } else {
        // Standard Hit: Brief slow motion
        useGameStore.getState().setTimeScale(0.2);
        setTimeout(() => {
            useGameStore.getState().setTimeScale(1.0);
        }, 500);
    }
  }
  addEvent(type: 'hit' | 'catch' | 'throw' | 'pickup', x: number, z: number, text?: string) {
    physicsState.events.push({
        id: Math.random(),
        type,
        x,
        z,
        text,
        time: Date.now()
    });
    // Keep array small
    if (physicsState.events.length > 20) {
        physicsState.events.shift();
    }
  }
  syncState() {
    physicsState.player.x = this.player.x;
    physicsState.player.z = this.player.z;
    physicsState.player.cooldown = this.player.cooldown; // Sync cooldown for UI
    // Visual isHit logic:
    // Character stays on floor (isHit=true) while stunTimer > 0.3
    // Character stands up (isHit=false) during last 0.3s of stun
    physicsState.player.isHit = this.player.stunTimer > 0.3;
    physicsState.bot.x = this.bot.x;
    physicsState.bot.z = this.bot.z;
    physicsState.bot.isHit = this.bot.stunTimer > 0.3;
    physicsState.balls = this.balls.map(b => ({
        id: b.id,
        x: b.x,
        y: b.y,
        z: b.z,
        state: b.state,
        owner: b.owner,
        isLethal: b.isLethal
    }));
  }
}
export const physicsEngine = new PhysicsEngine();