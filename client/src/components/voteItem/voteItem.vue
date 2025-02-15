<template>
    <div :class="['vote-item', cssValueClass]" @mouseover="onMouseOver">
        <div class="vote-film-info">
            <div class="vote-film-name">{{ vote.title }}</div>
            <div class="vote-film-year dark-text">{{ vote.year }}</div>
        </div>
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
    gap: 2rem

    padding: 2rem

    border: 1px solid grey
    border-radius: 5px

    transition: 0.5s

    user-select: none

    &:hover
        .vote-value-circle
            background-color: var(--value-color)
        
        .vote-film-info
            transform: translateY(0)

            .vote-film-year
                opacity: 100%


.vote-film-info
    display: flex
    flex-direction: column
    justify-items: left
    text-align: left

    transform: translateY(25%)
    transition: 0.5s

    text-wrap: pretty

    .vote-film-year
        opacity: 0%
        transition: 0.5s

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
