package storage

import (
	"fmt"
	"io"
	"os"
	"path/filepath"
	"strings"
)

type LocalStorage struct {
	basePath string
}

func NewLocalStorage(basePath string) *LocalStorage {
	return &LocalStorage{basePath: basePath}
}

func (s *LocalStorage) Save(key string, r io.Reader) error {
	if err := validateKey(key); err != nil {
		return err
	}
	dst := filepath.Join(s.basePath, filepath.FromSlash(key))
	if err := os.MkdirAll(filepath.Dir(dst), 0755); err != nil {
		return fmt.Errorf("mkdir: %w", err)
	}
	f, err := os.Create(dst)
	if err != nil {
		return fmt.Errorf("create file: %w", err)
	}
	defer f.Close()
	if _, err := io.Copy(f, r); err != nil {
		return fmt.Errorf("write file: %w", err)
	}
	return nil
}

func (s *LocalStorage) Open(key string) (*os.File, error) {
	if err := validateKey(key); err != nil {
		return nil, err
	}
	return os.Open(filepath.Join(s.basePath, filepath.FromSlash(key)))
}

// パストラバーサル防止
func validateKey(key string) error {
	if strings.Contains(key, "..") || strings.HasPrefix(key, "/") {
		return fmt.Errorf("invalid key: %q", key)
	}
	return nil
}
