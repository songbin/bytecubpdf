import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { i18n } from '../shared/i18n'
const app = createApp(App)
app.use(i18n) // 引入i18n,必须在use router之前
app.use(router)

app.mount('#app')