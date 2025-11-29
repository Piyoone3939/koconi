using UnityEngine;

namespace Koconi.Utils
{
    public static class AppConstants
    {
        // Colors
        public static readonly Color ColorBackground = new Color32(255, 253, 231, 255); // #FFFDE7
        public static readonly Color ColorAccent = new Color32(239, 108, 0, 255);     // #EF6C00
        public static readonly Color ColorSecondary = new Color32(176, 190, 197, 255); // #B0BEC5
        public static readonly Color ColorHighlight = new Color32(100, 181, 246, 255); // #64B5F6

        // API
        public static string ApiBaseUrl = "http://localhost:8787"; // Default Hono local dev port

        // PlayerPrefs Keys
        public static string PrefKeyAuthToken = "auth_token";
        public static string PrefKeyUserJson = "user_json";
    }
}
