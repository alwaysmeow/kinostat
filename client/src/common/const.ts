import type { iFilters } from "./types";

export const CURRENT_YEAR = (new Date()).getFullYear();
const THE_ARRIVAL_OF_THE_TRAIN_YEAR = 1895;
const AUGUSTE_LUMIERE_BIRTH_YEAR = 1862;

const DEFAULT_MAX_DIRECTOR_FILMS = 10;
const DEFAULT_MAX_ACTOR_FILMS = 20;

export const startupFilters = (): iFilters => ({
    selectedVoteValues: Array(10).fill(true),
    filmYearRange: [THE_ARRIVAL_OF_THE_TRAIN_YEAR, CURRENT_YEAR],

    directorVoteRange: [1, 10],
    directorFilmCountRange: [1, DEFAULT_MAX_DIRECTOR_FILMS],
    directorBirthYearRange: [AUGUSTE_LUMIERE_BIRTH_YEAR, CURRENT_YEAR],

    actorVoteRange: [1, 10],
    actorFilmCountRange: [1, DEFAULT_MAX_ACTOR_FILMS],
    actorBirthYearRange: [AUGUSTE_LUMIERE_BIRTH_YEAR, CURRENT_YEAR],
});