<template>
  <div class="strategy-card">
    <p class="strategy-label">the pull</p>

    <div class="strategy-body">
      <p class="strategy-text">{{ strategy.text }}</p>
      <button
        id="hint-trigger"
        class="hint-btn"
        aria-label="What does this mean?"
      >ⓘ</button>
    </div>

    <IonPopover
      trigger="hint-trigger"
      trigger-action="click"
      :dismiss-on-select="false"
    >
      <IonContent class="ion-padding">
        <p class="hint-text">{{ strategy.hint }}</p>
        <p v-if="strategy.requiresKeyLock" class="hint-lock">Requires Key Lock to be active.</p>
      </IonContent>
    </IonPopover>

    <button class="redraw-btn" @click="$emit('redraw')">another</button>
  </div>
</template>

<script setup lang="ts">
import { IonPopover, IonContent } from '@ionic/vue'
import type { Strategy } from '../../data/strategies'

defineProps<{ strategy: Strategy }>()
defineEmits<{ redraw: [] }>()
</script>

<style scoped>
.strategy-card {
  background: linear-gradient(145deg, rgba(38, 45, 36, 0.4), rgba(25, 30, 24, 0.2));
  border: 1px solid var(--color-border-subtle);
  border-radius: 12px;
  padding: 1.1rem 1.4rem;
  text-align: center;
}

.strategy-label {
  font-size: 0.65rem;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--color-text-dim);
  margin: 0 0 0.4rem;
}

.strategy-body {
  display: flex;
  align-items: flex-start;
  justify-content: center;
  gap: 0.4rem;
  margin-bottom: 0.6rem;
}

.strategy-text {
  font-family: var(--font-serif);
  font-size: 1.35rem;
  font-weight: 300;
  font-style: italic;
  color: var(--color-text);
  margin: 0;
  line-height: 1.4;
}

.hint-btn {
  background: none;
  border: none;
  font-size: 0.85rem;
  color: var(--color-text-dim);
  cursor: pointer;
  padding: 0;
  flex-shrink: 0;
  margin-top: 0.1rem;
  transition: color 0.15s;
  line-height: 1;
}
.hint-btn:hover { color: var(--color-accent); }

.redraw-btn {
  background: none;
  border: none;
  font-size: 0.65rem;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--color-text-dim);
  cursor: pointer;
  padding: 0;
  transition: color 0.15s;
}
.redraw-btn:hover { color: var(--color-accent); }

/* Popover content styles (unscoped override via global) */
.hint-text {
  font-size: 0.85rem;
  line-height: 1.5;
  color: var(--color-text);
  margin: 0 0 0.4rem;
}

.hint-lock {
  font-size: 0.72rem;
  color: var(--color-accent);
  margin: 0;
  font-style: italic;
}
</style>
