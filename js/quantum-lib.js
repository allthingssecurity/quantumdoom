/*
 * Quantum Doom - Quantum Physics Concepts Library
 * Contains all quantum concepts that flash on screen when killing enemies
 */

if (typeof qd === 'undefined') {
    var qd = {};
}

// Quantum Physics Concepts - shown when player kills enemies
qd.quantumConcepts = [
    {
        title: "SUPERPOSITION",
        description: "A quantum particle exists in all possible states simultaneously until observed!",
        icon: "⚛️",
        color: "#00ffff"
    },
    {
        title: "WAVE-PARTICLE DUALITY",
        description: "Light and matter exhibit both wave-like and particle-like properties!",
        icon: "🌊",
        color: "#ff00ff"
    },
    {
        title: "QUANTUM ENTANGLEMENT",
        description: "Two particles become connected - measuring one instantly affects the other!",
        icon: "🔗",
        color: "#ffff00"
    },
    {
        title: "HEISENBERG UNCERTAINTY",
        description: "You cannot know both position and momentum of a particle precisely!",
        icon: "❓",
        color: "#ff8800"
    },
    {
        title: "QUANTUM TUNNELING",
        description: "Particles can pass through barriers that classical physics says are impossible!",
        icon: "🚀",
        color: "#00ff88"
    },
    {
        title: "WAVE FUNCTION COLLAPSE",
        description: "Observation causes quantum superposition to collapse into a definite state!",
        icon: "👁️",
        color: "#ff0088"
    },
    {
        title: "SCHRÖDINGER'S CAT",
        description: "A thought experiment: the cat is both alive and dead until observed!",
        icon: "🐱",
        color: "#88ff00"
    },
    {
        title: "QUANTUM DECOHERENCE",
        description: "Interaction with environment causes quantum systems to lose coherence!",
        icon: "💨",
        color: "#8800ff"
    },
    {
        title: "PLANCK'S CONSTANT",
        description: "Energy is quantized in discrete packets called quanta - h = 6.626×10⁻³⁴ J·s!",
        icon: "📊",
        color: "#00ff00"
    },
    {
        title: "QUANTUM SPIN",
        description: "Intrinsic angular momentum of particles - can be up ↑ or down ↓!",
        icon: "🔄",
        color: "#ff4400"
    },
    {
        title: "PAULI EXCLUSION",
        description: "No two identical fermions can occupy the same quantum state!",
        icon: "🚫",
        color: "#4488ff"
    },
    {
        title: "QUANTUM INTERFERENCE",
        description: "Probability amplitudes add up, creating interference patterns!",
        icon: "〰️",
        color: "#ff88ff"
    },
    {
        title: "ZERO-POINT ENERGY",
        description: "Even at absolute zero, quantum systems retain fluctuating energy!",
        icon: "❄️",
        color: "#88ffff"
    },
    {
        title: "QUANTUM CHROMODYNAMICS",
        description: "Quarks interact via the strong force through gluons with color charge!",
        icon: "🎨",
        color: "#ff0000"
    },
    {
        title: "PHOTON",
        description: "The quantum of light - massless particle carrying electromagnetic force!",
        icon: "💡",
        color: "#ffff88"
    },
    {
        title: "DE BROGLIE WAVELENGTH",
        description: "All matter has a wavelength: λ = h/p (Planck's constant / momentum)!",
        icon: "📐",
        color: "#88ff88"
    },
    {
        title: "QUANTUM FOAM",
        description: "At Planck scale, spacetime becomes a turbulent sea of virtual particles!",
        icon: "🫧",
        color: "#ff8888"
    },
    {
        title: "BELL'S THEOREM",
        description: "Local hidden variables cannot explain quantum correlations - spooky action!",
        icon: "🔔",
        color: "#8888ff"
    },
    {
        title: "QUANTUM TELEPORTATION",
        description: "Quantum information can be transmitted using entanglement!",
        icon: "✨",
        color: "#ffaa00"
    },
    {
        title: "BOHR MODEL",
        description: "Electrons orbit the nucleus in discrete energy levels - quantum jumps!",
        icon: "🎯",
        color: "#00aaff"
    }
];

// Track which concepts have been shown
qd.shownConcepts = [];
qd.conceptIndex = 0;

// Get next quantum concept
qd.getNextConcept = function () {
    // Shuffle if we've shown all concepts
    if (qd.conceptIndex >= qd.quantumConcepts.length) {
        qd.conceptIndex = 0;
        qd.shuffleConcepts();
    }

    var concept = qd.quantumConcepts[qd.conceptIndex];
    qd.conceptIndex++;
    return concept;
};

// Shuffle the concepts array
qd.shuffleConcepts = function () {
    for (var i = qd.quantumConcepts.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var temp = qd.quantumConcepts[i];
        qd.quantumConcepts[i] = qd.quantumConcepts[j];
        qd.quantumConcepts[j] = temp;
    }
};

// Initialize by shuffling
qd.shuffleConcepts();

// Mixin class for animated sprites
qd.AnimatedSprite = ge.Class.create({
    runAnimation: function (startOffset, endOffset, options, callback) {
        "use strict";

        this._animationLoopStart = true;
        this._animationDirection = 1;
        this._animationLoopStartOffset = startOffset;
        this._animationLoopEndOffset = endOffset;
        this._animationOptions = options;
        this._callback = callback;

        if (this._animationLoop === undefined) {

            this._animationLoop = ge.bind(function (state) {

                if (this._animationLoopStart === true) {
                    // Start at the first frame
                    this._state.spriteOffsetX = this._animationLoopStartOffset;
                    this._animationLoopStart = false;

                } else {
                    var frameWidth = qd.AnimatedSprite.FRAME_WIDTH;

                    if (this._animationDirection === 1) {
                        // Moving forward
                        this._state.spriteOffsetX += frameWidth;

                        // Check if we've reached or passed the end
                        if (this._state.spriteOffsetX >= this._animationLoopEndOffset) {
                            this._state.spriteOffsetX = this._animationLoopEndOffset;

                            if (this._animationOptions.oscillate === true) {
                                this._animationDirection = -1;
                            } else if (this._animationOptions.singlerun === true) {
                                if (this._callback !== undefined) {
                                    this._callback();
                                }
                                this._animationLoop = undefined;
                                return;
                            } else {
                                // Loop back to start
                                this._state.spriteOffsetX = this._animationLoopStartOffset;
                            }
                        }
                    } else {
                        // Moving backward (oscillation)
                        this._state.spriteOffsetX -= frameWidth;

                        // Check if we've reached or passed the start
                        if (this._state.spriteOffsetX <= this._animationLoopStartOffset) {
                            this._state.spriteOffsetX = this._animationLoopStartOffset;
                            this._animationDirection = 1;
                        }
                    }
                }

                window.setTimeout(this._animationLoop, this._animationOptions.speed);

            }, this);

            window.setTimeout(this._animationLoop, this._animationOptions.speed);
        }
    }
});
qd.AnimatedSprite.FRAME_WIDTH = 64;

// Mixin class for moving sprites
qd.MovingSprite = ge.Class.create({

    runMove: function (loopFrequency) {
        "use strict";
        var moveLoop = ge.bind(function () {
            if (this.move() !== false && this._controller.running === true) {
                window.setTimeout(moveLoop, loopFrequency);
            }
        }, this);
        window.setTimeout(moveLoop, loopFrequency);
    },

    move: function () {
    },

    isDead: function () {
        return this._dead;
    }
});

// Show quantum concept flash
qd.showQuantumConcept = function () {
    var concept = qd.getNextConcept();
    var flash = document.getElementById('quantum-flash');

    flash.innerHTML = `
        <div class="concept-icon">${concept.icon}</div>
        <div class="concept-title" style="color: ${concept.color}">${concept.title}</div>
        <div class="concept-description">${concept.description}</div>
    `;

    flash.classList.add('active');

    // Play quantum sound effect
    if (window.SoundFX) {
        window.SoundFX.play('quantum');
    }

    // Update concepts learned counter
    qd.game.stats.conceptsLearned++;

    setTimeout(function () {
        flash.classList.remove('active');
    }, 2800);
};
