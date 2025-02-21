import { Vue } from "vue-class-component";
import useStatistic from "../store/statistic";
import type { Vote, Film, Person } from "../types/types";

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
        return store.films.find(film => film.id === id);
    }

    addDirector(director: Person): void {
        const store = useStatistic();
        store.addDirector(director);
    }

    getDirector(id: number): Person | undefined {
        const store = useStatistic();
        return store.directors.find(director => director.id === id);
    }

    setDirectorAttributes(id: number, attributes: Partial<Person>): void {
        const store = useStatistic();
        const directorIndex = store.directors.findIndex(director => director.id === id);
        if (directorIndex !== -1) {
            store.$patch((state) => {
                state.directors[directorIndex] = {
                    ...state.directors[directorIndex],
                    ...attributes,
                };
            });
        }
    }
}
