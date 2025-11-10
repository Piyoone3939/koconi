using System.Collections;
using System.IO;
using System.Linq;
using UnityEngine;
using UnityEngine.Networking;

public class AiMatchClient : MonoBehaviour
{
    [SerializeField] private string apiUrl = "https://koconi.com/match";

    public IEnumerator PostImage(Texture2D image)
    {
        byte[] bytes = image.EncodeToJPG();
        WWWForm form = new WWWForm();
        form.AddBinaryData("file", bytes, "upload.jpg", "image/jpeg");

        using (UnityWebRequest www = UnityWebRequest.Post(apiUrl, form))
        {
            yield return www.SendWebRequest();

            if (www.result == UnityWebRequest.Result.Success)
            {
                string json = www.downloadHandler.text;
                Debug.Log("Response: " + json);

                // JSON → C#オブジェクトに変換
                MatchResponse response = JsonUtility.FromJson<MatchResponse>(json);

                if (response != null && response.candidates != null && response.candidates.Count > 0)
                {
                    // 無効スコアを除外してスコア順にソート
                    var validCandidates = response.candidates
                        .Where(c => c.match_score > -1e+10f)
                        .OrderByDescending(c => c.match_score)
                        .ToList();

                    if (validCandidates.Count > 0)
                    {
                        var top = validCandidates.First(); // スコアが最も高いもの
                        Debug.Log($"✅ Top Match: {top.asset_id} | Score: {top.match_score:F3}");
                    }
                    else
                    {
                        Debug.LogWarning("有効な候補がありません。");
                    }
                }
                else
                {
                    Debug.LogWarning("JSONのパースに失敗しました。");
                }
            }
            else
            {
                Debug.LogError("Error: " + www.error);
            }
        }
    }
}