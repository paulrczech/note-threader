# Eddy — TODO

## UI / Feel
- **Collapsible strategy card ("The Drift")** — toggle to collapsed state: strategy text smaller/truncated, refresh icon always visible. Replace "another" button label with refresh icon in both states. Easy lift.
- **Native feel — IonSegment for toggles** — replace Voices and Movement toggle buttons on HomeView with `IonSegment`/`IonSegmentButton` for a more native selection feel
- **Native feel — IonItemSliding for swipe-to-delete** — replace custom swipe implementation in `SequenceHistory.vue` with Ionic's native gesture component
- **Native feel — IonToast for "saved" flash** — replace inline text swap with `IonToast` notification
- **Opt-in "show labels" toggle** — a light instructional-overlay mode, off by default: small captions near the handful of controls that aren't self-explanatory at a glance (subdivision note-glyphs, arpeggio-direction icons, multi-select toggle). Not a forced first-launch tutorial, not annotating everything — just a togglable help layer for the few genuinely non-obvious icons. Worth its own planning pass before implementing.

## Sound
- **Grid slider layout polish** — `settingsStore.subdivision` (half/quarter/8th/triplet/16th) now drives both live playback and MIDI export from one shared value, exposed as an `IonRange` with custom `NoteGlyph` labels in the SessionView tray ("grid"). First pass shipped and functional; revisit spacing/alignment between the range's snap ticks and the label row once it's been seen on a device
- **Harmonium as a meditative instrument option** — the same sample library the guitars come from (nbrosowsky/tonejs-instruments) includes a harmonium: bellows-driven, continuous tone, no percussive attack by nature — a real candidate for looping without the piano/guitar attack getting jarring on repeat. Needs an actual listen before committing (cello, violin, and harp came from the same pack and got pulled for not sounding good/right) — not a blind add.
- **String orchestra for chordal/pad playback** — sustained, swelling texture suited to chord-mode articulation specifically (see arpeggioDirection `'chord'`). A FluidR3 SoundFont version was tried and rejected (distortion, then just not the right character even after the fix); a choir and a second pad candidate went through the same real-sample-pack evaluation as the holdsworthian pad but weren't kept. No string orchestra candidate tried yet.
- **Attack/release tied to arpeggio vs. chord playback** — pondered, not scoped: should `useAudioEngine.ts`'s per-instrument attack/release (currently fixed per instrument in `RELEASE_TIMES`/`NOTE_DURATIONS`) instead vary by `arpeggioDirection`, e.g. a snappier attack for arpeggiated playback and a slower attack/longer release specifically in `'chord'` mode? Worth a real design pass before touching it.

## Voice Leading / Strategies
- **Fix "tritone-sub" and "resolve-wrong" to match their own hint text** — same bug pattern just fixed for parallel-mode/relative-shift/power-chord: both describe multi-voice motion ("Voices shift by a tritone...", "Voices move by step toward the IV chord...") but are coded as `voicesAllowedToMove: 'all'` with a plain `movementType` ('tritone' / 'step'), so they fall through to the single-voice-movement generator in `useVoiceLeading.ts` instead of moving together. Not touched yet because they weren't in scope for the last pass — same fix shape as `group-shift`/`group-step`/`parallel-quality` should apply directly.

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
