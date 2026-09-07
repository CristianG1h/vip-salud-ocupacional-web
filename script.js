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

/* ============================================================
   VIP V10 · Mejora visual de imágenes (Netlify/GitHub)
   - Conserva toda la lógica original.
   - Corrige el logo del encabezado/portal/footer.
   - Sustituye imágenes comprimidas por fotografías HD relacionadas.
   - Añade una imagen a cada servicio sin cambiar el contenido.
   ============================================================ */
(() => {
  const isPortal = /\/descargas-biofile\/?/i.test(window.location.pathname);
  const logoPath = isPortal ? '../assets/logo-vip-nuevo.png' : 'assets/logo-vip-nuevo.png';

  // Logo: usar el símbolo VIP limpio que ya está en el proyecto.
  document.querySelectorAll('.brand img, .footer-brand img').forEach((img) => {
    img.src = logoPath;
    img.alt = 'VIP Salud Ocupacional';
    img.style.objectFit = 'contain';
    img.style.objectPosition = 'center';
  });

  // El portal no necesita el resto de mejoras de la página principal.
  if (isPortal) return;

  const style = document.createElement('style');
  style.id = 'vip-visual-upgrades';
  style.textContent = `
    .brand img{width:76px!important;height:48px!important;object-fit:contain!important;object-position:center!important}
    .footer-brand img{width:96px!important;height:58px!important;object-fit:contain!important;object-position:center!important;background:#fff!important}
    .service-grid{gap:14px!important}
    .service-card{min-height:310px!important;padding:0!important;overflow:hidden!important;border-radius:18px!important}
    .service-card__media{position:relative;height:150px;overflow:hidden;background:#e4ebe6}
    .service-card__media::after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,transparent 55%,rgba(16,55,42,.18));pointer-events:none}
    .service-card__media img{display:block;width:100%;height:100%;object-fit:cover;object-position:center;transition:transform .65s var(--ease)}
    .service-card:hover .service-card__media img{transform:scale(1.045)}
    .service-card__media>span{position:absolute;left:14px;top:14px;z-index:2;display:grid;place-items:center;min-width:42px;height:38px;padding:0 10px;border-radius:11px;background:rgba(255,255,255,.95);color:var(--green-800);font-size:.67rem;font-weight:800;box-shadow:0 8px 22px rgba(20,60,45,.12)}
    .service-card__body{padding:20px 22px 23px}
    .service-card__body h3{font-size:1.04rem;margin:0 0 8px!important;letter-spacing:-.03em}
    .service-card__body p{color:var(--muted);font-size:.82rem;line-height:1.58}
    @media (max-width:760px){.service-card__media{height:185px}}
  `;
  document.head.appendChild(style);

  const P = 'https://images.pexels.com/photos/';
  const hd = (id, width = 1200) => `${P}${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=${width}`;

  const swapImage = (img, url, fallback) => {
    if (!img || !url) return;
    const original = fallback || img.getAttribute('src') || '';
    img.decoding = 'async';
    img.referrerPolicy = 'no-referrer';
    img.src = url;
    img.addEventListener('error', () => {
      if (original && img.src !== original && !img.dataset.vipFallbackUsed) {
        img.dataset.vipFallbackUsed = '1';
        img.removeAttribute('referrerpolicy');
        img.src = original;
      }
    }, { once: true });
  };

  // Portada: fotografía médica HD.
  swapImage(
    document.querySelector('.hero-photo > img'),
    hd('39192389', 1400),
    'assets/valoracion-medica-vip.jpg'
  );

  // Paquetes: cada uno con una imagen diferente y relacionada.
  const packageImages = [
    [hd('6749698'), 'assets/examen-visual-vip.jpg'],       // Administrativo / visual
    [hd('14558560'), 'assets/valoracion-medica-vip.jpg'],// Operativo / valoración
    [hd('12285817'), 'assets/laboratorio-clinico-vip.jpg'], // Alimentos / laboratorio
    [hd('11843610'), 'assets/optometria-vip.jpg'],       // Alturas / seguridad
    [hd('9518018'), 'assets/examen-visual-vip.jpg']       // Conductores
  ];
  document.querySelectorAll('.package-card .package-media img').forEach((img, i) => {
    const data = packageImages[i];
    if (data) swapImage(img, data[0], data[1]);
  });

  // Plataformas: telemedicina, CRC y CIA con visual propio.
  const platformImages = [
    [hd('7195091'), 'assets/optometria-vip.jpg'],
    [hd('6749757'), 'assets/examen-visual-vip.jpg'],
    [hd('36841495'), 'assets/valoracion-medica-vip.jpg']
  ];
  document.querySelectorAll('.platform-card .platform-image img').forEach((img, i) => {
    const data = platformImages[i];
    if (data) swapImage(img, data[0], data[1]);
  });

  // Portafolio: una foto específica por servicio.
  const serviceImages = [
    [hd('39192389', 1000), 'assets/valoracion-medica-vip.jpg'],  // Examen médico
    [hd('12285817', 1000), 'assets/laboratorio-clinico-vip.jpg'], // Laboratorio
    [hd('6749698', 1000), 'assets/optometria-vip.jpg'],          // Audiometría / optometría
    [hd('39192389', 1000), 'assets/valoracion-medica-vip.jpg'],  // Cardio / pulmonar
    [hd('6749757', 1000), 'assets/examen-visual-vip.jpg'],       // CRC
    [hd('7195091', 1000), 'assets/valoracion-medica-vip.jpg'],   // Telemedicina
    [hd('7176027', 1000), 'assets/valoracion-medica-vip.jpg'],   // Psicosocial
    [hd('14558560', 1000), 'assets/valoracion-medica-vip.jpg'],  // Brigadas
    [hd('19544217', 1000), 'assets/valoracion-medica-vip.jpg'],  // SST
    [hd('20175025', 1000), 'assets/valoracion-medica-vip.jpg'],  // Vacunación
    [hd('6129879', 1000), 'assets/laboratorio-clinico-vip.jpg'], // Manipulación de alimentos
    [hd('5407235', 1000), 'assets/valoracion-medica-vip.jpg']    // Procesos digitales
  ];

  document.querySelectorAll('.service-card').forEach((card, i) => {
    if (card.querySelector('.service-card__media')) return;

    const badge = card.querySelector(':scope > span');
    const heading = card.querySelector(':scope > h3');
    const paragraph = card.querySelector(':scope > p');
    const data = serviceImages[i] || serviceImages[0];

    const media = document.createElement('div');
    media.className = 'service-card__media';
    const img = document.createElement('img');
    img.alt = heading ? heading.textContent.trim() : 'Servicio de salud ocupacional';
    img.loading = 'lazy';
    media.appendChild(img);
    if (badge) media.appendChild(badge);

    const body = document.createElement('div');
    body.className = 'service-card__body';
    if (heading) body.appendChild(heading);
    if (paragraph) body.appendChild(paragraph);

    card.prepend(media);
    card.appendChild(body);
    swapImage(img, data[0], data[1]);
  });
})();
