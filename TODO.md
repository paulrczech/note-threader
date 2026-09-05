# Eddy — TODO

## UI / Feel
- **Collapsible strategy card ("The Drift")** — toggle to collapsed state: strategy text smaller/truncated, refresh icon always visible. Replace "another" button label with refresh icon in both states. Easy lift.
- **Native feel — IonSegment for toggles** — replace Voices and Movement toggle buttons on HomeView with `IonSegment`/`IonSegmentButton` for a more native selection feel
- **Native feel — IonItemSliding for swipe-to-delete** — replace custom swipe implementation in `SequenceHistory.vue` with Ionic's native gesture component
- **Native feel — IonToast for "saved" flash** — replace inline text swap with `IonToast` notification
- **Opt-in "show labels" toggle** — a light instructional-overlay mode, off by default: small captions near the handful of controls that aren't self-explanatory at a glance (subdivision note-glyphs, arpeggio-direction icons, multi-select toggle). Not a forced first-launch tutorial, not annotating everything — just a togglable help layer for the few genuinely non-obvious icons. Worth its own planning pass before implementing.

## Sound
- **Grid slider layout polish** — `settingsStore.subdivision` (half/quarter/8th/triplet/16th) now drives both live playback and MIDI export from one shared value, exposed as an `IonRange` with custom `NoteGlyph` labels in the SessionView tray ("grid"). First pass shipped and functional; revisit spacing/alignment between the range's snap ticks and the label row once it's been seen on a device
- **Harmonium as a meditative instrument option** — the same sample library the harp/guitars come from (nbrosowsky/tonejs-instruments) includes a harmonium: bellows-driven, continuous tone, no percussive attack by nature — a real candidate for looping without the piano/guitar attack getting jarring on repeat. Needs an actual listen before committing (cello and violin came from the same pack and got pulled for not sounding good on the available samples) — not a blind add.

## Voice Leading / Strategies
- **Widen "all-half-same-direction" beyond ±1 semitone** — currently the only strategy that shifts every voice together preserving cluster shape (`src/data/strategies.ts`), but it's capped at a half step in either direction since `movementType: 'half'` only allows a 1-semitone step. Consider generating a few shift-amount options (whole step, minor third, etc.) rather than just up/down by one half step.
- **Fix "parallel-mode" and "relative-shift" to match their own hint text** — both describe ensemble motion ("voices shift toward...") but are coded as `movementType: 'step'` with `voicesAllowedToMove: 'all'`, which routes them through the single-voice-movement generator (`generateSingleVoiceCandidates`) instead of the all-voices-together one (`generateAllVoiceSameDirection`) — only that exact combination of `movementType: 'half'|'whole'` + `voicesAllowedToMove: 'all'` triggers real parallel motion in `useVoiceLeading.ts`. Also worth checking "power-chord" (`movementType: 'power'`) the same way — its hint describes collapsing to root+fifth, but `power` isn't a case `intervalBounds()` handles, so it silently falls through to generic single-voice movement too.

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
