package usecase

import (
	"context"
	"errors"
	"strings"

	"koconi/api/internal/domain"
)

type SearchResult struct {
	Users      []User                    `json:"users"`
	Trips      []domain.Trip             `json:"trips"`
	Placements []domain.LandmarkPlacement `json:"placements"`
}

type SearchRepository interface {
	SearchUsers(ctx context.Context, query string, limit int) ([]User, error)
	SearchTrips(ctx context.Context, query string, ownerUserID *int64, limit int) ([]domain.Trip, error)
	SearchPlacements(ctx context.Context, query string, limit int) ([]domain.LandmarkPlacement, error)
}

type SearchUseCase struct {
	userRepo   UserRepository
	searchRepo SearchRepository
}

func NewSearchUseCase(userRepo UserRepository, searchRepo SearchRepository) *SearchUseCase {
	return &SearchUseCase{userRepo: userRepo, searchRepo: searchRepo}
}

func (uc *SearchUseCase) Execute(ctx context.Context, deviceID, query string, types []string) (SearchResult, error) {
	if strings.TrimSpace(query) == "" {
		return SearchResult{}, errors.New("query is required")
	}

	// types が空なら全種類
	typeSet := map[string]bool{}
	if len(types) == 0 {
		typeSet["user"] = true
		typeSet["trip"] = true
		typeSet["placement"] = true
	} else {
		for _, t := range types {
			typeSet[t] = true
		}
	}

	// ログインユーザー（tripのオーナーフィルタ用）
	var ownerID *int64
	if deviceID != "" {
		if user, ok, err := uc.userRepo.FindByDeviceID(ctx, deviceID); err == nil && ok {
			ownerID = &user.ID
		}
	}

	result := SearchResult{
		Users:      []User{},
		Trips:      []domain.Trip{},
		Placements: []domain.LandmarkPlacement{},
	}

	if typeSet["user"] {
		users, err := uc.searchRepo.SearchUsers(ctx, query, 20)
		if err != nil {
			return SearchResult{}, err
		}
		result.Users = users
	}

	if typeSet["trip"] {
		trips, err := uc.searchRepo.SearchTrips(ctx, query, ownerID, 20)
		if err != nil {
			return SearchResult{}, err
		}
		result.Trips = trips
	}

	if typeSet["placement"] {
		placements, err := uc.searchRepo.SearchPlacements(ctx, query, 20)
		if err != nil {
			return SearchResult{}, err
		}
		result.Placements = placements
	}

	return result, nil
}
