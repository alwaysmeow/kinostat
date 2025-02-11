<template>
    <div>
        {{ name }}
    </div>
    <div>
        {{ vote }}
    </div>
</template>

<script lang="ts">
export default {
    props: {
        name: { type: String, default: "" },
        vote: { type: Number, default: 0 },
    },
};
</script>
