<template>
    <div class="filter-tab">
        <h2>Фильтры</h2>
        <div class="filter-vote-value-picker">
            <div class="filter-vote-value-picker-grid">
                <div
                    v-for="index in selectedVoteValues.map((_, i) => i)"
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

        <div class="filter-year">
            <div class="filter-label"> 
                <div class="filter-label-name">Год выпуска</div>
                <div class="filter-label-value">{{ `${yearRange[0]} - ${yearRange[1]}` }}</div>
            </div>
            <v-range-slider
                class="filter-slider"
                v-model="yearRange"
                :min="minYear"
                :max="maxYear"
                :step="1"
                hide-details
            />
        </div>

        <div class="filter-buttons-block">
            <v-btn class="filter-button" elevation="0">Сбросить</v-btn>
            <v-btn class="filter-button" elevation="0">Применить</v-btn>
        </div>
    </div>
</template>

<script lang="ts">
import { mixins, Options } from "vue-class-component";
import StoreMixin from "../mixins/store.mixin";
import type { TabIndex } from "../types/types";

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
    selectedVoteValues: boolean[] = Array(10).fill(true);
    minYear: number = 1900;
    maxYear: number = (new Date()).getFullYear();
    yearRange: number[] = [this.minYear, this.maxYear];

    isTab(tab: TabIndex): boolean {
        return this.$props.tabIndex === tab;
    }

    handleValueClick(index: number) {
        this.selectedVoteValues[index] = !this.selectedVoteValues[index];
    }

    cssValueSelectedClass(index: number): string {
        if (this.selectedVoteValues[index]) {
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
    
    .filter-label
        display: flex
        justify-content: space-between
        margin: 0 8px
        font-weight: bold

        .filter-label-name
            color: var(--secondary-text-color)

    .filter-buttons-block
        display: flex
        gap: 1rem

        .filter-button
            width: 50%
            background-color: var(--neutral-shade-one)
            border-radius: 1em
            font-weight: bold
</style>
