<template>
    <div class="tabs-menu">
        <div class="tabs-list">
            <div
                :class="['tab-button', cssStatusTabClass(index)]"
                v-for="(title, index) in $props.tabsTitles"
                :tabIndex="index"
                @click="onTabSelect"
            >
                {{ title }}
            </div>
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
    flex-direction: column

    gap: 0.2rem
    padding: 1rem 0rem

    border-right: 1px solid var(--main-text-color)

.tab-button
    user-select: none
    cursor: pointer

    padding: 0.4rem 1rem

    text-align: right

    border: 1px solid var(--regular-tab-color)
    border-right: none
    border-radius: 5px 0px 0px 5px

    transition: 0.5s

    &.inactive:hover
        background-color: var(--highlighted-tab-color)
    
    &.active
        background-color: var(--active-tab-color)
</style>
