<template>
    <div class="vote-item" @mouseover="onMouseOver">
        <div>{{ vote.title }}</div>
        <div class="vote-value-circle">{{ vote.value }}</div>
    </div>
</template>

<script lang="ts">
export default {
    props: {
        vote: { type: Object, default: 0 },
    },
    methods: {
        onMouseOver() {
            
        }
    }
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

    &:hover
        .vote-value-circle
            background-color: grey
            text-color: black

.vote-value-circle
    height: 2rem
    width: 2rem

    display: flex
    align-items: center
    justify-content: center

    border: 1px solid grey
    border-radius: 100%

    transition: 0.5s
</style>