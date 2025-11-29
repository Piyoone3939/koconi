using System;
using UnityEngine;

namespace Koconi.Model
{
    [Serializable]
    public class Pin
    {
        public string id;
        public string userId;
        public double latitude;
        public double longitude;
        public string title;
        public string description;
        public string photoUrl;
        public string createdAt;

        public DateTime GetCreatedDateTime()
        {
            if (DateTime.TryParse(createdAt, out DateTime result))
            {
                return result;
            }
            return DateTime.MinValue;
        }
    }
}
