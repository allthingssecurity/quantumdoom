/*
 * Quantum Doom - Phaser UI Module
 * Enhanced minimap and UI using Phaser 3
 */

// Ensure qd namespace exists
if (typeof qd === 'undefined') {
    var qd = {};
}

qd.PhaserUI = {
    game: null,
    scene: null,
    tileSize: 8,
    mapWidth: 32,
    mapHeight: 20,

    // Tile colors/types
    TILE_FLOOR: 0,
    TILE_WALL1: 1,
    TILE_WALL2: 2,
    TILE_WALL3: 3,
    TILE_WALL4: 4,

    init: function (containerId, mapData) {
        var self = this;

        // Calculate dimensions
        this.mapWidth = mapData[0].length;
        this.mapHeight = mapData.length;

        var config = {
            type: Phaser.AUTO,
            width: this.mapWidth * this.tileSize,
            height: this.mapHeight * this.tileSize,
            parent: containerId,
            backgroundColor: '#000000',
            pixelArt: true,
            // IMPORTANT: Disable all input to prevent keyboard conflicts
            input: {
                keyboard: false,
                mouse: false,
                touch: false,
                gamepad: false
            },
            // Disable audio
            audio: {
                noAudio: true
            },
            scene: {
                preload: function () { self.preload(this); },
                create: function () { self.create(this, mapData); },
                update: function () { self.update(this); }
            }
        };

        // Destroy existing game if any
        if (this.game) {
            this.game.destroy(true);
        }

        this.game = new Phaser.Game(config);
    },

    preload: function (scene) {
        this.scene = scene;

        // Create tileset texture programmatically
        var graphics = scene.make.graphics({ x: 0, y: 0, add: false });
        var tileSize = this.tileSize;

        // Draw tiles: 5 tiles (floor, wall1, wall2, wall3, wall4)
        // Floor tile (dark)
        graphics.fillStyle(0x1a1a2e, 1);
        graphics.fillRect(0, 0, tileSize, tileSize);

        // Wall 1 tile (gray)
        graphics.fillStyle(0x4a4a5a, 1);
        graphics.fillRect(tileSize, 0, tileSize, tileSize);
        graphics.fillStyle(0x3a3a4a, 1);
        graphics.fillRect(tileSize + 1, 1, tileSize - 2, tileSize - 2);

        // Wall 2 tile (orange/brown)
        graphics.fillStyle(0x8b4513, 1);
        graphics.fillRect(tileSize * 2, 0, tileSize, tileSize);
        graphics.fillStyle(0x6b3503, 1);
        graphics.fillRect(tileSize * 2 + 1, 1, tileSize - 2, tileSize - 2);

        // Wall 3 tile (wood)
        graphics.fillStyle(0x8B7355, 1);
        graphics.fillRect(tileSize * 3, 0, tileSize, tileSize);
        graphics.fillStyle(0x6B5335, 1);
        graphics.fillRect(tileSize * 3 + 1, 1, tileSize - 2, tileSize - 2);

        // Wall 4 tile (stone)
        graphics.fillStyle(0x708090, 1);
        graphics.fillRect(tileSize * 4, 0, tileSize, tileSize);
        graphics.fillStyle(0x506070, 1);
        graphics.fillRect(tileSize * 4 + 1, 1, tileSize - 2, tileSize - 2);

        graphics.generateTexture('tiles', tileSize * 5, tileSize);
        graphics.destroy();

        // Create player marker texture
        var playerGraphics = scene.make.graphics({ x: 0, y: 0, add: false });
        playerGraphics.fillStyle(0x00ffff, 1);
        playerGraphics.fillTriangle(4, 0, 0, 8, 8, 8);
        playerGraphics.generateTexture('player', 9, 9);
        playerGraphics.destroy();

        // Create enemy marker textures
        var enemyGraphics = scene.make.graphics({ x: 0, y: 0, add: false });
        // Cap Man (magenta)
        enemyGraphics.fillStyle(0xff00ff, 1);
        enemyGraphics.fillCircle(3, 3, 3);
        enemyGraphics.generateTexture('enemy_capman', 7, 7);
        // Blue Shirt (cyan)
        enemyGraphics.clear();
        enemyGraphics.fillStyle(0x00bfff, 1);
        enemyGraphics.fillCircle(3, 3, 3);
        enemyGraphics.generateTexture('enemy_blueshirt', 7, 7);
        // Yadav (green)
        enemyGraphics.clear();
        enemyGraphics.fillStyle(0x00ff00, 1);
        enemyGraphics.fillCircle(3, 3, 3);
        enemyGraphics.generateTexture('enemy_yadav', 7, 7);
        // Treasure (gold)
        enemyGraphics.clear();
        enemyGraphics.fillStyle(0xffd700, 1);
        enemyGraphics.fillRect(1, 1, 5, 5);
        enemyGraphics.generateTexture('treasure', 7, 7);
        enemyGraphics.destroy();
    },

    create: function (scene, mapData) {
        this.scene = scene;

        // Create tilemap from map data
        var map = scene.make.tilemap({
            data: mapData,
            tileWidth: this.tileSize,
            tileHeight: this.tileSize
        });

        var tileset = map.addTilesetImage('tiles', 'tiles', this.tileSize, this.tileSize, 0, 0);
        var layer = map.createLayer(0, tileset, 0, 0);

        this.layer = layer;
        this.map = map;

        // Create player marker
        this.playerMarker = scene.add.image(0, 0, 'player');
        this.playerMarker.setOrigin(0.5, 0.5);
        this.playerMarker.setDepth(100);

        // Create enemy markers container
        this.enemyMarkers = scene.add.group();

        // Create field of view graphics
        this.fovGraphics = scene.add.graphics();
        this.fovGraphics.setDepth(50);

        // Add border
        var borderGraphics = scene.add.graphics();
        borderGraphics.lineStyle(2, 0x00ffff, 0.8);
        borderGraphics.strokeRect(0, 0, this.mapWidth * this.tileSize, this.mapHeight * this.tileSize);
        borderGraphics.setDepth(200);

        // Add glow effect
        this.glowGraphics = scene.add.graphics();
        this.glowGraphics.lineStyle(4, 0x00ffff, 0.2);
        this.glowGraphics.strokeRect(-2, -2, this.mapWidth * this.tileSize + 4, this.mapHeight * this.tileSize + 4);
    },

    update: function (scene) {
        if (!qd.main || !qd.main.controller || !qd.main.controller._state) {
            return;
        }

        var state = qd.main.controller._state;
        var player = state.player;

        if (!player) return;

        // Update player position and rotation
        var px = player.x * this.tileSize;
        var py = player.y * this.tileSize;
        this.playerMarker.setPosition(px, py);
        this.playerMarker.setRotation(player.rot + Math.PI / 2);

        // Draw field of view cone
        this.fovGraphics.clear();
        this.fovGraphics.fillStyle(0x00ffff, 0.15);

        var fov = Math.PI / 3; // 60 degrees
        var viewDistance = 80;

        this.fovGraphics.beginPath();
        this.fovGraphics.moveTo(px, py);

        var leftAngle = player.rot - fov / 2;
        var rightAngle = player.rot + fov / 2;

        // Draw arc
        for (var a = leftAngle; a <= rightAngle; a += 0.1) {
            var vx = px + Math.cos(a) * viewDistance;
            var vy = py + Math.sin(a) * viewDistance;
            this.fovGraphics.lineTo(vx, vy);
        }

        this.fovGraphics.closePath();
        this.fovGraphics.fillPath();

        // Update enemy markers
        this.updateEnemyMarkers();
    },

    updateEnemyMarkers: function () {
        if (!qd.sprites) return;

        // Clear old markers
        this.enemyMarkers.clear(true, true);

        for (var id in qd.sprites) {
            var sprite = qd.sprites[id];
            if (!sprite._state) continue;

            var x = sprite._state.x * this.tileSize;
            var y = sprite._state.y * this.tileSize;

            // Determine marker type
            var texture = 'enemy_capman';
            if (id.indexOf('blueshirt') === 0) {
                texture = 'enemy_blueshirt';
            } else if (id.indexOf('yadav') === 0) {
                texture = 'enemy_yadav';
            } else if (id.indexOf('pickup') === 0) {
                if (sprite.type === 'treasure') {
                    texture = 'treasure';
                } else {
                    continue; // Skip health/ammo pickups
                }
            } else if (id.indexOf('proj_') === 0) {
                continue; // Skip projectiles
            } else if (id.indexOf('capman') !== 0) {
                continue; // Skip unknown types
            }

            // Check if dead
            var isDead = sprite._dead === true || (typeof sprite.isDead === 'function' && sprite.isDead());
            if (isDead && id.indexOf('pickup') !== 0) continue;

            var marker = this.scene.add.image(x, y, texture);
            marker.setOrigin(0.5, 0.5);
            marker.setDepth(75);

            // Add pulsing effect for enemies
            if (id.indexOf('pickup') !== 0) {
                this.scene.tweens.add({
                    targets: marker,
                    alpha: 0.5,
                    duration: 500,
                    yoyo: true,
                    repeat: -1
                });
            }

            this.enemyMarkers.add(marker);
        }
    },

    // Reinitialize with new map
    updateMap: function (mapData) {
        if (this.game) {
            this.game.destroy(true);
            this.game = null;
        }

        // Small delay to ensure cleanup
        var self = this;
        setTimeout(function () {
            self.init('phaser-minimap', mapData);
        }, 100);
    }
};
