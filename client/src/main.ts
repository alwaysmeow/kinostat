import { createApp } from "vue";
import "./style.sass";
import App from "./App.vue";
import registerComponents from "./registerComponents";

const app = createApp(App);

registerComponents(app).then(() => {
    app.mount("#app");
});
