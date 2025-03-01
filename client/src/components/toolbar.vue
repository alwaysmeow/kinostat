<template>
    <div class="toolbar">
        <v-text-field
            class="toolbar-input"
            clearable
            prepend-inner-icon="$search"
            v-model="$props.modelValue.searchLine"
            variant="outlined"
            density="comfortable"
            hide-details
        ></v-text-field>
        <v-select
            class="toolbar-input"
            v-model="selectedSortType"
            :items="sortTypeList"
            item-title="title"
            item-value="index"
            prepend-inner-icon="$sort"
            variant="outlined"
            density="comfortable"
            hide-details
            @update:modelValue="setCompareFunction"
        ></v-select>
        <v-btn
            :class="['toolbar-input', 'toolbar-btn', cssActiveFilterTabClass]"
            icon="$filter"
            variant="flat"
            density="comfortable"
            hide-details
            @click="handleFilter"
        ></v-btn>
    </div>
</template>

<script lang="ts">
import { Options, mixins } from "vue-class-component";
import StoreMixin from "../mixins/store.mixin";

import { SortOrder, TabStatus } from "../types/types";
import type { SortType, iToolbar } from "../types/types";

type PropsType = {
    modelValue: iToolbar;
    sortTypes: SortType[];
    type: string;
};

@Options({
    props: {
        modelValue: { type: Object, required: true },
        sortTypes: { type: Array<SortType>, default: [] },
        type: { type: String, default: "default" },
    },
    emits: ["update:modelValue"],
})
export default class ToolbarComponent extends mixins(StoreMixin) {
    declare $props: PropsType;

    searchLine: string = "";

    selectedSortType: number = 0;

    get sortTypeList() {
        return this.$props.sortTypes.map((item, index) => ({ ...item, index }));
    }

    get cssActiveFilterTabClass() {
        if (this.tabStatus === TabStatus.Filter) {
            return "toolbar-filter-active";
        }
        return "";
    }

    created() {
        this.setCompareFunction(this.selectedSortType);
    }

    setCompareFunction(value: number) {
        const sortType = this.$props.sortTypes[value];

        const compare = (a: number, b: number) => {
            if (a < b) {
                return sortType.order === SortOrder.Ascending ? -1 : 1;
            }
            if (a > b) {
                return sortType.order === SortOrder.Ascending ? 1 : -1;
            }
            return 0;
        };

        switch (sortType.type) {
            case "string":
                const attr = sortType.attribute;
                this.$props.modelValue.compareFunction = (a: any, b: any) =>
                    a[attr].localeCompare(b[attr], "ru");
                break;
            case "length":
                this.$props.modelValue.compareFunction = (a: any, b: any) =>
                    compare(
                        a[sortType.attribute].length,
                        b[sortType.attribute].length
                    );
                break;
            default:
                this.$props.modelValue.compareFunction = (a: any, b: any) =>
                    compare(a[sortType.attribute], b[sortType.attribute]);
        }
    }

    handleFilter() {
        this.setTabStatus(
            this.tabStatus === TabStatus.Filter
                ? TabStatus.None
                : TabStatus.Filter
        );
    }
}
</script>

<style lang="sass">
.toolbar
    display: flex
    gap: 1rem

.toolbar-input
    width: 30%
    height: 100%
    background-color: var(--neutral-shade-one)
    border-radius: 1em

    .v-field__outline
        display: none

    svg
        fill: var(--main-text-color)

button.v-btn.toolbar-btn
    position: relative
    top: 0
    bottom: 0
    height: auto
    padding: 0 1.5em

    &.toolbar-filter-active
        background-color: var(--main-text-color)

        svg
            fill: var(--neutral-shade-one)
</style>
