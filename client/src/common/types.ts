export interface Vote {
    alt: string,
    title: string,
    year: number,
    type: string,
    filmId: number,
    value: number,
    [key: string]: any,
}

export interface Film {
    actors: Person[],
    countries: string[],
    directors: Person[],
    genres: string[],
    id: number,
    posterBaseUrl: string,
    [key: string]: any,
}

export interface Person {
    name: string,
    id: number,
    films: number[],
    [key: string]: any,
}

export interface FilmAttribute {
    name: string
    films: number[],
    averageVote: number,
}

export enum SortOrder {
    Ascending = 'asc',
    Descending = 'desc',
}

export interface SortType {
    order: SortOrder,
    attribute: string,
    title: string,
    type: string,
}

export interface iToolbar {
    searchLine: string,
    compareFunction?: (a: any, b: any) => number,
    filterFunction?: (item: any) => boolean,
}

export enum InfoTabStatus {
    None = "none",
    Filter = "filter",
    Film = "film",
    Director = "director",
    Actor = "actor"
}

export enum TabIndex {
    Votes = 0,
    Directors = 1,
    Actors = 2,
    Countries = 3,
    Genres = 4,
    Years = 5,
};

export interface iFilters {
    selectedVoteValues: boolean[],
    filmYearRange: number[],

    directorVoteRange: number[],
    directorFilmCountRange: number[],
    directorBirthYearRange: number[],

    actorVoteRange: number[],
    actorFilmCountRange: number[],
    actorBirthYearRange: number[],
}