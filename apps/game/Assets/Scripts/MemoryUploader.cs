using System.Collections;
using System.Text;
using UnityEngine;
using UnityEngine.Networking;

public class MemoryUploader : MonoBehaviour
{
    [System.Serializable]
    public class MemoryData
    {
        public string title;
        public string description;
    }

    IEnumerator Start()
    {
        // 送信先URL
        string url = "https://koconi.com/memory";

        // テストデータ
        MemoryData data = new MemoryData
        {
            title = "Unity Test",
            description = "Sent from Unity 🚀"
        };

        // JSON変換
        string json = JsonUtility.ToJson(data);
        Debug.Log("Sending JSON: " + json);

        // POSTリクエスト作成
        UnityWebRequest request = new UnityWebRequest(url, "POST");
        byte[] bodyRaw = Encoding.UTF8.GetBytes(json);
        request.uploadHandler = new UploadHandlerRaw(bodyRaw);
        request.downloadHandler = new DownloadHandlerBuffer();
        request.SetRequestHeader("Content-Type", "application/json");

        // 送信実行
        yield return request.SendWebRequest();

        if (request.result == UnityWebRequest.Result.Success)
        {
            Debug.Log("✅ Success: " + request.downloadHandler.text);
        }
        else
        {
            Debug.LogError("❌ Error: " + request.error);
        }
    }
}