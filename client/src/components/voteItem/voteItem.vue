<template>
    <div :class="['vote-item', cssValueClass]" @mouseover="onMouseOver">
        <div>{{ vote.title }}</div>
        <div class="vote-value-circle">{{ vote.value }}</div>
    </div>
</template>

<script lang="ts">
export default {
    props: {
        vote: { type: Object, default: 0 },
    },
    computed: {
        cssValueClass() {
            return `vote-value-${this.vote.value}`;
        },
    },
    methods: {
        onMouseOver() {},
    },
};
</script>

<style lang="sass">
.vote-item
    display: flex
    align-items: center
    justify-content: space-between

    padding: 1rem

    border: 1px solid grey
    border-radius: 5px

    transition: 0.5s

    user-select: none

    &:hover
        .vote-value-circle
            background-color: var(--value-color)
        

.vote-value-circle
    height: 2rem
    width: 2rem

    display: flex
    align-items: center
    justify-content: center

    border: 1px solid var(--value-color)
    border-radius: 100%

    transition: 0.5s
</style>
