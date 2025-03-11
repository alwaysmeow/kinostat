package statistic

func getFilmIdList(filmography *[]interface{}, votesMap *map[int]int, role string) []int {
	var filmIds []int
	for _, film := range *filmography {
		film := film.(map[string]interface{})
		contextData, _ := film["contextData"].(map[string]interface{})
		if contextData["role"] != role {
			continue
		}

		filmIdAttr, ok := film["id"]
		if !ok {
			continue
		}

		filmIdFloat, ok := filmIdAttr.(float64)
		filmId := int(filmIdFloat)
		if !ok {
			continue
		}

		_, ok = (*votesMap)[filmId]
		if ok {
			filmIds = append(filmIds, filmId)
		}
	}

	return filmIds
}

func averageVote(filmIds *[]int, votesMap *map[int]int) float64 {
	sum := 0
	count := 0

	for _, filmId := range *filmIds {
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
		filmography, _ := person["filmography"].([]interface{})
		filmIds := getFilmIdList(&filmography, votesMap, role)
		(*persons)[index]["films"] = filmIds
		(*persons)[index]["averageVote"] = averageVote(&filmIds, votesMap)
	}
}
