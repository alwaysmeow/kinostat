<template>
    <div class="film-list-tab">
        <header class="film-list-header">
            <span class="film-list-eyebrow">FILMS</span>
            <h3>{{ filmListSelection?.title }}</h3>
            <span>{{ selectedVotes.length }} {{ filmCountLabel }}</span>
        </header>

        <div class="film-list-items">
            <vote-item
                v-for="vote in selectedVotes"
                :key="vote.filmId"
                :vote="vote"
            />
        </div>
    </div>
</template>

<script lang="ts">
import { mixins } from "vue-class-component";
import StoreMixin from "../mixins/store.mixin";

export default class FilmListTabComponent extends mixins(StoreMixin) {
    get selectedVotes() {
        const ids = new Set(this.filmListSelection?.filmIds ?? []);
        return this.votes
            .filter((vote) => ids.has(vote.filmId))
            .sort((left, right) => (right.num ?? 0) - (left.num ?? 0));
    }

    get filmCountLabel() {
        return this.selectedVotes.length === 1 ? "film" : "films";
    }
}
</script>

<style lang="sass">
.film-list-tab
    display: grid
    grid-template-rows: auto minmax(0, 1fr)
    height: 100%
    min-height: 100%
    overflow: hidden

    .film-list-header
        z-index: 1
        padding: 1.5rem 4rem 1.25rem 1.5rem
        border-bottom: 1px solid rgba(255, 255, 255, 0.08)
        background: var(--neutral-shade-one)

        h3
            margin: 0.15rem 0 0.25rem
            font-size: 1.35rem

        > span:last-child
            color: var(--secondary-text-color)
            font-size: 0.9rem

    .film-list-eyebrow
        color: var(--kinopoisk-color)
        font-size: 0.72rem
        font-weight: 700
        letter-spacing: 0.08em

    .film-list-items
        display: flex
        flex-direction: column
        gap: 0.75rem
        min-height: 0
        padding: 1rem
        overflow-y: auto
        overscroll-behavior: contain

        .vote-item
            background: var(--background-color)

        .vote-item .vote-film-name
            font-size: 1rem

        .vote-item .vote-value-circle
            width: 2.5rem
            height: 2.5rem
            flex-basis: 2.5rem
            margin: 0.75rem
</style>
