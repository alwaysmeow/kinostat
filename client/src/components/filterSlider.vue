<template>
    <div>
        <div class="filter-label">
            <div class="filter-label-name">{{ $props.label }}</div>
            <div class="filter-label-value">
                {{
                    `${$props.modelValue[0]} - ${$props.modelValue[1]}`
                }}
            </div>
        </div>
        <v-range-slider
            class="filter-slider"
            v-model="range"
            :min="$props.min"
            :max="$props.max"
            :step="$props.step"
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
    min: number;
    max: number;
    step: number;
};

@Options({
    props: {
        modelValue: { type: Array<Number>, default: [] },
        label: { type: String, default: '' },
        min: { type: Number, default: 1 },
        max: { type: Number, default: 10 },
        step: { type: Number, default: 1 },
    },
    emits: ["update:modelValue"],
})
export default class VoteItemComponent extends mixins(StoreMixin) {
    declare $props: PropsType;

    get range() {
        return this.$props.modelValue;
    }

    set range(value) {
        console.log(value);
        this.$emit('update:modelValue', value);
    }
}
</script>

<style lang="sass">
.filter-label
    display: flex
    justify-content: space-between
    margin: 0 8px
    font-weight: bold

    .filter-label-name
        color: var(--secondary-text-color)
</style>
