<template>
    <div class="film-card">
        <header class="film-card-header">
            <h3>
                {{ film.title }}
                <span class="film-card-year">{{ film.year }}</span>
            </h3>
            <div v-if="film.value && ratedDate" class="film-card-rated">
                <span :class="['film-card-rating', `vote-value-${film.value}`]">{{ film.value }}</span><span> Rated {{ ratedDate }}</span>
            </div>
        </header>
        <div class="film-card-main">
            <img
                v-if="posterSrc"
                class="film-card-poster"
                :src="posterSrc"
                :alt="film.title"
                referrerpolicy="no-referrer"
            />
            <div class="film-card-credits">
                <div class="film-card-credit-group">
                    <b v-if="film.directors!.length === 1">Director</b>
                    <b v-else>Directors</b>
                    <div class="film-card-person-list">
                        <span
                            v-for="person in film.directors"
                            :key="person.id"
                            class="contributing-person-name"
                            @click="onDirectorClick(person.id)"
                        >{{ person.name }}</span>
                    </div>
                </div>
                <div class="film-card-credit-group">
                    <b>Cast</b>
                    <div class="film-card-person-list">
                        <span
                            v-for="person in displayedActors"
                            :key="person.id"
                            class="contributing-person-name"
                            @click="onActorClick(person.id)"
                        >{{ person.name }}</span>
                    </div>
                </div>
            </div>
        </div>
        <a
            class="external-film-link"
            :href="film.letterboxdUri"
            target="_blank"
            rel="noopener noreferrer"
        >
            <v-icon icon="$link" />
            <span>View on Letterboxd</span>
        </a>
    </div>
</template>

<script lang="ts">
import { mixins, Options } from "vue-class-component";
import StoreMixin from "../mixins/store.mixin";
import QueryMixin from "../mixins/query.mixin";
import { InfoTabStatus } from "../common/types";

@Options({
    watch: {
        selectedObjectId: "loadFilm",
    },
})
export default class FilmCardComponent extends mixins(StoreMixin, QueryMixin) {
    created() {
        void this.loadFilm(this.selectedObjectId);
    }

    async loadFilm(id: number | null) {
        if (!id) return;
        const cached = this.getFilm(id);
        if (cached?.detailsLoaded) return;
        const film = await this.getFilmQuery(id);
        if (film) this.addFilm(film);
    }

    get film() {
        const filmId = this.selectedObjectId;
        return {
            ...this.votes.find((vote) => vote.filmId === filmId),
            ...this.films.find((film) => film.id === filmId),
        };
    }

    get posterSrc(): string {
        const url = this.film.posterBaseUrl;
        if (!url) return "";
        if (url.includes("image.tmdb.org/t/p/original")) {
            return url.replace("/original/", "/w342/");
        }
        return url;
    }

    get displayedActors() {
        return this.film.actors?.slice(0, 5) ?? [];
    }

    get ratedDate(): string {
        const rawDate = this.film.time?.split(" ")[0];
        if (!rawDate) return "";
        const [day, month, shortYear] = rawDate.split(".");
        if (!day || !month || !shortYear) return rawDate;
        return `${day}.${month}.20${shortYear}`;
    }

    onActorClick(personId: number) {
        this.setInfoTab(InfoTabStatus.Actor, personId);
    }

    onDirectorClick(personId: number) {
        this.setInfoTab(InfoTabStatus.Director, personId);
    }
}
</script>

<style lang="sass">
.film-card
    display: flex
    flex-direction: column
    gap: 1.25rem
    padding: 1.5rem

    .film-card-header
        padding-right: 2rem

        h3
            margin: 0 0 0.35rem
            font-size: 1.35rem

    .film-card-year
        margin-left: 0.25rem
        color: var(--secondary-text-color)
        font-size: 0.9em
        font-weight: normal

    .film-card-rated
        margin-top: 0.25rem
        color: var(--secondary-text-color)

    .film-card-rating
        color: var(--value-color)
        font-weight: bold

    .film-card-main
        display: flex
        flex-direction: column
        align-items: start
        gap: 1.25rem

    .film-card-poster
        display: block
        width: min(100%, 240px)
        align-self: center
        aspect-ratio: 2 / 3
        object-fit: cover
        object-position: top
        background: var(--neutral-shade-one)
        border-radius: 5px

    .film-card-credits
        display: grid
        grid-template-columns: repeat(2, minmax(0, 1fr))
        gap: 1.25rem
        width: 100%
        min-width: 0
        text-align: left

    .film-card-credit-group
        display: flex
        flex-direction: column
        gap: 0.3rem
        color: var(--main-text-color)

        b
            color: var(--secondary-text-color)
            font-size: 0.8rem
            text-transform: uppercase
            letter-spacing: 0.06em

    .film-card-person-list
        display: flex
        flex-direction: column
        gap: 0.2rem

.external-film-link
    display: flex
    align-items: center
    justify-content: center
    gap: 0.4rem
    padding: 0.75rem 1rem
    border-radius: 1em
    background: var(--neutral-shade-two)
    color: var(--main-text-color)
    font-size: 0.9rem
    font-weight: bold

    &:hover
        color: var(--kinopoisk-color)

.contributing-person-name:hover
    color: var(--kinopoisk-color)
    cursor: pointer
</style>
