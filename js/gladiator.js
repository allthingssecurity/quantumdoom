/*
 Gladiator 3D engine

 by Matthias Ladkau (matthias@devt.de)

 JavaScript ray casting engine for pseudo 3D games.

 Modified for Quantum Doom by AI Assistant
 -------
The MIT License (MIT)

Copyright (c) 2013 Matthias Ladkau

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE
 -------
*/

if (typeof ge === 'undefined') {
    var ge = {};
}

// Utility functions
ge.$ = function (id) { "use strict"; return document.getElementById(id); };
ge.create = function (tag) { "use strict"; return document.createElement(tag); };
ge.copyObject = function (o1, o2) { "use strict"; for (var attr in o1) { o2[attr] = o1[attr]; } };
ge.mergeObject = function (o1, o2) { "use strict"; for (var attr in o1) { if (o2[attr] === undefined) { o2[attr] = o1[attr]; } } };
ge.cloneObject = function (o) { "use strict"; var r = {}; ge.copyObject(o, r); return r; };
ge.bind = function () {
    "use strict";
    var f = arguments[0], t = Array.prototype.slice.call(arguments, 1);
    var a = t.splice(1);
    return function () {
        "use strict";
        return f.apply(t[0],
            a.concat(Array.prototype.slice.call(arguments, 0)));
    }
};

// Class implementation
ge.Class = function () { };
(function () {
    var functionUsesSuper = /abc/.test(function () { abc(); }) ? /\b_super\b/ : /.*/;
    var initializing = false;

    ge.Class.create = function () {
        var _super = this.prototype;

        initializing = true;
        var prototype = new this();
        initializing = false;

        for (var i = 0; i < arguments.length; i++) {
            var properties = arguments[i];

            if (typeof properties === "function") {
                properties = properties.prototype;
            }

            for (var name in properties) {
                if (typeof properties[name] == "function"
                    && typeof _super[name] == "function"
                    && functionUsesSuper.test(properties[name])) {

                    prototype[name] = (
                        function (name, func, _super) {
                            return function () {
                                var t, ret;
                                t = this._super;
                                this._super = _super[name];
                                ret = func.apply(this, arguments);
                                this._super = t;
                                return ret;
                            };
                        }
                    )(name, properties[name], _super);

                } else {
                    prototype[name] = properties[name];
                }
            }

            _super = properties;
        }

        var Class = function () {
            if (!initializing && this.init) {
                this.init.apply(this, arguments);
            }
        }

        Class.prototype = prototype;
        Class.prototype.constructor = Class;
        Class.create = arguments.callee;

        return Class;
    };
})();

// Default Objects
ge.default_eventHandler = {
    onkeydown: function (state, e) {
        "use strict";
        e = e || window.event;
        switch (e.keyCode) {
            case 38: state.player.speed = 1; break;
            case 40: state.player.speed = -1; break;
            case 39:
                if (e.ctrlKey || e.shiftKey) {
                    state.player.strafe = 1;
                } else {
                    state.player.dir = 1;
                    if (state.player.rotSpeed < state.player.maxRotSpeed) {
                        state.player.rotSpeed = state.player.deltaRotSpeed(
                            state.player.rotSpeed);
                    }
                }
                break;
            case 37:
                if (e.ctrlKey || e.shiftKey) {
                    state.player.strafe = -1;
                } else {
                    state.player.dir = -1;
                    if (state.player.rotSpeed < state.player.maxRotSpeed) {
                        state.player.rotSpeed = state.player.deltaRotSpeed(
                            state.player.rotSpeed);
                    }
                }
                break;
        }

        ge.default_eventHandler.stopBubbleEvent(e);
    },

    onkeyup: function (state, e) {
        "use strict";
        e = e || window.event;
        switch (e.keyCode) {
            case 38: case 40: state.player.speed = 0; break;
            case 37: case 39:
                state.player.dir = 0;
                state.player.strafe = 0;
                state.player.rotSpeed = state.player.minRotSpeed;
                break;
        }

        ge.default_eventHandler.stopBubbleEvent(e);
    },

    stopBubbleEvent: function (e) {
        "use strict";
        e = e ? e : window.event;
        if (e.stopPropagation) {
            e.stopPropagation();
        }
        if (e.cancelBubble !== null) {
            e.cancelBubble = true;
        }
    }
};

ge.default_options = {
    minimapScale: 10,
    minimapPlayerColor: "cyan",
    eventHandler: ge.default_eventHandler,
    moveHandler: function (state, sprites) { },
    drawHandler: function (ctx, state, sprites) { },

    wallTextureAtlas: "",
    wallTextureMapping: {},
    floorCeilingTextureAtlas: "",
    floorCeilingTextureMapping: {},
    textureWidth: 64,
    textureHeight: 64,

    ceilingImage: undefined,
    ceilingSolidColor: "#1a1a2e",
    floorSolidColor: "#2a2a3e",

    moveRate: 30,
    screenWidth: 640,
    screenHeight: 480,
    screenElementWidth: 640,
    screenElementHeight: 480,
    stripWidth: 2,
    fov: 60 * Math.PI / 180,
    minDistToWall: 0.2,
    spriteDrawOffsetX: 0.5,
    spriteDrawOffsetY: 0.5
};

ge.default_initial_player_state = {
    x: 2,
    y: 2,
    dir: 0,
    rot: 0,
    rotSpeed: Math.PI / 180,
    maxRotSpeed: 7 * Math.PI / 180,
    minRotSpeed: 2 * Math.PI / 180,
    deltaRotSpeed: function (rotSpeed) {
        return rotSpeed * 3;
    },
    speed: 0,
    strafe: 0,
    moveSpeed: 0.21,
    crossHairSize: 1,
    playerCrosshairHit: [],
    spriteDistances: {}
};

ge.default_initial_sprite_state = {
    id: "",
    x: 2,
    y: 2,
    isMoving: false,
    drawOnMinimap: false,
    minimapColor: "red",
    dir: 0,
    rot: 0,
    rotSpeed: 6 * Math.PI / 180,
    speed: 0,
    strafe: 0,
    moveSpeed: 0.05,
    spriteAtlas: "",
    spriteOffsetX: 0,
    spriteOffsetY: 0,
    spriteWidth: 64,
    spriteHeight: 64,
    spriteScaleX: 1,
    spriteScaleY: 1,
    hitList: [],
    playerCrossHair: undefined,
    spriteAtlasImage: undefined
};

// Main Controller
ge.MainController = ge.Class.create({

    TWO_PI: Math.PI * 2,
    FOV_FLOOR_WEIGHT_TABLE: {
        10: 5.50, 20: 2.80, 30: 1.85, 40: 1.35, 45: 1.15,
        50: 1.00, 55: 0.95, 60: 0.85, 65: 0.75, 70: 0.65,
        75: 0.60, 80: 0.55, 85: 0.50, 90: 0.45, 95: 0.40,
        100: 0.35, 110: 0.30, 120: 0.25, 130: 0.20, 140: 0.15,
        150: 0.12, 160: 0.08, 170: 0.03
    },

    _screen: undefined,
    _ctx: undefined,
    _minimap: undefined,
    _options: undefined,
    _debug: undefined,
    _wallTextureAtlas: undefined,
    _skyImage: undefined,
    _state: undefined,
    _sprites: undefined,
    _numRays: undefined,
    _halfFov: undefined,
    _viewDist: undefined,
    _fovFloorWeight: undefined,
    _screenMiddle: undefined,
    _lastMoveLoopTime: 0,

    init: function (screen_id, minimap_id, options, debug_output_element) {
        "use strict";

        this.running = true;
        this._state = {};
        this._options = {};
        this._sprites = [];

        this._screen = ge.$(screen_id);

        if (this._screen === null) {
            throw Error("No main screen found");
        }
        this._ctx = this._screen.getContext("2d");

        // Enable pixel-perfect rendering for crisp pixel art sprites
        this._ctx.imageSmoothingEnabled = false;
        this._ctx.mozImageSmoothingEnabled = false;
        this._ctx.webkitImageSmoothingEnabled = false;
        this._ctx.msImageSmoothingEnabled = false;

        this._minimap = ge.$(minimap_id);
        this._debug = ge.$(debug_output_element);

        ge.copyObject(ge.default_options, this._options);
        if (options !== undefined) {
            ge.copyObject(options, this._options);
        }

        this._wallTextureAtlas = new Image();
        this._wallTextureAtlas.src = this._options.wallTextureAtlas;
        this._floorCeilingTextureAtlas = new Image();
        this._floorCeilingTextureAtlas.src = this._options.floorCeilingTextureAtlas;

        if (this._options.ceilingImage !== undefined) {
            this._skyImage = new Image();
            this._skyImage.src = this._options.ceilingImage;
        }

        this._screen.width = this._options.screenWidth;
        this._screen.height = this._options.screenHeight;
        this._screen.style.width = this._options.screenElementWidth + "px";
        this._screen.style.height = this._options.screenElementHeight + "px";

        this._screenMiddle = this._options.screenWidth / 2;
        this._numRays = Math.ceil(this._options.screenWidth / this._options.stripWidth);
        this._halfFov = this._options.fov / 2;

        var match = 999;
        this._fovFloorWeight = 0.85 + 5;
        var fov_degrees = (this._options.fov / Math.PI) * 180;
        for (var fov_key in this.FOV_FLOOR_WEIGHT_TABLE) {
            var new_match = Math.abs(fov_key - fov_degrees);
            if (new_match < match) {
                this._fovFloorWeight = this.FOV_FLOOR_WEIGHT_TABLE[fov_key];
                match = new_match;
            }
            if (match === 0) {
                break;
            }
        }

        this._viewDist = (this._options.screenWidth / 2) / Math.tan(this._options.fov / 2);

        this.registerEventHandlers();
    },

    start: function (map, initial_player_state) {
        "use strict";

        this._state.map = map;
        this._state.mapWidth = map[0].length;
        this._state.mapHeight = map.length;

        this._state.player = {};
        ge.copyObject(ge.default_initial_player_state, this._state.player);
        if (initial_player_state !== undefined) {
            ge.copyObject(initial_player_state, this._state.player);
        }

        if (this._minimap !== null) {
            this.drawMiniMap();
        }

        this.drawLoop();
        this.moveLoop();
    },

    stop: function () {
        "use strict";
        this.running = false;
        this.deRegisterEventHandlers();
    },

    addSprite: function (initial_sprite_state) {
        "use strict";

        var sprite_state = {}
        if (initial_sprite_state !== undefined) {
            sprite_state = initial_sprite_state;
            ge.mergeObject(ge.default_initial_sprite_state, sprite_state);
        } else {
            ge.copyObject(ge.default_initial_sprite_state, sprite_state);
        }

        sprite_state.spriteAtlasImage = new Image();
        sprite_state.spriteAtlasImage.src = sprite_state.spriteAtlas

        this._sprites.push(sprite_state);
    },

    registerEventHandlers: function (handlerObject) {
        "use strict";

        document.onkeydown = ge.bind(this._options.eventHandler.onkeydown, this, this._state);
        document.onkeyup = ge.bind(this._options.eventHandler.onkeyup, this, this._state);
    },

    deRegisterEventHandlers: function (handlerObject) {
        "use strict";

        document.onkeydown = null;
        document.onkeyup = null;
    },

    printDebug: function (str) {
        "use strict";

        if (this._debug !== null) {
            this._debug.innerHTML += str + "<br>";
        }
    },

    moveLoop: function () {
        "use strict";

        var moveLoopTime = new Date().getTime();
        var timeDelta = moveLoopTime - this._lastMoveCycleTime;

        this.move(timeDelta);

        var nextMoveLoopTime = 1000 / this._options.moveRate;
        if (timeDelta > nextMoveLoopTime) {
            nextMoveLoopTime = Math.max(1, nextMoveLoopTime
                - (timeDelta - nextMoveLoopTime));
        }

        this._options.moveHandler(this._state, this._sprites);

        this._lastMoveCycleTime = moveLoopTime;

        if (this.running) {
            setTimeout(ge.bind(this.moveLoop, this), nextMoveLoopTime);
        }
    },

    move: function (timeDelta) {
        "use strict";

        var player = this._state.player;

        var timeCorrection = timeDelta / this._options.moveRate;
        if (isNaN(timeCorrection)) timeCorrection = 1;

        this.moveEntity(timeCorrection, player);

        for (var i = 0; i < this._sprites.length; i++) {
            var sprite = this._sprites[i];
            if (sprite.isMoving) {
                this.moveEntity(timeCorrection, sprite);
            }
        }
    },

    moveEntity: function (timeCorrection, entity) {
        var moveStep = timeCorrection * entity.speed * entity.moveSpeed;
        var strafeStep = timeCorrection * entity.strafe * entity.moveSpeed;

        var newX = entity.x + Math.cos(entity.rot) * moveStep;
        var newY = entity.y + Math.sin(entity.rot) * moveStep;

        newX -= Math.sin(entity.rot) * strafeStep;
        newY += Math.cos(entity.rot) * strafeStep;

        entity.rot += timeCorrection * entity.dir * entity.rotSpeed;

        var c = this.detectCollision(newX, newY, entity)

        if (!c[0]) {
            entity.x = newX;
        }
        if (!c[1]) {
            entity.y = newY;
        }
    },

    detectCollision: function (x, y, entity) {
        "use strict";

        var getMapEntry = ge.bind(function (x, y) {
            if (entity.id !== undefined) {
                x -= this._options.spriteDrawOffsetX;
                y -= this._options.spriteDrawOffsetY;
            }
            return this._state.map[Math.floor(y)][Math.floor(x)];
        }, this);

        if (x < 0 || x > this._state.mapWidth
            || y < 0 || y > this._state.mapHeight) {
            return [true, true];
        }

        var distToWall = this._options.minDistToWall;

        var collisionX = false,
            collisionY = false;

        if (getMapEntry(x, y + distToWall) > 0) {
            collisionY = true;
        } else if (getMapEntry(x, y - distToWall) > 0) {
            collisionY = true;
        }

        if (getMapEntry(x + distToWall, y) > 0) {
            collisionX = true;
        } else if (getMapEntry(x - distToWall, y) > 0) {
            collisionX = true;
        }

        return [collisionX, collisionY];
    },

    drawLoop: function () {
        "use strict";

        var start = 0;

        var ctx = this._ctx;
        ctx.clearRect(0, 0, this._screen.width, this._screen.height);

        // Ensure pixel-perfect rendering each frame
        ctx.imageSmoothingEnabled = false;

        if (this._debug !== null) {
            this._debug.innerHTML = "";
            start = new Date().getTime();
        }

        if (this._minimap !== null) {
            this.updateMiniMap();
        }

        this.drawSimpleCeilingAndGround();
        this.castRays();

        this._options.drawHandler(ctx, this._state, this._sprites);

        if (start !== 0) {
            var runtime = new Date().getTime() - start;
            this.printDebug("Runtime:" + runtime);
            var now = new Date().getTime();
            var timeDelta = now - this._debug_lastRenderCycleTime;
            this._debug_lastRenderCycleTime = now;
            var fps = Math.floor(1000 / timeDelta);
            this.printDebug("FPS:" + fps);
        }

        if (this.running) {
            setTimeout(ge.bind(this.drawLoop, this), 20);
        }
    },

    drawSimpleCeilingAndGround: function () {
        "use strict";

        var ctx = this._ctx;
        var screenHeight = this._options.screenHeight;
        var screenHeightHalf = this._options.screenHeight / 2;
        var screenWidth = this._options.screenWidth;

        if (this._skyImage !== undefined) {
            this.circleImage(this._skyImage);
        } else {
            ctx.fillStyle = this._options.ceilingSolidColor;
            ctx.fillRect(0, 0, screenWidth, screenHeightHalf);
        }

        ctx.fillStyle = this._options.floorSolidColor;
        ctx.fillRect(0, screenHeightHalf, screenWidth, screenHeightHalf);
    },

    drawMiniMap: function () {
        "use strict";

        var minimapScale = this._options.minimapScale,
            mapWidth = this._state.mapWidth,
            mapHeight = this._state.mapHeight,
            minimapWalls;

        if (this._minimapWalls === undefined) {
            this._minimapWalls = ge.create("canvas");
            this._minimapWalls.style.position = "absolute";
            this._minimapWalls.style.zIndex = 0;
            this._minimap.appendChild(this._minimapWalls);
        }

        var minimapWalls = this._minimapWalls;

        minimapWalls.width = mapWidth * minimapScale;
        minimapWalls.height = mapHeight * minimapScale;
        minimapWalls.style.width = (mapWidth * minimapScale) + "px";
        minimapWalls.style.height = (mapHeight * minimapScale) + "px";

        var ctx = minimapWalls.getContext("2d");

        for (var y = 0; y < mapHeight; y++) {
            for (var x = 0; x < mapWidth; x++) {
                var wall = this._state.map[y][x];
                if (wall > 0) {
                    ctx.fillStyle = "rgba(0, 255, 255, 0.3)";
                    ctx.fillRect(x * minimapScale,
                        y * minimapScale,
                        minimapScale,
                        minimapScale);
                }
            }
        }
    },

    updateMiniMap: function () {
        "use strict";

        if (this._minimapWalls === undefined) {
            this.drawMiniMap();
        }

        var player = this._state.player,
            options = this._options,
            minimapScale = this._options.minimapScale,
            mapWidth = this._state.mapWidth,
            mapHeight = this._state.mapHeight,
            minimapWalls;

        if (this._minimapObjects === undefined) {
            this._minimapObjects = ge.create("canvas");
            this._minimapObjects.style.position = "absolute";
            this._minimapObjects.style.zIndex = 1;
            this._minimap.appendChild(this._minimapObjects);
        }

        var miniMapObjects = this._minimapObjects;

        miniMapObjects.width = mapWidth * minimapScale;
        miniMapObjects.height = mapHeight * minimapScale;
        miniMapObjects.style.width = (mapWidth * minimapScale) + "px";
        miniMapObjects.style.height = (mapHeight * minimapScale) + "px";

        var ctx = miniMapObjects.getContext("2d");

        ctx.fillStyle = this._options.minimapPlayerColor;
        ctx.fillRect(
            player.x * minimapScale - 2,
            player.y * minimapScale - 2,
            4, 4
        );

        ctx.strokeStyle = this._options.minimapPlayerColor;
        ctx.beginPath();
        ctx.moveTo(player.x * minimapScale, player.y * minimapScale);
        ctx.lineTo(
            (player.x + Math.cos(player.rot) * 1) * minimapScale,
            (player.y + Math.sin(player.rot) * 1) * minimapScale
        );
        ctx.closePath();
        ctx.stroke();
    },

    castRays: function () {
        "use strict";

        var viewDistSquare = this._viewDist * this._viewDist;
        var leftmostRayPos = -this._numRays / 2;
        var distArray = []

        for (var i = 0; i < this._numRays; i++) {
            var rayScreenPos = (leftmostRayPos + i) * this._options.stripWidth;
            var rayViewLength = Math.sqrt(rayScreenPos * rayScreenPos + viewDistSquare);
            var rayAngle = Math.asin(rayScreenPos / rayViewLength);

            rayAngle = this._state.player.rot + rayAngle;
            rayAngle %= this.TWO_PI;
            if (rayAngle < 0) {
                rayAngle += this.TWO_PI;
            }

            var res = this.castSingleRay(rayAngle, i);
            var dist = res[0] * Math.cos(this._state.player.rot - rayAngle);
            distArray.push(dist);

            this.drawStrip(i, dist, res[1], res[2], res[3], res[4], rayAngle);
        }

        if (this._sprites.length === 0) {
            return;
        }

        var spriteOffsetX = this._options.spriteDrawOffsetX;
        var spriteOffsetY = this._options.spriteDrawOffsetY;
        var ctx;

        var sprite_dists = {};
        var getDistanceToPlayer = ge.bind(function (sprite) {
            "use strict";
            var sdx = sprite.x - this._state.player.x - spriteOffsetX;
            var sdy = sprite.y - this._state.player.y - spriteOffsetY;
            return Math.sqrt(sdx * sdx + sdy * sdy);
        }, this);

        if (this._sprites.length == 1) {
            sprite_dists[this._sprites[0].id] = getDistanceToPlayer(this._sprites[0]);
        } else {
            this._sprites.sort(function (sprite1, sprite2) {
                "use strict";
                var sd1, sd2;
                if (sprite_dists[sprite1.id] === undefined) {
                    sd1 = getDistanceToPlayer(sprite1);
                    sprite_dists[sprite1.id] = sd1;
                } else {
                    sd1 = sprite_dists[sprite1.id];
                }
                if (sprite_dists[sprite2.id] === undefined) {
                    sd2 = getDistanceToPlayer(sprite2);
                    sprite_dists[sprite2.id] = sd2;
                } else {
                    sd2 = sprite_dists[sprite2.id];
                }
                return sd2 - sd1;
            });
        }

        this._state.player.spriteDistances = sprite_dists;
        var crossHairSize = this._state.player.crossHairSize;
        var screenMiddle = this._screenMiddle;
        var playerCrosshairHit = [];

        for (var i = 0; i < this._sprites.length; i++) {
            var sprite = this._sprites[i];
            var distSprite = sprite_dists[sprite.id];
            var xSprite = sprite.x - spriteOffsetX;
            var ySprite = sprite.y - spriteOffsetY;

            if (this._minimapObjects !== undefined && sprite.drawOnMinimap) {
                ctx = this._minimapObjects.getContext("2d");
                ctx.fillStyle = sprite.minimapColor;
                ctx.fillRect(xSprite * this._options.minimapScale,
                    ySprite * this._options.minimapScale,
                    4,
                    4);
            }

            xSprite = xSprite - this._state.player.x;
            ySprite = ySprite - this._state.player.y;
            var spriteAngle = Math.atan2(ySprite, xSprite) - this._state.player.rot;
            var size = this._viewDist / (Math.cos(spriteAngle) * distSprite);

            if (size <= 0) {
                continue;
            }

            var screenWidth = this._options.screenWidth;
            var screenHeight = this._options.screenHeight;

            var x = Math.floor(screenWidth / 2 + Math.tan(spriteAngle)
                * this._viewDist - size * sprite.spriteScaleX / 2);
            var y = Math.floor(this._options.screenHeight / 2
                - (0.55 + sprite.spriteScaleY - 1) * size);
            var sx = Math.floor(size * sprite.spriteScaleX);
            var sy = Math.ceil(sprite.spriteHeight * 0.01 * size)
                + (0.45 + sprite.spriteScaleY - 1) * size;

            ctx = this._ctx;
            var stripWidth = this._options.stripWidth;

            var drawSprite = function (tx, tw, sx, sw) {
                "use strict";
                if (tw <= 0 || sw <= 0) {
                    return;
                }

                // Fix: Clamp texture read to current frame to prevent bleeding into next frame
                if (tx - sprite.spriteOffsetX + tw > sprite.spriteWidth) {
                    tw = sprite.spriteWidth - (tx - sprite.spriteOffsetX);
                }

                ctx.drawImage(sprite.spriteAtlasImage, tx, sprite.spriteOffsetY,
                    tw, sprite.spriteHeight, sx, y, sw, sy);

                if (sx <= screenMiddle + crossHairSize - 1
                    && sx + sw >= screenMiddle - crossHairSize + 1) {
                    sprite.playerCrossHair = (screenMiddle - sx) * tw / sw;
                    playerCrosshairHit.push(sprite);
                };
            };

            var tx = sprite.spriteOffsetX;
            var ts = sprite.spriteWidth;
            var cumulativeDS = 0;
            var cumulativeTS = 0;
            var strips = sx / stripWidth;
            var drawing = false;
            var execute_draw = false;

            sprite.hitList = [];

            for (var j = 0; j < strips; j++) {
                cumulativeDS += stripWidth;
                cumulativeTS = Math.floor(cumulativeDS * sprite.spriteWidth / sx);
                cumulativeTS = cumulativeTS > sprite.spriteWidth
                    ? sprite.spriteWidth : cumulativeTS;

                var distIndex = Math.floor((x + cumulativeDS) * (distArray.length) / (screenWidth));
                var distWall = distArray[distIndex];
                var distDelta = distWall - distSprite;

                if (distWall === undefined || distDelta < -0.1 * distSprite) {
                    if (drawing) {
                        execute_draw = true;
                    }
                    drawing = false;
                } else {
                    if (!drawing) {
                        drawing = true;
                        x = x + cumulativeDS;
                        tx = tx + cumulativeTS;
                        cumulativeDS = 0;
                        cumulativeTS = 0;
                    }
                }

                if (execute_draw) {
                    drawSprite(tx, cumulativeTS, x, cumulativeDS);
                    sprite.hitList.push([tx, cumulativeTS, x, cumulativeDS])
                    execute_draw = false;
                    drawing = false;
                } else if (j + 1 >= strips && drawing) {
                    drawSprite(tx, cumulativeTS, x, cumulativeDS);
                    sprite.hitList.push([tx, cumulativeTS, x, cumulativeDS])
                    break;
                }
            }
        }

        this._state.player.playerCrosshairHit = playerCrosshairHit;
    },

    castSingleRay: function (rayAngle, stripIdx) {
        "use strict";

        var distx, disty;

        var right = (rayAngle > this.TWO_PI * 0.75
            || rayAngle < this.TWO_PI * 0.25);
        var up = (rayAngle < 0 || rayAngle > Math.PI);

        var v_x = Math.cos(rayAngle);
        var v_y = Math.sin(rayAngle);

        var slope_v = v_y / v_x;
        var dx_v = right ? 1 : -1;
        var dy_v = dx_v * slope_v;
        var x_v = right ? Math.ceil(this._state.player.x) : Math.floor(this._state.player.x);
        var y_v = this._state.player.y + (x_v - this._state.player.x) * slope_v
        var do_v = true;

        var dist_v = -1;
        var xHit_v = 0;
        var yHit_v = 0;
        var wallType_v = 0;
        var wallx_v, wally_v, texturex_v;

        var slope_h = v_x / v_y;
        var dy_h = up ? -1 : 1;
        var dx_h = dy_h * slope_h;
        var y_h = up ? Math.floor(this._state.player.y) : Math.ceil(this._state.player.y);
        var x_h = this._state.player.x + (y_h - this._state.player.y) * slope_h;
        var do_h = true;

        var dist_h = -1;
        var xHit_h = 0;
        var yHit_h = 0;
        var wallType_h = 0;
        var wallx_h, wally_h, texturex_h;

        while (do_h || do_v) {
            do_h = (do_h) ? (x_h >= 0 && x_h < this._state.mapWidth &&
                y_h >= 0 && y_h < this._state.mapHeight) : false;
            do_v = (do_v) ? (x_v >= 0 && x_v < this._state.mapWidth &&
                y_v >= 0 && y_v < this._state.mapHeight) : false;

            if (do_v) {
                wallx_v = Math.floor(x_v + (right ? 0 : -1));
                wally_v = Math.floor(y_v);

                wallType_v = this._state.map[wally_v][wallx_v];
                if (wallType_v > 0) {
                    distx = x_v - this._state.player.x;
                    disty = y_v - this._state.player.y;
                    dist_v = distx * distx + disty * disty;
                    xHit_v = x_v;
                    yHit_v = y_v;

                    texturex_v = y_v % 1;
                    if (!right) {
                        texturex_v = 1 - texturex_v;
                    }

                    do_v = false;
                }
                x_v += dx_v;
                y_v += dy_v;
            }
            if (do_h) {
                wally_h = Math.floor(y_h + (up ? -1 : 0));
                wally_h = wally_h < 0 ? 0 : wally_h;
                wallx_h = Math.floor(x_h);

                wallType_h = this._state.map[wally_h][wallx_h];
                if (wallType_h > 0) {
                    distx = x_h - this._state.player.x;
                    disty = y_h - this._state.player.y;
                    dist_h = distx * distx + disty * disty;
                    xHit_h = x_h;
                    yHit_h = y_h;

                    texturex_h = x_h % 1;
                    if (up) {
                        texturex_h = 1 - texturex_h;
                    }

                    do_h = false;
                }
                x_h += dx_h;
                y_h += dy_h;
            }
        }

        if (dist_h !== -1 && (dist_v === -1 || dist_v > dist_h)) {
            return [Math.sqrt(dist_h), texturex_h, wallType_h, xHit_h, yHit_h];
        } else {
            return [Math.sqrt(dist_v), texturex_v, wallType_v, xHit_v, yHit_v];
        }
    },

    drawStrip: function (index, dist, texturex, wallType, hitX, hitY, rayAngle) {
        "use strict";

        var textureWidth = this._options.textureWidth,
            textureHeight = this._options.textureHeight,
            screenHeight = this._options.screenHeight,
            stripWidth = this._options.stripWidth,
            ctx = this._ctx;
        var textureOffset = this._options.wallTextureMapping[wallType];
        var textureOffset_h = textureOffset !== undefined ? textureOffset[0] : 0,
            textureOffset_v = textureOffset !== undefined ? textureOffset[1] : 0;

        var height = Math.round(this._viewDist / dist);
        var x = index * stripWidth;
        var y = Math.round((screenHeight - height) / 2);

        try {
            ctx.drawImage(this._wallTextureAtlas,
                Math.floor(textureOffset_h +
                    texturex * textureWidth),
                textureOffset_v,
                1,
                textureHeight,
                x,
                y,
                stripWidth,
                height);
        } catch (e) {
            // Fallback to solid color
            ctx.fillStyle = "#333344";
            ctx.fillRect(x, y, stripWidth, height);
        }
    },

    circleImage: function (image) {
        "use strict";
        var rot,
            skyWidth = this._options.screenWidth,
            leftOverWidth = 0,
            ctx = this._ctx,
            screenHeight = this._options.screenHeight,
            screenWidth = this._options.screenWidth,
            xoffset;

        xoffset = this._state.player.rot;
        xoffset %= this.TWO_PI;
        if (xoffset < 0) {
            xoffset += this.TWO_PI;
        }

        rot = xoffset * (image.width / this.TWO_PI);

        if (rot + skyWidth > image.width) {
            leftOverWidth = rot + skyWidth - image.width;
            skyWidth -= leftOverWidth;
        }

        if (skyWidth > 0) {
            ctx.drawImage(image,
                rot, 0, skyWidth, screenHeight / 2,
                0, 0, skyWidth, screenHeight / 2);
        }

        if (leftOverWidth > 0) {
            ctx.drawImage(image,
                0, 0, leftOverWidth, screenHeight / 2,
                skyWidth - 1, 0, leftOverWidth, screenHeight / 2);
        }
    }
});
