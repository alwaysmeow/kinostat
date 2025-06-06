<template>
    <div :class="['person-item', cssValueClass]" @click="onClick">
        <img class="person-photo" loading="lazy" :src="photoSrc" />
        <div class="person-credits">
            <div class="person-name">{{ person?.name }}</div>
        </div>
        <div class="person-avg-value">{{ averageVote }}</div>
    </div>
</template>

<script lang="ts">
import { Options, mixins } from "vue-class-component";
import StoreMixin from "../mixins/store.mixin";
import { InfoTabStatus, type Person } from "../common/types";
import QueryMixin from "../mixins/query.mixin";

type PropsType = {
    id: number;
    list: "directors" | "actors";
};

@Options({
    props: {
        id: { type: Number, default: 0 },
        list: { type: String, required: true },
    },
})
export default class DirectorItemComponent extends mixins(
    StoreMixin,
    QueryMixin
) {
    declare $props: PropsType;

    get person(): Person | undefined {
        switch (this.$props.list) {
            case "directors":
                return this.getDirector(this.$props.id);
            case "actors":
                return this.getActor(this.$props.id);
        }
    }

    get averageVote(): string {
        const format = (vote: number): string => {
            const avgVoteString = (vote || 0).toString();
            return avgVoteString.length > 1
                ? avgVoteString.slice(0, 3)
                : avgVoteString;
        };

        return format(this.person?.averageVote);
    }

    get cssValueClass(): string {
        const colorValue = Math.round(parseFloat(this.averageVote));
        return `vote-value-${colorValue}`;
    }

    get photoSrc(): string {
        return this.person?.photo;
    }

    onClick() {
        if (this.selectedObjectId === this.$props.id) {
            this.setNoneInfoTab();
        } else {
            switch (this.$props.list) {
                case "directors":
                    this.setInfoTab(InfoTabStatus.Director, this.$props.id);
                    break;
                case "actors":
                this.setInfoTab(InfoTabStatus.Actor, this.$props.id);
                    break;
            }
        }
    }
}
</script>

<style lang="sass">
.person-item
    display: flex
    width: 100%
    height: 100%
    flex-direction: column
    align-items: center
    justify-content: center

    gap: 0.5rem
    height: max-content

    background-color: var(--neutral-shade-one)
    border-radius: 5px

    transition: 0.5s

    user-select: none
    cursor: pointer

    &:hover .person-avg-value
        color: var(--main-text-color)
        background-color: var(--value-color)

.person-photo
    width: 100%
    border-radius: 5px 5px 0 0
    aspect-ratio: 2 / 3

.person-credits
    display: flex
    flex-direction: column
    align-items: center
    justify-content: center
    height: 5rem
    width: 100%

    .person-name
        font-weight: bold
        margin: 0 15px

.person-avg-value
    display: flex
    align-items: center
    justify-content: center

    width: 100%
    padding: 0.2rem

    color: var(--value-color)
    border-radius: 0 0 5px 5px

    font-weight: bold
    font-size: 1.2rem

    transition: 0.5s
</style>
