<template>
    <div class="tabs-menu">
        <div class="tabs-list">
            <h3
                :class="['tab-button', cssStatusTabClass(index)]"
                v-for="(title, index) in $props.tabsTitles"
                :tabIndex="index"
                @click="onTabSelect"
            >
                {{ title }}
            </h3>
        </div>
    </div>
</template>

<script lang="ts">
import { Options, Vue } from "vue-class-component";

type PropsType = {
    tabsTitles: string[];
    modelValue: number;
};

@Options({
    props: {
        tabsTitles: { type: Array<String>, default: [] },
        modelValue: { type: Number, default: 0 },
    },
    emits: ["update:modelValue"],
})
export default class StatisticPageComponent extends Vue {
    declare $props: PropsType;

    cssStatusTabClass(index: number): string {
        return index === this.$props.modelValue ? 'active' : 'inactive';
    }

    onTabSelect(event: Event) {
        const element = event.target as HTMLInputElement;
        const tabIndex = element.getAttribute("tabIndex");

        if (tabIndex !== null) {
            this.$emit("update:modelValue", Number(tabIndex));
        }
    }
}
</script>

<style lang="sass">
.tabs-list
    display: flex
    flex-direction: row
    justify-content: center
    gap: 0.25rem
    padding: 0

.tab-button
    user-select: none
    cursor: pointer

    margin: 0
    padding: 1.45rem 0.8rem 1.25rem
    white-space: nowrap
    text-align: center
    border-bottom: 2px solid transparent
    transition: color 0.2s, border-color 0.2s

    color: var(--secondary-text-color)

    &.inactive:hover
        color: var(--kinopoisk-color)
    
    &.active
        color: var(--main-text-color)
        border-bottom-color: var(--kinopoisk-color)

@media (max-width: 720px)
    .tabs-list
        justify-content: flex-start
        overflow-x: auto
        border-bottom: 1px solid var(--main-text-color)

    .tab-button
        margin: 0
        white-space: nowrap
        padding-inline: 0.8rem
</style>
