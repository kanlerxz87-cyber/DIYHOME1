/**
 * Field & Fixture (DIYHOME1) — Privacy-Preserving Telemetry & Dashboard Helpers
 * Records the 5 defined events locally (for dashboard preview) and optionally
 * sends them to a configured self-hosted analytics endpoint via sendBeacon/fetch.
 *
 * Defined events:
 *   1. page_view
 *   2. guide_read
 *   3. product_impression
 *   4. outbound_affiliate_click
 *   5. reader_capture_submit
 */

(function () {
  "use strict";

  const STORAGE_KEY = "diyhome1_telemetry_v1";
  const CONFIG_ENDPOINT_KEY = "diyhome1_analytics_endpoint";
  const DEFINED_EVENTS = [
    "page_view",
    "guide_read",
    "product_impression",
    "outbound_affiliate_click",
    "reader_capture_submit"
  ];

  function getConfiguredEndpoint() {
    if (window.DIYHOME_ANALYTICS_ENDPOINT) {
      return String(window.DIYHOME_ANALYTICS_ENDPOINT);
    }
    try {
      return localStorage.getItem(CONFIG_ENDPOINT_KEY) || "";
    } catch {
      return "";
    }
  }

  function loadStore() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.counts && Array.isArray(parsed.recent)) {
          return parsed;
        }
      }
    } catch {
      // Ignore storage access errors
    }
    const counts = {};
    DEFINED_EVENTS.forEach((ev) => {
      counts[ev] = 0;
    });
    return { counts, recent: [] };
  }

  function saveStore(store) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
    } catch {
      // Ignore storage quota/privacy mode errors
    }
  }

  function recordEvent(eventName, meta) {
    if (!DEFINED_EVENTS.includes(eventName)) return;
    const payload = {
      event: eventName,
      page: window.location.pathname || "/",
      ts: new Date().toISOString(),
      meta: meta || {}
    };

    const store = loadStore();
    store.counts[eventName] = (store.counts[eventName] || 0) + 1;
    store.recent.unshift(payload);
    store.recent = store.recent.slice(0, 25);
    saveStore(store);

    const endpoint = getConfiguredEndpoint();
    if (endpoint) {
      try {
        const body = JSON.stringify(payload);
        if (navigator.sendBeacon) {
          const blob = new Blob([body], { type: "application/json" });
          navigator.sendBeacon(endpoint, blob);
        } else {
          fetch(endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body,
            keepalive: true
          }).catch(() => {});
        }
      } catch {
        // Never block navigation on telemetry failure
      }
    }
  }

  // 1. page_view
  recordEvent("page_view", { title: document.title.slice(0, 80) });

  // 2. product_impression (when product cards enter view or on load)
  document.addEventListener("DOMContentLoaded", function () {
    const productCards = document.querySelectorAll("[data-product-asin]");
    if (productCards.length > 0 && "IntersectionObserver" in window) {
      const seen = new Set();
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const asin = entry.target.getAttribute("data-product-asin");
              if (asin && !seen.has(asin)) {
                seen.add(asin);
                recordEvent("product_impression", { asin });
              }
            }
          });
        },
        { threshold: 0.4 }
      );
      productCards.forEach((card) => observer.observe(card));
    } else if (productCards.length > 0) {
      productCards.forEach((card) => {
        const asin = card.getAttribute("data-product-asin");
        if (asin) recordEvent("product_impression", { asin });
      });
    }

    // 3. outbound_affiliate_click
    document.querySelectorAll('a[rel~="sponsored"]').forEach((anchor) => {
      anchor.addEventListener("click", function () {
        recordEvent("outbound_affiliate_click", {
          asin: anchor.getAttribute("data-asin") || "",
          placement: anchor.getAttribute("data-placement") || "cta"
        });
      });
    });

    // 4. guide_read (50%+ scroll on buying guide pages)
    if (document.body.getAttribute("data-page-type") === "guide") {
      let guideReadSent = false;
      window.addEventListener(
        "scroll",
        function () {
          if (guideReadSent) return;
          const docHeight = document.documentElement.scrollHeight - window.innerHeight;
          if (docHeight <= 0 || window.scrollY / docHeight >= 0.5) {
            guideReadSent = true;
            recordEvent("guide_read", {
              guide: window.location.pathname
            });
          }
        },
        { passive: true }
      );
    }

    // 5. reader_capture_submit
    const captureForm = document.getElementById("reader-capture-form");
    if (captureForm) {
      captureForm.addEventListener("submit", function (e) {
        e.preventDefault();
        const topicEl = captureForm.querySelector("[name='topic']");
        const topic = topicEl ? topicEl.value.trim() : "";
        recordEvent("reader_capture_submit", { topic_category: topic || "general" });
        const statusEl = document.getElementById("reader-capture-status");
        if (statusEl) {
          statusEl.textContent =
            "Recorded locally (no PII stored). Static GitHub Pages has no mail server configured; subscribe via RSS feed.xml or configure a self-hosted endpoint to collect requests.";
          statusEl.hidden = false;
        }
        captureForm.reset();
      });
    }

    // Optional table filter helper
    document.querySelectorAll("[data-filter-table]").forEach((input) => {
      const tableId = input.getAttribute("data-filter-table");
      const table = document.getElementById(tableId);
      if (!table) return;
      input.addEventListener("input", function () {
        const q = input.value.toLowerCase().trim();
        table.querySelectorAll("tbody tr").forEach((row) => {
          const text = row.textContent.toLowerCase();
          row.style.display = text.includes(q) ? "" : "none";
        });
      });
    });

    // Render live local telemetry preview on Campaign Ledger page if present
    const telemetryContainer = document.getElementById("local-telemetry-preview");
    if (telemetryContainer) {
      const renderTelemetry = function () {
        const store = loadStore();
        const countsBody = document.getElementById("telemetry-counts-body");
        if (countsBody) {
          countsBody.innerHTML = DEFINED_EVENTS.map(
            (ev) =>
              `<tr><td><code>${ev}</code></td><td>${store.counts[ev] || 0}</td><td>Local browser preview (zero PII)</td></tr>`
          ).join("");
        }
        const recentBody = document.getElementById("telemetry-recent-body");
        if (recentBody) {
          if (store.recent.length === 0) {
            recentBody.innerHTML =
              '<tr><td colspan="4">No browser events recorded yet.</td></tr>';
          } else {
            recentBody.innerHTML = store.recent
              .slice(0, 10)
              .map(
                (item) =>
                  `<tr><td><code>${item.ts}</code></td><td><code>${item.event}</code></td><td><code>${item.page}</code></td><td><code>${JSON.stringify(item.meta)}</code></td></tr>`
              )
              .join("");
          }
        }
      };
      renderTelemetry();

      const endpointForm = document.getElementById("analytics-endpoint-form");
      const endpointInput = document.getElementById("analytics-endpoint-input");
      if (endpointInput) {
        endpointInput.value = getConfiguredEndpoint();
      }
      if (endpointForm && endpointInput) {
        endpointForm.addEventListener("submit", function (e) {
          e.preventDefault();
          try {
            localStorage.setItem(CONFIG_ENDPOINT_KEY, endpointInput.value.trim());
          } catch {}
          const msg = document.getElementById("endpoint-save-status");
          if (msg) {
            msg.textContent = endpointInput.value.trim()
              ? "Self-hosted analytics endpoint saved in browser config."
              : "Cleared analytics endpoint; using local browser preview only.";
            msg.hidden = false;
          }
        });
      }

      const resetBtn = document.getElementById("reset-telemetry-btn");
      if (resetBtn) {
        resetBtn.addEventListener("click", function () {
          try {
            localStorage.removeItem(STORAGE_KEY);
          } catch {}
          renderTelemetry();
        });
      }
    }
  });
})();
