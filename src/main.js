import { createApp } from 'vue'
import TDesign from 'tdesign-vue-next';
import App from './App.vue'
import router from './router'; // 导入路由配置
import 'tdesign-vue-next/es/style/index.css';
// createApp(App).mount('#app')
const app = createApp(App);
app.use(TDesign);
app.use(router);
app.mount('#app');
