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
const enemyCountEl = document.getElementById('enemyCount');
const airSuperiorityEl = document.getElementById('airSuperiority');
const radarStatusEl = document.getElementById('radarStatus');
const waveValueEl = document.getElementById('waveValue');

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

// Game State
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
    spawnInterval: 1800, // 30 seconds between waves
    wave: 1,
    enemyLimit: 4,
    maxEnemiesInWave: 8,
    waveActive: false,
    enemySpawnRate: 90, // 1.5 seconds between enemy spawns
    enemySpawnTimer: 0,
    totalEnemiesThisWave: 0,
    enemiesSpawnedThisWave: 0,
    waitingForNewWave: true
};

// Physics constants
const PHYSICS = {
    GRAVITY: 0.098,
    BULLET_SPEED: 12,
    MISSILE_SPEED: 5,
    AIR_DENSITY: 0.0012,
    LIFT_COEFFICIENT: 1.5,
    DRAG_COEFFICIENT: 0.02
};

// Aircraft types with realistic characteristics
const AIRCRAFT_TYPES = {
    FIGHTER: {
        maxHealth: 400,
        size: 25,
        speed: 3.5,
        agility: 0.05,
        fireRate: 150,
        missileDamage: 25,
        evasionSkill: 0.7,
        bodyColor: '#ff4444',
        trailColor: 'rgba(255, 100, 100, 0.5)',
        scoreValue: 200,
        spawnWeight: 3,
        mass: 8000,
        wingArea: 20,
        maxGForce: 8,
        enginePower: 120000
    },
    BOMBER: {
        maxHealth: 800,
        size: 35,
        speed: 2.0,
        agility: 0.02,
        fireRate: 300,
        missileDamage: 40,
        evasionSkill: 0.3,
        bodyColor: '#cc8844',
        trailColor: 'rgba(204, 136, 68, 0.5)',
        scoreValue: 400,
        spawnWeight: 1,
        mass: 30000,
        wingArea: 50,
        maxGForce: 3,
        enginePower: 80000
    },
    ATTACK: {
        maxHealth: 600,
        size: 30,
        speed: 2.8,
        agility: 0.03,
        fireRate: 200,
        missileDamage: 30,
        evasionSkill: 0.5,
        bodyColor: '#ff8844',
        trailColor: 'rgba(255, 136, 68, 0.5)',
        scoreValue: 300,
        spawnWeight: 2,
        mass: 15000,
        wingArea: 30,
        maxGForce: 5,
        enginePower: 100000
    }
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
    gameState.planes = [];
    gameState.missiles = [];
    gameState.enemyMissiles = [];
    gameState.explosions = [];
    gameState.cyberExplosions = [];
    gameState.waveActive = false;
    gameState.enemySpawnTimer = 0;
    gameState.totalEnemiesThisWave = 0;
    gameState.enemiesSpawnedThisWave = 0;
    gameState.waitingForNewWave = true;
    
    updateHealthDisplay();
    updateStatsDisplay();
    updateScoreDisplay();
    updateEnemyDisplay();
    updateSpawnTimer();
    updateWaveDisplay();
    initBuildings();
    showNotification('DEFENSE SYSTEMS ONLINE - RADAR OPERATIONAL', 'cyber');
}

// Initialize beautiful buildings
function initBuildings() {
    gameState.buildings = [];
    
    // Create multiple layers of buildings with parallax effect
    for (let layer = 0; layer < 4; layer++) {
        const buildingCount = 10 - layer * 2;
        const layerSpacing = 100 - layer * 20;
        const buildingWidthRange = [20 + layer * 5, 40 + layer * 10];
        const buildingHeightRange = [60 + layer * 20, 180 + layer * 40];
        
        for (let i = 0; i < buildingCount; i++) {
            const x = (i * layerSpacing) + Math.random() * 60;
            const width = buildingWidthRange[0] + Math.random() * (buildingWidthRange[1] - buildingWidthRange[0]);
            const height = buildingHeightRange[0] + Math.random() * (buildingHeightRange[1] - buildingHeightRange[0]);
            
            // Create gradient colors for buildings
            const baseColor = 30 + layer * 10;
            const colorVariation = Math.random() * 30;
            const r = Math.floor(baseColor + colorVariation);
            const g = Math.floor(baseColor + colorVariation * 0.8);
            const b = Math.floor(baseColor + colorVariation * 0.6);
            
            // Add windows
            const windows = [];
            const windowCols = Math.floor(width / 15);
            const windowRows = Math.floor(height / 20);
            
            for (let w = 0; w < windowCols; w++) {
                for (let hw = 0; hw < windowRows; hw++) {
                    if (Math.random() > 0.6) {
                        windows.push({
                            x: w * 15 + 5,
                            y: hw * 20 + 5,
                            lit: Math.random() > 0.3
                        });
                    }
                }
            }
            
            gameState.buildings.push({
                x: x,
                width: width,
                height: height,
                color: `rgb(${r}, ${g}, ${b})`,
                layer: layer,
                parallax: 0.6 + layer * 0.1,
                windows: windows,
                glow: layer === 3 && Math.random() > 0.7
            });
        }
    }
}

// Draw beautiful buildings with windows
function drawBuildings() {
    const sortedBuildings = [...gameState.buildings].sort((a, b) => a.layer - b.layer);
    
    const time = gameState.dayNightCycle;
    let ambientLight = 0.3;
    if (time < 0.25 || time > 0.75) ambientLight = 0.15;
    else if (time < 0.5) ambientLight = 0.4;
    else ambientLight = 0.25;
    
    sortedBuildings.forEach(building => {
        const baseY = canvas.height - 100;
        const buildingY = baseY - building.height;
        const parallaxX = building.x * building.parallax;
        const parallaxWidth = building.width * building.parallax;
        
        // Draw building shadow
        ctx.fillStyle = `rgba(0, 0, 0, ${0.3 + building.layer * 0.1})`;
        ctx.fillRect(parallaxX + 3, buildingY + 3, parallaxWidth, building.height);
        
        // Draw building
        const brightness = ambientLight + (building.layer * 0.05);
        ctx.fillStyle = building.color.replace('rgb', 'rgba').replace(')', `, ${brightness})`);
        ctx.fillRect(parallaxX, buildingY, parallaxWidth, building.height);
        
        // Draw windows
        building.windows.forEach(window => {
            const windowX = parallaxX + window.x * building.parallax;
            const windowY = buildingY + window.y;
            const windowWidth = 8 * building.parallax;
            const windowHeight = 12;
            
            if (window.lit) {
                const windowBrightness = ambientLight + 0.3 + Math.sin(gameState.gameTime * 0.01 + window.x + window.y) * 0.1;
                ctx.fillStyle = `rgba(255, 255, 200, ${windowBrightness})`;
            } else {
                ctx.fillStyle = `rgba(100, 100, 100, ${ambientLight * 0.5})`;
            }
            ctx.fillRect(windowX, windowY, windowWidth, windowHeight);
        });
        
        // Add building glow for some buildings
        if (building.glow) {
            const glowIntensity = 0.1 + Math.sin(gameState.gameTime * 0.02) * 0.05;
            ctx.fillStyle = `rgba(255, 255, 200, ${glowIntensity})`;
            ctx.fillRect(parallaxX - 2, buildingY - 2, parallaxWidth + 4, 4);
        }
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
            showNotification('CRITICAL DAMAGE!', 'warning');
        }
    } else if (gameState.defense.health <= 5000) {
        healthBar.classList.add('danger');
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
    enemyCountEl.textContent = gameState.planes.length;
    
    const airSuperiority = Math.max(0, 100 - (gameState.planes.length / gameState.enemyLimit * 100));
    airSuperiorityEl.textContent = Math.floor(airSuperiority) + '%';
    
    if (airSuperiority < 30) {
        radarStatusEl.textContent = 'OVERWHELMED';
        radarStatusEl.style.color = '#ff4444';
    } else if (airSuperiority < 60) {
        radarStatusEl.textContent = 'STRESSED';
        radarStatusEl.style.color = '#ffff44';
    } else {
        radarStatusEl.textContent = 'NOMINAL';
        radarStatusEl.style.color = '#8a8aff';
    }
}

function updateWaveDisplay() {
    waveValueEl.textContent = gameState.wave;
}

function updateSpawnTimer() {
    if (gameState.waveActive) {
        const enemiesLeft = Math.max(0, gameState.totalEnemiesThisWave - gameState.enemiesSpawnedThisWave);
        spawnTimer.textContent = `${enemiesLeft} REMAINING`;
        spawnTimer.style.color = '#ff4444';
    } else {
        const seconds = Math.ceil(gameState.spawnTimer / 60);
        spawnTimer.textContent = seconds + 's';
        
        if (seconds <= 10) {
            spawnTimer.style.color = '#ff4444';
        } else if (seconds <= 20) {
            spawnTimer.style.color = '#ffff44';
        } else {
            spawnTimer.style.color = '#8a8aff';
        }
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
    if (time < 0.25) timeDisplay.textContent = 'OPERATION DAWN';
    else if (time < 0.5) timeDisplay.textContent = 'OPERATION DAY';
    else if (time < 0.75) timeDisplay.textContent = 'OPERATION DUSK';
    else timeDisplay.textContent = 'OPERATION NIGHT';
    
    if (gameState.defense.heat > 0) {
        gameState.defense.heat = Math.max(0, gameState.defense.heat - gameState.defense.coolingRate);
        updateHeatDisplay();
    }
}

// Aircraft class with realistic physics
class Aircraft {
    constructor(type) {
        this.type = type;
        this.config = AIRCRAFT_TYPES[type];
        this.health = this.config.maxHealth;
        this.x = canvas.width + 100 + Math.random() * 200;
        this.y = 50 + Math.random() * 300;
        this.vx = -this.config.speed;
        this.vy = 0;
        this.rotation = 0;
        this.pitch = 0;
        this.roll = 0;
        this.firingTimer = 0;
        this.evasionTimer = 0;
        this.alertLevel = 0;
        this.evading = false;
        this.attackCooldown = 0;
        this.missilesFired = 0;
        this.maxMissiles = type === 'BOMBER' ? 3 : 2;
        this.trail = [];
        this.trailMax = 15;
        this.targetAngle = 0;
        this.targetAltitude = this.y;
        this.engineThrottle = 1.0;
        this.fuel = 1000;
        this.damageState = 0;
        this.wingHealth = 100;
        this.engineHealth = 100;
        this.lastDamageTime = 0;
        this.combatMode = 'approach';
        this.attackPattern = Math.floor(Math.random() * 3);
        this.formationOffset = { x: 0, y: 0 };
        
        // Physics state
        this.velocity = { x: 0, y: 0 };
        this.acceleration = { x: 0, y: 0 };
        this.lift = 0;
        this.drag = 0;
        this.angleOfAttack = 0;
        this.stallAngle = 15;
        this.isStalling = false;
    }
    
    applyPhysics() {
        // Calculate forces
        const airspeed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
        
        // Lift force (depends on angle of attack and airspeed)
        this.angleOfAttack = Math.atan2(this.vy, Math.abs(this.vx)) * (180 / Math.PI);
        const liftCoefficient = Math.min(this.angleOfAttack / 10, 1.5);
        this.lift = 0.5 * PHYSICS.AIR_DENSITY * airspeed * airspeed * this.config.wingArea * liftCoefficient;
        
        // Drag force
        this.drag = 0.5 * PHYSICS.AIR_DENSITY * airspeed * airspeed * this.config.wingArea * PHYSICS.DRAG_COEFFICIENT;
        
        // Thrust force
        const thrust = this.config.enginePower * this.engineThrottle * (this.engineHealth / 100);
        
        // Calculate acceleration (F = ma)
        this.acceleration.x = (thrust * Math.cos(this.rotation) - this.drag * Math.cos(this.rotation)) / this.config.mass;
        this.acceleration.y = (this.lift - this.config.mass * PHYSICS.GRAVITY) / this.config.mass;
        
        // Apply damage effects
        if (this.damageState > 0) {
            this.acceleration.x *= (1 - this.damageState * 0.3);
            this.acceleration.y *= (1 - this.damageState * 0.2);
        }
        
        // Update velocity
        this.vx += this.acceleration.x;
        this.vy += this.acceleration.y;
        
        // Apply wing damage effects
        if (this.wingHealth < 50) {
            this.vy += (Math.sin(gameState.gameTime * 0.1) * 0.5) * (1 - this.wingHealth / 50);
        }
        
        // Stall detection
        if (this.angleOfAttack > this.stallAngle && airspeed < 20) {
            this.isStalling = true;
            this.vy -= 0.5;
        } else {
            this.isStalling = false;
        }
        
        // Apply velocity with damping
        this.x += this.vx * 0.98;
        this.y += this.vy * 0.98;
        
        // Update fuel
        this.fuel -= this.engineThrottle * 0.1;
    }
    
    update() {
        this.applyPhysics();
        
        // Calculate distance to defense
        const dx = gameState.defense.x - this.x;
        const dy = gameState.defense.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // AI Behavior based on aircraft type
        switch (this.type) {
            case 'FIGHTER':
                this.fighterBehavior(distance, dx, dy);
                break;
            case 'BOMBER':
                this.bomberBehavior(distance, dx, dy);
                break;
            case 'ATTACK':
                this.attackBehavior(distance, dx, dy);
                break;
        }
        
        // Attack logic
        this.firingTimer++;
        if (this.firingTimer > this.config.fireRate && this.missilesFired < this.maxMissiles) {
            if (Math.random() > 0.7) {
                this.fireMissile();
            }
            this.firingTimer = 0;
        }
        
        // Evasion logic
        if (this.evading) {
            this.evasionTimer++;
            if (this.evasionTimer > 60) {
                this.evading = false;
                this.evasionTimer = 0;
            }
        }
        
        // Boundary constraints
        this.x = Math.max(-100, Math.min(canvas.width + 100, this.x));
        this.y = Math.max(40, Math.min(canvas.height - 160, this.y));
        
        // Update trail
        this.trail.push({ x: this.x, y: this.y });
        if (this.trail.length > this.trailMax) {
            this.trail.shift();
        }
        
        // Update attack cooldown
        if (this.attackCooldown > 0) {
            this.attackCooldown--;
        }
    }
    
    fighterBehavior(distance, dx, dy) {
        if (distance < 300) {
            // Attack run
            this.targetAngle = Math.atan2(dy, dx);
            this.rotation = this.targetAngle * 0.1;
            
            if (distance < 150) {
                // Evasive maneuver
                this.evading = true;
                this.vy = Math.sin(gameState.gameTime * 0.1) * 2;
                this.vx = -this.config.speed * 0.8;
            } else {
                // Approach for attack
                this.vx = -this.config.speed * 1.2;
                this.targetAltitude = gameState.defense.y - 100;
                this.vy += (this.targetAltitude - this.y) * 0.01;
            }
        } else {
            // Patrol pattern
            this.targetAltitude = 150 + Math.sin(gameState.gameTime * 0.005 + this.x * 0.01) * 100;
            this.vy += (this.targetAltitude - this.y) * 0.02;
            this.vx = -this.config.speed * 0.9;
        }
    }
    
    bomberBehavior(distance, dx, dy) {
        // Bombers fly high and straight
        this.targetAltitude = 200;
        this.vy += (this.targetAltitude - this.y) * 0.01;
        
        if (distance < 400) {
            // Bombing run
            this.vx = -this.config.speed * 0.7;
            if (distance < 250 && this.missilesFired < this.maxMissiles) {
                // Release bombs
                this.fireMissile();
            }
        } else {
            // Approach
            this.vx = -this.config.speed * 0.6;
        }
    }
    
    attackBehavior(distance, dx, dy) {
        // Ground attack aircraft
        if (distance < 350) {
            this.targetAltitude = 100;
            this.vy += (this.targetAltitude - this.y) * 0.02;
            
            if (distance < 200) {
                // Attack run
                this.vx = -this.config.speed * 1.1;
                this.targetAngle = Math.atan2(dy, dx);
                this.rotation = this.targetAngle * 0.05;
            } else {
                // Approach
                this.vx = -this.config.speed * 0.8;
            }
        } else {
            // Cruise
            this.targetAltitude = 180;
            this.vy += (this.targetAltitude - this.y) * 0.01;
            this.vx = -this.config.speed * 0.7;
        }
    }
    
    fireMissile() {
        if (this.missilesFired >= this.maxMissiles) return;
        
        const dx = gameState.defense.x - this.x;
        const dy = gameState.defense.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist > 0) {
            gameState.enemyMissiles.push({
                x: this.x,
                y: this.y,
                vx: (dx / dist) * PHYSICS.MISSILE_SPEED,
                vy: (dy / dist) * PHYSICS.MISSILE_SPEED,
                size: this.type === 'BOMBER' ? 10 : 8,
                life: 400,
                damage: this.config.missileDamage,
                trail: [],
                trailMax: 12,
                type: this.type
            });
            
            this.missilesFired++;
            if (this.type === 'BOMBER') {
                showNotification('BOMB RELEASED!', 'warning');
            } else {
                showNotification('MISSILE INBOUND!', 'warning');
            }
            
            // Recoil effect
            this.vx += 0.1;
        }
    }
    
    draw() {
        // Draw trail with physics-based effects
        ctx.save();
        this.trail.forEach((point, i) => {
            const alpha = i / this.trail.length;
            const size = this.config.size * 0.3 * alpha;
            
            let trailColor;
            if (this.damageState > 0.5) {
                trailColor = `rgba(255, 100, 50, ${alpha * 0.6})`;
            } else if (this.isStalling) {
                trailColor = `rgba(255, 150, 50, ${alpha * 0.4})`;
            } else {
                trailColor = this.config.trailColor.replace(')', `, ${alpha * 0.5})`);
            }
            
            ctx.fillStyle = trailColor;
            ctx.beginPath();
            ctx.arc(point.x, point.y, size, 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.restore();
        
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation + this.roll);
        
        // Draw aircraft based on type
        ctx.fillStyle = this.damageState > 0.5 ? '#ff6666' : this.config.bodyColor;
        
        // Draw different aircraft shapes
        switch (this.type) {
            case 'FIGHTER':
                this.drawFighter();
                break;
            case 'BOMBER':
                this.drawBomber();
                break;
            case 'ATTACK':
                this.drawAttackAircraft();
                break;
        }
        
        ctx.restore();
        
        // Draw health bar
        const healthPercent = this.health / this.config.maxHealth;
        const barWidth = this.config.size * 2;
        ctx.fillStyle = '#222';
        ctx.fillRect(this.x - barWidth/2, this.y - this.config.size - 20, barWidth, 4);
        ctx.fillStyle = healthPercent > 0.5 ? '#44ff44' : healthPercent > 0.25 ? '#ffff44' : '#ff4444';
        ctx.fillRect(this.x - barWidth/2, this.y - this.config.size - 20, healthPercent * barWidth, 4);
        
        // Draw stall indicator
        if (this.isStalling) {
            ctx.fillStyle = 'rgba(255, 150, 50, 0.5)';
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.config.size + 5, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    drawFighter() {
        // Sleek fighter design
        ctx.beginPath();
        ctx.moveTo(this.config.size, 0);
        ctx.lineTo(-this.config.size * 0.8, this.config.size * 0.4);
        ctx.lineTo(-this.config.size, 0);
        ctx.lineTo(-this.config.size * 0.8, -this.config.size * 0.4);
        ctx.closePath();
        ctx.fill();
        
        // Wings
        ctx.fillStyle = '#ff6666';
        ctx.fillRect(-this.config.size * 0.6, -this.config.size * 0.6, this.config.size, this.config.size * 0.1);
        ctx.fillRect(-this.config.size * 0.6, this.config.size * 0.5, this.config.size, this.config.size * 0.1);
        
        // Cockpit
        ctx.fillStyle = '#ffaaaa';
        ctx.beginPath();
        ctx.arc(this.config.size * 0.3, 0, this.config.size * 0.25, 0, Math.PI * 2);
        ctx.fill();
    }
    
    drawBomber() {
        // Large bomber design
        ctx.beginPath();
        ctx.ellipse(0, 0, this.config.size * 1.2, this.config.size * 0.6, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Wings
        ctx.fillStyle = '#ccaa88';
        ctx.fillRect(-this.config.size * 0.8, -this.config.size * 0.8, this.config.size * 1.6, this.config.size * 0.15);
        ctx.fillRect(-this.config.size * 0.8, this.config.size * 0.65, this.config.size * 1.6, this.config.size * 0.15);
        
        // Engines
        ctx.fillStyle = '#333';
        ctx.fillRect(-this.config.size * 0.5, -this.config.size * 0.9, this.config.size * 0.3, this.config.size * 0.3);
        ctx.fillRect(-this.config.size * 0.5, this.config.size * 0.6, this.config.size * 0.3, this.config.size * 0.3);
    }
    
    drawAttackAircraft() {
        // Ground attack aircraft
        ctx.beginPath();
        ctx.moveTo(this.config.size, 0);
        ctx.lineTo(-this.config.size * 0.7, this.config.size * 0.5);
        ctx.lineTo(-this.config.size, 0);
        ctx.lineTo(-this.config.size * 0.7, -this.config.size * 0.5);
        ctx.closePath();
        ctx.fill();
        
        // Straight wings
        ctx.fillStyle = '#ffaa88';
        ctx.fillRect(-this.config.size * 0.5, -this.config.size * 0.7, this.config.size, this.config.size * 0.15);
        ctx.fillRect(-this.config.size * 0.5, this.config.size * 0.55, this.config.size, this.config.size * 0.15);
        
        // Weapons pods
        ctx.fillStyle = '#666';
        ctx.fillRect(this.config.size * 0.2, -this.config.size * 0.3, this.config.size * 0.4, this.config.size * 0.1);
        ctx.fillRect(this.config.size * 0.2, this.config.size * 0.2, this.config.size * 0.4, this.config.size * 0.1);
    }
}

class Missile {
    constructor(fromX, fromY, targetX, targetY) {
        this.x = fromX;
        this.y = fromY;
        const dx = targetX - fromX;
        const dy = targetY - fromY;
        const dist = Math.sqrt(dx * dx + dy * dy);
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
        
        this.trail.push({ x: this.x, y: this.y });
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
    constructor(x, y, size = 25, type = 'normal') {
        this.x = x;
        this.y = y;
        this.maxSize = size;
        this.currentSize = 0;
        this.life = 30;
        this.maxLife = 30;
        this.type = type;
        this.particles = [];
        this.initParticles();
    }

    initParticles() {
        const particleCount = this.type === 'large' ? 30 : 15;
        for (let i = 0; i < particleCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 1 + Math.random() * 5;
            this.particles.push({
                x: this.x,
                y: this.y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 20 + Math.random() * 15,
                size: 1 + Math.random() * 4
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
        
        if (this.type === 'cyber') {
            ctx.fillStyle = `rgba(100, 200, 255, ${alpha * 0.6})`;
        } else if (this.type === 'large') {
            ctx.fillStyle = `rgba(255, 100, 50, ${alpha * 0.7})`;
        } else {
            ctx.fillStyle = `rgba(255, 150, 50, ${alpha * 0.6})`;
        }
        
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.currentSize, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw particles
        this.particles.forEach(p => {
            const particleAlpha = p.life / 35;
            let particleColor;
            if (this.type === 'cyber') {
                particleColor = `rgba(100, 200, 255, ${particleAlpha})`;
            } else {
                particleColor = `rgba(255, 100, 0, ${particleAlpha})`;
            }
            ctx.fillStyle = particleColor;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
        });
    }
}

function spawnAircraft() {
    if (!gameState.waveActive || gameState.enemiesSpawnedThisWave >= gameState.totalEnemiesThisWave) return;
    
    if (gameState.enemySpawnTimer <= 0 && gameState.planes.length < gameState.enemyLimit) {
        // Choose aircraft type based on weights
        const types = [];
        for (const [type, config] of Object.entries(AIRCRAFT_TYPES)) {
            for (let i = 0; i < config.spawnWeight; i++) {
                types.push(type);
            }
        }
        const selectedType = types[Math.floor(Math.random() * types.length)];
        
        const aircraft = new Aircraft(selectedType);
        gameState.planes.push(aircraft);
        gameState.enemiesSpawnedThisWave++;
        gameState.enemySpawnTimer = gameState.enemySpawnRate;
        
        if (selectedType === 'BOMBER') {
            showNotification('HEAVY BOMBER DETECTED', 'warning');
        }
    }
}

function startNewWave() {
    if (gameState.waveActive) return;
    
    gameState.waveActive = true;
    gameState.totalEnemiesThisWave = Math.min(4 + gameState.wave, gameState.maxEnemiesInWave);
    gameState.enemiesSpawnedThisWave = 0;
    gameState.enemySpawnTimer = 0;
    
    showNotification(`WAVE ${gameState.wave} - ${gameState.totalEnemiesThisWave} TARGETS INBOUND`, 'warning');
    updateWaveDisplay();
}

function endWave() {
    gameState.waveActive = false;
    gameState.waitingForNewWave = true;
    gameState.spawnTimer = gameState.spawnInterval;
    gameState.wave++;
    
    if (gameState.planes.length === 0) {
        showNotification('WAVE CLEARED - PREPARE FOR NEXT ASSAULT', 'cyber');
    }
}

function drawDefense() {
    ctx.save();
    ctx.translate(gameState.defense.x, gameState.defense.y);
    
    // Base
    ctx.fillStyle = '#333';
    ctx.fillRect(-30, 0, 60, 25);
    
    // Turret body with damage effects
    const healthPercent = gameState.defense.health / gameState.defense.maxHealth;
    const heatFactor = gameState.defense.heat / gameState.defense.maxHeat;
    
    let turretColor;
    if (healthPercent < 0.3) {
        turretColor = '#ff4444';
    } else if (healthPercent < 0.6) {
        turretColor = '#ff8844';
    } else {
        turretColor = '#8a8aff';
    }
    
    const gradient = ctx.createLinearGradient(-25, -25, 25, 25);
    gradient.addColorStop(0, turretColor);
    gradient.addColorStop(1, '#222');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(0, -15, 25, 0, Math.PI * 2);
    ctx.fill();
    
    // Damage effects
    if (healthPercent < 0.5) {
        ctx.fillStyle = `rgba(255, 50, 50, ${0.3 * (1 - healthPercent * 2)})`;
        ctx.beginPath();
        ctx.arc(0, -15, 25, 0, Math.PI * 2);
        ctx.fill();
    }
    
    // Turret barrel
    ctx.rotate(gameState.defense.angle);
    ctx.fillStyle = '#555';
    ctx.fillRect(0, -6, 60, 12);
    
    // Barrel tip with heat effect
    ctx.fillStyle = heatFactor > 0.5 ? '#ff8a8a' : '#666';
    ctx.fillRect(58, -8, 10, 16);
    
    // Muzzle flash
    if (spacePressed && gameState.fireTimer < 2) {
        ctx.fillStyle = `rgba(255, 200, 100, 0.8)`;
        ctx.fillRect(68, -10, 20, 20);
    }
    
    ctx.restore();
}

function drawGround() {
    const groundHeight = 100;
    
    // Ground base with gradient
    const gradient = ctx.createLinearGradient(0, canvas.height - groundHeight, 0, canvas.height);
    gradient.addColorStop(0, '#111');
    gradient.addColorStop(1, '#0a0a0a');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, canvas.height - groundHeight, canvas.width, groundHeight);
    
    // Ground texture
    ctx.fillStyle = '#1a1a1a';
    for (let i = 0; i < canvas.width; i += 40) {
        ctx.fillRect(i, canvas.height - groundHeight, 1, 15);
    }
    
    // Platform with defense markings
    ctx.fillStyle = '#222';
    ctx.fillRect(120, canvas.height - groundHeight + 25, 120, 20);
    
    // Platform markings
    ctx.strokeStyle = '#8a8aff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(120, canvas.height - groundHeight + 35);
    ctx.lineTo(240, canvas.height - groundHeight + 35);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(180, canvas.height - groundHeight + 25);
    ctx.lineTo(180, canvas.height - groundHeight + 45);
    ctx.stroke();
}

function drawSky() {
    gameState.dayNightCycle = (gameState.dayNightCycle + 0.00003) % 1;
    const time = gameState.dayNightCycle;
    
    let skyColor1, skyColor2;
    
    if (time < 0.25) {
        const dawnFactor = time * 4;
        skyColor1 = `rgb(${30 + 90 * dawnFactor}, ${35 + 40 * dawnFactor}, ${50 + 100 * dawnFactor})`;
        skyColor2 = `rgb(${50 + 120 * dawnFactor}, ${55 + 70 * dawnFactor}, ${70 + 80 * dawnFactor})`;
    } else if (time < 0.5) {
        const dayFactor = (time - 0.25) * 4;
        skyColor1 = `rgb(${120 + 40 * dayFactor}, ${140 + 30 * dayFactor}, ${190 + 10 * dayFactor})`;
        skyColor2 = `rgb(${160 + 20 * dayFactor}, ${180 + 10 * dayFactor}, ${210})`;
    } else if (time < 0.75) {
        const duskFactor = (time - 0.5) * 4;
        skyColor1 = `rgb(${160 - 80 * duskFactor}, ${140 - 60 * duskFactor}, ${200 - 80 * duskFactor})`;
        skyColor2 = `rgb(${180 - 100 * duskFactor}, ${150 - 70 * duskFactor}, ${200 - 60 * duskFactor})`;
    } else {
        const nightFactor = (time - 0.75) * 4;
        skyColor1 = `rgb(${80 - 30 * nightFactor}, ${60 - 10 * nightFactor}, ${120 - 20 * nightFactor})`;
        skyColor2 = `rgb(${50}, ${40}, ${100})`;
    }
    
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, skyColor1);
    gradient.addColorStop(1, skyColor2);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Add some stars at night
    if (time > 0.75 || time < 0.25) {
        for (let i = 0; i < 50; i++) {
            const x = Math.random() * canvas.width;
            const y = Math.random() * canvas.height * 0.7;
            const size = Math.random() * 1.5;
            const brightness = 0.3 + Math.random() * 0.7;
            
            ctx.fillStyle = `rgba(255, 255, 255, ${brightness})`;
            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}

function drawRadar() {
    radarCtx.fillStyle = 'rgba(10, 10, 15, 0.95)';
    radarCtx.fillRect(0, 0, radarCanvas.width, radarCanvas.height);
    
    // Radar grid
    radarCtx.strokeStyle = 'rgba(138, 138, 255, 0.3)';
    radarCtx.lineWidth = 1;
    for (let i = 1; i <= 3; i++) {
        radarCtx.beginPath();
        radarCtx.arc(65, 65, i * 20, 0, Math.PI * 2);
        radarCtx.stroke();
    }
    
    // Radar sweep
    const sweepAngle = (Date.now() / 100) % (Math.PI * 2);
    radarCtx.strokeStyle = 'rgba(138, 138, 255, 0.6)';
    radarCtx.beginPath();
    radarCtx.moveTo(65, 65);
    radarCtx.lineTo(65 + Math.cos(sweepAngle) * 60, 65 + Math.sin(sweepAngle) * 60);
    radarCtx.stroke();
    
    // Center point
    radarCtx.fillStyle = '#8a8aff';
    radarCtx.beginPath();
    radarCtx.arc(65, 65, 2, 0, Math.PI * 2);
    radarCtx.fill();
    
    // Draw aircraft on radar
    gameState.planes.forEach(aircraft => {
        const dx = aircraft.x - gameState.defense.x;
        const dy = aircraft.y - gameState.defense.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const radarDist = Math.min(dist / 15, 55);
        const angle = Math.atan2(dy, dx);
        
        const radarX = 65 + radarDist * Math.cos(angle);
        const radarY = 65 + radarDist * Math.sin(angle);
        
        let color;
        if (aircraft.type === 'BOMBER') {
            color = '#ff8844';
        } else if (aircraft.type === 'ATTACK') {
            color = '#ffaa44';
        } else {
            color = '#ff4444';
        }
        
        radarCtx.fillStyle = color;
        radarCtx.beginPath();
        radarCtx.arc(radarX, radarY, 4, 0, Math.PI * 2);
        radarCtx.fill();
    });
    
    // Draw missiles on radar
    gameState.enemyMissiles.forEach(missile => {
        const dx = missile.x - gameState.defense.x;
        const dy = missile.y - gameState.defense.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const radarDist = Math.min(dist / 15, 55);
        const angle = Math.atan2(dy, dx);
        
        const radarX = 65 + radarDist * Math.cos(angle);
        const radarY = 65 + radarDist * Math.sin(angle);
        
        radarCtx.fillStyle = 'rgba(255, 100, 100, 0.8)';
        radarCtx.beginPath();
        radarCtx.arc(radarX, radarY, 2, 0, Math.PI * 2);
        radarCtx.fill();
    });
}

function fire() {
    if (gameState.defense.heat > gameState.defense.maxHeat - 15) {
        showNotification('SYSTEM OVERHEATING!', 'warning');
        return;
    }
    
    gameState.fireTimer++;
    if (gameState.fireTimer > 1) {
        const dx = mouseX - gameState.defense.x;
        const dy = mouseY - gameState.defense.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
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
    if (gameState.cyberAttackCooldown > 0 || gameState.planes.length === 0) return;

    gameState.cyberAttacksUsed++;
    
    // Find closest aircraft
    let closestAircraft = null;
    let closestDistance = Infinity;
    
    gameState.planes.forEach(aircraft => {
        const dx = aircraft.x - gameState.defense.x;
        const dy = aircraft.y - gameState.defense.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < closestDistance) {
            closestDistance = distance;
            closestAircraft = aircraft;
        }
    });
    
    if (closestAircraft) {
        // Cyber attack deals damage and disrupts systems
        const damage = Math.min(200, closestAircraft.health - 50);
        closestAircraft.health -= damage;
        closestAircraft.damageState = Math.min(1, closestAircraft.damageState + 0.5);
        closestAircraft.engineHealth -= 30;
        closestAircraft.wingHealth -= 20;
        
        // Cyber explosion
        gameState.cyberExplosions.push(new Explosion(
            closestAircraft.x,
            closestAircraft.y,
            40,
            'cyber'
        ));
        
        showNotification(`CYBER ATTACK SUCCESSFUL -${damage}`, 'cyber');
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
        cyberButton.textContent = 'CYBER ATTACK';
        cyberButton.disabled = gameState.planes.length === 0;
    }
}

function updateGame() {
    if (!gameRunning || gamePaused) return;
    
    gameState.gameTime++;
    
    // Update spawn timers
    if (gameState.enemySpawnTimer > 0) {
        gameState.enemySpawnTimer--;
    }
    
    if (gameState.spawnTimer > 0 && !gameState.waveActive) {
        gameState.spawnTimer--;
        updateSpawnTimer();
    }
    
    // Start new wave if timer expired
    if (!gameState.waveActive && gameState.spawnTimer <= 0 && gameState.waitingForNewWave) {
        startNewWave();
        gameState.waitingForNewWave = false;
    }
    
    // Spawn aircraft during active wave
    if (gameState.waveActive) {
        spawnAircraft();
        updateSpawnTimer();
        
        // Check if wave is complete
        if (gameState.enemiesSpawnedThisWave >= gameState.totalEnemiesThisWave && gameState.planes.length === 0) {
            endWave();
        }
    }
    
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
    
    // Update aircraft
    for (let i = gameState.planes.length - 1; i >= 0; i--) {
        const aircraft = gameState.planes[i];
        aircraft.update();
        
        // Check if aircraft is destroyed
        if (aircraft.health <= 0 || aircraft.fuel <= 0) {
            // Large explosion for bombers
            const explosionType = aircraft.type === 'BOMBER' ? 'large' : 'normal';
            gameState.explosions.push(new Explosion(
                aircraft.x,
                aircraft.y,
                aircraft.type === 'BOMBER' ? 50 : 40,
                explosionType
            ));
            
            showNotification(`${aircraft.type} DESTROYED! +${aircraft.config.scoreValue}`, 'cyber');
            gameState.planesDestroyed++;
            gameState.score += aircraft.config.scoreValue;
            gameState.planes.splice(i, 1);
            
            updateStatsDisplay();
            updateScoreDisplay();
            updateEnemyDisplay();
            continue;
        }
        
        // Check if aircraft escapes
        if (aircraft.x < -200) {
            gameState.planes.splice(i, 1);
            showNotification('TARGET ESCAPED', 'warning');
            updateEnemyDisplay();
            continue;
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
        
        // Check missile-aircraft collision
        for (let j = gameState.planes.length - 1; j >= 0; j--) {
            const aircraft = gameState.planes[j];
            const dx = aircraft.x - m.x;
            const dy = aircraft.y - m.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist < aircraft.config.size + m.size) {
                aircraft.health -= gameState.defense.damage;
                aircraft.damageState = Math.min(1, aircraft.damageState + 0.2);
                aircraft.lastDamageTime = gameState.gameTime;
                
                // Critical hit chance
                if (Math.random() < 0.1) {
                    aircraft.engineHealth -= 30;
                    showNotification('CRITICAL HIT!', 'warning');
                }
                
                gameState.explosions.push(new Explosion(m.x, m.y, 20, 'normal'));
                gameState.missiles.splice(i, 1);
                gameState.score += 10;
                updateScoreDisplay();
                break;
            }
        }
        
        // Check missile-enemy missile collisions
        for (let j = gameState.enemyMissiles.length - 1; j >= 0; j--) {
            const enemyMissile = gameState.enemyMissiles[j];
            const dx = enemyMissile.x - m.x;
            const dy = enemyMissile.y - m.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist < enemyMissile.size + m.size) {
                gameState.explosions.push(new Explosion(m.x, m.y, 15, 'normal'));
                gameState.explosions.push(new Explosion(enemyMissile.x, enemyMissile.y, 20, 'normal'));
                gameState.missiles.splice(i, 1);
                gameState.enemyMissiles.splice(j, 1);
                gameState.score += 50;
                updateScoreDisplay();
                showNotification('MISSILE INTERCEPTED!', 'cyber');
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
        
        // Check collision with defense
        const dx = gameState.defense.x - m.x;
        const dy = gameState.defense.y - m.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < 35 + m.size) {
            gameState.defense.health -= m.damage;
            gameState.explosions.push(new Explosion(m.x, m.y, 35, 'large'));
            gameState.enemyMissiles.splice(i, 1);
            
            updateHealthDisplay();
            showNotification(`DIRECT HIT! -${m.damage}`, 'warning');
            
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
    
    // Draw aircraft
    gameState.planes.forEach(aircraft => aircraft.draw());
    
    // Draw missiles
    gameState.missiles.forEach(m => m.draw());
    
    // Draw enemy missiles
    gameState.enemyMissiles.forEach(m => {
        let color;
        if (m.type === 'BOMBER') {
            color = '#ff8844';
        } else if (m.type === 'ATTACK') {
            color = '#ffaa44';
        } else {
            color = '#ff5555';
        }
        ctx.fillStyle = color;
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
    
    gameOverMessage.textContent = "ENEMY AIR FORCE HAS PENETRATED THE RADAR SYSTEMS";
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
        showNotification('MISSION PAUSED', 'warning');
    } else {
        showNotification('MISSION RESUMED', 'cyber');
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
    // Target priority keys
    if (e.code === 'Digit1') {
        showNotification('PRIORITY: FIGHTERS', 'cyber');
    }
    if (e.code === 'Digit2') {
        showNotification('PRIORITY: BOMBERS', 'cyber');
    }
    if (e.code === 'Digit3') {
        showNotification('PRIORITY: ALL TARGETS', 'cyber');
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
