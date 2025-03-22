import { defineStore } from 'pinia';
import type { Vote, Film, Person, iCountry } from '../common/types';

interface StatisticStore {
    votes: Vote[],
    films: Film[],
    actors: Person[],
    directors: Person[],
    countries: Record<string, iCountry>,
}

const useStatistic = defineStore('statistic', {
    state: (): StatisticStore => ({
        votes: [],
        films: [],
        actors: [],
        directors: [],
        countries: {},
    }),
    actions: {
        setVotes(data: Vote[]) {
            this.votes = data;
        },
        addFilm(film: Film) {
            this.films.push(film);
        },
        addActor(actor: Person) {
            this.actors.push(actor);
        },
        addDirector(director: Person) {
            this.directors.push(director);
        },
    }
})

export default useStatistic;