<template>
    <div class="votes-list">
        <calendar-heatmap
            dark-mode
            :values="activityData"
            :end-date="calendarEndDate"
            :round="3"
        />
        <toolbar v-model="toolbarSettings" :sort-types="sortTypes"></toolbar>
        <div class="vote-items">
            <vote-item
                v-for="vote in searchFilteredVotes"
                :vote="vote"
                :key="vote.num"
            />
        </div>
    </div>
</template>

<script lang="ts">
import { mixins } from "vue-class-component";
import StoreMixin from "../mixins/store.mixin";

import { SortOrder } from "../common/types";
import type { Vote, SortType, iToolbar } from "../common/types";

type ActivityData = { date: string; count: number }[];

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

    get calendarEndDate(): Date {
        return new Date();
    }

    get activityData(): ActivityData {
        const data: ActivityData = [];
        this.votes.forEach((vote) => {
            const [rawDateString] = vote.time.split(' ');
            const [day, month, year] = rawDateString.split('.');
            const dateString: string = `20${year}-${month}-${day}`; // won't work in 2100

            const record = data.find((record) => record.date === dateString);

            if (record) {
                record.count++;
            } else {
                data.push({
                    date: dateString,
                    count: 1,
                });
            }
        });
        return data;
    }

    get filteredVotes(): Vote[] {
        const filterFunction = (vote: Vote) => {
            return (
                vote.year >= this.filters.filmYearRange[0] &&
                vote.year <= this.filters.filmYearRange[1] &&
                this.filters.selectedVoteValues[vote.value - 1]
            );
        };
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
