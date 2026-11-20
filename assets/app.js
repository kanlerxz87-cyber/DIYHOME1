/* No cookies, persistent identifiers, referrers, search strings or fingerprinting. */
const endpoint = document.querySelector('meta[name="analytics-endpoint"]')?.content;
function track(event, product = null) {
  if (!endpoint || navigator.doNotTrack === '1' || navigator.globalPrivacyControl) return;
  const payload = JSON.stringify({event, page: location.pathname, product});
  fetch(endpoint, {method:'POST', body:payload, headers:{'Content-Type':'application/json'}, credentials:'omit', keepalive:true}).catch(()=>{});
}
track('page_view');
if (document.body.dataset.guide) track('guide_open');
document.addEventListener('click', e=>{
 const a=e.target.closest('a');
 if(a?.dataset.product) track('outbound_click',a.dataset.product);
 if(a?.getAttribute('href')==='feed.xml') track('feed_open');
});
const chips=[...document.querySelectorAll('[data-filter]')];
chips.forEach(b=>b.addEventListener('click',()=>{
 chips.forEach(x=>{x.classList.toggle('selected',x===b);x.setAttribute('aria-pressed',String(x===b));});
 document.querySelectorAll('[data-category]').forEach(c=>c.hidden=b.dataset.filter!=='all'&&c.dataset.category!==b.dataset.filter);
 track('category_select');
 const status=document.querySelector('#filter-status');if(status)status.textContent=`${document.querySelectorAll('[data-category]:not([hidden])').length} products shown`;
}));
document.querySelector('#register-search')?.addEventListener('input',e=>{
 document.querySelectorAll('tbody tr').forEach(r=>r.hidden=!r.textContent.toLowerCase().includes(e.target.value.toLowerCase()));
});
