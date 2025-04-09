<template>
    <div class="film-card">
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
        <p>
            <b v-if="film.directors!.length === 1">Режиссер: </b>
            <b v-else>Режиссеры: </b>
            <span v-for="(person, index) in film.directors" :key="person.id">
                <span
                    class="contributing-person-name"
                    @click="onDirectorClick(person.id)"
                >
                    {{ person.name }}
                </span>
                <span v-if="index < film.directors!.length - 1">, </span>
            </span>
        </p>
        <p class="film-card-actors-list">
            <b>В ролях: </b>
            <span v-for="(person, index) in film.actors" :key="person.id">
                <span
                    class="contributing-person-name"
                    @click="onActorClick(person.id)"
                >
                    {{ person.name }}
                </span>
                <span v-if="index < film.actors!.length - 1">, </span>
            </span>
        </p>
    </div>
</template>

<script lang="ts">
import { mixins } from "vue-class-component";
import StoreMixin from "../mixins/store.mixin";
import { InfoTabStatus } from "../common/types";

export default class PersonCardComponent extends mixins(StoreMixin) {
    created() {}

    get film() {
        const filmId = this.selectedObjectId;
        return {
            ...this.votes.find((vote) => vote.filmId === filmId),
            ...this.films.find((film) => film.id === filmId),
        };
    }

    onActorClick(personId: number) {
        this.setInfoTab(InfoTabStatus.Actor, personId);
    }

    onDirectorClick(personId: number) {
        this.setInfoTab(InfoTabStatus.Director, personId);
    }
}
</script>

<style lang="sass">
.film-card
    display: flex
    flex-direction: column
    gap: 1rem
    padding: 0 2rem

    img
        border-radius: 5px

    p
        text-align: left
        user-select: none

.contributing-person-name:hover
    color: var(--kinopoisk-color)
    cursor: pointer
</style>
