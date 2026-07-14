/* Recursos de ebook: resume, TOC, busca, bookmarks, export, glossário, teclado, foco.
   localStorage: cme-resume, cme-bookmarks, cme-focus (opcional) + chaves cme-* existentes
*/
(function () {
  var KEY_RESUME = "cme-resume";
  var KEY_BOOKMARKS = "cme-bookmarks";
  var KEY_HL = "cme-highlights";
  var CHAPTERS = window.CME_CHAPTERS || [];
  var GLOSSARY = window.CME_GLOSSARY || [];

  function pageKey() {
    var p = location.pathname.split("/").pop() || "index.html";
    return p || "index.html";
  }

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

  function getJSON(key, fallback) {
    try {
      return JSON.parse(get(key, "null")) || fallback;
    } catch (e) {
      return fallback;
    }
  }

  function setJSON(key, obj) {
    set(key, JSON.stringify(obj));
  }

  function chapterIndex(id) {
    for (var i = 0; i < CHAPTERS.length; i++) {
      if (CHAPTERS[i].id === id) return i;
    }
    return -1;
  }

  function chapterById(id) {
    var i = chapterIndex(id);
    return i >= 0 ? CHAPTERS[i] : null;
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function truncate(s, n) {
    s = String(s || "").replace(/\s+/g, " ").trim();
    return s.length <= n ? s : s.slice(0, n - 1) + "…";
  }

  /* ---------- UI shell ---------- */
  function ensureShell() {
    if (document.getElementById("cme-reader-root")) return;

    var root = document.createElement("div");
    root.id = "cme-reader-root";
    root.innerHTML =
      '<button type="button" id="cme-toc-open" class="cme-fab cme-fab-toc" title="Sumário" aria-label="Abrir sumário">☰</button>' +
      '<button type="button" id="cme-search-open" class="cme-fab cme-fab-search" title="Buscar" aria-label="Buscar no livro">⌕</button>' +
      '<button type="button" id="cme-bookmark-btn" class="cme-fab cme-fab-bm" title="Marcar página" aria-label="Marcar página" aria-pressed="false">☆</button>' +
      '<button type="button" id="cme-focus-btn" class="cme-fab cme-fab-focus" title="Modo foco" aria-label="Modo foco" aria-pressed="false">⛶</button>' +
      '<button type="button" id="cme-glossary-open" class="cme-fab cme-fab-glos" title="Glossário" aria-label="Glossário">Aa</button>' +
      '<div id="cme-resume-banner" class="cme-resume-banner" hidden></div>' +
      '<div id="cme-drawer-backdrop" class="cme-drawer-backdrop" hidden></div>' +
      '<aside id="cme-toc-drawer" class="cme-drawer cme-toc-drawer" hidden aria-label="Sumário">' +
      '  <div class="cme-drawer-head"><strong>Sumário</strong><button type="button" class="cme-drawer-close" data-close="toc" aria-label="Fechar">×</button></div>' +
      '  <div id="cme-toc-list" class="cme-toc-list"></div>' +
      "</aside>" +
      '<aside id="cme-search-drawer" class="cme-drawer cme-search-drawer" hidden aria-label="Busca">' +
      '  <div class="cme-drawer-head"><strong>Buscar no livro</strong><button type="button" class="cme-drawer-close" data-close="search" aria-label="Fechar">×</button></div>' +
      '  <input type="search" id="cme-search-input" class="cme-search-input" placeholder="Digite um termo..." autocomplete="off" />' +
      '  <div id="cme-search-results" class="cme-search-results"></div>' +
      "</aside>" +
      '<aside id="cme-glossary-drawer" class="cme-drawer cme-glossary-drawer" hidden aria-label="Glossário">' +
      '  <div class="cme-drawer-head"><strong>Glossário</strong><button type="button" class="cme-drawer-close" data-close="glossary" aria-label="Fechar">×</button></div>' +
      '  <input type="search" id="cme-glossary-filter" class="cme-search-input" placeholder="Filtrar termo..." autocomplete="off" />' +
      '  <div id="cme-glossary-list" class="cme-glossary-list"></div>' +
      "</aside>" +
      '<aside id="cme-bm-drawer" class="cme-drawer cme-bm-drawer" hidden aria-label="Marcadores">' +
      '  <div class="cme-drawer-head"><strong>Marcadores</strong><button type="button" class="cme-drawer-close" data-close="bm" aria-label="Fechar">×</button></div>' +
      '  <div id="cme-bm-list" class="cme-bm-list"></div>' +
      '  <button type="button" id="cme-export-notes" class="cme-export-btn">Exportar anotações</button>' +
      "</aside>";
    document.body.appendChild(root);
  }

  function closeDrawers() {
    ["cme-toc-drawer", "cme-search-drawer", "cme-glossary-drawer", "cme-bm-drawer"].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.hidden = true;
    });
    var bd = document.getElementById("cme-drawer-backdrop");
    if (bd) bd.hidden = true;
    document.documentElement.classList.remove("cme-drawer-open");
  }

  function openDrawer(id) {
    closeDrawers();
    // Fechar painéis flutuantes da barra para evitar sobreposição
    var sp = document.getElementById("settings-panel");
    var st = document.getElementById("settings-toggle");
    if (sp) {
      sp.hidden = true;
      if (st) st.setAttribute("aria-expanded", "false");
    }
    var hlp = document.getElementById("hl-list-panel");
    var hlt = document.getElementById("hl-list-toggle");
    if (hlp) {
      hlp.hidden = true;
      if (hlt) hlt.setAttribute("aria-expanded", "false");
    }

    var el = document.getElementById(id);
    var bd = document.getElementById("cme-drawer-backdrop");
    if (el) el.hidden = false;
    if (bd) bd.hidden = false;
    document.documentElement.classList.add("cme-drawer-open");
  }

  /* ---------- Sumário lateral ---------- */
  function renderToc() {
    var list = document.getElementById("cme-toc-list");
    if (!list) return;
    var cur = pageKey();
    var resume = getJSON(KEY_RESUME, null);
    var bms = getJSON(KEY_BOOKMARKS, []);
    var bmPages = {};
    bms.forEach(function (b) {
      bmPages[b.page] = true;
    });
    var html = "";
    CHAPTERS.forEach(function (ch, i) {
      var active = ch.id === cur ? " is-active" : "";
      var marked = bmPages[ch.id] ? " is-bookmarked" : "";
      var resumed = resume && resume.page === ch.id ? " is-resume" : "";
      html +=
        '<a class="cme-toc-item' +
        active +
        marked +
        resumed +
        '" href="' +
        ch.id +
        '"><span class="cme-toc-num">' +
        (i + 1) +
        '</span><span class="cme-toc-title">' +
        escapeHtml(ch.short || ch.title) +
        "</span></a>";
    });
    list.innerHTML = html;
  }

  /* ---------- Resume ---------- */
  function saveResume() {
    var page = pageKey();
    if (page === "index.html") return;
    var doc = document.documentElement;
    var body = document.body;
    var scrollTop = window.pageYOffset || doc.scrollTop || 0;
    var scrollHeight = Math.max(body.scrollHeight, doc.scrollHeight);
    var clientHeight = window.innerHeight || doc.clientHeight || 0;
    var maxScroll = Math.max(1, scrollHeight - clientHeight);
    var pct = Math.min(100, Math.max(0, (scrollTop / maxScroll) * 100));
    setJSON(KEY_RESUME, {
      page: page,
      scrollY: scrollTop,
      scrollPct: pct,
      updated: Date.now()
    });
  }


  function restoreBookmarkScroll() {
    var m = location.hash && location.hash.match(/^#cme-bm=(\d+)/);
    if (!m) return;
    var cur = pageKey();
    if (sessionStorage.getItem("cme-bm-restored-" + cur)) return;
    sessionStorage.setItem("cme-bm-restored-" + cur, "1");
    var y = parseInt(m[1], 10) || 0;
    setTimeout(function () {
      window.scrollTo(0, y);
    }, 100);
  }

  function maybeShowResumeBanner() {
    var banner = document.getElementById("cme-resume-banner");
    if (!banner) return;
    var resume = getJSON(KEY_RESUME, null);
    if (!resume || !resume.page) {
      banner.hidden = true;
      return;
    }
    var ch = chapterById(resume.page);
    if (!ch) {
      banner.hidden = true;
      return;
    }
    // show on index or if different page
    var cur = pageKey();
    if (cur === resume.page) {
      // restore scroll once (bookmark hash has priority over resume)
      var bmHash = location.hash && location.hash.match(/^#cme-bm=(\d+)/);
      if (bmHash) {
        if (!sessionStorage.getItem("cme-bm-restored-" + cur)) {
          sessionStorage.setItem("cme-bm-restored-" + cur, "1");
          var by = parseInt(bmHash[1], 10) || 0;
          setTimeout(function () {
            window.scrollTo(0, by);
          }, 100);
        }
      } else if (!sessionStorage.getItem("cme-restored-" + cur) && resume.scrollY > 80) {
        sessionStorage.setItem("cme-restored-" + cur, "1");
        setTimeout(function () {
          window.scrollTo(0, resume.scrollY);
        }, 100);
      }
      banner.hidden = true;
      return;
    }
    if (cur !== "index.html" && cur !== resume.page) {
      // optional small hint only on index
    }
    if (cur === "index.html") {
      banner.hidden = false;
      banner.innerHTML =
        '<span>Continuar: <strong>' +
        escapeHtml(ch.short || ch.title) +
        "</strong> (" +
        Math.round(resume.scrollPct || 0) +
        "%)</span>" +
        '<span class="cme-resume-actions">' +
        '<a class="cme-resume-go" href="' +
        ch.id +
        '">Continuar</a>' +
        '<button type="button" id="cme-resume-dismiss" class="cme-resume-dismiss">Dispensar</button>' +
        "</span>";
      var dis = document.getElementById("cme-resume-dismiss");
      if (dis) {
        dis.addEventListener("click", function () {
          banner.hidden = true;
        });
      }
    } else {
      banner.hidden = true;
    }
  }

  /* ---------- Bookmarks ---------- */
  function getBookmarks() {
    return getJSON(KEY_BOOKMARKS, []);
  }

  function setBookmarks(list) {
    setJSON(KEY_BOOKMARKS, list);
    updateBookmarkButton();
    renderBookmarks();
    renderToc();
  }

  function isBookmarked(page) {
    return getBookmarks().some(function (b) {
      return b.page === page;
    });
  }

  function toggleBookmark() {
    var page = pageKey();
    if (page === "index.html") return;
    var list = getBookmarks();
    var idx = -1;
    for (var i = 0; i < list.length; i++) {
      if (list[i].page === page) {
        idx = i;
        break;
      }
    }
    if (idx >= 0) {
      list.splice(idx, 1);
    } else {
      var ch = chapterById(page);
      list.push({
        id: "bm-" + Date.now().toString(36),
        page: page,
        title: ch ? ch.title : page,
        scrollY: window.pageYOffset || 0,
        created: Date.now()
      });
    }
    setBookmarks(list);
  }

  function updateBookmarkButton() {
    var btn = document.getElementById("cme-bookmark-btn");
    if (!btn) return;
    var on = isBookmarked(pageKey());
    btn.textContent = on ? "★" : "☆";
    btn.setAttribute("aria-pressed", on ? "true" : "false");
    btn.classList.toggle("is-on", on);
  }

  function renderBookmarks() {
    var box = document.getElementById("cme-bm-list");
    if (!box) return;
    var list = getBookmarks();
    if (!list.length) {
      box.innerHTML = '<p class="cme-empty">Nenhum marcador. Use ★ para marcar a página atual.</p>';
      return;
    }
    list = list.slice().sort(function (a, b) {
      return (b.created || 0) - (a.created || 0);
    });
    var html = "";
    list.forEach(function (b) {
      var href = b.page || "";
      if (b.scrollY) href += "#cme-bm=" + Math.round(b.scrollY);
      html +=
        '<div class="cme-bm-item">' +
        '<a href="' +
        escapeHtml(href) +
        '">' +
        escapeHtml(truncate(b.title || b.page, 60)) +
        "</a>" +
        '<button type="button" class="cme-bm-remove" data-id="' +
        escapeHtml(b.id) +
        '" aria-label="Remover marcador">×</button>' +
        "</div>";
    });
    box.innerHTML = html;
  }

  /* ---------- Export ---------- */
  function exportNotes() {
    var highlights = getJSON(KEY_HL, {});
    var bookmarks = getBookmarks();
    var resume = getJSON(KEY_RESUME, null);
    var lines = [];
    lines.push("# Anotações — Cálculo Tornado Fácil");
    lines.push("");
    lines.push("Exportado em " + new Date().toLocaleString("pt-BR"));
    lines.push("");
    if (resume && resume.page) {
      var ch = chapterById(resume.page);
      lines.push("## Progresso");
      lines.push(
        "- Última página: " +
          (ch ? ch.title : resume.page) +
          " (" +
          Math.round(resume.scrollPct || 0) +
          "%)"
      );
      lines.push("");
    }
    lines.push("## Marcadores");
    if (!bookmarks.length) lines.push("_Nenhum._");
    else {
      bookmarks.forEach(function (b) {
        lines.push("- [" + (b.title || b.page) + "](" + b.page + ")");
      });
    }
    lines.push("");
    lines.push("## Destaques e notas");
    var pages = Object.keys(highlights);
    if (!pages.length) lines.push("_Nenhum._");
    pages.forEach(function (page) {
      var ch = chapterById(page);
      lines.push("");
      lines.push("### " + (ch ? ch.title : page));
      (highlights[page] || []).forEach(function (h) {
        lines.push("");
        lines.push("> " + (h.text || "").replace(/\n/g, " "));
        if (h.note) lines.push("");
        if (h.note) lines.push("**Nota:** " + h.note);
        if (h.color) lines.push("_Cor: " + h.color + "_");
      });
    });
    lines.push("");
    lines.push("---");
    lines.push("");
    lines.push("```json");
    lines.push(
      JSON.stringify(
        { resume: resume, bookmarks: bookmarks, highlights: highlights },
        null,
        2
      )
    );
    lines.push("```");

    var blob = new Blob([lines.join("\n")], { type: "text/markdown;charset=utf-8" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = "calculo-tornado-facil-anotacoes.md";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () {
      URL.revokeObjectURL(url);
    }, 500);
  }

  /* ---------- Search ---------- */
  var searchIndex = null;
  var searchLoading = false;
  var searchWaiters = [];

  function loadSearchIndex(cb) {
    if (searchIndex) {
      cb(searchIndex);
      return;
    }
    if (typeof cb === "function") searchWaiters.push(cb);
    if (searchLoading) return;
    searchLoading = true;
    function flush(data) {
      searchLoading = false;
      var q = searchWaiters.slice();
      searchWaiters = [];
      q.forEach(function (fn) {
        try {
          fn(data);
        } catch (e) {}
      });
    }
    fetch("j/search-index.json")
      .then(function (r) {
        return r.json();
      })
      .then(function (data) {
        searchIndex = data;
        flush(data);
      })
      .catch(function () {
        // fallback: titles only
        searchIndex = {
          pages: CHAPTERS.map(function (ch) {
            return { id: ch.id, title: ch.title, text: ch.title };
          })
        };
        flush(searchIndex);
      });
  }

  function runSearch(q) {
    var box = document.getElementById("cme-search-results");
    if (!box) return;
    q = (q || "").trim().toLowerCase();
    if (q.length < 2) {
      box.innerHTML = '<p class="cme-empty">Digite ao menos 2 caracteres.</p>';
      return;
    }
    loadSearchIndex(function (idx) {
      var pages = (idx && idx.pages) || [];
      var hits = [];
      pages.forEach(function (p) {
        var title = (p.title || "").toLowerCase();
        var text = (p.text || "").toLowerCase();
        var pos = text.indexOf(q);
        var inTitle = title.indexOf(q) >= 0;
        if (pos >= 0 || inTitle) {
          var snippet = "";
          if (pos >= 0) {
            var a = Math.max(0, pos - 40);
            var b = Math.min(text.length, pos + q.length + 60);
            snippet = (p.text || "").slice(a, b).replace(/\s+/g, " ");
            if (a > 0) snippet = "…" + snippet;
            if (b < text.length) snippet = snippet + "…";
          } else {
            snippet = p.title;
          }
          hits.push({
            id: p.id,
            title: p.title,
            snippet: snippet,
            score: inTitle ? 2 : 1
          });
        }
      });
      hits.sort(function (a, b) {
        return b.score - a.score;
      });
      hits = hits.slice(0, 40);
      if (!hits.length) {
        box.innerHTML = '<p class="cme-empty">Nenhum resultado.</p>';
        return;
      }
      var html = "";
      hits.forEach(function (h) {
        html +=
          '<a class="cme-search-hit" href="' +
          escapeHtml(h.id) +
          '"><strong>' +
          escapeHtml(h.title) +
          "</strong><span>" +
          escapeHtml(h.snippet) +
          "</span></a>";
      });
      box.innerHTML = html;
    });
  }

  /* ---------- Glossary ---------- */
  function renderGlossary(filter) {
    var box = document.getElementById("cme-glossary-list");
    if (!box) return;
    filter = (filter || "").trim().toLowerCase();
    var items = GLOSSARY.filter(function (g) {
      if (!filter) return true;
      return (
        g.term.toLowerCase().indexOf(filter) >= 0 ||
        g.def.toLowerCase().indexOf(filter) >= 0
      );
    });
    if (!items.length) {
      box.innerHTML = '<p class="cme-empty">Nenhum termo.</p>';
      return;
    }
    var html = "";
    items.forEach(function (g) {
      html +=
        '<details class="cme-glos-item"><summary>' +
        escapeHtml(g.term) +
        "</summary><p>" +
        escapeHtml(g.def) +
        "</p></details>";
    });
    box.innerHTML = html;
  }

  /* ---------- Focus mode ---------- */
  function setFocusMode(on) {
    document.documentElement.classList.toggle("cme-focus", !!on);
    var btn = document.getElementById("cme-focus-btn");
    if (btn) {
      btn.setAttribute("aria-pressed", on ? "true" : "false");
      btn.classList.toggle("is-on", !!on);
    }
  }

  function toggleFocus() {
    setFocusMode(!document.documentElement.classList.contains("cme-focus"));
  }

  /* ---------- Keyboard ---------- */
  function goChapter(delta) {
    var i = chapterIndex(pageKey());
    if (i < 0) return;
    var j = i + delta;
    if (j < 0 || j >= CHAPTERS.length) return;
    location.href = CHAPTERS[j].id;
  }

  /* ---------- Wire ---------- */
  function wire() {
    ensureShell();
    renderToc();
    updateBookmarkButton();
    renderBookmarks();
    renderGlossary("");
    maybeShowResumeBanner();
    restoreBookmarkScroll();

    var tocOpen = document.getElementById("cme-toc-open");
    var searchOpen = document.getElementById("cme-search-open");
    var glosOpen = document.getElementById("cme-glossary-open");
    var bmBtn = document.getElementById("cme-bookmark-btn");
    var focusBtn = document.getElementById("cme-focus-btn");
    var backdrop = document.getElementById("cme-drawer-backdrop");

    if (tocOpen)
      tocOpen.addEventListener("click", function () {
        openDrawer("cme-toc-drawer");
        renderToc();
      });
    if (searchOpen)
      searchOpen.addEventListener("click", function () {
        openDrawer("cme-search-drawer");
        var inp = document.getElementById("cme-search-input");
        if (inp) {
          inp.focus();
          loadSearchIndex(function () {});
        }
      });
    if (glosOpen)
      glosOpen.addEventListener("click", function () {
        openDrawer("cme-glossary-drawer");
      });
    if (bmBtn) {
      bmBtn.addEventListener("click", function (ev) {
        if (ev.altKey || ev.shiftKey) {
          openDrawer("cme-bm-drawer");
          renderBookmarks();
        } else {
          toggleBookmark();
        }
      });
      bmBtn.addEventListener("contextmenu", function (ev) {
        ev.preventDefault();
        openDrawer("cme-bm-drawer");
        renderBookmarks();
      });
      // long press alternative: double-click opens list
      bmBtn.addEventListener("dblclick", function () {
        openDrawer("cme-bm-drawer");
        renderBookmarks();
      });
    }
    if (focusBtn) focusBtn.addEventListener("click", toggleFocus);
    if (backdrop) backdrop.addEventListener("click", closeDrawers);

    document.querySelectorAll(".cme-drawer-close").forEach(function (btn) {
      btn.addEventListener("click", closeDrawers);
    });

    var searchInput = document.getElementById("cme-search-input");
    if (searchInput) {
      var t = null;
      searchInput.addEventListener("input", function () {
        clearTimeout(t);
        t = setTimeout(function () {
          runSearch(searchInput.value);
        }, 180);
      });
    }

    var glosFilter = document.getElementById("cme-glossary-filter");
    if (glosFilter) {
      glosFilter.addEventListener("input", function () {
        renderGlossary(glosFilter.value);
      });
    }

    var bmList = document.getElementById("cme-bm-list");
    if (bmList) {
      bmList.addEventListener("click", function (ev) {
        var btn = ev.target.closest && ev.target.closest(".cme-bm-remove");
        if (!btn) return;
        var id = btn.getAttribute("data-id");
        setBookmarks(
          getBookmarks().filter(function (b) {
            return b.id !== id;
          })
        );
      });
    }

    var exp = document.getElementById("cme-export-notes");
    if (exp) exp.addEventListener("click", exportNotes);

    // also add export + bookmarks entry in settings if present
    var settingsPanel = document.getElementById("settings-panel");
    if (settingsPanel && !document.getElementById("cme-settings-extra")) {
      var extra = document.createElement("div");
      extra.id = "cme-settings-extra";
      extra.className = "tb-menu-row";
      extra.innerHTML =
        '<span class="tb-menu-label">Leitura</span>' +
        '<button type="button" id="cme-open-bookmarks" class="tb-btn">Marcadores</button> ' +
        '<button type="button" id="cme-do-export" class="tb-btn">Exportar anotações</button>';
      settingsPanel.appendChild(extra);
      document.getElementById("cme-open-bookmarks").addEventListener("click", function () {
        openDrawer("cme-bm-drawer");
        renderBookmarks();
      });
      document.getElementById("cme-do-export").addEventListener("click", exportNotes);
    }

    // resume save
    var saveT = null;
    window.addEventListener(
      "scroll",
      function () {
        clearTimeout(saveT);
        saveT = setTimeout(saveResume, 250);
      },
      { passive: true }
    );
    window.addEventListener("beforeunload", saveResume);


    // keyboard
    document.addEventListener("keydown", function (ev) {
      var tag = (ev.target && ev.target.tagName) || "";
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || ev.target.isContentEditable) {
        if (ev.key === "Escape") closeDrawers();
        return;
      }
      if (ev.key === "Escape") {
        closeDrawers();
        setFocusMode(false);
        return;
      }
      if (ev.key === "ArrowLeft" && !ev.metaKey && !ev.ctrlKey && !ev.altKey) {
        ev.preventDefault();
        goChapter(-1);
      } else if (ev.key === "ArrowRight" && !ev.metaKey && !ev.ctrlKey && !ev.altKey) {
        ev.preventDefault();
        goChapter(1);
      } else if ((ev.key === "t" || ev.key === "T") && !ev.metaKey && !ev.ctrlKey) {
        openDrawer("cme-toc-drawer");
        renderToc();
      } else if ((ev.key === "f" || ev.key === "F") && !ev.metaKey && !ev.ctrlKey && !ev.shiftKey) {
        // avoid conflict with browser find if ctrl - we only use plain f when not in input
        // skip plain f to not fight browser; use /
      } else if (ev.key === "/" && !ev.metaKey && !ev.ctrlKey) {
        ev.preventDefault();
        openDrawer("cme-search-drawer");
        var inp = document.getElementById("cme-search-input");
        if (inp) inp.focus();
      } else if ((ev.key === "b" || ev.key === "B") && !ev.metaKey && !ev.ctrlKey) {
        toggleBookmark();
      } else if ((ev.key === "g" || ev.key === "G") && !ev.metaKey && !ev.ctrlKey) {
        openDrawer("cme-glossary-drawer");
      }
    });

    // focus mode: show toolbar on mousemove near top
    var hideT = null;
    document.addEventListener("mousemove", function (ev) {
      if (!document.documentElement.classList.contains("cme-focus")) return;
      if (ev.clientY < 64) {
        document.documentElement.classList.add("cme-focus-peek");
        clearTimeout(hideT);
        hideT = setTimeout(function () {
          document.documentElement.classList.remove("cme-focus-peek");
        }, 1800);
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", wire);
  } else {
    wire();
  }
})();
