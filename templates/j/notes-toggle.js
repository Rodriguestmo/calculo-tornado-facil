/* Preferências de leitura + notas Gardner + destaques.
   localStorage:
     cme-notes-mode = "all" | "click" | "off"
     cme-theme      = "light" | "dark"
     cme-font       = "default" | "dyslexia" | "sans" | "mono"
     cme-font-size  = 85..140
     cme-hl-color   = "pastel-yellow" | ...
     cme-highlights = { "pagina.html": [ {id, text, note, nth, color} ] }
*/
(function () {
  var KEY_MODE = "cme-notes-mode";
  var KEY_THEME = "cme-theme";
  var KEY_FONT = "cme-font";
  var KEY_SIZE = "cme-font-size";
  var KEY_HL = "cme-highlights";
  var KEY_HL_COLOR = "cme-hl-color";
  var SIZE_MIN = 85;
  var SIZE_MAX = 140;
  var SIZE_STEP = 5;
  var SIZE_DEFAULT = 100;
  var COLOR_DEFAULT = "pastel-yellow";
  var hlFilter = "all";
  var COLORS = {
    "pastel-yellow": 1,
    "pastel-green": 1,
    "pastel-blue": 1,
    "pastel-pink": 1,
    "pastel-orange": 1,
    "pastel-purple": 1
  };
  var PAGE_TITLES = {
    "index.html": "Página principal",
    "prologue.html": "Prólogo",
    "1.html": "I. Terrores Preliminares",
    "2.html": "II. Graus de Pequenez",
    "3.html": "III. Crescimentos Relativos",
    "4.html": "IV. Casos Mais Simples",
    "5.html": "V. Constantes",
    "6.html": "VI. Somas e Produtos",
    "7.html": "VII. Diferenciação Sucessiva",
    "8.html": "VIII. Quando o Tempo Varia",
    "9.html": "IX. Truque Útil",
    "10.html": "X. Significado Geométrico",
    "11.html": "XI. Máximos e Mínimos",
    "12.html": "XII. Curvatura",
    "13.html": "XIII. Outros Truques",
    "14.html": "XIV. (a) Juros Compostos",
    "14b.html": "XIV. (b) Decaimento",
    "15.html": "XV. Senos e Cossenos",
    "16.html": "XVI. Diferenciação Parcial",
    "17.html": "XVII. Integração",
    "18.html": "XVIII. Integrar como Inverso",
    "19.html": "XIX. Áreas",
    "20.html": "XX. Truques e Armadilhas",
    "21.html": "XXI. Soluções",
    "epilogue.html": "Epílogo",
    "table.html": "Tabela de Formas"
  };

  var root = document.documentElement;
  var modeSelect = document.getElementById("notes-mode");
  var themeBtn = document.getElementById("toggle-theme");
  var fontSelect = document.getElementById("font-family");
  var fontSmaller = document.getElementById("font-smaller");
  var fontLarger = document.getElementById("font-larger");
  var fontSizeLabel = document.getElementById("font-size-label");
  var hlColorSelect = document.getElementById("hl-color");
  var hlListToggle = document.getElementById("hl-list-toggle");
  var hlListPanel = document.getElementById("hl-list-panel");
  var hlListBody = document.getElementById("hl-list-body");
  var hlCountBadge = document.getElementById("hl-count-badge");
  var hlFloatTip = document.getElementById("hl-float-tip");
  var settingsToggle = document.getElementById("settings-toggle");
  var settingsPanel = document.getElementById("settings-panel");
  var hlColorSwatches = document.getElementById("hl-color-swatches");
  var hlFilterSwatches = document.getElementById("hl-filter-swatches");
  var hlNoteSwatches = document.getElementById("hl-note-swatches");

  var hlPopup = document.getElementById("hl-popup");
  var hlBtnMark = document.getElementById("hl-btn-mark");
  var hlBtnNote = document.getElementById("hl-btn-note");
  var hlBtnCancel = document.getElementById("hl-btn-cancel");
  var hlModal = document.getElementById("hl-note-modal");
  var hlNoteInput = document.getElementById("hl-note-input");
  var hlNoteQuote = document.getElementById("hl-note-quote");
  var hlNoteColor = document.getElementById("hl-note-color");
  var hlNoteSave = document.getElementById("hl-note-save");
  var hlNoteRemove = document.getElementById("hl-note-remove");
  var hlNoteClose = document.getElementById("hl-note-close");

  var pendingRange = null;
  var activeHlId = null;
  var tipHideTimer = null;

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

  function normalizeColor(c) {
    return COLORS[c] ? c : COLOR_DEFAULT;
  }

  function pageTitle(page) {
    return PAGE_TITLES[page] || page;
  }

  function truncate(s, n) {
    s = (s || "").replace(/\s+/g, " ").trim();
    if (s.length <= n) return s;
    return s.slice(0, n - 1) + "…";
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

  function applyHlColorPref(color) {
    color = normalizeColor(color);
    if (hlColorSelect) hlColorSelect.value = color;
    if (hlColorSwatches) {
      var btns = hlColorSwatches.querySelectorAll(".hl-swatch-btn");
      for (var i = 0; i < btns.length; i++) {
        var on = btns[i].getAttribute("data-color") === color;
        btns[i].classList.toggle("is-active", on);
        btns[i].setAttribute("aria-pressed", on ? "true" : "false");
      }
    }
    return color;
  }

  function setHlFilter(filter) {
    hlFilter = filter || "all";
    if (hlFilterSwatches) {
      var btns = hlFilterSwatches.querySelectorAll(".hl-filter-btn");
      for (var i = 0; i < btns.length; i++) {
        var on = btns[i].getAttribute("data-filter") === hlFilter;
        btns[i].classList.toggle("is-active", on);
        btns[i].setAttribute("aria-pressed", on ? "true" : "false");
      }
    }
    refreshHlList();
  }

  function syncNoteSwatches(color) {
    color = normalizeColor(color);
    if (hlNoteColor) hlNoteColor.value = color;
    if (hlNoteSwatches) {
      var btns = hlNoteSwatches.querySelectorAll(".hl-swatch-btn");
      for (var i = 0; i < btns.length; i++) {
        var on = btns[i].getAttribute("data-color") === color;
        btns[i].classList.toggle("is-active", on);
        btns[i].setAttribute("aria-pressed", on ? "true" : "false");
      }
    }
  }

  function closeAllMenus() {
    closeMenu(settingsToggle, settingsPanel);
    closeMenu(hlListToggle, hlListPanel);
  }

  function closeMenu(btn, panel) {
    if (panel) {
      panel.hidden = true;
    }
    if (btn) btn.setAttribute("aria-expanded", "false");
  }

  function openMenu(btn, panel) {
    closeAllMenus();
    if (panel) panel.hidden = false;
    if (btn) btn.setAttribute("aria-expanded", "true");
  }

  function toggleMenu(btn, panel, onOpen) {
    if (!btn || !panel) return;
    var willOpen = panel.hidden;
    closeAllMenus();
    if (willOpen) {
      if (typeof onOpen === "function") onOpen();
      panel.hidden = false;
      btn.setAttribute("aria-expanded", "true");
    }
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

  /* ---------- Destaques ---------- */
  function loadAllHighlights() {
    try {
      return JSON.parse(get(KEY_HL, "{}")) || {};
    } catch (e) {
      return {};
    }
  }

  function saveAllHighlights(data) {
    set(KEY_HL, JSON.stringify(data));
    refreshHlList();
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

  function flattenHighlights() {
    var all = loadAllHighlights();
    var out = [];
    Object.keys(all).forEach(function (page) {
      (all[page] || []).forEach(function (item) {
        out.push({
          page: page,
          id: item.id,
          text: item.text || "",
          note: item.note || "",
          nth: item.nth || 0,
          color: normalizeColor(item.color || COLOR_DEFAULT)
        });
      });
    });
    return out;
  }

  function uid() {
    return "hl-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 8);
  }

  function applyColorToMark(mark, color) {
    color = normalizeColor(color);
    mark.setAttribute("data-color", color);
    mark.className = "cme-hl cme-hl-" + color;
    var note = mark.getAttribute("data-note") || "";
    if (note) mark.classList.add("cme-hl-has-note");
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
            p.closest(".hl-list-panel") ||
            p.closest(".hl-float-tip") ||
            p.closest("script") ||
            p.closest("style") ||
            p.closest("mark.cme-hl"))
        ) {
          return NodeFilter.FILTER_REJECT;
        }
        return NodeFilter.FILTER_ACCEPT;
      }
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

  function wrapRange(range, id, text, note, color) {
    var mark = document.createElement("mark");
    mark.setAttribute("data-id", id);
    mark.setAttribute("data-text", text);
    if (note) mark.setAttribute("data-note", note);
    applyColorToMark(mark, color);
    mark.setAttribute("tabindex", "0");
    mark.setAttribute("role", "button");
    mark.removeAttribute("title");
    try {
      range.surroundContents(mark);
    } catch (e) {
      try {
        var frag = range.extractContents();
        mark.appendChild(frag);
        range.insertNode(mark);
      } catch (e2) {
        return null;
      }
    }
    bindHighlightHover(mark);
    return mark;
  }

  function unwrapMark(mark) {
    var parent = mark.parentNode;
    if (!parent) return;
    while (mark.firstChild) parent.insertBefore(mark.firstChild, mark);
    parent.removeChild(mark);
    parent.normalize();
  }

  function restoreHighlights() {
    var list = getPageHighlights();
    if (!list.length) return;
    list = list.slice().sort(function (a, b) {
      return (a.nth || 0) - (b.nth || 0);
    });
    for (var i = 0; i < list.length; i++) {
      var item = list[i];
      if (!item || !item.text) continue;
      var range = findNthTextRange(document.body, item.text, item.nth || 0);
      if (!range) continue;
      wrapRange(
        range,
        item.id,
        item.text,
        item.note || "",
        item.color || COLOR_DEFAULT
      );
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
      var id = m.getAttribute("data-id") || uid();
      list.push({
        id: id,
        text: text,
        note: m.getAttribute("data-note") || "",
        nth: nth,
        color: normalizeColor(m.getAttribute("data-color") || COLOR_DEFAULT)
      });
      m.setAttribute("data-id", id);
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
    var node = range.commonAncestorContainer;
    var el = node.nodeType === 1 ? node : node.parentNode;
    if (!el || !el.closest) return null;
    if (
      el.closest("#site-toolbar") ||
      el.closest(".hl-popup") ||
      el.closest(".hl-modal") ||
      el.closest(".hl-list-panel") ||
      el.closest(".hl-float-tip")
    )
      return null;
    if (el.closest("mark.cme-hl")) return null;
    return { sel: sel, range: range.cloneRange(), text: text };
  }

  function onMouseUp(ev) {
    if (
      ev.target &&
      ev.target.closest &&
      (ev.target.closest(".hl-popup") ||
        ev.target.closest(".hl-modal") ||
        ev.target.closest("#site-toolbar") ||
        ev.target.closest(".hl-list-panel") ||
        ev.target.closest(".hl-float-tip"))
    ) {
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
    var color = normalizeColor(get(KEY_HL_COLOR, COLOR_DEFAULT));
    try {
      var mark = wrapRange(pendingRange, id, text, "", color);
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
    if (hlNoteQuote)
      hlNoteQuote.textContent =
        '"' + (mark.getAttribute("data-text") || mark.textContent) + '"';
    if (hlNoteInput) hlNoteInput.value = mark.getAttribute("data-note") || "";
    if (hlNoteColor)
      hlNoteColor.value = normalizeColor(
        mark.getAttribute("data-color") || COLOR_DEFAULT
      );
    syncNoteSwatches(hlNoteColor ? hlNoteColor.value : COLOR_DEFAULT);
    hlModal.hidden = false;
    hlModal.style.display = "flex";
    if (hlNoteInput) hlNoteInput.focus();
    hideFloatTip();
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

  /* ---------- Lista de destaques (dropdown) ---------- */
  function refreshHlList() {
    var allItems = flattenHighlights();
    if (hlCountBadge) {
      if (allItems.length) {
        hlCountBadge.hidden = false;
        hlCountBadge.textContent = String(allItems.length);
      } else {
        hlCountBadge.hidden = true;
      }
    }
    if (!hlListBody) return;
    var items = allItems;
    if (hlFilter && hlFilter !== "all") {
      items = allItems.filter(function (it) {
        return normalizeColor(it.color) === hlFilter;
      });
    }
    if (!allItems.length) {
      hlListBody.innerHTML =
        '<p class="hl-list-empty">Nenhum destaque ainda. Selecione um trecho no texto para destacar.</p>';
      return;
    }
    if (!items.length) {
      hlListBody.innerHTML =
        '<p class="hl-list-empty">Nenhum destaque com essa cor. Troque o filtro ou destaque com outra cor.</p>';
      return;
    }
    // group by page
    var byPage = {};
    items.forEach(function (it) {
      if (!byPage[it.page]) byPage[it.page] = [];
      byPage[it.page].push(it);
    });
    var html = "";
    Object.keys(byPage)
      .sort()
      .forEach(function (page) {
        html +=
          '<div class="hl-list-group"><div class="hl-list-page">' +
          pageTitle(page) +
          "</div>";
        byPage[page].forEach(function (it) {
          var hasNote = !!(it.note && it.note.trim());
          html +=
            '<button type="button" class="hl-list-item" data-page="' +
            page.replace(/"/g, "") +
            '" data-id="' +
            it.id.replace(/"/g, "") +
            '">' +
            '<span class="hl-list-swatch cme-hl-' +
            it.color +
            '"></span>' +
            '<span class="hl-list-text">' +
            escapeHtml(truncate(it.text, 90)) +
            "</span>" +
            (hasNote
              ? '<span class="hl-list-note">' +
                escapeHtml(truncate(it.note, 80)) +
                "</span>"
              : '<span class="hl-list-note hl-list-note-empty">sem nota</span>') +
            "</button>";
        });
        html += "</div>";
      });
    hlListBody.innerHTML = html;
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function toggleHlList(force) {
    if (!hlListPanel || !hlListToggle) return;
    if (force === false) {
      closeMenu(hlListToggle, hlListPanel);
      return;
    }
    if (force === true) {
      openMenu(hlListToggle, hlListPanel);
      refreshHlList();
      return;
    }
    toggleMenu(hlListToggle, hlListPanel, refreshHlList);
  }

  /* ---------- Tooltip flutuante ---------- */
  function hideFloatTip() {
    if (tipHideTimer) {
      clearTimeout(tipHideTimer);
      tipHideTimer = null;
    }
    if (hlFloatTip) {
      hlFloatTip.hidden = true;
      hlFloatTip.style.display = "none";
      hlFloatTip.textContent = "";
    }
  }

  function showFloatTip(mark, x, y) {
    if (!hlFloatTip || !mark) return;
    var note = (mark.getAttribute("data-note") || "").trim();
    if (!note) {
      hideFloatTip();
      return;
    }
    hlFloatTip.textContent = note;
    hlFloatTip.hidden = false;
    hlFloatTip.style.display = "block";
    var pad = 10;
    var w = hlFloatTip.offsetWidth || 220;
    var h = hlFloatTip.offsetHeight || 40;
    var left = Math.min(window.innerWidth - w - pad, Math.max(pad, x + 12));
    var top = Math.min(window.innerHeight - h - pad, Math.max(pad, y + 16));
    hlFloatTip.style.left = left + "px";
    hlFloatTip.style.top = top + "px";
  }

  function bindHighlightHover(mark) {
    if (!mark || mark._hlBound) return;
    mark._hlBound = true;
    mark.addEventListener("mouseenter", function (ev) {
      if (tipHideTimer) {
        clearTimeout(tipHideTimer);
        tipHideTimer = null;
      }
      showFloatTip(mark, ev.clientX, ev.clientY);
    });
    mark.addEventListener("mousemove", function (ev) {
      var note = (mark.getAttribute("data-note") || "").trim();
      if (!note) return;
      showFloatTip(mark, ev.clientX, ev.clientY);
    });
    mark.addEventListener("mouseleave", function () {
      tipHideTimer = setTimeout(hideFloatTip, 120);
    });
  }

  /* ---------- Init ---------- */
  ensureMarks();

  var mode = normalizeMode(get(KEY_MODE, "click"));
  var theme = get(KEY_THEME, "light");
  var font = get(KEY_FONT, "default");
  var size = clampSize(get(KEY_SIZE, String(SIZE_DEFAULT)));
  var hlColor = applyHlColorPref(get(KEY_HL_COLOR, COLOR_DEFAULT));

  applyMode(mode);
  applyTheme(theme);
  applyFont(font);
  applyFontSize(size);
  set(KEY_HL_COLOR, hlColor);
  setHlFilter(hlFilter || "all");

  setTimeout(function () {
    restoreHighlights();
    document.querySelectorAll("mark.cme-hl").forEach(bindHighlightHover);
    refreshHlList();
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

  if (hlColorSelect) {
    hlColorSelect.addEventListener("change", function () {
      var c = normalizeColor(hlColorSelect.value);
      set(KEY_HL_COLOR, c);
      applyHlColorPref(c);
    });
  }

  if (hlColorSwatches) {
    hlColorSwatches.addEventListener("click", function (ev) {
      var btn = ev.target.closest && ev.target.closest(".hl-swatch-btn");
      if (!btn) return;
      var c = normalizeColor(btn.getAttribute("data-color"));
      set(KEY_HL_COLOR, c);
      applyHlColorPref(c);
    });
  }

  if (hlFilterSwatches) {
    hlFilterSwatches.addEventListener("click", function (ev) {
      var btn = ev.target.closest && ev.target.closest(".hl-filter-btn");
      if (!btn) return;
      setHlFilter(btn.getAttribute("data-filter") || "all");
    });
  }

  if (hlNoteSwatches) {
    hlNoteSwatches.addEventListener("click", function (ev) {
      var btn = ev.target.closest && ev.target.closest(".hl-swatch-btn");
      if (!btn) return;
      syncNoteSwatches(btn.getAttribute("data-color"));
    });
  }

  if (settingsToggle && settingsPanel) {
    settingsToggle.addEventListener("click", function (ev) {
      ev.stopPropagation();
      toggleMenu(settingsToggle, settingsPanel);
    });
  }

  if (hlListToggle) {
    hlListToggle.addEventListener("click", function (ev) {
      ev.stopPropagation();
      toggleHlList();
    });
  }

  if (hlListBody) {
    hlListBody.addEventListener("click", function (ev) {
      var btn = ev.target.closest && ev.target.closest(".hl-list-item");
      if (!btn) return;
      var page = btn.getAttribute("data-page");
      var id = btn.getAttribute("data-id");
      if (!page || !id) return;
      if (page === pageKey()) {
        var mark = findMarkById(id);
        if (mark) {
          try {
            mark.scrollIntoView({ behavior: "smooth", block: "center" });
          } catch (e) {}
          openNoteModal(mark);
        }
        toggleHlList(false);
      } else {
        location.href = page + "#hl-" + encodeURIComponent(id);
      }
    });
  }

  document.addEventListener("click", function (ev) {
    var t = ev.target;
    if (t && t.closest && t.closest(".tb-menu")) return;
    closeAllMenus();
  });

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

  if (hlBtnMark)
    hlBtnMark.addEventListener("click", function () {
      createHighlight(false);
    });
  if (hlBtnNote)
    hlBtnNote.addEventListener("click", function () {
      createHighlight(true);
    });
  if (hlBtnCancel) hlBtnCancel.addEventListener("click", hidePopup);

  document.addEventListener("click", function (ev) {
    var t = ev.target;
    if (t && t.classList && t.classList.contains("cme-hl")) {
      openNoteModal(t);
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
      var color = normalizeColor(
        (hlNoteColor && hlNoteColor.value) || COLOR_DEFAULT
      );
      if (note) {
        mark.setAttribute("data-note", note);
        mark.classList.add("cme-hl-has-note");
      } else {
        mark.removeAttribute("data-note");
        mark.classList.remove("cme-hl-has-note");
      }
      applyColorToMark(mark, color);
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
      closeAllMenus();
      hideFloatTip();
    }
  });

  // deep-link from lista: #hl-id
  setTimeout(function () {
    var hash = location.hash || "";
    if (hash.indexOf("#hl-") === 0) {
      var id = decodeURIComponent(hash.slice(4));
      var mark = findMarkById(id);
      if (mark) {
        try {
          mark.scrollIntoView({ behavior: "smooth", block: "center" });
        } catch (e) {}
        openNoteModal(mark);
      }
    }
  }, 200);

  /* ---------- Barra de progresso de leitura ---------- */
  function updateReadProgress() {
    var bar = document.getElementById("read-progress-bar");
    var wrap = document.getElementById("read-progress");
    if (!bar || !wrap) return;
    var doc = document.documentElement;
    var body = document.body;
    var scrollTop = window.pageYOffset || doc.scrollTop || body.scrollTop || 0;
    var scrollHeight = Math.max(
      body.scrollHeight,
      doc.scrollHeight,
      body.offsetHeight,
      doc.offsetHeight
    );
    var clientHeight = window.innerHeight || doc.clientHeight || 0;
    var maxScroll = scrollHeight - clientHeight;
    var pct = 0;
    if (maxScroll > 0) {
      pct = (scrollTop / maxScroll) * 100;
    } else {
      pct = 100;
    }
    if (pct < 0) pct = 0;
    if (pct > 100) pct = 100;
    bar.style.width = pct.toFixed(2) + "%";
    wrap.setAttribute("aria-valuenow", String(Math.round(pct)));
  }

  var progressTicking = false;
  function onScrollProgress() {
    if (progressTicking) return;
    progressTicking = true;
    requestAnimationFrame(function () {
      updateReadProgress();
      progressTicking = false;
    });
  }

  window.addEventListener("scroll", onScrollProgress, { passive: true });
  window.addEventListener("resize", onScrollProgress, { passive: true });
  // MathJax / imagens mudam a altura da página
  window.addEventListener("load", function () {
    updateReadProgress();
    setTimeout(updateReadProgress, 400);
    setTimeout(updateReadProgress, 1200);
  });
  if (window.MathJax && MathJax.Hub) {
    MathJax.Hub.Queue(function () {
      updateReadProgress();
    });
  }
  updateReadProgress();

})();
