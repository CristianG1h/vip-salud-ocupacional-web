(() => {
  'use strict';

  const root = document.documentElement;
  const body = document.body;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Navegación móvil accesible */
  const menuToggle = document.querySelector('.menu-toggle');
  const mainNav = document.querySelector('.main-nav');

  const setMenu = (open) => {
    if (!menuToggle || !mainNav) return;
    mainNav.classList.toggle('is-open', open);
    menuToggle.classList.toggle('is-open', open);
    menuToggle.setAttribute('aria-expanded', String(open));
    menuToggle.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
    body.classList.toggle('menu-open', open);
  };

  if (menuToggle && mainNav) {
    menuToggle.addEventListener('click', () => setMenu(!mainNav.classList.contains('is-open')));
    mainNav.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => setMenu(false)));
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') setMenu(false);
    });
    document.addEventListener('click', (event) => {
      if (!mainNav.classList.contains('is-open')) return;
      if (!mainNav.contains(event.target) && !menuToggle.contains(event.target)) setMenu(false);
    });
    window.addEventListener('resize', () => {
      if (window.innerWidth > 1020) setMenu(false);
    });
  }

  /* Progreso, cabecera y profundidad suave de la imagen principal */
  const progress = document.querySelector('.scroll-progress span');
  const header = document.querySelector('.site-header');
  const parallaxItems = [...document.querySelectorAll('[data-parallax]')];
  let scrollFrame = 0;

  const updateScroll = () => {
    const top = window.scrollY || document.documentElement.scrollTop;
    const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    if (progress) progress.style.width = `${Math.min(100, Math.max(0, (top / max) * 100))}%`;
    if (header) header.classList.toggle('is-scrolled', top > 20);

    if (!reducedMotion && window.innerWidth > 900) {
      parallaxItems.forEach((item) => {
        const speed = Number(item.dataset.parallax || 0);
        const rect = item.getBoundingClientRect();
        const delta = rect.top + rect.height / 2 - window.innerHeight / 2;
        const shift = Math.max(-14, Math.min(14, -delta * speed));
        item.style.setProperty('--parallax-y', `${shift}px`);
      });
    } else {
      parallaxItems.forEach((item) => item.style.setProperty('--parallax-y', '0px'));
    }
    scrollFrame = 0;
  };

  const requestScrollUpdate = () => {
    if (scrollFrame) return;
    scrollFrame = window.requestAnimationFrame(updateScroll);
  };

  window.addEventListener('scroll', requestScrollUpdate, { passive: true });
  window.addEventListener('resize', requestScrollUpdate, { passive: true });

  /* Aparición progresiva y cascadas, con contenido visible si el navegador no lo soporta */
  const staggerGroups = [...document.querySelectorAll('[data-stagger]')];
  staggerGroups.forEach((group) => {
    group.classList.add('stagger-group');
    [...group.children].forEach((child, index) => child.style.setProperty('--stagger-index', String(index)));
  });

  const revealItems = [...document.querySelectorAll('[data-reveal]')];
  revealItems.forEach((item) => {
    const delay = Number.parseInt(item.dataset.delay || '0', 10);
    item.style.setProperty('--reveal-delay', `${Number.isFinite(delay) ? delay : 0}ms`);
  });

  const nearViewport = (element) => {
    const rect = element.getBoundingClientRect();
    return rect.top < window.innerHeight * 1.08 && rect.bottom > -80;
  };

  revealItems.forEach((item) => {
    if (nearViewport(item)) item.classList.add('is-visible');
  });

  if (reducedMotion || !('IntersectionObserver' in window)) {
    revealItems.forEach((item) => item.classList.add('is-visible'));
  } else {
    root.classList.add('motion-ready');
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        revealObserver.unobserve(entry.target);
      });
    }, { threshold: 0.01, rootMargin: '8% 0px 16% 0px' });

    revealItems.filter((item) => !item.classList.contains('is-visible')).forEach((item) => revealObserver.observe(item));
  }

  /* Resalta la sección visible en el menú */
  const sectionLinks = [...document.querySelectorAll('.main-nav a[href^="#"]')];
  const tracked = sectionLinks
    .map((link) => ({ link, section: document.querySelector(link.getAttribute('href')) }))
    .filter((item) => item.section);

  if (tracked.length && 'IntersectionObserver' in window) {
    const navObserver = new IntersectionObserver((entries) => {
      const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (!visible) return;
      sectionLinks.forEach((link) => link.classList.remove('is-active'));
      const current = tracked.find((item) => item.section === visible.target);
      if (current) current.link.classList.add('is-active');
    }, { threshold: [0.08, 0.2, 0.45], rootMargin: '-18% 0px -62% 0px' });
    tracked.forEach((item) => navObserver.observe(item.section));
  }

  /* FAQ: una sola respuesta abierta a la vez */
  const faqDetails = [...document.querySelectorAll('.accordion details')];
  faqDetails.forEach((detail) => {
    detail.addEventListener('toggle', () => {
      if (!detail.open) return;
      faqDetails.forEach((other) => {
        if (other !== detail) other.open = false;
      });
    });
  });

  /* Portafolio: seis servicios principales y expansión opcional */
  const services = document.querySelector('.services');
  const servicesToggle = document.querySelector('[data-services-toggle]');
  if (services && servicesToggle) {
    servicesToggle.addEventListener('click', () => {
      const expanded = services.classList.toggle('is-expanded');
      servicesToggle.setAttribute('aria-expanded', String(expanded));
      servicesToggle.innerHTML = expanded
        ? 'Mostrar menos <span aria-hidden="true">↑</span>'
        : 'Ver todos los servicios <span aria-hidden="true">↓</span>';
      if (expanded) {
        services.querySelectorAll('.service-card.is-extra').forEach((card) => card.classList.add('is-visible'));
      }
    });
  }

  /* El formulario organiza la información y abre la línea comercial en WhatsApp */
  const quoteForm = document.getElementById('form-cotizacion');
  const formStatus = document.getElementById('form-status');
  if (quoteForm) {
    quoteForm.addEventListener('submit', (event) => {
      event.preventDefault();
      if (!quoteForm.reportValidity()) return;

      const values = Object.fromEntries(new FormData(quoteForm).entries());
      const lines = [
        'Hola, quiero solicitar una cotización con VIP Salud Ocupacional.',
        '',
        `Nombre: ${values.nombre || ''}`,
        values.empresa ? `Empresa: ${values.empresa}` : '',
        `Teléfono: ${values.telefono || ''}`,
        values.correo ? `Correo: ${values.correo}` : '',
        `Servicio: ${values.servicio || 'No especificado'}`,
        values.mensaje ? `Mensaje: ${values.mensaje}` : ''
      ].filter(Boolean);

      const url = `https://api.whatsapp.com/send/?phone=%2B573134010901&text=${encodeURIComponent(lines.join('\n'))}&type=phone_number&app_absent=0`;
      window.open(url, '_blank', 'noopener,noreferrer');
      if (formStatus) formStatus.textContent = 'Se abrió WhatsApp con su solicitud lista para enviar.';
    });
  }

  /* Al llegar por enlace directo, abre la política completa */
  const policy = document.querySelector('.policy-disclosure');
  const openPolicyFromHash = () => {
    if (window.location.hash === '#privacidad' && policy) policy.open = true;
  };
  document.querySelectorAll('a[href="#privacidad"]').forEach((link) => {
    link.addEventListener('click', () => {
      if (policy) policy.open = true;
    });
  });
  window.addEventListener('hashchange', openPolicyFromHash);
  openPolicyFromHash();

  const year = document.getElementById('year');
  if (year) year.textContent = String(new Date().getFullYear());
  updateScroll();
})();
