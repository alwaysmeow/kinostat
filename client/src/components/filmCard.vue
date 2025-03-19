<template>
    <div class="person-card">
        <h3>{{ film.title }}</h3>
        <img :src="`${film.posterBaseUrl}/120x`" />
        <a
            class="kinopoisk-link"
            :href="`https://www.kinopoisk.ru/film/${film.id}/`"
            target="_blank"
            rel="noopener noreferrer"
        >    
            <v-icon icon="$link" />
            <span>Страница на Кинопоиске</span>
        </a>
        <div class="film-card-actors-list">
            <div v-for="person in film.actors" :key="person.id">
                {{ person.name }}
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { mixins } from "vue-class-component";
import StoreMixin from "../mixins/store.mixin";

export default class PersonCardComponent extends mixins(StoreMixin) {
    created() {
    }

    get film() {
        const filmId = this.selectedObjectId;
        return {
            ...this.votes.find(vote => vote.filmId === filmId),
            ... this.films.find(film => film.id === filmId)
        }
    }
}
</script>

<style lang="sass">
.film-card
    display: flex
    flex-direction: column
    gap: 1rem
    padding: 0 2rem

.film-card-actors-list
    display: flex
    flex-direction: column
    text-align: left
    padding: 1rem
    
    user-select: none
</style>