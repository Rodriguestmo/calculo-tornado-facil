/* Preferências de leitura + notas Gardner + destaques.
   localStorage:
     cme-notes-mode = "all" | "click" | "off"
     cme-theme      = "light" | "dark"
     cme-font       = "default" | "dyslexia" | "sans" | "mono"
     cme-font-size  = 85..140 (percentual)
     cme-highlights = { "pagina.html": [ {id, text, note, nth} ] }
*/
(function () {
  var KEY_MODE = "cme-notes-mode";
  var KEY_THEME = "cme-theme";
  var KEY_FONT = "cme-font";
  var KEY_SIZE = "cme-font-size";
  var KEY_HL = "cme-highlights";
  var SIZE_MIN = 85;
  var SIZE_MAX = 140;
  var SIZE_STEP = 5;
  var SIZE_DEFAULT = 100;

  var root = document.documentElement;
  var modeSelect = document.getElementById("notes-mode");
  var themeBtn = document.getElementById("toggle-theme");
  var fontSelect = document.getElementById("font-family");
  var fontSmaller = document.getElementById("font-smaller");
  var fontLarger = document.getElementById("font-larger");
  var fontSizeLabel = document.getElementById("font-size-label");

  var hlPopup = document.getElementById("hl-popup");
  var hlBtnMark = document.getElementById("hl-btn-mark");
  var hlBtnNote = document.getElementById("hl-btn-note");
  var hlBtnCancel = document.getElementById("hl-btn-cancel");
  var hlModal = document.getElementById("hl-note-modal");
  var hlNoteInput = document.getElementById("hl-note-input");
  var hlNoteQuote = document.getElementById("hl-note-quote");
  var hlNoteSave = document.getElementById("hl-note-save");
  var hlNoteRemove = document.getElementById("hl-note-remove");
  var hlNoteClose = document.getElementById("hl-note-close");

  var pendingRange = null;
  var activeHlId = null;

  var LUPA_SVG =
    '<svg class="note-mark-icon" viewBox="0 0 24 24" width="14" height="14" aria-hidden="true" focusable="false">' +
    '<circle cx="10.5" cy="10.5" r="6.5" fill="none" stroke="currentColor" stroke-width="2"/>' +
    '<line x1="15.5" y1="15.5" x2="21" y2="21" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/>' +
    "</svg>";

  function get(key, fallback) {
    try {
      var v = localStorage.getItem(key);
      return v === null ? fallback : v;
    } catch (e) {
      return fallback;
    }
  }

  function set(key, value) {
    try {
      localStorage.setItem(key, value);
    } catch (e) {}
  }

  function pageKey() {
    var p = location.pathname.split("/").pop() || "index.html";
    if (!p || p === "") p = "index.html";
    return p;
  }

  /* ---------- Tema ---------- */
  function applyTheme(theme) {
    if (theme !== "dark") theme = "light";
    root.classList.toggle("theme-dark", theme === "dark");
    root.classList.toggle("theme-light", theme === "light");
    if (themeBtn) {
      var isDark = theme === "dark";
      themeBtn.setAttribute("aria-pressed", isDark ? "true" : "false");
      var label = themeBtn.querySelector(".theme-label");
      if (label) label.textContent = isDark ? "Tema claro" : "Tema escuro";
    }
  }

  /* ---------- Fonte ---------- */
  function applyFont(font) {
    var allowed = { default: 1, dyslexia: 1, sans: 1, mono: 1 };
    if (!allowed[font]) font = "default";
    root.classList.remove("font-default", "font-dyslexia", "font-sans", "font-mono");
    root.classList.add("font-" + font);
    if (fontSelect) fontSelect.value = font;
  }

  function clampSize(n) {
    n = parseInt(n, 10);
    if (isNaN(n)) n = SIZE_DEFAULT;
    if (n < SIZE_MIN) n = SIZE_MIN;
    if (n > SIZE_MAX) n = SIZE_MAX;
    return n;
  }

  function applyFontSize(pct) {
    pct = clampSize(pct);
    root.style.setProperty("--cme-font-scale", pct / 100);
    if (fontSizeLabel) fontSizeLabel.textContent = pct + "%";
    if (fontSmaller) fontSmaller.disabled = pct <= SIZE_MIN;
    if (fontLarger) fontLarger.disabled = pct >= SIZE_MAX;
    return pct;
  }

  /* ---------- Notas Gardner ---------- */
  function noteIdFromHref(href) {
    if (!href) return null;
    var i = href.indexOf("#");
    if (i === -1) return null;
    return href.slice(i + 1) || null;
  }

  function ensureMarks() {
    var notes = document.querySelectorAll(".gardner-note[id]");
    for (var i = 0; i < notes.length; i++) {
      var note = notes[i];
      var id = note.id;
      if (!id) continue;

      var mark = document.querySelector(
        '.note-mark[data-note="' + id + '"], .note-mark[href="#' + id + '"]'
      );
      if (mark) {
        mark.setAttribute("data-note", id);
        mark.setAttribute("href", "#" + id);
        mark.setAttribute("role", "button");
        mark.setAttribute("aria-controls", id);
        mark.setAttribute(
          "aria-expanded",
          note.classList.contains("is-open") ? "true" : "false"
        );
        mark.setAttribute("title", "Abrir/fechar nota de Gardner");
        mark.innerHTML = LUPA_SVG;
        continue;
      }

      mark = document.createElement("button");
      mark.type = "button";
      mark.className = "note-mark note-mark-block";
      mark.setAttribute("data-note", id);
      mark.setAttribute("aria-controls", id);
      mark.setAttribute("aria-expanded", "false");
      mark.setAttribute("title", "Abrir/fechar nota de Gardner");
      mark.innerHTML = LUPA_SVG;
      note.parentNode.insertBefore(mark, note);
    }
  }

  function setMarkExpanded(noteId, open) {
    var marks = document.querySelectorAll(
      '.note-mark[data-note="' + noteId + '"], .note-mark[href="#' + noteId + '"]'
    );
    for (var i = 0; i < marks.length; i++) {
      marks[i].setAttribute("aria-expanded", open ? "true" : "false");
      marks[i].classList.toggle("is-active", open);
    }
  }

  function closeAllNotes() {
    var notes = document.querySelectorAll(".gardner-note.is-open");
    for (var i = 0; i < notes.length; i++) {
      notes[i].classList.remove("is-open");
      setMarkExpanded(notes[i].id, false);
    }
  }

  function toggleNote(noteId) {
    if (!noteId) return;
    var note = document.getElementById(noteId);
    if (!note || !note.classList.contains("gardner-note")) return;
    var open = !note.classList.contains("is-open");
    note.classList.toggle("is-open", open);
    setMarkExpanded(noteId, open);
    if (open) {
      try {
        note.scrollIntoView({ behavior: "smooth", block: "nearest" });
      } catch (e) {}
    }
  }

  function normalizeMode(mode) {
    if (mode === "all" || mode === "click" || mode === "off") return mode;
    return "click";
  }

  function applyMode(mode) {
    mode = normalizeMode(mode);
    root.classList.toggle("notes-mode-all", mode === "all");
    root.classList.toggle("notes-mode-click", mode === "click");
    root.classList.toggle("notes-mode-off", mode === "off");
    if (modeSelect) modeSelect.value = mode;
    if (mode === "all" || mode === "off") closeAllNotes();
  }

  function onMarkActivate(ev) {
    var mode = normalizeMode(get(KEY_MODE, "click"));
    if (mode === "off") return;

    var el = ev.target;
    while (el && el !== document && !el.classList.contains("note-mark")) {
      el = el.parentNode;
    }
    if (!el || !el.classList.contains("note-mark")) return;

    var id = el.getAttribute("data-note") || noteIdFromHref(el.getAttribute("href"));
    if (!id) return;
    ev.preventDefault();

    if (mode === "all") {
      var note = document.getElementById(id);
      if (note) {
        try {
          note.scrollIntoView({ behavior: "smooth", block: "nearest" });
        } catch (e) {}
      }
      return;
    }
    toggleNote(id);
  }

  /* ---------- Destaques (highlights) ---------- */
  function loadAllHighlights() {
    try {
      return JSON.parse(get(KEY_HL, "{}")) || {};
    } catch (e) {
      return {};
    }
  }

  function saveAllHighlights(data) {
    set(KEY_HL, JSON.stringify(data));
  }

  function getPageHighlights() {
    var all = loadAllHighlights();
    return all[pageKey()] || [];
  }

  function setPageHighlights(list) {
    var all = loadAllHighlights();
    if (!list || !list.length) delete all[pageKey()];
    else all[pageKey()] = list;
    saveAllHighlights(all);
  }

  function uid() {
    return "hl-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 8);
  }

  function countOccurrencesBefore(rootEl, text, beforeNode) {
    var walker = document.createTreeWalker(rootEl, NodeFilter.SHOW_TEXT, null);
    var count = 0;
    var node;
    while ((node = walker.nextNode())) {
      if (beforeNode && (node === beforeNode || node.compareDocumentPosition(beforeNode) & Node.DOCUMENT_POSITION_FOLLOWING)) {
        // still counting until we pass beforeNode... actually we want nth of this text in document
      }
    }
    return count;
  }

  function nthOccurrenceIndex(text, markEl) {
    // how many previous marks with same text exist, or search text nodes
    var all = document.body.innerText;
    // Better: count mark elements with same data-text before this one; for new: count existing same text in body
    var nodes = document.body.querySelectorAll("mark.cme-hl");
    var n = 0;
    for (var i = 0; i < nodes.length; i++) {
      if (nodes[i] === markEl) return n;
      if (nodes[i].getAttribute("data-text") === text) n++;
    }
    // for creation before mark exists: count text occurrences via indexOf chain
    return countTextNth(document.body, text, markEl);
  }

  function countTextNth(container, text, stopAt) {
    if (!text) return 0;
    var walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, {
      acceptNode: function (node) {
        if (!node.nodeValue || !node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
        var p = node.parentNode;
        if (p && (p.closest && (p.closest("#site-toolbar") || p.closest(".hl-popup") || p.closest(".hl-modal") || p.closest("script") || p.closest("style")))) {
          return NodeFilter.FILTER_REJECT;
        }
        return NodeFilter.FILTER_ACCEPT;
      },
    });
    var full = "";
    var map = []; // {start, end, node}
    var node;
    while ((node = walker.nextNode())) {
      if (stopAt && node.parentNode && stopAt.contains && node.parentNode.closest && false) {
      }
      var start = full.length;
      full += node.nodeValue;
      map.push({ start: start, end: full.length, node: node });
    }
    // find all occurrences
    var occ = 0;
    var pos = 0;
    while (true) {
      var i = full.indexOf(text, pos);
      if (i === -1) break;
      // check if this occurrence is at/after stopAt mark start
      if (stopAt) {
        var markStart = -1;
        // find text offset of stopAt first text child
        var tw = document.createTreeWalker(stopAt, NodeFilter.SHOW_TEXT, null);
        var tn = tw.nextNode();
        if (tn) {
          for (var m = 0; m < map.length; m++) {
            if (map[m].node === tn) {
              markStart = map[m].start;
              break;
            }
          }
        }
        if (markStart >= 0 && i >= markStart) return occ;
      }
      occ++;
      pos = i + Math.max(text.length, 1);
    }
    return occ;
  }

  function findNthTextRange(container, text, nth) {
    if (!text) return null;
    var walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, {
      acceptNode: function (node) {
        if (!node.nodeValue) return NodeFilter.FILTER_REJECT;
        var p = node.parentNode;
        if (
          p &&
          p.closest &&
          (p.closest("#site-toolbar") ||
            p.closest(".hl-popup") ||
            p.closest(".hl-modal") ||
            p.closest("script") ||
            p.closest("style") ||
            p.closest("mark.cme-hl"))
        ) {
          return NodeFilter.FILTER_REJECT;
        }
        return NodeFilter.FILTER_ACCEPT;
      },
    });
    var full = "";
    var map = [];
    var node;
    while ((node = walker.nextNode())) {
      var start = full.length;
      full += node.nodeValue;
      map.push({ start: start, end: full.length, node: node });
    }
    var pos = 0;
    var found = 0;
    var idx = -1;
    while (true) {
      idx = full.indexOf(text, pos);
      if (idx === -1) return null;
      if (found === nth) break;
      found++;
      pos = idx + Math.max(text.length, 1);
    }
    var endIdx = idx + text.length;
    function pointAt(offset) {
      for (var i = 0; i < map.length; i++) {
        if (offset >= map[i].start && offset <= map[i].end) {
          return { node: map[i].node, offset: offset - map[i].start };
        }
      }
      return null;
    }
    var a = pointAt(idx);
    var b = pointAt(endIdx);
    if (!a || !b) return null;
    var range = document.createRange();
    try {
      range.setStart(a.node, a.offset);
      range.setEnd(b.node, b.offset);
      return range;
    } catch (e) {
      return null;
    }
  }

  function wrapRange(range, id, text, note) {
    var mark = document.createElement("mark");
    mark.className = "cme-hl";
    mark.setAttribute("data-id", id);
    mark.setAttribute("data-text", text);
    if (note) mark.setAttribute("data-note", note);
    mark.setAttribute("tabindex", "0");
    mark.setAttribute("title", note ? "Nota: " + note : "Destaque (clique para anotar)");
    mark.setAttribute("role", "button");
    try {
      range.surroundContents(mark);
    } catch (e) {
      // seleção atravessa elementos: extrai conteúdo
      try {
        var frag = range.extractContents();
        mark.appendChild(frag);
        range.insertNode(mark);
      } catch (e2) {
        return null;
      }
    }
    return mark;
  }

  function unwrapMark(mark) {
    var parent = mark.parentNode;
    if (!parent) return;
    while (mark.firstChild) parent.insertBefore(mark.firstChild, mark);
    parent.removeChild(mark);
    parent.normalize();
  }

  function clearRenderedHighlights() {
    var marks = document.querySelectorAll("mark.cme-hl");
    // unwrap from last to first to keep structure stable
    for (var i = marks.length - 1; i >= 0; i--) unwrapMark(marks[i]);
  }

  function restoreHighlights() {
    var list = getPageHighlights();
    if (!list.length) return;
    // sort by nth ascending, apply carefully
    list = list.slice().sort(function (a, b) {
      return (a.nth || 0) - (b.nth || 0);
    });
    for (var i = 0; i < list.length; i++) {
      var item = list[i];
      if (!item || !item.text) continue;
      var range = findNthTextRange(document.body, item.text, item.nth || 0);
      if (!range) continue;
      wrapRange(range, item.id, item.text, item.note || "");
    }
  }

  function persistFromDom() {
    var marks = document.querySelectorAll("mark.cme-hl");
    var list = [];
    var textCount = {};
    for (var i = 0; i < marks.length; i++) {
      var m = marks[i];
      var text = m.getAttribute("data-text") || m.textContent;
      var nth = textCount[text] || 0;
      textCount[text] = nth + 1;
      list.push({
        id: m.getAttribute("data-id") || uid(),
        text: text,
        note: m.getAttribute("data-note") || "",
        nth: nth,
      });
      m.setAttribute("data-id", list[list.length - 1].id);
    }
    setPageHighlights(list);
  }

  function hidePopup() {
    if (hlPopup) {
      hlPopup.hidden = true;
      hlPopup.style.display = "none";
    }
    pendingRange = null;
  }

  function showPopupAt(x, y) {
    if (!hlPopup) return;
    hlPopup.hidden = false;
    hlPopup.style.display = "flex";
    var pad = 8;
    var w = hlPopup.offsetWidth || 220;
    var h = hlPopup.offsetHeight || 40;
    var left = Math.min(window.innerWidth - w - pad, Math.max(pad, x));
    var top = Math.min(window.innerHeight - h - pad, Math.max(pad, y));
    hlPopup.style.left = left + "px";
    hlPopup.style.top = top + "px";
  }

  function getValidSelection() {
    var sel = window.getSelection();
    if (!sel || sel.isCollapsed || !sel.rangeCount) return null;
    var text = sel.toString().replace(/\s+/g, " ").trim();
    if (!text || text.length < 2) return null;
    if (text.length > 800) return null;
    var range = sel.getRangeAt(0);
    // must be inside body content, not toolbar
    var node = range.commonAncestorContainer;
    var el = node.nodeType === 1 ? node : node.parentNode;
    if (!el || !el.closest) return null;
    if (el.closest("#site-toolbar") || el.closest(".hl-popup") || el.closest(".hl-modal")) return null;
    if (el.closest("mark.cme-hl")) return null;
    return { sel: sel, range: range.cloneRange(), text: text };
  }

  function onSelectionChange() {
    // delayed so mouseup fires first
  }

  function onMouseUp(ev) {
    if (ev.target && ev.target.closest && (ev.target.closest(".hl-popup") || ev.target.closest(".hl-modal") || ev.target.closest("#site-toolbar"))) {
      return;
    }
    setTimeout(function () {
      var v = getValidSelection();
      if (!v) {
        hidePopup();
        return;
      }
      pendingRange = v.range;
      showPopupAt(ev.clientX + 8, ev.clientY + 12);
    }, 10);
  }

  function createHighlight(withNote) {
    if (!pendingRange) return;
    var text = pendingRange.toString().replace(/\s+/g, " ").trim();
    if (!text) return;
    var id = uid();
    // compute nth before wrapping
    var nth = 0;
    var tmpRange = findNthTextRange(document.body, text, 0);
    // count how many times text appears before our selection start
    var probe = document.createRange();
    try {
      // simpler: after wrap, persistFromDom recalculates nth
      var mark = wrapRange(pendingRange, id, text, "");
      if (!mark) {
        hidePopup();
        return;
      }
      window.getSelection().removeAllRanges();
      hidePopup();
      persistFromDom();
      if (withNote) openNoteModal(mark);
    } catch (e) {
      hidePopup();
    }
  }

  function openNoteModal(mark) {
    if (!hlModal || !mark) return;
    activeHlId = mark.getAttribute("data-id");
    if (hlNoteQuote) hlNoteQuote.textContent = '"' + (mark.getAttribute("data-text") || mark.textContent) + '"';
    if (hlNoteInput) hlNoteInput.value = mark.getAttribute("data-note") || "";
    hlModal.hidden = false;
    hlModal.style.display = "flex";
    if (hlNoteInput) hlNoteInput.focus();
  }

  function closeNoteModal() {
    if (hlModal) {
      hlModal.hidden = true;
      hlModal.style.display = "none";
    }
    activeHlId = null;
  }

  function findMarkById(id) {
    return document.querySelector('mark.cme-hl[data-id="' + id + '"]');
  }

  /* ---------- Init ---------- */
  ensureMarks();

  var mode = normalizeMode(get(KEY_MODE, "click"));
  var theme = get(KEY_THEME, "light");
  var font = get(KEY_FONT, "default");
  var size = clampSize(get(KEY_SIZE, String(SIZE_DEFAULT)));

  applyMode(mode);
  applyTheme(theme);
  applyFont(font);
  applyFontSize(size);

  // restore highlights after layout
  setTimeout(function () {
    restoreHighlights();
  }, 50);

  if (modeSelect) {
    modeSelect.addEventListener("change", function () {
      var m = normalizeMode(modeSelect.value);
      applyMode(m);
      set(KEY_MODE, m);
    });
  }

  if (themeBtn) {
    themeBtn.addEventListener("click", function () {
      var next = root.classList.contains("theme-dark") ? "light" : "dark";
      applyTheme(next);
      set(KEY_THEME, next);
    });
  }

  if (fontSelect) {
    fontSelect.addEventListener("change", function () {
      var f = fontSelect.value;
      applyFont(f);
      set(KEY_FONT, f);
    });
  }

  if (fontSmaller) {
    fontSmaller.addEventListener("click", function () {
      var cur = clampSize(get(KEY_SIZE, String(SIZE_DEFAULT)));
      var next = applyFontSize(cur - SIZE_STEP);
      set(KEY_SIZE, String(next));
    });
  }

  if (fontLarger) {
    fontLarger.addEventListener("click", function () {
      var cur = clampSize(get(KEY_SIZE, String(SIZE_DEFAULT)));
      var next = applyFontSize(cur + SIZE_STEP);
      set(KEY_SIZE, String(next));
    });
  }

  document.addEventListener("click", onMarkActivate);
  document.addEventListener("keydown", function (ev) {
    if (ev.key !== "Enter" && ev.key !== " ") return;
    var el = ev.target;
    if (el && el.classList && el.classList.contains("note-mark")) {
      ev.preventDefault();
      onMarkActivate(ev);
      return;
    }
    if (el && el.classList && el.classList.contains("cme-hl")) {
      ev.preventDefault();
      openNoteModal(el);
    }
  });

  document.addEventListener("mouseup", onMouseUp);
  document.addEventListener("touchend", function (ev) {
    var t = ev.changedTouches && ev.changedTouches[0];
    if (!t) return;
    setTimeout(function () {
      var v = getValidSelection();
      if (!v) {
        hidePopup();
        return;
      }
      pendingRange = v.range;
      showPopupAt(t.clientX + 8, t.clientY + 12);
    }, 30);
  });

  if (hlBtnMark) hlBtnMark.addEventListener("click", function () { createHighlight(false); });
  if (hlBtnNote) hlBtnNote.addEventListener("click", function () { createHighlight(true); });
  if (hlBtnCancel) hlBtnCancel.addEventListener("click", hidePopup);

  document.addEventListener("click", function (ev) {
    var t = ev.target;
    if (t && t.classList && t.classList.contains("cme-hl")) {
      openNoteModal(t);
      return;
    }
    if (hlPopup && !hlPopup.hidden && t && !hlPopup.contains(t)) {
      // keep popup if still selecting
    }
  });

  if (hlNoteSave) {
    hlNoteSave.addEventListener("click", function () {
      var mark = findMarkById(activeHlId);
      if (!mark) {
        closeNoteModal();
        return;
      }
      var note = (hlNoteInput && hlNoteInput.value) || "";
      note = note.trim().slice(0, 2000);
      if (note) {
        mark.setAttribute("data-note", note);
        mark.setAttribute("title", "Nota: " + note);
        mark.classList.add("cme-hl-has-note");
      } else {
        mark.removeAttribute("data-note");
        mark.setAttribute("title", "Destaque (clique para anotar)");
        mark.classList.remove("cme-hl-has-note");
      }
      persistFromDom();
      closeNoteModal();
    });
  }

  if (hlNoteRemove) {
    hlNoteRemove.addEventListener("click", function () {
      var mark = findMarkById(activeHlId);
      if (mark) {
        unwrapMark(mark);
        persistFromDom();
      }
      closeNoteModal();
    });
  }

  if (hlNoteClose) hlNoteClose.addEventListener("click", closeNoteModal);

  if (hlModal) {
    hlModal.addEventListener("click", function (ev) {
      if (ev.target === hlModal) closeNoteModal();
    });
  }

  document.addEventListener("keydown", function (ev) {
    if (ev.key === "Escape") {
      hidePopup();
      closeNoteModal();
    }
  });
})();
