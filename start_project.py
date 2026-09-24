import subprocess, time, urllib.request, sys, os

ROOT = os.path.dirname(os.path.abspath(__file__))
backend_cmd = [sys.executable, "backend/main.py"]
frontend_cmd = ["node", os.path.join(ROOT, "node_modules", "vite", "bin", "vite.js"), "--host", "0.0.0.0"]

print("Starting backend:", " ".join(backend_cmd))
b = subprocess.Popen(backend_cmd, cwd=ROOT, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True)

print("Starting frontend:", " ".join(frontend_cmd))
f = subprocess.Popen(frontend_cmd, cwd=ROOT, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True)

def fetch(url, timeout=8):
    try:
        with urllib.request.urlopen(url, timeout=timeout) as r:
            return r.status, r.read().decode("utf-8", "replace")[:400]
    except Exception as e:
        return "ERR", str(e)

print("Waiting for servers to come up...")
for i in range(12):
    time.sleep(1)
    bs, bc = fetch("http://127.0.0.1:8000/state")
    fs, fc = fetch("http://127.0.0.1:5173/")
    print(f"  [{i+1}] backend {bs} | frontend {fs}")
    if bs == 200 and fs == 200:
        print("\nBackend /state:\n", bc)
        print("\nFrontend /:\n", fc)
        print("\nBoth servers are running.")
        print(f"  Backend:  http://127.0.0.1:8000   (API docs: http://127.0.0.1:8000/docs)")
        print(f"  Frontend: http://127.0.0.1:5173")
        print("\nPress Ctrl+C to stop. Leaving servers running in background...")
        # detach stdout so the terminal is free; keep processes alive
        sys.stdout.flush()
        try:
            while True:
                time.sleep(60)
        except KeyboardInterrupt:
            print("\nShutting down...")
            b.terminate(); f.terminate()
            b.wait(); f.wait()
        sys.exit(0)
    if bs != 200 and fs != 200:
        # print a bit of stderr if both failing
        pass

print("\nTimed out. Backend stderr sample:")
print(b.stderr.read() if b.stderr else "(no stderr)")
print("\nFrontend stderr sample:")
print(f.stderr.read() if f.stderr else "(no stderr)")
b.terminate(); f.terminate()
b.wait(); f.wait()
sys.exit(1)
