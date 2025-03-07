package filters

import "fmt"

func partialMap(source *map[string]interface{}, attributes []string) map[string]interface{} {
	result := make(map[string]interface{})

	for _, attr := range attributes {
		value, ok := (*source)[attr]
		if ok {
			result[attr] = value
		}
	}

	return result
}

func partialMaps(source *[]map[string]interface{}, attributes []string) []map[string]interface{} {
	result := make([]map[string]interface{}, len(*source))

	for i, item := range *source {
		result[i] = partialMap(&item, attributes)
	}

	return result
}

func extractAttribute(source *map[string]interface{}, attrName string) (map[string]interface{}, error) {
	data, ok := (*source)[attrName]
	if !ok {
		return nil, fmt.Errorf("can't extract attribute with given name")
	}

	result, ok := data.(map[string]interface{})
	if !ok {
		return nil, fmt.Errorf("can't extract data of given type")
	}

	return result, nil
}
func extractListAttribute(source *map[string]interface{}, attrName string) ([]map[string]interface{}, error) {
	data, ok := (*source)[attrName]
	if !ok {
		return nil, fmt.Errorf("can't extract attribute with given name")
	}

	list, ok := data.([]interface{})
	if !ok {
		return nil, fmt.Errorf("can't read attribute as array")
	}

	result := make([]map[string]interface{}, len(list))
	for i, dataitem := range list {
		item, ok := dataitem.(map[string]interface{})
		if !ok {
			return nil, fmt.Errorf("can't read list items as map")
		}

		result[i] = item
	}

	if !ok {
		return nil, fmt.Errorf("can't extract data of given type")
	}

	return result, nil
}

func FilmData(rawData *map[string]interface{}) (map[string]interface{}, error) {
	film, err := extractAttribute(rawData, "film")
	if err != nil {
		return nil, err
	}

	result := partialMap(&film, []string{"id", "countries", "genres", "posterBaseUrl"})

	personLists := []string{"actors", "directors"}

	for _, list := range personLists {
		personList, err := extractListAttribute(&film, list)

		if err != nil {
			return nil, err
		}

		if list == "actors" {
			result[list] = partialMaps(&personList, []string{"id", "name", "originalName", "roleDetails"})
		} else {
			result[list] = partialMaps(&personList, []string{"id", "name"})
		}
	}

	return map[string]interface{}{
		"film": result,
	}, nil
}

func PersonData(rawData *map[string]interface{}) (map[string]interface{}, error) {
	person, err := extractAttribute(rawData, "person")
	if err != nil {
		return nil, err
	}

	result := partialMap(&person, []string{"id", "name", "originalName", "img"})

	filmography, err := extractListAttribute(&person, "filmography")

	if err != nil {
		return nil, err
	}

	filmography = partialMaps(&filmography, []string{"id", "contextData"})
	var filteredFilmography []map[string]interface{}

	for _, film := range filmography {
		contextData, _ := extractAttribute(&film, "contextData")
		if contextData["role"] != "cameo" {
			filteredFilmography = append(filteredFilmography, film)
		}
	}

	result["filmography"] = filteredFilmography

	return map[string]interface{}{
		"person": result,
	}, nil
}
