package main

import (
	"encoding/json"
	"fmt"
	"kinostat-server/packages/queries"
	"log"
	"net/http"
	"os"
	"strconv"

	"github.com/joho/godotenv"
)

func isFileExist(path string) bool {
	if _, err := os.Stat(path); os.IsNotExist(err) {
		return false
	}
	return true
}

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

	cacheFilePath := fmt.Sprintf("./cache/%s/%d.json", objectType, objectId)

	if isFileExist(cacheFilePath) {
		data, err := os.ReadFile(cacheFilePath)
		if err != nil {
			http.Error(w, "Failed to read cache", http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		w.Write(data)
	} else {
		object, err := queries.GetObject(objectType, objectId)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(object)
	}
}

func init() {
	if err := godotenv.Load(); err != nil {
		log.Print("No .env file found")
	}
}

func main() {
	http.HandleFunc("/api/votes", votesHandler)
	http.HandleFunc("/api/object", objectHandler)
	fmt.Println("Server is hosting on 8080 port")
	http.ListenAndServe(":8080", nil)
}
