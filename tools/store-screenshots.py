#!/usr/bin/env python3
"""Store-size screenshots of the app, taken from the web export with Playwright.

    npx expo export -p web
    python3 tools/store-screenshots.py                     # -> /home/claude/out/store-shots/
    python3 tools/store-screenshots.py --dist dist --out shots --port 8106

Makes, for each screen below:
  ios-6.9-<n>-<name>.png       1320 x 2868  App Store, iPhone 6.9" (iPhone 17 Pro Max class)
  ios-6.3-<n>-<name>.png       1206 x 2622  App Store, iPhone 6.3" (the size App Store Connect requires)
  android-phone-<n>-<name>.png 1080 x 1920  Google Play phone, 9:16, big enough for Play's promotion slots
and the two Google Play listing graphics:
  play-icon-512.png            512 x 512    Play's hi-res icon (from assets/images/icon.png)
  play-feature-graphic.png     1024 x 500   Play's feature graphic (from assets/ui/ombrellino.svg)

The web export is a stand-in for the phone: good for drafts and for checking layout, but take the final store
screenshots on a real iPhone and Android phone (or simulators) so the status bar, fonts and maps are exactly what
people will see. Every image is saved without an alpha channel, as both stores require for screenshots.
Nothing here signs in or writes to the backend; the member screens are shown signed out.
"""
import argparse
import base64
import functools
import http.server
import io
import os
import socketserver
import threading
from pathlib import Path

from PIL import Image
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parent.parent

# (css width, css height, device scale) -> exact store pixel sizes
DEVICES = {
    "ios-6.9": (440, 956, 3),          # 1320 x 2868
    "ios-6.3": (402, 874, 3),          # 1206 x 2622
    "android-phone": (432, 768, 2.5),  # 1080 x 1920
}

BALTIMORE = "baltimore-basilica-of-the-national-shrine-of-the-assumption-of-the-bvm"
SCREENS = [
    ("map", "/", None),
    ("basilicas", "/list", None),
    ("basilica", f"/basilica/{BALTIMORE}", None),
    ("near-you", "/near", "zip"),
    ("my-pilgrimage", "/mine", None),
    ("sign-in", "/signin", None),
]
ZIP = "21201"   # downtown Baltimore: a neutral example, not anyone's home


class SPAHandler(http.server.SimpleHTTPRequestHandler):
    """Serves the export and falls back to index.html for app routes (web output is a single-page app)."""

    def log_message(self, *a):
        pass

    def send_head(self):
        path = self.translate_path(self.path.split("?")[0])
        if not os.path.exists(path):
            self.path = "/index.html"
        return super().send_head()


def serve(dist: Path, port: int):
    handler = functools.partial(SPAHandler, directory=str(dist))
    socketserver.TCPServer.allow_reuse_address = True
    httpd = socketserver.TCPServer(("127.0.0.1", port), handler)
    threading.Thread(target=httpd.serve_forever, daemon=True).start()
    return httpd


def save_rgb(png: bytes, path: Path, size=None):
    im = Image.open(io.BytesIO(png)).convert("RGB")
    if size and im.size != size:
        im = im.resize(size, Image.LANCZOS)
    im.save(path, optimize=True)
    return im.size


def feature_graphic_html() -> str:
    svg = (ROOT / "assets/ui/ombrellino.svg").read_text()
    fonts = ROOT / "node_modules/@expo-google-fonts/source-sans-3"
    # inline the site's font: a page set from a string can't load file:// fonts
    b64 = lambda g: base64.b64encode(next(fonts.glob(g)).read_bytes()).decode()
    font, font_reg = b64("700Bold/*.ttf"), b64("400Regular/*.ttf")
    return f"""<!doctype html><html><head><style>
@font-face {{ font-family: SS3; font-weight: 700; src: url(data:font/ttf;base64,{font}); }}
@font-face {{ font-family: SS3; font-weight: 400; src: url(data:font/ttf;base64,{font_reg}); }}
html,body {{ margin:0; width:1024px; height:500px; }}
body {{ background:#000; display:flex; align-items:center; font-family:SS3; overflow:hidden; position:relative; }}
.band {{ position:absolute; left:0; right:0; height:10px;
  background:repeating-linear-gradient(90deg,#8f1d1d 0 32px,#d9a521 32px 64px); }}
.top {{ top:0 }} .bottom {{ bottom:0 }}
.paper {{ position:absolute; inset:22px; background:#f7f2e7; border:2px solid #d9a521; border-radius:6px;
  box-shadow: inset 0 0 0 6px #f7f2e7, inset 0 0 0 7px #b9a678; }}
.art {{ position:relative; width:250px; height:420px; margin-left:70px; }}
.art svg {{ width:100%; height:100%; }}
.text {{ position:relative; margin-left:46px; }}
.kicker {{ color:#8f1d1d; font-size:24px; font-weight:700; letter-spacing:4px; text-transform:uppercase; }}
h1 {{ margin:6px 0 10px; color:#221c14; font-size:72px; line-height:1; font-weight:700; }}
p {{ margin:0; color:#4f4636; font-size:30px; font-weight:400; max-width:560px; }}
</style></head><body>
<div class="band top"></div><div class="band bottom"></div><div class="paper"></div>
<div class="art">{svg}</div>
<div class="text"><div class="kicker">A pilgrim&rsquo;s guide</div>
<h1>American<br>Basilicas</h1>
<p>All 94 minor basilicas of the United States, on one illustrated map.</p></div>
</body></html>"""


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--dist", default=str(ROOT / "dist"))
    ap.add_argument("--out", default="/home/claude/out/store-shots")
    ap.add_argument("--port", type=int, default=8106)
    args = ap.parse_args()
    dist, out = Path(args.dist), Path(args.out)
    if not (dist / "index.html").exists():
        raise SystemExit(f"No web export at {dist}. Run: npx expo export -p web")
    out.mkdir(parents=True, exist_ok=True)
    httpd = serve(dist, args.port)
    base = f"http://127.0.0.1:{args.port}"
    made = []
    try:
        with sync_playwright() as p:
            browser = p.chromium.launch()
            for dev, (w, h, scale) in DEVICES.items():
                ctx = browser.new_context(viewport={"width": w, "height": h}, device_scale_factor=scale,
                                          is_mobile=True, has_touch=True, locale="en-US")
                page = ctx.new_page()
                for i, (name, route, action) in enumerate(SCREENS, 1):
                    page.goto(base + route, wait_until="networkidle")
                    page.wait_for_timeout(1200)
                    if action == "zip":
                        page.get_by_placeholder("or ZIP code").fill(ZIP)
                        page.get_by_text("Find", exact=True).click()
                        page.wait_for_timeout(700)
                    target = (round(w * scale), round(h * scale))
                    path = out / f"{dev}-{i}-{name}.png"
                    size = save_rgb(page.screenshot(), path, target)
                    made.append((path.name, size))
                ctx.close()

            # Google Play listing graphics
            icon = Image.open(ROOT / "assets/images/icon.png").convert("RGBA").resize((512, 512), Image.LANCZOS)
            icon.save(out / "play-icon-512.png", optimize=True)          # Play asks for a 32-bit PNG
            made.append(("play-icon-512.png", icon.size))
            ctx = browser.new_context(viewport={"width": 1024, "height": 500}, device_scale_factor=1)
            page = ctx.new_page()
            page.set_content(feature_graphic_html(), wait_until="load")
            page.wait_for_timeout(400)
            size = save_rgb(page.screenshot(), out / "play-feature-graphic.png", (1024, 500))
            made.append(("play-feature-graphic.png", size))
            browser.close()
    finally:
        httpd.shutdown()
    for name, size in made:
        print(f"{size[0]:>5} x {size[1]:<5} {out / name}")


if __name__ == "__main__":
    main()
