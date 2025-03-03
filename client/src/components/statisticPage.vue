<template>
    <h4>Статистика пользователя {{ $props.userId }}</h4>
    <div class="page-body">
        <div class="page-right-space">
            <tabs-menu
                class="tabs-menu"
                v-model="selectedTabIndex"
                :tabs-titles="tabsTitles"
            ></tabs-menu>
        </div>

        <div class="tab-content">
            <votes-list v-if="isTab(TabIndex.Votes)" />
            <person-list list="directors" v-if="isTab(TabIndex.Directors)" />
            <person-list list="actors" v-if="isTab(TabIndex.Actors)" />
        </div>

        <div class="page-left-space">
            <div :class="['info-tab', cssInfoTabVisibleClass]">
                <filter-tab
                    :tab-index="selectedTabIndex"
                    v-if="isInfoTab(InfoTabStatus.Filter)"
                />
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { Options, mixins } from "vue-class-component";
import StoreMixin from "../mixins/store.mixin";
import QueryMixin from "../mixins/query.mixin";
import { type Vote, type Person, InfoTabStatus, TabIndex } from "../common/types";

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
    tabsTitles: string[] = ["Оценки", "Режиссеры", "Актеры"];

    TabIndex = TabIndex;
    InfoTabStatus = InfoTabStatus;

    get cssInfoTabVisibleClass() {
        if (this.infoTabStatus === InfoTabStatus.None) {
            return "";
        }
        return "visible";
    }

    async created() {
        const timeout = 10;
        const votes: Vote[] = await this.getVotes(this.$props.userId);
        this.setVotes(votes);
        await this.getFilms(timeout);

        // freezing
        this.getDirectors();
        this.getActors();

        // start votes setting
        this.setAverageVotes();
        await this.parsePersons();
        // votes updating
        this.setAverageVotes();
    }

    isTab(tab: TabIndex): boolean {
        return this.selectedTabIndex === tab;
    }

    isInfoTab(status: InfoTabStatus): boolean {
        return this.infoTabStatus === status;
    }

    async getFilms(timeout: number = 100) {
        for (var i = this.votes.length - 1; i >= 0; i--) {
            const vote: Vote = this.votes[i];

            const filmData = await this.getFilmQuery(vote.filmId);

            if (filmData) {
                this.addFilm(filmData);
            }

            await new Promise((resolve) => setTimeout(resolve, timeout));
        }
    }

    getDirectors() {
        this.films.forEach((film) =>
            film.directors.forEach((directorRecord: Person) => {
                const director = this.getDirector(directorRecord.id);

                if (director) {
                    director.films.push(film.id);
                } else {
                    this.addDirector({
                        id: directorRecord.id,
                        name: directorRecord.name,
                        films: [film.id],
                    });
                }
            })
        );
    }

    getActors() {
        this.films.forEach((film) =>
            film.actors.forEach((actorRecord: Person) => {
                const actor = this.getActor(actorRecord.id);

                if (actor) {
                    actor.films.push(film.id);
                } else if (actorRecord.name) {
                    this.addActor({
                        id: actorRecord.id,
                        name: actorRecord.name,
                        originalName: actorRecord.originalName,
                        films: [film.id],
                    });
                }
            })
        );
    }

    setAverageVotes() {
        const lists: ("directors" | "actors")[] = ["directors", "actors"];

        lists.forEach((listName) => {
            const list: Person[] = this[listName];
            list.forEach((person) => {
                const votes: number[] = this.votes
                    .filter((vote) => person.films.includes(vote.filmId))
                    .map((vote) => vote.value);
                const avgVote = votes.reduce((a, b) => a + b, 0) / votes.length;

                this.setPersonAttributes(listName, person.id, {
                    averageVote: avgVote,
                });
            });
        });
    }

    async parsePersons(timeout: number = 100) {
        const lists: ("directors" | "actors")[] = ["directors", "actors"];

        for (var i = 0; i < lists.length; i++) {
            const listName = lists[i];
            const list: Person[] = this[listName];

            for (var j = 0; j < list.length; j++) {
                const person = list[j];
                const personData = await this.getPersonQuery(person.id);

                const filmography =
                    personData?.filmography
                        .filter(
                            (film: Record<string, any>) =>
                                film.contextData.role === listName.slice(0, -1)
                        )
                        .map((film: Record<string, any>) => film.id)
                        .filter((id: number) =>
                            this.votes.some((vote) => vote.filmId === id)
                        ) || [];

                this.setPersonAttributes(listName, personData?.id!, {
                    photo: personData?.img.photo.x2 || personData?.img.photo.x1,
                    films: filmography,
                });
            }
        }

        await new Promise((resolve) => setTimeout(resolve, timeout));
    }
}
</script>

<style lang="sass">
.page-body
    display: flex
    gap: 5rem
    padding: 2rem

.page-left-space, .page-right-space
    width: 20vw
    margin: 5vh 0

.tabs-menu
    position: sticky
    top: 5vh

    height: 90vh

.tab-content
    width: 60vw

.info-tab
    position: sticky
    top: 5vh
    height: 90vh

    width: 20vw

    border-left: 1px solid var(--main-text-color)
    transform: translateX(calc(100% + 2rem))

    transition: 0.2s

    &.visible
        transform: none
</style>
