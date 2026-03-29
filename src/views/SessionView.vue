<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <button class="nav-btn" @click="goHome">← new</button>
        </ion-buttons>
        <ion-title class="session-title">note threader</ion-title>
        <ion-buttons slot="end">
          <button
            class="nav-btn save-btn"
            :class="{ flashed: savedFlash }"
            :disabled="sequenceStore.sequence.length < 1"
            @click="save"
          >{{ savedFlash ? 'saved' : 'save' }}</button>
          <button class="nav-btn" :disabled="sequenceStore.moveCount < 1" @click="goBack">back</button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding" fullscreen>
      <div class="session-layout">

        <!-- Current cluster — displayed large -->
        <div class="current-cluster-block">
          <p class="section-label">current cluster</p>
          <ClusterDisplay
            v-if="sequenceStore.currentCluster"
            :cluster="auditioning ?? sequenceStore.currentCluster"
          />
        </div>

        <!-- Loop resolved banner -->
        <div v-if="sequenceStore.loopResolved" class="loop-banner">
          loop resolved — {{ sequenceStore.moveCount }} moves
        </div>

        <!-- Strategy card -->
        <StrategyCard
          v-if="currentStrategy && !sequenceStore.loopResolved"
          :strategy="currentStrategy"
          @redraw="redraw"
        />

        <!-- Candidates -->
        <div v-if="!sequenceStore.loopResolved && candidates.length > 0" class="candidates-block">
          <div class="candidates-header">
            <p class="section-label">options — tap to audition</p>
            <button
              class="multi-toggle"
              :class="{ active: multiSelect }"
              @click="toggleMultiSelect"
            >multi</button>
          </div>
          <div class="candidates-grid" :class="{ 'multi-active': multiSelect }">
            <button
              v-for="(cluster, i) in candidates"
              :key="clusterKey(cluster)"
              class="candidate-pill"
              :class="{ selected: selectionOrder(i) > 0 }"
              @click="selectCandidate(cluster, i)"
            >
              <span class="pill-order" v-if="selectionOrder(i) > 0">{{ selectionOrder(i) }}</span>
              <span
                v-for="(midi, v) in cluster"
                :key="v"
                class="pill-note"
                :style="{ color: voiceColors[v] }"
              >{{ midiToName(midi) }}</span>
            </button>
          </div>
        </div>

        <!-- No candidates warning -->
        <div v-else-if="!sequenceStore.loopResolved && candidates.length === 0 && currentStrategy" class="no-candidates">
          <p>no valid moves — <button class="inline-btn" @click="redraw">redraw strategy</button></p>
        </div>

        <!-- Confirm button -->
        <div v-if="selectedIndices.length > 0 && !sequenceStore.loopResolved" class="confirm-block">
          <button class="confirm-btn" @click="confirmSelection">
            add {{ selectedIndices.length === 1 ? 'to' : selectedIndices.length + ' clusters to' }} sequence
          </button>
        </div>

        <!-- Playback controls + tempo/direction -->
        <div class="playback-row">
          <PlaybackControls
            :is-playing="isPlaying"
            :sequence-length="sequenceStore.sequence.length"
            @play="playLoop"
            @stop="audioEngine.stopLoop()"
            @play-once="playOnce"
          />

          <div class="playback-settings">
            <!-- Tempo -->
            <div class="tempo-control">
              <button class="adj-btn" @click="adjustTempo(-5)">−</button>
              <span class="tempo-value">{{ settingsStore.tempo }}</span>
              <button class="adj-btn" @click="adjustTempo(5)">+</button>
              <span class="tempo-unit">bpm</span>
            </div>

            <!-- Direction -->
            <div class="toggle-row">
              <button
                v-for="d in directionOptions" :key="d.value"
                class="toggle-btn"
                :class="{ active: settingsStore.arpeggioDirection === d.value }"
                @click="settingsStore.setArpeggioDirection(d.value as any)"
              >{{ d.label }}</button>
            </div>
          </div>
        </div>

        <!-- Export row -->
        <div v-if="sequenceStore.sequence.length > 1" class="export-row">
          <button class="export-btn" @click="exportMidi">↓ midi</button>
          <button class="export-btn" @click="copyText">
            {{ copiedFlash ? 'copied!' : 'copy text' }}
          </button>
        </div>

        <!-- Sequence history -->
        <SequenceHistory
          v-if="sequenceStore.sequence.length > 0"
          :sequence="sequenceStore.sequence"
          :loop-point="sequenceStore.loopPoint"
          @audition="auditionHistoryCluster"
          @delete="deleteCluster"
        />

      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import {
  IonPage, IonHeader, IonToolbar, IonTitle,
  IonContent, IonButtons,
} from '@ionic/vue'

import ClusterDisplay from '../components/cluster/ClusterDisplay.vue'
import StrategyCard from '../components/strategy/StrategyCard.vue'
import SequenceHistory from '../components/sequence/SequenceHistory.vue'
import PlaybackControls from '../components/playback/PlaybackControls.vue'

import { useSequenceStore } from '../stores/sequenceStore'
import { useSettingsStore } from '../stores/settingsStore'
import { useAudioEngine } from '../composables/useAudioEngine'
import { useStrategyDeck } from '../composables/useStrategyDeck'
import { useLoopDetection } from '../composables/useLoopDetection'
import { generateCandidates } from '../composables/useVoiceLeading'

import { midiToName } from '../data/notes'
import type { Cluster } from '../utils/noteUtils'
import { sortCluster } from '../utils/noteUtils'
import { saveSession } from '../utils/sessionStorage'
import { exportSequenceAsMidi, exportSequenceAsText } from '../utils/midiUtils'

const VOICE_COLORS = ['var(--voice-1)', 'var(--voice-2)', 'var(--voice-3)', 'var(--voice-4)']

const router = useRouter()
const sequenceStore = useSequenceStore()
const settingsStore = useSettingsStore()
const audioEngine = useAudioEngine()
const { isPlaying } = audioEngine

const { currentStrategy, draw, reset: resetDeck } = useStrategyDeck(
  () => settingsStore.keyLockActive
)
const { findLoopPoint } = useLoopDetection()

const candidates = ref<Cluster[]>([])
const selectedIndices = ref<number[]>([])  // ordered by tap — drives add sequence
const auditioning = ref<Cluster | null>(null)
const savedFlash = ref(false)
const copiedFlash = ref(false)
const multiSelect = ref(false)
const voiceColors = VOICE_COLORS

const directionOptions = [
  { label: '↑',   value: 'up' },
  { label: '↓',   value: 'down' },
  { label: '↑↓',  value: 'updown' },
  { label: '↺',   value: 'random' },
]

const playbackSettings = computed(() => ({
  bpm: settingsStore.tempo,
  direction: settingsStore.arpeggioDirection,
}))

onMounted(() => {
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
  // Keep multiSelect mode across draws — user chose it intentionally
  if (!sequenceStore.currentCluster) return

  let attempts = 0
  let newCandidates: Cluster[] = []

  while (attempts < 5 && newCandidates.length === 0) {
    draw()
    if (!currentStrategy.value) break
    newCandidates = generateCandidates(
      sequenceStore.currentCluster,
      currentStrategy.value,
      {
        keyLockActive: settingsStore.keyLockActive,
        keyRoot: settingsStore.keyRoot,
        scaleId: settingsStore.scaleId,
      }
    )
    attempts++
  }

  candidates.value = newCandidates
}

function redraw() { advance() }

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

    if (settingsStore.loopMode === 'capped' && sequenceStore.moveCount >= settingsStore.maxMoves) {
      sequenceStore.setLoopResolved(true, -1)
      return
    }
  }

  advance()
}

function goBack() {
  audioEngine.stopLoop()
  sequenceStore.back()
  sequenceStore.setLoopResolved(false)
  advance()
}

function goHome() {
  audioEngine.stopLoop()
  sequenceStore.reset()
  resetDeck()
  router.push('/')
}

function playLoop() {
  audioEngine.playSequence(sequenceStore.sequence, playbackSettings.value, true)
}

function playOnce() {
  audioEngine.playSequence(sequenceStore.sequence, playbackSettings.value, false)
}

function auditionHistoryCluster(cluster: Cluster) {
  audioEngine.playCluster(cluster, playbackSettings.value)
}

function deleteCluster(index: number) {
  audioEngine.stopLoop()
  sequenceStore.deleteAt(index)
  sequenceStore.setLoopResolved(false)
}

function save() {
  saveSession(sequenceStore.sequence, settingsStore.voiceCount)
  savedFlash.value = true
  setTimeout(() => { savedFlash.value = false }, 1500)
}

function adjustTempo(delta: number) {
  settingsStore.setTempo(settingsStore.tempo + delta)
}

function exportMidi() {
  exportSequenceAsMidi(sequenceStore.sequence, {
    bpm: settingsStore.tempo,
    arpeggiate: true,
    arpeggioInterval: 60 / settingsStore.tempo / 4,
  })
}

function copyText() {
  const text = exportSequenceAsText(sequenceStore.sequence)
  navigator.clipboard.writeText(text)
  copiedFlash.value = true
  setTimeout(() => { copiedFlash.value = false }, 1500)
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
  font-size: 0.8rem;
  letter-spacing: 0.16em;
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
.nav-btn:hover:not(:disabled) { color: var(--color-text); }
.nav-btn:disabled { opacity: 0.3; cursor: default; }
.save-btn.flashed { color: var(--color-accent); }

.current-cluster-block { padding-top: 0.5rem; }

.section-label {
  font-size: 0.65rem;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--color-text-dim);
  margin: 0 0 0.6rem;
}

.loop-banner {
  background: rgba(224, 168, 124, 0.1);
  border: 1px solid var(--color-accent);
  border-radius: 10px;
  padding: 0.7rem 1rem;
  font-size: 0.8rem;
  letter-spacing: 0.1em;
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
  border: 1px solid var(--color-border);
  border-radius: 10px;
  padding: 0.65rem 1rem;
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s;
  text-align: left;
  width: 100%;
  font-family: inherit;
}
.candidate-pill:hover { border-color: var(--color-text-dim); }
.candidate-pill.selected {
  border-color: var(--color-accent);
  background: rgba(224, 168, 124, 0.07);
}

.pill-order {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.1rem;
  height: 1.1rem;
  border-radius: 50%;
  background: var(--color-accent);
  color: #0d0d12;
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
  background: none;
  border: 1px solid var(--color-accent);
  border-radius: 10px;
  color: var(--color-accent);
  font-size: 0.85rem;
  letter-spacing: 0.1em;
  padding: 0.75rem;
  cursor: pointer;
  font-family: inherit;
  transition: background 0.15s;
}
.confirm-btn:hover { background: rgba(224, 168, 124, 0.1); }

/* Playback row */
.playback-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
}

.playback-settings {
  display: flex;
  align-items: center;
  gap: 0.8rem;
}

.tempo-control {
  display: flex;
  align-items: center;
  gap: 0.3rem;
}

.adj-btn {
  background: none;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  color: var(--color-text-dim);
  width: 1.6rem;
  height: 1.6rem;
  font-size: 0.9rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
  transition: border-color 0.15s, color 0.15s;
}
.adj-btn:hover { border-color: var(--color-text-dim); color: var(--color-text); }

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
  background: none;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  color: var(--color-text-dim);
  font-size: 0.75rem;
  padding: 0.25rem 0.55rem;
  cursor: pointer;
  transition: all 0.15s;
  font-family: inherit;
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
  color: var(--color-accent);
  background: rgba(224, 168, 124, 0.08);
}

.export-row {
  display: flex;
  gap: 0.5rem;
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
  transition: border-color 0.15s, color 0.15s;
}
.export-btn:hover {
  border-color: var(--color-accent);
  color: var(--color-accent);
}

.toggle-btn.active {
  border-color: var(--color-accent);
  color: var(--color-accent);
  background: rgba(224, 168, 124, 0.08);
}
</style>
