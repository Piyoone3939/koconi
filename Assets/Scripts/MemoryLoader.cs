using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.Networking;

[System.Serializable]
public class Memory
{
    public int id;
    public string title;
    public string description;
    public string createdAt;
}

public class MemoryLoader : MonoBehaviour
{
    private string apiUrl = "https://koconi.com/memory";

    void Start()
    {
        StartCoroutine(GetMemories());
    }

    IEnumerator GetMemories()
    {
        using (UnityWebRequest request = UnityWebRequest.Get(apiUrl))
        {
            request.SetRequestHeader("Content-Type", "application/json");

            yield return request.SendWebRequest();

            if (request.result == UnityWebRequest.Result.Success)
            {
                Debug.Log($"✅ Response: {request.downloadHandler.text}");

                Memory[] memories = JsonHelper.FromJson<Memory>(request.downloadHandler.text);

                foreach (Memory mem in memories)
                {
                    Debug.Log($"🧠 {mem.id}: {mem.title} - {mem.description}");
                }
            }
            else
            {
                Debug.LogError($"❌ Error: {request.responseCode} - {request.error}");
            }
        }
    }
}