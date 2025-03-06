package queries

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"regexp"

	"kinostat-server/packages/cache"
	"kinostat-server/packages/filters"
)

func GetVotes(userID int) ([]map[string]interface{}, error) {
	votesURL := fmt.Sprintf("https://www.kinopoisk.ru/graph_data/last_vote_data/340/last_vote_%d__all.json", userID)

	resp, err := http.Get(votesURL)
	if err != nil {
		return nil, fmt.Errorf("request execution error: %v", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("response reading error: %v", err)
	}

	rgx := regexp.MustCompile(`\((\[.*\])\)`)
	matches := rgx.FindSubmatch(body)
	if len(matches) < 2 {
		return nil, fmt.Errorf("can't extract JSON from response")
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
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %v", err)
	}

	req.Header.Set("accept", "application/json")
	req.Header.Set("content-type", "application/json")
	req.Header.Set("uber-trace-id", "1ad7474d212c3d1d:d40bfd4021bb91e3:0:1")
	req.Header.Set("x-requested-with", "XMLHttpRequest")
	req.Header.Set("user-agent", "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36")
	req.Header.Set("referrer", "https://www.kinopoisk.ru/")

	cookie, exists := os.LookupEnv("KINOPOISK_COOKIE")
	if exists {
		req.Header.Set("cookie", cookie)
	}

	xRequestId, exists := os.LookupEnv("KINOPOISK_X_REQUEST_ID")
	if exists {
		req.Header.Set("x-request-id", xRequestId)
	}

	client := &http.Client{}

	resp, err := client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("request execution error: %v", err)
	}
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("request failed with status: %s", resp.Status)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("response reading error: %v", err)
	}

	var object map[string]interface{}
	err = json.Unmarshal(body, &object)
	if err != nil {
		return nil, fmt.Errorf("JSON parsing error: %v", err)
	}

	if _, ok := object["captcha"]; ok {
		return nil, fmt.Errorf("captcha detected in response, skipping file save")
	}

	switch objectType {
	case "film":
		filmData, err := filters.FilmData(object)
		if err != nil {
			return nil, fmt.Errorf("can't filter film data")
		}
		newBody, err := json.Marshal(filmData)
		if err == nil {
			body = newBody
		}
	case "person":
		personData, err := filters.PersonData(object)
		if err != nil {
			return nil, fmt.Errorf("can't filter person data")
		}
		newBody, err := json.Marshal(personData)
		if err == nil {
			body = newBody
		}
	}

	err = cache.SaveJSON(objectType, objectId, body)
	if err != nil {
		fmt.Printf("File saving error: %v\n", err)
		return nil, fmt.Errorf("failed to create cache directory: %v", err)
	}

	return object, nil
}
