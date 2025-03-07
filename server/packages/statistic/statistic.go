package statistic

func averageVote(filmography *[]map[string]interface{}, votesMap *map[int]int, role string) float64 {
	sum := 0
	count := 0

	for _, film := range *filmography {
		contextData, _ := film["contextData"].(map[string]interface{})
		if contextData["role"] != role {
			continue
		}

		filmIdAttr, ok := film["id"]
		if !ok {
			continue
		}

		filmId, ok := filmIdAttr.(int)
		if !ok {
			continue
		}

		voteValue, ok := (*votesMap)[filmId]
		if ok {
			sum += voteValue
			count += 1
		}
	}

	if count == 0 {
		return 0
	}

	return float64(sum) / float64(count)
}

func SetAverageVotes(persons *[]map[string]interface{}, votesMap *map[int]int, role string) {
	for index, person := range *persons {
		filmography, _ := person["filmography"].([]map[string]interface{})
		(*persons)[index]["averageVote"] = averageVote(&filmography, votesMap, role)
	}
}
