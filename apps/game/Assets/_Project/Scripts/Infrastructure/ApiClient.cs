using Cysharp.Threading.Tasks;
using Koconi.Domain;
using System;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.Networking;

namespace Koconi.Infrastructure
{
    public class ApiClient
    {
        private const string BaseUrl = "http://localhost:3000"; // For Editor/Desktop
        // Note: For Android emulator use "http://10.0.2.2:3000"
        // Note: For real device, use local IP of the PC

        public async UniTask<List<Memory>> GetMemoriesAsync()
        {
            var url = $"{BaseUrl}/memory";
            using var request = UnityWebRequest.Get(url);
            await request.SendWebRequest();

            if (request.result != UnityWebRequest.Result.Success)
            {
                Debug.LogError($"API Error: {request.error}");
                throw new Exception(request.error);
            }

            var json = request.downloadHandler.text;
            // Simple JSON parsing wrapper needed or use JsonUtility with a wrapper
            return JsonHelper.FromJson<Memory>(json);
        }

        public async UniTask<Memory> CreateMemoryAsync(string title, string description)
        {
            var url = $"{BaseUrl}/memory";
            var body = new Memory { title = title, description = description };
            var json = JsonUtility.ToJson(body);

            using var request = new UnityWebRequest(url, "POST");
            byte[] bodyRaw = System.Text.Encoding.UTF8.GetBytes(json);
            request.uploadHandler = new UploadHandlerRaw(bodyRaw);
            request.downloadHandler = new DownloadHandlerBuffer();
            request.SetRequestHeader("Content-Type", "application/json");

            await request.SendWebRequest();

            if (request.result != UnityWebRequest.Result.Success)
            {
                Debug.LogError($"API Error: {request.error}");
                throw new Exception(request.error);
            }

            var responseJson = request.downloadHandler.text;
            // Assuming response structure matches Memory or wraps it
            // For now, returning the input object or parsing response if needed
            return JsonUtility.FromJson<Memory>(responseJson); 
        }
    }

    // Helper for parsing JSON arrays with JsonUtility
    public static class JsonHelper
    {
        public static List<T> FromJson<T>(string json)
        {
            // JsonUtility cannot parse top-level arrays, so we wrap it
            string wrappedJson = "{\"Items\":" + json + "}";
            Wrapper<T> wrapper = JsonUtility.FromJson<Wrapper<T>>(wrappedJson);
            return wrapper.Items;
        }

        [Serializable]
        private class Wrapper<T>
        {
            public List<T> Items;
        }
    }
}
