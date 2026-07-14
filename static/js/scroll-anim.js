// scroll-anim.js
// Lenis smooth scrolling has been disabled to restore normal browser scrolling.
(function(){
  'use strict';

  // Helper: native smooth anchor links
  document.querySelectorAll('a[href^="#"]').forEach(a=>{
    a.addEventListener('click', (e)=>{
      const href = a.getAttribute('href');
      if (!href || href === '#') return;
      const el = document.querySelector(href);
      if (!el) return;
      e.preventDefault();
      el.scrollIntoView({ behavior: 'smooth' });
    });
  });

})();
