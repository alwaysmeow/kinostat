import { defineStore } from 'pinia';
import type { Vote, Film, Person, FilmAttribute } from '../common/types';

interface StatisticStore {
    userId: string,
    votes: Vote[],
    films: Film[],
    actors: Person[],
    directors: Person[],
    countries: FilmAttribute[],
    genres: FilmAttribute[],
}

const useStatistic = defineStore('statistic', {
    state: (): StatisticStore => ({
        userId: "",
        votes: [],
        films: [],
        actors: [],
        directors: [],
        countries: [],
        genres: [],
    }),
    actions: {
        setUserId(userId: string | number) {
            this.userId = String(userId);
        },
        setVotes(data: Vote[]) {
            this.votes = data;
        },
        setFilms(films: Film[]) {
            this.films = films;
        },
        addFilm(film: Film) {
            const index = this.films.findIndex((item) => item.id === film.id);
            if (index === -1) this.films.push(film);
            else this.films[index] = film;
        },
        setActors(actors: Person[]) {
            this.actors = actors;
        },
        setDirectors(directors: Person[]) {
            this.directors = directors;
        },
        addActor(actor: Person) {
            const index = this.actors.findIndex((item) => item.id === actor.id);
            if (index === -1) this.actors.push(actor);
            else this.actors[index] = actor;
        },
        addDirector(director: Person) {
            const index = this.directors.findIndex((item) => item.id === director.id);
            if (index === -1) this.directors.push(director);
            else this.directors[index] = director;
        },
    }
})

export default useStatistic;
