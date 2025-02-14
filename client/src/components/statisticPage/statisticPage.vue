<template>
    <h4>Статистика пользователя {{ $props.userId }}</h4>
    <votes-list :votes="votes"/>
</template>

<script lang="ts">
import { Options, mixins } from "vue-class-component";
import StoreMixin from "../../mixins/store.mixin";

interface Vote {
    alt: string,
    [key: string]: any;
}

type PropsType = {
    userId: number;
};

@Options({
    props: {
        userId: { type: Number, required: true },
    },
})
export default class StatisticPageComponent extends mixins(StoreMixin) {
    declare $props: PropsType;

    created() {
        this.getVotes();
    }

    async getVotes() {
        const response: Vote[] = await fetch(
            `/api/votes?user_id=${this.$props.userId}`
        ).then((response) => response.json());
        
        const votes: Vote[] = response.map((item) => {
            const [title, year] = item.alt
                .split("(")
                .map(str => str.slice(0, -1));
            return {
                title: title,
                year: year,
                ...item,
            };
        });

        this.setVotes(votes);
    }
}

</script>