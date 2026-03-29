<template>
  <div v-if="sessions.length > 0" class="saved-sessions">
    <p class="section-label">saved sessions</p>
    <div class="session-list">
      <div v-for="s in sessions" :key="s.id" class="session-row">
        <button class="session-load" @click="$emit('load', s)">
          <span class="session-name">{{ s.name }}</span>
          <span class="session-meta">{{ s.sequence.length }} clusters · {{ s.voiceCount }}v</span>
        </button>
        <button class="session-delete" @click="remove(s.id)">×</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { listSessions, deleteSession, type SavedSession } from '../../utils/sessionStorage'

const emit = defineEmits<{ load: [session: SavedSession] }>()

const sessions = ref<SavedSession[]>([])

onMounted(() => { sessions.value = listSessions() })

function remove(id: string) {
  deleteSession(id)
  sessions.value = listSessions()
}
</script>

<style scoped>
.saved-sessions { width: 100%; }

.section-label {
  font-size: 0.65rem;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--color-text-dim);
  margin: 0 0 0.5rem;
}

.session-list {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.session-row {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.session-load {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 0.45rem 0.75rem;
  cursor: pointer;
  text-align: left;
  font-family: inherit;
  transition: border-color 0.15s;
  min-width: 0;
}
.session-load:hover { border-color: var(--color-accent); }

.session-name {
  font-size: 0.8rem;
  color: var(--color-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.session-meta {
  font-size: 0.65rem;
  color: var(--color-text-dim);
  flex-shrink: 0;
  margin-left: 0.6rem;
  font-family: 'SF Mono', 'Fira Code', monospace;
}

.session-delete {
  background: none;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  color: var(--color-text-dim);
  width: 1.6rem;
  height: 1.6rem;
  font-size: 0.9rem;
  cursor: pointer;
  flex-shrink: 0;
  transition: border-color 0.15s, color 0.15s;
  font-family: inherit;
}
.session-delete:hover { border-color: #8b3030; color: #e07878; }
</style>
