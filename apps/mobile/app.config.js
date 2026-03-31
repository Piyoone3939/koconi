module.exports = {
  expo: {
    name: "Koconi Mobile",
    slug: "koconi-mobile",
    version: "1.0.0",
    orientation: "portrait",
    platforms: ["ios", "android"],
    jsEngine: "hermes",
    plugins: [
      [
        "@rnmapbox/maps",
        {
          RNMapboxMapsDownloadToken: process.env.MAPBOX_DOWNLOAD_TOKEN ?? "",
        },
      ],
      [
        "expo-image-picker",
        {
          photosPermission:
            "思い出写真を選択するためにフォトライブラリへのアクセスを使用します。",
          cameraPermission:
            "写真を撮影して思い出を記録するためにカメラを使用します。",
        },
      ],
      [
        "expo-location",
        {
          locationWhenInUsePermission:
            "現在地の思い出として保存するため位置情報を使用します。",
        },
      ],
    ],
    extra: {
      eas: {
        projectId: "c8c87c10-f96c-435a-9eac-cfb05b1663e1",
      },
    },
    android: {
      package: "com.koconi.mobile",
    },
  },
};
