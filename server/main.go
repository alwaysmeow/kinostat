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

		film, err := queries.GetObject("film", id)

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
		person, err := queries.GetObject("person", id)

		if err != nil {
			continue
		}

		actors = append(actors, person["person"].(map[string]interface{}))
	}

	statistic.SetAverageVotes(&actors, &votesMap, "actor")

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(actors)
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
	fmt.Println("Server is hosting on 8080 port")
	http.ListenAndServe(":8080", nil)
}
