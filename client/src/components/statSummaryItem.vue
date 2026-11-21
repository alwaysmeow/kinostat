<template>
    <div
        :class="['stat-summary-item', { 'stat-summary-item-link': clickable }]"
        @click="onClick"
    >
        <template v-if="items.length">
            <span class="stat-summary-label">{{ heading }}</span>
            <ol class="stat-summary-ranking">
                <li
                    v-for="item in items"
                    :key="item.key"
                    :class="{ 'stat-summary-ranking-link': item.clickable !== false }"
                    @click.stop="onItemClick(item)"
                >
                    <strong>{{ item.title }}</strong>
                    <span>{{ item.meta }}</span>
                </li>
            </ol>
        </template>
        <template v-else>
            <strong class="stat-summary-value">{{ value }}</strong>
            <span class="stat-summary-label">{{ label }}</span>
        </template>
    </div>
</template>

<script lang="ts">
import { Options, Vue } from "vue-class-component";

export interface StatSummaryEntry {
    key: string | number;
    title: string;
    meta: string;
    payload?: unknown;
    clickable?: boolean;
}

type PropsType = {
    value: string | number;
    label: string;
    heading: string;
    items: StatSummaryEntry[];
    clickable: boolean;
};

@Options({
    props: {
        value: { type: [String, Number], default: "" },
        label: { type: String, default: "" },
        heading: { type: String, default: "" },
        items: { type: Array, default: () => [] },
        clickable: { type: Boolean, default: false },
    },
    emits: ["click", "item-click"],
})
export default class StatSummaryItemComponent extends Vue {
    declare $props: PropsType;

    get items() {
        return this.$props.items;
    }

    get clickable() {
        return this.$props.clickable;
    }

    get value() {
        return this.$props.value;
    }

    get label() {
        return this.$props.label;
    }

    get heading() {
        return this.$props.heading;
    }

    onClick() {
        if (this.clickable) this.$emit("click");
    }

    onItemClick(item: StatSummaryEntry) {
        if (item.clickable !== false) this.$emit("item-click", item.payload);
    }
}
</script>

<style lang="sass">
.stat-summary-item
    display: flex
    flex-direction: column
    justify-content: center
    min-height: 6rem
    padding: 1.25rem 1.5rem
    border-radius: 1.25rem
    background: var(--neutral-shade-one)

    &.stat-summary-item-link
        cursor: pointer

        &:hover .stat-summary-value
            color: var(--kinopoisk-color)

.stat-summary-value
    font-size: 1.35rem
    font-weight: 700

.stat-summary-label
    color: var(--secondary-text-color)
    font-size: 0.9rem

.stat-summary-ranking
    display: flex
    flex-direction: column
    gap: 0.35rem
    margin: 0.65rem 0 0
    padding: 0
    list-style: none
    counter-reset: ranking

    li
        display: grid
        grid-template-columns: auto minmax(0, 1fr) auto
        align-items: baseline
        gap: 0.5rem
        counter-increment: ranking

        &::before
            content: counter(ranking)
            color: var(--secondary-text-color)
            font-size: 0.75rem

        &.stat-summary-ranking-link
            cursor: pointer

            &:hover strong
                color: var(--kinopoisk-color)

        strong
            overflow: hidden
            font-size: 0.95rem
            text-overflow: ellipsis
            white-space: nowrap

        span
            color: var(--secondary-text-color)
            font-size: 0.8rem
            white-space: nowrap
</style>
