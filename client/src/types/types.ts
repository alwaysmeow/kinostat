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

export enum SortOrder {
    Ascending = 'asc',
    Descending = 'desc',
}

export interface SortType {
    order: SortOrder,
    attribute: string,
    title: string,
}