<template>
    <h4>Статистика пользователя {{ $props.userId }}</h4>
    <votes-list :votes="votes"/>
</template>

<script lang="ts">
import { Options, mixins } from "vue-class-component";
import StoreMixin from "../../mixins/store.mixin";
import QueryMixin from "../../mixins/query.mixin";

type PropsType = {
    userId: number;
};

@Options({
    props: {
        userId: { type: Number, required: true },
    },
})
export default class StatisticPageComponent extends mixins(StoreMixin, QueryMixin) {
    declare $props: PropsType;

    async created() {
        const votes = await this.getVotes(this.$props.userId);
        this.setVotes(votes);
    }
}

</script>