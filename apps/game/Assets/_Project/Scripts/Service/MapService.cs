using UnityEngine;
using Koconi.Utils;

namespace Koconi.Service
{
    public class MapService : SingletonMonoBehaviour<MapService>
    {
        // Mock Center (e.g., Tokyo Station)
        private double centerLat = 35.681236;
        private double centerLon = 139.767125;
        
        // Scale factor: 1 degree lat ~ 111km. 
        // Let's say 1 Unity unit = 1 meter.
        private const double MetersPerDegreeLat = 111000.0;
        
        public Vector3 GpsToWorldPosition(double lat, double lon)
        {
            double latDiff = lat - centerLat;
            double lonDiff = lon - centerLon;

            // Simple equirectangular projection approximation
            double x = lonDiff * MetersPerDegreeLat * System.Math.Cos(centerLat * System.Math.PI / 180.0);
            double z = latDiff * MetersPerDegreeLat;

            return new Vector3((float)x, 0, (float)z);
        }

        public void SetCenter(double lat, double lon)
        {
            centerLat = lat;
            centerLon = lon;
        }
    }
}
