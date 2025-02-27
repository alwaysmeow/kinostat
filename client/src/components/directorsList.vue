<template>
    <div class="directors-list">
        <h4>Режиссеры</h4>
        <toolbar
            v-model="toolbarSettings"
            :sort-types="sortTypes"
        ></toolbar>
        <div class="director-items">
            <director-item v-for="director in directorsList" :id="director.id" :key="director.id"></director-item>
        </div>
    </div>
</template>

<script lang="ts">
import { mixins } from "vue-class-component";
import StoreMixin from "../mixins/store.mixin";

import { SortOrder } from "../types/types";
import type { Person, SortType, iToolbar } from "../types/types";

export default class DirectorsListComponent extends mixins(StoreMixin) {
    toolbarSettings: iToolbar = {
        searchLine: '',
    };

    sortTypes: SortType[] = [
        {
            order: SortOrder.Descending,
            attribute: "name",
            title: "По алфавиту",
            type: "string",
        },
        {
            order: SortOrder.Descending,
            attribute: "averageVote",
            title: "С лучших",
            type: "number",
        },
        {
            order: SortOrder.Ascending,
            attribute: "averageVote",
            title: "С худших",
            type: "number",
        },
    ];

    get sortedDirectors(): Person[] {
        const compare = this.toolbarSettings.compareFunction
        if (compare) {
            return [...this.directors].sort(compare);
        }
        return this.directors;
    }

    get directorsList(): Person[] {
        const searchLine = this.toolbarSettings.searchLine;
        if (searchLine) {
            const filterFunction = (director: Person): boolean => {
                const fullname: string = director.name.toLocaleLowerCase();
                const names: string[] = fullname.split(/[ ,.:]+/);
                return (
                    names.some((word) => word.startsWith(searchLine)) ||
                    fullname.startsWith(searchLine)
                );
            };

            return [...this.sortedDirectors].filter(filterFunction);
        }

        return this.sortedDirectors;
    }
}
</script>

<style lang="sass">
.directors-list
    display: flex
    flex-direction: column
    gap: 1rem

.director-items
    display: grid
    grid-template-columns: repeat(4, 1fr)
    gap: 1rem

.directors-list-toolbar
    display: flex
    gap: 1rem

.directors-list-toolbar-input
    width: 50%
</style>
