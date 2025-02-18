export interface Vote {
    alt: string,
    title: string,
    year: number,
    type: string,
    filmId: number,
    [key: string]: any,
}

export interface Film {
    actors: Object[],
    countries: string[],
    directors: Object[],
    genres: string[],
    id: number,
    posterBaseUrl: string
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