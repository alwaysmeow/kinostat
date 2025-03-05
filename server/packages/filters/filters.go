package filters

import "fmt"

func partialMap(source map[string]interface{}, attributes []string) map[string]interface{} {
	result := make(map[string]interface{})

	for _, attr := range attributes {
		value, ok := source[attr]
		if ok {
			result[attr] = value
		}
	}

	return result
}

func partialMaps(source []map[string]interface{}, attributes []string) []map[string]interface{} {
	result := make([]map[string]interface{}, len(source))

	for i, item := range source {
		result[i] = partialMap(item, attributes)
	}

	return result
}

func extractAttribute(source map[string]interface{}, attrName string) (map[string]interface{}, error) {
	data, ok := source[attrName]
	if !ok {
		return nil, fmt.Errorf("can't extract attribute with given name")
	}

	result, ok := data.(map[string]interface{})
	if !ok {
		return nil, fmt.Errorf("can't extract data of given type")
	}

	return result, nil
}
func extractListAttribute(source map[string]interface{}, attrName string) ([]map[string]interface{}, error) {
	data, ok := source[attrName]
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

func FilmData(rawData map[string]interface{}) (map[string]interface{}, error) {
	film, err := extractAttribute(rawData, "film")
	if err != nil {
		return nil, err
	}

	result := partialMap(film, []string{"id", "countries", "genres", "posterBaseUrl"})

	personLists := []string{"actors", "directors"}

	for _, list := range personLists {
		personList, err := extractListAttribute(film, list)

		if err != nil {
			return nil, err
		}

		if list == "actors" {
			result[list] = partialMaps(personList, []string{"id", "roleDetails"})
		} else {
			result[list] = partialMaps(personList, []string{"id"})
		}
	}

	return map[string]interface{}{
		"film": result,
	}, nil
}
