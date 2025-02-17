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

func getObject(objectType string, objectId int) (map[string]interface{}, error) {
	url := fmt.Sprintf("https://www.kinopoisk.ru/api/tooltip/%s/%d/", objectType, objectId)

	req, err := http.NewRequest("GET", url, nil)
	req.Header.Set("accept", "application/json")
	req.Header.Set("content-type", "application/json")
	req.Header.Set("uber-trace-id", "1ad7474d212c3d1d:d40bfd4021bb91e3:0:1")
	req.Header.Set("x-request-id", "1739823025789549-4072651695002064753:4")
	req.Header.Set("x-requested-with", "XMLHttpRequest")
	req.Header.Set("user-agent", "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36")
	req.Header.Set("referrer", "https://www.kinopoisk.ru/")
	req.Header.Set("cookie", "spravka=dD0xNzM5ODIyNTQwO2k9OTQuNzkuMzMuMjA7RD0xMTAyRUZERUM5OTk4RUM3OTI1NzQ2MkY4NEYwNDBGRkREQzBCMEJGMzJBREI3RkQwQkNBNDhBRTg5NDZEQ0Y0OEVERjQxQUI2QUUzMzg0MzJGQzM5QjNBOEY5Nzg5MjE5MEIyOEIxMDFGNzA1NDcxRTk2QjdCMzBGRUUxRURCQTUyMTNFNEU4MkIxQTU3QzlBRkQ1OTZENUMwRjBDNTk3REQwMEUzMDgzQTQ3N0IwMTt1PTE3Mzk4MjI1NDA3NzI4MjkwOTg7aD02YzFlZmEwYjZjZjJiNTk1ZGQyMzU2NTE4MDg5YzM1Mw==")

	client := &http.Client{}

	resp, err := client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("Request execution error: %v", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("Response reading error: %v", err)
	}

	var object map[string]interface{}
	err = json.Unmarshal(body, &object)
	if err != nil {
		return nil, fmt.Errorf("JSON parsing error: %v", err)
	}

	return object, nil
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

	object, err := getObject(objectType, objectId)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(object)
}

func main() {
	http.HandleFunc("/api/votes", votesHandler)
	http.HandleFunc("/api/object", objectHandler)
	fmt.Println("Server is hosting on 8080 port")
	http.ListenAndServe(":8080", nil)
}
