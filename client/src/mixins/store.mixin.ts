import { Vue } from "vue-class-component";
import useStatistic from "../store/statistic";
import type { Vote, Film } from "../types/types";

export default class StoreMixin extends Vue {
    get votes(): Vote[] {
        const store = useStatistic();
        return store.votes;
    }

    get films(): Film[] {
        const store = useStatistic();
        return store.films;
    }

    get actors(): Object[] {
        const store = useStatistic();
        return store.actors;
    }

    get directors(): Object[] {
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
}
