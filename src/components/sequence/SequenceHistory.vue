<template>
  <div class="sequence-history">
    <p class="history-label">sequence</p>
    <div class="history-scroll">
      <div
        v-for="(cluster, i) in sequence"
        :key="i"
        class="history-row"
      >
        <!-- Swipe container -->
        <div
          class="history-entry"
          :class="{
            current: i === sequence.length - 1,
            'loop-origin': i === loopPoint,
            swiped: swipedIndex === i,
          }"
          @click="onEntryClick(cluster, i)"
          @touchstart="onTouchStart($event, i)"
          @touchmove="onTouchMove($event, i)"
          @touchend="onTouchEnd(i)"
          @mouseleave="cancelSwipe(i)"
          :style="swipeStyle(i)"
        >
          <span class="entry-index">{{ i + 1 }}</span>
          <span
            v-for="(midi, v) in sortCluster(cluster)"
            :key="v"
            class="entry-note"
            :style="{ color: voiceColors[v] }"
          >{{ midiToName(midi) }}</span>
        </div>

        <!-- Delete action revealed on swipe -->
        <button
          class="delete-action"
          :class="{ visible: swipedIndex === i }"
          @click.stop="confirmDelete(i)"
        >
          delete
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { Cluster } from '../../utils/noteUtils'
import { sortCluster } from '../../utils/noteUtils'
import { midiToName } from '../../data/notes'

const VOICE_COLORS = ['var(--voice-1)', 'var(--voice-2)', 'var(--voice-3)', 'var(--voice-4)']
const SWIPE_THRESHOLD = 60   // px to reveal delete
const DELETE_THRESHOLD = 120 // px to auto-confirm delete

const props = defineProps<{
  sequence: Cluster[]
  loopPoint?: number
}>()

const emit = defineEmits<{
  audition: [cluster: Cluster]
  delete: [index: number]
}>()

const voiceColors = VOICE_COLORS
const swipedIndex = ref<number | null>(null)
const swipeOffset = ref(0)

let touchStartX = 0
let touchStartY = 0
let activeTouchIndex = -1
let isScrolling: boolean | null = null

function onTouchStart(e: TouchEvent, index: number) {
  touchStartX = e.touches[0].clientX
  touchStartY = e.touches[0].clientY
  activeTouchIndex = index
  isScrolling = null
}

function onTouchMove(e: TouchEvent, index: number) {
  if (activeTouchIndex !== index) return

  const dx = e.touches[0].clientX - touchStartX
  const dy = e.touches[0].clientY - touchStartY

  // Determine scroll vs swipe on first significant move
  if (isScrolling === null && (Math.abs(dx) > 5 || Math.abs(dy) > 5)) {
    isScrolling = Math.abs(dy) > Math.abs(dx)
  }

  if (isScrolling) return

  // Only allow left swipe (negative dx)
  if (dx > 0) return

  e.preventDefault()
  swipedIndex.value = index
  swipeOffset.value = Math.max(dx, -DELETE_THRESHOLD - 20)
}

function onTouchEnd(index: number) {
  if (isScrolling || activeTouchIndex !== index) return

  if (swipeOffset.value < -DELETE_THRESHOLD) {
    confirmDelete(index)
  } else if (swipeOffset.value < -SWIPE_THRESHOLD) {
    // Hold open to reveal delete button
    swipeOffset.value = -SWIPE_THRESHOLD
  } else {
    cancelSwipe(index)
  }

  activeTouchIndex = -1
}

function cancelSwipe(index: number) {
  if (swipedIndex.value === index) {
    swipedIndex.value = null
    swipeOffset.value = 0
  }
}

function swipeStyle(index: number): Record<string, string> {
  if (swipedIndex.value !== index) return {}
  return {
    transform: `translateX(${swipeOffset.value}px)`,
    transition: activeTouchIndex === index ? 'none' : 'transform 0.2s ease',
  }
}

function onEntryClick(cluster: Cluster, index: number) {
  if (swipedIndex.value === index && swipeOffset.value < -10) {
    cancelSwipe(index)
    return
  }
  emit('audition', cluster)
}

function confirmDelete(index: number) {
  swipedIndex.value = null
  swipeOffset.value = 0
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

.delete-action {
  position: absolute;
  right: 0;
  top: 0;
  bottom: 0;
  width: 72px;
  background: #8b3030;
  border: none;
  color: #fff;
  font-size: 0.7rem;
  letter-spacing: 0.1em;
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.15s;
  font-family: inherit;
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
</style>
