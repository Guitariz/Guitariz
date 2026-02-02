// Enhanced Audio Engine with Piano-like Synthesis
// Uses additive synthesis with harmonics and proper ADSR envelope

class AudioEngine {
    private ctx: AudioContext | null = null;
    private masterGain: GainNode | null = null;
    private compressor: DynamicsCompressorNode | null = null;
    private reverb: ConvolverNode | null = null;

    public init() {
        if (!this.ctx) {
            this.ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();

            // Create master chain: compressor -> master gain -> output
            this.compressor = this.ctx.createDynamicsCompressor();
            this.compressor.threshold.value = -24;
            this.compressor.knee.value = 30;
            this.compressor.ratio.value = 12;
            this.compressor.attack.value = 0.003;
            this.compressor.release.value = 0.25;

            this.masterGain = this.ctx.createGain();
            this.masterGain.gain.value = 0.5;

            this.compressor.connect(this.masterGain);
            this.masterGain.connect(this.ctx.destination);

            // Create simple reverb
            this.createReverb();
        }
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    private async createReverb() {
        if (!this.ctx || !this.compressor) return;

        // Create a simple algorithmic reverb using delay
        const convolver = this.ctx.createConvolver();
        const reverbTime = 1.5;
        const sampleRate = this.ctx.sampleRate;
        const length = sampleRate * reverbTime;
        const impulse = this.ctx.createBuffer(2, length, sampleRate);

        for (let channel = 0; channel < 2; channel++) {
            const channelData = impulse.getChannelData(channel);
            for (let i = 0; i < length; i++) {
                channelData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 2);
            }
        }

        convolver.buffer = impulse;
        this.reverb = convolver;

        // Wet/dry mix for reverb
        const reverbGain = this.ctx.createGain();
        reverbGain.gain.value = 0.15; // 15% wet
        this.reverb.connect(reverbGain);
        reverbGain.connect(this.compressor);
    }

    // Play a piano-like note using additive synthesis
    playPianoNote(freq: number, duration: number = 1.0, startTime?: number) {
        this.init();
        if (!this.ctx || !this.compressor) return;

        const now = startTime ?? this.ctx.currentTime;

        // Harmonic series for piano-like timbre
        const harmonics = [
            { ratio: 1, amp: 1.0 },      // Fundamental
            { ratio: 2, amp: 0.5 },      // 2nd harmonic
            { ratio: 3, amp: 0.25 },     // 3rd harmonic
            { ratio: 4, amp: 0.125 },    // 4th harmonic
            { ratio: 5, amp: 0.0625 },   // 5th harmonic
            { ratio: 6, amp: 0.03 },     // 6th harmonic
        ];

        // Create envelope
        const envelope = this.ctx.createGain();
        envelope.gain.setValueAtTime(0, now);

        // ADSR Envelope (Piano-like: fast attack, medium decay, low sustain, medium release)
        const attack = 0.005;
        const decay = 0.3;
        const sustainLevel = 0.3;
        const release = 0.5;

        envelope.gain.linearRampToValueAtTime(0.8, now + attack);
        envelope.gain.exponentialRampToValueAtTime(sustainLevel, now + attack + decay);
        envelope.gain.setValueAtTime(sustainLevel, now + duration - release);
        envelope.gain.exponentialRampToValueAtTime(0.001, now + duration);

        // Connect envelope to output
        envelope.connect(this.compressor);
        if (this.reverb) {
            envelope.connect(this.reverb);
        }

        // Create oscillators for each harmonic
        const oscillators: OscillatorNode[] = [];

        harmonics.forEach(({ ratio, amp }) => {
            const osc = this.ctx!.createOscillator();
            const oscGain = this.ctx!.createGain();

            // Use sine waves for cleaner piano sound
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq * ratio, now);

            // Slight pitch variation for warmth
            if (ratio === 1) {
                osc.detune.setValueAtTime(-3, now); // Slight flat
            }

            oscGain.gain.setValueAtTime(amp * 0.15, now);

            osc.connect(oscGain);
            oscGain.connect(envelope);

            osc.start(now);
            osc.stop(now + duration + 0.1);

            oscillators.push(osc);
        });

        // Cleanup
        setTimeout(() => {
            oscillators.forEach(osc => {
                try { osc.disconnect(); } catch { /* ignore */ }
            });
            try { envelope.disconnect(); } catch { /* ignore */ }
        }, (duration + 0.5) * 1000);
    }

    // Play two notes as an interval
    playInterval(freq1: number, freq2: number, delayBetween: number = 0.7) {
        this.init();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;

        // First note
        this.playPianoNote(freq1, 1.2, now);

        // Second note (slightly overlapping for musicality)
        this.playPianoNote(freq2, 1.5, now + delayBetween);
    }

    // Play multiple notes as a chord
    playChord(freqs: number[]) {
        this.init();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;

        freqs.forEach((freq, i) => {
            // Slight strum effect
            this.playPianoNote(freq, 1.5, now + i * 0.02);
        });
    }

    // Play a single note (expose for testing)
    playNote(freq: number, duration: number = 1.0) {
        this.init();
        if (!this.ctx) return;
        this.playPianoNote(freq, duration);
    }
}

export const audioEngine = new AudioEngine();
