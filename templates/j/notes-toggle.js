/* Preferências da UI: modo das notas Gardner + tema claro/escuro.
   localStorage:
     cme-notes-mode = "all" | "click" | "off"
     cme-theme      = "light" | "dark"
*/
(function () {
  var KEY_MODE = "cme-notes-mode";
  var KEY_THEME = "cme-theme";
  var root = document.documentElement;
  var modeSelect = document.getElementById("notes-mode");
  var themeBtn = document.getElementById("toggle-theme");
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

  /* ---------- Notas ---------- */
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
        mark.setAttribute("aria-expanded", note.classList.contains("is-open") ? "true" : "false");
        mark.setAttribute("title", "Abrir/fechar nota de Gardner");
        mark.innerHTML = LUPA_SVG;
        continue;
      }

      // Nota sem marcador: cria lupa logo antes do bloco
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

    if (mode === "all" || mode === "off") {
      // Limpa estado de notas abertas no modo clique
      closeAllNotes();
    }
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

  /* ---------- Init ---------- */
  ensureMarks();

  var mode = normalizeMode(get(KEY_MODE, "click")); // padrão: lupa
  var theme = get(KEY_THEME, "light");
  applyMode(mode);
  applyTheme(theme);

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

  document.addEventListener("click", onMarkActivate);

  // Teclado: Enter/Espaço em <a class="note-mark">
  document.addEventListener("keydown", function (ev) {
    if (ev.key !== "Enter" && ev.key !== " ") return;
    var el = ev.target;
    if (!el || !el.classList || !el.classList.contains("note-mark")) return;
    ev.preventDefault();
    onMarkActivate(ev);
  });
})();
