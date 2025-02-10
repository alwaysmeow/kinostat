import requests
import json
import re

user_id = 39950340

def get_votes(user_id):
    votes_path = f'https://www.kinopoisk.ru/graph_data/last_vote_data/340/last_vote_{user_id}__all.json'

    response = requests.get(votes_path)

    match = re.search(r'\((\[.*\])\)', response.text)
    if match:
        json_data = match.group(1)
        try:
            return json.loads(json_data)
        except json.JSONDecodeError as e:
            print("Ошибка парсинга JSON:", e)
    else:
        print("Не удалось извлечь JSON из ответа")
    return None

votes = get_votes(user_id)
print()