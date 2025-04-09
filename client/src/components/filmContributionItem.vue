<template>
    <div :class="['contribution-item', cssValueClass]">
        <div class="contribution-title" @click="onClick">
            {{ film.title }}
        </div>
        <div class="contribution-vote-value">
            {{ film.value }}
        </div>
    </div>
</template>

<script lang="ts">
import { mixins, Options } from "vue-class-component";
import StoreMixin from "../mixins/store.mixin";
import { InfoTabStatus } from "../common/types";

type PropsType = {
    id: number,
}

@Options({
    props: {
        id: Number,
    }
})

export default class FilmContributionItemComponent extends mixins(StoreMixin) {
    declare $props: PropsType;

    get film() {
        const vote = this.votes.find(vote => vote.filmId === this.$props.id);
        const film = this.films.find(film => film.id === this.$props.id);
        return {
            ...vote,
            ...film,
        }
    }

    get cssValueClass(): string {
        return `vote-value-${this.film.value}`;
    }

    onClick() {
        this.setInfoTab(InfoTabStatus.Film, this.$props.id);
    }
}
</script>

<style lang="sass">
.contribution-item
    display: flex
    justify-content: space-between
    align-items: center

    text-align: left

.contribution-title:hover
    color: var(--kinopoisk-color)
    cursor: pointer

.contribution-vote-value
    font-weight: bold
    color: var(--value-color)
</style>