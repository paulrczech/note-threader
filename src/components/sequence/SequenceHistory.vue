<template>
  <div class="sequence-history">
    <p class="history-label">the flow</p>
    <div class="history-scroll">
      <IonReorderGroup :disabled="false" @ionItemReorder="onReorder($event)">
        <div
          v-for="(cluster, i) in sequence"
          :key="i"
          class="history-row"
        >
          <!-- Edit mode -->
          <template v-if="editingIndex === i">
            <div class="history-entry editing">
              <span class="entry-index">{{ i + 1 }}</span>
              <div class="edit-voices">
                <select
                  v-for="(_, v) in editValues"
                  :key="v"
                  v-model.number="editValues[v]"
                  class="note-select"
                  :style="{ color: voiceColors[v] }"
                >
                  <option v-for="midi in validMidiRange" :key="midi" :value="midi">
                    {{ midiToName(midi) }}
                  </option>
                </select>
              </div>
              <div class="edit-actions">
                <button class="edit-confirm-btn" @click="commitEdit(i)" title="save">✓</button>
                <button class="edit-cancel-btn" @click="cancelEdit" title="cancel">✕</button>
              </div>
            </div>
            <p v-if="editError" class="edit-error">{{ editError }}</p>
          </template>

          <!-- Normal mode -->
          <template v-else>
            <div
              class="history-entry"
              :class="{
                current: i === sequence.length - 1,
                'loop-origin': i === loopPoint,
                playing: i === playingIndex,
              }"
              @click="onEntryClick(cluster)"
            >
              <span class="entry-index">{{ i + 1 }}</span>
              <span
                v-for="(midi, v) in sortCluster(cluster)"
                :key="v"
                class="entry-note"
                :style="{ color: voiceColors[v] }"
              >{{ midiToName(midi) }}</span>
              <div class="row-actions">
                <button class="action-btn" @click.stop="startEdit(cluster, i)" title="edit notes">
                  <IonIcon :icon="createOutline" />
                </button>
                <button class="action-btn delete-btn" @click.stop="confirmDelete(i)" title="delete">
                  <IonIcon :icon="trashOutline" />
                </button>
              </div>
              <IonReorder v-if="i > 0" class="reorder-handle" />
              <span v-else class="reorder-spacer" />
            </div>
          </template>
        </div>
      </IonReorderGroup>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { IonReorderGroup, IonReorder, IonIcon } from '@ionic/vue'
import { trashOutline, createOutline } from 'ionicons/icons'
import type { Cluster } from '../../utils/noteUtils'
import { sortCluster, isValidCluster } from '../../utils/noteUtils'
import { midiToName, MIDI_MIN, MIDI_MAX, MAX_CLUSTER_SPREAD } from '../../data/notes'

const VOICE_COLORS = ['var(--voice-1)', 'var(--voice-2)', 'var(--voice-3)', 'var(--voice-4)']

const props = defineProps<{
  sequence: Cluster[]
  loopPoint?: number
  playingIndex?: number
}>()

const emit = defineEmits<{
  audition: [cluster: Cluster]
  delete: [index: number]
  edit: [index: number, newCluster: Cluster]
  reorder: [from: number, to: number]
}>()

const voiceColors = VOICE_COLORS
const validMidiRange = Array.from({ length: MIDI_MAX - MIDI_MIN + 1 }, (_, i) => MIDI_MIN + i)

// Edit state
const editingIndex = ref<number | null>(null)
const editValues = ref<number[]>([])
const editError = ref('')

function startEdit(cluster: Cluster, index: number) {
  editingIndex.value = index
  editValues.value = [...sortCluster(cluster)]
  editError.value = ''
}

function commitEdit(index: number) {
  const newCluster = [...editValues.value] as Cluster
  if (!isValidCluster(newCluster)) {
    editError.value = `invalid — check range and spread (max ${MAX_CLUSTER_SPREAD} semitones)`
    return
  }
  editingIndex.value = null
  editError.value = ''
  emit('edit', index, newCluster)
}

function cancelEdit() {
  editingIndex.value = null
  editError.value = ''
}

function onReorder(event: CustomEvent) {
  const { from, to } = event.detail
  event.detail.complete(false)
  const safeTo = Math.max(1, to)
  if (from !== safeTo && from > 0) emit('reorder', from, safeTo)
}

function onEntryClick(cluster: Cluster) {
  emit('audition', cluster)
}

function confirmDelete(index: number) {
  emit('delete', index)
}
</script>

<style scoped>
.sequence-history { width: 100%; }

.history-label {
  font-size: 0.65rem;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--color-text-dim);
  margin: 0 0 0.5rem;
}

.history-scroll {
  display: flex;
  flex-direction: column;
  gap: 2px;
  max-height: 240px;
  overflow-y: auto;
  overflow-x: hidden;
}

.history-row {
  position: relative;
  border-radius: 6px;
  overflow: hidden;
}

.history-entry {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.35rem 0.5rem;
  border-radius: 6px;
  cursor: pointer;
  border: 1px solid transparent;
  background: transparent;
  position: relative;
  z-index: 1;
  will-change: transform;
  touch-action: pan-y;
}

.history-entry:hover { background: var(--color-surface); }
.history-entry.current {
  background: var(--color-surface);
  border-color: var(--color-border);
}
.history-entry.loop-origin { border-color: var(--color-accent); }
.history-entry.playing {
  background: rgba(126, 184, 212, 0.08);
  border-color: rgba(126, 184, 212, 0.35);
}
.history-entry.editing {
  background: var(--color-surface);
  border-color: var(--color-accent);
  cursor: default;
  gap: 0.4rem;
}

.delete-action {
  position: absolute;
  right: 0;
  top: 0;
  bottom: 0;
  width: 52px;
  background: #8b3030;
  border: none;
  color: #fff;
  font-size: 1rem;
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.15s;
  display: flex;
  align-items: center;
  justify-content: center;
}
.delete-action.visible { opacity: 1; }

.entry-index {
  font-size: 0.65rem;
  color: var(--color-text-dim);
  width: 1.4rem;
  text-align: right;
  flex-shrink: 0;
  font-family: 'SF Mono', 'Fira Code', monospace;
}

.entry-note {
  font-size: 0.8rem;
  font-family: 'SF Mono', 'Fira Code', monospace;
  letter-spacing: 0.04em;
}
.entry-note + .entry-note::before {
  content: '·';
  color: var(--color-text-dim);
  margin-right: 0.4rem;
}

.reorder-handle {
  flex-shrink: 0;
  color: var(--color-text-dim);
  opacity: 0.4;
}

.reorder-spacer {
  flex-shrink: 0;
  width: 24px;
}

.row-actions {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 0.1rem;
  flex-shrink: 0;
}

.action-btn {
  background: none;
  border: none;
  color: var(--color-text-dim);
  font-size: 0.95rem;
  cursor: pointer;
  padding: 0.2rem 0.25rem;
  line-height: 1;
  border-radius: 4px;
  transition: color 0.15s;
  display: flex;
  align-items: center;
}
.action-btn:hover { color: var(--color-accent); }
.action-btn.delete-btn:hover { color: #e07878; }

.edit-voices {
  display: flex;
  gap: 0.3rem;
  flex: 1;
  min-width: 0;
}

.note-select {
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: 4px;
  font-size: 0.75rem;
  font-family: 'SF Mono', 'Fira Code', monospace;
  padding: 0.1rem 0.2rem;
  cursor: pointer;
  min-width: 0;
  flex: 1;
}

.edit-actions {
  display: flex;
  gap: 0.25rem;
  flex-shrink: 0;
}

.edit-confirm-btn,
.edit-cancel-btn {
  background: none;
  border: 1px solid var(--color-border);
  border-radius: 4px;
  font-size: 0.7rem;
  width: 1.5rem;
  height: 1.5rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: inherit;
  transition: border-color 0.15s, color 0.15s;
}
.edit-confirm-btn {
  color: var(--color-accent);
  border-color: var(--color-accent);
}
.edit-confirm-btn:hover { background: rgba(83, 105, 72, 0.3); }
.edit-cancel-btn { color: var(--color-text-dim); }
.edit-cancel-btn:hover { border-color: var(--color-text-dim); color: var(--color-text); }

.edit-error {
  font-size: 0.65rem;
  color: #e07878;
  margin: 0.1rem 0 0 2.4rem;
  padding: 0 0.5rem;
}
</style>
