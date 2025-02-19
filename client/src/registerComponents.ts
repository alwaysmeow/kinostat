import type { App } from "vue";
import { defineAsyncComponent } from "vue";
import manifest from "./manifest.json";

async function registerComponents(app: App) {
    const components = import.meta.glob("./components/**/*.vue");

    Object.entries(manifest).forEach(([name, filename]) => {
        const path = `./components/${filename}.vue`;
        app.component(name, defineAsyncComponent(components[path] as any));
    });
}

export default registerComponents;
