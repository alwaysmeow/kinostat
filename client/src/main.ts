import { createApp } from "vue";
import { createPinia } from "pinia";
import App from "./App.vue";
import registerComponents from "./registerComponents";
import "./style.sass";

const app = createApp(App);

const pinia = createPinia();
app.use(pinia);

registerComponents(app).then(() => {
    app.mount("#app");
});
