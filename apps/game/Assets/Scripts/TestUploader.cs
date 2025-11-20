using System.Collections;
using UnityEngine;

public class TestUploader : MonoBehaviour
{
    [Header("接続するAIサーバー (AiMatchClient)")]
    public AiMatchClient aiClient;

    [Header("送信するテスト画像 (Texture2D)")]
    public Texture2D testImage;

    private void Start()
    {
        if (aiClient == null)
        {
            Debug.LogError("AiMatchClient が割り当てられていません。");
            return;
        }

        if (testImage == null)
        {
            Debug.LogError("送信する testImage が設定されていません。");
            return;
        }

        StartCoroutine(aiClient.PostImage(testImage));
    }
}