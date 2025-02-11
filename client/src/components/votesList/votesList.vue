<template>
    <h4>Оценки</h4>
    <vote-item v-for="vote in votes" :vote="vote"/>
</template>

<script lang="ts">
export default {
    props: {
        votes: { type: Array, default: [] },
    },
};
</script>
