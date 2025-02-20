<template>
    <h4>Статистика пользователя {{ $props.userId }}</h4>
    <div class="page-body">
        <tabs-menu
            class="tabs-menu"
            v-model="selectedTabIndex"
            :tabs-titles="tabsTitles"
        ></tabs-menu>

        <div class="tab-content">
            <votes-list v-if="isTab(tabIndex.votes)" />
            <directors-list v-if="isTab(tabIndex.directors)" />
        </div>
    </div>
</template>

<script lang="ts">
import { Options, mixins } from "vue-class-component";
import StoreMixin from "../mixins/store.mixin";
import QueryMixin, { QueryObjectType } from "../mixins/query.mixin";
import type { Vote } from "../types/types";

type PropsType = {
    userId: number;
};

@Options({
    props: {
        userId: { type: Number, required: true },
    },
})
export default class StatisticPageComponent extends mixins(
    StoreMixin,
    QueryMixin
) {
    declare $props: PropsType;

    selectedTabIndex: number = 0;
    tabsTitles: string[] = ['Оценки', 'Режиссеры', 'Актеры'];
    tabIndex: Record<string, number> = {
        votes: 0,
        directors: 1,
        actors: 2,
    };

    async created() {
        const votes: Vote[] = await this.getVotes(this.$props.userId);
        this.setVotes(votes);
        await this.getFilms(votes);
    }

    isTab(tab: number): boolean {
        return tab === this.selectedTabIndex;
    }

    async getFilms(votes: Vote[]) {
        const timeout = 10;

        for (var i = votes.length - 1; i >= 0; i--) {
            const vote: Vote = votes[i];

            const filmData = await this.getObjectQuery(
                QueryObjectType.Film,
                vote.filmId
            );
            if (filmData) {
                this.addFilm(filmData);
            }

            await new Promise((resolve) => setTimeout(resolve, timeout));
        }
    }
}
</script>

<style lang="sass">
.page-body
    display: flex
    gap: 5vw

.tabs-menu
    position: sticky
    top: 5vh

    height: 80vh
    width: 15vw

.tab-content
    margin-right: 20vw
    width: 50vw
</style>
