<template>
    <div class="person-card">
        <img class="person-card-photo" :src="person?.photo" />
        <h3>{{ person?.name }}</h3>
        <a
            class="kinopoisk-link"
            :href="`https://www.themoviedb.org/person/${person?.id}`"
            target="_blank"
            rel="noopener noreferrer"
        >    
            <v-icon icon="$link" />
            <span>View on TMDB</span>
        </a>
        <div class="person-contribution">
            <div v-for="id in person?.films" :key="id">
                <film-contribution-item :id="id" />
            </div>
        </div>
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
}
</script>

<style lang="sass">
.person-card
    display: flex
    flex-direction: column
    gap: 1rem
    padding: 0 2rem
    min-height: 0

.person-card-photo
    display: block
    width: min(100%, 260px)
    height: auto
    max-height: none
    align-self: center
    object-fit: contain
    border-radius: 5px

.person-contribution
    display: flex
    flex-direction: column

    .contribution-item
        padding: 0.5rem
        border-bottom: 1px solid var(--main-text-color)
</style>
