"""Render the website's illustrated map (state tints, shaded relief, lakes, rivers) as one image for the app.

The app draws basilica markers and labels on top of this image, so they stay sharp when zoomed.
Usage: python3 tools/render-basemap.py <path to the american-basilicas website repo>
Needs: pip install playwright, and Google Chrome (or `playwright install chromium`).
"""
import sys, subprocess, time, pathlib, http.server, threading, functools
from playwright.sync_api import sync_playwright
from PIL import Image

SITE = pathlib.Path(sys.argv[1]).resolve()
OUT = pathlib.Path(__file__).resolve().parent.parent / "assets" / "map"
SCALE = 3                     # 960x600 map units -> 2880x1800 px

handler = functools.partial(http.server.SimpleHTTPRequestHandler, directory=str(SITE))
srv = http.server.ThreadingHTTPServer(("127.0.0.1", 0), handler)
threading.Thread(target=srv.serve_forever, daemon=True).start()
url = f"http://127.0.0.1:{srv.server_address[1]}/index.html"

HIDE = """
  svg#map{width:960px!important;height:600px!important;max-width:none!important}
  svg#map text, svg#map use.marker, svg#map g.city, svg#map g.blabels, svg#map g.citylabels,
  svg#map .marker, svg#map .citymark, .rule, .legend { display:none!important }
"""
with sync_playwright() as p:
    exe = "/usr/bin/google-chrome" if pathlib.Path("/usr/bin/google-chrome").exists() else None
    b = p.chromium.launch(executable_path=exe) if exe else p.chromium.launch()
    pg = b.new_page(viewport={"width": 1400, "height": 1200}, device_scale_factor=SCALE)
    pg.route("**/*", lambda r: r.abort() if not r.request.url.startswith(url.rsplit("/", 1)[0]) else r.continue_())
    pg.goto(url, wait_until="load")
    pg.add_style_tag(content=HIDE)
    pg.wait_for_timeout(1500)
    el = pg.query_selector("svg#map")
    box = el.bounding_box(); print("map box", box)
    el.screenshot(path=str(OUT / "basemap.png"), animations="disabled")
    b.close()
srv.shutdown()
im = Image.open(OUT / "basemap.png").convert("RGB").resize((960 * SCALE, 600 * SCALE), Image.LANCZOS)
print("rendered", im.size)
im.save(OUT / "basemap.webp", "WEBP", quality=82, method=6)
(OUT / "basemap.png").unlink()
print("wrote", OUT / "basemap.webp", (OUT / "basemap.webp").stat().st_size // 1024, "KB")
