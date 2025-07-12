/**
 * AudioEngine.js - Spatial audio and generative soundscapes
 * Creates an immersive audio experience that responds to user interaction
 */

export class AudioEngine {
    constructor() {
        this.enabled = false;
        this.initialized = false;
        this.sounds = new Map();
        this.activeNotes = new Set();
        this.spatialSounds = [];
        
        // Audio context will be created on user interaction
        this.context = null;
        this.masterGain = null;
        
        // Generative music parameters
        this.scale = ['C', 'D', 'E', 'G', 'A']; // Pentatonic scale
        this.octaves = [3, 4, 5];
        this.currentChord = [];
        
        this.setupAudioButton();
    }
    
    setupAudioButton() {
        const audioToggle = document.getElementById('audio-toggle');
        if (audioToggle) {
            audioToggle.addEventListener('click', () => {
                if (!this.initialized) {
                    this.init();
                } else {
                    this.toggle();
                }
            });
        }
    }
    
    async init() {
        try {
            // Initialize Tone.js
            await Tone.start();
            this.context = Tone.context;
            
            // Master gain for volume control
            this.masterGain = new Tone.Gain(0.7).toDestination();
            
            // Setup effects chain
            this.setupEffects();
            
            // Setup instruments
            this.setupInstruments();
            
            // Setup spatial audio
            this.setupSpatialAudio();
            
            // Start ambient soundscape
            this.startAmbientSoundscape();
            
            this.initialized = true;
            this.enabled = true;
            
            // Update UI
            const audioToggle = document.getElementById('audio-toggle');
            if (audioToggle) {
                audioToggle.classList.add('active');
            }
            
            console.log('Audio Engine initialized');
        } catch (error) {
            console.error('Failed to initialize audio:', error);
        }
    }
    
    setupEffects() {
        // Reverb for space atmosphere
        this.reverb = new Tone.Reverb({
            decay: 8,
            wet: 0.5
        }).connect(this.masterGain);
        
        // Delay for echo effects
        this.delay = new Tone.FeedbackDelay({
            delayTime: "8n",
            feedback: 0.3,
            wet: 0.2
        }).connect(this.reverb);
        
        // Filter for sweeps
        this.filter = new Tone.AutoFilter({
            frequency: 0.2,
            octaves: 3,
            wet: 0.3
        }).connect(this.delay).start();
        
        // Chorus for richness
        this.chorus = new Tone.Chorus({
            frequency: 0.5,
            delayTime: 3.5,
            depth: 0.7,
            wet: 0.3
        }).connect(this.filter);
    }
    
    setupInstruments() {
        // Ambient pad synthesizer
        this.padSynth = new Tone.PolySynth(Tone.Synth, {
            oscillator: {
                type: "sawtooth"
            },
            envelope: {
                attack: 2,
                decay: 1,
                sustain: 0.5,
                release: 4
            }
        }).connect(this.chorus);
        
        // Bell-like synth for interactions
        this.bellSynth = new Tone.PolySynth(Tone.FMSynth, {
            harmonicity: 8,
            modulationIndex: 2,
            envelope: {
                attack: 0.001,
                decay: 0.4,
                sustain: 0.1,
                release: 1.2
            }
        }).connect(this.delay);
        
        // Bass drone
        this.bassSynth = new Tone.MonoSynth({
            oscillator: {
                type: "sine"
            },
            envelope: {
                attack: 0.5,
                decay: 0.2,
                sustain: 0.8,
                release: 2
            }
        }).connect(this.reverb);
        
        // Particle sound synthesizer
        this.particleSynth = new Tone.PolySynth(Tone.AMSynth, {
            harmonicity: 0.5,
            envelope: {
                attack: 0.01,
                decay: 0.1,
                sustain: 0.1,
                release: 0.3
            }
        }).connect(this.filter);
    }
    
    setupSpatialAudio() {
        // 3D panner for spatial positioning
        this.panner3D = new Tone.Panner3D({
            panningModel: "HRTF",
            distanceModel: "inverse",
            refDistance: 1,
            maxDistance: 10000,
            rolloffFactor: 1,
            coneInnerAngle: 360,
            coneOuterAngle: 0,
            coneOuterGain: 0
        }).connect(this.masterGain);
        
        // Listener position (camera)
        this.listenerPosition = { x: 0, y: 0, z: 0 };
    }
    
    startAmbientSoundscape() {
        if (!this.enabled) return;
        
        // Ambient pad progression
        const chordProgressions = [
            ['C3', 'E3', 'G3', 'C4'],
            ['A2', 'C3', 'E3', 'A3'],
            ['F2', 'A2', 'C3', 'F3'],
            ['G2', 'B2', 'D3', 'G3']
        ];
        
        let chordIndex = 0;
        
        // Play ambient chords
        const playChord = () => {
            if (!this.enabled) return;
            
            const chord = chordProgressions[chordIndex];
            this.currentChord = chord;
            
            // Fade in new chord
            chord.forEach((note, i) => {
                setTimeout(() => {
                    this.padSynth.triggerAttack(note, undefined, 0.3);
                }, i * 100);
            });
            
            // Fade out after duration
            setTimeout(() => {
                this.padSynth.releaseAll();
            }, 12000);
            
            chordIndex = (chordIndex + 1) % chordProgressions.length;
        };
        
        // Start chord progression
        playChord();
        this.chordInterval = setInterval(playChord, 15000);
        
        // Generative melody
        this.startGenerativeMelody();
        
        // Bass drone
        this.playBassDrone();
    }
    
    startGenerativeMelody() {
        const playNote = () => {
            if (!this.enabled) return;
            
            // Random note from scale
            const note = this.scale[Math.floor(Math.random() * this.scale.length)];
            const octave = this.octaves[Math.floor(Math.random() * this.octaves.length)];
            const fullNote = note + octave;
            
            // Random velocity and duration
            const velocity = Math.random() * 0.3 + 0.1;
            const duration = Math.random() > 0.7 ? "4n" : "8n";
            
            // Play with slight randomness in timing
            setTimeout(() => {
                this.bellSynth.triggerAttackRelease(fullNote, duration, undefined, velocity);
            }, Math.random() * 200);
            
            // Schedule next note
            const nextTime = Math.random() * 4000 + 2000;
            this.melodyTimeout = setTimeout(playNote, nextTime);
        };
        
        playNote();
    }
    
    playBassDrone() {
        if (!this.enabled) return;
        
        const bassNote = 'C1';
        this.bassSynth.triggerAttack(bassNote, undefined, 0.2);
        
        // Subtle frequency modulation
        const lfo = new Tone.LFO(0.05, 60, 80).start();
        lfo.connect(this.bassSynth.frequency);
    }
    
    // Sound effects for interactions
    playHoverSound(position) {
        if (!this.enabled) return;
        
        const notes = ['C5', 'E5', 'G5', 'C6'];
        const note = notes[Math.floor(Math.random() * notes.length)];
        
        this.bellSynth.triggerAttackRelease(note, "16n", undefined, 0.2);
        
        // Create spatial sound at position
        this.createSpatialSound(position, note, 0.5);
    }
    
    playClickSound(position) {
        if (!this.enabled) return;
        
        // Chord based on current ambient chord
        const clickChord = this.currentChord.map(note => {
            const noteNum = parseInt(note.slice(-1));
            return note.slice(0, -1) + (noteNum + 1);
        });
        
        this.bellSynth.triggerAttackRelease(clickChord, "4n", undefined, 0.4);
        
        // Spatial effect
        clickChord.forEach(note => {
            this.createSpatialSound(position, note, 1);
        });
    }
    
    playParticleSound(count) {
        if (!this.enabled) return;
        
        // More particles = higher pitch
        const baseFreq = 200 + (count * 2);
        const freq = Math.min(baseFreq, 2000);
        
        this.particleSynth.triggerAttackRelease(freq, "32n", undefined, 0.1);
    }
    
    playTransitionSound(fromMode, toMode) {
        if (!this.enabled) return;
        
        // Sweep effect
        const sweep = new Tone.FrequencySweep({
            start: 200,
            end: 2000,
            sweep: 0.5
        }).connect(this.filter);
        
        sweep.trigger();
        
        // Mode-specific chord
        const modeChords = {
            grid: ['C4', 'E4', 'G4'],
            constellation: ['A3', 'C4', 'E4'],
            timeline: ['F3', 'A3', 'C4'],
            cosmos: ['G3', 'B3', 'D4']
        };
        
        const chord = modeChords[toMode] || modeChords.grid;
        this.bellSynth.triggerAttackRelease(chord, "2n", undefined, 0.3);
    }
    
    createSpatialSound(position, note, volume) {
        const synth = new Tone.MonoSynth({
            oscillator: { type: "sine" },
            envelope: {
                attack: 0.01,
                decay: 0.2,
                sustain: 0,
                release: 0.5
            }
        });
        
        const panner = new Tone.Panner3D({
            positionX: position.x / 100,
            positionY: position.y / 100,
            positionZ: position.z / 100
        }).connect(this.masterGain);
        
        synth.connect(panner);
        synth.triggerAttackRelease(note, "8n", undefined, volume);
        
        // Clean up after sound completes
        setTimeout(() => {
            synth.dispose();
            panner.dispose();
        }, 2000);
    }
    
    updateListenerPosition(position) {
        this.listenerPosition = position;
        
        if (this.panner3D) {
            Tone.Listener.positionX.value = position.x / 100;
            Tone.Listener.positionY.value = position.y / 100;
            Tone.Listener.positionZ.value = position.z / 100;
        }
    }
    
    updateListenerOrientation(forward, up) {
        if (this.panner3D) {
            Tone.Listener.forwardX.value = forward.x;
            Tone.Listener.forwardY.value = forward.y;
            Tone.Listener.forwardZ.value = forward.z;
            Tone.Listener.upX.value = up.x;
            Tone.Listener.upY.value = up.y;
            Tone.Listener.upZ.value = up.z;
        }
    }
    
    setVolume(value) {
        if (this.masterGain) {
            this.masterGain.gain.rampTo(value, 0.1);
        }
    }
    
    toggle() {
        this.enabled = !this.enabled;
        
        const audioToggle = document.getElementById('audio-toggle');
        if (audioToggle) {
            audioToggle.classList.toggle('active', this.enabled);
        }
        
        if (!this.enabled) {
            this.stop();
        } else {
            this.startAmbientSoundscape();
        }
    }
    
    stop() {
        // Stop all sounds
        if (this.padSynth) this.padSynth.releaseAll();
        if (this.bassSynth) this.bassSynth.triggerRelease();
        
        // Clear intervals and timeouts
        if (this.chordInterval) clearInterval(this.chordInterval);
        if (this.melodyTimeout) clearTimeout(this.melodyTimeout);
        
        // Stop transport
        Tone.Transport.stop();
    }
    
    dispose() {
        this.stop();
        
        // Dispose of all audio nodes
        if (this.padSynth) this.padSynth.dispose();
        if (this.bellSynth) this.bellSynth.dispose();
        if (this.bassSynth) this.bassSynth.dispose();
        if (this.particleSynth) this.particleSynth.dispose();
        
        if (this.reverb) this.reverb.dispose();
        if (this.delay) this.delay.dispose();
        if (this.filter) this.filter.dispose();
        if (this.chorus) this.chorus.dispose();
        if (this.panner3D) this.panner3D.dispose();
        if (this.masterGain) this.masterGain.dispose();
        
        this.sounds.clear();
        this.activeNotes.clear();
    }
}

// Export for use
window.AudioEngine = AudioEngine;