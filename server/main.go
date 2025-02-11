package main

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"regexp"
	"strconv"
)

func getVotes(userID int) ([]map[string]interface{}, error) {
	votesURL := fmt.Sprintf("https://www.kinopoisk.ru/graph_data/last_vote_data/340/last_vote_%d__all.json", userID)

	resp, err := http.Get(votesURL)
	if err != nil {
		return nil, fmt.Errorf("Request execution error: %v", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("Response reading error: %v", err)
	}

	rgx := regexp.MustCompile(`\((\[.*\])\)`)
	matches := rgx.FindSubmatch(body)
	if len(matches) < 2 {
		return nil, fmt.Errorf("Can't extract JSON from response")
	}

	var votes []map[string]interface{}
	err = json.Unmarshal(matches[1], &votes)
	if err != nil {
		return nil, fmt.Errorf("JSON parsing error: %v", err)
	}

	return votes, nil
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

	votes, err := getVotes(userID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(votes)
}

func main() {
	http.HandleFunc("/api/votes", votesHandler)
	fmt.Println("Server is hosting on 8080 port")
	http.ListenAndServe(":8080", nil)
}
