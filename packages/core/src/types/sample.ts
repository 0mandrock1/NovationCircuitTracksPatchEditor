/**
 * Sample metadata and model types for Circuit Tracks sample management.
 *
 * Circuit Tracks supports up to 64 sample slots.
 * Audio format: 16-bit PCM, 48 kHz, mono.
 * Max single sample: 98.3 seconds (~9.4 MB)
 * Total storage: ~15 MB (~196.6 seconds cumulative)
 */

export interface SampleMeta {
  /** Slot index: 0–63 */
  slot: number;
  /** Sample name (up to 15 chars, from SysEx header) */
  name: string;
  /** Duration in seconds */
  durationSeconds: number;
  /** File size in bytes (post-conversion, 16-bit 48kHz mono) */
  sizeBytes: number;
  /** Whether the slot is populated */
  populated: boolean;
}

export interface SampleEdit {
  /** Trim start in seconds */
  trimStart: number;
  /** Trim end in seconds */
  trimEnd: number;
  /** Root note (MIDI note number 0–127, default 60 = C4) */
  rootNote: number;
  /** Transpose in semitones: −24 to +24 */
  transpose: number;
  /** Normalize to peak: 0.0–1.0 (1.0 = 0 dBFS) */
  normalizeTarget: number;
  /** Playback mode: 0 = one-shot, 1 = loop */
  loopMode: 0 | 1;
}

export interface SampleStorageSummary {
  /** Total slots: always 64 */
  totalSlots: 64;
  /** Number of populated slots */
  usedSlots: number;
  /** Total duration of all samples in seconds */
  totalDurationSeconds: number;
  /** Total size in bytes */
  totalSizeBytes: number;
  /** Maximum allowed total duration in seconds */
  maxDurationSeconds: 196.6;
  /** Maximum allowed total size in bytes (~15 MB) */
  maxSizeBytes: 15728640;
}
