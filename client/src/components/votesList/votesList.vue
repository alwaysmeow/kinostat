<template>
    <h4>Оценки пользователя {{ userId }}</h4>
</template>

<script lang="ts">
export default {
    props: {
        userId: { type: Number, required: true },
    },
    created() {
        console.log('votes');
    }
};
</script>
