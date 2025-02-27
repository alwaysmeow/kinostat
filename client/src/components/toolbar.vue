<template>
    <div class="toolbar">
        <v-text-field
            class="toolbar-input"
            clearable
            prepend-inner-icon="$search"
            v-model="$props.modelValue.searchLine"
            variant="outlined"
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
            hide-details
            @update:modelValue="setCompareFunction"
        ></v-select>
    </div>
</template>

<script lang="ts">
import { Options, mixins } from "vue-class-component";
import StoreMixin from "../mixins/store.mixin";

import { SortOrder } from "../types/types";
import type { SortType, iToolbar } from "../types/types";

type PropsType = {
    modelValue: iToolbar;
    sortTypes: SortType[],
    type: string,
};

@Options({
    props: {
        modelValue: { type: Object, required: true },
        sortTypes: { type: Array<SortType>, default: [] },
        type: { type: String, default: 'default' },
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

    created() {
        this.setCompareFunction(this.selectedSortType);
    }

    setCompareFunction(value: number) {
        const sortType = this.$props.sortTypes[value];
        if (sortType.type === 'string') {
            const attr = sortType.attribute;
            this.$props.modelValue.compareFunction = (a: any, b: any) => a[attr].localeCompare(b[attr], 'ru');
        } else {
            this.$props.modelValue.compareFunction = (a: any, b: any) => {
                const aValue = a[sortType.attribute];
                const bValue = b[sortType.attribute];

                if (aValue < bValue) {
                    return sortType.order === SortOrder.Ascending ? -1 : 1;
                }
                if (aValue > bValue) {
                    return sortType.order === SortOrder.Ascending ? 1 : -1;
                }
                return 0;
            };
        }
    }
}
</script>

<style lang="sass">
.toolbar
    display: flex
    gap: 1rem

.toolbar-input
    width: 50%
</style>
