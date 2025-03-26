import { Vue } from "vue-class-component";
import useStatistic from "../store/statistic";
import {
    type Vote,
    type Film,
    type Person,
    InfoTabStatus,
    type iFilters,
    type FilmAttribute,
} from "../common/types";
import useInterface from "../store/interface";
import useFilters from "../store/filter";

export default class StoreMixin extends Vue {
    get votes(): Vote[] {
        const store = useStatistic();
        return store.votes;
    }

    get films(): Film[] {
        const store = useStatistic();
        return store.films;
    }

    get actors(): Person[] {
        const store = useStatistic();
        return store.actors;
    }

    get directors(): Person[] {
        const store = useStatistic();
        return store.directors;
    }

    get countries() {
        const store = useStatistic();
        return store.countries;
    }

    get genres() {
        const store = useStatistic();
        return store.genres;
    }

    setVotes(data: Vote[]): void {
        const store = useStatistic();
        store.setVotes(data);
    }

    addFilm(film: Film): void {
        const store = useStatistic();
        store.addFilm(film);
    }

    getFilm(id: number): Film | undefined {
        const store = useStatistic();
        return store.films.find((film) => film.id === id);
    }

    setPersonAttributes(
        list: "directors" | "actors",
        id: number,
        attributes: Partial<Person>
    ): void {
        const store = useStatistic();
        const personIndex = store[list].findIndex((person) => person.id === id);
        if (personIndex !== -1) {
            store.$patch((state) => {
                state[list][personIndex] = {
                    ...state[list][personIndex],
                    ...attributes,
                };
            });
        }
    }

    addDirector(director: Person): void {
        const store = useStatistic();
        store.addDirector(director);
    }

    getDirector(id: number): Person | undefined {
        const store = useStatistic();
        return store.directors.find((director) => director.id === id);
    }

    setDirectorAttributes(id: number, attributes: Partial<Person>): void {
        this.setPersonAttributes("directors", id, attributes);
    }

    addActor(actor: Person): void {
        const store = useStatistic();
        store.addActor(actor);
    }

    getActor(id: number): Person | undefined {
        const store = useStatistic();
        return store.actors.find((actor) => actor.id === id);
    }

    setActorAttributes(id: number, attributes: Partial<Person>): void {
        this.setPersonAttributes("actors", id, attributes);
    }

    setCountries(countries: FilmAttribute[]) {
        const store = useStatistic();
        store.countries = countries;
    }

    setGenres(genres: FilmAttribute[]) {
        const store = useStatistic();
        store.genres = genres;
    }

    get infoTabStatus() {
        const store = useInterface();
        return store.infoTabStatus;
    }

    get selectedObjectId() {
        const store = useInterface();
        return store.selectedObjectId;
    }

    setInfoTabStatus(status: InfoTabStatus) {
        const store = useInterface();
        store.setInfoTabStatus(status);
    }

    setSelectedObjectId(id: number | null = null) {
        const store = useInterface();
        store.setSelectedObjectId(id);
    }

    setNoneInfoTab() {
        const store = useInterface();
        store.setNoneInfoTab();
    }

    setInfoTab(status: InfoTabStatus, objectId: number | null = null) {
        const store = useInterface();
        if (store.infoTabStatus === InfoTabStatus.None) {
            store.setInfoTab(status, objectId);
        }
        if (status === store.infoTabStatus) {
            store.setSelectedObjectId(objectId);
        } else {
            store.setNoneInfoTab();
            setTimeout(() => {
                store.setInfoTab(status, objectId);
            }, 100)
        }
    }

    get filters() {
        const store = useFilters();
        return store.filters;
    }

    getDefaultFilters(): iFilters {
        const store = useFilters();
        return store.defaultFilters();
    }

    setDefaultFilters() {
        const store = useFilters();
        store.setDefaultFilters();
    }

    setFilters(filters: iFilters) {
        const store = useFilters();
        store.setFilters(filters);
    }

    fetchFilters(filters: iFilters) {
        const store = useFilters();
        store.fetchFilters(filters);
    }

    getFilterRanges() {
        const store = useFilters();
        return {
            earliestFilmYear: store.earliestFilmYear,
            actorsBirthYears: [
                store.minActorBirthYear,
                store.maxActorBirthYear,
            ],
            directorsBirthYears: [
                store.minDirectorBirthYear,
                store.maxDirectorBirthYear,
            ],
            maxActorsFilms: store.maxDirectorFilms,
            maxDirectorFilms: store.maxDirectorFilms,
        };
    }
}
