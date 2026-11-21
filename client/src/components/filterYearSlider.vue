<template>
    <div>
        <div class="filter-label">
            <div class="filter-label-name">{{ $props.label }}</div>
            <div class="filter-label-value">
                {{ `${range[0]} - ${range[1]}` }}
            </div>
        </div>
        <v-range-slider
            class="filter-slider"
            v-model="indexRange"
            :min="0"
            :max="years.length - 1"
            :step="1"
            @update:modelValue="onRangeInput"
            hide-details
        />
    </div>
</template>

<script lang="ts">
import { mixins, Options } from "vue-class-component";
import StoreMixin from "../mixins/store.mixin";

type PropsType = {
    modelValue: number[];
    label: string;
};

@Options({
    props: {
        modelValue: { type: Array<Number>, default: [] },
        label: { type: String, default: "" },
    },
    emits: ["update:modelValue"],
    watch: {
        modelValue: {
            handler: "syncIndexRange",
            deep: true,
        },
    },
})
export default class VoteItemComponent extends mixins(StoreMixin) {
    declare $props: PropsType;

    years: Array<number> = [];
    indexRange: Array<number> = [];

    created() {
        this.years = Array.from(
            new Set(this.votes?.map((vote) => vote.year))
        )
            .filter((year) => Number.isFinite(year))
            .sort((a, b) => a - b);
        this.syncIndexRange();
    }

    get range() {
        return this.$props.modelValue;
    }

    set range(value) {
        this.$emit("update:modelValue", value);
    }

    syncIndexRange() {
        if (!this.years.length) {
            this.indexRange = [0, 0];
            return;
        }
        const [rawMin, rawMax] = this.$props.modelValue;
        const min = Number.isFinite(rawMin) ? rawMin : this.years[0];
        const max = Number.isFinite(rawMax) ? rawMax : this.years[this.years.length - 1];
        const minIndex = this.years.findIndex((year) => year >= min);
        let maxIndex = -1;
        for (let index = this.years.length - 1; index >= 0; index -= 1) {
            if (this.years[index] <= max) {
                maxIndex = index;
                break;
            }
        }
        this.indexRange = [
            minIndex === -1 ? 0 : minIndex,
            maxIndex === -1 ? this.years.length - 1 : maxIndex,
        ];
    }

    onRangeInput(value: number[]) {
        if (!this.years.length) return;
        const lastIndex = this.years.length - 1;
        const indices = value.map((rawIndex) =>
            Math.max(0, Math.min(lastIndex, Math.round(Number(rawIndex))))
        );
        const years = indices.map((index) => this.years[index]);
        if (years.every((year) => Number.isFinite(year))) this.range = years;
    }
}
</script>

<style lang="sass">
.filter-label
    display: flex
    justify-content: space-between
    margin: 0 8px
    font-weight: bold
    font-size: small

    .filter-label-name
        color: var(--secondary-text-color)
</style>
