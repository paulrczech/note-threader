<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <button class="nav-btn" @click="goHome">← new</button>
        </ion-buttons>
        <ion-title class="session-title">eddy</ion-title>
        <ion-buttons slot="end">
          <button
            class="nav-btn save-btn icon-btn"
            :class="{ flashed: savedFlash }"
            :disabled="sequenceStore.sequence.length < 1"
            @click="save"
            title="save session">
            <svg
              v-if="!savedFlash"
              width="15"
              height="15"
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg">
              <rect
                x="1"
                y="1"
                width="14"
                height="14"
                rx="1.5"
                stroke="currentColor"
                stroke-width="1.2" />
              <rect
                x="4"
                y="1"
                width="6"
                height="5"
                rx="0.5"
                stroke="currentColor"
                stroke-width="1.2" />
              <rect
                x="3"
                y="8"
                width="10"
                height="6"
                rx="0.5"
                stroke="currentColor"
                stroke-width="1.2" />
            </svg>
            <span v-else style="font-size: 0.7rem; letter-spacing: 0.08em"
              >saved</span
            >
          </button>
          <button
            class="nav-btn icon-btn"
            :disabled="!sequenceStore.canUndo"
            @click="goUndo"
            title="undo">
            ↩
          </button>
          <button
            class="nav-btn icon-btn"
            :disabled="!sequenceStore.canRedo"
            @click="goRedo"
            title="redo">
            ↪
          </button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding" fullscreen>
      <div class="session-layout">
        <!-- Current cluster — displayed large -->
        <div class="current-cluster-block">
          <p class="section-label">current</p>
          <ClusterDisplay
            v-if="sequenceStore.currentCluster"
            :cluster="auditioning ?? sequenceStore.currentCluster" />
        </div>

        <!-- Loop resolved banner -->
        <div v-if="sequenceStore.loopResolved" class="loop-banner">
          a loop has formed — {{ sequenceStore.moveCount }} moves
        </div>

        <!-- Strategy card -->
        <StrategyCard
          v-if="activeStrategy && !sequenceStore.loopResolved"
          :strategy="activeStrategy"
          @redraw="redraw" />

        <!-- Candidates -->
        <div
          v-if="!sequenceStore.loopResolved && candidates.length > 0"
          class="candidates-block">
          <div class="candidates-header">
            <p class="section-label">streams — tap to hear</p>
            <button
              class="multi-toggle"
              :class="{ active: multiSelect }"
              @click="toggleMultiSelect">
              multi
            </button>
          </div>
          <div class="candidates-grid" :class="{ 'multi-active': multiSelect }">
            <button
              v-for="(cluster, i) in candidates"
              :key="clusterKey(cluster)"
              class="candidate-pill"
              :class="{ selected: selectionOrder(i) > 0 }"
              @click="selectCandidate(cluster, i)">
              <span class="pill-order" v-if="selectionOrder(i) > 0">{{
                selectionOrder(i)
              }}</span>
              <span
                v-for="(midi, v) in cluster"
                :key="v"
                class="pill-note"
                :style="{ color: voiceColors[v] }"
                >{{ midiToName(midi) }}</span
              >
            </button>
          </div>
        </div>

        <!-- No candidates warning -->
        <div
          v-else-if="
            !sequenceStore.loopResolved &&
            candidates.length === 0 &&
            activeStrategy
          "
          class="no-candidates">
          <p>
            no valid moves —
            <button class="inline-btn" @click="redraw">try another</button>
          </p>
        </div>

        <!-- Confirm button -->
        <div
          v-if="selectedIndices.length > 0 && !sequenceStore.loopResolved"
          class="confirm-block">
          <button class="confirm-btn" @click="confirmSelection">
            {{
              selectedIndices.length === 1
                ? 'keep this'
                : 'keep these ' + selectedIndices.length
            }}
          </button>
        </div>

        <!-- Sequence history -->
        <SequenceHistory
          v-if="sequenceStore.sequence.length > 0"
          :sequence="sequenceStore.sequence"
          :loop-point="sequenceStore.loopPoint"
          :playing-index="isPlaying ? playingIndex : -1"
          @audition="auditionHistoryCluster"
          @delete="deleteCluster"
          @edit="editCluster"
          @reorder="reorderClusters" />
      </div>
    </ion-content>

    <ion-footer class="playback-footer">
      <div class="footer-bar">
        <button
          class="footer-icon-btn play-stop"
          :class="{ playing: isPlaying }"
          :disabled="sequenceStore.sequence.length < 1"
          @click="isPlaying ? audioEngine.stopLoop() : handlePlay()">
          <ion-icon :icon="isPlaying ? stopOutline : playOutline" />
        </button>
        <button
          class="footer-icon-btn loop-toggle"
          :class="{ active: loopActive }"
          @click="toggleLoop">
          <ion-icon :icon="infiniteOutline" />
        </button>
        <ion-select
          interface="action-sheet"
          :value="settingsStore.instrument"
          class="instrument-select"
          @ionChange="
            settingsStore.setInstrument(($event as CustomEvent).detail.value)
          ">
          <ion-select-option value="piano">piano</ion-select-option>
          <ion-select-option value="harp">harp</ion-select-option>
          <ion-select-option value="guitar-acoustic"
            >guitar (ac)</ion-select-option
          >
          <ion-select-option value="guitar-nylon"
            >guitar (ny)</ion-select-option
          >
          <ion-select-option value="cello">cello</ion-select-option>
          <ion-select-option value="violin">violin</ion-select-option>
        </ion-select>
        <button
          class="footer-expand-btn"
          :class="{ open: footerExpanded }"
          @click="footerExpanded = !footerExpanded">
          <ion-icon
            :icon="footerExpanded ? chevronDownOutline : chevronUpOutline" />
        </button>
      </div>

      <div class="footer-tray" :class="{ open: footerExpanded }">
        <div class="tray-inner">
          <div class="tray-row">
            <div class="toggle-row">
              <button
                v-for="d in directionOptions"
                :key="d.value"
                class="toggle-btn"
                :class="{ active: settingsStore.arpeggioDirection === d.value }"
                @click="settingsStore.setArpeggioDirection(d.value as any)">
                <ion-icon :icon="d.icon" />
              </button>
            </div>
            <div class="tempo-control">
              <button class="adj-btn" @click="adjustTempo(-5)">
                <ion-icon :icon="removeOutline" />
              </button>
              <span class="tempo-value">{{ settingsStore.tempo }}</span>
              <button class="adj-btn" @click="adjustTempo(5)">
                <ion-icon :icon="addOutline" />
              </button>
              <span class="tempo-unit">bpm</span>
            </div>
          </div>
          <div
            v-if="sequenceStore.sequence.length > 1"
            class="tray-row export-row">
            <button class="export-btn" @click="exportMidi">↓ midi</button>
            <button class="export-btn" @click="copyText">
              {{ copiedFlash ? 'copied!' : 'copy text' }}
            </button>
          </div>
        </div>
      </div>
    </ion-footer>
  </ion-page>
</template>

<script setup lang="ts">
  import { ref, computed, watch, onUnmounted } from 'vue'
  import { onIonViewWillEnter } from '@ionic/vue'
  import { useRouter } from 'vue-router'
  import {
    IonPage,
    IonHeader,
    IonFooter,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButtons,
    IonSelect,
    IonSelectOption,
    IonIcon,
  } from '@ionic/vue'
  import {
    playOutline,
    stopOutline,
    infiniteOutline,
    shuffleOutline,
    arrowUpOutline,
    arrowDownOutline,
    swapVerticalOutline,
    handRightOutline,
    chevronUpOutline,
    chevronDownOutline,
    addOutline,
    removeOutline,
  } from 'ionicons/icons'

  import ClusterDisplay from '../components/cluster/ClusterDisplay.vue'
  import StrategyCard from '../components/strategy/StrategyCard.vue'
  import SequenceHistory from '../components/sequence/SequenceHistory.vue'

  import { useSequenceStore } from '../stores/sequenceStore'
  import { useSettingsStore } from '../stores/settingsStore'
  import { useAudioEngine } from '../composables/useAudioEngine'
  import { useStrategyDeck } from '../composables/useStrategyDeck'
  import { useLoopDetection } from '../composables/useLoopDetection'
  import { generateCandidates } from '../composables/useVoiceLeading'

  import { midiToName } from '../data/notes'
  import type { Strategy } from '../data/strategies'
  import type { Cluster } from '../utils/noteUtils'
  import { sortCluster } from '../utils/noteUtils'
  import { saveSession } from '../utils/sessionStorage'
  import {
    exportSequenceAsMidi,
    exportSequenceAsText,
  } from '../utils/midiUtils'

  const VOICE_COLORS = [
    'var(--voice-1)',
    'var(--voice-2)',
    'var(--voice-3)',
    'var(--voice-4)',
  ]

  const router = useRouter()
  const sequenceStore = useSequenceStore()
  const settingsStore = useSettingsStore()
  const audioEngine = useAudioEngine()
  const { isPlaying, playingIndex } = audioEngine

  const { draw, reset: resetDeck } = useStrategyDeck(
    () => settingsStore.keyLockActive
  )
  const { findLoopPoint } = useLoopDetection()

  const candidates = ref<Cluster[]>([])
  const activeStrategy = ref<Strategy | null>(null)
  const selectedIndices = ref<number[]>([]) // ordered by tap — drives add sequence
  const auditioning = ref<Cluster | null>(null)
  const savedFlash = ref(false)
  const copiedFlash = ref(false)
  const multiSelect = ref(false)
  const footerExpanded = ref(false)
  const voiceColors = VOICE_COLORS

  const loopActive = ref(false)

  const directionOptions = [
    { value: 'up', icon: arrowUpOutline },
    { value: 'down', icon: arrowDownOutline },
    { value: 'updown', icon: swapVerticalOutline },
    { value: 'random', icon: shuffleOutline },
    { value: 'chord', icon: handRightOutline },
  ]

  watch(
    () => settingsStore.arpeggioDirection,
    () => {
      if (isPlaying.value) playLoop()
    }
  )

  watch(
    () => settingsStore.tempo,
    () => {
      if (isPlaying.value) playLoop()
    }
  )

  watch(
    () => settingsStore.instrument,
    async (newInstrument) => {
      const wasPlaying = isPlaying.value
      audioEngine.stopLoop()
      await audioEngine.init(newInstrument)
      if (wasPlaying) playLoop()
    }
  )

  const playbackSettings = computed(() => ({
    bpm: settingsStore.tempo,
    direction: settingsStore.arpeggioDirection,
  }))

  onIonViewWillEnter(() => {
    if (!sequenceStore.currentCluster) {
      router.replace('/')
      return
    }
    advance()
  })

  onUnmounted(() => {
    audioEngine.stopLoop()
  })

  function advance() {
    selectedIndices.value = []
    auditioning.value = null
    activeStrategy.value = null
    // Keep multiSelect mode across draws — user chose it intentionally
    if (!sequenceStore.currentCluster) return

    let attempts = 0
    let newCandidates: Cluster[] = []

    while (attempts < 5 && newCandidates.length === 0) {
      const drawn = draw()
      if (!drawn) break
      newCandidates = generateCandidates(sequenceStore.currentCluster, drawn, {
        keyLockActive: settingsStore.keyLockActive,
        keyRoot: settingsStore.keyRoot,
        scaleId: settingsStore.scaleId,
      })
      attempts++
      if (newCandidates.length > 0) activeStrategy.value = drawn
    }

    candidates.value = newCandidates
  }

  function redraw() {
    advance()
  }

  // Returns 1-based position in selection order, or 0 if not selected
  function selectionOrder(index: number): number {
    const pos = selectedIndices.value.indexOf(index)
    return pos === -1 ? 0 : pos + 1
  }

  function toggleMultiSelect() {
    multiSelect.value = !multiSelect.value
    selectedIndices.value = []
    auditioning.value = null
  }

  function selectCandidate(cluster: Cluster, index: number) {
    // Always audition on tap
    auditioning.value = cluster
    sequenceStore.audition(cluster)
    audioEngine.playCluster(cluster, playbackSettings.value)

    if (multiSelect.value) {
      // Toggle in ordered list
      const pos = selectedIndices.value.indexOf(index)
      if (pos === -1) {
        selectedIndices.value.push(index)
      } else {
        selectedIndices.value.splice(pos, 1)
      }
    } else {
      // Single select — replace any previous selection
      selectedIndices.value = [index]
    }
  }

  function confirmSelection() {
    if (selectedIndices.value.length === 0) return

    for (const idx of selectedIndices.value) {
      const chosen = candidates.value[idx]
      sequenceStore.confirm(chosen)

      const loopIdx = findLoopPoint(sequenceStore.sequence)
      if (loopIdx !== -1) {
        sequenceStore.setLoopResolved(true, loopIdx)
        return
      }

      if (
        settingsStore.loopMode === 'capped' &&
        sequenceStore.moveCount >= settingsStore.maxMoves
      ) {
        sequenceStore.setLoopResolved(true, -1)
        return
      }
    }

    advance()
  }

  function goUndo() {
    audioEngine.stopLoop()
    sequenceStore.undo()
    sequenceStore.setLoopResolved(false)
    advance()
  }

  function goRedo() {
    audioEngine.stopLoop()
    sequenceStore.redo()
    sequenceStore.setLoopResolved(false)
    advance()
  }

  function goHome() {
    audioEngine.stopLoop()
    sequenceStore.reset()
    resetDeck()
    router.push('/')
  }

  function toggleLoop() {
    loopActive.value = !loopActive.value
    if (isPlaying.value) handlePlay()
  }

  function handlePlay() {
    if (loopActive.value) {
      playLoop()
    } else {
      playOnce()
    }
  }

  function playLoop() {
    audioEngine.playSequence(
      sequenceStore.sequence,
      playbackSettings.value,
      true
    )
  }

  function playOnce() {
    audioEngine.playSequence(
      sequenceStore.sequence,
      playbackSettings.value,
      false
    )
  }

  function auditionHistoryCluster(cluster: Cluster) {
    audioEngine.playCluster(cluster, playbackSettings.value)
  }

  function deleteCluster(index: number) {
    audioEngine.stopLoop()
    sequenceStore.deleteAt(index)
    sequenceStore.setLoopResolved(false)
  }

  function editCluster(index: number, newCluster: Cluster) {
    sequenceStore.editClusterAt(index, newCluster)
    if (index === sequenceStore.sequence.length - 1) {
      sequenceStore.setLoopResolved(false)
      advance()
    }
  }

  function reorderClusters(from: number, to: number) {
    audioEngine.stopLoop()
    sequenceStore.reorderSequence(from, to)
    sequenceStore.setLoopResolved(false)
    advance()
  }

  function save() {
    saveSession(
      sequenceStore.sequence,
      settingsStore.voiceCount,
      settingsStore.instrument
    )
    savedFlash.value = true
    setTimeout(() => {
      savedFlash.value = false
    }, 1500)
  }

  function adjustTempo(delta: number) {
    settingsStore.setTempo(settingsStore.tempo + delta)
  }

  function exportMidi() {
    exportSequenceAsMidi(sequenceStore.sequence, {
      bpm: settingsStore.tempo,
      direction: settingsStore.arpeggioDirection,
      arpeggioInterval: 60 / settingsStore.tempo / 4,
    })
  }

  function copyText() {
    const text = exportSequenceAsText(sequenceStore.sequence)
    navigator.clipboard.writeText(text)
    copiedFlash.value = true
    setTimeout(() => {
      copiedFlash.value = false
    }, 1500)
  }

  function clusterKey(cluster: Cluster): string {
    return sortCluster(cluster).join(',')
  }
</script>

<style scoped>
  .session-layout {
    display: flex;
    flex-direction: column;
    gap: 1.6rem;
    max-width: 500px;
    margin: 0 auto;
    padding-bottom: 2rem;
  }

  .session-title {
    font-family: var(--font-serif);
    font-size: 1rem;
    font-weight: 300;
    letter-spacing: 0.12em;
    text-align: center;
    color: var(--color-text-dim);
  }

  .nav-btn {
    background: none;
    border: none;
    color: var(--color-text-dim);
    font-size: 0.75rem;
    letter-spacing: 0.08em;
    cursor: pointer;
    padding: 0 0.4rem;
    font-family: inherit;
    transition: color 0.15s;
  }
  .nav-btn:hover:not(:disabled) {
    color: var(--color-text);
  }
  .nav-btn:disabled {
    opacity: 0.3;
    cursor: default;
  }
  .save-btn.flashed {
    color: var(--color-accent);
  }
  .icon-btn {
    font-size: 0.95rem;
    padding: 0 0.3rem;
  }

  .current-cluster-block {
    padding-top: 0.5rem;
  }

  .section-label {
    font-size: 0.65rem;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: var(--color-text-dim);
    margin: 0 0 0.6rem;
  }

  .loop-banner {
    background: rgba(83, 105, 72, 0.3);
    border: 1px solid var(--color-accent);
    border-radius: 10px;
    padding: 0.8rem 1rem;
    font-family: var(--font-serif);
    font-size: 1.1rem;
    font-weight: 300;
    font-style: italic;
    color: var(--color-accent);
    text-align: center;
  }

  .candidates-grid {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }

  .candidate-pill {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    background: var(--color-surface);
    border: 1px solid var(--color-border-subtle);
    border-radius: 10px;
    padding: 0.65rem 1rem;
    cursor: pointer;
    transition:
      border-color 0.15s,
      background 0.15s;
    text-align: left;
    width: 100%;
    font-family: inherit;
  }
  .candidate-pill:hover {
    border-color: var(--color-text-dim);
  }
  .candidate-pill.selected {
    border-color: var(--color-accent);
    background: rgba(83, 105, 72, 0.2);
  }

  .pill-order {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 1.1rem;
    height: 1.1rem;
    border-radius: 50%;
    background: var(--color-accent);
    color: #e6dec8;
    font-size: 0.6rem;
    font-weight: 600;
    flex-shrink: 0;
    font-family: inherit;
  }

  .pill-note {
    font-size: 0.95rem;
    font-family: 'SF Mono', 'Fira Code', monospace;
    letter-spacing: 0.04em;
  }
  .pill-note + .pill-note::before {
    content: '·';
    color: var(--color-text-dim);
    margin-right: 0.4rem;
  }

  .no-candidates {
    font-size: 0.8rem;
    color: var(--color-text-dim);
    font-style: italic;
  }
  .inline-btn {
    background: none;
    border: none;
    color: var(--color-accent);
    font-size: inherit;
    cursor: pointer;
    padding: 0;
    font-family: inherit;
    text-decoration: underline;
  }

  .confirm-btn {
    width: 100%;
    background: var(--color-accent);
    border: 1px solid var(--color-accent);
    border-radius: 10px;
    color: var(--color-bg);
    font-size: 0.85rem;
    letter-spacing: 0.1em;
    padding: 0.75rem;
    cursor: pointer;
    font-family: inherit;
    transition:
      background 0.15s,
      opacity 0.15s;
  }
  .confirm-btn:hover {
    opacity: 0.85;
  }

  /* Footer */
  .playback-footer {
    border-top: 1px solid var(--color-border);
    background: var(--color-bg);
  }

  .footer-bar {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
  }

  .footer-icon-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    background: none;
    border: 1px solid var(--color-border);
    border-radius: 8px;
    color: var(--color-text-dim);
    width: 2.8rem;
    height: 2.4rem;
    font-size: 1.25rem;
    cursor: pointer;
    flex-shrink: 0;
    transition:
      border-color 0.15s,
      color 0.15s,
      background 0.15s;
  }
  .footer-icon-btn:disabled {
    opacity: 0.3;
    cursor: default;
  }
  .footer-icon-btn.play-stop:not(:disabled):hover,
  .footer-icon-btn.play-stop.playing {
    border-color: var(--color-accent);
    color: var(--color-accent);
  }
  .footer-icon-btn.loop-toggle.active {
    border-color: var(--color-accent);
    color: var(--color-accent);
    background: rgba(224, 168, 124, 0.1);
  }
  .footer-icon-btn.loop-toggle:not(.active):hover {
    border-color: var(--color-text-dim);
    color: var(--color-text);
  }

  .footer-expand-btn {
    margin-left: auto;
    display: flex;
    align-items: center;
    justify-content: center;
    background: none;
    border: none;
    color: var(--color-text-dim);
    font-size: 1.1rem;
    cursor: pointer;
    width: 2rem;
    height: 2.4rem;
    transition: color 0.15s;
  }
  .footer-expand-btn:hover,
  .footer-expand-btn.open {
    color: var(--color-text);
  }

  .footer-tray {
    display: grid;
    grid-template-rows: 0fr;
    transition: grid-template-rows 0.22s ease;
    overflow: hidden;
  }
  .footer-tray.open {
    grid-template-rows: 1fr;
  }

  .tray-inner {
    overflow: hidden;
    min-height: 0;
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
    padding: 0.4rem 1rem 0.7rem;
    border-top: 1px solid var(--color-border);
  }

  .tray-row {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-wrap: nowrap;
  }

  .export-btns {
    display: flex;
    gap: 0.4rem;
    margin-left: auto;
  }

  .instrument-select {
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: 6px;
    color: var(--color-text-dim);
    font-size: 0.7rem;
    font-family: inherit;
    cursor: pointer;
    flex: 1;
    min-height: 2.4rem;
    padding: 0 1rem;
  }

  .tempo-control {
    display: flex;
    align-items: center;
    gap: 0.3rem;
    margin-left: auto;
  }

  .adj-btn {
    background: none;
    border: 1px solid var(--color-border);
    border-radius: 6px;
    color: var(--color-text-dim);
    width: 2rem;
    height: 2rem;
    font-size: 1rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition:
      border-color 0.15s,
      color 0.15s;
  }
  .adj-btn:hover {
    border-color: var(--color-text-dim);
    color: var(--color-text);
  }

  .tempo-value {
    font-size: 0.8rem;
    font-family: 'SF Mono', 'Fira Code', monospace;
    color: var(--color-text);
    min-width: 2.2rem;
    text-align: center;
  }

  .tempo-unit {
    font-size: 0.62rem;
    letter-spacing: 0.1em;
    color: var(--color-text-dim);
  }

  .toggle-row {
    display: flex;
    gap: 0.3rem;
  }

  .toggle-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    background: none;
    border: 1px solid var(--color-border);
    border-radius: 6px;
    color: var(--color-text-dim);
    width: 2.2rem;
    height: 2.2rem;
    font-size: 1.1rem;
    cursor: pointer;
    transition:
      border-color 0.15s,
      color 0.15s,
      background 0.15s;
  }
  .candidates-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 0.6rem;
  }

  .candidates-header .section-label {
    margin-bottom: 0;
  }

  .multi-toggle {
    background: none;
    border: 1px solid var(--color-border);
    border-radius: 6px;
    color: var(--color-text-dim);
    font-size: 0.62rem;
    letter-spacing: 0.12em;
    padding: 0.2rem 0.55rem;
    cursor: pointer;
    font-family: inherit;
    transition: all 0.15s;
  }
  .multi-toggle.active {
    border-color: var(--color-accent);
    color: var(--color-bg);
    background: var(--color-accent);
  }

  .export-btn {
    background: none;
    border: 1px solid var(--color-border);
    border-radius: 8px;
    color: var(--color-text-dim);
    font-size: 0.72rem;
    letter-spacing: 0.1em;
    padding: 0.4rem 0.85rem;
    cursor: pointer;
    font-family: inherit;
    transition:
      border-color 0.15s,
      color 0.15s;
  }
  .export-btn:hover {
    border-color: var(--color-accent);
    color: var(--color-accent);
  }

  .toggle-btn.active {
    border-color: var(--color-accent);
    color: var(--color-text);
    background: var(--color-accent);
  }
</style>
