#!/usr/bin/env python3
"""
GitHub Webhook receiver for auto-deployment.
Listens on port 9000, verifies HMAC-SHA256 signature,
and triggers the auto-deploy script.
"""

import os
import sys
import hmac
import hashlib
import json
import subprocess
import logging
from http.server import HTTPServer, BaseHTTPRequestHandler

# Configuration
WEBHOOK_SECRET = os.environ.get("GITHUB_WEBHOOK_SECRET", "")
DEPLOY_SCRIPT = os.environ.get("DEPLOY_SCRIPT", "/opt/zmjd/deploy/auto-deploy.sh")
LISTEN_HOST = os.environ.get("LISTEN_HOST", "0.0.0.0")
LISTEN_PORT = int(os.environ.get("LISTEN_PORT", "9000"))

LOG_PATH = "/var/log/zmjd-webhook.log"

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.FileHandler(LOG_PATH),
        logging.StreamHandler(sys.stdout),
    ],
)
logger = logging.getLogger("webhook")


def verify_signature(payload: bytes, signature: str) -> bool:
    """Verify GitHub webhook HMAC-SHA256 signature."""
    if not WEBHOOK_SECRET:
        logger.warning("GITHUB_WEBHOOK_SECRET is not set, skipping verification")
        return True
    if not signature:
        return False
    expected = "sha256=" + hmac.new(
        WEBHOOK_SECRET.encode("utf-8"),
        payload,
        hashlib.sha256,
    ).hexdigest()
    return hmac.compare_digest(expected, signature)


def trigger_deploy() -> None:
    """Run the auto-deploy script in background."""
    if not os.path.isfile(DEPLOY_SCRIPT):
        logger.error("Deploy script not found: %s", DEPLOY_SCRIPT)
        return
    try:
        subprocess.Popen(
            ["bash", DEPLOY_SCRIPT],
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )
        logger.info("Triggered deploy script: %s", DEPLOY_SCRIPT)
    except Exception as e:
        logger.error("Failed to trigger deploy script: %s", e)


class WebhookHandler(BaseHTTPRequestHandler):
    def do_POST(self):
        if self.path != "/webhook":
            self.send_response(404)
            self.end_headers()
            return

        content_length = int(self.headers.get("Content-Length", 0))
        payload = self.rfile.read(content_length)

        signature = self.headers.get("X-Hub-Signature-256", "")
        event = self.headers.get("X-GitHub-Event", "")

        if not verify_signature(payload, signature):
            logger.warning("Invalid webhook signature")
            self.send_response(403)
            self.end_headers()
            return

        if event != "push":
            logger.info("Ignoring non-push event: %s", event)
            self.send_response(200)
            self.end_headers()
            return

        try:
            data = json.loads(payload)
            ref = data.get("ref", "")
            if ref == "refs/heads/main":
                logger.info("Received push to main, triggering deployment")
                trigger_deploy()
            else:
                logger.info("Push to non-main branch (%s), ignoring", ref)
        except json.JSONDecodeError:
            logger.error("Failed to decode JSON payload")

        self.send_response(200)
        self.end_headers()

    def log_message(self, format, *args):
        logger.info("%s - %s", self.address_string(), format % args)


def main():
    server = HTTPServer((LISTEN_HOST, LISTEN_PORT), WebhookHandler)
    logger.info("Webhook server listening on %s:%d", LISTEN_HOST, LISTEN_PORT)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        logger.info("Shutting down webhook server")
        server.shutdown()


if __name__ == "__main__":
    main()
