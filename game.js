const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const radarCanvas = document.getElementById('radarCanvas');
const radarCtx = radarCanvas.getContext('2d');
const cyberButton = document.getElementById('cyberButton');
const notification = document.getElementById('notification');

// Canvas setup
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
const enemyCountEl = document.getElementById('enemyCount');
const airSuperiorityEl = document.getElementById('airSuperiority');
const radarStatusEl = document.getElementById('radarStatus');
const scoreDisplay = document.getElementById('scoreValue');
const spawnTimer = document.getElementById('timerValue');
const waveValueEl = document.getElementById('waveValue');

// Game State - MODIFIED: Increased spawn rates and enemy limits
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
    cyberAttackInterval: 180, // Reduced from 300 for more frequent cyber attacks
    cyberAttacksUsed: 0,
    dayNightCycle: 0.5,
    buildings: [],
    spawnTimer: 0,
    spawnInterval: 1200, // Reduced from 1800 for faster waves
    wave: 1,
    enemyLimit: 6, // Increased from 4
    maxEnemiesInWave: 12, // Increased from 8
    waveActive: false,
    enemySpawnRate: 45, // Reduced from 90 for faster enemy spawning
    enemySpawnTimer: 0,
    totalEnemiesThisWave: 0,
    enemiesSpawnedThisWave: 0,
    waitingForNewWave: true
};

// Initialize game
function initGame() {
    console.log("Initializing game...");
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
    showNotification('DEFENSE SYSTEMS ONLINE - PRESS C FOR CYBER ATTACK', 'cyber');
    
    console.log("Game initialized successfully");
}

// Initialize buildings
function initBuildings() {
    gameState.buildings = [];
    
    for (let layer = 0; layer < 3; layer++) {
        const buildingCount = 8 - layer * 2;
        for (let i = 0; i < buildingCount; i++) {
            const x = (i * (100 - layer * 20)) + Math.random() * 50;
            const width = 20 + Math.random() * (40 - layer * 10);
            const height = 80 + Math.random() * (150 - layer * 40);
            const grayValue = 30 + layer * 15 + Math.random() * 30;
            
            gameState.buildings.push({
                x: x,
                width: width,
                height: height,
                color: `rgb(${grayValue}, ${grayValue}, ${grayValue})`,
                layer: layer,
                parallax: 0.7 + layer * 0.1
            });
        }
    }
}

// Draw buildings
function drawBuildings() {
    const sortedBuildings = [...gameState.buildings].sort((a, b) => a.layer - b.layer);
    
    sortedBuildings.forEach(building => {
        const baseY = canvas.height - 100;
        const buildingY = baseY - building.height;
        const parallaxX = building.x * building.parallax;
        
        const time = gameState.dayNightCycle;
        let brightness = 0.25;
        if (time < 0.25 || time > 0.75) brightness = 0.15;
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
    } else {
        healthBar.classList.remove('danger');
    }
}

function updateHeatDisplay() {
    const heatPercent = (gameState.defense.heat / gameState.defense.maxHeat) * 100;
    const heatFillElement = document.getElementById('heatFill');
    heatFillElement.style.width = heatPercent + '%';
    
    if (gameState.defense.heat > gameState.defense.overheatThreshold) {
        heatFillElement.style.background = '#ff4444';
    } else {
        heatFillElement.style.background = '#ff8a8a';
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

// Aircraft class - MODIFIED: Adjusted speed and health for better balance
class Aircraft {
    constructor(type) {
        this.type = type;
        this.health = type === 'BOMBER' ? 500 : 350; // Reduced health slightly
        this.x = canvas.width + 100 + Math.random() * 200;
        this.y = 50 + Math.random() * 300;
        this.vx = -(type === 'BOMBER' ? 1.8 : 3.0); // Increased speed
        this.vy = 0;
        this.size = type === 'BOMBER' ? 35 : 25;
        this.color = type === 'BOMBER' ? '#cc8844' : '#ff4444';
        this.trail = [];
        this.trailMax = 10;
        this.missilesFired = 0;
        this.maxMissiles = 2;
        this.firingTimer = 0;
        this.fireRate = type === 'BOMBER' ? 160 : 120; // Faster firing
    }
    
    update() {
        this.x += this.vx;
        this.y += this.vy;
        
        // Simple AI: Move toward turret
        const dx = gameState.defense.x - this.x;
        const dy = gameState.defense.y - 100 - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 200) {
            this.vy += dy * 0.006; // More aggressive movement
        }
        
        // Boundary
        this.y = Math.max(40, Math.min(canvas.height - 160, this.y));
        
        // Update trail
        this.trail.push({ x: this.x, y: this.y });
        if (this.trail.length > this.trailMax) {
            this.trail.shift();
        }
        
        // Fire missiles
        this.firingTimer++;
        if (this.firingTimer > this.fireRate && this.missilesFired < this.maxMissiles) {
            if (Math.random() > 0.7 && distance < 400) { // Increased firing chance
                this.fireMissile();
            }
            this.firingTimer = 0;
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
                vx: (dx / dist) * 3.5, // Faster missiles
                vy: (dy / dist) * 3.5,
                size: 8,
                life: 400,
                damage: this.type === 'BOMBER' ? 40 : 30 // Increased damage
            });
            
            this.missilesFired++;
            if (this.type === 'BOMBER') {
                showNotification('BOMB RELEASED!', 'warning');
            } else {
                showNotification('MISSILE INBOUND!', 'warning');
            }
        }
    }
    
    draw() {
        // Draw trail
        ctx.save();
        this.trail.forEach((point, i) => {
            const alpha = i / this.trail.length;
            const size = this.size * 0.3 * alpha;
            
            ctx.fillStyle = `rgba(255, 100, 100, ${alpha * 0.3})`;
            ctx.beginPath();
            ctx.arc(point.x, point.y, size, 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.restore();
        
        // Draw aircraft
        ctx.save();
        ctx.translate(this.x, this.y);
        
        ctx.fillStyle = this.color;
        
        // Body
        if (this.type === 'BOMBER') {
            // Bomber shape
            ctx.beginPath();
            ctx.ellipse(0, 0, this.size * 1.2, this.size * 0.6, 0, 0, Math.PI * 2);
            ctx.fill();
            
            // Wings
            ctx.fillStyle = '#ccaa88';
            ctx.fillRect(-this.size * 0.8, -this.size * 0.8, this.size * 1.6, this.size * 0.15);
            ctx.fillRect(-this.size * 0.8, this.size * 0.65, this.size * 1.6, this.size * 0.15);
        } else {
            // Fighter shape
            ctx.beginPath();
            ctx.moveTo(this.size, 0);
            ctx.lineTo(-this.size * 0.8, this.size * 0.4);
            ctx.lineTo(-this.size, 0);
            ctx.lineTo(-this.size * 0.8, -this.size * 0.4);
            ctx.closePath();
            ctx.fill();
            
            // Wings
            ctx.fillStyle = '#ff6666';
            ctx.fillRect(-this.size * 0.6, -this.size * 0.6, this.size, this.size * 0.1);
            ctx.fillRect(-this.size * 0.6, this.size * 0.5, this.size, this.size * 0.1);
        }
        
        ctx.restore();
        
        // Health bar
        const healthPercent = this.health / (this.type === 'BOMBER' ? 500 : 350);
        const barWidth = this.size * 2;
        ctx.fillStyle = '#222';
        ctx.fillRect(this.x - barWidth/2, this.y - this.size - 15, barWidth, 4);
        ctx.fillStyle = healthPercent > 0.5 ? '#44ff44' : healthPercent > 0.25 ? '#ffff44' : '#ff4444';
        ctx.fillRect(this.x - barWidth/2, this.y - this.size - 15, healthPercent * barWidth, 4);
    }
}

class Missile {
    constructor(fromX, fromY, targetX, targetY) {
        this.x = fromX;
        this.y = fromY;
        const dx = targetX - fromX;
        const dy = targetY - fromY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        this.vx = (dx / dist) * 9; // Faster player missiles
        this.vy = (dy / dist) * 9;
        this.size = 5;
        this.life = 200;
    }
    
    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.life--;
    }
    
    draw() {
        ctx.fillStyle = '#8a8aff';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        
        // Trail
        ctx.fillStyle = 'rgba(138, 138, 255, 0.5)';
        ctx.beginPath();
        ctx.arc(this.x - this.vx * 0.5, this.y - this.vy * 0.5, this.size * 0.7, 0, Math.PI * 2);
        ctx.fill();
    }
}

class Explosion {
    constructor(x, y, size = 25) {
        this.x = x;
        this.y = y;
        this.size = size;
        this.life = 30;
        this.maxLife = 30;
    }

    update() {
        this.life--;
    }

    draw() {
        const alpha = this.life / this.maxLife;
        const currentSize = this.size * (1 - alpha);
        
        ctx.fillStyle = `rgba(255, 150, 50, ${alpha * 0.6})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, currentSize, 0, Math.PI * 2);
        ctx.fill();
        
        // Smaller inner explosion
        ctx.fillStyle = `rgba(255, 100, 0, ${alpha * 0.4})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, currentSize * 0.7, 0, Math.PI * 2);
        ctx.fill();
    }
}

// NEW: Cyber Explosion class for visual feedback
class CyberExplosion extends Explosion {
    constructor(x, y) {
        super(x, y, 60);
        this.life = 40;
        this.maxLife = 40;
    }

    draw() {
        const alpha = this.life / this.maxLife;
        const currentSize = this.size * (1 - alpha * 0.5);
        
        // Outer cyber glow
        ctx.fillStyle = `rgba(100, 200, 255, ${alpha * 0.3})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, currentSize * 1.5, 0, Math.PI * 2);
        ctx.fill();
        
        // Main cyber explosion
        ctx.fillStyle = `rgba(138, 138, 255, ${alpha * 0.7})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, currentSize, 0, Math.PI * 2);
        ctx.fill();
        
        // Inner core
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.9})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, currentSize * 0.3, 0, Math.PI * 2);
        ctx.fill();
    }
}

function spawnAircraft() {
    if (!gameState.waveActive || gameState.enemiesSpawnedThisWave >= gameState.totalEnemiesThisWave) return;
    
    // MODIFIED: More aggressive spawning logic
    if (gameState.enemySpawnTimer <= 0 && gameState.planes.length < gameState.enemyLimit) {
        // Increased bomber chance in later waves
        const bomberChance = Math.min(0.4 + (gameState.wave * 0.05), 0.7);
        const type = Math.random() < bomberChance ? 'BOMBER' : 'FIGHTER';
        
        const aircraft = new Aircraft(type);
        gameState.planes.push(aircraft);
        gameState.enemiesSpawnedThisWave++;
        
        // Faster spawning as wave progresses
        const waveFactor = Math.min(gameState.wave / 10, 2);
        gameState.enemySpawnTimer = Math.max(20, gameState.enemySpawnRate / waveFactor);
        
        if (type === 'BOMBER' && Math.random() > 0.5) {
            showNotification('HEAVY BOMBER DETECTED', 'warning');
        }
    }
}

function startNewWave() {
    if (gameState.waveActive) return;
    
    gameState.waveActive = true;
    // MODIFIED: More enemies per wave, faster progression
    gameState.totalEnemiesThisWave = Math.min(6 + gameState.wave * 1.5, gameState.maxEnemiesInWave);
    gameState.enemiesSpawnedThisWave = 0;
    gameState.enemySpawnTimer = 0;
    
    showNotification(`WAVE ${gameState.wave} - ${gameState.totalEnemiesThisWave} TARGETS INBOUND`, 'warning');
    updateWaveDisplay();
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
        
        radarCtx.fillStyle = aircraft.type === 'BOMBER' ? '#ff8844' : '#ff4444';
        radarCtx.beginPath();
        radarCtx.arc(radarX, radarY, 4, 0, Math.PI * 2);
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

// MODIFIED: Enhanced cyber attack with visual feedback
function launchCyberAttack() {
    if (gameState.cyberAttackCooldown > 0 || gameState.planes.length === 0) {
        if (gameState.cyberAttackCooldown > 0) {
            showNotification('CYBER SYSTEMS CHARGING...', 'warning');
        }
        return;
    }

    gameState.cyberAttacksUsed++;
    
    // Damage all aircraft based on distance from center
    let totalDamage = 0;
    let destroyedCount = 0;
    
    gameState.planes.forEach(aircraft => {
        // Cyber damage: more damage to closer aircraft
        const distanceToCenter = Math.sqrt(
            Math.pow(aircraft.x - canvas.width/2, 2) + 
            Math.pow(aircraft.y - canvas.height/3, 2)
        );
        const distanceFactor = Math.max(0.3, 1 - distanceToCenter / 500);
        const damage = Math.floor(180 * distanceFactor);
        
        const actualDamage = Math.min(damage, aircraft.health);
        aircraft.health -= actualDamage;
        totalDamage += actualDamage;
        
        if (aircraft.health <= 0) {
            destroyedCount++;
        }
        
        // Create mini cyber explosion at each aircraft
        gameState.cyberExplosions.push(new CyberExplosion(aircraft.x, aircraft.y));
    });
    
    // Create main cyber explosion at center
    gameState.cyberExplosions.push(new CyberExplosion(
        canvas.width / 2,
        canvas.height / 3
    ));
    
    // Score calculation
    const scoreBonus = totalDamage * 3 + destroyedCount * 100;
    gameState.score += scoreBonus;
    gameState.planesDestroyed += destroyedCount;
    
    // Update UI
    updateScoreDisplay();
    updateStatsDisplay();
    updateEnemyDisplay();
    
    // Show notification with results
    if (destroyedCount > 0) {
        showNotification(`CYBER ATTACK! ${destroyedCount} TARGETS DESTROYED +${scoreBonus}`, 'cyber');
    } else if (totalDamage > 0) {
        showNotification(`CYBER ATTACK! -${totalDamage} DAMAGE +${scoreBonus}`, 'cyber');
    } else {
        showNotification('CYBER ATTACK - NO DAMAGE', 'warning');
    }
    
    // Set cooldown
    gameState.cyberAttackCooldown = gameState.cyberAttackInterval;
    updateCyberButton();
    
    // Remove destroyed aircraft
    gameState.planes = gameState.planes.filter(aircraft => aircraft.health > 0);
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
        if (aircraft.health <= 0) {
            gameState.explosions.push(new Explosion(
                aircraft.x,
                aircraft.y,
                aircraft.type === 'BOMBER' ? 40 : 30
            ));
            
            showNotification(`${aircraft.type} DESTROYED! +${aircraft.type === 'BOMBER' ? 400 : 200}`, 'cyber');
            gameState.planesDestroyed++;
            gameState.score += aircraft.type === 'BOMBER' ? 400 : 200;
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
            
            if (dist < aircraft.size + m.size) {
                aircraft.health -= gameState.defense.damage;
                gameState.explosions.push(new Explosion(m.x, m.y, 20));
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
                gameState.explosions.push(new Explosion(m.x, m.y, 15));
                gameState.explosions.push(new Explosion(enemyMissile.x, enemyMissile.y, 20));
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
            gameState.explosions.push(new Explosion(m.x, m.y, 35));
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

function endWave() {
    gameState.waveActive = false;
    gameState.waitingForNewWave = true;
    // MODIFIED: Faster wave progression
    gameState.spawnTimer = Math.max(600, gameState.spawnInterval - (gameState.wave * 30));
    gameState.wave++;
    
    if (gameState.planes.length === 0) {
        showNotification('WAVE CLEARED - PREPARE FOR NEXT ASSAULT', 'cyber');
    }
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
    
    gameOverMessage.textContent = "ENEMY AIR FORCE HAS PENETRATED THE RADAR SYSTEMS";
}

function gameLoop() {
    if (gameRunning) {
        updateGame();
        drawGame();
    }
    requestAnimationFrame(gameLoop);
}

function startGame() {
    console.log("Starting game...");
    document.getElementById('splashScreen').classList.add('hidden');
    document.getElementById('gameContainer').classList.add('active');
    gameRunning = true;
    gamePaused = false;
    initGame();
    updateCyberButton();
    console.log("Game started successfully");
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
    // NEW: C key for cyber attack
    if ((e.code === 'KeyC' || e.key === 'c') && gameRunning) {
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

// NEW: Add keyboard shortcut hint
showNotification('PRESS C FOR CYBER ATTACK | SPACE TO FIRE | ESC TO PAUSE', 'cyber');

// Initialize and start game
console.log("Script loaded, initializing...");
initGame();
gameLoop();
