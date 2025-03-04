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
                :min="earliestFilmYear"
                :max="currentYear"
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

            <!-- Commented due to Issue #1
            <filter-slider
                v-model="filterParams.directorBirthYearRange"
                label="Год рождения"
                :min="minDirectorsBirthYears"
                :max="maxDirectorsBirthYears"
                :step="1"
            ></filter-slider> -->
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

            <!-- Commented due to Issue #1
            <filter-slider
                v-model="filterParams.actorBirthYearRange"
                label="Год рождения"
                :min="minActorsBirthYears"
                :max="maxActorsBirthYears"
                :step="1"
            ></filter-slider> -->
        </div>

        <div class="filter-buttons-block">
            <v-btn
                class="filter-button"
                elevation="0"
                @click="handleApplyFilters"
                >Применить</v-btn
            >
            <v-btn
                class="filter-button"
                elevation="0"
                @click="handleRollbackFilters"
                >Откатить изменения</v-btn
            >
            <v-btn
                class="filter-button"
                elevation="0"
                @click="handleResetFilters"
                >Сбросить</v-btn
            >
        </div>
    </div>
</template>

<script lang="ts">
import { mixins, Options } from "vue-class-component";
import StoreMixin from "../mixins/store.mixin";
import { TabIndex, type iFilters } from "../common/types";
import {
    startupFilters,
    AUGUSTE_LUMIERE_BIRTH_YEAR,
    CURRENT_YEAR,
    THE_ARRIVAL_OF_THE_TRAIN_YEAR,
    DEFAULT_MAX_ACTOR_FILMS,
    DEFAULT_MAX_DIRECTOR_FILMS,
} from "../common/const";

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

    earliestFilmYear: number = THE_ARRIVAL_OF_THE_TRAIN_YEAR;
    currentYear: number = CURRENT_YEAR;

    minActorsBirthYears: number = AUGUSTE_LUMIERE_BIRTH_YEAR;
    maxActorsBirthYears: number = CURRENT_YEAR;

    minDirectorsBirthYears: number = AUGUSTE_LUMIERE_BIRTH_YEAR;
    maxDirectorsBirthYears: number = CURRENT_YEAR;

    maxActorsFilms: number = DEFAULT_MAX_ACTOR_FILMS;
    maxDirectorFilms: number = DEFAULT_MAX_DIRECTOR_FILMS;

    filterParams: iFilters = startupFilters();

    TabIndex = TabIndex;

    created() {
        this.fetchFilters(this.filterParams);

        const {
            earliestFilmYear,
            actorsBirthYears,
            directorsBirthYears,
            maxActorsFilms,
            maxDirectorFilms,
        } = this.getFilterRanges();

        this.earliestFilmYear = earliestFilmYear;
        [this.minActorsBirthYears, this.maxActorsBirthYears] = actorsBirthYears;
        [this.minDirectorsBirthYears, this.maxDirectorsBirthYears] =
            directorsBirthYears;
        this.maxActorsFilms = maxActorsFilms;
        this.maxDirectorFilms = maxDirectorFilms;
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

    handleApplyFilters() {
        this.setFilters(this.filterParams);
    }

    handleRollbackFilters() {
        this.fetchFilters(this.filterParams);
    }

    handleResetFilters() {
        this.setDefaultFilters();
        this.fetchFilters(this.filterParams);
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
        flex-direction: column
        gap: 1rem

        .filter-button
            background-color: var(--neutral-shade-one)
            border-radius: 1em
            font-weight: bold
</style>
