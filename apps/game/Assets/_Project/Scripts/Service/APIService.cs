using System;
using System.Collections;
using System.Text;
using UnityEngine;
using UnityEngine.Networking;
using Koconi.Model;
using Koconi.Utils;

namespace Koconi.Service
{
    public class APIService : SingletonMonoBehaviour<APIService>
    {
        public void Post<T>(string endpoint, object body, Action<T> onSuccess, Action<string> onError)
        {
            StartCoroutine(SendRequest(endpoint, "POST", body, onSuccess, onError));
        }

        public void Get<T>(string endpoint, Action<T> onSuccess, Action<string> onError)
        {
            StartCoroutine(SendRequest<T>(endpoint, "GET", null, onSuccess, onError));
        }

        private IEnumerator SendRequest<T>(string endpoint, string method, object body, Action<T> onSuccess, Action<string> onError)
        {
            string url = AppConstants.ApiBaseUrl + endpoint;
            UnityWebRequest request = new UnityWebRequest(url, method);
            request.downloadHandler = new DownloadHandlerBuffer();

            if (body != null)
            {
                string json = JsonUtility.ToJson(body);
                byte[] bodyRaw = Encoding.UTF8.GetBytes(json);
                request.uploadHandler = new UploadHandlerRaw(bodyRaw);
                request.SetRequestHeader("Content-Type", "application/json");
            }

            // Add Auth Token if available
            string token = PlayerPrefs.GetString(AppConstants.PrefKeyAuthToken, "");
            if (!string.IsNullOrEmpty(token))
            {
                request.SetRequestHeader("Authorization", "Bearer " + token);
            }

            yield return request.SendWebRequest();

            if (request.result == UnityWebRequest.Result.ConnectionError || request.result == UnityWebRequest.Result.ProtocolError)
            {
                Debug.LogError($"API Error: {request.error} - {request.downloadHandler.text}");
                onError?.Invoke(request.error);
            }
            else
            {
                try
                {
                    string jsonResponse = request.downloadHandler.text;
                    // Handle generic response wrapper if needed, or direct mapping
                    // For simplicity assuming direct mapping or wrapped in ApiResponse
                    // If the response is wrapped in ApiResponse<T>, we should parse that.
                    // But JsonUtility has limitations with Generics.
                    // Let's assume the caller expects the inner data or the full response.
                    
                    // Simple approach: Parse as T
                    T responseData = JsonUtility.FromJson<T>(jsonResponse);
                    onSuccess?.Invoke(responseData);
                }
                catch (Exception e)
                {
                    Debug.LogError($"JSON Parse Error: {e.Message}");
                    onError?.Invoke("JSON Parse Error");
                }
            }
        }
    }
}
