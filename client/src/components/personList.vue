<template>
    <div class="persons-list">
        <toolbar v-model="toolbarSettings" :sort-types="sortTypes"></toolbar>
        <div class="person-items">
            <person-item
                v-for="person in personList"
                :id="person.id"
                :list="$props.list"
                :key="person.id"
            ></person-item>
        </div>
    </div>
</template>

<script lang="ts">
import { Options, mixins } from "vue-class-component";
import StoreMixin from "../mixins/store.mixin";

import { SortOrder } from "../types/types";
import type { Person, SortType, iToolbar } from "../types/types";

type PropsType = {
    list: "directors" | "actors";
};

@Options({
    props: {
        list: { type: String, required: true },
    },
})
export default class DirectorsListComponent extends mixins(StoreMixin) {
    declare $props: PropsType;

    toolbarSettings: iToolbar = {
        searchLine: "",
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

    get persons(): Person[] {
        return this[this.$props.list];
    }

    get sortedPersons(): Person[] {
        const compare = this.toolbarSettings.compareFunction;
        if (compare) {
            return [...this.persons].sort(compare);
        }
        return this.persons;
    }

    get personList(): Person[] {
        const searchLine = this.toolbarSettings.searchLine;
        if (searchLine) {
            const filterFunction = (person: Person): boolean => {
                const fullname: string = person.name.toLocaleLowerCase();
                const names: string[] = fullname.split(/[ ,.:]+/);
                return (
                    names.some((word) => word.startsWith(searchLine)) ||
                    fullname.startsWith(searchLine)
                );
            };

            return [...this.sortedPersons].filter(filterFunction);
        }

        return this.sortedPersons;
    }
}
</script>

<style lang="sass">
.persons-list
    display: flex
    flex-direction: column
    gap: 1rem

.person-items
    display: grid
    grid-template-columns: repeat(4, 1fr)
    gap: 1rem
</style>
