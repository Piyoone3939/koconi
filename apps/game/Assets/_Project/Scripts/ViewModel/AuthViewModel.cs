using System;
using UnityEngine;
using Koconi.Service;
using Koconi.Model;

namespace Koconi.ViewModel
{
    public class AuthViewModel : MonoBehaviour
    {
        [Header("UI References")]
        public TMPro.TMP_InputField emailInput;
        public TMPro.TMP_InputField passwordInput;
        public TMPro.TMP_InputField usernameInput; // For registration

        public Action<bool> OnLoginStateChanged;
        public Action<string> OnError;

        public void OnLoginClicked()
        {
            if (emailInput != null && passwordInput != null)
            {
                Login(emailInput.text, passwordInput.text);
            }
        }

        public void OnRegisterClicked()
        {
            if (usernameInput != null && emailInput != null && passwordInput != null)
            {
                Register(usernameInput.text, emailInput.text, passwordInput.text);
            }
        }

        public void Login(string email, string password)
        {
            AuthService.Instance.Login(email, password, (user) =>
            {
                OnLoginStateChanged?.Invoke(true);
            }, (error) =>
            {
                OnError?.Invoke(error);
            });
        }

        public void Register(string username, string email, string password)
        {
            AuthService.Instance.Register(username, email, password, (user) =>
            {
                OnLoginStateChanged?.Invoke(true);
            }, (error) =>
            {
                OnError?.Invoke(error);
            });
        }
    }
}
