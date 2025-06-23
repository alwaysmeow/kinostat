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
})
export default class VoteItemComponent extends mixins(StoreMixin) {
    declare $props: PropsType;

    years: Array<number> = [];
    indexRange: Array<number> = [];

    created() {
        this.years = Array.from(
            new Set(this.votes?.map((vote) => vote.year))
        ).sort();
    }

    get range() {
        if (
            this.years[this.indexRange[0]] !== this.$props.modelValue[0] &&
            this.years[this.indexRange[1]] !== this.$props.modelValue[1]
        ) {
            const [min, max] = this.$props.modelValue;

            this.indexRange = [
                this.years.findIndex((y) => y === min) || 0,
                this.years.findIndex((y) => y === max) || this.years.length - 1,
            ];
        }

        return this.$props.modelValue;
    }

    set range(value) {
        this.$emit("update:modelValue", value);
    }

    onRangeInput() {
        this.range = this.indexRange.map((index) => this.years[index]);
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
