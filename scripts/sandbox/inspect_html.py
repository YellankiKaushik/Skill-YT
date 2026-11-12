"""Static offline HTML extraction; never executes page scripts or loads remote URLs."""

import html
import re
import sys
from html.parser import HTMLParser
from pathlib import Path


class TextExtractor(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.text = []
        self.links = []
        self.skip = 0

    def handle_starttag(self, tag, attrs):
        if tag in {"script", "style", "iframe", "object", "embed"}:
            self.skip += 1
        if tag == "a":
            href = dict(attrs).get("href", "")
            if href.startswith("https://"):
                self.links.append(href[:500])

    def handle_endtag(self, tag):
        if tag in {"script", "style", "iframe", "object", "embed"} and self.skip:
            self.skip -= 1

    def handle_data(self, data):
        if not self.skip:
            self.text.append(data)


source = Path(sys.argv[1]).read_text(encoding="utf-8", errors="replace")
parser = TextExtractor()
parser.feed(source[:1_000_000])
print(re.sub(r"\s+", " ", html.unescape(" ".join(parser.text))).strip()[:10000])
print("\nHTTPS_LINKS=" + repr(parser.links[:100]))

