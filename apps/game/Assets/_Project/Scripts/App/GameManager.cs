using UnityEngine;
using Koconi.Service;
using Koconi.View;

namespace Koconi.App
{
    public class GameManager : MonoBehaviour
    {
        [SerializeField] private ViewManager viewManager;

        private void Start()
        {
            // Check Auth
            if (AuthService.Instance.IsLoggedIn)
            {
                viewManager.ShowHome();
            }
            else
            {
                viewManager.ShowAuth();
            }
        }
    }
}
