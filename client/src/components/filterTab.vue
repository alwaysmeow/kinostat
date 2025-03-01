<template>
    <div class="filter-tab">
        <h2>Фильтры</h2>
        <div class="filter-vote-value-picker" v-if="isTab(TabIndex.Votes)">
            <div class="filter-vote-value-picker-grid">
                <div
                    v-for="index in filterParams.selectedVoteValues.map((_, i) => i)"
                    :class="[
                        'filter-vote-value-circle',
                        `vote-value-${index + 1}`,
                        cssValueSelectedClass(index),
                    ]"
                    @click="handleValueClick(index)"
                >
                    {{ index + 1 }}
                </div>
            </div>
        </div>

        <filter-slider
            v-if="isTab(TabIndex.Votes)"
            v-model="filterParams.yearRange"
            label="Год премьеры"
            :min="minYear"
            :max="maxYear"
            :step="1"
        ></filter-slider>

        <filter-slider
            v-if="isTab(TabIndex.Directors) || isTab(TabIndex.Actors)"
            v-model="filterParams.voteRange"
            label="Средняя оценка"
            :step="0.1"
        ></filter-slider>

        <filter-slider
            v-if="isTab(TabIndex.Directors) || isTab(TabIndex.Actors)"
            v-model="filterParams.filmCountRange"
            label="Оценено фильмов"
        ></filter-slider>

        <filter-slider
            v-if="isTab(TabIndex.Directors) || isTab(TabIndex.Actors)"
            v-model="filterParams.birthYearRange"
            label="Год рождения"
            :min="minYear"
            :max="maxYear"
            :step="1"
        ></filter-slider>

        <div class="filter-buttons-block">
            <v-btn class="filter-button" elevation="0">Сбросить</v-btn>
            <v-btn class="filter-button" elevation="0">Применить</v-btn>
        </div>
    </div>
</template>

<script lang="ts">
import { mixins, Options } from "vue-class-component";
import StoreMixin from "../mixins/store.mixin";
import { TabIndex } from "../types/types";

type PropsType = {
    tabIndex: TabIndex;
};

@Options({
    props: {
        tabIndex: { type: Number, required: true },
    },
})
export default class VoteItemComponent extends mixins(StoreMixin) {
    declare $props: PropsType;

    minYear: number = 1900;
    maxYear: number = (new Date()).getFullYear();

    filterParams = {
        selectedVoteValues: Array(10).fill(true),
        yearRange: [this.minYear, this.maxYear],
        voteRange: [1, 10],
        filmCountRange: [1, 10],
        birthYearRange: [this.minYear, this.maxYear],
    }

    TabIndex = TabIndex;

    isTab(tab: TabIndex): boolean {
        return this.$props.tabIndex === tab;
    }

    handleValueClick(index: number) {
        this.filterParams.selectedVoteValues[index] = !this.filterParams.selectedVoteValues[index];
    }

    cssValueSelectedClass(index: number): string {
        if (this.filterParams.selectedVoteValues[index]) {
            return "active";
        }
        return "";
    }
}
</script>

<style lang="sass">
.filter-tab
    display: flex
    flex-direction: column

    margin: 0 2rem
    gap: 2rem

    .filter-vote-value-picker
        display: flex
        flex-direction: column
        gap: 1rem

        .filter-vote-value-picker-grid
            display: grid
            grid-template-columns: repeat(5, 1fr)
            gap: 0.5rem

            .filter-vote-value-circle
                display: flex
                justify-content: center
                align-items: center
                width: auto
                height: auto
                aspect-ratio: 1

                border: 2px solid var(--neutral-shade-one)
                border-radius: 100%

                cursor: pointer

                font-weight: bold
                user-select: none

                transition: 0.3s

                &.active
                    border-color: var(--value-color)

    .filter-buttons-block
        display: flex
        gap: 1rem

        .filter-button
            width: 50%
            background-color: var(--neutral-shade-one)
            border-radius: 1em
            font-weight: bold
</style>
