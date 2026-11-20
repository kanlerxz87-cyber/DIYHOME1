/* DIY HOME — privacy-preserving self-hosted analytics client
 *
 * Design goals (per project brief):
 *  - No cookies, no personal identifiers, no fingerprinting.
 *  - Only first-party, event-level data: event type, product code, page path, timestamp.
 *  - Best-effort beacon to a self-hosted collector endpoint (/api/collect).
 *  - If the collector is unreachable (static hosting has no backend), events are
 *    queued in sessionStorage and retried; nothing is sent to third parties.
 *
 * The five defined events:
 *   1. page_view        — a page is loaded
 *   2. guide_view       — a question-shaped guide page/section is opened
 *   3. table_view       — the product dashboard table is opened
 *   4. outbound_click   — a visitor clicks an outbound product (sponsored) link
 *   5. conversion_attempt — an outbound click that carries conversion intent (product link)
 *
 * NOTE: "the five defined events" are not enumerated in the project brief, so this
 * minimal set is defined here and flagged for confirmation in COORDINATION.md and
 * flagged.html.
 */

(function(){
  var CONFIG = {
    endpoint: '/api/collect',
    queueKey: 'diyhome_analytics_queue',
    maxQueue: 50,
    sendInterval: 15000
  };

  function nowIso(){
    return new Date().toISOString();
  }

  function safePath(){
    try{ return location.pathname.replace(/[^a-z0-9\/_\-]/gi,''); }catch(e){ return ''; }
  }

  function queue(event){
    var q = [];
    try{ q = JSON.parse(sessionStorage.getItem(CONFIG.queueKey) || '[]'); }catch(e){}
    if(q.length >= CONFIG.maxQueue){ q.shift(); }
    q.push({ t: nowIso(), e: event });
    try{ sessionStorage.setItem(CONFIG.queueKey, JSON.stringify(q)); }catch(e){}
    flush();
  }

  function flush(){
    var q = [];
    try{ q = JSON.parse(sessionStorage.getItem(CONFIG.queueKey) || '[]'); }catch(e){ return; }
    if(!q.length) return;
    if(!navigator.sendBeacon){
      // Best-effort fetch; failures are silent — privacy-first, never breaks the page.
      fetch(CONFIG.endpoint, {
        method:'POST',
        body: JSON.stringify({ events: q }),
        headers: { 'Content-Type': 'application/json' },
        keepalive: true
      }).catch(function(){});
      return;
    }
    var blob = new Blob([JSON.stringify({ events: q })], { type: 'application/json' });
    navigator.sendBeacon(CONFIG.endpoint, blob);
    try{ sessionStorage.removeItem(CONFIG.queueKey); }catch(e){}
  }

  // Public API
  window.diyhome = window.diyhome || {};
  window.diyhome.record = function(eventType, payload){
    var event = { type: eventType, path: safePath() };
    if(payload && payload.product) event.product = String(payload.product).replace(/[^a-z0-9\-]/gi,'');
    if(payload && payload.link) event.link = String(payload.link).replace(/[^a-z0-9:\/\.\-]/gi,'');
    queue(event);
  };

  // Auto record page view on load
  window.diyhome.record('page_view');

  // Outbound click counter: delegate clicks on sponsored product links
  function attachClickTracking(){
    document.addEventListener('click', function(ev){
      var link = ev.target.closest('a.product-link, a[rel~="sponsored"]');
      if(!link) return;
      var href = link.getAttribute('href') || '';
      var product = '';
      var m = href.match(/[B0-9]{8,12}/);
      if(m) product = m[0];
      window.diyhome.record('outbound_click', { product: product, link: href });
      window.diyhome.record('conversion_attempt', { product: product, link: href });
    }, { passive: true });
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', attachClickTracking);
  } else {
    attachClickTracking();
  }

  // Periodic retry of queued events
  setInterval(flush, CONFIG.sendInterval);
  if(window.addEventListener){
    window.addEventListener('beforeunload', flush, { passive: true });
  }
})();