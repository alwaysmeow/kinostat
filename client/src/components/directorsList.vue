<template>
    <div class="votes-list">
        <h4>Режиссеры</h4>
        <div class="votes-list-toolbar">
            <v-text-field
                class="votes-list-toolbar-input"
                clearable
                prepend-inner-icon="$search"
                v-model="searchLine"
                variant="outlined"
                hide-details
            ></v-text-field>
            <v-select
                class="votes-list-toolbar-input"
                v-model="selectedSortType"
                :items="sortTypeList"
                item-title="title"
                item-value="index"
                prepend-inner-icon="$sort"
                variant="outlined"
                hide-details
            ></v-select>
        </div>
        <div class="vote-items">
            <div v-for="director in directors">{{ director }}</div>
        </div>
    </div>
</template>

<script lang="ts">
import { mixins } from "vue-class-component";
import StoreMixin from "../mixins/store.mixin";

import { SortOrder } from "../types/types";
import type { Vote, SortType } from "../types/types";

export default class VoteItemComponent extends mixins(StoreMixin) {
    searchLine: string = "";

    sortTypes: SortType[] = [
        {
            order: SortOrder.Descending,
            attribute: "name",
            title: "По алфавиту",
        },
    ];

    selectedSortType: number = 0;

    get sortTypeList() {
        return this.sortTypes.map((item, index) => ({ ...item, index }));
    }

    get sortType(): SortType {
        return this.sortTypes[this.selectedSortType];
    }

    get filterString(): string {
        return (this.searchLine || "").trim().toLocaleLowerCase();
    }

    get sortedVotes(): Vote[] {
        const compareFunction = (a: Vote, b: Vote): number => {
            const aValue = a[this.sortType.attribute];
            const bValue = b[this.sortType.attribute];

            if (aValue < bValue) {
                return this.sortType.order === SortOrder.Ascending ? -1 : 1;
            }
            if (aValue > bValue) {
                return this.sortType.order === SortOrder.Ascending ? 1 : -1;
            }
            return 0;
        };

        return [...this.votes].sort(compareFunction);
    }

    get votesList(): Vote[] {
        const filterFunction = (vote: Vote): boolean => {
            const title: string = vote.title.toLocaleLowerCase();
            const titleWords: string[] = title.split(/[ ,.:]+/);
            return (
                titleWords.some((word) => word.startsWith(this.filterString)) ||
                title.startsWith(this.filterString) ||
                vote.year.toString() === this.filterString
            );
        };

        return [...this.sortedVotes].filter(filterFunction);
    }

    created() {
        const directors = {};
        this.films.forEach((film) =>
            film.directors.forEach((director) => {
                const key = director.id.toString();
                if (directors[key]) {
                    directors[key].films.push(film.displayTitle);
                } else {
                    directors[key] = {
                        name: director.name,
                        films: [film.displayTitle],
                    };
                }
            })
        );
        console.log(directors);
    }
}
</script>

<style lang="sass">
.votes-list
    display: flex
    flex-direction: column
    gap: 1rem

.vote-items
    display: flex
    flex-direction: column
    gap: 1rem

.votes-list-toolbar
    display: flex
    gap: 1rem

.votes-list-toolbar-input
    width: 50%
</style>
