"""Local content editor. Run from any directory; never publish this server."""
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
import json
ROOT = Path(__file__).resolve().parents[2]
class Handler(SimpleHTTPRequestHandler):
    def __init__(self,*args,**kwargs): super().__init__(*args,directory=str(ROOT),**kwargs)
    def do_GET(self):
        if self.headers.get('Host') not in ('127.0.0.1:8766','localhost:8766'):
            self.send_error(403); return
        if self.path == '/editor/':
            body=(ROOT/'tools/christmas-editor/editor.html').read_bytes()
            self.send_response(200); self.send_header('Content-Type','text/html; charset=utf-8'); self.end_headers();self.wfile.write(body)
        else: super().do_GET()
    def do_POST(self): self.send_error(405)
if __name__=='__main__':
    print('Local editor: http://127.0.0.1:8766/editor/ — Ctrl+C to stop')
    ThreadingHTTPServer(('127.0.0.1',8766),Handler).serve_forever()
