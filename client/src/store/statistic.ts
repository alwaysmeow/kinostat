import { defineStore } from 'pinia';

interface StatisticStore {
    votes: Object[],
    actors: Object[],
    directors: Object[],
}

const useStatistic = defineStore('statistic', {
    state: (): StatisticStore => ({
        votes: [],
        actors: [],
        directors: [],
    }),
    actions: {
        setVotes(data: Object[]) {
            this.votes = data;
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