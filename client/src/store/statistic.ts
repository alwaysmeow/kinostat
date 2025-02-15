import { defineStore } from 'pinia';
import type { Vote } from '../types/types';

interface StatisticStore {
    votes: Vote[],
    films: Object[],
    actors: Object[],
    directors: Object[],
}

const useStatistic = defineStore('statistic', {
    state: (): StatisticStore => ({
        votes: [],
        films: [],
        actors: [],
        directors: [],
    }),
    actions: {
        setVotes(data: Vote[]) {
            this.votes = data;
        },
        addFilm(film: Object) {
            this.films.push(film);
        },
        addActor(actor: Object) {
            this.actors.push(actor);
        },
        addDirector(director: Object) {
            this.directors.push(director);
        },
    }
})

export default useStatistic;