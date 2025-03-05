package cache

import (
	"errors"
	"fmt"
	"os"
)

func isFileExist(path string) bool {
	if _, err := os.Stat(path); os.IsNotExist(err) {
		return false
	}
	return true
}

func SaveJSON(objectType string, objectId int, body []byte) error {
	cacheFilePath := fmt.Sprintf("./cache/%s/%d.json", objectType, objectId)

	if !isFileExist(cacheFilePath) {
		cacheDir := fmt.Sprintf("./cache/%s", objectType)
		if err := os.MkdirAll(cacheDir, 0755); err != nil {
			return err
		}

		err := os.WriteFile(cacheFilePath, body, 0644) // 0644 — access rights
		if err != nil {
			return err
		}
	}

	return nil
}

func ExtractJSON(objectType string, objectId int) ([]byte, error) {
	cacheFilePath := fmt.Sprintf("./cache/%s/%d.json", objectType, objectId)

	if isFileExist(cacheFilePath) {
		data, err := os.ReadFile(cacheFilePath)
		if err != nil {
			return nil, err
		}

		return data, nil
	}

	errorMessage := fmt.Sprintf("file %s doesn't exist", cacheFilePath)
	return nil, errors.New(errorMessage)
}
