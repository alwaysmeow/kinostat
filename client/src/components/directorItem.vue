<template>
    <div :class="['vote-item', cssValueClass]">
        <div class="vote-film-info">
            <img class="vote-film-poster" :src="posterSrc" />
            <div class="vote-film-credits">
                <div class="vote-film-name">{{ $props.director.name }}</div>
                <div class="vote-film-year dark-text">
                    {{ $props.director.id }}
                </div>
            </div>
        </div>
        <div class="vote-value-circle">{{ averageVote }}</div>
    </div>
</template>

<script lang="ts">
import { Options, mixins } from "vue-class-component";
import StoreMixin from "../mixins/store.mixin";
import type { Person } from "../types/types";

type PropsType = {
    director: Person;
};

@Options({
    props: {
        director: { type: Object, default: 0 },
    },
})
export default class DirectorItemComponent extends mixins(StoreMixin) {
    declare $props: PropsType;

    get averageVote(): number {
        return 10;
    }

    get cssValueClass(): string {
        return `vote-value-${this.averageVote}`;
    }

    get posterSrc(): string {
        const film = this.getFilm(this.$props.director.films[0]);
        return film ? `${film.posterBaseUrl}/120x` : "";
    }
}
</script>

<style lang="sass">
.vote-item
    display: flex
    align-items: center
    justify-content: space-between

    border: 1px solid grey
    border-radius: 5px

    transition: 0.5s

    user-select: none

    &:hover
        .vote-value-circle
            background-color: var(--value-color)

        .vote-film-credits
            transform: translateY(0)

            .vote-film-year
                opacity: 100%

.vote-film-info
    display: flex
    flex-direction: row
    align-items: center
    gap: 2rem

    .vote-film-poster
        border-radius: 5px

    .vote-film-credits
        display: flex
        flex-direction: column
        justify-items: left
        text-align: left

        transform: translateY(25%)
        transition: 0.5s

        text-wrap: pretty

        .vote-film-name
            font-weight: bold
            font-size: 1.2rem

        .vote-film-year
            opacity: 0%
            transition: 0.5s

.vote-value-circle
    height: 3rem
    width: 3rem

    display: flex
    align-items: center
    justify-content: center

    margin: 2rem

    border: 1px solid var(--value-color)
    border-radius: 100%

    font-weight: bold
    font-size: 1.2rem

    transition: 0.5s
</style>
