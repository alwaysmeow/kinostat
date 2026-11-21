<template>
    <div :class="['vote-item', cssValueClass]" @click="onClick">
        <div class="vote-film-info">
            <img class="vote-film-poster" loading="lazy" :src="posterSrc"/>
            <div class="vote-film-credits">
                <div class="vote-film-name">{{ $props.vote.title }}</div>
                <div class="vote-film-meta dark-text">
                    <span>{{ $props.vote.year }}</span>
                    <span v-if="voteDate">Rated {{ voteDate }}</span>
                </div>
            </div>
        </div>
        <div class="vote-value-circle">{{ $props.vote.value }}</div>
    </div>
</template>

<script lang="ts">
import { Options, mixins } from "vue-class-component";
import StoreMixin from '../mixins/store.mixin';
import { InfoTabStatus, type Vote } from '../common/types';

type PropsType = {
    vote: Vote;
};

@Options({
    props: {
        vote: { type: Object, default: 0 },
    },
})
export default class VoteItemComponent extends mixins(StoreMixin) {
    declare $props: PropsType;

    get cssValueClass(): string {
        return `vote-value-${this.$props.vote.value}`;
    }

    get posterSrc(): string {
        const film = this.getFilm(this.$props.vote.filmId);
        if (!film?.posterBaseUrl) return "";
        if (film.posterBaseUrl.includes("image.tmdb.org/t/p/original")) {
            return film.posterBaseUrl.replace("/original/", "/w185/");
        }
        return film.posterBaseUrl;
    }

    get voteDate(): string {
        const rawDate = this.$props.vote.time?.split(" ")[0];
        if (!rawDate) return "";
        const [day, month, shortYear] = rawDate.split(".");
        if (!day || !month || !shortYear) return rawDate;
        return `${day}.${month}.20${shortYear}`;
    }

    onClick() {
        if (this.selectedObjectId === this.$props.vote.filmId) {
            this.setNoneInfoTab();
        } else {
            this.setInfoTab(InfoTabStatus.Film, this.$props.vote.filmId);
        }
    }
};
</script>

<style lang="sass">
.vote-item
    content-visibility: auto
    contain-intrinsic-size: auto 108px
    display: flex
    align-items: center
    justify-content: space-between

    background-color: var(--neutral-shade-one)
    border-radius: 1em

    transition: 0.5s

    user-select: none
    overflow: hidden
    min-height: 104px

    &:hover
        .vote-value-circle
            background-color: var(--value-color)
        
.vote-film-info
    display: flex
    flex-direction: row
    align-items: center
    gap: 1rem
    min-width: 0

    .vote-film-poster
        width: 72px
        height: 108px
        flex: 0 0 72px
        object-fit: cover
        border-radius: 5px

    .vote-film-credits
        display: flex
        flex-direction: column
        justify-items: left
        text-align: left

        text-wrap: pretty
        min-width: 0

        .vote-film-name
            font-weight: bold
            font-size: 1.2rem

        .vote-film-meta
            display: flex
            flex-wrap: wrap
            gap: 0.25rem 0.75rem
            font-size: 0.9rem

.vote-value-circle
    height: 3rem
    width: 3rem

    display: flex
    align-items: center
    justify-content: center

    flex: 0 0 3rem
    margin: 1.25rem

    border: 2px solid var(--value-color)
    border-radius: 100%

    font-weight: bold
    font-size: 1.2rem

    transition: 0.5s
</style>
