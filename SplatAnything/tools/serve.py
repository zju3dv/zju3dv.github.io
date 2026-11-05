#!/usr/bin/env python3
"""Preview the project page with byte-range support for seekable video.

Run from any directory: python3 tools/serve.py [8080]
"""

import argparse
from functools import partial
from http import HTTPStatus
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
import os
from pathlib import Path
import re


class RangeRequestHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        if getattr(self, "range_supported", False):
            self.send_header("Accept-Ranges", "bytes")
        super().end_headers()

    def send_head(self):
        self.byte_range = None
        path = self.translate_path(self.path)
        self.range_supported = os.path.isfile(path)
        requested = self.headers.get("Range", "")
        match = re.fullmatch(r"bytes=(\d*)-(\d*)", requested)
        if (
            self.command != "GET"
            or not self.range_supported
            or not match
            or not any(match.groups())
        ):
            return super().send_head()

        try:
            source = open(path, "rb")
        except OSError:
            self.send_error(HTTPStatus.NOT_FOUND, "File not found")
            return None

        try:
            stat = os.fstat(source.fileno())
            modified = self.date_time_string(stat.st_mtime)
            # If the browser's cached version differs, send the complete file.
            if_range = self.headers.get("If-Range")
            if if_range and if_range != modified:
                source.close()
                return super().send_head()

            size = stat.st_size
            first, last = match.groups()
            if first:
                start = int(first)
                end = min(int(last), size - 1) if last else size - 1
            else:
                start = max(0, size - int(last))
                end = size - 1

            if size == 0 or start >= size or start > end:
                source.close()
                self.send_response(HTTPStatus.REQUESTED_RANGE_NOT_SATISFIABLE)
                self.send_header("Content-Range", f"bytes */{size}")
                self.send_header("Content-Length", "0")
                self.end_headers()
                return None

            self.byte_range = (start, end)
            self.send_response(HTTPStatus.PARTIAL_CONTENT)
            self.send_header("Content-Type", self.guess_type(path))
            self.send_header("Content-Length", str(end - start + 1))
            self.send_header("Content-Range", f"bytes {start}-{end}/{size}")
            self.send_header("Last-Modified", modified)
            self.end_headers()
            source.seek(start)
            return source
        except BaseException:
            source.close()
            raise

    def copyfile(self, source, outputfile):
        try:
            if self.byte_range is None:
                return super().copyfile(source, outputfile)
            start, end = self.byte_range
            remaining = end - start + 1
            while remaining:
                chunk = source.read(min(64 * 1024, remaining))
                if not chunk:
                    break
                outputfile.write(chunk)
                remaining -= len(chunk)
        except (BrokenPipeError, ConnectionResetError):
            # Video seeking normally cancels the previous download connection.
            pass


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("port", nargs="?", type=int, default=8080)
    parser.add_argument("--bind", default="0.0.0.0")
    parser.add_argument(
        "--directory", type=Path, default=Path(__file__).resolve().parent.parent
    )
    args = parser.parse_args()
    handler = partial(RangeRequestHandler, directory=str(args.directory.resolve()))
    with ThreadingHTTPServer((args.bind, args.port), handler) as server:
        print(f"Serving {args.directory.resolve()} at http://localhost:{server.server_port}", flush=True)
        try:
            server.serve_forever()
        except KeyboardInterrupt:
            pass


if __name__ == "__main__":
    main()
