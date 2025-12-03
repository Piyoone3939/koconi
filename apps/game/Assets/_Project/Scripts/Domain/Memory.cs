using System;

namespace Koconi.Domain
{
    [Serializable]
    public class Memory
    {
        public int id;
        public string title;
        public string description;
        public string createdAt;
        public float latitude;
        public float longitude;
    }
}
