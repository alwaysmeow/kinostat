<template>
    <div class="person-card">
        <h3>{{ person?.name }}</h3>
        <img :src="person?.photo" />
        <a
            class="kinopoisk-link"
            :href="`https://www.kinopoisk.ru/name/${person?.id}/`"
            target="_blank"
            rel="noopener noreferrer"
        >    
            <v-icon icon="$link" />
            <span>Страница на Кинопоиске</span>
        </a>
        <div class="person-contribution">
            <div v-for="id in person?.films" :key="id">
                <film-contribution-item :id="id" />
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { mixins } from "vue-class-component";
import StoreMixin from "../mixins/store.mixin";
import { InfoTabStatus } from "../common/types";

export default class PersonCardComponent extends mixins(StoreMixin) {
    get person() {
        const personId = this.selectedObjectId;
        switch (this.infoTabStatus) {
            case InfoTabStatus.Actor:
                return this.actors.find((actor) => actor.id === personId);
            case InfoTabStatus.Director:
                return this.directors.find(
                    (director) => director.id === personId
                );
        }
        return null;
    }
}
</script>

<style lang="sass">
.person-card
    display: flex
    flex-direction: column
    gap: 1rem
    padding: 0 2rem

.person-contribution
    display: flex
    flex-direction: column

    .contribution-item
        padding: 0.5rem
        border-bottom: 1px solid var(--main-text-color)
</style>
