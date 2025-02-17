package queries

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"regexp"
)

func isFileExist(path string) bool {
	if _, err := os.Stat(path); os.IsNotExist(err) {
		return false
	}
	return true
}

func GetVotes(userID int) ([]map[string]interface{}, error) {
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

func GetObject(objectType string, objectId int) (map[string]interface{}, error) {
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
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("Request failed with status: %s", resp.Status)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("Response reading error: %v", err)
	}

	cacheFilePath := fmt.Sprintf("./cache/%s/%d.json", objectType, objectId)

	if !isFileExist(cacheFilePath) {
		cacheDir := fmt.Sprintf("./cache/%s", objectType)
		if err := os.MkdirAll(cacheDir, 0755); err != nil {
			return nil, fmt.Errorf("Failed to create cache directory: %v", err)
		}

		err = os.WriteFile(cacheFilePath, body, 0644) // 0644 — access rights
		if err != nil {
			// fmt.Printf("File saving error: %v\n", err)
			return nil, fmt.Errorf("Failed to create cache directory: %v", err)
		}
	}

	var object map[string]interface{}
	err = json.Unmarshal(body, &object)
	if err != nil {
		return nil, fmt.Errorf("JSON parsing error: %v", err)
	}

	return object, nil
}
