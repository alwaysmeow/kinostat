<template>
    <header class="app-header">
        <div class="app-brand">KINOSTAT</div>
        <div id="header-navigation" class="header-navigation"></div>
        <details ref="profileMenu" class="profile-menu">
            <summary>
                <v-icon icon="$account" size="28" />
                <span>{{ selectedUsername ? `@${selectedUsername}` : "Profile" }}</span>
            </summary>
            <div class="profile-menu-panel">
                <form class="switch-profile-form" @submit.prevent="openProfile">
                    <label for="profile-username">Open another profile</label>
                    <div>
                        <input id="profile-username" v-model.trim="username" placeholder="Letterboxd username" required />
                        <button type="submit" :disabled="loading">
                            {{ loading ? "Loading…" : "Open" }}
                        </button>
                    </div>
                </form>
                <button class="profile-menu-action" type="button" @click="showImportPage">
                    Import Letterboxd ZIP
                </button>
                <a
                    v-if="selectedUsername"
                    class="profile-menu-action"
                    :href="letterboxdProfileUrl"
                    target="_blank"
                    rel="noopener noreferrer"
                >View profile on Letterboxd ↗</a>
            </div>
        </details>
    </header>
    <div v-if="error" class="profile-error">{{ error }}</div>
    <main v-if="isImportPage" class="import-page">
        <button class="back-button" type="button" @click="leaveImportPage">← Back</button>
        <div class="import-panel">
            <p class="eyebrow">LETTERBOXD DATA</p>
            <h1>Import your ratings</h1>
            <ol>
                <li>Sign in to Letterboxd.</li>
                <li>
                    Open the
                    <a href="https://letterboxd.com/user/exportdata/" target="_blank" rel="noopener noreferrer">
                        data export page
                    </a>.
                </li>
                <li>Request and download the ZIP archive.</li>
                <li>Upload the ZIP below. Your username will be detected automatically.</li>
            </ol>
            <label class="archive-button import-upload" :class="{ disabled: loading }">
                <input
                    type="file"
                    accept=".zip,application/zip"
                    :disabled="loading"
                    @change="importArchive"
                />
                {{ loading ? "Importing…" : "Choose Letterboxd ZIP" }}
            </label>
        </div>
    </main>
    <statistic-page v-else-if="selectedUsername" :key="selectedUsername" :user-id="selectedUsername"/>
    <main v-else class="empty-state">
        <h1>Letterboxd Statistics</h1>
        <p>Enter a public profile username to view its ratings.</p>
    </main>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue";

const username = ref("");
const selectedUsername = ref("");
const loading = ref(false);
const error = ref("");
const isImportPage = ref(window.location.pathname === "/import");
const profileMenu = ref<HTMLDetailsElement | null>(null);
const letterboxdProfileUrl = computed(() => `https://letterboxd.com/${selectedUsername.value}/`);

function closeProfileMenu() {
    if (profileMenu.value) profileMenu.value.open = false;
}

function showImportPage() {
    closeProfileMenu();
    error.value = "";
    isImportPage.value = true;
    window.history.pushState({}, "", "/import");
}

function leaveImportPage() {
    isImportPage.value = false;
    const url = selectedUsername.value ? `/?id=${encodeURIComponent(selectedUsername.value)}` : "/";
    window.history.pushState({}, "", url);
}

function handlePopState() {
    isImportPage.value = window.location.pathname === "/import";
}

async function openProfile() {
    loading.value = true;
    error.value = "";
    try {
        const normalized = username.value.replace(/^@/, "").toLocaleLowerCase();
        const response = await fetch(`/api/sync/${encodeURIComponent(normalized)}`, { method: "POST" });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || `Sync failed: ${response.status}`);
        selectedUsername.value = normalized;
        closeProfileMenu();
        isImportPage.value = false;
        const url = new URL(window.location.href);
        url.pathname = "/";
        url.searchParams.set("id", normalized);
        window.history.replaceState({}, "", url);
    } catch (cause) {
        error.value = cause instanceof Error ? cause.message : "Could not load profile";
    } finally {
        loading.value = false;
    }
}

onMounted(() => {
    window.addEventListener("popstate", handlePopState);
    if (isImportPage.value) return;
    const id = new URL(window.location.href).searchParams.get("id")?.trim();
    if (!id) return;
    username.value = id;
    void openProfile();
});

onBeforeUnmount(() => window.removeEventListener("popstate", handlePopState));

async function importArchive(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    loading.value = true;
    error.value = "";
    try {
        const response = await fetch("/api/import", {
            method: "POST",
            headers: { "Content-Type": "application/zip" },
            body: file,
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || `Import failed: ${response.status}`);
        const normalized = data.username;
        username.value = normalized;
        selectedUsername.value = "";
        await new Promise((resolve) => requestAnimationFrame(resolve));
        selectedUsername.value = normalized;
        isImportPage.value = false;
        const url = new URL(window.location.href);
        url.pathname = "/";
        url.searchParams.set("id", normalized);
        window.history.replaceState({}, "", url);
    } catch (cause) {
        error.value = cause instanceof Error ? cause.message : "Could not import archive";
    } finally {
        loading.value = false;
        input.value = "";
    }
}
</script>

<style scoped>
.app-header {
    box-sizing: border-box;
    width: min(100% - 2rem, 1440px);
    min-height: 72px;
    margin: 0 auto;
    position: sticky;
    top: 0;
    z-index: 20;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 2rem;
    border-bottom: 1px solid #3b3b3b;
    background: var(--background-color);
}

.app-brand {
    font-size: 1.25rem;
    font-weight: 800;
}

.header-navigation { flex: 1; min-width: 0; }
.profile-menu { position: relative; flex: 0 0 auto; }
.profile-menu summary {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    min-height: 48px;
    padding: 0 1rem;
    border-radius: 1em;
    background: var(--neutral-shade-one);
    font-weight: bold;
    cursor: pointer;
    list-style: none;
    user-select: none;
}
.profile-menu summary::-webkit-details-marker { display: none; }
.profile-menu summary:hover, .profile-menu[open] summary { background: var(--neutral-shade-two); }
.profile-menu-panel {
    position: absolute;
    top: calc(100% + 0.75rem);
    right: 0;
    width: 310px;
    padding: 1rem;
    border: 1px solid #555;
    border-radius: 0.8rem;
    background: #252525;
    box-shadow: 0 14px 36px #0008;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
}
.switch-profile-form label {
    display: block;
    margin-bottom: 0.5rem;
    color: #aaa;
    font-size: 0.8rem;
    font-weight: 700;
}
.switch-profile-form > div { display: flex; gap: 0.5rem; }
.switch-profile-form input, .switch-profile-form button {
    border: 0;
    border-radius: 1em;
    padding: 0.6rem 0.8rem;
    background: var(--neutral-shade-one);
    color: var(--main-text-color);
    font: inherit;
}
.switch-profile-form input { width: 100%; min-width: 0; }
.switch-profile-form input:focus { outline: 2px solid var(--neutral-shade-two); }
.switch-profile-form button { cursor: pointer; font-weight: bold; }
.switch-profile-form button:hover { background: var(--neutral-shade-two); }
.profile-menu-action {
    box-sizing: border-box;
    display: block;
    width: 100%;
    margin: 0;
    padding: 0.7rem 0.75rem;
    border: 0;
    border-radius: 1em;
    background: var(--neutral-shade-one);
    color: var(--main-text-color);
    font: inherit;
    font-weight: bold;
    text-align: center;
    text-decoration: none;
    cursor: pointer;
}
.profile-menu-action:hover { background: var(--neutral-shade-two); color: var(--main-text-color); }
.archive-button {
    border: 1px solid #777;
    border-radius: 0.6rem;
    padding: 0.6rem 0.8rem;
    cursor: pointer;
    white-space: nowrap;
}
.archive-button input { display: none; }
.archive-button.disabled { cursor: wait; opacity: 0.55; }
.profile-error { margin: 1rem auto; color: #e93c3c; text-align: center; }
.empty-state { padding: 20vh 1rem; text-align: center; color: #888; }
.empty-state h1 { color: #f2f2f2; font-size: clamp(2rem, 5vw, 4rem); }
.import-page { width: min(100% - 2rem, 760px); margin: 0 auto; padding: 3rem 0; }
.back-button { border: 0; background: none; color: #aaa; cursor: pointer; font: inherit; }
.import-panel {
    margin-top: 2rem;
    padding: clamp(1.5rem, 5vw, 3.5rem);
    border: 1px solid #444;
    border-radius: 1rem;
    background: #222;
    text-align: left;
}
.import-panel h1 { margin: 0 0 2rem; font-size: clamp(2rem, 5vw, 3.5rem); }
.import-panel ol { padding-left: 1.25rem; line-height: 1.6; }
.import-panel li + li { margin-top: 0.6rem; }
.import-panel a { color: #ff6a20; font-weight: 700; }
.eyebrow { color: #ff6a20; font-size: 0.75rem; font-weight: 800; letter-spacing: 0.12em; }
.import-upload { display: inline-block; margin-top: 1.5rem; padding: 0.85rem 1.2rem; background: #ff5500; border-color: #ff5500; color: white; font-weight: 800; }

@media (max-width: 640px) {
    .app-header { flex-wrap: wrap; gap: 0.5rem; padding: 0.75rem 0; }
    .header-navigation { order: 3; flex-basis: 100%; }
    .profile-menu { margin-left: auto; }
    .profile-menu-panel { position: fixed; top: 4.5rem; right: 1rem; width: calc(100vw - 2rem); }
}
</style>
