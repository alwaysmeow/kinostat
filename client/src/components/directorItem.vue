<template>
    <div :class="['director-item', cssValueClass]">
        <div class="director-info">
            <img class="person-photo" :src="photoSrc" />
            <div class="director-credits">
                <div class="director-name">{{ director?.name }}</div>
                <div class="director-year dark-text">
                    {{ director?.id }}
                </div>
            </div>
        </div>
        <div class="director-value-circle">{{ averageVote }}</div>
    </div>
</template>

<script lang="ts">
import { Options, mixins } from "vue-class-component";
import StoreMixin from "../mixins/store.mixin";
import type { Person } from "../types/types";
import QueryMixin from "../mixins/query.mixin";

type PropsType = {
    id: number;
};

@Options({
    props: {
        id: { type: Number, default: 0 },
    },
})
export default class DirectorItemComponent extends mixins(
    StoreMixin,
    QueryMixin
) {
    declare $props: PropsType;

    get director(): Person | undefined {
        return this.getDirector(this.$props.id);
    }

    get averageVote(): string {
        const votes: number[] =
            this.director?.films
                .map(
                    (filmId) =>
                        this.votes.find((vote) => vote.filmId === filmId)
                            ?.value || 0
                )
                .filter((item) => item) || [];
        const avgVote = (
            votes.reduce((a, b) => a + b, 0) / votes.length
        ).toString();
        return avgVote.length > 1 ? avgVote.slice(0, 3) : avgVote;
    }

    get cssValueClass(): string {
        const colorValue = Math.round(parseFloat(this.averageVote));
        return `vote-value-${colorValue}`;
    }

    get photoSrc(): string {
        return this.director?.photo;
    }

    async created() {
        const director = await this.getPersonQuery(this.$props.id);

        if (director) {
            this.setDirectorAttributes(this.$props.id, {
                photo: director.img.photo.x2 || director.img.photo.x1,
            });
        }
    }
}
</script>

<style lang="sass">
.director-item
    display: flex
    align-items: center
    justify-content: space-between

    border: 1px solid grey
    border-radius: 5px

    transition: 0.5s

    user-select: none

    &:hover
        .director-value-circle
            background-color: var(--value-color)

        .director-credits
            transform: translateY(0)

            .director-year
                opacity: 100%

.director-info
    display: flex
    flex-direction: row
    align-items: center
    gap: 2rem
    height: 10rem

    .person-photo
        border-radius: 5px
        height: 100%

    .director-credits
        display: flex
        flex-direction: column
        justify-items: left
        text-align: left

        transform: translateY(25%)
        transition: 0.5s

        text-wrap: pretty

        .director-name
            font-weight: bold
            font-size: 1.2rem

        .director-id
            opacity: 0%
            transition: 0.5s

.director-value-circle
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
