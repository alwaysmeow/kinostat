import { Vue } from "vue-class-component";
import type { Vote, Film, Person, FilmAttribute } from "../common/types";

export enum QueryObjectType {
    Film = "film",
    Person = "person",
    Series = "series",
}

export default class QueryMixin extends Vue {
    async getObjectQuery<T>(
        objectType: QueryObjectType | string,
        id: number
    ): Promise<T | null> {
        const URL = `api/object?type=${objectType}&id=${id}`;

        try {
            const response = await fetch(URL);
            if (!response.ok) {
                throw new Error(
                    `Request ${URL} execution failed: ${response.status}`
                );
            }
            const data = await response.json();
            if (data.type === "captcha") {
                throw new Error(`Request ${URL} failed by timeout`);
            }
            switch (objectType) {
                case QueryObjectType.Film:
                    return data.film;
                case QueryObjectType.Person:
                    return data.person;
                default:
                    return data;
            }
        } catch (error) {
            console.error(error);
        }
        return null;
    }

    getFilmQuery(id: number): Promise<Film | null> {
        return this.getObjectQuery<Film>(QueryObjectType.Film, id);
    }

    async getFilmsQuery(userId: string | number): Promise<Film[]> {
        const URL = `/api/films?user_id=${userId}`;
        const response = await fetch(URL);
        if (!response.ok) {
            throw new Error(`Request ${URL} execution failed: ${response.status}`);
        }
        return response.json();
    }

    async getPersonQuery(id: number, userId: string, role: "actor" | "director"): Promise<Person | null> {
        const URL = `api/object?type=person&id=${id}&user_id=${encodeURIComponent(userId)}&role=${role}`;
        const response = await fetch(URL);
        if (!response.ok) return null;
        const data = await response.json();
        return data.person ?? null;
    }

    async getVotes(userId: string | number): Promise<Vote[]> {
        const URL = `/api/votes?user_id=${userId}`;
        const response: Vote[] = await fetch(URL).then((response) =>
            response.json()
        );

        const votes: Vote[] = response.map((item) => {
            const [title, year] = item.alt
                .split("(")
                .map((str) => str.slice(0, -1));
            const [, type, id] = item.url.split("/");
            return {
                ...item,
                filmId: Number(id),
                year: Number(year),
                title,
                type,
            };
        });

        return votes;
    }

    async getActorsQuery(userId: string | number): Promise<Person[]> {
        const URL = `api/actors?user_id=${userId}`;
        const response = await fetch(URL);
        return response.json();
    }

    async getDirectorsQuery(userId: string | number): Promise<Person[]> {
        const URL = `api/directors?user_id=${userId}`;
        const response = await fetch(URL);
        return response.json();
    }

    async getCountriesQuery(userId: string | number): Promise<FilmAttribute[]> {
        const URL = `api/countries?user_id=${userId}`;
        const response = await fetch(URL);
        return response.json();
    }

    async getGenresQuery(userId: string | number): Promise<FilmAttribute[]> {
        const URL = `api/genres?user_id=${userId}`;
        const response = await fetch(URL);
        return response.json();
    }
}
