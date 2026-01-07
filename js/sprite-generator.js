/*
 * Sprite Generator - Proper pixel art sprites with aligned heads
 */

var SpriteGen = {

    createCanvas: function (width, height) {
        var canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        var ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = false;
        return { canvas: canvas, ctx: ctx };
    },

    // Generate Cap Man sprite sheet
    generateCapMan: function () {
        var c = this.createCanvas(512, 64);
        var ctx = c.ctx;

        // Walking frames (0-5)
        for (var frame = 0; frame < 6; frame++) {
            var bounce = Math.sin(frame * Math.PI / 3) * 1;
            var legOffset = frame % 2 === 0 ? 2 : -2;
            this.drawCapMan(ctx, frame * 64 + 32, 32, bounce, legOffset, false);
        }

        // Death frames (6-7)
        this.drawCapMan(ctx, 6 * 64 + 32, 32, 0, 0, true, 0.4);
        this.drawCapMan(ctx, 7 * 64 + 32, 32, 0, 0, true, 0.8);

        return c.canvas.toDataURL('image/png');
    },

    // Generate Blue Shirt sprite sheet
    generateBlueShirt: function () {
        var c = this.createCanvas(640, 64);
        var ctx = c.ctx;

        // Idle (0)
        this.drawBlueShirt(ctx, 32, 32, 0, 0, false);

        // Walking (1-4)
        for (var frame = 1; frame <= 4; frame++) {
            var bounce = Math.sin((frame - 1) * Math.PI / 2) * 1;
            var legOffset = (frame - 1) % 2 === 0 ? 2 : -2;
            this.drawBlueShirt(ctx, frame * 64 + 32, 32, bounce, legOffset, false);
        }

        // Shooting (5-7)
        for (var sf = 0; sf < 3; sf++) {
            this.drawBlueShirtShooting(ctx, (5 + sf) * 64 + 32, 32, sf);
        }

        // Death (8-9)
        this.drawBlueShirt(ctx, 8 * 64 + 32, 32, 0, 0, true, 0.4);
        this.drawBlueShirt(ctx, 9 * 64 + 32, 32, 0, 0, true, 0.8);

        return c.canvas.toDataURL('image/png');
    },

    // CAP MAN - White Gandhi cap, brown skin, black mustache, checkered shirt
    drawCapMan: function (ctx, cx, cy, bounce, legOff, dead, deadProgress) {
        if (dead) {
            this.drawDeadCapMan(ctx, cx, cy, deadProgress);
            return;
        }

        bounce = bounce || 0;
        legOff = legOff || 0;
        var armOff = -legOff * 0.5;

        // Center point is at cx, cy (middle of 64x64 frame)
        // Character height: ~50px, so top at cy-25, bottom at cy+25

        // SHADOW
        ctx.fillStyle = 'rgba(0,0,0,0.15)';
        ctx.beginPath();
        ctx.ellipse(cx, cy + 28, 8, 3, 0, 0, Math.PI * 2);
        ctx.fill();

        // LEGS (dark blue pants) - bottom of character
        ctx.fillStyle = '#1A237E';
        ctx.fillRect(cx - 5, cy + 10, 4, 14 + legOff);  // Left leg
        ctx.fillRect(cx + 1, cy + 10, 4, 14 - legOff);  // Right leg

        // SHOES
        ctx.fillStyle = '#2D2D2D';
        ctx.fillRect(cx - 6, cy + 22 + legOff, 5, 4);
        ctx.fillRect(cx, cy + 22 - legOff, 5, 4);

        // BODY (checkered blue shirt) - torso
        ctx.fillStyle = '#64B5F6';
        ctx.fillRect(cx - 7, cy - 4 + bounce, 14, 16);

        // Checkered pattern on shirt
        ctx.fillStyle = '#42A5F5';
        for (var py = 0; py < 4; py++) {
            for (var px = 0; px < 3; px++) {
                if ((px + py) % 2 === 0) {
                    ctx.fillRect(cx - 5 + px * 4, cy - 2 + bounce + py * 4, 3, 3);
                }
            }
        }

        // ARMS
        ctx.fillStyle = '#64B5F6';
        ctx.fillRect(cx - 11, cy - 2 + bounce + armOff, 5, 10);  // Left arm
        ctx.fillRect(cx + 6, cy - 2 + bounce - armOff, 5, 10);   // Right arm

        // HANDS (brown skin)
        ctx.fillStyle = '#A1887F';
        ctx.fillRect(cx - 10, cy + 6 + bounce + armOff, 4, 4);
        ctx.fillRect(cx + 6, cy + 6 + bounce - armOff, 4, 4);

        // HEAD (brown skin) - CENTERED above body
        ctx.fillStyle = '#A1887F';
        ctx.fillRect(cx - 6, cy - 18 + bounce, 12, 14);

        // EYES
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(cx - 4, cy - 14 + bounce, 3, 3);
        ctx.fillRect(cx + 1, cy - 14 + bounce, 3, 3);
        ctx.fillStyle = '#1A1A1A';
        ctx.fillRect(cx - 3, cy - 13 + bounce, 2, 2);
        ctx.fillRect(cx + 2, cy - 13 + bounce, 2, 2);

        // EYEBROWS
        ctx.fillStyle = '#3E2723';
        ctx.fillRect(cx - 4, cy - 15 + bounce, 3, 1);
        ctx.fillRect(cx + 1, cy - 15 + bounce, 3, 1);

        // BLACK MUSTACHE
        ctx.fillStyle = '#1A1A1A';
        ctx.fillRect(cx - 4, cy - 9 + bounce, 8, 2);
        ctx.fillRect(cx - 5, cy - 9 + bounce, 2, 1);
        ctx.fillRect(cx + 3, cy - 9 + bounce, 2, 1);

        // MOUTH
        ctx.fillStyle = '#6D4C41';
        ctx.fillRect(cx - 2, cy - 6 + bounce, 4, 1);

        // WHITE GANDHI CAP - on top of head, CENTERED
        ctx.fillStyle = '#FFFFFF';
        // Cap brim
        ctx.fillRect(cx - 7, cy - 19 + bounce, 14, 3);
        // Triangular cap
        ctx.beginPath();
        ctx.moveTo(cx - 6, cy - 19 + bounce);
        ctx.lineTo(cx, cy - 28 + bounce);
        ctx.lineTo(cx + 6, cy - 19 + bounce);
        ctx.closePath();
        ctx.fill();

        // "KHUJLI" text on cap (blue, tiny pixel font)
        ctx.fillStyle = '#1565C0';
        // K
        ctx.fillRect(cx - 8, cy - 25 + bounce, 1, 4);
        ctx.fillRect(cx - 7, cy - 24 + bounce, 1, 1);
        ctx.fillRect(cx - 6, cy - 25 + bounce, 1, 1);
        ctx.fillRect(cx - 6, cy - 22 + bounce, 1, 1);
        // H
        ctx.fillRect(cx - 4, cy - 25 + bounce, 1, 4);
        ctx.fillRect(cx - 3, cy - 24 + bounce, 1, 1);
        ctx.fillRect(cx - 2, cy - 25 + bounce, 1, 4);
        // U
        ctx.fillRect(cx, cy - 25 + bounce, 1, 4);
        ctx.fillRect(cx + 1, cy - 22 + bounce, 1, 1);
        ctx.fillRect(cx + 2, cy - 25 + bounce, 1, 4);
        // J
        ctx.fillRect(cx + 4, cy - 25 + bounce, 2, 1);
        ctx.fillRect(cx + 5, cy - 25 + bounce, 1, 4);
        ctx.fillRect(cx + 4, cy - 22 + bounce, 1, 1);
    },

    // BLUE SHIRT - Fair skin, gray beard, light blue polo
    drawBlueShirt: function (ctx, cx, cy, bounce, legOff, dead, deadProgress) {
        if (dead) {
            this.drawDeadBlueShirt(ctx, cx, cy, deadProgress);
            return;
        }

        bounce = bounce || 0;
        legOff = legOff || 0;
        var armOff = -legOff * 0.5;

        // SHADOW
        ctx.fillStyle = 'rgba(0,0,0,0.15)';
        ctx.beginPath();
        ctx.ellipse(cx, cy + 28, 8, 3, 0, 0, Math.PI * 2);
        ctx.fill();

        // LEGS (dark gray pants)
        ctx.fillStyle = '#455A64';
        ctx.fillRect(cx - 5, cy + 10, 4, 14 + legOff);
        ctx.fillRect(cx + 1, cy + 10, 4, 14 - legOff);

        // SHOES
        ctx.fillStyle = '#212121';
        ctx.fillRect(cx - 6, cy + 22 + legOff, 5, 4);
        ctx.fillRect(cx, cy + 22 - legOff, 5, 4);

        // BODY (light blue polo)
        ctx.fillStyle = '#B3E5FC';
        ctx.fillRect(cx - 7, cy - 4 + bounce, 14, 16);

        // Collar
        ctx.fillStyle = '#81D4FA';
        ctx.fillRect(cx - 3, cy - 4 + bounce, 6, 3);
        ctx.fillStyle = '#4FC3F7';
        ctx.fillRect(cx - 1, cy - 4 + bounce, 2, 4);

        // ARMS
        ctx.fillStyle = '#B3E5FC';
        ctx.fillRect(cx - 11, cy - 2 + bounce + armOff, 5, 10);
        ctx.fillRect(cx + 6, cy - 2 + bounce - armOff, 5, 10);

        // HANDS (fair skin)
        ctx.fillStyle = '#DDBEA9';
        ctx.fillRect(cx - 10, cy + 6 + bounce + armOff, 4, 4);
        ctx.fillRect(cx + 6, cy + 6 + bounce - armOff, 4, 4);

        // HEAD (fair skin) - CENTERED
        ctx.fillStyle = '#DDBEA9';
        ctx.fillRect(cx - 6, cy - 18 + bounce, 12, 14);

        // HAIR (brown/gray)
        ctx.fillStyle = '#5D4037';
        ctx.fillRect(cx - 6, cy - 20 + bounce, 12, 5);
        ctx.fillRect(cx - 7, cy - 18 + bounce, 2, 4);
        ctx.fillRect(cx + 5, cy - 18 + bounce, 2, 4);

        // Gray streaks in hair
        ctx.fillStyle = '#9E9E9E';
        ctx.fillRect(cx - 4, cy - 19 + bounce, 2, 3);
        ctx.fillRect(cx + 2, cy - 19 + bounce, 2, 3);

        // EYES
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(cx - 4, cy - 13 + bounce, 3, 3);
        ctx.fillRect(cx + 1, cy - 13 + bounce, 3, 3);
        ctx.fillStyle = '#1A1A1A';
        ctx.fillRect(cx - 3, cy - 12 + bounce, 2, 2);
        ctx.fillRect(cx + 2, cy - 12 + bounce, 2, 2);

        // EYEBROWS
        ctx.fillStyle = '#5D4037';
        ctx.fillRect(cx - 4, cy - 14 + bounce, 3, 1);
        ctx.fillRect(cx + 1, cy - 14 + bounce, 3, 1);

        // GRAY BEARD
        ctx.fillStyle = '#757575';
        ctx.fillRect(cx - 5, cy - 8 + bounce, 10, 6);
        ctx.fillRect(cx - 4, cy - 2 + bounce, 8, 2);

        // Beard texture/highlights
        ctx.fillStyle = '#9E9E9E';
        ctx.fillRect(cx - 3, cy - 7 + bounce, 2, 4);
        ctx.fillRect(cx + 1, cy - 7 + bounce, 2, 4);

        // Smile line
        ctx.fillStyle = '#A1887F';
        ctx.fillRect(cx - 2, cy - 6 + bounce, 4, 1);

        // "PAPPU" label above head (red text)
        ctx.fillStyle = '#E53935';
        // P
        ctx.fillRect(cx - 10, cy - 28 + bounce, 1, 4);
        ctx.fillRect(cx - 9, cy - 28 + bounce, 1, 1);
        ctx.fillRect(cx - 9, cy - 26 + bounce, 1, 1);
        ctx.fillRect(cx - 8, cy - 28 + bounce, 1, 2);
        // A
        ctx.fillRect(cx - 6, cy - 28 + bounce, 1, 4);
        ctx.fillRect(cx - 5, cy - 28 + bounce, 1, 1);
        ctx.fillRect(cx - 5, cy - 26 + bounce, 1, 1);
        ctx.fillRect(cx - 4, cy - 28 + bounce, 1, 4);
        // P
        ctx.fillRect(cx - 2, cy - 28 + bounce, 1, 4);
        ctx.fillRect(cx - 1, cy - 28 + bounce, 1, 1);
        ctx.fillRect(cx - 1, cy - 26 + bounce, 1, 1);
        ctx.fillRect(cx, cy - 28 + bounce, 1, 2);
        // P
        ctx.fillRect(cx + 2, cy - 28 + bounce, 1, 4);
        ctx.fillRect(cx + 3, cy - 28 + bounce, 1, 1);
        ctx.fillRect(cx + 3, cy - 26 + bounce, 1, 1);
        ctx.fillRect(cx + 4, cy - 28 + bounce, 1, 2);
        // U
        ctx.fillRect(cx + 6, cy - 28 + bounce, 1, 4);
        ctx.fillRect(cx + 7, cy - 25 + bounce, 1, 1);
        ctx.fillRect(cx + 8, cy - 28 + bounce, 1, 4);
    },

    // Blue Shirt shooting pose
    drawBlueShirtShooting: function (ctx, cx, cy, phase) {
        // SHADOW
        ctx.fillStyle = 'rgba(0,0,0,0.15)';
        ctx.beginPath();
        ctx.ellipse(cx, cy + 28, 8, 3, 0, 0, Math.PI * 2);
        ctx.fill();

        // LEGS
        ctx.fillStyle = '#455A64';
        ctx.fillRect(cx - 5, cy + 10, 4, 14);
        ctx.fillRect(cx + 1, cy + 10, 4, 14);

        // SHOES
        ctx.fillStyle = '#212121';
        ctx.fillRect(cx - 6, cy + 22, 5, 4);
        ctx.fillRect(cx, cy + 22, 5, 4);

        // BODY
        ctx.fillStyle = '#B3E5FC';
        ctx.fillRect(cx - 7, cy - 4, 14, 16);

        // Back arm
        ctx.fillRect(cx + 6, cy, 5, 8);

        // Extended front arm with gun
        ctx.fillRect(cx - 18, cy - 2, 12, 4);
        ctx.fillStyle = '#DDBEA9';
        ctx.fillRect(cx - 20, cy - 1, 3, 3);

        // Gun
        ctx.fillStyle = '#37474F';
        ctx.fillRect(cx - 30, cy - 3, 11, 5);
        ctx.fillStyle = '#263238';
        ctx.fillRect(cx - 26, cy + 1, 4, 4);

        // Muzzle flash
        if (phase === 1) {
            ctx.fillStyle = '#FFEB3B';
            ctx.fillRect(cx - 38, cy - 5, 9, 9);
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(cx - 36, cy - 3, 5, 5);
        }

        // HEAD - CENTERED
        ctx.fillStyle = '#DDBEA9';
        ctx.fillRect(cx - 6, cy - 18, 12, 14);

        // Hair
        ctx.fillStyle = '#5D4037';
        ctx.fillRect(cx - 6, cy - 20, 12, 5);

        // Eyes (squinting)
        ctx.fillStyle = '#1A1A1A';
        ctx.fillRect(cx - 4, cy - 12, 3, 1);
        ctx.fillRect(cx + 1, cy - 12, 3, 1);

        // Beard
        ctx.fillStyle = '#757575';
        ctx.fillRect(cx - 5, cy - 8, 10, 6);
    },

    // Dead Cap Man
    drawDeadCapMan: function (ctx, cx, cy, progress) {
        ctx.save();
        ctx.translate(cx, cy + 10);
        ctx.rotate(progress * 1.5);

        // Body
        ctx.fillStyle = '#64B5F6';
        ctx.fillRect(-6, -4, 12, 10);

        // Legs
        ctx.fillStyle = '#1A237E';
        ctx.fillRect(-8, 5, 5, 10);
        ctx.fillRect(3, 5, 5, 10);

        // Head
        ctx.fillStyle = '#A1887F';
        ctx.fillRect(-5, -14, 10, 10);

        // X eyes
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(-3, -11); ctx.lineTo(-1, -9);
        ctx.moveTo(-1, -11); ctx.lineTo(-3, -9);
        ctx.moveTo(1, -11); ctx.lineTo(3, -9);
        ctx.moveTo(3, -11); ctx.lineTo(1, -9);
        ctx.stroke();

        // Cap flying off
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(8, -16 - progress * 5, 8, 5);

        ctx.restore();
    },

    // Dead Blue Shirt
    drawDeadBlueShirt: function (ctx, cx, cy, progress) {
        ctx.save();
        ctx.translate(cx, cy + 10);
        ctx.rotate(progress * 1.5);

        // Body
        ctx.fillStyle = '#B3E5FC';
        ctx.fillRect(-6, -4, 12, 10);

        // Legs
        ctx.fillStyle = '#455A64';
        ctx.fillRect(-8, 5, 5, 10);
        ctx.fillRect(3, 5, 5, 10);

        // Head
        ctx.fillStyle = '#DDBEA9';
        ctx.fillRect(-5, -14, 10, 10);

        // Beard
        ctx.fillStyle = '#757575';
        ctx.fillRect(-4, -8, 8, 4);

        // X eyes
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(-3, -11); ctx.lineTo(-1, -9);
        ctx.moveTo(-1, -11); ctx.lineTo(-3, -9);
        ctx.moveTo(1, -11); ctx.lineTo(3, -9);
        ctx.moveTo(3, -11); ctx.lineTo(1, -9);
        ctx.stroke();

        ctx.restore();
    },

    // Gun sprite
    generateGun: function () {
        var c = this.createCanvas(512, 64);
        var ctx = c.ctx;

        var recoils = [0, 2, 5, 8, 5, 3, 1, 0];
        for (var i = 0; i < 8; i++) {
            this.drawGunFrame(ctx, i * 64 + 32, 32 + recoils[i], i === 2);
        }

        return c.canvas.toDataURL('image/png');
    },

    drawGunFrame: function (ctx, cx, cy, flash) {
        // FIRST-PERSON GUN VIEW
        // The gun is held at the bottom of the screen
        // Barrel points UP towards the crosshair/enemies
        // Player's hands would be at the bottom holding the grip

        // Gun body (receiver) - centered horizontally, in middle area
        ctx.fillStyle = '#37474F';
        ctx.fillRect(cx - 14, cy - 8, 28, 18);

        // Barrel - points UP from the body
        ctx.fillStyle = '#455A64';
        ctx.fillRect(cx - 5, cy - 26, 10, 20);

        // Barrel tip / muzzle
        ctx.fillStyle = '#263238';
        ctx.fillRect(cx - 4, cy - 30, 8, 6);

        // Barrel opening (dark hole)
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(cx, cy - 30, 3, 0, Math.PI * 2);
        ctx.fill();

        // Top rail / sights
        ctx.fillStyle = '#546E7A';
        ctx.fillRect(cx - 3, cy - 24, 6, 2);

        // Front sight (red dot)
        ctx.fillStyle = '#FF3D00';
        ctx.fillRect(cx - 1, cy - 28, 2, 2);

        // Body details - side panels
        ctx.fillStyle = '#546E7A';
        ctx.fillRect(cx - 12, cy - 4, 24, 3);

        // Trigger guard
        ctx.fillStyle = '#263238';
        ctx.fillRect(cx - 4, cy + 8, 8, 4);
        ctx.fillStyle = '#37474F';
        ctx.fillRect(cx - 2, cy + 9, 4, 2);

        // Grip - hangs down from center (player holding it)
        ctx.fillStyle = '#5D4037';
        ctx.fillRect(cx - 5, cy + 8, 10, 22);

        // Grip texture
        ctx.fillStyle = '#4E342E';
        ctx.fillRect(cx - 3, cy + 10, 6, 18);

        // Grip lines
        ctx.fillStyle = '#3E2723';
        for (var i = 0; i < 4; i++) {
            ctx.fillRect(cx - 2, cy + 12 + i * 4, 4, 1);
        }

        // Energy/ammo indicators (cyan glow on sides)
        ctx.fillStyle = '#00E5FF';
        ctx.fillRect(cx - 12, cy - 2, 3, 6);
        ctx.fillRect(cx + 9, cy - 2, 3, 6);

        // MUZZLE FLASH - shoots UP from barrel
        if (flash) {
            // Outer yellow glow
            ctx.fillStyle = 'rgba(255, 200, 50, 0.85)';
            ctx.beginPath();
            ctx.ellipse(cx, cy - 40, 14, 12, 0, 0, Math.PI * 2);
            ctx.fill();

            // Star-shaped flash
            ctx.fillStyle = '#FFEB3B';
            ctx.beginPath();
            ctx.moveTo(cx, cy - 55);      // Top point
            ctx.lineTo(cx - 5, cy - 42);
            ctx.lineTo(cx - 12, cy - 38); // Left point
            ctx.lineTo(cx - 5, cy - 36);
            ctx.lineTo(cx, cy - 32);      // Center
            ctx.lineTo(cx + 5, cy - 36);
            ctx.lineTo(cx + 12, cy - 38); // Right point
            ctx.lineTo(cx + 5, cy - 42);
            ctx.closePath();
            ctx.fill();

            // White hot core
            ctx.fillStyle = '#FFFFFF';
            ctx.beginPath();
            ctx.arc(cx, cy - 38, 6, 0, Math.PI * 2);
            ctx.fill();
        }
    },

    // Walls
    generateWalls: function () {
        var canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 256;
        var ctx = canvas.getContext('2d');

        var colors = [
            ['#7B3F00', '#9B5F20'], ['#505050', '#686868'],
            ['#3A3A4A', '#4A4A5A'], ['#2F4F4F', '#3F5F5F'],
            ['#1A1A2E', '#2A2A4E'], ['#4A2060', '#6A3080'],
            ['#6B2020', '#8B3030'], ['#1A2A3A', '#2A3A4A']
        ];

        for (var row = 0; row < 4; row++) {
            for (var col = 0; col < 4; col++) {
                var idx = (row * 4 + col) % colors.length;
                var tx = col * 64, ty = row * 64;
                ctx.fillStyle = colors[idx][0];
                ctx.fillRect(tx, ty, 64, 64);
                for (var by = 0; by < 8; by++) {
                    var offset = by % 2 === 0 ? 0 : 16;
                    for (var bx = 0; bx < 4; bx++) {
                        ctx.fillStyle = colors[idx][1];
                        ctx.fillRect(tx + offset + bx * 32 + 2, ty + by * 8 + 2, 13, 5);
                    }
                }
            }
        }
        return canvas.toDataURL('image/png');
    },

    // TREASURE - Quantum Crystal (glowing, animated)
    generateTreasure: function () {
        var c = this.createCanvas(256, 64); // 4 animation frames
        var ctx = c.ctx;

        for (var frame = 0; frame < 4; frame++) {
            var cx = frame * 64 + 32;
            var cy = 32;
            var glow = Math.sin(frame * Math.PI / 2) * 0.3 + 0.7;

            // Glow effect
            ctx.fillStyle = 'rgba(0, 255, 255, ' + (glow * 0.3) + ')';
            ctx.beginPath();
            ctx.arc(cx, cy, 20 + frame * 2, 0, Math.PI * 2);
            ctx.fill();

            // Crystal base
            ctx.fillStyle = '#00BCD4';
            ctx.beginPath();
            ctx.moveTo(cx, cy - 20);
            ctx.lineTo(cx + 12, cy);
            ctx.lineTo(cx + 8, cy + 15);
            ctx.lineTo(cx - 8, cy + 15);
            ctx.lineTo(cx - 12, cy);
            ctx.closePath();
            ctx.fill();

            // Crystal highlights
            ctx.fillStyle = '#4DD0E1';
            ctx.beginPath();
            ctx.moveTo(cx, cy - 18);
            ctx.lineTo(cx + 6, cy);
            ctx.lineTo(cx, cy + 10);
            ctx.lineTo(cx - 2, cy);
            ctx.closePath();
            ctx.fill();

            // Sparkle
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(cx - 2 + frame, cy - 12, 3, 3);
            ctx.fillRect(cx + 4, cy - 5 - frame, 2, 2);

            // Quantum symbol (ψ)
            ctx.fillStyle = '#E0F7FA';
            ctx.font = '12px Arial';
            ctx.fillText('ψ', cx - 4, cy + 5);
        }

        return c.canvas.toDataURL('image/png');
    },

    // HEALTH PACK - Red cross med kit
    generateHealth: function () {
        var c = this.createCanvas(64, 64);
        var ctx = c.ctx;
        var cx = 32, cy = 32;

        // White box
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(cx - 14, cy - 10, 28, 24);

        // Box shadow
        ctx.fillStyle = '#CCCCCC';
        ctx.fillRect(cx - 14, cy + 10, 28, 4);

        // Red cross
        ctx.fillStyle = '#F44336';
        ctx.fillRect(cx - 3, cy - 8, 6, 18);
        ctx.fillRect(cx - 9, cy - 2, 18, 6);

        // Box outline
        ctx.strokeStyle = '#B71C1C';
        ctx.lineWidth = 2;
        ctx.strokeRect(cx - 14, cy - 10, 28, 24);

        // Shine
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.fillRect(cx - 12, cy - 8, 8, 4);

        return c.canvas.toDataURL('image/png');
    },

    // AMMO BOX - Bullet crate
    generateAmmo: function () {
        var c = this.createCanvas(64, 64);
        var ctx = c.ctx;
        var cx = 32, cy = 32;

        // Crate body (olive/military green)
        ctx.fillStyle = '#5D4037';
        ctx.fillRect(cx - 15, cy - 10, 30, 22);

        // Crate top
        ctx.fillStyle = '#6D4C41';
        ctx.fillRect(cx - 15, cy - 12, 30, 4);

        // Metal bands
        ctx.fillStyle = '#37474F';
        ctx.fillRect(cx - 15, cy - 6, 30, 3);
        ctx.fillRect(cx - 15, cy + 5, 30, 3);

        // Bullet icons
        ctx.fillStyle = '#FFC107';
        for (var i = 0; i < 3; i++) {
            ctx.fillRect(cx - 8 + i * 8, cy - 3, 4, 8);
            ctx.fillStyle = '#FF9800';
            ctx.fillRect(cx - 8 + i * 8, cy - 3, 4, 2);
            ctx.fillStyle = '#FFC107';
        }

        // Energy glow
        ctx.fillStyle = '#00E5FF';
        ctx.fillRect(cx - 12, cy + 9, 3, 2);
        ctx.fillRect(cx + 9, cy + 9, 3, 2);

        return c.canvas.toDataURL('image/png');
    },

    init: function (callback) {
        console.log('Generating sprites with pickups...');

        window.generatedSprites = {
            capman: this.generateCapMan(),
            blueshirt: this.generateBlueShirt(),
            gun: this.generateGun(),
            walls: this.generateWalls(),
            treasure: this.generateTreasure(),
            health: this.generateHealth(),
            ammo: this.generateAmmo()
        };

        console.log('All sprites ready!');
        if (callback) callback();
    }
};

// Sound Effects
var SoundFX = {
    audioContext: null, enabled: true,
    init: function () {
        try { this.audioContext = new (window.AudioContext || window.webkitAudioContext)(); }
        catch (e) { this.enabled = false; }
    },
    play: function (type) {
        if (!this.enabled || !this.audioContext) return;
        if (this.audioContext.state === 'suspended') this.audioContext.resume();
        var ctx = this.audioContext;
        var osc = ctx.createOscillator();
        var gain = ctx.createGain();
        osc.connect(gain); gain.connect(ctx.destination);
        var now = ctx.currentTime;

        var configs = {
            shoot: { t: 'sawtooth', f1: 200, f2: 50, d: 0.12, g: 0.3 },
            kill: { t: 'sawtooth', f1: 400, f2: 30, d: 0.35, g: 0.4 },
            hurt: { t: 'sine', f1: 300, f2: 100, d: 0.15, g: 0.25 },
            death: { t: 'sawtooth', f1: 200, f2: 20, d: 0.6, g: 0.35 },
            quantum: { t: 'sine', f1: 440, f2: 880, d: 0.4, g: 0.2 },
            pickup: { t: 'sine', f1: 500, f2: 800, d: 0.15, g: 0.25 }
        };

        if (configs[type]) {
            var c = configs[type];
            osc.type = c.t;
            osc.frequency.setValueAtTime(c.f1, now);
            osc.frequency.exponentialRampToValueAtTime(c.f2, now + c.d);
            gain.gain.setValueAtTime(c.g, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + c.d);
            osc.start(now); osc.stop(now + c.d);
        } else if (type === 'stageComplete') {
            [523, 659, 784, 1047].forEach(function (f, i) {
                var o = ctx.createOscillator(), g = ctx.createGain();
                o.connect(g); g.connect(ctx.destination);
                o.type = 'sine'; o.frequency.value = f;
                g.gain.setValueAtTime(0.2, now + i * 0.12);
                g.gain.exponentialRampToValueAtTime(0.01, now + i * 0.12 + 0.25);
                o.start(now + i * 0.12); o.stop(now + i * 0.12 + 0.25);
            });
        }
    }
};

window.SoundFX = SoundFX;

// Mobile Touch Controls - Improved with throttling
var MobileControls = {
    joystickActive: false,
    joystickCenter: { x: 0, y: 0 },
    joystickMaxDist: 40,
    currentInput: { x: 0, y: 0 },
    keyInterval: null,
    isFiring: false,

    init: function () {
        var self = this;

        // Check if touch device
        if (!('ontouchstart' in window)) {
            console.log('Not a touch device');
            return;
        }

        var joystickArea = document.getElementById('joystick-area');
        var joystickStick = document.getElementById('joystick-stick');
        var fireBtn = document.getElementById('fire-btn');

        if (!joystickArea || !fireBtn) return;

        // Joystick touch start
        joystickArea.addEventListener('touchstart', function (e) {
            e.preventDefault();
            self.joystickActive = true;

            var base = document.getElementById('joystick-base');
            var rect = base.getBoundingClientRect();
            self.joystickCenter = {
                x: rect.left + rect.width / 2,
                y: rect.top + rect.height / 2
            };

            self.updateJoystick(e.touches[0], joystickStick);
            self.startKeyLoop();
        }, { passive: false });

        // Joystick move
        joystickArea.addEventListener('touchmove', function (e) {
            e.preventDefault();
            if (self.joystickActive && e.touches.length > 0) {
                self.updateJoystick(e.touches[0], joystickStick);
            }
        }, { passive: false });

        // Joystick release
        function releaseJoystick(e) {
            if (e) e.preventDefault();
            self.joystickActive = false;
            self.currentInput = { x: 0, y: 0 };
            joystickStick.style.transform = 'translate(0, 0)';
            self.stopKeyLoop();
            self.releaseAllKeys();
        }

        joystickArea.addEventListener('touchend', releaseJoystick, { passive: false });
        joystickArea.addEventListener('touchcancel', releaseJoystick, { passive: false });

        // Fire button
        fireBtn.addEventListener('touchstart', function (e) {
            e.preventDefault();
            if (!self.isFiring && typeof qd !== 'undefined' && qd.player && qd.player.fire) {
                self.isFiring = true;
                qd.player.fire();
            }
        }, { passive: false });

        fireBtn.addEventListener('touchend', function (e) {
            e.preventDefault();
            self.isFiring = false;
        }, { passive: false });

        fireBtn.addEventListener('touchcancel', function () {
            self.isFiring = false;
        }, { passive: false });

        console.log('Mobile controls ready');
    },

    updateJoystick: function (touch, stick) {
        var dx = touch.clientX - this.joystickCenter.x;
        var dy = touch.clientY - this.joystickCenter.y;

        var dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > this.joystickMaxDist) {
            dx = (dx / dist) * this.joystickMaxDist;
            dy = (dy / dist) * this.joystickMaxDist;
        }

        stick.style.transform = 'translate(' + dx + 'px, ' + dy + 'px)';
        this.currentInput.x = dx / this.joystickMaxDist;
        this.currentInput.y = dy / this.joystickMaxDist;
    },

    startKeyLoop: function () {
        var self = this;
        if (this.keyInterval) return;

        // Controlled rate: 10 updates per second
        this.keyInterval = setInterval(function () {
            if (!self.joystickActive) return;

            var nx = self.currentInput.x;
            var ny = self.currentInput.y;
            var deadZone = 0.4;

            if (ny < -deadZone) self.tapKey(38);
            else if (ny > deadZone) self.tapKey(40);

            if (nx < -deadZone) self.tapKey(37);
            else if (nx > deadZone) self.tapKey(39);
        }, 100);
    },

    stopKeyLoop: function () {
        if (this.keyInterval) {
            clearInterval(this.keyInterval);
            this.keyInterval = null;
        }
    },

    tapKey: function (keyCode) {
        document.dispatchEvent(new KeyboardEvent('keydown', { keyCode: keyCode, which: keyCode, bubbles: true }));
        setTimeout(function () {
            document.dispatchEvent(new KeyboardEvent('keyup', { keyCode: keyCode, which: keyCode, bubbles: true }));
        }, 50);
    },

    releaseAllKeys: function () {
        [37, 38, 39, 40].forEach(function (code) {
            document.dispatchEvent(new KeyboardEvent('keyup', { keyCode: code, which: code, bubbles: true }));
        });
    }
};

window.MobileControls = MobileControls;

document.addEventListener('DOMContentLoaded', function () {
    SoundFX.init();
    SpriteGen.init();
    setTimeout(function () { MobileControls.init(); }, 1000);
});

