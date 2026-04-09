package repository

import (
	"context"

	"github.com/jackc/pgx/v5/pgxpool"
	"koconi/api/internal/usecase"
)

type PgFriendRequestRepository struct {
	pool *pgxpool.Pool
}

func NewFriendRequestRepository(pool *pgxpool.Pool) *PgFriendRequestRepository {
	return &PgFriendRequestRepository{pool: pool}
}

func (r *PgFriendRequestRepository) Create(ctx context.Context, fromUserID, toUserID int64) (usecase.FriendRequest, error) {
	row := r.pool.QueryRow(ctx, `
		INSERT INTO friend_requests (from_user_id, to_user_id)
		VALUES ($1, $2)
		ON CONFLICT (from_user_id, to_user_id) DO UPDATE SET status = 'pending'
		RETURNING id, from_user_id, to_user_id, status, created_at
	`, fromUserID, toUserID)

	var req usecase.FriendRequest
	var fromID, toID int64
	err := row.Scan(&req.ID, &fromID, &toID, &req.Status, &req.CreatedAt)
	if err != nil {
		return usecase.FriendRequest{}, err
	}
	req.FromUser = usecase.User{ID: fromID}
	req.ToUser = usecase.User{ID: toID}
	return req, nil
}

func (r *PgFriendRequestRepository) FindByID(ctx context.Context, id int64) (usecase.FriendRequest, bool, error) {
	row := r.pool.QueryRow(ctx, `
		SELECT fr.id, fr.status, fr.created_at,
		       fu.id, fu.device_id, fu.display_name, fu.user_tag, fu.created_at,
		       tu.id, tu.device_id, tu.display_name, tu.user_tag, tu.created_at
		FROM friend_requests fr
		JOIN users fu ON fu.id = fr.from_user_id
		JOIN users tu ON tu.id = fr.to_user_id
		WHERE fr.id = $1
	`, id)

	req, err := scanFriendRequest(row)
	if err != nil {
		if isNotFound(err) {
			return usecase.FriendRequest{}, false, nil
		}
		return usecase.FriendRequest{}, false, err
	}
	return req, true, nil
}

func (r *PgFriendRequestRepository) UpdateStatus(ctx context.Context, id int64, status string) error {
	_, err := r.pool.Exec(ctx, `UPDATE friend_requests SET status = $1 WHERE id = $2`, status, id)
	return err
}

func (r *PgFriendRequestRepository) ListAcceptedFriends(ctx context.Context, userID int64) ([]usecase.User, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT u.id, u.device_id, u.display_name, u.user_tag, u.created_at
		FROM friend_requests fr
		JOIN users u ON (
			CASE WHEN fr.from_user_id = $1 THEN fr.to_user_id ELSE fr.from_user_id END = u.id
		)
		WHERE (fr.from_user_id = $1 OR fr.to_user_id = $1)
		  AND fr.status = 'accepted'
	`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var friends []usecase.User
	for rows.Next() {
		var u usecase.User
		if err := rows.Scan(&u.ID, &u.DeviceID, &u.DisplayName, &u.UserTag, &u.CreatedAt); err != nil {
			return nil, err
		}
		friends = append(friends, u)
	}
	return friends, rows.Err()
}

func (r *PgFriendRequestRepository) ListIncomingPending(ctx context.Context, toUserID int64) ([]usecase.FriendRequest, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT fr.id, fr.status, fr.created_at,
		       fu.id, fu.device_id, fu.display_name, fu.user_tag, fu.created_at,
		       tu.id, tu.device_id, tu.display_name, tu.user_tag, tu.created_at
		FROM friend_requests fr
		JOIN users fu ON fu.id = fr.from_user_id
		JOIN users tu ON tu.id = fr.to_user_id
		WHERE fr.to_user_id = $1 AND fr.status = 'pending'
		ORDER BY fr.created_at DESC
	`, toUserID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var reqs []usecase.FriendRequest
	for rows.Next() {
		req, err := scanFriendRequest(rows)
		if err != nil {
			return nil, err
		}
		reqs = append(reqs, req)
	}
	return reqs, rows.Err()
}

func scanFriendRequest(row scanner) (usecase.FriendRequest, error) {
	var req usecase.FriendRequest
	err := row.Scan(
		&req.ID, &req.Status, &req.CreatedAt,
		&req.FromUser.ID, &req.FromUser.DeviceID, &req.FromUser.DisplayName, &req.FromUser.UserTag, &req.FromUser.CreatedAt,
		&req.ToUser.ID, &req.ToUser.DeviceID, &req.ToUser.DisplayName, &req.ToUser.UserTag, &req.ToUser.CreatedAt,
	)
	return req, err
}
