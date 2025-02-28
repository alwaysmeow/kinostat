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
            <person-list list="directors" v-if="isTab(tabIndex.directors)" />
            <person-list list="actors" v-if="isTab(tabIndex.actors)" />
        </div>
    </div>
</template>

<script lang="ts">
import { Options, mixins } from "vue-class-component";
import StoreMixin from "../mixins/store.mixin";
import QueryMixin from "../mixins/query.mixin";
import type { Vote, Person } from "../types/types";

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
    tabIndex: Record<string, number> = {
        votes: 0,
        directors: 1,
        actors: 2,
    };

    async created() {
        const timeout = 10;
        const votes: Vote[] = await this.getVotes(this.$props.userId);
        this.setVotes(votes);
        await this.getFilms(timeout);
        await this.getDirectors(timeout);
        await this.getActors();
    }

    isTab(tab: number): boolean {
        return tab === this.selectedTabIndex;
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

    async getDirectors(timeout: number = 100) {
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

        this.directors.forEach(director => {
            const votes: number[] =
                director?.films
                    .map(
                        (filmId) =>
                            this.votes.find((vote) => vote.filmId === filmId)
                                ?.value || 0
                    )
                    .filter((item) => item) || [];
            const avgVote = votes.reduce((a, b) => a + b, 0) / votes.length;

            this.setDirectorAttributes(director.id, {
                averageVote: avgVote,
            });
        })

        for (var i = this.directors.length - 1; i >= 0; i--) {
            const directorData = await this.getPersonQuery(this.directors[i].id)

            if (directorData?.img?.photo?.x2) {
                this.setDirectorAttributes(directorData.id, {
                    photo: directorData.img.photo.x2 || directorData.img.photo.x1,
                });
            }

            await new Promise((resolve) => setTimeout(resolve, timeout));
        }
    }

    async getActors() {
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

        this.actors.forEach(actor => {
            const votes: number[] =
                actor.films
                    .map(
                        (filmId) =>
                            this.votes.find((vote) => vote.filmId === filmId)
                                ?.value || 0
                    )
                    .filter((item) => item) || [];
            const avgVote = votes.reduce((a, b) => a + b, 0) / votes.length;

            this.setActorAttributes(actor.id, {
                averageVote: avgVote,
            });
        })

        console.log(this.actors);
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
    width: 10vw

.tab-content
    margin-right: 15vw
    width: 70vw
</style>
