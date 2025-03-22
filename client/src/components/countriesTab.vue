<template>
    <div class="countries-tab">
        {{ countries }}
    </div>
</template>

<script lang="ts">
import { mixins } from "vue-class-component";
import StoreMixin from "../mixins/store.mixin";

export default class CountriesTabComponent extends mixins(StoreMixin) {}
</script>

<style lang="sass">
</style>