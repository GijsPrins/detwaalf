import { defineStore } from 'pinia'

export type Persona = 'avonturier' | 'presteerder' | 'genieter'

export const usePersonaStore = defineStore('persona', () => {
  const active = ref<Persona | null>(null)

  function set(persona: Persona) {
    active.value = persona
  }

  function clear() {
    active.value = null
  }

  return { active, set, clear }
})
