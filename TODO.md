# Eddy — TODO

## UI / Feel
- **Opt-in "show labels" toggle** — a light instructional-overlay mode, off by default: small captions near the handful of controls that aren't self-explanatory at a glance (subdivision note-glyphs, arpeggio-direction icons, multi-select toggle). Not a forced first-launch tutorial, not annotating everything — just a togglable help layer for the few genuinely non-obvious icons. Worth its own planning pass before implementing.

## Sound
- **Grid slider layout polish** — `settingsStore.subdivision` (half/quarter/8th/triplet/16th) now drives both live playback and MIDI export from one shared value, exposed as an `IonRange` with custom `NoteGlyph` labels in the SessionView tray ("grid"). First pass shipped and functional; revisit spacing/alignment between the range's snap ticks and the label row once it's been seen on a device
- **Attack/release tied to arpeggio vs. chord playback** — pondered, not scoped: should `useAudioEngine.ts`'s per-instrument attack/release (currently fixed per instrument in `RELEASE_TIMES`/`NOTE_DURATIONS`) instead vary by `arpeggioDirection`, e.g. a snappier attack for arpeggiated playback and a slower attack/longer release specifically in `'chord'` mode? Worth a real design pass before touching it.

## Composition / Structure (V2 consideration)
- **Pools** — way to group streams in The Flow into named sub-sections ("pools") for larger composition structure. Proposed UX: "organize" mode → multi-select streams → "create pool" → name it. Remaining streams stay ungrouped or in a default pool. Pools are reorderable, editable, and streams can be moved between them. MIDI export decision needed: one sequence or separate tracks per pool. Recommended first approach: metadata alongside flat sequence array (avoids rewriting engine).
- **Loop active pool** — tap a pool to make it active; loop button plays only that pool's clusters. Falls back to full sequence if no pool active. Easy once Pools exist.

## V2
- **5-voice support**
- **Capacitor native build + App Store submission**
  - Set the native iOS audio session category to `playback` (e.g. via a Capacitor plugin or a small native config) so playback ignores the hardware mute switch, matching YouTube/Spotify-style apps. Without this, the app inherits Safari's default Web Audio behavior of going silent when the phone is muted — confirmed on the current Netlify build.
- **Note editing within sequence entries** — scope needs clarification before implementing

## Someday / Discussion
- **DAW plugin** — explore making Eddy an actual plugin instead of (or alongside) a standalone app. Starting point would be AudioUnit, so it could be tested directly in Logic Pro. Way down the list — flagged for discussion, not scoped or planned yet.
