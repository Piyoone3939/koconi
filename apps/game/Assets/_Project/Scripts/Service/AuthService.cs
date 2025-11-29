using System;
using UnityEngine;
using Koconi.Model;
using Koconi.Utils;

namespace Koconi.Service
{
    public class AuthService : SingletonMonoBehaviour<AuthService>
    {
        public bool IsLoggedIn => PlayerPrefs.HasKey(AppConstants.PrefKeyAuthToken);
        public User CurrentUser { get; private set; }

        public void Login(string email, string password, Action<User> onSuccess, Action<string> onError)
        {
            var payload = new { email, password };
            APIService.Instance.Post<ApiResponse<User>>("/auth/login", payload, (response) =>
            {
                if (response.success)
                {
                    SaveUser(response.data);
                    onSuccess?.Invoke(response.data);
                }
                else
                {
                    onError?.Invoke(response.message);
                }
            }, onError);
        }

        public void Register(string username, string email, string password, Action<User> onSuccess, Action<string> onError)
        {
            var payload = new { username, email, password };
            APIService.Instance.Post<ApiResponse<User>>("/auth/register", payload, (response) =>
            {
                if (response.success)
                {
                    SaveUser(response.data);
                    onSuccess?.Invoke(response.data);
                }
                else
                {
                    onError?.Invoke(response.message);
                }
            }, onError);
        }

        public void Logout()
        {
            PlayerPrefs.DeleteKey(AppConstants.PrefKeyAuthToken);
            PlayerPrefs.DeleteKey(AppConstants.PrefKeyUserJson);
            CurrentUser = null;
        }

        private void SaveUser(User user)
        {
            CurrentUser = user;
            PlayerPrefs.SetString(AppConstants.PrefKeyAuthToken, user.token);
            PlayerPrefs.SetString(AppConstants.PrefKeyUserJson, JsonUtility.ToJson(user));
            PlayerPrefs.Save();
        }

        protected override void Awake()
        {
            base.Awake();
            if (IsLoggedIn)
            {
                string json = PlayerPrefs.GetString(AppConstants.PrefKeyUserJson);
                if (!string.IsNullOrEmpty(json))
                {
                    CurrentUser = JsonUtility.FromJson<User>(json);
                }
            }
        }
    }
}
