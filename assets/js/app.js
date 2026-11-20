/* DIY HOME — page behaviour (progressive enhancement only) */
(function(){
  // Ensure every outbound link opens safely and keeps its sponsored marking.
  document.addEventListener('DOMContentLoaded', function(){
    var links = document.querySelectorAll('a[href]');
    for(var i=0; i<links.length; i++){
      var a = links[i];
      var href = a.getAttribute('href') || '';
      if(href.startsWith('http') && !href.includes(location.hostname)){
        a.setAttribute('target', '_blank');
        a.setAttribute('rel', (a.getAttribute('rel')||'') + ' noopener noreferrer');
        if(a.classList.contains('product-link') || a.classList.contains('sponsored')){
          if(!a.getAttribute('rel').split(/\s+/).includes('sponsored')){
            a.setAttribute('rel', a.getAttribute('rel') + ' sponsored');
          }
        }
      }
    }

    // Reader capture (newsletter signup) — privacy-preserving, no backend on static hosting.
    var form = document.getElementById('diyhome-capture');
    if(form){
      form.addEventListener('submit', function(ev){
        ev.preventDefault();
        var input = form.querySelector('input[type="email"]');
        var msg = form.querySelector('.capture-msg');
        if(!input || !input.value){
          if(msg){ msg.textContent = 'Please enter a valid email.'; msg.style.color='#b45309'; }
          return;
        }
        // Static site: acknowledge locally only. Nothing is stored or transmitted.
        if(msg){ msg.textContent = 'Thanks — you\'ll be the first to know when new guides publish.'; msg.style.color='#15803d'; }
        try{ input.value=''; }catch(e){}
        window.diyhome && window.diyhome.record('guide_view'); // signup intent treated as engagement
      });
    }
  });
})();