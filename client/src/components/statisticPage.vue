<template>
    <Teleport to="#header-navigation">
        <tabs-menu
            class="tabs-menu"
            v-model="selectedTabIndex"
            :tabs-titles="tabsTitles"
            @update:modelValue="loadTab"
        ></tabs-menu>
    </Teleport>
    <div :class="['page-body', { 'with-info-tab': infoTabStatus !== InfoTabStatus.None }]">
        <div class="tab-content">
            <votes-list v-if="isTab(TabIndex.Votes)" />
            <person-list list="directors" v-if="isTab(TabIndex.Directors)" />
            <person-list list="actors" v-if="isTab(TabIndex.Actors)" />
            <countries-tab v-if="isTab(TabIndex.Countries)"/>
            <genres-tab v-if="isTab(TabIndex.Genres)"/>
            <years-tab v-if="isTab(TabIndex.Years)"/>
        </div>

        <div
            :class="[
                'page-right-space',
                { active: infoTabStatus !== InfoTabStatus.None },
            ]"
        >
            <div :class="['info-tab', cssInfoTabVisibleClass]">
                <div class="close-info-tab-btn" @click="closeInfoTab">
                    <v-icon icon="$close" />
                </div>

                <div class="info-tab-viewport">
                    <Transition name="info-content" mode="out-in">
                        <div
                            :key="infoTabContentKey"
                            :class="[
                                'info-tab-content',
                                { 'film-list-info-tab': isInfoTab(InfoTabStatus.FilmList) },
                            ]"
                        >
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
                            <film-list-tab v-if="isInfoTab(InfoTabStatus.FilmList)" />
                        </div>
                    </Transition>
                </div>
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
    userId: string | number;
};

@Options({
    props: {
        userId: { type: [String, Number], required: true },
    },
})
export default class StatisticPageComponent extends mixins(
    StoreMixin,
    QueryMixin
) {
    declare $props: PropsType;

    selectedTabIndex: number = 0;
    tabsTitles: string[] = [
        "Ratings",
        "Directors",
        "Actors",
        "Countries",
        "Genres",
        "Years",
    ];

    TabIndex = TabIndex;
    InfoTabStatus = InfoTabStatus;
    loadedTabs = new Set<number>([TabIndex.Votes, TabIndex.Years]);

    get cssInfoTabVisibleClass() {
        if (this.infoTabStatus === InfoTabStatus.None) {
            return "";
        }
        return "visible";
    }

    get infoTabContentKey() {
        switch (this.infoTabStatus) {
            case InfoTabStatus.Actor:
            case InfoTabStatus.Director:
            case InfoTabStatus.Film:
                return `${this.infoTabStatus}:${this.selectedObjectId ?? ""}`;
            case InfoTabStatus.FilmList:
                return `${this.infoTabStatus}:${this.filmListSelection?.title ?? ""}`;
            default:
                return this.infoTabStatus;
        }
    }

    async created() {
        this.setUserId(this.$props.userId);
        const votes: Vote[] = await this.getVotes(this.$props.userId);
        this.setVotes(votes);
        await this.loadFilms();
    }

    isTab(tab: TabIndex): boolean {
        return this.selectedTabIndex === tab;
    }

    isInfoTab(status: InfoTabStatus): boolean {
        return this.infoTabStatus === status;
    }

    async loadFilms() {
        const films = await this.getFilmsQuery(this.$props.userId);
        this.setFilms(films);
    }

    async loadTab(tab: TabIndex) {
        if (this.loadedTabs.has(tab)) return;
        this.loadedTabs.add(tab);
        if (tab === TabIndex.Directors) await this.getPersonList("director");
        if (tab === TabIndex.Actors) await this.getPersonList("actor");
        if (tab === TabIndex.Countries) await this.getCountries();
        if (tab === TabIndex.Genres) await this.getGenres();
    }

    async getPersonList(list: "director" | "actor") {
        let persons;

        if (list === "director") {
            persons = await this.getDirectorsQuery(this.$props.userId);
        } else {
            persons = await this.getActorsQuery(this.$props.userId);
        }

        const items = persons.flatMap((person) => {
            if (person.name) {
                const { filmography, img, ...rest } = person;
                const personItem: Person = {
                    ...rest,
                    photo: img.photo.x2 || img.photo.x1,
                };
                return [personItem];
            }
            return [];
        });
        if (list === "director") this.setDirectors(items);
        else this.setActors(items);
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
    box-sizing: border-box
    width: min(100% - 2rem, 1440px)
    margin: 0 auto
    display: grid
    grid-template-columns: minmax(0, 1100px) 0
    grid-template-areas: "content info"
    justify-content: center
    column-gap: 0
    padding: 1rem 0 4rem
    transition: grid-template-columns 0.2s ease, column-gap 0.2s ease

    &.with-info-tab
        grid-template-columns: minmax(0, 1fr) 420px
        column-gap: 2rem

.page-right-space
    grid-area: info
    position: relative
    align-self: stretch
    box-sizing: border-box
    width: 0
    min-width: 0
    height: auto
    overflow: visible
    transition: width 0.2s ease, min-width 0.2s ease

    &.active
        width: 420px
        min-width: 420px

.tab-content
    grid-area: content
    min-width: 0

.info-tab
    position: sticky
    top: 5.5rem
    box-sizing: border-box
    height: calc(100vh - 6.5rem)
    display: grid
    grid-template-rows: minmax(0, 1fr)

    transform: translateX(calc(100% + 3rem))
    opacity: 0
    background: var(--neutral-shade-one)
    border-radius: 1em
    overflow: hidden
    pointer-events: none

    transition: transform 0.2s ease, opacity 0.2s ease

    &.visible
        transform: none
        opacity: 1
        pointer-events: auto

    .close-info-tab-btn
        position: absolute
        top: 1.25rem
        right: 1.25rem
        z-index: 2
        display: flex
        justify-content: center
        align-items: center

        width: 2.5rem
        height: 2.5rem

        color: var(--secondary-text-color)

        &:hover
            color: var(--main-text-color)
            cursor: pointer
    
    .info-tab-viewport
        position: relative
        width: 100%
        min-width: 0
        height: 100%
        min-height: 0
        overflow: hidden

    .info-tab-content
        position: absolute
        inset: 0
        box-sizing: border-box
        width: 100%
        min-width: 0
        height: 100%
        min-height: 0
        overflow: auto
        overscroll-behavior: contain

        &.film-list-info-tab
            overflow: hidden

.info-content-enter-active,
.info-content-leave-active
    transition: opacity 0.18s ease, transform 0.18s ease

.info-content-enter-from
    opacity: 0
    transform: translateX(0.5rem)

.info-content-leave-to
    opacity: 0
    transform: translateX(-0.5rem)

@media (max-width: 1100px)
    .page-body
        grid-template-columns: minmax(0, 1fr)
        grid-template-areas: "content"

        &.with-info-tab
            grid-template-columns: minmax(0, 1fr)

    .page-right-space
        display: none

@media (max-width: 720px)
    .page-body
        display: grid

</style>
