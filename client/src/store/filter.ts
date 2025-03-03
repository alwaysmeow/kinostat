import { defineStore } from "pinia";
import type { iFilters } from "../types/types";

const defaultYearRange = [1895, (new Date()).getFullYear()]
const defaultVoteRange = [1, 10]

const defaultFilterStates: iFilters = {
    selectedVoteValues: Array(10).fill(true),
    filmYearRange: [...defaultYearRange],

    directorVoteRange: [...defaultVoteRange],
    directorFilmCountRange: [1, 10],
    directorBirthYearRange: [...defaultYearRange],

    actorVoteRange: [...defaultVoteRange],
    actorFilmCountRange: [1, 10],
    actorBirthYearRange: [...defaultYearRange],
}

const useFilters = defineStore("filters", {
    state: (): iFilters => ({
        ...defaultFilterStates,
    }),
    actions: {
        setDefaultFilters() {
            Object.assign(this, { ...defaultFilterStates, ...this });
        },
    },
});

export default useFilters;