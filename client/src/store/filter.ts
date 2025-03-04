import { defineStore } from "pinia";
import type { iFilters } from "../common/types";
import { AUGUSTE_LUMIERE_BIRTH_YEAR, CURRENT_YEAR, DEFAULT_MAX_DIRECTOR_FILMS, startupFilters, THE_ARRIVAL_OF_THE_TRAIN_YEAR } from "../common/const";

interface iStore {
    earliestFilmYear: number,

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
        earliestFilmYear: THE_ARRIVAL_OF_THE_TRAIN_YEAR,

        minDirectorBirthYear: AUGUSTE_LUMIERE_BIRTH_YEAR,
        maxDirectorBirthYear: CURRENT_YEAR,
        maxDirectorFilms: DEFAULT_MAX_DIRECTOR_FILMS,
    
        minActorBirthYear: AUGUSTE_LUMIERE_BIRTH_YEAR,
        maxActorBirthYear: CURRENT_YEAR,
        maxActorFilms: DEFAULT_MAX_DIRECTOR_FILMS,

        filters: startupFilters(),
    }),
    actions: {
        defaultFilters(): iFilters {
            return {
                selectedVoteValues: Array(10).fill(true),
                filmYearRange: [this.earliestFilmYear, CURRENT_YEAR],
            
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