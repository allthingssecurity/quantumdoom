/*
 * Quantum Doom - Main Game Logic
 * A 3D shooter that teaches Quantum Physics concepts!
 */

if (typeof qd === 'undefined') {
    var qd = {};
}

// Screen constants
qd.SCREEN_ID = "screen";
qd.MINIMAP_ID = "minimap";
qd.SCREEN_WIDTH = 640;
qd.SCREEN_HEIGHT = 400;

// Sprite lookup
qd.sprites = {};

// Player reference
qd.player = undefined;

// Game stats and state
qd.game = {
    stats: {
        latestMap: 1,
        capManKills: 0,
        blueShirtKills: 0,
        yadavKills: 0,
        conceptsLearned: 0,
        treasuresCollected: 0,
        startTime: undefined
    },
    lives: 3,
    maxLives: 3,
    controller: null,
    isRunning: false
};

// Pickup items storage
qd.pickups = {};

// Main game object
qd.main = {

    init: function () {
        "use strict";

        var screen = ge.$(qd.SCREEN_ID);
        var height = Math.min(window.innerHeight - 100, 500);
        var width = height * (qd.SCREEN_WIDTH / qd.SCREEN_HEIGHT);

        screen.width = qd.SCREEN_WIDTH;
        screen.height = qd.SCREEN_HEIGHT;
        screen.style.width = width + "px";
        screen.style.height = height + "px";

        // Show intro/start screen
        qd.main.showStartScreen();
    },

    showStartScreen: function () {
        "use strict";

        var overlay = document.getElementById('message-overlay');
        overlay.classList.remove('hidden');

        function startGame() {
            // Resume audio context on first user interaction
            if (window.SoundFX && window.SoundFX.audioContext) {
                window.SoundFX.audioContext.resume();
            }

            document.onkeydown = null;
            overlay.removeEventListener('click', startGame);
            overlay.removeEventListener('touchend', startGame);
            overlay.classList.add('hidden');
            qd.main.initEngine();
        }

        document.onkeydown = function (e) {
            e = e || window.event;
            if (e.keyCode === 32) { // Space
                startGame();
            }
        };

        // Touch support for mobile
        overlay.addEventListener('click', startGame);
        overlay.addEventListener('touchend', function (e) {
            e.preventDefault();
            startGame();
        });
    },

    initEngine: function () {
        "use strict";

        // Check if there are more maps
        if (qd.scene["map" + qd.game.stats.latestMap] === undefined) {
            qd.main.gameFinished();
            return;
        }

        // Show stage transition
        qd.main.showStageTransition(qd.game.stats.latestMap);

        setTimeout(function () {
            qd.main.start();
        }, 2000);
    },

    showStageTransition: function (stageNum) {
        "use strict";

        var existing = document.getElementById('stage-transition');
        if (existing) existing.remove();

        var div = document.createElement('div');
        div.className = 'stage-transition';
        div.id = 'stage-transition';
        div.innerHTML = '<h1>STAGE ' + stageNum + '</h1>';
        document.body.appendChild(div);

        document.getElementById('stage-number').textContent = stageNum;

        setTimeout(function () {
            var el = document.getElementById('stage-transition');
            if (el) el.remove();
        }, 2000);
    },

    start: function () {
        "use strict";

        if (qd.game.stats.startTime === undefined) {
            qd.game.stats.startTime = new Date().getTime();
        }

        qd.sprites = {};
        qd.game.stageClearing = false;
        qd.player = new qd.Player();

        var height = Math.min(window.innerHeight - 100, 500);
        var width = height * (qd.SCREEN_WIDTH / qd.SCREEN_HEIGHT);

        // Use generated wall texture
        var wallTexture = window.generatedSprites ? window.generatedSprites.walls : "img/walls.png";

        var controller = new ge.MainController(qd.SCREEN_ID, qd.MINIMAP_ID, {
            screenWidth: qd.SCREEN_WIDTH,
            screenHeight: qd.SCREEN_HEIGHT,
            screenElementWidth: width,
            screenElementHeight: height,
            wallTextureAtlas: wallTexture,
            wallTextureMapping: {
                "1": [0, 0],
                "2": [64, 0],
                "3": [128, 0],
                "4": [192, 0],
                "5": [0, 64],
                "6": [64, 64],
                "7": [128, 64],
                "8": [192, 64]
            },
            minimapScale: 6,
            ceilingSolidColor: "#1a1a2e",
            floorSolidColor: "#2a2a3e",
            stripWidth: 2,
            fov: 60 * Math.PI / 180,
            drawHandler: ge.bind(qd.player.draw, qd.player),
            eventHandler: qd.player
        });

        qd.player._controller = controller;
        qd.main.controller = controller;
        qd.game.controller = controller;
        qd.game.isRunning = true;

        var scene = qd.scene["map" + qd.game.stats.latestMap];

        // Create Cap Man enemies
        for (var i = 0; i < scene.capmen.length; i++) {
            var capman = scene.capmen[i];
            for (var j = 0; j < capman[0]; j++) {
                var id = "capman" + i + "-" + j;
                var offsetX = (Math.random() - 0.5);
                var offsetY = (Math.random() - 0.5);
                qd.sprites[id] = new qd.CapMan(id, capman[1] + 0.5 + offsetX, capman[2] + 0.5 + offsetY, controller);
            }
        }

        // Create Blue Shirt enemies
        for (i = 0; i < scene.blueshirts.length; i++) {
            var blueshirt = scene.blueshirts[i];
            var bsId = "blueshirt" + i;
            qd.sprites[bsId] = new qd.BlueShirt(bsId, blueshirt[0] + 0.5, blueshirt[1] + 0.5, controller);
        }

        // Create Yadav enemies
        if (scene.yadavs) {
            for (i = 0; i < scene.yadavs.length; i++) {
                var yadav = scene.yadavs[i];
                for (var k = 0; k < yadav[0]; k++) {
                    var yadavId = "yadav" + i + "-" + k;
                    var offsetX = (Math.random() - 0.5);
                    var offsetY = (Math.random() - 0.5);
                    qd.sprites[yadavId] = new qd.Yadav(yadavId, yadav[1] + 0.5 + offsetX, yadav[2] + 0.5 + offsetY, controller);
                }
            }
        }

        // Create pickups (health, ammo, treasures)
        qd.pickups = {};
        if (scene.pickups) {
            for (i = 0; i < scene.pickups.length; i++) {
                var pickupData = scene.pickups[i];
                var pickupId = "pickup" + i;
                var pickup = new qd.Pickup(pickupId, pickupData.x, pickupData.y, pickupData.type, pickupData.concept, controller);
                qd.pickups[pickupId] = {
                    x: pickupData.x,
                    y: pickupData.y,
                    type: pickupData.type,
                    concept: pickupData.concept,
                    collected: false,
                    sprite: pickup
                };
            }
        }

        // Calculate totals for HUD
        var totalCapMan = 0;
        for (i = 0; i < scene.capmen.length; i++) {
            totalCapMan += scene.capmen[i][0];
        }
        qd.game.stats.totalCapMan = totalCapMan;

        var totalBlueShirt = scene.blueshirts.length;
        qd.game.stats.totalBlueShirt = totalBlueShirt;

        var totalYadav = 0;
        if (scene.yadavs) {
            for (i = 0; i < scene.yadavs.length; i++) {
                totalYadav += scene.yadavs[i][0];
            }
        }
        qd.game.stats.totalYadav = totalYadav;

        var totalTreasures = 0;
        if (scene.pickups) {
            for (i = 0; i < scene.pickups.length; i++) {
                if (scene.pickups[i].type === 'treasure') {
                    totalTreasures++;
                }
            }
        }
        qd.game.stats.totalTreasures = totalTreasures;

        controller.start(scene.map, {
            x: 2.5,
            y: 2.5,
            rot: 0,
            moveSpeed: 0.18
        });

        qd.main.updateHUD();
    },

    updateHUD: function () {
        "use strict";

        document.getElementById('cap-kills').textContent = qd.game.stats.capManKills + " / " + (qd.game.stats.totalCapMan || 0);
        document.getElementById('blue-kills').textContent = qd.game.stats.blueShirtKills + " / " + (qd.game.stats.totalBlueShirt || 0);

        var yadavEl = document.getElementById('yadav-kills');
        if (yadavEl) {
            yadavEl.textContent = qd.game.stats.yadavKills + " / " + (qd.game.stats.totalYadav || 0);
        }

        var treasureEl = document.getElementById('treasure-count');
        if (treasureEl) {
            treasureEl.textContent = qd.game.stats.treasuresCollected + " / " + (qd.game.stats.totalTreasures || 0);
        }

        // Backup win check: if HUD shows all enemies killed, trigger stage clear
        var totalEnemies = (qd.game.stats.totalCapMan || 0) + (qd.game.stats.totalBlueShirt || 0) + (qd.game.stats.totalYadav || 0);
        var totalKills = qd.game.stats.capManKills + qd.game.stats.blueShirtKills + qd.game.stats.yadavKills;
        if (totalEnemies > 0 && totalKills >= totalEnemies && !qd.game.stageClearing) {
            console.log('Backup win check triggered! Kills:', totalKills, 'Total:', totalEnemies);
            qd.main.checkWin();
        }

        var livesDisplay = document.getElementById('lives-display');
        var hearts = '';
        for (var i = 0; i < qd.game.maxLives; i++) {
            if (i < qd.game.lives) {
                hearts += '<span class="life-icon">❤️</span>';
            } else {
                hearts += '<span class="life-icon lost">💔</span>';
            }
        }
        livesDisplay.innerHTML = hearts;
    },

    updateHealth: function (health) {
        "use strict";

        var fill = document.getElementById('health-fill');
        var text = document.getElementById('health-text');

        health = Math.max(0, Math.min(100, health));
        fill.style.width = health + '%';
        text.textContent = Math.floor(health);

        fill.classList.remove('medium', 'low');
        if (health <= 40) {
            fill.classList.add('low');
        } else if (health <= 75) {
            fill.classList.add('medium');
        }
    },

    updateAmmo: function (ammo) {
        "use strict";
        var ammoEl = document.getElementById('ammo-count');
        if (ammoEl) {
            ammoEl.textContent = ammo;
            ammoEl.classList.remove('low');
            if (ammo <= 5) {
                ammoEl.classList.add('low');
            }
        }
    },

    showPickupMessage: function (message, color) {
        "use strict";
        var msg = document.createElement('div');
        msg.className = 'pickup-message';
        msg.textContent = message;
        msg.style.color = color || '#FFFFFF';
        document.body.appendChild(msg);

        setTimeout(function () {
            msg.classList.add('fade-out');
            setTimeout(function () { msg.remove(); }, 500);
        }, 1500);
    },

    showQuantumConcept: function (concept) {
        "use strict";
        var overlay = document.createElement('div');
        overlay.className = 'quantum-concept-overlay';
        overlay.innerHTML =
            '<div class="quantum-concept-content">' +
            '<h2>🔮 QUANTUM TREASURE!</h2>' +
            '<h3>' + (concept ? concept.title : 'Unknown Concept') + '</h3>' +
            '<p>' + (concept ? concept.description : 'A mysterious quantum phenomenon!') + '</p>' +
            '</div>';
        document.body.appendChild(overlay);

        setTimeout(function () {
            overlay.classList.add('fade-out');
            setTimeout(function () { overlay.remove(); }, 500);
        }, 3000);
    },

    checkWin: function () {
        "use strict";

        // Prevent multiple calls during transition
        if (qd.game.stageClearing) {
            return;
        }

        var aliveCount = 0;
        var totalCount = 0;

        for (var id in qd.sprites) {
            // Only count enemies (CapMan, BlueShirt, and Yadav)
            if (id.indexOf("capman") !== 0 && id.indexOf("blueshirt") !== 0 && id.indexOf("yadav") !== 0) {
                continue;
            }

            totalCount++;
            var sprite = qd.sprites[id];

            // Check if dead - try multiple ways
            var isDead = false;
            if (sprite._dead === true) {
                isDead = true;
            } else if (typeof sprite.isDead === 'function' && sprite.isDead()) {
                isDead = true;
            }

            if (!isDead) {
                aliveCount++;
            }
        }

        console.log('checkWin: Enemies remaining:', aliveCount, '/', totalCount);

        if (aliveCount > 0) {
            return;
        }

        // All enemies dead! Start stage transition
        console.log('All enemies defeated! Transitioning to next stage...');
        qd.game.stageClearing = true;

        // Show immediate visual feedback
        var flash = document.getElementById('quantum-flash');
        if (flash) {
            flash.innerHTML = '<div class="concept-title" style="color: #00ff00; font-size: 48px;">STAGE CLEARED!</div>';
            flash.classList.add('active');
        }

        // Stop game and transition
        setTimeout(function () {
            if (qd.main.controller) {
                qd.main.controller.stop();
            }
            qd.main.stageCleared();
        }, 1000);
    },

    stageCleared: function () {
        "use strict";

        console.log('stageCleared called! Moving to next level...');

        // Play victory sound!
        if (window.SoundFX) window.SoundFX.play('stageComplete');

        // Hide quantum flash if active
        var flash = document.getElementById('quantum-flash');
        if (flash) {
            flash.classList.remove('active');
        }

        var existing = document.getElementById('stage-transition');
        if (existing) existing.remove();

        var div = document.createElement('div');
        div.className = 'stage-transition';
        div.id = 'stage-transition';
        div.innerHTML = '<h1>STAGE CLEARED!</h1><p>Loading next level...</p>';
        document.body.appendChild(div);

        setTimeout(function () {
            var el = document.getElementById('stage-transition');
            if (el) el.remove();

            // Reset for new level
            qd.sprites = {};
            qd.game.stageClearing = false;

            // Reset kill counters for the new level
            qd.game.stats.capManKills = 0;
            qd.game.stats.blueShirtKills = 0;
            qd.game.stats.yadavKills = 0;
            qd.game.stats.treasuresCollected = 0;

            // Restore some health
            qd.Player.initial_health = Math.min(100, (qd.player ? qd.player.health : 100) + 25);
            qd.game.stats.latestMap++;

            console.log('Transitioning to map', qd.game.stats.latestMap);

            qd.player = undefined;
            qd.main.initEngine();
        }, 2000);
    },

    playerDied: function () {
        "use strict";

        // Play death sound
        if (window.SoundFX) window.SoundFX.play('death');

        qd.game.lives--;
        qd.main.updateHUD();

        if (qd.game.lives <= 0) {
            qd.main.gameOver();
            return;
        }

        var overlay = document.getElementById('respawn-overlay');
        overlay.classList.remove('hidden');
        document.getElementById('lives-remaining').textContent = 'Lives Remaining: ' + qd.game.lives;

        var countdown = 3;
        var respawnPrompt = overlay.querySelector('.respawn-prompt');

        var countdownInterval = setInterval(function () {
            countdown--;
            if (countdown > 0) {
                respawnPrompt.textContent = 'Respawning in ' + countdown + '...';
            } else {
                clearInterval(countdownInterval);
                overlay.classList.add('hidden');
                qd.main.respawn();
            }
        }, 1000);
    },

    respawn: function () {
        "use strict";

        qd.player.health = 100;
        qd.Player.initial_health = 100;
        qd.main.updateHealth(100);

        if (qd.main.controller && qd.main.controller._state) {
            qd.main.controller._state.player.x = 2.5;
            qd.main.controller._state.player.y = 2.5;
            qd.main.controller._state.player.rot = 0;
        }
    },

    gameOver: function () {
        "use strict";

        if (qd.main.controller) {
            qd.main.controller.stop();
        }
        qd.game.isRunning = false;

        var overlay = document.getElementById('gameover-overlay');
        var content = overlay.querySelector('.gameover-content');
        content.querySelector('h1').textContent = 'GAME OVER';
        content.querySelector('h1').style.color = '#ff0000';
        overlay.classList.remove('hidden');

        document.getElementById('final-cap-kills').textContent = qd.game.stats.capManKills;
        document.getElementById('final-blue-kills').textContent = qd.game.stats.blueShirtKills;
        document.getElementById('concepts-learned').textContent = qd.game.stats.conceptsLearned;

        document.onkeydown = function (e) {
            e = e || window.event;
            if (e.keyCode === 32) {
                document.onkeydown = null;
                qd.main.resetGame();
            }
        };
    },

    resetGame: function () {
        "use strict";

        document.getElementById('gameover-overlay').classList.add('hidden');

        qd.game.stats = {
            latestMap: 1,
            capManKills: 0,
            blueShirtKills: 0,
            conceptsLearned: 0,
            startTime: undefined
        };
        qd.game.lives = 3;
        qd.sprites = {};
        qd.Player.initial_health = 100;

        qd.main.init();
    },

    gameFinished: function () {
        "use strict";

        if (qd.main.controller) {
            qd.main.controller.stop();
        }

        var overlay = document.getElementById('gameover-overlay');
        var content = overlay.querySelector('.gameover-content');
        content.querySelector('h1').textContent = 'YOU WIN!';
        content.querySelector('h1').style.color = '#00ff00';
        overlay.classList.remove('hidden');

        document.getElementById('final-cap-kills').textContent = qd.game.stats.capManKills;
        document.getElementById('final-blue-kills').textContent = qd.game.stats.blueShirtKills;
        document.getElementById('concepts-learned').textContent = qd.game.stats.conceptsLearned;

        document.onkeydown = function (e) {
            e = e || window.event;
            if (e.keyCode === 32) {
                document.onkeydown = null;
                qd.main.resetGame();
            }
        };
    }
};

// Player class
qd.Player = ge.Class.create(ge.default_eventHandler, {

    init: function () {
        "use strict";

        // Use generated gun sprite
        this._gunSprite = new Image();
        if (window.generatedSprites) {
            this._gunSprite.src = window.generatedSprites.gun;
        }

        this._animationOffset = 0;
        this._screenMiddle = qd.SCREEN_WIDTH / 2;
        this._killZoneStart = this._screenMiddle - 50;
        this._killZoneEnd = this._screenMiddle + 50;

        this.health = qd.Player.initial_health;
        this.ammo = qd.Player.initial_ammo;
        this.maxAmmo = 50;

        this.onkeydown = ge.bind(this.onkeydown, this);
    },

    draw: function (ctx, state, sprites) {
        "use strict";

        qd.main.updateHealth(this.health);
        qd.main.updateAmmo(this.ammo);

        // Check for pickup collisions
        this.checkPickups(state);

        // Draw crosshair
        var midY = qd.SCREEN_HEIGHT / 2;
        ctx.strokeStyle = 'rgba(0, 255, 255, 0.9)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(this._screenMiddle - 20, midY);
        ctx.lineTo(this._screenMiddle - 8, midY);
        ctx.moveTo(this._screenMiddle + 8, midY);
        ctx.lineTo(this._screenMiddle + 20, midY);
        ctx.moveTo(this._screenMiddle, midY - 20);
        ctx.lineTo(this._screenMiddle, midY - 8);
        ctx.moveTo(this._screenMiddle, midY + 8);
        ctx.lineTo(this._screenMiddle, midY + 20);
        ctx.stroke();

        // Center dot
        ctx.fillStyle = 'rgba(255, 50, 50, 0.9)';
        ctx.beginPath();
        ctx.arc(this._screenMiddle, midY, 3, 0, Math.PI * 2);
        ctx.fill();

        // Draw gun - centered at bottom
        var gunScale = 3;
        var gunWidth = 64 * gunScale;
        var gunHeight = 64 * gunScale;
        var gunX = (qd.SCREEN_WIDTH - gunWidth) / 2;
        var gunY = qd.SCREEN_HEIGHT - gunHeight + 15;

        if (this._gunSprite.complete && this._gunSprite.naturalWidth > 0) {
            ctx.drawImage(this._gunSprite,
                this._animationOffset, 0,  // Source X, Y
                64, 64,                     // Source width, height
                gunX, gunY,                 // Dest X, Y
                gunWidth, gunHeight);       // Dest width, height
        }

        // Hit flash
        if (this._shotFrom !== undefined) {
            for (var i = sprites.length - 1; i >= 0; i--) {
                if (sprites[i].id === this._shotFrom.id) {
                    var vx = sprites[i].x - state.player.x,
                        vy = sprites[i].y - state.player.y,
                        distance = Math.sqrt(vx * vx + vy * vy);

                    if (Math.ceil(Math.random() * distance) > distance / 3) {
                        var hit = Math.floor(80 / distance);
                        if (this.health <= hit) {
                            this.kill(ctx);
                            return;
                        }
                        this.health -= hit;
                        this._ouch = 10;
                        // Play hurt sound
                        if (window.SoundFX) window.SoundFX.play('hurt');
                    }
                }
            }
            this._shotFrom = undefined;
        }

        // Red flash when hurt
        if (this._ouch !== undefined) {
            ctx.globalAlpha = 0.3;
            ctx.fillStyle = "red";
            ctx.fillRect(0, 0, qd.SCREEN_WIDTH, qd.SCREEN_HEIGHT);
            ctx.globalAlpha = 1;
            this._ouch = this._ouch === 0 ? undefined : this._ouch - 1;
        }

        // Hit detection when firing
        if (this._firing) {
            for (var i = sprites.length - 1; i >= 0; i--) {
                var sprite = sprites[i];

                if (sprite.hitList && sprite.hitList.length > 0) {
                    var x1 = sprite.hitList[0][2];
                    var x2 = x1 + sprite.hitList[0][3];

                    if ((x1 <= this._killZoneEnd && x2 >= this._killZoneStart)) {
                        if (qd.sprites[sprite.id] && !qd.sprites[sprite.id].isDead() && sprite.id.indexOf("proj_") === -1) {
                            qd.sprites[sprite.id].kill();
                            this._firing = false;
                            break;
                        }
                    }
                }
            }
        }
    },

    drawGunFallback: function (ctx, x, y) {
        // Manual gun drawing as fallback
        ctx.fillStyle = '#2C3E50';
        ctx.fillRect(x - 50, y - 30, 100, 45);

        ctx.fillStyle = '#34495E';
        ctx.fillRect(x - 12, y - 70, 24, 50);

        ctx.fillStyle = '#1A1A2E';
        ctx.fillRect(x - 20, y + 10, 40, 35);

        ctx.fillStyle = '#00FFFF';
        ctx.fillRect(x - 45, y - 20, 6, 30);
        ctx.fillRect(x + 39, y - 20, 6, 30);

        // Muzzle flash when firing
        if (this._firing) {
            ctx.fillStyle = 'rgba(255, 200, 50, 0.9)';
            ctx.beginPath();
            ctx.moveTo(x, y - 90);
            ctx.lineTo(x - 30, y - 70);
            ctx.lineTo(x + 30, y - 70);
            ctx.closePath();
            ctx.fill();
        }
    },

    fire: function (state) {
        "use strict";

        if (this._fireInProgress === true) {
            return;
        }

        // Check ammo
        if (this.ammo <= 0) {
            // Play empty click sound or show message
            return;
        }

        this.ammo--;
        this._fireInProgress = true;

        // Play shoot sound!
        if (window.SoundFX) window.SoundFX.play('shoot');

        var self = this;
        var frameCount = 0;
        var maxFrames = 8;

        var fireLoop = function () {
            frameCount++;
            self._animationOffset = frameCount * 64;

            // Firing detection on frames 2-3 (the actual shot)
            if (frameCount >= 2 && frameCount <= 3) {
                if (self._firing === undefined) {
                    self._firing = true;
                }
            } else {
                self._firing = undefined;
            }

            if (frameCount < maxFrames) {
                window.setTimeout(fireLoop, 45);
            } else {
                self._animationOffset = 0;
                self._fireInProgress = undefined;
            }
        };

        fireLoop();
    },

    checkPickups: function (state) {
        "use strict";

        if (!state || !state.player) return;

        var px = state.player.x;
        var py = state.player.y;
        var pickupDist = 0.5; // Distance to pick up items

        // Check each pickup
        for (var id in qd.pickups) {
            var pickup = qd.pickups[id];
            if (pickup.collected) continue;

            var dx = pickup.x - px;
            var dy = pickup.y - py;
            var dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < pickupDist) {
                pickup.collected = true;
                this.collectPickup(pickup);

                // Remove sprite from engine
                if (qd.game.controller) {
                    qd.game.controller.removeSprite(pickup.sprite);
                }
            }
        }
    },

    collectPickup: function (pickup) {
        "use strict";

        if (pickup.type === 'health') {
            this.health = Math.min(100, this.health + 25);
            qd.main.showPickupMessage('+25 HEALTH', '#4CAF50');
            if (window.SoundFX) window.SoundFX.play('pickup');
        } else if (pickup.type === 'ammo') {
            this.ammo = Math.min(this.maxAmmo, this.ammo + 15);
            qd.main.showPickupMessage('+15 AMMO', '#FFC107');
            if (window.SoundFX) window.SoundFX.play('pickup');
        } else if (pickup.type === 'treasure') {
            qd.game.stats.treasuresCollected++;
            qd.game.stats.conceptsLearned++;
            qd.main.showQuantumConcept(pickup.concept);
            if (window.SoundFX) window.SoundFX.play('quantum');
        }

        qd.main.updateHUD();
    },

    onkeydown: function (state, e) {
        "use strict";

        e = e || window.event;
        switch (e.keyCode) {
            case 32: // Space
            case 89: // y
            case 90: // z
                this.fire(state);
                e.preventDefault();
                break;
        }

        this._super(state, e);
    },

    hit: function (sprite) {
        "use strict";
        this._shotFrom = sprite;
    },

    kill: function (ctx) {
        "use strict";
        qd.main.playerDied();
    }
});

qd.Player.initial_health = 100;
qd.Player.initial_ammo = 50;

// Enemy Projectile
qd.Projectile = ge.Class.create(qd.MovingSprite, {
    init: function (id, x, y, rot, controller) {
        "use strict";
        this._dead = false;
        this._controller = controller;

        var spriteAtlas = window.generatedSprites ? window.generatedSprites.projectile : "img/projectile.png";

        this._state = {
            id: id,
            x: x,
            y: y,
            rot: rot,
            spriteAtlas: spriteAtlas,
            isMoving: true,
            drawOnMinimap: false,
            spriteScaleX: 0.5,
            spriteScaleY: 0.5,
            spriteOffsetX: 0,
            spriteWidth: 32,
            spriteHeight: 32,
            speed: 8 // Very Fast! (8 * 0.05 = 0.4 units/tick vs player 0.21)
        };
        controller.addSprite(this._state);

        this.runMove(2000); // Lifetime
    },

    move: function () {
        "use strict";
        if (this._dead) return false;

        // Check collision with player
        var px = this._controller._state.player.x;
        var py = this._controller._state.player.y;
        var dist = Math.sqrt(Math.pow(px - this._state.x, 2) + Math.pow(py - this._state.y, 2));

        if (dist < 0.5) {
            if (qd.player) {
                // Deal damage
                qd.player.health -= 10;
                qd.player._ouch = 10;
                if (window.SoundFX) window.SoundFX.play('hurt');
                if (qd.player.health <= 0) qd.player.kill();
                qd.main.updateHealth(qd.player.health);
            }
            this._dead = true;
            this._controller.removeSprite(this._state);
            if (this._state && this._state.id) delete qd.sprites[this._state.id];
            return false;
        }

        // Simple wall collision check (if speed became 0)
        if (this._state.speed === 0) {
            this._dead = true;
            this._controller.removeSprite(this._state);
            if (this._state && this._state.id) delete qd.sprites[this._state.id];
            return false;
        }

        return true;
    },

    isDead: function () {
        return this._dead;
    },

    kill: function () {
        this._dead = true;
        this._controller.removeSprite(this._state);
        // Also remove from qd.sprites to prevent memory leak
        if (this._state && this._state.id) {
            delete qd.sprites[this._state.id];
        }
    }
});

// Cap Man Enemy
qd.CapMan = ge.Class.create(qd.AnimatedSprite, qd.MovingSprite, {

    init: function (id, x, y, controller) {
        "use strict";

        this._dead = false;
        this._shoot = undefined;
        this._playerAware = false;
        this._controller = controller;

        // Use generated sprite with transparency
        var spriteAtlas = window.generatedSprites ? window.generatedSprites.capman : "img/capman.png";

        this._state = {
            id: id,
            x: x,
            y: y,
            spriteAtlas: spriteAtlas,
            isMoving: true,
            drawOnMinimap: true,
            minimapColor: "#ff00ff",
            spriteScaleX: 0.7,
            spriteScaleY: 0.7,
            spriteOffsetX: 0,
            spriteWidth: 64,
            spriteHeight: 64,
            speed: 1
        };
        controller.addSprite(this._state);

        this.runMove(500 + Math.random() * 500);
    },

    move: function () {
        "use strict";

        if (this._dead) {
            return false;
        }

        var playerSeen = this._state.hitList && this._state.hitList.length !== 0;

        if (!this._playerAware && !playerSeen) {
            this._state.speed = 0;
            return true;
        }

        if (this._playerAware === false) {
            this._playerAware = true;
        }

        var vp_x = this._controller._state.player.x - this._state.x,
            vp_y = this._controller._state.player.y - this._state.y;

        this._state.rot = Math.atan2(vp_y, vp_x);

        if (!playerSeen || this._shoot === undefined) {
            this._state.speed = 0.8;
            // Walking animation: frames 1-4 (offsets 64-256)
            this.runAnimation(64, 256, {
                speed: 150,
                oscillate: true
            });
            this._shoot = true;

        } else {
            this._state.speed = 0;

            var self = this;
            window.setTimeout(function () {
                if (self._dead) return;

                // Spawn projectile
                var projId = "proj_" + self._state.id + "_" + Date.now();
                var proj = new qd.Projectile(
                    projId,
                    self._state.x,
                    self._state.y,
                    self._state.rot,
                    self._controller
                );
                qd.sprites[projId] = proj;

            }, 200);

            // Shooting animation: frames 5-7 (offsets 320-448)
            this.runAnimation(320, 448, {
                speed: 150,
                singlerun: true
            }, ge.bind(function () {
                this._state.spriteOffsetX = 0;
            }, this));

            this._shoot = undefined;
        }

        return !this._dead;
    },

    isDead: function () {
        "use strict";
        return this._dead;
    },

    kill: function () {
        "use strict";

        this._dead = true;
        this._state.speed = 0;
        this._state.isMoving = false;

        // Play kill sound!
        if (window.SoundFX) window.SoundFX.play('kill');

        qd.showQuantumConcept();

        // Death animation: frames 8-13 (offsets 512-832)
        this.runAnimation(512, 832, {
            speed: 120,
            singlerun: true
        });

        qd.game.stats.capManKills++;
        qd.main.updateHUD();

        qd.main.checkWin();
    }
});

// Blue Shirt Enemy
qd.BlueShirt = ge.Class.create(qd.AnimatedSprite, qd.MovingSprite, {

    init: function (id, x, y, controller) {
        "use strict";

        this.id = id;
        this._dead = false;
        this._shoot = undefined;
        this._playerAware = false;

        this._controller = controller;

        // Use generated sprite with transparency
        var spriteAtlas = window.generatedSprites ? window.generatedSprites.blueshirt : "img/blueshirt.png";

        this._state = {
            id: id,
            x: x,
            y: y,
            spriteAtlas: spriteAtlas,
            isMoving: true,
            drawOnMinimap: true,
            minimapColor: "#00ffff",
            spriteScaleX: 0.7,
            spriteScaleY: 0.7,
            spriteOffsetX: 0,
            spriteWidth: 64,
            spriteHeight: 64,
            speed: 0
        };
        controller.addSprite(this._state);

        this.runMove(700 + Math.random() * 500);
    },

    move: function () {
        "use strict";

        if (this._dead) {
            return false;
        }

        var playerSeen = this._state.hitList && this._state.hitList.length !== 0;

        if (!this._playerAware && !playerSeen) {
            this._state.speed = 0;
            return true;
        }

        if (this._playerAware === false) {
            this._playerAware = true;
        }

        var vp_x = this._controller._state.player.x - this._state.x,
            vp_y = this._controller._state.player.y - this._state.y;

        this._state.rot = Math.atan2(vp_y, vp_x);

        if (!playerSeen || this._shoot === undefined) {
            this._state.speed = 0.5;
            // Walking animation: frames 1-4 (offsets 64, 128, 192, 256)
            this.runAnimation(64, 256, {
                speed: 130,
                oscillate: true
            });
            this._shoot = true;

        } else {
            this._state.speed = 0;


            var self = this;
            window.setTimeout(function () {
                if (self._dead) return;

                // Spawn projectile
                var projId = "proj_" + self._state.id + "_" + Date.now();
                var proj = new qd.Projectile(
                    projId,
                    self._state.x,
                    self._state.y,
                    self._state.rot,
                    self._controller
                );
                qd.sprites[projId] = proj;

            }, 200);

            // Shooting animation: frames 5-7 (offsets 320, 384, 448)
            this.runAnimation(320, 448, {
                speed: 150,
                singlerun: true
            }, ge.bind(function () {
                this._state.spriteOffsetX = 0;
            }, this));

            this._shoot = undefined;
        }

        return !this._dead;
    },

    isDead: function () {
        "use strict";
        return this._dead;
    },

    kill: function () {
        "use strict";

        this._dead = true;
        this._state.speed = 0;
        this._state.isMoving = false;

        // Play kill sound!
        if (window.SoundFX) window.SoundFX.play('kill');

        qd.showQuantumConcept();

        qd.game.stats.blueShirtKills++;
        qd.main.updateHUD();

        // Death animation: frames 8-13 (offsets 512-832)
        this.runAnimation(512, 832, {
            speed: 100,
            singlerun: true
        }, ge.bind(function () {
            this._state.spriteOffsetX = 832;
        }, this));

        qd.main.checkWin();
    }
});

// Yadav Enemy (Third enemy type)
qd.Yadav = ge.Class.create(qd.AnimatedSprite, qd.MovingSprite, {

    init: function (id, x, y, controller) {
        "use strict";

        this.id = id;
        this._dead = false;
        this._shoot = undefined;
        this._playerAware = false;

        this._controller = controller;

        // Use generated sprite with transparency
        var spriteAtlas = window.generatedSprites ? window.generatedSprites.yadav : "img/capman.png";

        this._state = {
            id: id,
            x: x,
            y: y,
            spriteAtlas: spriteAtlas,
            isMoving: true,
            drawOnMinimap: true,
            minimapColor: "#00ff00", // Green for Yadav
            spriteScaleX: 0.7,
            spriteScaleY: 0.7,
            spriteOffsetX: 0,
            spriteWidth: 64,
            spriteHeight: 64,
            speed: 1.2 // Slightly faster than other enemies
        };
        controller.addSprite(this._state);

        this.runMove(400 + Math.random() * 400); // Faster movement loop
    },

    move: function () {
        "use strict";

        if (this._dead) return false;

        var px = this._controller._state.player.x;
        var py = this._controller._state.player.y;
        var dist = Math.sqrt(Math.pow(px - this._state.x, 2) + Math.pow(py - this._state.y, 2));

        // Player detection range
        if (dist < 20 && !this._playerAware) {
            this._playerAware = true;
        }

        if (this._playerAware && this._shoot === undefined) {
            // Rotate towards player
            var angle = Math.atan2(py - this._state.y, px - this._state.x);
            this._state.rot = angle;

            // Attack if close enough
            if (dist < 10) {
                this._shoot = true;
                // Attack animation: frames 5-7 (offsets 320-448)
                this.runAnimation(320, 448, { speed: 80, singlerun: true });

                var self = this;
                window.setTimeout(function () {
                    if (self._dead) return;

                    // Spawn projectile
                    var projId = "proj_" + self._state.id + "_" + Date.now();
                    var proj = new qd.Projectile(
                        projId,
                        self._state.x,
                        self._state.y,
                        self._state.rot,
                        self._controller
                    );
                    qd.sprites[projId] = proj;

                }, 150);

                window.setTimeout(function () {
                    if (self._dead) return;
                    self._shoot = undefined;
                }, 600);
            } else {
                // Walk animation: frames 1-4 (offsets 64-256)
                this.runAnimation(64, 256, { speed: 80, oscillate: true });
            }
        }

        if (!this._shoot) {
            this._shoot = undefined;
        }

        return !this._dead;
    },

    isDead: function () {
        "use strict";
        return this._dead;
    },

    kill: function () {
        "use strict";

        this._dead = true;
        this._state.speed = 0;
        this._state.isMoving = false;

        // Play kill sound!
        if (window.SoundFX) window.SoundFX.play('kill');

        qd.showQuantumConcept();

        qd.game.stats.yadavKills++;
        qd.main.updateHUD();

        // Death animation: frames 8-13 (offsets 512-832)
        this.runAnimation(512, 832, {
            speed: 100,
            singlerun: true
        }, ge.bind(function () {
            this._state.spriteOffsetX = 832;
        }, this));

        qd.main.checkWin();
    }
});

// Pickup class for health, ammo, and treasures
qd.Pickup = ge.Class.create({

    init: function (id, x, y, type, concept, controller) {
        "use strict";

        this.id = id;
        this.type = type;
        this.concept = concept;
        this._controller = controller;
        this._animFrame = 0;
        this._animTime = 0;

        // Get sprite URL
        var spriteUrl = "img/capman.png"; // Fallback

        if (window.generatedSprites) {
            if (type === 'health') {
                spriteUrl = window.generatedSprites.health;
            } else if (type === 'ammo') {
                spriteUrl = window.generatedSprites.ammo;
            } else if (type === 'treasure') {
                spriteUrl = window.generatedSprites.treasure;
            }
        }

        // Register with controller
        this._state = controller.registerSprite({
            id: id,
            x: x,
            y: y,
            spriteAtlas: spriteUrl,
            spriteWidth: 64,
            spriteHeight: 64,
            spriteOffsetX: 0,
            spriteScaleX: 1,
            spriteScaleY: 1,
            drawOnMinimap: true,
            minimapColor: type === 'treasure' ? '#00FFFF' : (type === 'health' ? '#FF0000' : '#FFFF00')
        });
    },

    isDead: function () {
        return false; // Pickups don't die, they get collected
    },

    hit: function () {
        // Pickups can't be shot
    },

    update: function () {
        "use strict";

        if (!this._state) return;

        // Animate treasures
        if (this.type === 'treasure') {
            this._animTime++;
            if (this._animTime >= 15) {
                this._animTime = 0;
                this._animFrame = (this._animFrame + 1) % 4;
                this._state.spriteOffsetX = this._animFrame * 64;
            }
        }
    }
});

// Initialize game when DOM is ready
document.addEventListener('DOMContentLoaded', function () {
    // Wait for sprites to be fully generated before starting
    var checkSprites = setInterval(function () {
        if (window.generatedSprites && window.generatedSprites.walls) {
            clearInterval(checkSprites);
            console.log("Sprites ready, starting game...");
            qd.main.init();
        }
    }, 100);
});
