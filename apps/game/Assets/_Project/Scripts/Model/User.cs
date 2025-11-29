using System;

namespace Koconi.Model
{
    [Serializable]
    public class User
    {
        public string id;
        public string username;
        public string email;
        public string token; // JWT token
    }
}
