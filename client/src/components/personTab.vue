<template>
    {{ person }}
</template>

<script lang="ts">
import { mixins } from "vue-class-component";
import StoreMixin from "../mixins/store.mixin";
import { InfoTabStatus } from "../common/types";

export default class FilterTabComponent extends mixins(StoreMixin) {
    get person() {
        const personId = this.selectedPersonId;
        switch (this.infoTabStatus) {
            case InfoTabStatus.Actor:
                return this.actors.find(actor => actor.id === personId);
            case InfoTabStatus.Director:
                return this.directors.find(director => director.id === personId);
        }
        return {};
    }
}
</script>

<style lang="sass">
</style>
