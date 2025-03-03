<template>
    <div class="filter-tab">
        <h2>Фильтры</h2>

        <div v-if="isTab(TabIndex.Votes)" class="filter-tab-content">
            <div class="filter-vote-value-picker">
                <div class="filter-vote-value-picker-grid">
                    <div
                        v-for="index in filterParams.selectedVoteValues.map(
                            (_, i) => i
                        )"
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
                v-model="filterParams.filmYearRange"
                label="Год премьеры"
                :min="minYear"
                :max="maxYear"
                :step="1"
            ></filter-slider>
        </div>

        <div v-if="isTab(TabIndex.Directors)" class="filter-tab-content">
            <filter-slider
                v-model="filterParams.directorVoteRange"
                label="Средняя оценка"
                :step="0.1"
            ></filter-slider>

            <filter-slider
                v-model="filterParams.directorFilmCountRange"
                label="Оценено фильмов"
            ></filter-slider>

            <filter-slider
                v-model="filterParams.directorBirthYearRange"
                label="Год рождения"
                :min="minYear"
                :max="maxYear"
                :step="1"
            ></filter-slider>
        </div>

        <div v-if="isTab(TabIndex.Actors)" class="filter-tab-content">
            <filter-slider
                v-model="filterParams.actorVoteRange"
                label="Средняя оценка"
                :step="0.1"
            ></filter-slider>

            <filter-slider
                v-model="filterParams.actorFilmCountRange"
                label="Оценено фильмов"
            ></filter-slider>

            <filter-slider
                v-model="filterParams.actorBirthYearRange"
                label="Год рождения"
                :min="minYear"
                :max="maxYear"
                :step="1"
            ></filter-slider>
        </div>

        <div class="filter-buttons-block">
            <v-btn
                class="filter-button"
                elevation="0"
                @click="handleResetFilters"
                >Сбросить</v-btn
            >
            <v-btn
                class="filter-button"
                elevation="0"
                @click="handleApplyFilters"
                >Применить</v-btn
            >
        </div>
    </div>
</template>

<script lang="ts">
import { mixins, Options } from "vue-class-component";
import StoreMixin from "../mixins/store.mixin";
import { TabIndex, type iFilters } from "../common/types";
import { startupFilters } from "../common/const";

type PropsType = {
    tabIndex: TabIndex;
};

@Options({
    props: {
        tabIndex: { type: Number, required: true },
    },
})
export default class FilterTabComponent extends mixins(StoreMixin) {
    declare $props: PropsType;

    minYear: number = 1800;
    maxYear: number = 2100;

    filterParams: iFilters = startupFilters();

    TabIndex = TabIndex;

    created() {
        // this.filterParams = this.getDefaultFilters();
    }

    isTab(tab: TabIndex): boolean {
        return this.$props.tabIndex === tab;
    }

    handleValueClick(index: number) {
        this.filterParams.selectedVoteValues[index] =
            !this.filterParams.selectedVoteValues[index];
    }

    cssValueSelectedClass(index: number): string {
        if (this.filterParams.selectedVoteValues[index]) {
            return "active";
        }
        return "";
    }

    handleResetFilters() {
        if (true) {
            this.filterParams = { ...this.filters };
        } else {
            this.setDefaultFilters();
        }
    }

    handleApplyFilters() {
        this.setFilters(this.filterParams);
    }
}
</script>

<style lang="sass">
.filter-tab
    display: flex
    flex-direction: column

    margin: 0 2rem
    gap: 2rem

    .filter-tab-content
        display: flex
        flex-direction: column
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
