import { createApp } from "vue";
import { createPinia } from "pinia";
import VueCalendarHeatmap from 'vue3-calendar-heatmap'

import App from "./App.vue";
import vuetify from "./plugins/vuetify.ts";
import registerComponents from "./plugins/registerComponents.ts";
import "./styles/style.sass";

const app = createApp(App);

const pinia = createPinia();
app.use(pinia);
app.use(VueCalendarHeatmap)

app.use(vuetify);

registerComponents(app).then(() => {
    app.mount("#app");
});
