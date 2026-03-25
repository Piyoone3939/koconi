package domain

import "time"

type Memory struct {
    ID          int64
    Title       string
    Description *string
    CreatedAt   time.Time
}