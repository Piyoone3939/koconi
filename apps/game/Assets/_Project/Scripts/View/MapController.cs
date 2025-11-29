using UnityEngine;
using Koconi.Service;
using Koconi.Model;
using System.Collections.Generic;

namespace Koconi.View
{
    public class MapController : MonoBehaviour
    {
        [SerializeField] private GameObject pinPrefab;
        [SerializeField] private Transform mapRoot;

        private List<GameObject> spawnedPins = new List<GameObject>();

        public void UpdateMapCenter(double lat, double lon)
        {
            MapService.Instance.SetCenter(lat, lon);
            // In a real map, we would update tiles here
        }

        public void ShowPins(List<Pin> pins)
        {
            ClearPins();
            foreach (var pin in pins)
            {
                Vector3 pos = MapService.Instance.GpsToWorldPosition(pin.latitude, pin.longitude);
                GameObject obj = Instantiate(pinPrefab, pos, Quaternion.identity, mapRoot);
                // Setup pin UI/Interaction here
            }
        }

        private void ClearPins()
        {
            foreach (var p in spawnedPins)
            {
                Destroy(p);
            }
            spawnedPins.Clear();
        }
    }
}
