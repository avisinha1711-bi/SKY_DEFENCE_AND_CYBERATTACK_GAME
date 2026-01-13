const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const radarCanvas = document.getElementById('radarCanvas');
const radarCtx = radarCanvas.getContext('2d');
const cyberButton = document.getElementById('cyberButton');
const notification = document.getElementById('notification');
const timeDisplay = document.getElementById('timeDisplay');
const heatDisplay = document.getElementById('heatDisplay');
const heatFill = document.getElementById('heatFill');
const scoreDisplay = document.getElementById('scoreValue');
const spawnTimer = document.getElementById('timerValue');
const enemyHealthValue = document.getElementById('enemyHealthValue');
const enemyHealthFill = document.getElementById('enemyHealthFill');
const enemyStatus = document.getElementById('enemyStatus');

// Optimized canvas size for medium/low spec laptops
canvas.width = 1000;
canvas.height = 600;
radarCanvas.width = 130;
radarCanvas.height = 130;

let gameRunning = false;
let gamePaused = false;
let spacePressed = false;
let mouseX = canvas.width / 2;
let mouseY = canvas.height / 2;

// UI Elements
const healthValue = document.getElementById('healthValue');
const healthFill = document.getElementById('healthFill');
const healthBar = document.getElementById('healthBar');
const planesDestroyedEl = document.getElementById('planesDestroyed');
const cyberStatusEl = document.getElementById('cyberStatus');
const gameOverMessage = document.getElementById('gameOverMessage');

// Game State - optimized for performance
const gameState = {
    defense: { 
        x: 150, 
        y: canvas.height - 120, 
        angle: 0, 
        health: 10000,
        maxHealth: 10000,
        heat: 0,
        maxHeat: 100,
        coolingRate: 2,
        overheatThreshold: 80,
        fireRate: 180,
        damage: 35
    },
    planes: [],
    missiles: [],
    enemyMissiles: [],
    explosions: [],
    cyberExplosions: [],
    gameTime: 0,
    score: 0,
    planesDestroyed: 0,
    fireTimer: 0,
    cyberAttackCooldown: 0,
    cyberAttackInterval: 300,
    cyberAttacksUsed: 0,
    dayNightCycle: 0.5,
    buildings: [],
    spawnTimer: 0,
    spawnInterval: 300, // Changed from 600 (10 seconds) to 300 (5 seconds)
    wave: 1,
    currentPlane: null,
    planeActive: false
};

// Performance optimized constants
const PHYSICS = {
    GRAVITY: 0.098,
    BULLET_SPEED: 12,
    MISSILE_SPEED: 5
};

// Optimized Elite Fighter
const ELITE_FIGHTER = {
    maxHealth: 800,
    size: 35,
    speed: 3.0,
    agility: 0.035,
    fireRate: 120,
    missileDamage: 20,
    evasionSkill: 0.85,
    bodyColor: '#ff4444',
    trailColor: 'rgba(255, 100, 100, 0.5)',
    scoreValue: 400,
    cyberDamage: 250,
    minHealthAfterCyber: 150,
    engagementRange: 400,
    retreatThreshold: 200,
    aggressiveMode: true
};

// Initialize game
function initGame() {
    gameState.defense.health = 10000;
    gameState.defense.heat = 0;
    gameState.score = 0;
    gameState.planesDestroyed = 0;
    gameState.gameTime = 0;
    gameState.spawnTimer = gameState.spawnInterval;
    gameState.wave = 1;
    gameState.currentPlane = null;
    gameState.planeActive = false;
    gameState.planes = [];
    gameState.missiles = [];
    gameState.enemyMissiles = [];
    gameState.explosions = [];
    gameState.cyberExplosions = [];
    
    updateHealthDisplay();
    updateStatsDisplay();
    updateScoreDisplay();
    updateEnemyDisplay();
    updateSpawnTimer();
    initBuildings();
    showNotification('SYSTEMS ONLINE - ENGAGE COMBAT', 'cyber');
}

// Initialize buildings - optimized
function initBuildings() {
    gameState.buildings = [];
    
    for (let layer = 0; layer < 2; layer++) {
        const buildingCount = 8 - layer * 3;
        for (let i = 0; i < buildingCount; i++) {
            const x = (i * (80 - layer * 20)) + Math.random() * 40;
            const width = 15 + Math.random() * (30 - layer * 10);
            const height = 50 + Math.random() * (120 - layer * 40);
            const grayValue = 25 + layer * 20 + Math.random() * 25;
            
            gameState.buildings.push({
                x: x,
                width: width,
                height: height,
                color: `rgb(${grayValue}, ${grayValue}, ${grayValue})`,
                layer: layer,
                parallax: 0.7 + layer * 0.15
            });
        }
    }
}

// Draw buildings - optimized
function drawBuildings() {
    const sortedBuildings = [...gameState.buildings].sort((a, b) => a.layer - b.layer);
    
    sortedBuildings.forEach(building => {
        const baseY = canvas.height - 100;
        const buildingY = baseY - building.height;
        const parallaxX = building.x * building.parallax;
        
        const time = gameState.dayNightCycle;
        let brightness = 0.25;
        if (time < 0.25 || time > 0.75) brightness = 0.12;
        else if (time < 0.5) brightness = 0.35;
        else brightness = 0.2;
        
        ctx.fillStyle = building.color.replace('rgb', 'rgba').replace(')', `, ${brightness})`);
        ctx.fillRect(parallaxX, buildingY, building.width * building.parallax, building.height);
    });
}

// UI Functions
function showNotification(text, type = '') {
    notification.textContent = text;
    notification.className = 'notification ' + type;
    notification.classList.add('show');
    
    setTimeout(() => {
        notification.classList.remove('show');
    }, 2000);
}

function updateHealthDisplay() {
    const healthPercent = (gameState.defense.health / gameState.defense.maxHealth) * 100;
    healthValue.textContent = Math.floor(gameState.defense.health);
    healthFill.style.width = healthPercent + '%';
    
    if (gameState.defense.health <= 2000) {
        healthBar.classList.add('danger');
        if (Math.random() > 0.95) {
            showNotification('CRITICAL!', 'warning');
        }
    } else {
        healthBar.classList.remove('danger');
    }
}

function updateHeatDisplay() {
    const heatPercent = (gameState.defense.heat / gameState.defense.maxHeat) * 100;
    heatFill.style.width = heatPercent + '%';
    
    if (gameState.defense.heat > gameState.defense.overheatThreshold) {
        heatFill.style.background = '#ff4444';
    } else {
        heatFill.style.background = '#ff8a8a';
    }
}

function updateEnemyDisplay() {
    if (gameState.currentPlane) {
        const healthPercent = (gameState.currentPlane.health / ELITE_FIGHTER.maxHealth) * 100;
        enemyHealthValue.textContent = Math.floor(gameState.currentPlane.health);
        enemyHealthFill.style.width = healthPercent + '%';
        
        if (gameState.currentPlane.isCyberAttacked) {
            enemyStatus.textContent = 'HACKED';
            enemyStatus.style.color = '#8a8aff';
        } else if (gameState.currentPlane.alertLevel >= 2) {
            enemyStatus.textContent = 'EVADING';
            enemyStatus.style.color = '#ffff44';
        } else if (gameState.currentPlane.alertLevel === 1) {
            enemyStatus.textContent = 'ATTACKING';
            enemyStatus.style.color = '#ff4444';
        } else {
            enemyStatus.textContent = 'APPROACHING';
            enemyStatus.style.color = '#ff8888';
        }
    } else {
        enemyHealthValue.textContent = '-';
        enemyHealthFill.style.width = '0%';
        enemyStatus.textContent = 'AWAITING';
        enemyStatus.style.color = '#888';
    }
}

function updateSpawnTimer() {
    const seconds = Math.ceil(gameState.spawnTimer / 60);
    spawnTimer.textContent = seconds + 's';
    
    if (seconds <= 1) {
        spawnTimer.style.color = '#ff4444';
    } else if (seconds <= 3) {
        spawnTimer.style.color = '#ffff44';
    } else {
        spawnTimer.style.color = '#8a8aff';
    }
}

function updateScoreDisplay() {
    scoreDisplay.textContent = gameState.score;
}

function updateStatsDisplay() {
    planesDestroyedEl.textContent = gameState.planesDestroyed;
    
    if (gameState.cyberAttackCooldown > 0) {
        const cooldownSecs = Math.ceil(gameState.cyberAttackCooldown / 60);
        cyberStatusEl.textContent = cooldownSecs + 's';
        cyberStatusEl.style.color = '#ff8a8a';
    } else {
        cyberStatusEl.textContent = 'READY';
        cyberStatusEl.style.color = '#8a8aff';
    }
    
    const time = gameState.dayNightCycle;
    if (time < 0.25) timeDisplay.textContent = 'DAWN';
    else if (time < 0.5) timeDisplay.textContent = 'DAY';
    else if (time < 0.75) timeDisplay.textContent = 'DUSK';
    else timeDisplay.textContent = 'NIGHT';
    
    if (gameState.defense.heat > 0) {
        gameState.defense.heat = Math.max(0, gameState.defense.heat - gameState.defense.coolingRate);
        updateHeatDisplay();
    }
}

class EliteFighter {
    constructor() {
        this.health = ELITE_FIGHTER.maxHealth;
        this.x = canvas.width + 150;
        this.y = canvas.height / 2;
        this.vx = -ELITE_FIGHTER.speed;
        this.vy = 0;
        this.rotation = 0;
        this.pitch = 0;
        this.roll = 0;
        this.firingTimer = 0;
        this.evasionTimer = 0;
        this.isCyberAttacked = false;
        this.cyberDamageTimer = 0;
        this.alertLevel = 0;
        this.evading = false;
        this.evasionPattern = 0;
        this.attackCooldown = 0;
        this.missilesFired = 0;
        this.maxMissiles = 2;
        this.trail = [];
        this.trailMax = 15;
        this.entering = true;
        this.entranceTimer = 0;
        this.combatMode = 'approach'; // approach, attack, evade, retreat
        this.attackRange = ELITE_FIGHTER.engagementRange;
        this.lastAttackTime = 0;
        this.aggressive = ELITE_FIGHTER.aggressiveMode;
    }
    
    update() {
        if (this.entering) {
            // Quick entrance
            this.entranceTimer++;
            this.x -= 6;
            this.y = canvas.height / 2 + Math.sin(this.entranceTimer * 0.05) * 80;
            
            if (this.entranceTimer > 40) {
                this.entering = false;
                showNotification('ENEMY ENGAGED!', 'warning');
            }
            return;
        }
        
        if (this.isCyberAttacked) {
            // Cyberattack effects - but fighter tries to save itself
            this.cyberDamageTimer++;
            this.vx = -0.5;
            this.vy += PHYSICS.GRAVITY * 0.3;
            this.rotation += 0.1;
            
            // Try to recover and retreat
            if (this.cyberDamageTimer > 90) {
                this.isCyberAttacked = false;
                this.cyberDamageTimer = 0;
                this.combatMode = 'retreat';
                showNotification('ENEMY RECOVERING', 'warning');
            }
            
            // Update position during cyberattack
            this.x += this.vx;
            this.y += this.vy;
            this.y = Math.max(50, Math.min(canvas.height - 150, this.y));
            
        } else {
            // Calculate distance to gun for combat decisions
            const distanceToGun = Math.sqrt(
                Math.pow(gameState.defense.x - this.x, 2) + 
                Math.pow(gameState.defense.y - this.y, 2)
            );
            
            // Determine combat mode based on health and distance
            if (this.health < ELITE_FIGHTER.retreatThreshold) {
                this.combatMode = 'retreat';
            } else if (distanceToGun < 250 && gameState.missiles.length > 2) {
                this.combatMode = 'evade';
            } else if (distanceToGun < this.attackRange) {
                this.combatMode = 'attack';
            } else {
                this.combatMode = 'approach';
            }
            
            // Execute combat mode
            switch(this.combatMode) {
                case 'approach':
                    this.alertLevel = 0;
                    this.y = canvas.height / 2 + Math.sin(gameState.gameTime * 0.004) * 100;
                    this.vx = -ELITE_FIGHTER.speed * 0.8;
                    break;
                    
                case 'attack':
                    this.alertLevel = 1;
                    // Smart attacking - stays at optimal range
                    const optimalY = gameState.defense.y - 100;
                    const yError = optimalY - this.y;
                    this.vy = yError * 0.02;
                    
                    // Maintain attack distance
                    if (distanceToGun < 200) {
                        this.vx = -ELITE_FIGHTER.speed * 0.5; // Slow down when close
                    } else if (distanceToGun > 350) {
                        this.vx = -ELITE_FIGHTER.speed * 1.2; // Speed up to get closer
                    } else {
                        this.vx = -ELITE_FIGHTER.speed; // Optimal speed
                    }
                    
                    // Attack logic
                    this.firingTimer++;
                    if (this.firingTimer > ELITE_FIGHTER.fireRate && this.missilesFired < this.maxMissiles) {
                        if (Math.random() > 0.5) {
                            this.fireMissile();
                        }
                        this.firingTimer = 0;
                    }
                    break;
                    
                case 'evade':
                    this.alertLevel = 2;
                    this.evading = true;
                    this.evasionTimer++;
                    
                    // Simple but effective evasion
                    this.vy = Math.sin(this.evasionTimer * 0.08) * 3;
                    this.vx = -ELITE_FIGHTER.speed * (0.7 + Math.abs(Math.sin(this.evasionTimer * 0.04)) * 0.6);
                    
                    if (this.evasionTimer > 60) {
                        this.evading = false;
                        this.evasionTimer = 0;
                    }
                    break;
                    
                case 'retreat':
                    this.alertLevel = 1;
                    // Try to retreat and save itself
                    if (this.health < 100) {
                        this.vx = -ELITE_FIGHTER.speed * 1.5; // Fast retreat when critical
                        this.y = Math.max(100, this.y + Math.sin(gameState.gameTime * 0.1) * 2);
                    } else {
                        this.vx = -ELITE_FIGHTER.speed * 0.6; // Slow retreat
                        this.y = canvas.height / 2 + Math.sin(gameState.gameTime * 0.03) * 120;
                    }
                    break;
            }
            
            // Apply physics
            this.x += this.vx;
            this.y += this.vy;
            
            // Boundary checks
            this.y = Math.max(40, Math.min(canvas.height - 160, this.y));
            
            // Update attack cooldown
            if (this.attackCooldown > 0) {
                this.attackCooldown--;
            }
        }
        
        // Update trail (optimized)
        this.trail.push({x: this.x, y: this.y});
        if (this.trail.length > this.trailMax) {
            this.trail.shift();
        }
    }
    
    fireMissile() {
        if (this.missilesFired >= this.maxMissiles) return;
        
        // Simple but effective targeting
        const dx = gameState.defense.x - this.x;
        const dy = gameState.defense.y - this.y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        
        if (dist > 0) {
            gameState.enemyMissiles.push({
                x: this.x,
                y: this.y,
                vx: (dx / dist) * PHYSICS.MISSILE_SPEED,
                vy: (dy / dist) * PHYSICS.MISSILE_SPEED,
                size: 8,
                life: 350,
                damage: ELITE_FIGHTER.missileDamage,
                trail: [],
                trailMax: 12,
                homing: false
            });
            
            this.missilesFired++;
            showNotification('MISSILE!', 'warning');
            
            // Small recoil
            this.vx += 0.2;
        }
    }
    
    draw() {
        // Draw trail
        ctx.save();
        this.trail.forEach((point, i) => {
            const alpha = i / this.trail.length;
            const size = ELITE_FIGHTER.size * 0.3 * alpha;
            
            if (this.isCyberAttacked) {
                ctx.fillStyle = `rgba(100, 200, 255, ${alpha * 0.3})`;
            } else if (this.alertLevel >= 2) {
                ctx.fillStyle = `rgba(255, 150, 50, ${alpha * 0.4})`;
            } else {
                ctx.fillStyle = ELITE_FIGHTER.trailColor.replace(')', `, ${alpha * 0.5})`);
            }
            
            ctx.beginPath();
            ctx.arc(point.x, point.y, size, 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.restore();
        
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation + this.roll);
        
        // Draw optimized fighter
        ctx.fillStyle = this.isCyberAttacked ? '#8a8aff' : ELITE_FIGHTER.bodyColor;
        
        // Main body
        ctx.beginPath();
        ctx.moveTo(ELITE_FIGHTER.size, 0);
        ctx.lineTo(-ELITE_FIGHTER.size * 0.6, ELITE_FIGHTER.size * 0.5);
        ctx.lineTo(-ELITE_FIGHTER.size, 0);
        ctx.lineTo(-ELITE_FIGHTER.size * 0.6, -ELITE_FIGHTER.size * 0.5);
        ctx.closePath();
        ctx.fill();
        
        // Wings
        ctx.fillStyle = this.isCyberAttacked ? '#a0a0ff' : '#ff6666';
        ctx.fillRect(-ELITE_FIGHTER.size * 0.5, -ELITE_FIGHTER.size * 0.7, ELITE_FIGHTER.size, ELITE_FIGHTER.size * 0.15);
        ctx.fillRect(-ELITE_FIGHTER.size * 0.5, ELITE_FIGHTER.size * 0.55, ELITE_FIGHTER.size, ELITE_FIGHTER.size * 0.15);
        
        // Cockpit
        ctx.fillStyle = this.isCyberAttacked ? '#c0c0ff' : '#ff8888';
        ctx.beginPath();
        ctx.arc(ELITE_FIGHTER.size * 0.5, 0, ELITE_FIGHTER.size * 0.3, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
        
        // Health bar
        const healthPercent = this.health / ELITE_FIGHTER.maxHealth;
        ctx.fillStyle = this.isCyberAttacked ? '#8a8aff' : '#ff4444';
        ctx.fillRect(this.x - 30, this.y - ELITE_FIGHTER.size - 15, 60, 4);
        ctx.fillRect(this.x - 30, this.y - ELITE_FIGHTER.size - 15, healthPercent * 60, 4);
    }
}

class Missile {
    constructor(fromX, fromY, targetX, targetY) {
        this.x = fromX;
        this.y = fromY;
        const dx = targetX - fromX;
        const dy = targetY - fromY;
        const dist = Math.sqrt(dx*dx + dy*dy);
        this.vx = (dx / dist) * PHYSICS.BULLET_SPEED;
        this.vy = (dy / dist) * PHYSICS.BULLET_SPEED;
        this.size = 5;
        this.life = 200;
        this.trail = [];
        this.trailMax = 10;
        this.gravityEffect = 0.02;
    }
    
    update() {
        this.vy += this.gravityEffect;
        this.x += this.vx;
        this.y += this.vy;
        this.life--;
        
        this.vx *= 0.999;
        this.vy *= 0.999;
        
        this.trail.push({x: this.x, y: this.y});
        if (this.trail.length > this.trailMax) {
            this.trail.shift();
        }
    }
    
    draw() {
        // Draw trail
        for (let i = 0; i < this.trail.length; i++) {
            const alpha = i / this.trail.length;
            ctx.fillStyle = `rgba(138, 138, 255, ${alpha * 0.6})`;
            ctx.beginPath();
            ctx.arc(this.trail[i].x, this.trail[i].y, this.size * alpha * 0.5, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Draw bullet
        ctx.fillStyle = '#8a8aff';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
    }
}

class Explosion {
    constructor(x, y, size = 25, isExplosion = false) {
        this.x = x;
        this.y = y;
        this.maxSize = size;
        this.currentSize = 0;
        this.life = 20;
        this.maxLife = 20;
        this.isExplosion = isExplosion;
        this.particles = [];
        this.initParticles();
    }

    initParticles() {
        const particleCount = this.isExplosion ? 20 : 10;
        for (let i = 0; i < particleCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 1 + Math.random() * 4;
            this.particles.push({
                x: this.x,
                y: this.y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 15 + Math.random() * 10,
                size: 1 + Math.random() * 3
            });
        }
    }

    update() {
        this.life--;
        this.currentSize = this.maxSize * (1 - Math.abs(this.life - this.maxLife / 2) / (this.maxLife / 2));
        
        this.particles.forEach(p => {
            p.x += p.vx;
            p.y += p.vy;
            p.life--;
            p.size *= 0.95;
        });
        
        this.particles = this.particles.filter(p => p.life > 0);
    }

    draw() {
        const alpha = this.life / this.maxLife;
        
        if (this.isExplosion) {
            ctx.fillStyle = `rgba(255, 150, 50, ${alpha * 0.6})`;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.currentSize, 0, Math.PI * 2);
            ctx.fill();
        } else {
            ctx.fillStyle = `rgba(100, 200, 255, ${alpha * 0.5})`;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.currentSize, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Draw fewer particles for performance
        this.particles.forEach(p => {
            const particleAlpha = p.life / 25;
            ctx.fillStyle = this.isExplosion ? 
                `rgba(255, 100, 0, ${particleAlpha})` : 
                `rgba(100, 200, 255, ${particleAlpha})`;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
        });
    }
}

function spawnEliteFighter() {
    if (!gameState.currentPlane && gameState.spawnTimer <= 0) {
        gameState.currentPlane = new EliteFighter();
        gameState.planes = [gameState.currentPlane];
        gameState.planeActive = true;
        gameState.wave++;
        gameState.spawnTimer = gameState.spawnInterval;
        showNotification(`WAVE ${gameState.wave}`, 'warning');
    }
}

function drawDefense() {
    ctx.save();
    ctx.translate(gameState.defense.x, gameState.defense.y);
    
    // Base
    ctx.fillStyle = '#333';
    ctx.fillRect(-25, 0, 50, 20);
    
    // Turret body
    const heatFactor = gameState.defense.heat / gameState.defense.maxHeat;
    const gradient = ctx.createLinearGradient(-20, -20, 20, 20);
    gradient.addColorStop(0, '#8a8aff');
    gradient.addColorStop(1, '#222');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(0, -10, 20, 0, Math.PI * 2);
    ctx.fill();
    
    // Turret barrel
    ctx.rotate(gameState.defense.angle);
    ctx.fillStyle = '#555';
    ctx.fillRect(0, -4, 50, 8);
    
    // Barrel tip
    ctx.fillStyle = '#666';
    ctx.fillRect(48, -6, 8, 12);
    
    // Muzzle flash
    if (spacePressed && gameState.fireTimer < 2) {
        ctx.fillStyle = `rgba(255, 200, 100, 0.7)`;
        ctx.fillRect(55, -8, 15, 16);
    }
    
    ctx.restore();
}

function drawGround() {
    const groundHeight = 100;
    
    // Ground base
    ctx.fillStyle = '#111';
    ctx.fillRect(0, canvas.height - groundHeight, canvas.width, groundHeight);
    
    // Ground texture
    ctx.fillStyle = '#1a1a1a';
    for (let i = 0; i < canvas.width; i += 40) {
        ctx.fillRect(i, canvas.height - groundHeight, 1, 10);
    }
    
    // Platform
    ctx.fillStyle = '#222';
    ctx.fillRect(100, canvas.height - groundHeight + 20, 100, 15);
}

function drawSky() {
    gameState.dayNightCycle = (gameState.dayNightCycle + 0.00003) % 1;
    const time = gameState.dayNightCycle;
    
    let skyColor1, skyColor2;
    
    if (time < 0.25) {
        const dawnFactor = time * 4;
        skyColor1 = `rgb(${20 + 100 * dawnFactor}, ${25 + 50 * dawnFactor}, ${40 + 150 * dawnFactor})`;
        skyColor2 = `rgb(${40 + 140 * dawnFactor}, ${45 + 90 * dawnFactor}, ${60 + 100 * dawnFactor})`;
    } else if (time < 0.5) {
        const dayFactor = (time - 0.25) * 4;
        skyColor1 = `rgb(${120 + 50 * dayFactor}, ${140 + 50 * dayFactor}, ${190 + 30 * dayFactor})`;
        skyColor2 = `rgb(${180 + 30 * dayFactor}, ${200 + 20 * dayFactor}, ${220})`;
    } else if (time < 0.75) {
        const duskFactor = (time - 0.5) * 4;
        skyColor1 = `rgb(${170 - 100 * duskFactor}, ${150 - 70 * duskFactor}, ${220 - 120 * duskFactor})`;
        skyColor2 = `rgb(${210 - 130 * duskFactor}, ${180 - 100 * duskFactor}, ${220 - 100 * duskFactor})`;
    } else {
        const nightFactor = (time - 0.75) * 4;
        skyColor1 = `rgb(${70 - 50 * nightFactor}, ${50 - 25 * nightFactor}, ${100 - 60 * nightFactor})`;
        skyColor2 = `rgb(${80 - 40 * nightFactor}, ${80 - 60 * nightFactor}, ${120 - 60 * nightFactor})`;
    }
    
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, skyColor1);
    gradient.addColorStop(1, skyColor2);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function drawRadar() {
    radarCtx.fillStyle = 'rgba(10, 10, 15, 0.95)';
    radarCtx.fillRect(0, 0, radarCanvas.width, radarCanvas.height);
    
    radarCtx.strokeStyle = 'rgba(138, 138, 255, 0.3)';
    radarCtx.lineWidth = 1;
    for (let i = 1; i <= 3; i++) {
        radarCtx.beginPath();
        radarCtx.arc(65, 65, i * 20, 0, Math.PI * 2);
        radarCtx.stroke();
    }
    
    const sweepAngle = (Date.now() / 100) % (Math.PI * 2);
    radarCtx.strokeStyle = 'rgba(138, 138, 255, 0.6)';
    radarCtx.beginPath();
    radarCtx.moveTo(65, 65);
    radarCtx.lineTo(65 + Math.cos(sweepAngle) * 60, 65 + Math.sin(sweepAngle) * 60);
    radarCtx.stroke();
    
    radarCtx.fillStyle = '#8a8aff';
    radarCtx.beginPath();
    radarCtx.arc(65, 65, 2, 0, Math.PI * 2);
    radarCtx.fill();
    
    // Elite fighter on radar
    if (gameState.currentPlane) {
        const dx = gameState.currentPlane.x - gameState.defense.x;
        const dy = gameState.currentPlane.y - gameState.defense.y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        const radarDist = Math.min(dist / 15, 55);
        const angle = Math.atan2(dy, dx);
        
        const radarX = 65 + radarDist * Math.cos(angle);
        const radarY = 65 + radarDist * Math.sin(angle);
        
        const color = gameState.currentPlane.isCyberAttacked ? '#8a8aff' : '#ff4444';
        radarCtx.fillStyle = color;
        radarCtx.beginPath();
        radarCtx.arc(radarX, radarY, 4, 0, Math.PI * 2);
        radarCtx.fill();
    }
    
    // Missiles on radar
    gameState.enemyMissiles.forEach(missile => {
        const dx = missile.x - gameState.defense.x;
        const dy = missile.y - gameState.defense.y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        const radarDist = Math.min(dist / 15, 55);
        const angle = Math.atan2(dy, dx);
        
        const radarX = 65 + radarDist * Math.cos(angle);
        const radarY = 65 + radarDist * Math.sin(angle);
        
        radarCtx.fillStyle = 'rgba(255, 100, 100, 0.8)';
        radarCtx.beginPath();
        radarCtx.arc(radarX, radarY, 1, 0, Math.PI * 2);
        radarCtx.fill();
    });
}

function fire() {
    if (gameState.defense.heat > gameState.defense.maxHeat - 15) {
        showNotification('OVERHEATING!', 'warning');
        return;
    }
    
    gameState.fireTimer++;
    if (gameState.fireTimer > 1) {
        const dx = mouseX - gameState.defense.x;
        const dy = mouseY - gameState.defense.y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        if (dist > 0) {
            const angle = Math.atan2(dy, dx);
            gameState.defense.angle = angle;
            gameState.missiles.push(new Missile(gameState.defense.x, gameState.defense.y, mouseX, mouseY));
            
            gameState.defense.heat = Math.min(
                gameState.defense.maxHeat,
                gameState.defense.heat + 6
            );
            updateHeatDisplay();
            
            gameState.fireTimer = 0;
        }
    }
}

function launchCyberAttack() {
    if (gameState.cyberAttackCooldown > 0 || !gameState.currentPlane) return;

    gameState.cyberAttacksUsed++;
    
    // Massive damage but won't destroy completely
    const damage = Math.min(
        ELITE_FIGHTER.cyberDamage,
        gameState.currentPlane.health - ELITE_FIGHTER.minHealthAfterCyber
    );
    
    if (damage > 0) {
        gameState.currentPlane.health -= damage;
        gameState.currentPlane.isCyberAttacked = true;
        
        // Cyber explosion
        gameState.cyberExplosions.push(new Explosion(
            gameState.currentPlane.x,
            gameState.currentPlane.y,
            35,
            false
        ));
        
        showNotification(`CYBER! -${damage}`, 'cyber');
        gameState.score += damage * 2;
        updateScoreDisplay();
    }

    gameState.cyberAttackCooldown = gameState.cyberAttackInterval;
    updateCyberButton();
}

function updateCyberButton() {
    if (gameState.cyberAttackCooldown > 0) {
        const cooldownSecs = Math.ceil(gameState.cyberAttackCooldown / 60);
        cyberButton.textContent = `CYBER: ${cooldownSecs}s`;
        cyberButton.disabled = true;
    } else {
        cyberButton.textContent = 'CYBERATTACK';
        cyberButton.disabled = !gameState.currentPlane;
    }
}

function updateGame() {
    if (!gameRunning || gamePaused) return;
    
    gameState.gameTime++;
    
    // Update spawn timer
    if (gameState.spawnTimer > 0) {
        gameState.spawnTimer--;
        updateSpawnTimer();
    }
    
    // Spawn new fighter every 5 seconds
    spawnEliteFighter();
    
    // Update day/night cycle
    gameState.dayNightCycle = (gameState.dayNightCycle + 0.00003) % 1;
    
    // Update cooldowns
    if (gameState.cyberAttackCooldown > 0) {
        gameState.cyberAttackCooldown--;
        if (gameState.cyberAttackCooldown % 60 === 0) {
            updateCyberButton();
        }
    }
    
    if (spacePressed) {
        fire();
    }
    
    // Update elite fighter
    if (gameState.currentPlane) {
        gameState.currentPlane.update();
        
        // Check if fighter is destroyed
        if (gameState.currentPlane.health <= 0) {
            // Explosion
            gameState.explosions.push(new Explosion(
                gameState.currentPlane.x,
                gameState.currentPlane.y,
                40,
                true
            ));
            
            showNotification('TARGET DESTROYED! +400', 'cyber');
            gameState.planesDestroyed++;
            gameState.score += ELITE_FIGHTER.scoreValue;
            gameState.currentPlane = null;
            gameState.planes = [];
            gameState.spawnTimer = gameState.spawnInterval;
            updateStatsDisplay();
            updateScoreDisplay();
            updateEnemyDisplay();
        }
        
        // Check if fighter leaves the screen (game continues)
        if (gameState.currentPlane.x < -150) {
            gameState.currentPlane = null;
            gameState.planes = [];
            gameState.spawnTimer = gameState.spawnInterval;
            updateEnemyDisplay();
        }
    }
    
    // Update explosions
    for (let i = gameState.explosions.length - 1; i >= 0; i--) {
        gameState.explosions[i].update();
        if (gameState.explosions[i].life <= 0) {
            gameState.explosions.splice(i, 1);
        }
    }

    for (let i = gameState.cyberExplosions.length - 1; i >= 0; i--) {
        gameState.cyberExplosions[i].update();
        if (gameState.cyberExplosions[i].life <= 0) {
            gameState.cyberExplosions.splice(i, 1);
        }
    }
    
    // Update player missiles
    for (let i = gameState.missiles.length - 1; i >= 0; i--) {
        const m = gameState.missiles[i];
        m.update();
        
        if (m.life <= 0 || m.x < 0 || m.x > canvas.width || m.y < 0 || m.y > canvas.height) {
            gameState.missiles.splice(i, 1);
            continue;
        }
        
        // Check missile-elite fighter collision
        if (gameState.currentPlane) {
            const dx = gameState.currentPlane.x - m.x;
            const dy = gameState.currentPlane.y - m.y;
            const dist = Math.sqrt(dx*dx + dy*dy);
            
            if (dist < ELITE_FIGHTER.size + m.size) {
                gameState.currentPlane.health -= gameState.defense.damage;
                gameState.explosions.push(new Explosion(m.x, m.y, 20, true));
                gameState.missiles.splice(i, 1);
                gameState.score += 10;
                updateScoreDisplay();
                continue;
            }
        }
        
        // Check missile-enemy missile collisions
        for (let j = gameState.enemyMissiles.length - 1; j >= 0; j--) {
            const enemyMissile = gameState.enemyMissiles[j];
            const dx = enemyMissile.x - m.x;
            const dy = enemyMissile.y - m.y;
            const dist = Math.sqrt(dx*dx + dy*dy);
            
            if (dist < enemyMissile.size + m.size) {
                gameState.explosions.push(new Explosion(m.x, m.y, 15, true));
                gameState.explosions.push(new Explosion(enemyMissile.x, enemyMissile.y, 20, true));
                gameState.missiles.splice(i, 1);
                gameState.enemyMissiles.splice(j, 1);
                gameState.score += 50;
                updateScoreDisplay();
                break;
            }
        }
    }
    
    // Update enemy missiles
    for (let i = gameState.enemyMissiles.length - 1; i >= 0; i--) {
        const m = gameState.enemyMissiles[i];
        
        m.x += m.vx;
        m.y += m.vy;
        m.life--;
        
        if (m.life <= 0 || m.x < 0 || m.x > canvas.width || m.y < 0 || m.y > canvas.height) {
            gameState.enemyMissiles.splice(i, 1);
            continue;
        }
        
        // Check collision with defense (MISSILES hit, not the plane itself)
        const dx = gameState.defense.x - m.x;
        const dy = gameState.defense.y - m.y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        
        if (dist < 30 + m.size) {
            gameState.defense.health -= m.damage;
            gameState.explosions.push(new Explosion(m.x, m.y, 30, true));
            gameState.enemyMissiles.splice(i, 1);
            
            updateHealthDisplay();
            showNotification(`HIT! -${m.damage}`, 'warning');
            
            if (gameState.defense.health <= 0) {
                gameState.defense.health = 0;
                gameRunning = false;
                endGame();
            }
        }
    }
    
    // Update enemy display
    updateEnemyDisplay();
    updateStatsDisplay();
}

function drawGame() {
    drawSky();
    drawBuildings();
    drawGround();
    
    // Draw elite fighter
    if (gameState.currentPlane) {
        gameState.currentPlane.draw();
    }
    
    // Draw missiles
    gameState.missiles.forEach(m => m.draw());
    
    // Draw enemy missiles
    gameState.enemyMissiles.forEach(m => {
        ctx.fillStyle = '#ff5555';
        ctx.beginPath();
        ctx.arc(m.x, m.y, m.size, 0, Math.PI * 2);
        ctx.fill();
    });

    // Draw explosions
    gameState.explosions.forEach(exp => exp.draw());
    gameState.cyberExplosions.forEach(exp => exp.draw());
    
    drawDefense();
    drawRadar();
}

function endGame() {
    document.getElementById('gameOverScreen').classList.add('show');
    document.getElementById('finalPlanes').textContent = gameState.planesDestroyed;
    document.getElementById('finalTime').textContent = Math.floor(gameState.gameTime / 60) + 's';
    document.getElementById('finalScore').textContent = gameState.score;
    document.getElementById('finalWave').textContent = gameState.wave - 1;
    
    gameOverMessage.textContent = "DEFENSE SYSTEM DESTROYED - TURRET HP REACHED ZERO";
}

function gameLoop() {
    updateGame();
    drawGame();
    requestAnimationFrame(gameLoop);
}

function startGame() {
    document.getElementById('splashScreen').classList.add('hidden');
    document.getElementById('gameContainer').classList.add('active');
    gameRunning = true;
    gamePaused = false;
    initGame();
    updateCyberButton();
    gameLoop();
}

function togglePause() {
    gamePaused = !gamePaused;
    if (gamePaused) {
        showNotification('PAUSED', 'warning');
    }
}

// Event Listeners
canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    mouseX = e.clientX - rect.left;
    mouseY = e.clientY - rect.top;
});

document.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
        e.preventDefault();
        spacePressed = true;
    }
    if (e.code === 'KeyC' || e.key === 'c') {
        launchCyberAttack();
    }
    if (e.code === 'KeyR' || e.key === 'r') {
        location.reload();
    }
    if (e.code === 'Escape') {
        togglePause();
    }
});

document.addEventListener('keyup', (e) => {
    if (e.code === 'Space') {
        spacePressed = false;
        gameState.fireTimer = 0;
    }
});

cyberButton.addEventListener('click', launchCyberAttack);
document.getElementById('startBtn').addEventListener('click', startGame);

// Initialize game
initGame();
gameLoop();
