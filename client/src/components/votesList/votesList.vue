<template>
    <h4>Оценки пользователя {{ userId }}</h4>
</template>

<script lang="ts">
export default {
    props: {
        userId: { type: Number, required: true },
    },
    async created() {
        const votes = await fetch(`/api/votes?user_id=${this.userId}`);
        console.log(votes);
    }
};
</script>
