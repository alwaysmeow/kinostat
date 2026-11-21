<template>
    <div v-if="person" class="person-card">
        <header class="person-card-header">
            <h3>{{ person.name }}</h3>
            <div v-if="averageVote" class="person-card-average">
                <span :class="['person-card-average-value', averageVoteColorClass]">{{ averageVote }}</span>
                <span> Average rating</span>
            </div>
        </header>
        <img v-if="person.photo" class="person-card-photo" :src="person.photo" :alt="person.name" />
        <div class="person-contribution-heading">
            <span>Rated films</span>
            <span>{{ person.films.length }}</span>
        </div>
        <div class="person-contribution">
            <film-contribution-item v-for="id in person.films" :id="id" :key="id" />
        </div>
        <a
            class="external-person-link"
            :href="`https://www.themoviedb.org/person/${person.id}`"
            target="_blank"
            rel="noopener noreferrer"
        >
            <v-icon icon="$link" />
            <span>View on TMDB</span>
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
        selectedObjectId: "loadPerson",
    },
})
export default class PersonCardComponent extends mixins(StoreMixin, QueryMixin) {
    created() {
        void this.loadPerson(this.selectedObjectId);
    }

    async loadPerson(id: number | null) {
        if (!id || !this.userId) return;
        const role = this.infoTabStatus === InfoTabStatus.Director ? "director" : "actor";
        const cached = role === "director" ? this.getDirector(id) : this.getActor(id);
        if (cached?.films?.length) return;
        const person = await this.getPersonQuery(id, this.userId, role);
        if (!person) return;
        const { filmography, img, ...rest } = person;
        const normalized = { ...rest, photo: img?.photo?.x2 || img?.photo?.x1 };
        if (role === "director") this.addDirector(normalized);
        else this.addActor(normalized);
    }

    get person() {
        const personId = this.selectedObjectId;
        switch (this.infoTabStatus) {
            case InfoTabStatus.Actor:
                return this.actors.find((actor) => actor.id === personId);
            case InfoTabStatus.Director:
                return this.directors.find(
                    (director) => director.id === personId
                );
        }
        return null;
    }

    get averageVote(): string {
        if (!this.averageVoteNumber) return "";
        return this.averageVoteNumber.toFixed(1).replace(/\.0$/, "");
    }

    get averageVoteNumber(): number {
        const supplied = Number(this.person?.averageVote);
        if (supplied > 0) return supplied;
        const filmIds = new Set(this.person?.films ?? []);
        const values = this.votes
            .filter((vote) => filmIds.has(vote.filmId))
            .map((vote) => Number(vote.value))
            .filter((value) => Number.isFinite(value));
        if (!values.length) return 0;
        return values.reduce((sum, value) => sum + value, 0) / values.length;
    }

    get averageVoteColorClass(): string {
        const value = Math.max(1, Math.min(10, Math.round(this.averageVoteNumber)));
        return `vote-value-${value}`;
    }
}
</script>

<style lang="sass">
.person-card
    display: flex
    flex-direction: column
    gap: 1.25rem
    padding: 1.5rem
    min-height: 0

.person-card-header
    padding-right: 3rem

    h3
        margin: 0 0 0.35rem
        font-size: 1.35rem

.person-card-average
    color: var(--secondary-text-color)

.person-card-average-value
    color: var(--value-color)
    font-weight: bold

.person-card-photo
    display: block
    width: min(100%, 240px)
    height: auto
    max-height: none
    align-self: center
    object-fit: contain
    border-radius: 5px

.external-person-link
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

.person-contribution-heading
    display: flex
    justify-content: space-between
    color: var(--secondary-text-color)
    font-size: 0.8rem
    font-weight: bold
    text-transform: uppercase
    letter-spacing: 0.06em

.person-contribution
    display: flex
    flex-direction: column
    gap: 0.5rem

    .contribution-item
        padding: 0.7rem 0.85rem
        border-radius: 0.75rem
        background: var(--neutral-shade-two)
</style>
