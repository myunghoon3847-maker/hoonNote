import asyncio
import contextlib
import http.server
import socket
import threading
from pathlib import Path

from playwright.async_api import async_playwright

ROOT = Path(__file__).resolve().parent.parent


class QuietHandler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *_args):
        pass


def free_port():
    with socket.socket() as sock:
        sock.bind(("127.0.0.1", 0))
        return sock.getsockname()[1]


@contextlib.contextmanager
def local_server():
    port = free_port()
    handler = lambda *args, **kwargs: QuietHandler(*args, directory=str(ROOT), **kwargs)
    server = http.server.ThreadingHTTPServer(("127.0.0.1", port), handler)
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    try:
        yield f"http://127.0.0.1:{port}"
    finally:
        server.shutdown()
        thread.join(timeout=3)


SUPABASE_STUB = r'''
window.supabase={createClient(){return {
 auth:{
   getSession:async()=>({data:{session:null},error:null}),
   getUser:async()=>({data:{user:null},error:null}),
   onAuthStateChange:()=>({data:{subscription:{unsubscribe(){}}}}),
   signOut:async()=>({error:null})
 }
}}};
'''


async def run():
    with local_server() as base_url:
        async with async_playwright() as pw:
            browser = await pw.chromium.launch(
                headless=True,
                executable_path="/usr/bin/chromium",
                args=["--no-sandbox"],
            )
            context = await browser.new_context(service_workers="allow")
            await context.route("https://cdn.jsdelivr.net/**", lambda route: route.fulfill(
                status=200,
                content_type="application/javascript",
                body=SUPABASE_STUB,
            ))
            page = await context.new_page()
            errors = []
            page.on("pageerror", lambda error: errors.append(str(error)))

            try:
                await page.goto(f"{base_url}/?v=468", wait_until="load")
            except Exception as error:
                if "ERR_BLOCKED_BY_ADMINISTRATOR" in str(error):
                    await context.close()
                    await browser.close()
                    print("SKIP: local HTTP access is blocked by this execution environment")
                    return
                raise
            await page.wait_for_function("navigator.serviceWorker && navigator.serviceWorker.ready")
            await page.evaluate("navigator.serviceWorker.ready.then(() => true)")
            await page.wait_for_timeout(500)

            manifest = await page.evaluate("fetch('./manifest.json?v=468').then(r=>r.json())")
            assert manifest["display"] == "standalone"
            assert manifest["scope"] == "./"
            assert manifest["launch_handler"]["client_mode"] == "navigate-existing"
            assert any(icon.get("purpose") == "maskable" for icon in manifest["icons"])

            sw_state = await page.evaluate('''async () => {
              const registration = await navigator.serviceWorker.ready;
              const keys = await caches.keys();
              const cache = await caches.open('hoonnote-v4-6-0-rc1-cache');
              const cached = await cache.keys();
              return {
                active: Boolean(registration.active),
                cacheNames: keys,
                cachedUrls: cached.map(request => request.url),
              };
            }''')
            assert sw_state["active"]
            assert "hoonnote-v4-6-0-rc1-cache" in sw_state["cacheNames"]
            assert any(url.endswith("/index.html") for url in sw_state["cachedUrls"])
            assert any("style.css?v=468" in url for url in sw_state["cachedUrls"])

            await context.set_offline(True)
            await page.reload(wait_until="domcontentloaded")
            await page.wait_for_timeout(300)
            assert await page.title() == "훈노트 - 1인 업무·아이디어 노트"
            assert await page.locator("#authScreen").count() == 1
            assert await page.locator("#authTitle").inner_text() == "훈노트"
            assert not errors, errors

            await context.close()
            await browser.close()
    print("PASS: PWA install cache and offline app shell")


if __name__ == "__main__":
    asyncio.run(run())
