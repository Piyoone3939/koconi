"""
localhost.run でトンネルを張り、公開URLを PUBLIC_URL にセットして uvicorn を起動する。

使い方:
  python start_with_tunnel.py
  python start_with_tunnel.py --host 0.0.0.0 --port 8000
"""

import argparse
import os
import re
import subprocess
import sys
import threading


URL_PATTERN = re.compile(r"https://[a-zA-Z0-9\-]+\.lhr\.life")


def _tail_tunnel(proc: subprocess.Popen, found_event: threading.Event, url_box: list[str]) -> None:
    """localhost.run の stderr を読み続け、URL を見つけたら url_box にセットする。"""
    assert proc.stderr is not None
    for raw in proc.stderr:
        line = raw.decode(errors="replace")
        print(f"[tunnel] {line}", end="", flush=True)
        if not found_event.is_set():
            m = URL_PATTERN.search(line)
            if m:
                url_box.append(m.group(0))
                found_event.set()


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--host", default="0.0.0.0")
    parser.add_argument("--port", default="8000")
    parser.add_argument("--app", default="serve:app")
    args = parser.parse_args()

    port = args.port

    # ── localhost.run SSH トンネル起動 ──────────────────────────────────────
    tunnel_cmd = [
        "ssh",
        "-R", f"80:localhost:{port}",
        "-o", "StrictHostKeyChecking=no",
        "-o", "ServerAliveInterval=30",
        "nokey@localhost.run",
    ]
    print(f"[*] トンネル起動: {' '.join(tunnel_cmd)}")
    tunnel_proc = subprocess.Popen(
        tunnel_cmd,
        stderr=subprocess.PIPE,
        stdout=subprocess.DEVNULL,
    )

    url_box: list[str] = []
    found_event = threading.Event()

    reader = threading.Thread(
        target=_tail_tunnel,
        args=(tunnel_proc, found_event, url_box),
        daemon=True,
    )
    reader.start()

    print("[*] 公開URLを待機中...")
    if not found_event.wait(timeout=30):
        print("[!] 30秒以内にURLを取得できませんでした。トンネルのログを確認してください。", file=sys.stderr)
        tunnel_proc.terminate()
        sys.exit(1)

    public_url = url_box[0]
    print(f"[+] PUBLIC_URL = {public_url}")

    # ── uvicorn 起動 ────────────────────────────────────────────────────────
    env = os.environ.copy()
    env["PUBLIC_URL"] = public_url

    uvicorn_cmd = [
        sys.executable, "-m", "uvicorn",
        args.app,
        "--host", args.host,
        "--port", port,
    ]
    print(f"[*] uvicorn 起動: {' '.join(uvicorn_cmd)}")
    uvicorn_proc = subprocess.Popen(uvicorn_cmd, env=env)

    try:
        uvicorn_proc.wait()
    except KeyboardInterrupt:
        print("\n[*] 終了シグナルを受信。プロセスを停止します...")
    finally:
        uvicorn_proc.terminate()
        tunnel_proc.terminate()


if __name__ == "__main__":
    main()
