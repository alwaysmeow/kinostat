import { Vue } from "vue-class-component";
import type { Vote, Film } from "../types/types";

const BASE_KINOPOISK_API_URL = "/kinopoisk-api/tooltip";

const BASE_PARAMS = {
    method: "GET",
    headers: {
        accept: "application/json",
        "content-type": "application/json",
        "x-request-id": "1739792696378319-9332505554933574813:5",
        "x-requested-with": "XMLHttpRequest",
        "user-agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36",
    },
    "referrer": "https://www.kinopoisk.ru/",
};

export enum QueryObjectType {
    Film = "film",
    Person = "person",
    Series = "series",
}

export default class QueryMixin extends Vue {
    async getObjectQuery(objectType: QueryObjectType | string, id: number): Promise<Film | null> {
        const URL = `${BASE_KINOPOISK_API_URL}/${objectType}/${id}/`;

        try {
            const response = await fetch(URL, BASE_PARAMS);
            if (!response.ok) {
                throw new Error(
                    `Request ${URL} execution failed: ${response.status}`
                );
            }
            const data = await response.json();
            if (data.type === 'captcha') {
                throw new Error(
                    `Request ${URL} failed by timeout`
                );
            }
            return data.film;
        } catch (error) {
            if (objectType === QueryObjectType.Series) {
                return await this.getObjectQuery(QueryObjectType.Film, id);
            }
            console.error(error);
        }
        return null;
    }

    async getVotes(userId: number): Promise<Vote[]> {
        const URL = `/api/votes?user_id=${userId}`;
        const response: Vote[] = await fetch(URL).then((response) =>
            response.json()
        );

        const votes: Vote[] = response.map((item) => {
            const [title, year] = item.alt
                .split("(")
                .map((str) => str.slice(0, -1));
            const [,type,id] = item.url.split('/');
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
}
