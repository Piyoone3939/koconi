using UnityEngine;
using Koconi.Service;
using Koconi.Model;
using System;
using LocationService = Koconi.Service.LocationService;

namespace Koconi.ViewModel
{
    public class PinCreateViewModel : MonoBehaviour
    {
        [Header("UI References")]
        public TMPro.TMP_InputField titleInput;
        public TMPro.TMP_InputField descriptionInput;

        public Action OnPinCreated;
        public Action<string> OnError;

        public void OnCreatePinClicked()
        {
            if (titleInput != null && descriptionInput != null)
            {
                // Photo path is empty for now, or could be added as another field
                CreatePin(titleInput.text, descriptionInput.text, "");
            }
        }

        public void CreatePin(string title, string description, string photoPath)
        {
            // Get current location
            if (!LocationService.Instance.IsLocationEnabled)
            {
                OnError?.Invoke("Location service not enabled.");
                return;
            }

            double lat = LocationService.Instance.Latitude;
            double lon = LocationService.Instance.Longitude;

            // Create Pin object
            var newPin = new Pin
            {
                userId = AuthService.Instance.CurrentUser?.id,
                latitude = lat,
                longitude = lon,
                title = title,
                description = description,
                photoUrl = photoPath, // In real app, upload first then get URL
                createdAt = DateTime.Now.ToString("o")
            };

            // Call API
            APIService.Instance.Post<ApiResponse<Pin>>("/pins", newPin, (response) =>
            {
                if (response.success)
                {
                    OnPinCreated?.Invoke();
                }
                else
                {
                    OnError?.Invoke(response.message);
                }
            }, (error) =>
            {
                OnError?.Invoke(error);
            });
        }
    }
}
