# Eddy — TODO

## In Progress / Partially Done
- **Drag-to-reorder in The Flow** — `IonReorderGroup` + `IonReorder` added to `SequenceHistory.vue`, `reorderSequence()` added to store, but `@reorder` event not yet wired up in `SessionView.vue`
- **Error message** — hardcoded "14 semitones" in `HomeView.vue` `startManual()` still needs updating to use `MAX_CLUSTER_SPREAD`

## UI / Feel
- **Collapsible strategy card ("The Drift")** — toggle to collapsed state: strategy text smaller/truncated, refresh icon always visible. Replace "another" button label with refresh icon in both states. Easy lift.
- **Native feel — IonSegment for toggles** — replace Voices and Movement toggle buttons on HomeView with `IonSegment`/`IonSegmentButton` for a more native selection feel
- **Native feel — IonItemSliding for swipe-to-delete** — replace custom swipe implementation in `SequenceHistory.vue` with Ionic's native gesture component
- **Native feel — IonToast for "saved" flash** — replace inline text swap with `IonToast` notification

## Sound
- **Instrument selector UI** — strings/synth engine code already built in `useAudioEngine.ts`; add toggle on HomeView to expose piano, harp, strings, synth options

## Composition / Structure (V2 consideration)
- **Pools** — way to group streams in The Flow into named sub-sections ("pools") for larger composition structure. Proposed UX: "organize" mode → multi-select streams → "create pool" → name it. Remaining streams stay ungrouped or in a default pool. Pools are reorderable, editable, and streams can be moved between them. MIDI export decision needed: one sequence or separate tracks per pool. Recommended first approach: metadata alongside flat sequence array (avoids rewriting engine).
- **Loop active pool** — tap a pool to make it active; loop button plays only that pool's clusters. Falls back to full sequence if no pool active. Easy once Pools exist.

## V2
- **5-voice support**
- **Capacitor native build + App Store submission**
- **Note editing within sequence entries** — scope needs clarification before implementing
