package runner

import (
	"context"
	"testing"

	"mono/internal/domain"
	"mono/internal/topic"
)

func TestOfflineAdvertisingUsesArticleContent(t *testing.T) {
	tests := []struct {
		name string
		text string
		ad   bool
	}{
		{name: "incident", text: "Компания сообщила об утечке и заблокировала доступ."},
		{name: "advertisement", text: "Приглашаем на вебинар по информационной безопасности.", ad: true},
	}
	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			result, err := topic.Classify(context.Background(), NewOfflineClient(), domain.Article{
				ID: "test", Title: "Информационная безопасность", Text: tc.text,
			})
			if err != nil {
				t.Fatal(err)
			}
			if result.IsAdvertising != tc.ad {
				t.Errorf("IsAdvertising = %v, want %v", result.IsAdvertising, tc.ad)
			}
		})
	}
}
