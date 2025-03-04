<template>
    <div class="votes-list">
        <toolbar v-model="toolbarSettings" :sort-types="sortTypes"></toolbar>
        <div class="vote-items">
            <vote-item v-for="vote in searchFilteredVotes" :vote="vote" :key="vote.num" />
        </div>
    </div>
</template>

<script lang="ts">
import { mixins } from "vue-class-component";
import StoreMixin from "../mixins/store.mixin";

import { SortOrder } from "../common/types";
import type { Vote, SortType, iToolbar } from "../common/types";

export default class VotesListComponent extends mixins(StoreMixin) {
    toolbarSettings: iToolbar = {
        searchLine: "",
    };

    sortTypes: SortType[] = [
        {
            order: SortOrder.Descending,
            attribute: "num",
            title: "С последней",
            type: "number",
        },
        {
            order: SortOrder.Ascending,
            attribute: "num",
            title: "С самой старой",
            type: "number",
        },
        {
            order: SortOrder.Ascending,
            attribute: "title",
            title: "По алфавиту",
            type: "string",
        },
        {
            order: SortOrder.Descending,
            attribute: "value",
            title: "С лучших",
            type: "number",
        },
        {
            order: SortOrder.Ascending,
            attribute: "value",
            title: "С худших",
            type: "number",
        },
    ];

    get filteredVotes(): Vote[] {
        const filterFunction = (vote: Vote) => {
            return (
                vote.year >= this.filters.filmYearRange[0] &&
                vote.year <= this.filters.filmYearRange[1] &&
                this.filters.selectedVoteValues[vote.value - 1]
            )
        }
        return [...this.votes].filter(filterFunction);
    }   

    get sortedVotes(): Vote[] {
        const compare = this.toolbarSettings.compareFunction;
        if (compare) {
            return [...this.filteredVotes].sort(compare);
        }
        return this.filteredVotes;
    }

    get searchFilteredVotes(): Vote[] {
        const searchLine = this.toolbarSettings.searchLine;
        if (searchLine) {
            const filterFunction = (vote: Vote): boolean => {
                const title: string = vote.title.toLocaleLowerCase();
                const titleWords: string[] = title.split(/[ ,.:]+/);
                return (
                    titleWords.some((word) => word.startsWith(searchLine)) ||
                    title.startsWith(searchLine) ||
                    vote.year.toString() === searchLine
                );
            };

            return [...this.sortedVotes].filter(filterFunction);
        }

        return this.sortedVotes;
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
