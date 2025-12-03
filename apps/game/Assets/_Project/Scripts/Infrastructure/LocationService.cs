using Cysharp.Threading.Tasks;
using System;
using UnityEngine;

namespace Koconi.Infrastructure
{
    public class LocationService : MonoBehaviour
    {
        public static LocationService Instance { get; private set; }

        public float Latitude { get; private set; }
        public float Longitude { get; private set; }
        public bool IsRunning { get; private set; }

        private void Awake()
        {
            if (Instance == null)
            {
                Instance = this;
                DontDestroyOnLoad(gameObject);
            }
            else
            {
                Destroy(gameObject);
            }
        }

        public async UniTask StartLocationServiceAsync()
        {
            if (!Input.location.isEnabledByUser)
            {
                Debug.LogError("Location service is disabled by user.");
                return;
            }

            Input.location.Start(10f, 10f);

            int maxWait = 20;
            while (Input.location.status == LocationServiceStatus.Initializing && maxWait > 0)
            {
                await UniTask.Delay(1000);
                maxWait--;
            }

            if (maxWait < 1)
            {
                Debug.LogError("Timed out initializing location service.");
                return;
            }

            if (Input.location.status == LocationServiceStatus.Failed)
            {
                Debug.LogError("Unable to determine device location.");
                return;
            }

            IsRunning = true;
            UpdateLocation();
        }

        private void Update()
        {
            if (IsRunning)
            {
                UpdateLocation();
            }
        }

        private void UpdateLocation()
        {
            Latitude = Input.location.lastData.latitude;
            Longitude = Input.location.lastData.longitude;
        }

        private void OnDestroy()
        {
            Input.location.Stop();
        }
    }
}
