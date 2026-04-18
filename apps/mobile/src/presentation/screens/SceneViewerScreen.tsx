import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { WebView } from "react-native-webview";
import type { KoconiGateway } from "../../domain/ports/koconi-gateway";
import type { PlacementScene } from "../../domain/models/koconi";

const apiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL ?? "http://localhost:3000";

function buildImageUrl(imageKey: string): string {
  return `${apiBaseUrl}/v1/images/${encodeURIComponent(imageKey)}`;
}

function buildViewerHtml(scenes: PlacementScene[]): string {
  const imageMap: Record<string, string> = {};
  for (const s of scenes) {
    imageMap[s.direction] = buildImageUrl(s.imageKey);
  }

  const imagesJson = JSON.stringify(imageMap);

  return `<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1, user-scalable=no">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { background: #000; overflow: hidden; }
  canvas { display: block; }
  #loading { position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%); color: #fff; font-size: 16px; font-family: sans-serif; }
  #compass { position: absolute; bottom: 24px; left: 50%; transform: translateX(-50%); color: rgba(255,255,255,0.7); font-size: 14px; font-family: sans-serif; letter-spacing: 2px; }
</style>
</head>
<body>
<div id="loading">読み込み中...</div>
<div id="compass">N</div>
<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
<script>
const IMAGES = ${imagesJson};

// 方位 → 水平角マッピング (北=0, 東=90, 南=180, 西=270)
const DIR_ANGLE = { N: 0, E: 90, S: 180, W: 270 };
const COMPASS_LABELS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];

const W = window.innerWidth, H = window.innerHeight;
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(W, H);
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, W / H, 0.1, 100);
camera.position.set(0, 0, 0);

// デバイス向き
let yaw = 0, pitch = 0;
const RAD = Math.PI / 180;

// ジャイロ
let hasGyro = false;
window.addEventListener('deviceorientation', (e) => {
  if (e.alpha == null) return;
  hasGyro = true;
  yaw = -(e.alpha * RAD);
  pitch = Math.max(-Math.PI/3, Math.min(Math.PI/3, e.beta * RAD - Math.PI/2));
}, true);

// タッチドラッグ（ジャイロなし端末用）
let lastTouch = null;
renderer.domElement.addEventListener('touchstart', (e) => { lastTouch = e.touches[0]; });
renderer.domElement.addEventListener('touchmove', (e) => {
  if (!lastTouch) return;
  const dx = e.touches[0].clientX - lastTouch.clientX;
  const dy = e.touches[0].clientY - lastTouch.clientY;
  yaw -= dx * 0.005;
  pitch = Math.max(-Math.PI/3, Math.min(Math.PI/3, pitch - dy * 0.005));
  lastTouch = e.touches[0];
});

// 各方位の平面パネルを配置 (球面上に配置)
const RADIUS = 5;
const loaded = {};

function addPanel(dir, angleY) {
  const url = IMAGES[dir];
  if (!url) return;
  const tex = new THREE.TextureLoader().load(url, () => {
    loaded[dir] = true;
    if (Object.keys(loaded).length === Object.keys(IMAGES).length) {
      document.getElementById('loading').style.display = 'none';
    }
  });
  const geo = new THREE.PlaneGeometry(4, 3);
  const mat = new THREE.MeshBasicMaterial({ map: tex, side: THREE.DoubleSide });
  const mesh = new THREE.Mesh(geo, mat);
  const angle = angleY * RAD;
  mesh.position.set(Math.sin(angle) * RADIUS, 0, -Math.cos(angle) * RADIUS);
  mesh.lookAt(0, 0, 0);
  mesh.rotateY(Math.PI);
  scene.add(mesh);
}

Object.entries(DIR_ANGLE).forEach(([dir, angle]) => addPanel(dir, angle));

function updateCompass() {
  const deg = ((-yaw / RAD) % 360 + 360) % 360;
  const idx = Math.round(deg / 45) % 8;
  document.getElementById('compass').textContent = COMPASS_LABELS[idx];
}

function animate() {
  requestAnimationFrame(animate);
  const euler = new THREE.Euler(pitch, yaw, 0, 'YXZ');
  camera.quaternion.setFromEuler(euler);
  updateCompass();
  renderer.render(scene, camera);
}
animate();
</script>
</body>
</html>`;
}

export function SceneViewerScreen({
  visible,
  placementId,
  deviceId,
  gateway,
  onClose,
}: {
  visible: boolean;
  placementId: number;
  deviceId: string;
  gateway: KoconiGateway;
  onClose: () => void;
}) {
  const [scenes, setScenes] = useState<PlacementScene[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadScenes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await gateway.listScenes(deviceId, placementId);
      setScenes(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "読み込みに失敗しました");
    } finally {
      setLoading(false);
    }
  }, [gateway, deviceId, placementId]);

  useEffect(() => {
    if (visible) loadScenes();
  }, [visible, loadScenes]);

  const html = scenes.length > 0 ? buildViewerHtml(scenes) : null;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen">
      <View style={styles.container}>
        <Pressable style={styles.closeButton} onPress={onClose}>
          <Text style={styles.closeText}>✕ 閉じる</Text>
        </Pressable>

        {loading && (
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#6366f1" />
          </View>
        )}

        {error && (
          <View style={styles.center}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {scenes.length === 0 && !loading && !error && (
          <View style={styles.center}>
            <Text style={styles.emptyText}>シーンがまだ撮影されていません</Text>
          </View>
        )}

        {html && (
          <WebView
            style={styles.webview}
            source={{ html }}
            allowsInlineMediaPlayback
            mediaPlaybackRequiresUserAction={false}
            originWhitelist={["*"]}
            javaScriptEnabled
          />
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  closeButton: {
    position: "absolute",
    top: 50,
    right: 20,
    zIndex: 10,
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  closeText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
  },
  webview: {
    flex: 1,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  errorText: {
    color: "#f87171",
    fontSize: 16,
    textAlign: "center",
    paddingHorizontal: 32,
  },
  emptyText: {
    color: "#94a3b8",
    fontSize: 16,
    textAlign: "center",
    paddingHorizontal: 32,
  },
});
