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
            this.copyFilters(filters, this.filters);
        },
        fetchFilters(filters: iFilters) {
            this.copyFilters(this.filters, filters);
        },
        copyFilters(sourceFilter: iFilters, targetFilter: iFilters) {
            const copyFilterValues = <T>(source: T[], target: T[]) => {
                for (let i = 0; i < source.length; i++) {
                    target[i] = source[i];
                }
            };
    
            const filterMappings: { source: unknown[]; target: unknown[] }[] = [
                {
                    source: sourceFilter.selectedVoteValues,
                    target: targetFilter.selectedVoteValues,
                },
                {
                    source: sourceFilter.filmYearRange,
                    target: targetFilter.filmYearRange,
                },
                {
                    source: sourceFilter.directorBirthYearRange,
                    target: targetFilter.directorBirthYearRange,
                },
                {
                    source: sourceFilter.directorFilmCountRange,
                    target: targetFilter.directorFilmCountRange,
                },
                {
                    source: sourceFilter.directorVoteRange,
                    target: targetFilter.directorVoteRange,
                },
                {
                    source: sourceFilter.actorBirthYearRange,
                    target: targetFilter.actorBirthYearRange,
                },
                {
                    source: sourceFilter.actorFilmCountRange,
                    target: targetFilter.actorFilmCountRange,
                },
                {
                    source: sourceFilter.actorVoteRange,
                    target: targetFilter.actorVoteRange,
                },
            ];
    
            filterMappings.forEach(({ source, target }) => {
                copyFilterValues(source, target);
            });
        },
    },
});

export default useFilters;