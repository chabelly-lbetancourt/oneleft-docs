#!/usr/bin/env bash
# Renders the output of a command as a terminal-looking PNG screenshot.
# Usage: command | tools/capture-terminal.sh "title" output.png ["$ command shown"]
set -euo pipefail
TITLE="$1"; OUT="$2"; CMD="${3:-}"
CHROME="${CHROME:-/Applications/Google Chrome.app/Contents/MacOS/Google Chrome}"
TMP="$(mktemp -d)"
BODY="$(sed -e 's/&/\&amp;/g' -e 's/</\&lt;/g' -e 's/>/\&gt;/g')"
CMDHTML="$(printf '%s' "$CMD" | sed -e 's/&/\&amp;/g' -e 's/</\&lt;/g' -e 's/>/\&gt;/g')"
CMDBLOCK=""; [ -n "$CMD" ] && CMDBLOCK="<span class=\"c\">$CMDHTML</span>"$'\n'
LINES=$(( $(printf '%s\n' "$BODY" | wc -l) + 5 ))
HEIGHT=$(( LINES * 22 + 70 ))
cat > "$TMP/t.html" <<HTML
<!doctype html><html><head><meta charset="utf-8"><style>
body{margin:0;background:#e5e7eb;font-family:-apple-system,Helvetica,sans-serif}
.w{margin:16px;border-radius:10px;overflow:hidden;box-shadow:0 8px 24px rgba(0,0,0,.25)}
.b{background:#2d2f33;color:#ccc;font-size:13px;padding:9px 12px;display:flex;align-items:center;gap:8px}
.d{width:12px;height:12px;border-radius:50%;display:inline-block}
pre{margin:0;background:#1e1f22;color:#e6e6e6;font:14px/22px Menlo,monospace;padding:14px 18px;white-space:pre}
.c{color:#7ee787}
</style></head><body><div class="w"><div class="b"><span class="d" style="background:#ff5f57"></span><span class="d" style="background:#febc2e"></span><span class="d" style="background:#28c840"></span><span style="margin-left:8px">$TITLE</span></div>
<pre>${CMDBLOCK}${BODY}</pre></div></body></html>
HTML
"$CHROME" --headless=new --disable-gpu --hide-scrollbars --window-size=1200,"$HEIGHT" --screenshot="$OUT" "file://$TMP/t.html" >/dev/null 2>&1
rm -rf "$TMP"
echo "$OUT"
