<template>
    <div>
        {{ vote.alt }}: {{ vote.value }}
    </div>
</template>

<script lang="ts">
export default {
    props: {
        vote: { type: Object, default: 0 },
    },
};
</script>
