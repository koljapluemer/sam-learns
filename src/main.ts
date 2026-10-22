import { createApp } from 'vue'
import VueDOMPurifyHTML from 'vue-dompurify-html'
import './style.css'
import App from './App.vue'
import router from './router'
import { initTheme } from './shared/theme/theme'
import { registerServiceWorker } from './shared/offline/serviceWorker'

initTheme()
registerServiceWorker()

const app = createApp(App)
app.use(router)
app.use(VueDOMPurifyHTML)
app.mount('#app')
