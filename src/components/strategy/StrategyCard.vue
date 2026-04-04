<template>
  <div class="strategy-card" :class="{ collapsed }">

    <!-- Header row — always visible -->
    <div class="strategy-header">
      <button class="collapse-btn" @click="collapsed = !collapsed" aria-label="toggle drift">
        <span class="strategy-label">the drift</span>
        <span class="chevron">{{ collapsed ? '▸' : '▾' }}</span>
      </button>

      <template v-if="collapsed">
        <p class="strategy-text-collapsed">{{ strategy.text }}</p>
        <button class="hint-btn" aria-label="What does this mean?" @click="hintOpen = true">ⓘ</button>
        <button class="icon-btn" @click="$emit('redraw')" aria-label="another">↺</button>
      </template>
    </div>

    <!-- Expanded body -->
    <template v-if="!collapsed">
      <div class="strategy-body">
        <p class="strategy-text">{{ strategy.text }}</p>
        <button class="hint-btn" aria-label="What does this mean?" @click="hintOpen = true">ⓘ</button>
      </div>
      <button class="icon-btn redraw-icon" @click="$emit('redraw')" aria-label="another">↺</button>
    </template>

    <IonPopover
      :is-open="hintOpen"
      :dismiss-on-select="false"
      @did-dismiss="hintOpen = false">
      <IonContent class="ion-padding">
        <p class="hint-text">{{ strategy.hint }}</p>
        <p v-if="strategy.requiresKeyLock" class="hint-lock">
          Requires Key Lock to be active.
        </p>
      </IonContent>
    </IonPopover>

  </div>
</template>

<script setup lang="ts">
  import { ref } from 'vue'
  import { IonPopover, IonContent } from '@ionic/vue'
  import type { Strategy } from '../../data/strategies'

  defineProps<{ strategy: Strategy }>()
  defineEmits<{ redraw: [] }>()

  const collapsed = ref(false)
  const hintOpen = ref(false)
</script>

<style scoped>
  .strategy-card {
    background: linear-gradient(
      145deg,
      rgba(38, 45, 36, 0.4),
      rgba(25, 30, 24, 0.2)
    );
    border: 1px solid var(--color-border-subtle);
    border-radius: 12px;
    padding: 1.1rem 1.4rem;
    text-align: center;
    transition: padding 0.2s;
  }

  .strategy-card.collapsed {
    padding: 0.6rem 1rem;
  }

  /* Header row */
  .strategy-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .collapse-btn {
    background: none;
    border: none;
    padding: 0;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 0.25rem;
    flex-shrink: 0;
  }

  .strategy-label {
    font-size: 0.65rem;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: var(--color-text-dim);
  }

  .chevron {
    font-size: 0.55rem;
    color: var(--color-text-dim);
  }

  /* Collapsed text — truncated single line */
  .strategy-text-collapsed {
    font-family: var(--font-serif);
    font-size: 0.95rem;
    font-weight: 300;
    font-style: italic;
    color: var(--color-text);
    margin: 0;
    flex: 1;
    min-width: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    text-align: left;
  }

  /* Expanded body */
  .strategy-body {
    display: flex;
    align-items: flex-start;
    justify-content: center;
    gap: 0.4rem;
    margin: 0.5rem 0 0.6rem;
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

  .icon-btn {
    background: none;
    border: none;
    font-size: 1rem;
    color: var(--color-text-dim);
    cursor: pointer;
    padding: 0;
    flex-shrink: 0;
    line-height: 1;
    transition: color 0.15s;
  }
  .icon-btn:hover { color: var(--color-accent); }

  .redraw-icon {
    display: block;
    margin: 0 auto;
    font-size: 1.1rem;
  }

  /* Popover content */
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
