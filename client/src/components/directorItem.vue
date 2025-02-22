<template>
    <div :class="['director-item', cssValueClass]">
        <img class="person-photo" :src="photoSrc" />
        <div class="director-credits">
            <div class="director-name">{{ director?.name }}</div>
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
        const avgVote = (this.director?.averageVote || 0).toString();
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
    width: 100%
    height: 100%
    flex-direction: column
    align-items: center
    justify-content: center

    gap: 0.5rem
    height: max-content

    border: 1px solid grey
    border-radius: 5px

    transition: 0.5s

    user-select: none

    &:hover
        .director-value-circle
            background-color: var(--value-color)

.person-photo
    width: 100%
    border-radius: 5px
    aspect-ratio: 2 / 3

.director-credits
    display: flex
    flex-direction: column
    align-items: center
    justify-content: center
    height: 5rem

    .director-name
        width: 90%
        font-weight: bold

.director-value-circle
    height: 3rem
    width: 3rem

    display: flex
    align-items: center
    justify-content: center

    margin-bottom: 1rem

    border: 1px solid var(--value-color)
    border-radius: 100%

    font-weight: bold
    font-size: 1.2rem

    transition: 0.5s
</style>
