<template>
  <div class="sequence-history">
    <p class="section-label">the flow</p>
    <div class="history-scroll">
      <IonReorderGroup :disabled="false" @ionItemReorder="onReorder($event)">
        <div
          v-for="(cluster, i) in sequence"
          :key="i"
          class="history-row"
        >
          <div
            class="history-entry"
            :class="{
              current: i === activeIndex,
              'loop-origin': i === loopPoint,
              playing: i === playingIndex,
            }"
            @click="onEntryClick(cluster, i)"
          >
            <IonReorder class="reorder-handle" :style="{ opacity: sequence.length < 2 ? 0 : 0.4 }" />
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
          </div>
        </div>
      </IonReorderGroup>
    </div>
  </div>

  <!-- Edit picker modal -->
  <IonModal
    :is-open="pickerOpen"
    style="
      --height: 284px;
      --width: 100vw;
      --border-radius: 12px 12px 0 0;
      align-items: flex-end;
      overflow: hidden;
    "
    @did-dismiss="cancelEdit">
    <IonHeader>
      <IonToolbar>
        <IonButtons slot="start">
          <IonButton @click="cancelEdit">cancel</IonButton>
        </IonButtons>
        <IonButtons slot="end">
          <IonButton @click="commitEdit">done</IonButton>
        </IonButtons>
      </IonToolbar>
    </IonHeader>
    <IonContent :scroll-y="false">
      <p v-if="editError" class="edit-error">{{ editError }}</p>
      <IonPicker>
        <IonPickerColumn
          v-for="(_, v) in editValues"
          :key="v"
          :value="editValues[v]"
          @ion-change="onColumnChange(v, $event)">
          <IonPickerColumnOption
            v-for="midi in validMidiRange"
            :key="midi"
            :value="midi"
            :style="{ color: voiceColors[v] }">
            {{ midiToName(midi) }}
          </IonPickerColumnOption>
        </IonPickerColumn>
      </IonPicker>
    </IonContent>
  </IonModal>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import {
  IonReorderGroup,
  IonReorder,
  IonIcon,
  IonModal,
  IonHeader,
  IonToolbar,
  IonButtons,
  IonButton,
  IonContent,
  IonPicker,
  IonPickerColumn,
  IonPickerColumnOption,
} from '@ionic/vue'
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

const activeIndex = ref(props.sequence.length - 1)
watch(() => props.sequence.length, (len) => { activeIndex.value = len - 1 })

const pickerOpen = ref(false)
const editingIndex = ref<number | null>(null)
const editValues = ref<number[]>([])
const editError = ref('')

function startEdit(cluster: Cluster, index: number) {
  editingIndex.value = index
  editValues.value = [...sortCluster(cluster)]
  editError.value = ''
  pickerOpen.value = true
}

function onColumnChange(voiceIndex: number, event: CustomEvent) {
  editValues.value[voiceIndex] = event.detail.value
  editError.value = ''
}

function commitEdit() {
  const newCluster = [...editValues.value] as Cluster
  if (!isValidCluster(newCluster)) {
    editError.value = `spread too wide (max ${MAX_CLUSTER_SPREAD} semitones)`
    return
  }
  pickerOpen.value = false
  emit('edit', editingIndex.value!, newCluster)
  editingIndex.value = null
}

function cancelEdit() {
  pickerOpen.value = false
  editingIndex.value = null
  editError.value = ''
}

function onReorder(event: CustomEvent) {
  const { from, to } = event.detail
  event.detail.complete(false)
  if (from !== to) emit('reorder', from, to)
}

function onEntryClick(cluster: Cluster, index: number) {
  activeIndex.value = index
  emit('audition', cluster)
}

function confirmDelete(index: number) {
  emit('delete', index)
}
</script>

<style scoped>
.sequence-history { width: 100%; }

.history-scroll {
  display: flex;
  flex-direction: column;
  gap: 2px;
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
  min-height: 2.75rem;
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

.entry-index {
  font-size: 0.65rem;
  color: var(--color-text-dim);
  width: 1.4rem;
  text-align: right;
  flex-shrink: 0;
  font-family: var(--font-mono);
}

.entry-note {
  font-size: 0.8rem;
  font-family: var(--font-mono);
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

.edit-error {
  font-size: 0.7rem;
  color: #e07878;
  text-align: center;
  padding: 0.4rem 1rem 0;
  margin: 0;
}
</style>
