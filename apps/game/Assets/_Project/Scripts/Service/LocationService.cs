using System.Collections;
using UnityEngine;
using Koconi.Utils;

namespace Koconi.Service
{
    public class LocationService : SingletonMonoBehaviour<LocationService>
    {
        public float Latitude { get; private set; }
        public float Longitude { get; private set; }
        public bool IsLocationEnabled { get; private set; }

        private void Start()
        {
            StartCoroutine(StartLocationService());
        }

        private IEnumerator StartLocationService()
        {
            if (!Input.location.isEnabledByUser)
            {
                Debug.LogWarning("Location service disabled by user");
                yield break;
            }

            Input.location.Start();

            int maxWait = 20;
            while (Input.location.status == LocationServiceStatus.Initializing && maxWait > 0)
            {
                yield return new WaitForSeconds(1);
                maxWait--;
            }

            if (maxWait < 1)
            {
                Debug.LogError("Timed out");
                yield break;
            }

            if (Input.location.status == LocationServiceStatus.Failed)
            {
                Debug.LogError("Unable to determine device location");
                yield break;
            }
            else
            {
                IsLocationEnabled = true;
                Latitude = Input.location.lastData.latitude;
                Longitude = Input.location.lastData.longitude;
                Debug.Log($"Location: {Latitude}, {Longitude}");
            }
        }

        private void Update()
        {
            if (IsLocationEnabled && Input.location.status == LocationServiceStatus.Running)
            {
                Latitude = Input.location.lastData.latitude;
                Longitude = Input.location.lastData.longitude;
            }
        }
    }
}
