import * as Tone from 'tone';
class MusicSystem {
  private synth: Tone.PolySynth | null = null;
  private sequence: Tone.Sequence | null = null;
  private isInitialized = false;
  private isPlaying = false;
  async init() {
    if (this.isInitialized) return;
    try {
      // Tone.start() must be called in response to a user gesture.
      await Tone.start();
      // Create a polyphonic synth with a playful tone
      this.synth = new Tone.PolySynth(Tone.Synth, {
        oscillator: {
          type: "triangle"
        },
        envelope: {
          attack: 0.02,
          decay: 0.1,
          sustain: 0.1,
          release: 1
        }
      }).toDestination();
      // Set volume low so it's background music (-16dB)
      this.synth.volume.value = -16;
      // C Major Pentatonic Scale: C4, D4, E4, G4, A4
      // Extended with some variation
      const notes = ["C4", "D4", "E4", "G4", "A4", "C5", "E5"];
      // Create a generative sequence
      // 8 steps (1 bar of 4/4 at 8th notes)
      this.sequence = new Tone.Sequence((time, col) => {
        if (!this.synth) return;
        // 50% chance to play a note on any given step for a sparse, rhythmic feel
        if (Math.random() > 0.5) {
            const note = notes[Math.floor(Math.random() * notes.length)];
            // Short duration for playful staccato feel
            this.synth.triggerAttackRelease(note, "16n", time);
        }
      }, [0, 1, 2, 3, 4, 5, 6, 7], "8n");
      // Set BPM
      Tone.Transport.bpm.value = 110;
      this.isInitialized = true;
      console.log("MusicSystem initialized");
    } catch (e) {
      console.warn("Failed to initialize MusicSystem:", e);
    }
  }
  start() {
    if (!this.isInitialized) return;
    if (this.isPlaying) return;
    // Start the transport and the sequence
    Tone.Transport.start();
    this.sequence?.start(0);
    this.isPlaying = true;
  }
  stop() {
    if (!this.isInitialized) return;
    if (!this.isPlaying) return;
    this.sequence?.stop();
    Tone.Transport.stop();
    this.isPlaying = false;
  }
}
export const musicSystem = new MusicSystem();