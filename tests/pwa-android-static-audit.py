import json
import re
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
PASS = []
WARN = []


def ok(name, detail=""):
    PASS.append((name, detail))


def warn(name, detail=""):
    WARN.append((name, detail))


manifest = json.loads((ROOT / "manifest.json").read_text(encoding="utf-8"))
required = ["id", "name", "short_name", "start_url", "scope", "display", "icons"]
missing = [key for key in required if key not in manifest]
assert not missing, f"manifest missing: {missing}"
assert manifest["display"] == "standalone"
assert manifest["start_url"] == "./"
assert manifest["scope"] == "./"
assert manifest.get("launch_handler", {}).get("client_mode") == "navigate-existing"
ok("Web App Manifest 필수 항목", "standalone / 상대 경로 scope / 단일 창 실행")

icon_specs = {
    "icon-192.png": (192, 192),
    "icon-512.png": (512, 512),
    "icon-maskable-192.png": (192, 192),
    "icon-maskable-512.png": (512, 512),
    "icon-monochrome-512.png": (512, 512),
    "apple-touch-icon.png": (180, 180),
    "play-store-icon-512.png": (512, 512),
}
for filename, expected in icon_specs.items():
    path = ROOT / "icons" / filename
    assert path.exists(), filename
    image = Image.open(path)
    assert image.size == expected, (filename, image.size)
    assert path.stat().st_size <= 1024 * 1024, (filename, path.stat().st_size)
ok("아이콘 규격", "192/512 maskable, 180 Apple, 512 Play Store")

for filename in ["icon-maskable-192.png", "icon-maskable-512.png", "apple-touch-icon.png", "play-store-icon-512.png"]:
    image = Image.open(ROOT / "icons" / filename).convert("RGBA")
    corners = [
        image.getpixel((0, 0))[3],
        image.getpixel((image.width - 1, 0))[3],
        image.getpixel((0, image.height - 1))[3],
        image.getpixel((image.width - 1, image.height - 1))[3],
    ]
    assert all(alpha == 255 for alpha in corners), (filename, corners)
ok("Maskable·스토어 아이콘 풀블리드", "모서리 투명도 없음")

manifest_paths = {entry["src"].split("?")[0].replace("./", "") for entry in manifest["icons"]}
for required_icon in [
    "icons/icon-192.png",
    "icons/icon-512.png",
    "icons/icon-maskable-192.png",
    "icons/icon-maskable-512.png",
]:
    assert required_icon in manifest_paths, required_icon
assert all("?v=468" in entry["src"] for entry in manifest["icons"])
ok("Manifest 아이콘 연결", "모든 아이콘 자산 버전 v=468")

index = (ROOT / "index.html").read_text(encoding="utf-8")
assert "@supabase/supabase-js@2.110.8" in index
assert "@supabase/supabase-js@2\"" not in index
assert 'name="theme-color"' in index
assert 'rel="manifest"' in index
assert 'viewport-fit=cover' in index
ok("웹 의존성과 메타데이터", "Supabase JS 2.110.8 고정, PWA 메타 포함")

service_worker = (ROOT / "service-worker.js").read_text(encoding="utf-8")
assert 'hoonnote-v4-6-0-rc1-cache' in service_worker
assert "handleNavigation" in service_worker
assert "handleStaticAsset" in service_worker
assert "SKIP_WAITING" in service_worker
cached_assets = re.findall(r'^\s*"(\./[^"?]+)(?:\?[^"?]+)?",?$', service_worker, re.M)
for asset in cached_assets:
    assert (ROOT / asset[2:]).exists(), asset
ok("Service Worker 자산과 전략", f"핵심 자산 {len(cached_assets)}개 확인")

package_values = json.loads((ROOT / "android" / "package-values.json").read_text(encoding="utf-8"))
assert package_values["packageId"] == "com.hooncompany.hoonnote"
assert package_values["targetSdkVersion"] == 36
assert package_values["versionName"] == "1.0.0-rc1"
assert package_values["versionCode"] == 1
assert package_values["buildFormat"] == "AAB"
ok("Android 패키지 설정", "package ID / targetSdk 36 / AAB / RC 버전")

asset_template = (ROOT / "android" / "assetlinks.template.json").read_text(encoding="utf-8")
root_template = ROOT / "github-pages-origin-root-template" / ".well-known" / "assetlinks.template.json"
assert root_template.exists()
assert (ROOT / "github-pages-origin-root-template" / "_config.yml").exists()
if "REPLACE_WITH_PLAY_APP_SIGNING_SHA256" in asset_template:
    warn("Digital Asset Links 실서명 지문", "Play 앱 서명 SHA-256 입력 전까지 TWA 주소창 제거를 확정할 수 없음")
else:
    ok("Digital Asset Links 실서명 지문")

print(f"PASS {len(PASS)}")
for name, detail in PASS:
    print(f"- {name}: {detail}")
print(f"WARN {len(WARN)}")
for name, detail in WARN:
    print(f"- {name}: {detail}")
