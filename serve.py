# CodeSphere Pro - Local Development Server Utility
import http.server
import socketserver
import os

PORT = 3000

class DevHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # Disable browser cache for seamless dynamic JS modules debugging
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()

    def guess_type(self, path):
        if path.endswith('.js'):
            return 'application/javascript'
        return super().guess_type(path)

# Set path working directory
os.chdir(os.path.dirname(os.path.abspath(__file__)))

socketserver.TCPServer.allow_reuse_address = True
try:
    with socketserver.TCPServer(("", PORT), DevHTTPRequestHandler) as httpd:
        print("\n" + "="*55)
        print(f" CodeSphere Pro Sandbox Server Launched Successfully!")
        print(f" Local Dev URL: http://localhost:{PORT}")
        print("="*55 + "\n")
        httpd.serve_forever()
except KeyboardInterrupt:
    print("\nShutting down server.")
except Exception as e:
    print(f"\nError running server: {e}")
