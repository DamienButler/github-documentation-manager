// Injected into every documentation page shown in the viewer.
//
// The viewer is a separate native webview, so the app's own UI cannot reach
// into it. Rather than granting Tauri IPC to arbitrary remote origins just to
// report match counts, the whole find experience lives here, inside the page.
// Nothing is sent back to the host.
(function () {
  'use strict';

  // Initialisation scripts run in every frame. Only the top document should
  // own the find bar, or embedded content (ads, video players, code sandboxes)
  // would each grow one of their own.
  try {
    if (window.top !== window.self) return;
  } catch (e) {
    return; // cross-origin parent — definitely not the top frame
  }

  if (window.__docuFind) return; // survive re-injection
  window.__docuFind = true;

  var HL = 'docu-find-hit';
  var CUR = 'docu-find-current';
  var hits = [];
  var index = -1;
  var bar = null;
  var input = null;
  var status = null;

  // ---------- highlighting ----------

  function clear() {
    var marks = document.querySelectorAll('mark.' + HL);
    for (var i = 0; i < marks.length; i++) {
      var m = marks[i];
      var parent = m.parentNode;
      if (!parent) continue;
      parent.replaceChild(document.createTextNode(m.textContent), m);
      parent.normalize(); // stitch the split text nodes back together
    }
    hits = [];
    index = -1;
  }

  var SKIP = { SCRIPT: 1, STYLE: 1, NOSCRIPT: 1, TEXTAREA: 1, IFRAME: 1, SVG: 1 };

  function textNodes() {
    var out = [];
    var walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
      acceptNode: function (node) {
        if (!node.nodeValue || !node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
        var p = node.parentElement;
        if (!p) return NodeFilter.FILTER_REJECT;
        if (SKIP[p.tagName]) return NodeFilter.FILTER_REJECT;
        if (p.closest('.docu-find-bar')) return NodeFilter.FILTER_REJECT;
        // Cheap visibility test; offsetParent is null for display:none subtrees.
        if (!p.offsetParent && p.tagName !== 'BODY') return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    });
    var n;
    while ((n = walker.nextNode())) out.push(n);
    return out;
  }

  function search(term) {
    clear();
    if (!term) { render(); return; }

    var needle = term.toLowerCase();
    var nodes = textNodes();

    for (var i = 0; i < nodes.length; i++) {
      var node = nodes[i];
      var text = node.nodeValue;
      var lower = text.toLowerCase();
      var at = lower.indexOf(needle);
      if (at === -1) continue;

      // Split the node into [before][match][rest] repeatedly.
      var current = node;
      while (at !== -1) {
        var matchNode = current.splitText(at);
        current = matchNode.splitText(needle.length); // remainder

        var mark = document.createElement('mark');
        mark.className = HL;
        mark.textContent = matchNode.textContent;
        matchNode.parentNode.replaceChild(mark, matchNode);
        hits.push(mark);

        lower = current.nodeValue.toLowerCase();
        at = lower.indexOf(needle);
      }
    }

    index = hits.length ? 0 : -1;
    focusHit();
    render();
  }

  function focusHit() {
    for (var i = 0; i < hits.length; i++) hits[i].classList.remove(CUR);
    if (index < 0 || !hits[index]) return;
    var el = hits[index];
    el.classList.add(CUR);
    el.scrollIntoView({ block: 'center', inline: 'nearest' });
  }

  function step(delta) {
    if (!hits.length) return;
    index = (index + delta + hits.length) % hits.length;
    focusHit();
    render();
  }

  function render() {
    if (!status) return;
    var term = input.value;
    if (!term) status.textContent = '';
    else if (!hits.length) status.textContent = 'Not found';
    else status.textContent = (index + 1) + ' of ' + hits.length;
  }

  // ---------- the bar ----------

  function styles() {
    if (document.getElementById('docu-find-style')) return;
    var css = document.createElement('style');
    css.id = 'docu-find-style';
    css.textContent =
      'mark.' + HL + '{background:#ffe066;color:#000;padding:0;border-radius:2px}' +
      'mark.' + CUR + '{background:#ff9c33;box-shadow:0 0 0 2px rgba(255,156,51,.6)}' +
      '.docu-find-bar{position:fixed;top:12px;right:12px;z-index:2147483647;display:flex;' +
      'align-items:center;gap:6px;padding:6px 8px;background:#161b22;border:1px solid #30363d;' +
      'border-radius:8px;box-shadow:0 6px 20px rgba(0,0,0,.35);' +
      'font:13px -apple-system,BlinkMacSystemFont,"Segoe UI",Helvetica,Arial,sans-serif;color:#e6edf3}' +
      '.docu-find-bar input{width:190px;padding:4px 8px;background:#0d1117;color:#e6edf3;' +
      'border:1px solid #30363d;border-radius:6px;font:inherit;outline:none}' +
      '.docu-find-bar input:focus{border-color:#2f81f7}' +
      '.docu-find-bar button{padding:3px 8px;background:transparent;border:1px solid #30363d;' +
      'border-radius:6px;color:#e6edf3;font:inherit;cursor:pointer;line-height:1.4}' +
      '.docu-find-bar button:hover{background:#1f2630}' +
      '.docu-find-bar .docu-find-status{min-width:74px;color:#8b949e;font-size:12px;text-align:right}';
    (document.head || document.documentElement).appendChild(css);
  }

  function build() {
    styles();
    bar = document.createElement('div');
    bar.className = 'docu-find-bar';

    input = document.createElement('input');
    input.type = 'text';
    input.placeholder = 'Find in page';
    input.setAttribute('aria-label', 'Find in page');

    status = document.createElement('span');
    status.className = 'docu-find-status';

    var prev = document.createElement('button');
    prev.textContent = '\u2191';
    prev.title = 'Previous match (Shift-Enter)';

    var next = document.createElement('button');
    next.textContent = '\u2193';
    next.title = 'Next match (Enter)';

    var close = document.createElement('button');
    close.textContent = '\u2715';
    close.title = 'Close (Escape)';

    bar.appendChild(input);
    bar.appendChild(status);
    bar.appendChild(prev);
    bar.appendChild(next);
    bar.appendChild(close);
    document.body.appendChild(bar);

    var timer;
    input.addEventListener('input', function () {
      clearTimeout(timer);
      timer = setTimeout(function () { search(input.value); }, 120);
    });
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { e.preventDefault(); step(e.shiftKey ? -1 : 1); }
      if (e.key === 'Escape') { e.preventDefault(); hide(); }
    });
    prev.addEventListener('click', function () { step(-1); });
    next.addEventListener('click', function () { step(1); });
    close.addEventListener('click', hide);
  }

  function show() {
    if (!document.body) return;
    if (!bar) build();
    bar.style.display = 'flex';
    input.focus();
    input.select();
  }

  function hide() {
    clear();
    if (bar) bar.style.display = 'none';
  }

  window.__docuFindOpen = show;

  document.addEventListener('keydown', function (e) {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'f') {
      e.preventDefault();
      show();
    }
  });
})();
