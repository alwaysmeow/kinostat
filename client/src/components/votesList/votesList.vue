<template>
    <div class="votes-list">
        <h4>Оценки</h4>
        <div class="vote-items">
            <vote-item v-for="vote in votes" :vote="vote"/>
        </div>
    </div>
</template>

<script lang="ts">
export default {
    props: {
        votes: { type: Array, default: [] },
    },
};
</script>

<style lang="sass">
.vote-items
    display: flex
    flex-direction: column
    gap: 1rem
</style>