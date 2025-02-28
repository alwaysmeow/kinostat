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
        this.getDirectors();
        this.getActors();
        this.setAverageVotes();
        this.parsePhotos();
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

    parsePhotos() {
        const lists: ("directors" | "actors")[] = ["directors", "actors"];

        lists.forEach((listName) => {
            const list: Person[] = this[listName];
            
            list.forEach(async (person: Person) => {
                this.getPersonQuery(person.id)
                    .then((personData) => {
                        if (personData?.img?.photo?.x2) {
                            this.setPersonAttributes(listName, personData.id, {
                                photo:
                                    personData.img.photo.x2 ||
                                    personData.img.photo.x1,
                            });
                        }
                    })
            });
        });
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
