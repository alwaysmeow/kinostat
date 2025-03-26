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
            <countries-tab v-if="isTab(TabIndex.Countries)"/>
        </div>

        <div class="page-left-space">
            <div :class="['info-tab', cssInfoTabVisibleClass]">
                <div class="close-info-tab-btn" @click="closeInfoTab">
                    <v-icon icon="$close" />
                </div>
                <filter-tab
                    :tab-index="selectedTabIndex"
                    v-if="isInfoTab(InfoTabStatus.Filter)"
                />
                <person-card
                    v-if="
                        isInfoTab(InfoTabStatus.Actor) ||
                        isInfoTab(InfoTabStatus.Director)
                    "
                />
                <film-card v-if="isInfoTab(InfoTabStatus.Film)" />
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { Options, mixins } from "vue-class-component";
import StoreMixin from "../mixins/store.mixin";
import QueryMixin from "../mixins/query.mixin";
import {
    type Vote,
    type Person,
    InfoTabStatus,
    TabIndex,
} from "../common/types";

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
    tabsTitles: string[] = [
        "Оценки",
        "Режиссеры",
        "Актеры",
        "Cтраны",
        "Жанры",
        "Годы",
    ];

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

        this.getCountries();
        this.getGenres();
        this.getPersonList("actor");
        this.getPersonList("director");
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

    async getPersonList(list: "director" | "actor") {
        let persons;
        let addPerson;

        if (list === "director") {
            persons = await this.getDirectorsQuery(this.$props.userId);
            addPerson = this.addDirector;
        } else {
            persons = await this.getActorsQuery(this.$props.userId);
            addPerson = this.addActor;
        }

        persons.forEach((person) => {
            if (person.name) {
                const { filmography, img, ...rest } = person;
                const personItem: Person = {
                    ...rest,
                    photo: img.photo.x2 || img.photo.x1,
                };
                addPerson(personItem);
            }
        });
    }

    async getCountries() {
        this.setCountries(await this.getCountriesQuery(this.$props.userId));
    }

    async getGenres() {
        this.setGenres(await this.getGenresQuery(this.$props.userId));
    }

    closeInfoTab() {
        this.setNoneInfoTab();
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

    .close-info-tab-btn
        width: min-content
        position: relative

        left: 1rem

        color: var(--secondary-text-color)

        &:hover
            color: var(--main-text-color)
            cursor: pointer
</style>
