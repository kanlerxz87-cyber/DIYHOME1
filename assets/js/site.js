/* DIY Home Upgrades — site behaviour.
 * No cookies. No third-party requests. No cross-site identifiers.
 * Clicks to Amazon are observed, never intercepted: the browser navigates normally.
 */
(function () {
  "use strict";

  var CFG = window.DIYHOME_CONFIG || {};
  var QUEUE_KEY = "diyhome.events.v1";
  var SID_KEY = "diyhome.sid";
  var MAX_QUEUE = 200;
  var SEND_TIMEOUT = 2500;

  /* ---------- privacy switches ---------- */

  function trackingAllowed() {
    if (CFG.respectDnt === false) return true;
    if (navigator.globalPrivacyControl === true) return false;
    var dnt = navigator.doNotTrack || window.doNotTrack || navigator.msDoNotTrack;
    if (dnt === "1" || dnt === "yes") return false;
    return true;
  }

  function sessionId() {
    try {
      var id = sessionStorage.getItem(SID_KEY);
      if (!id) {
        id = (window.crypto && crypto.randomUUID)
          ? crypto.randomUUID()
          : "s-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 10);
        sessionStorage.setItem(SID_KEY, id);
      }
      return id;
    } catch (err) {
      return null;
    }
  }

  function readQueue() {
    try {
      var raw = localStorage.getItem(QUEUE_KEY);
      var parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch (err) {
      return [];
    }
  }

  function writeQueue(rows) {
    try {
      localStorage.setItem(QUEUE_KEY, JSON.stringify(rows.slice(-MAX_QUEUE)));
    } catch (err) {
      /* storage full or blocked: measurement degrades, the page does not */
    }
  }

  function referrerClass() {
    var ref = document.referrer || "";
    if (!ref) return "none";
    try {
      var host = new URL(ref).hostname;
      if (host === location.hostname) return "internal";
      if (/google\.|bing\.|duckduckgo\.|ecosia\.|brave\./.test(host)) return "search";
      return "external";
    } catch (err) {
      return "unknown";
    }
  }

  /* ---------- the five events ---------- */

  function record(name, payload) {
    var row = {
      e: name,
      ts: new Date().toISOString(),
      path: location.pathname,
      sid: sessionId(),
      site: CFG.siteId || "diyhome1"
    };
    if (payload) {
      for (var k in payload) {
        if (Object.prototype.hasOwnProperty.call(payload, k) && payload[k] !== undefined && payload[k] !== null) {
          row[k] = payload[k];
        }
      }
    }
    var rows = readQueue();
    rows.push(row);
    writeQueue(rows);
    send(row);
    return row;
  }

  function send(row) {
    var endpoint = (CFG.endpoint || "").trim();
    if (!endpoint) return; // no endpoint configured: nothing leaves the browser
    if (!trackingAllowed()) return;
    var body = JSON.stringify(row);
    try {
      if (navigator.sendBeacon) {
        var blob = new Blob([body], { type: "application/json" });
        if (navigator.sendBeacon(endpoint, blob)) return;
      }
      var xhr = new XMLHttpRequest();
      xhr.open("POST", endpoint, true);
      xhr.setRequestHeader("Content-Type", "application/json");
      xhr.timeout = SEND_TIMEOUT;
      xhr.send(body);
    } catch (err) {
      /* silent by design: analytics must never break a page or a click */
    }
  }

  /* ---------- 1. page_view ---------- */

  if (trackingAllowed()) {
    record("page_view", { referrer_class: referrerClass() });
  }

  /* ---------- 2. disclosure_view ---------- */

  (function disclosure() {
    var strip = document.querySelector("[data-disclosure]");
    if (!strip || !("IntersectionObserver" in window)) return;
    var seen = false;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (seen || !entry.isIntersecting || entry.intersectionRatio < 0.5) return;
        seen = true;
        record("disclosure_view", { position: "masthead" });
        io.disconnect();
      });
    }, { threshold: [0.5] });
    io.observe(strip);
  })();

  /* ---------- 3. outbound_click ---------- */

  document.addEventListener("click", function (ev) {
    var link = ev.target.closest ? ev.target.closest("a[data-sponsored='amazon']") : null;
    if (!link) return;
    record("outbound_click", {
      asin: link.getAttribute("data-asin") || "",
      link_kind: link.getAttribute("data-link-kind") || "product"
    });
  }, true);

  /* ---------- 4. guide_read ---------- */

  (function guideRead() {
    var slug = document.body.getAttribute("data-guide-slug");
    if (!slug) return;
    var fired = false;
    function check() {
      if (fired) return;
      var doc = document.documentElement;
      var scrolled = window.scrollY + window.innerHeight;
      var height = doc.scrollHeight;
      if (height <= 0) return;
      if (scrolled / height >= 0.6) {
        fired = true;
        record("guide_read", { slug: slug, depth: "60" });
        window.removeEventListener("scroll", throttled, { passive: true });
      }
    }
    var ticking = false;
    function throttled() {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(function () { ticking = false; check(); });
    }
    window.addEventListener("scroll", throttled, { passive: true });
    check();
  })();

  /* ---------- 5. site_search + results rendering ---------- */

  var INDEX = window.DIYHOME_INDEX || [];

  function textOf(item) {
    return (item.title + " " + (item.summary || "") + " " + (item.tags || []).join(" ") + " " + item.path).toLowerCase();
  }

  function search(query) {
    var q = (query || "").trim().toLowerCase();
    if (!q) return [];
    var terms = q.split(/\s+/).filter(Boolean);
    return INDEX.map(function (item) {
      var hay = textOf(item);
      var hits = terms.filter(function (t) { return hay.indexOf(t) !== -1; });
      return { item: item, score: hits.length };
    }).filter(function (r) { return r.score === terms.length; })
      .sort(function (a, b) { return b.score - a.score; })
      .map(function (r) { return r.item; });
  }

  function renderResults(container, items, query) {
    container.innerHTML = "";
    if (!items.length) {
      var p = document.createElement("p");
      p.className = "empty";
      p.textContent = "Nothing matched \u201c" + query + "\u201d. Try \u201cwallpaper\u201d, \u201cpaper towel\u201d, \u201ccabinet\u201d or \u201cdisclosure\u201d.";
      container.appendChild(p);
      return;
    }
    items.forEach(function (item) {
      var wrap = document.createElement("div");
      wrap.className = "result";
      var h = document.createElement("h3");
      var a = document.createElement("a");
      a.href = item.url;
      a.textContent = item.title;
      h.appendChild(a);
      var path = document.createElement("div");
      path.className = "path";
      path.textContent = item.kind + " \u00b7 " + item.path;
      var p = document.createElement("p");
      p.textContent = item.summary || "";
      wrap.appendChild(h);
      wrap.appendChild(path);
      wrap.appendChild(p);
      container.appendChild(wrap);
    });
  }

  (function siteSearch() {
    var form = document.querySelector("[data-search-form]");
    if (form) {
      form.addEventListener("submit", function (ev) {
        var input = form.querySelector("input[name='q']");
        var q = input ? input.value.trim() : "";
        if (!q) { ev.preventDefault(); return; }
        /* navigation proceeds; the results page records the query once */
      });
    }

    var page = document.body.getAttribute("data-page");
    if (page !== "search") return;
    var params = new URLSearchParams(location.search);
    var q = (params.get("q") || "").trim();
    var out = document.getElementById("search-results");
    var field = document.querySelector("[data-search-form] input[name='q']");
    if (field && q) field.value = q;
    if (!out) return;
    var items = search(q);
    if (q) record("site_search", { query: q.slice(0, 120), result_count: items.length });
    renderResults(out, items, q);
    var count = document.getElementById("search-count");
    if (count) {
      count.textContent = q
        ? items.length + (items.length === 1 ? " result for \u201c" : " results for \u201c") + q + "\u201d"
        : "Type a word above to search the site.";
    }
  })();

  /* ---------- product table filter ---------- */

  (function productTable() {
    var table = document.getElementById("product-table");
    if (!table) return;
    var input = document.getElementById("product-filter");
    var chips = document.querySelectorAll("[data-filter-cat]");
    var rows = Array.prototype.slice.call(table.querySelectorAll("tbody tr"));
    var activeCat = "all";
    var counts = document.getElementById("product-count");

    function apply() {
      var q = (input && input.value || "").trim().toLowerCase();
      var shown = 0;
      rows.forEach(function (row) {
        var cat = row.getAttribute("data-category");
        var hay = row.textContent.toLowerCase();
        var ok = (activeCat === "all" || cat === activeCat) && (!q || hay.indexOf(q) !== -1);
        row.hidden = !ok;
        if (ok) shown++;
      });
      if (counts) counts.textContent = shown + " of " + rows.length + " shown";
    }

    if (input) input.addEventListener("input", apply);
    Array.prototype.forEach.call(chips, function (chip) {
      chip.addEventListener("click", function () {
        activeCat = chip.getAttribute("data-filter-cat");
        Array.prototype.forEach.call(chips, function (c) {
          c.setAttribute("aria-pressed", c === chip ? "true" : "false");
        });
        apply();
      });
    });
    apply();
  })();

  /* ---------- local event viewer (measurement page) ---------- */

  (function localEvents() {
    if (document.body.getAttribute("data-page") !== "measurement") return;
    var host = document.getElementById("local-events");
    var summary = document.getElementById("local-summary");
    if (!host) return;

    function paint() {
      var rows = readQueue();
      if (summary) {
        summary.textContent = rows.length
          ? rows.length + " event" + (rows.length === 1 ? "" : "s") + " held in this browser"
          : "No events in this browser yet";
      }
      host.innerHTML = "";
      if (!rows.length) {
        var p = document.createElement("p");
        p.className = "empty";
        p.textContent = "Nothing recorded in this browser yet. Browse a product page, then come back.";
        host.appendChild(p);
        return;
      }
      var table = document.createElement("table");
      var head = document.createElement("thead");
      head.innerHTML = "<tr><th>Time (UTC)</th><th>Event</th><th>Path</th><th>Detail</th></tr>";
      var body = document.createElement("tbody");
      rows.slice().reverse().slice(0, 50).forEach(function (row) {
        var tr = document.createElement("tr");
        var detail = [];
        ["asin", "slug", "query", "result_count", "referrer_class", "position", "depth"].forEach(function (k) {
          if (row[k] !== undefined && row[k] !== "") detail.push(k + ": " + row[k]);
        });
        tr.innerHTML = "<td class=\"mono\">" + (row.ts || "").replace("T", " ").slice(0, 19) +
          "</td><td class=\"mono\">" + row.e +
          "</td><td class=\"mono\">" + (row.path || "") +
          "</td><td>" + (detail.join(" \u00b7 ") || "\u2014") + "</td>";
        body.appendChild(tr);
      });
      table.appendChild(head);
      table.appendChild(body);
      host.appendChild(table);
    }

    paint();
    var clear = document.getElementById("clear-events");
    if (clear) {
      clear.addEventListener("click", function () {
        try { localStorage.removeItem(QUEUE_KEY); } catch (err) {}
        paint();
      });
    }
    var exportBtn = document.getElementById("export-events");
    if (exportBtn) {
      exportBtn.addEventListener("click", function () {
        var blob = new Blob([JSON.stringify(readQueue(), null, 2)], { type: "application/json" });
        var a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = "diyhome-local-events.json";
        a.click();
        setTimeout(function () { URL.revokeObjectURL(a.href); }, 2000);
      });
    }
  })();
})();
