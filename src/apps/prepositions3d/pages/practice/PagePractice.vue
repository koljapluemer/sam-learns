<script setup lang="ts">
// Ported from linguanodon's prepositions3d main.js/game.html - the scene is
// built imperatively (same as the original) rather than as declarative
// <a-scene> template markup, since buildScene() assigns a full HTML string
// including dynamically-generated drop zones. No accounts/sync: pullState/
// mergeRemoteLearningEvents and trackActiveTime are dropped (see app/game/game.ts).
import { onMounted, onUnmounted, ref } from 'vue'
import { registerDraggable } from '../../app/components/draggable'
import { registerDropZone } from '../../app/components/drop-zone'
import { registerGameTicker, setGameTickerGame } from '../../app/components/game-ticker'
import { registerMouseLookLimited } from '../../app/components/mouse-look-limited'
import { registerShadowCatcher } from '../../app/components/shadow-catcher'
import { registerXrMode } from '../../app/components/xr-mode'
import { buildScene, UI_LAYOUT, ZONES } from '../../app/scene/scene'
import { Game } from '../../app/game/game'
import { DEFAULT_LANGUAGE, getLanguageOptions, loadGlossaryData } from '../../app/language/glossary'
import { SceneUI } from '../../app/ui/scene-ui'

const MODELS_BASE_URL = '/data/prepositions3d/models/'
const SOUND_BASE_URL = '/data/prepositions3d/sound/'
const API_LANGUAGES_URL = '/data/prepositions3d/languages.json'
const API_GLOSSARY_URL = '/data/prepositions3d/glossary.json'

const container = ref<HTMLElement | null>(null)
const loadError = ref('')
let onSceneLoaded: (() => void) | null = null

async function startGame(sceneEl: any): Promise<void> {
  await loadGlossaryData(API_LANGUAGES_URL, API_GLOSSARY_URL)

  let game: Game | null = null
  const ui = new SceneUI({
    sceneEl,
    position: UI_LAYOUT.position,
    rotation: UI_LAYOUT.rotation,
    scale: UI_LAYOUT.scale,
    languages: getLanguageOptions(),
    selectedLanguage: DEFAULT_LANGUAGE,
    onLanguageChange: (language) => game?.setLanguage(language),
    onStart: () => game?.startRound(),
    onExit: () => game?.exitGame(),
    onAudioReplay: () => game?.recordAudioReplay()
  })
  game = new Game({ ui, sceneEl, zones: ZONES, language: DEFAULT_LANGUAGE, soundBaseUrl: SOUND_BASE_URL })
  setGameTickerGame(game)
  sceneEl.setAttribute('game-ticker', '')
}

onMounted(() => {
  if (!container.value) return

  try {
    registerDraggable()
    registerDropZone()
    registerGameTicker()
    registerMouseLookLimited()
    registerShadowCatcher()
    registerXrMode()
    buildScene(container.value, MODELS_BASE_URL)
  } catch (error) {
    loadError.value = error instanceof Error ? error.message : 'Could not build the 3D scene.'
    return
  }

  const sceneEl = container.value.querySelector('a-scene')
  onSceneLoaded = () => {
    void startGame(sceneEl).catch((error: unknown) => {
      loadError.value = error instanceof Error ? error.message : 'Could not load practice data.'
    })
  }
  sceneEl?.addEventListener('loaded', onSceneLoaded)
})

onUnmounted(() => {
  const sceneEl = container.value?.querySelector('a-scene')
  if (sceneEl && onSceneLoaded) sceneEl.removeEventListener('loaded', onSceneLoaded)
  setGameTickerGame(null)
  if (container.value) container.value.innerHTML = ''
})
</script>

<template>
  <div
    v-if="loadError"
    class="alert alert-error max-w-xl mx-auto mt-10"
  >
    <span>{{ loadError }}</span>
  </div>
  <div
    ref="container"
    class="fixed inset-0"
  />
</template>
