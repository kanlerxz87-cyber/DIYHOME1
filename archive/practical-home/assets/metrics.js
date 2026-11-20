(() => {
  const {endpoint, page} = document.currentScript.dataset;
  if (!endpoint || navigator.globalPrivacyControl || navigator.doNotTrack === '1') return;
  const send = event => fetch(endpoint, {method: 'POST', body: JSON.stringify({event, page}), credentials: 'omit', referrerPolicy: 'no-referrer', keepalive: true}).catch(() => {});
  send('page_view');
  if (document.querySelector('main article.prose')) send('guide_view');
  function track(e) {
    const event = e.target.closest('a[data-event]')?.dataset.event;
    if (event) send(event);
  }
  document.addEventListener('click', track);
  document.addEventListener('auxclick', e => { if (e.button === 1) track(e); });
})();
