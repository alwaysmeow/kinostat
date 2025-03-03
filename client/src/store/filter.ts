import { defineStore } from "pinia";
import type { iFilters } from "../common/types";
import { CURRENT_YEAR, startupFilters } from "../common/const";

interface iStore {
    earliestFilm: number,

    minDirectorBirthYear: number,
    maxDirectorBirthYear: number,
    maxDirectorFilms: number,

    minActorBirthYear: number,
    maxActorBirthYear: number,
    maxActorFilms: number,

    filters: iFilters,
}

const useFilters = defineStore("filters", {
    state: (): iStore => ({
        earliestFilm: 1895,

        minDirectorBirthYear: 1875,
        maxDirectorBirthYear: CURRENT_YEAR,
        maxDirectorFilms: 10,
    
        minActorBirthYear: 1875,
        maxActorBirthYear: CURRENT_YEAR,
        maxActorFilms: 20,

        filters: startupFilters(),
    }),
    actions: {
        defaultFilters(): iFilters {
            return {
                selectedVoteValues: Array(10).fill(true),
                filmYearRange: [this.earliestFilm, CURRENT_YEAR],
            
                directorVoteRange: [1, 10],
                directorFilmCountRange: [1, this.maxDirectorFilms],
                directorBirthYearRange: [this.minDirectorBirthYear, this.maxDirectorBirthYear],
            
                actorVoteRange: [1, 10],
                actorFilmCountRange: [1, this.maxActorFilms],
                actorBirthYearRange: [this.minActorBirthYear, this.maxActorBirthYear],
            }
        },
        setDefaultFilters() {
            this.filters = this.defaultFilters();
        },
        setFilters(filters: iFilters) {
            this.filters = structuredClone(filters);
        },
    },
});

export default useFilters;