import { createApp } from "vue";
import { createPinia } from "pinia";
import vuetify from "./plugins/vuetify.ts";

import App from "./App.vue";
import registerComponents from "./registerComponents";
import "./styles/style.sass";

const app = createApp(App);

const pinia = createPinia();
app.use(pinia);

app.use(vuetify);

registerComponents(app).then(() => {
    app.mount("#app");
});
