const BASE_URL: String = "/kinopoisk-api/tooltip";

const BASE_PARAMS: Record<string, any> = {
    method: "GET",
    headers: {
        "accept": "application/json",
        "content-type": "application/json",
        "x-request-id": "1739381470361490-3578854847148517558:5",
        "x-requested-with": "XMLHttpRequest",
        "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36",
    },
};

enum QueryObjectType {
    Film = 'film',
    Person = 'person',
}

async function getObjectQuery(objectType: QueryObjectType, id: number) {
    const URL = `${BASE_URL}/${objectType}/${id}/`;

    try {
        const response = await fetch(URL, BASE_PARAMS);
        if (!response.ok) {
            throw new Error(`Request ${URL} execution failed: ${response.status}`);
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error(error);
        throw error;
    }
}

export { QueryObjectType, getObjectQuery };