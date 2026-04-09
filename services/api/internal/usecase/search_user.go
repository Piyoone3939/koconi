package usecase

import "context"

type SearchUserUseCase struct {
	repo UserRepository
}

func NewSearchUserUseCase(repo UserRepository) *SearchUserUseCase {
	return &SearchUserUseCase{repo: repo}
}

func (uc *SearchUserUseCase) Execute(ctx context.Context, tag string) (User, bool, error) {
	return uc.repo.FindByTag(ctx, tag)
}
