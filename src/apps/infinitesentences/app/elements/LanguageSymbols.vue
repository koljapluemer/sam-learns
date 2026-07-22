<script setup lang="ts">
// Port of linguanodon's infinitesentences app/elements/LanguageSymbols.js.
import { computed } from 'vue'
import { shuffleArray } from '../random'

const props = defineProps<{ symbols: string[] }>()

const shuffledSymbols = computed(() => shuffleArray(props.symbols))
</script>

<template>
  <div
    class="language-symbols"
    :class="'layout-' + props.symbols.length"
  >
    <template v-if="shuffledSymbols.length !== 0">
      <span
        v-for="(symbol, i) in shuffledSymbols"
        :key="i"
        class="symbol font-bold"
        :class="'symbol-' + (i + 1)"
      >{{ symbol }}</span>
    </template>
    <span
      v-else
      class="symbol font-bold"
    >💬</span>
  </div>
</template>

<style scoped>
/* Port of linguanodon's infinitesentences css/style.css badge-layout rules -
   grid/font-size combinations per symbol count that utility classes don't
   express well. */
.language-symbols {
  display: grid;
  width: 4rem;
  height: 4rem;
  place-items: center;
  font-size: 1rem;
  line-height: 1;
  background-color: rgba(0, 0, 0, 0.05);
  border-radius: 50%;
}

.language-symbols .symbol {
  display: flex;
  align-items: center;
  justify-content: center;
}

.language-symbols.layout-1 {
  grid-template-columns: 1fr;
  grid-template-rows: 1fr;
}

.language-symbols.layout-1 .symbol {
  font-size: 3.5rem;
}

.language-symbols.layout-2 {
  grid-template-columns: 1fr 1fr;
  grid-template-rows: 1fr;
  gap: 0.125rem;
}

.language-symbols.layout-2 .symbol {
  font-size: 1.75rem;
}

.language-symbols.layout-3 {
  grid-template-columns: 1fr 1fr;
  grid-template-rows: 1fr 1fr;
  gap: 0.125rem;
}

.language-symbols.layout-3 .symbol-1 {
  grid-row: 1 / 3;
  font-size: 2rem;
}

.language-symbols.layout-3 .symbol-2,
.language-symbols.layout-3 .symbol-3 {
  font-size: 1.25rem;
}

.language-symbols.layout-4 {
  grid-template-columns: 1fr 1fr;
  grid-template-rows: 1fr 1fr;
  gap: 0.125rem;
}

.language-symbols.layout-4 .symbol {
  font-size: 1.5rem;
}
</style>
