<template>
    <div class="directors-list">
        <h4>Режиссеры</h4>
        <div class="directors-list-toolbar">
            <v-text-field
                class="directors-list-toolbar-input"
                clearable
                prepend-inner-icon="$search"
                v-model="searchLine"
                variant="outlined"
                hide-details
            ></v-text-field>
            <v-select
                class="directors-list-toolbar-input"
                v-model="selectedSortType"
                :items="sortTypeList"
                item-title="title"
                item-value="index"
                prepend-inner-icon="$sort"
                variant="outlined"
                hide-details
            ></v-select>
        </div>
        <div class="director-items">
            <director-item v-for="director in directorsList" :id="director.id" :key="director.id"></director-item>
        </div>
    </div>
</template>

<script lang="ts">
import { mixins } from "vue-class-component";
import StoreMixin from "../mixins/store.mixin";

import { SortOrder } from "../types/types";
import type { Person, SortType } from "../types/types";

export default class DirectorsListComponent extends mixins(StoreMixin) {
    searchLine: string = "";

    sortTypes: SortType[] = [
        {
            order: SortOrder.Descending,
            attribute: "name",
            title: "По алфавиту",
        },
        {
            order: SortOrder.Descending,
            attribute: "averageVote",
            title: "С лучших",
        },
        {
            order: SortOrder.Ascending,
            attribute: "averageVote",
            title: "С лучших",
        },
    ];

    selectedSortType: number = 0;

    get sortType(): SortType {
        return this.sortTypes[this.selectedSortType];
    }

    get sortTypeList() {
        return this.sortTypes.map((item, index) => ({ ...item, index }));
    }

    get filterString(): string {
        return (this.searchLine || "").trim().toLocaleLowerCase();
    }

    get sortedDirectors(): Person[] {
        let compareFunction;
        if (this.sortType.attribute === 'name') {
            compareFunction = (a: Person, b: Person) => a.name.localeCompare(b.name, 'ru');
        } else {
            compareFunction = (a: Person, b: Person) => {
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
        }

        return [...this.directors].sort(compareFunction);
    }

    get directorsList(): Person[] {
        const filterFunction = (director: Person): boolean => {
            const fullname: string = director.name.toLocaleLowerCase();
            const names: string[] = fullname.split(/[ ,.:]+/);
            return (
                names.some((word) => word.startsWith(this.filterString)) ||
                fullname.startsWith(this.filterString)
            );
        };

        return [...this.sortedDirectors].filter(filterFunction);
    }
}
</script>

<style lang="sass">
.directors-list
    display: flex
    flex-direction: column
    gap: 1rem

.director-items
    display: flex
    flex-direction: column
    gap: 1rem

.directors-list-toolbar
    display: flex
    gap: 1rem

.directors-list-toolbar-input
    width: 50%
</style>
