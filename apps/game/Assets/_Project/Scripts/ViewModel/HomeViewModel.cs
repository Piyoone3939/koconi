using System.Collections.Generic;
using UnityEngine;
using Koconi.Service;
using Koconi.Model;

namespace Koconi.ViewModel
{
    public class HomeViewModel : MonoBehaviour
    {
        public List<Pin> Pins { get; private set; } = new List<Pin>();

        public void LoadPins()
        {
            // Mock loading pins for now, or call APIService
            // APIService.Instance.Get<List<Pin>>("/pins", ...);
            
            // Mock data
            Pins.Clear();
            Pins.Add(new Pin { 
                id = "1", 
                latitude = 35.681236, 
                longitude = 139.767125, 
                title = "Tokyo Station", 
                description = "Beautiful station!",
                photoUrl = "https://example.com/photo1.jpg"
            });
            
            // Notify view to update (using event or direct call if simple)
        }

        public void CreatePin(double lat, double lon, string title, string desc, string photoPath)
        {
            // Call APIService to create pin
            var newPin = new Pin
            {
                latitude = lat,
                longitude = lon,
                title = title,
                description = desc,
                // Handle photo upload separately
            };
            
            // APIService.Instance.Post("/pins", newPin, ...);
        }
    }
}
