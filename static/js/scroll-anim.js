// scroll-anim.js
// Initializes Lenis smooth scrolling and integrates GSAP ScrollTrigger.
(function(){
  'use strict';
  if (typeof Lenis === 'undefined' || typeof gsap === 'undefined') return;

  // Create Lenis instance
  const lenis = new Lenis({
    duration: 1.2,
    easing: t => Math.min(1, t),
    smooth: true,
    direction: 'vertical',
    gestureDirection: 'vertical',
    wheelMultiplier: 1,
    smoothTouch: true
  });

  // Expose for other scripts (three-bg will read this)
  window.__lenis = lenis;

  // RAF loop required by Lenis
  function raf(time){
    lenis.raf(time);
    // expose numeric scroll value for legacy code
    try{ window.__smoothScrollY = lenis.scroll; }catch(e){}
    // update ScrollTrigger
    if (window.gsap && window.gsap.core && window.ScrollTrigger) {
      try{ ScrollTrigger.update(); }catch(e){}
    }
    requestAnimationFrame(raf);
  }
  requestAnimationFrame(raf);

  // GSAP ScrollTrigger integration
  if (window.gsap && window.ScrollTrigger){
    gsap.registerPlugin(ScrollTrigger);

    // scrollerProxy to route reads/writes through Lenis
    ScrollTrigger.scrollerProxy(document.scrollingElement || document.documentElement, {
      scrollTop(value){
        if (arguments.length){
          lenis.scrollTo(value);
        }
        return lenis.scroll;
      },
      getBoundingClientRect(){
        return { top: 0, left: 0, width: window.innerWidth, height: window.innerHeight };
      },
      pinType: document.body.style.transform ? 'transform' : 'fixed'
    });

    // refresh ScrollTrigger when window updates
    window.addEventListener('resize', () => { ScrollTrigger.refresh(); });
    // initial refresh
    ScrollTrigger.defaults({ scroller: document.scrollingElement });
    ScrollTrigger.refresh();
  }

  // Helper: smooth anchor links -> use Lenis when available
  document.querySelectorAll('a[href^="#"]').forEach(a=>{
    a.addEventListener('click', (e)=>{
      const href = a.getAttribute('href');
      if (!href || href === '#') return;
      const el = document.querySelector(href);
      if (!el) return;
      e.preventDefault();
      if (lenis && typeof lenis.scrollTo === 'function'){
        lenis.scrollTo(el, { offset: 0, immediate: false });
      } else {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });

})();
