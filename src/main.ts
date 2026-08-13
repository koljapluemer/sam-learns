import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import router from './router'
import { initTheme } from './shared/theme/theme'
import { cleanupLegacyDatabases } from './shared/db/legacyDatabaseCleanup'

initTheme()
cleanupLegacyDatabases()

const app = createApp(App)
app.use(router)
app.mount('#app')
