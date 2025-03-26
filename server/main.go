package main

import (
	"encoding/json"
	"fmt"
	"kinostat-server/packages/cache"
	"kinostat-server/packages/queries"
	"kinostat-server/packages/statistic"
	"log"
	"net/http"
	"strconv"
	"strings"

	"github.com/joho/godotenv"
)

func votesHandler(w http.ResponseWriter, r *http.Request) {
	query := r.URL.Query()
	userIDStr := query.Get("user_id")
	if userIDStr == "" {
		http.Error(w, "user_id is necessary", http.StatusBadRequest)
		return
	}

	userID, err := strconv.Atoi(userIDStr)
	if err != nil {
		http.Error(w, "Invalid user_id", http.StatusBadRequest)
		return
	}

	votes, err := queries.GetVotes(userID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(votes)
}

func objectHandler(w http.ResponseWriter, r *http.Request) {
	query := r.URL.Query()
	objectIdStr := query.Get("id")
	objectType := query.Get("type")

	if objectIdStr == "" || objectType == "" {
		http.Error(w, "id and type are necessary", http.StatusBadRequest)
		return
	}

	objectId, err := strconv.Atoi(objectIdStr)
	if err != nil {
		http.Error(w, "Invalid id", http.StatusBadRequest)
		return
	}

	w.Header().Set("Content-Type", "application/json")

	data, err := cache.ExtractJSON(objectType, objectId)

	if err != nil {
		object, err := queries.GetObject(objectType, objectId)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		json.NewEncoder(w).Encode(object)
	} else {
		w.Write(data)
	}
}

func actorsHandler(w http.ResponseWriter, r *http.Request) {
	query := r.URL.Query()
	userIDStr := query.Get("user_id")
	if userIDStr == "" {
		http.Error(w, "user_id is necessary", http.StatusBadRequest)
		return
	}

	userID, err := strconv.Atoi(userIDStr)
	if err != nil {
		http.Error(w, "Invalid user_id", http.StatusBadRequest)
		return
	}

	votes, err := queries.GetVotes(userID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	votesMap := make(map[int]int)
	actorsIds := make(map[int]bool)

	for _, vote := range votes {
		parts := strings.Split(vote["url"].(string), "/")
		id, err := strconv.Atoi(parts[len(parts)-2])

		if err != nil {
			continue
		}

		value := vote["value"].(float64)
		votesMap[id] = int(value)

		data, err := cache.ExtractJSON("film", id)
		var film map[string]interface{}
		json.Unmarshal(data, &film)

		if err != nil {
			film, err = queries.GetObject("film", id)
			if err != nil {
				continue
			}
		}

		if err == nil {
			film = film["film"].(map[string]interface{})
			actorsInterfaces := film["actors"].([]interface{})

			for _, actorInterface := range actorsInterfaces {
				actor := actorInterface.(map[string]interface{})
				actorId := actor["id"].(float64)
				actorsIds[int(actorId)] = true
			}
		}
	}

	var actors []map[string]interface{}
	for id := range actorsIds {

		data, err := cache.ExtractJSON("person", id)
		var person map[string]interface{}
		json.Unmarshal(data, &person)

		if err != nil {
			person, err = queries.GetObject("person", id)
			if err != nil {
				continue
			}
		}

		if err != nil {
			continue
		}

		actor := person["person"].(map[string]interface{})
		actors = append(actors, actor)
	}

	statistic.SetAverageVotes(&actors, &votesMap, "actor")

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(actors)
}

func directorsHandler(w http.ResponseWriter, r *http.Request) {
	query := r.URL.Query()
	userIDStr := query.Get("user_id")
	if userIDStr == "" {
		http.Error(w, "user_id is necessary", http.StatusBadRequest)
		return
	}

	userID, err := strconv.Atoi(userIDStr)
	if err != nil {
		http.Error(w, "Invalid user_id", http.StatusBadRequest)
		return
	}

	votes, err := queries.GetVotes(userID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	votesMap := make(map[int]int)
	directorsIds := make(map[int]bool)

	for _, vote := range votes {
		parts := strings.Split(vote["url"].(string), "/")
		id, err := strconv.Atoi(parts[len(parts)-2])

		if err != nil {
			continue
		}

		value := vote["value"].(float64)
		votesMap[id] = int(value)

		data, err := cache.ExtractJSON("film", id)
		var film map[string]interface{}
		json.Unmarshal(data, &film)

		if err != nil {
			film, err = queries.GetObject("film", id)
			if err != nil {
				continue
			}
		}

		if err == nil {
			film = film["film"].(map[string]interface{})
			directorsInterfaces := film["directors"].([]interface{})

			for _, actorInterface := range directorsInterfaces {
				actor := actorInterface.(map[string]interface{})
				actorId := actor["id"].(float64)
				directorsIds[int(actorId)] = true
			}
		}
	}

	var directors []map[string]interface{}
	for id := range directorsIds {
		data, err := cache.ExtractJSON("person", id)
		var person map[string]interface{}
		json.Unmarshal(data, &person)

		if err != nil {
			person, err = queries.GetObject("person", id)
			if err != nil {
				continue
			}
		}

		if err != nil {
			continue
		}

		director := person["person"].(map[string]interface{})
		directors = append(directors, director)
	}

	statistic.SetAverageVotes(&directors, &votesMap, "director")

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(directors)
}

func countriesHandler(w http.ResponseWriter, r *http.Request) {
	query := r.URL.Query()
	userIDStr := query.Get("user_id")
	if userIDStr == "" {
		http.Error(w, "user_id is necessary", http.StatusBadRequest)
		return
	}

	userID, err := strconv.Atoi(userIDStr)
	if err != nil {
		http.Error(w, "Invalid user_id", http.StatusBadRequest)
		return
	}

	votes, err := queries.GetVotes(userID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	votesMap := make(map[int]int)
	countriesMap := make(map[string]map[string]interface{})

	for _, vote := range votes {
		parts := strings.Split(vote["url"].(string), "/")
		id, err := strconv.Atoi(parts[len(parts)-2])

		if err != nil {
			continue
		}

		value := vote["value"].(float64)
		votesMap[id] = int(value)

		data, err := cache.ExtractJSON("film", id)
		var film map[string]interface{}
		json.Unmarshal(data, &film)

		if err != nil {
			film, err = queries.GetObject("film", id)
			if err != nil {
				continue
			}
		}

		if err == nil {
			film = film["film"].(map[string]interface{})
			filmCountries := film["countries"].([]interface{})

			country, _ := filmCountries[0].(string)
			_, ok := countriesMap[country]

			if !ok {
				countriesMap[country] = make(map[string]interface{})
				countriesMap[country]["films"] = []int{}
			}
			countriesMap[country]["films"] = append(countriesMap[country]["films"].([]int), id)

			// for _, country := range filmCountries {
			// 	country, _ := country.(string)
			// 	_, ok := countriesMap[country]

			// 	if !ok {
			// 		countriesMap[country] = make(map[string]interface{})
			// 		countriesMap[country]["films"] = []int{}
			// 	}
			// 	countriesMap[country]["films"] = append(countriesMap[country]["films"].([]int), id)
			// }
		}
	}

	var result []map[string]any

	for country, stat := range countriesMap {
		item := make(map[string]any)
		item["name"] = country

		films := stat["films"].([]int)

		item["films"] = films
		item["averageVote"] = statistic.AverageVote(&films, &votesMap)

		result = append(result, item)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(result)
}

func genresHandler(w http.ResponseWriter, r *http.Request) {
	query := r.URL.Query()
	userIDStr := query.Get("user_id")
	if userIDStr == "" {
		http.Error(w, "user_id is necessary", http.StatusBadRequest)
		return
	}

	userID, err := strconv.Atoi(userIDStr)
	if err != nil {
		http.Error(w, "Invalid user_id", http.StatusBadRequest)
		return
	}

	votes, err := queries.GetVotes(userID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	votesMap := make(map[int]int)
	genresMap := make(map[string]map[string]interface{})

	for _, vote := range votes {
		parts := strings.Split(vote["url"].(string), "/")
		id, err := strconv.Atoi(parts[len(parts)-2])

		if err != nil {
			continue
		}

		value := vote["value"].(float64)
		votesMap[id] = int(value)

		data, err := cache.ExtractJSON("film", id)
		var film map[string]interface{}
		json.Unmarshal(data, &film)

		if err != nil {
			film, err = queries.GetObject("film", id)
			if err != nil {
				continue
			}
		}

		if err == nil {
			film = film["film"].(map[string]interface{})
			filmGenres := film["genres"].([]interface{})

			for _, genre := range filmGenres {
				genre, _ := genre.(string)
				_, ok := genresMap[genre]

				if !ok {
					genresMap[genre] = make(map[string]interface{})
					genresMap[genre]["films"] = []int{}
				}
				genresMap[genre]["films"] = append(genresMap[genre]["films"].([]int), id)
			}
		}
	}

	var result []map[string]any

	for genre, stat := range genresMap {
		item := make(map[string]any)
		item["name"] = genre

		films := stat["films"].([]int)

		item["films"] = films
		item["averageVote"] = statistic.AverageVote(&films, &votesMap)

		result = append(result, item)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(result)
}

func init() {
	if err := godotenv.Load(); err != nil {
		log.Print("No .env file found")
	}
}

func main() {
	http.HandleFunc("/api/votes", votesHandler)
	http.HandleFunc("/api/object", objectHandler)
	http.HandleFunc("/api/actors", actorsHandler)
	http.HandleFunc("/api/directors", directorsHandler)
	http.HandleFunc("/api/countries", countriesHandler)
	http.HandleFunc("/api/genres", genresHandler)

	fmt.Println("Server is hosting on 8080 port")
	http.ListenAndServe(":8080", nil)
}
