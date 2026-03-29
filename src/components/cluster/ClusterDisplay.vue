<template>
  <div class="cluster-display" :class="{ dimmed }">
    <div
      v-for="(midi, i) in sortedCluster"
      :key="i"
      class="voice-note"
      :style="{ color: voiceColor(i) }"
    >
      <span class="note-label">{{ midiToName(midi) }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { midiToName } from '../../data/notes'
import { sortCluster } from '../../utils/noteUtils'

const VOICE_COLORS = ['var(--voice-1)', 'var(--voice-2)', 'var(--voice-3)', 'var(--voice-4)']

const props = defineProps<{
  cluster: number[]
  dimmed?: boolean
}>()

const sortedCluster = computed(() => sortCluster(props.cluster))

function voiceColor(index: number): string {
  return VOICE_COLORS[index] ?? VOICE_COLORS[VOICE_COLORS.length - 1]
}
</script>

<style scoped>
.cluster-display {
  display: flex;
  align-items: flex-end;
  gap: 0.6rem;
  transition: opacity 0.2s;
}

.cluster-display.dimmed {
  opacity: 0.4;
}

.voice-note {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.note-label {
  font-size: 2rem;
  font-weight: 300;
  letter-spacing: 0.04em;
  line-height: 1;
  font-family: 'SF Mono', 'Fira Code', monospace;
}
</style>
