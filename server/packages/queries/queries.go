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
	req.Header.Set("x-request-id", "1739823025789549-4072651695002064753:18")
	req.Header.Set("x-requested-with", "XMLHttpRequest")
	req.Header.Set("user-agent", "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36")
	req.Header.Set("referrer", "https://www.kinopoisk.ru/")
	req.Header.Set("cookie", "yashr=4083240831734474175; yandex_login=c4lmkeeper; yandexuid=2734323941733934357; L=dW5lWERLCV1VUFhDSHtFYGZkdAF0DUBiIUddLyE1FiZWIw==.1733953339.15978.315345.f32c9acc2f703f0034acd5a308979c70; gdpr=0; yuidss=2734323941733934357; location=1; coockoos=4; mda_exp_enabled=1; my_perpages=%5B%5D; mykpFolderSort=default; mykpFolderOrder=asc; mykpFolderFormat=posters; i=97EC+Qhx3vAJkRBMGqOQQKnTbnek7tV5/MjkxSOGyzEYbKvcv0PEI4kzrzoXnaIg5S+j1OtFYOHHjwZOb3ii4lcMPPA=; stars_sort_v5=01.170.10.70.181; mykp_button=movies; currentActorSortKey=avg; _csrf=XzfM0V9njoep_ricknAFJJj4; desktop_session_key=906c22c2c24e2f43dc80a66cd2d831fd6a34b096d3f2932d9d1c0bfb1e47718ccf1cab6e28b6dde1aea7ad5db76b1919a6eed54cb4ab1e6809d1a095c17605000e6c9217476385fca6ab602fbc542ce77ba2687c7ac462b84be1c32ef02ee1647af7e99957634ea0f0887c1efb81a917ff0c3398da554bd8e1ddddfcc0f130105a4cbbd0db1b3c15b7a2b99cb3334aa302f06afefdd8c0fb1d81102aae2c2b1b8ff8ab2fcbac2fb219fb1e9eb565e3ea; desktop_session_key.sig=y0jIcUoYRS1ZNc-xjvebGpMnz0E; PHPSESSID=b6c1506bb0656fb52d8d0851cea70e10; uid=39950340; _csrf_csrf_token=F0UhkzWlrYWtopqg8e0uxcmVI44XeP6HVOrbUQ-C8o4; mobile=no; oscargame_vote=4c9e4847c88040402a6780a3b95c5d8a; oscargame_vote.sig=rijhy6ZXGug3aqLuMobrohoeERM; yp=1739877080.yu.2734323941733934357; ymex=1742382680.oyu.2734323941733934357; crookie=KgRmGOm9qT95gipA0qBD2GhhG1qjjaLMeo85GnTJqsA65eGUY0HEDCqjZKXX/Z9StxNQDgPFy07m2uin/krJBacv8v0=; cmtchd=MTczOTc5MTkzNDY4Mg==; no-re-reg-required=1; _ym_isad=1; bh=EkEiTm90KEE6QnJhbmQiO3Y9Ijk5IiwgIkdvb2dsZSBDaHJvbWUiO3Y9IjEzMyIsICJDaHJvbWl1bSI7dj0iMTMzIioCPzA6ByJtYWNPUyJgt8fNvQZqIdzK0bYBu/GfqwT61obMCNLR7esD/Lmv/wff/YvhCfOBAg==; _ym_uid=1734474177613891584; spravka=dD0xNzM5ODIyNTQwO2k9OTQuNzkuMzMuMjA7RD0xMTAyRUZERUM5OTk4RUM3OTI1NzQ2MkY4NEYwNDBGRkREQzBCMEJGMzJBREI3RkQwQkNBNDhBRTg5NDZEQ0Y0OEVERjQxQUI2QUUzMzg0MzJGQzM5QjNBOEY5Nzg5MjE5MEIyOEIxMDFGNzA1NDcxRTk2QjdCMzBGRUUxRURCQTUyMTNFNEU4MkIxQTU3QzlBRkQ1OTZENUMwRjBDNTk3REQwMEUzMDgzQTQ3N0IwMTt1PTE3Mzk4MjI1NDA3NzI4MjkwOTg7aD02YzFlZmEwYjZjZjJiNTk1ZGQyMzU2NTE4MDg5YzM1Mw==; ya_sess_id=3:1739823105.5.0.1733953339350:AgAAAAAAAAACABrAoG4CKg:2ad5.1.2:1|619691702.0.2.3:1733953339|30:10232618.278791.jRhOmIiqrxyQ2nH9DA-f8i5NMio; sessar=1.1199.CiAIOTAVcgHSgxbjTCb_RG5RzCzvgNEUlksRkmoZsH-b7w.GSWTA4x03QrpnI6RDQF6IkoE0TGcSAOXYjno2UyzOVI; ys=udn.cDpjNGxta2VlcGVy#c_chck.4111409084; mda2_beacon=1739823105261; sso_status=sso.passport.yandex.ru:synchronized; adblock-warning-toast-hide=1; _yasc=ECZ5Gso5fD+tGD90EF7C6ht2dTxkxd6aVWQuKywnGRMJNjZ4+t3gWDsM3Qvudm7c0s95g96is0lw; _ym_d=1739828385")

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

	cacheFilePath := fmt.Sprintf("./cache/%s/%d.json", objectType, objectId)

	if !isFileExist(cacheFilePath) {
		cacheDir := fmt.Sprintf("./cache/%s", objectType)
		if err := os.MkdirAll(cacheDir, 0755); err != nil {
			return nil, fmt.Errorf("failed to create cache directory: %v", err)
		}

		err = os.WriteFile(cacheFilePath, body, 0644) // 0644 — access rights
		if err != nil {
			// fmt.Printf("File saving error: %v\n", err)
			return nil, fmt.Errorf("failed to create cache directory: %v", err)
		}
	}

	return object, nil
}
