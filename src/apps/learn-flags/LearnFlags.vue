<template>
  <div class="learn-flags">
    <div class="flag-container">
      <img
        :src="currentFlagPath"
        :alt="currentCountry"
        class="flag-image"
      >
    </div>
    <div class="buttons-container">
      <button
        v-for="option in options"
        :key="option.code"
        :class="{
          'correct': showCorrect && option.code === currentCountry,
          'incorrect': showIncorrect && option.code !== currentCountry && option.code === lastClicked
        }"
        :disabled="showCorrect"
        @click="checkAnswer(option)"
      >
        {{ option.name }}
      </button>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, computed } from 'vue'

export default {
  name: 'LearnFlags',
  setup() {
    const countries = ref([])
    const currentCountry = ref('')
    const options = ref([])
    const showCorrect = ref(false)
    const showIncorrect = ref(false)
    const lastClicked = ref('')

    const loadCountries = async () => {
      try {
        const response = await fetch('/data/learn-flags/iso_codes.csv')
        const text = await response.text()
        
        // Parse CSV properly handling quoted values
        const rows = text.split('\n').slice(1) // Skip header
        countries.value = rows
          .filter(row => row.trim())
          .map(row => {
            // Handle quoted values
            let name = ''
            let code = ''
            
            if (row.startsWith('"')) {
              // Find the end of the quoted name
              const quoteEnd = row.indexOf('",')
              if (quoteEnd !== -1) {
                name = row.substring(1, quoteEnd)
                code = row.substring(quoteEnd + 2).trim()
              }
            } else {
              // Regular comma-separated format
              const parts = row.split(',')
              name = parts[0]
              code = parts[1]?.trim() || ''
            }
            
            return { name, code }
          })
      } catch (error) {
        console.error('Error loading countries:', error)
      }
    }

    const getRandomCountry = () => {
      if (!countries.value.length) return null
      const index = Math.floor(Math.random() * countries.value.length)
      return countries.value[index]
    }

    const generateOptions = () => {
      if (!countries.value.length) return
      
      const correctCountry = getRandomCountry()
      if (!correctCountry) return
      
      currentCountry.value = correctCountry.code
      showIncorrect.value = false
      lastClicked.value = ''
      
      let wrongCountry
      do {
        wrongCountry = getRandomCountry()
      } while (wrongCountry.code === correctCountry.code)

      // Randomly decide which button gets which country
      options.value = Math.random() < 0.5
        ? [correctCountry, wrongCountry]
        : [wrongCountry, correctCountry]
    }

    const checkAnswer = (selectedCountry) => {
      if (!currentCountry.value) return
      
      lastClicked.value = selectedCountry.code
      
      if (selectedCountry.code === currentCountry.value) {
        showCorrect.value = true
        setTimeout(() => {
          showCorrect.value = false
          generateOptions()
        }, 1000)
      } else {
        showIncorrect.value = true
      }
    }

    onMounted(() => {
      loadCountries().then(() => {
        generateOptions()
      })
    })

    return {
      currentCountry,
      options,
      showCorrect,
      showIncorrect,
      lastClicked,
      checkAnswer,
      currentFlagPath: computed(() => `/data/learn-flags/flags/${currentCountry.value.toLowerCase()}.svg`)
    }
  }
}
</script>

<style scoped>
.learn-flags {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2rem;
  padding: 2rem;
}

.flag-container {
  width: 300px;
  height: 200px;
  display: flex;
  justify-content: center;
  align-items: center;
  border: 1px solid #ccc;
  border-radius: 8px;
  overflow: hidden;
}

.flag-image {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.buttons-container {
  display: flex;
  gap: 1rem;
}

button {
  padding: 1rem 2rem;
  font-size: 1.1rem;
  border: none;
  border-radius: 4px;
  background-color: #2196F3;
  color: white;
  cursor: pointer;
  transition: background-color 0.3s;
}

button:hover:not(:disabled) {
  background-color: #1976D2;
}

button:disabled {
  cursor: not-allowed;
  opacity: 0.7;
}

button.correct {
  background-color: #4CAF50;
}

button.incorrect {
  background-color: #f44336;
}
</style>
