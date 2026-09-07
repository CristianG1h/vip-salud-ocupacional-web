(() => {
  'use strict';

  const d = document;
  const w = window;
  const root = d.documentElement;
  const body = d.body;
  const reduce = w.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Navegación móvil */
  const toggle = d.querySelector('.menu-toggle');
  const nav = d.querySelector('.main-nav');
  const setMenu = (open) => {
    if (!toggle || !nav) return;
    nav.classList.toggle('is-open', open);
    toggle.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
    body.classList.toggle('menu-open', open);
  };

  if (toggle && nav) {
    toggle.addEventListener('click', () => setMenu(!nav.classList.contains('is-open')));
    nav.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => setMenu(false)));
    d.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') setMenu(false);
    });
    d.addEventListener('click', (e) => {
      if (nav.classList.contains('is-open') && !nav.contains(e.target) && !toggle.contains(e.target)) setMenu(false);
    });
    w.addEventListener('resize', () => {
      if (w.innerWidth > 1020) setMenu(false);
    });
  }

  /* Scroll, header y parallax */
  const progress = d.querySelector('.scroll-progress span');
  const header = d.querySelector('.site-header');
  const parallax = [...d.querySelectorAll('[data-parallax]')];
  let raf = 0;

  const update = () => {
    const top = w.scrollY || root.scrollTop;
    const max = Math.max(1, root.scrollHeight - w.innerHeight);
    if (progress) progress.style.width = `${Math.min(100, Math.max(0, (top / max) * 100))}%`;
    if (header) header.classList.toggle('is-scrolled', top > 20);

    if (!reduce && w.innerWidth > 900) {
      parallax.forEach((el) => {
        const speed = Number(el.dataset.parallax || 0);
        const r = el.getBoundingClientRect();
        const delta = r.top + r.height / 2 - w.innerHeight / 2;
        el.style.setProperty('--parallax-y', `${Math.max(-14, Math.min(14, -delta * speed))}px`);
      });
    } else {
      parallax.forEach((el) => el.style.setProperty('--parallax-y', '0px'));
    }
    raf = 0;
  };

  const request = () => {
    if (!raf) raf = w.requestAnimationFrame(update);
  };
  w.addEventListener('scroll', request, { passive: true });
  w.addEventListener('resize', request, { passive: true });

  /* Reveal animations */
  d.querySelectorAll('[data-stagger]').forEach((g) => {
    g.classList.add('stagger-group');
    [...g.children].forEach((c, i) => c.style.setProperty('--stagger-index', i));
  });

  const reveals = [...d.querySelectorAll('[data-reveal]')];
  reveals.forEach((el) => el.style.setProperty('--reveal-delay', `${parseInt(el.dataset.delay || '0', 10) || 0}ms`));

  if (reduce || !('IntersectionObserver' in w)) {
    reveals.forEach((el) => el.classList.add('is-visible'));
  } else {
    root.classList.add('motion-ready');
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        io.unobserve(entry.target);
      });
    }, { threshold: 0.01, rootMargin: '8% 0px 16% 0px' });

    reveals.forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.top < w.innerHeight * 1.08 && r.bottom > -80) el.classList.add('is-visible');
      else io.observe(el);
    });
  }

  /* Menú activo */
  const links = [...d.querySelectorAll('.main-nav a[href^="#"]')];
  const tracked = links.map((link) => ({ link, section: d.querySelector(link.getAttribute('href')) })).filter((x) => x.section);
  if (tracked.length && 'IntersectionObserver' in w) {
    const nio = new IntersectionObserver((entries) => {
      const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (!visible) return;
      links.forEach((a) => a.classList.remove('is-active'));
      const current = tracked.find((x) => x.section === visible.target);
      if (current) current.link.classList.add('is-active');
    }, { threshold: [0.08, 0.2, 0.45], rootMargin: '-18% 0px -62% 0px' });
    tracked.forEach((x) => nio.observe(x.section));
  }

  /* FAQ */
  const faqs = [...d.querySelectorAll('.accordion details')];
  faqs.forEach((item) => item.addEventListener('toggle', () => {
    if (item.open) faqs.forEach((other) => { if (other !== item) other.open = false; });
  }));

  /* Servicios expandibles */
  const services = d.querySelector('.services');
  const serviceToggle = d.querySelector('[data-services-toggle]');
  if (services && serviceToggle) {
    serviceToggle.addEventListener('click', () => {
      const open = services.classList.toggle('is-expanded');
      serviceToggle.setAttribute('aria-expanded', String(open));
      serviceToggle.innerHTML = open
        ? 'Mostrar menos <span aria-hidden="true">↑</span>'
        : 'Ver todos los servicios <span aria-hidden="true">↓</span>';
      if (open) services.querySelectorAll('.service-card.is-extra').forEach((c) => c.classList.add('is-visible'));
    });
  }

  /* Cotización por WhatsApp */
  const form = d.getElementById('form-cotizacion');
  const status = d.getElementById('form-status');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!form.reportValidity()) return;
      const v = Object.fromEntries(new FormData(form).entries());
      const lines = [
        'Hola, quiero solicitar una cotización con VIP Salud Ocupacional.',
        '',
        `Nombre: ${v.nombre || ''}`,
        v.empresa ? `Empresa: ${v.empresa}` : '',
        `Teléfono: ${v.telefono || ''}`,
        v.correo ? `Correo: ${v.correo}` : '',
        `Servicio: ${v.servicio || 'No especificado'}`,
        v.mensaje ? `Mensaje: ${v.mensaje}` : ''
      ].filter(Boolean);
      const url = `https://api.whatsapp.com/send/?phone=%2B573134010901&text=${encodeURIComponent(lines.join('\n'))}&type=phone_number&app_absent=0`;
      w.open(url, '_blank', 'noopener,noreferrer');
      if (status) status.textContent = 'Se abrió WhatsApp con su solicitud lista para enviar.';
    });
  }

  /* Política de datos */
  const policy = d.querySelector('.policy-disclosure');
  const openPolicy = () => {
    if (w.location.hash === '#privacidad' && policy) policy.open = true;
  };
  d.querySelectorAll('a[href="#privacidad"]').forEach((a) => a.addEventListener('click', () => { if (policy) policy.open = true; }));
  w.addEventListener('hashchange', openPolicy);
  openPolicy();

  /* Marca VIP */
  const isPortal = /\/descargas-biofile\/?/i.test(w.location.pathname);
  const logo = isPortal ? '../assets/logo-vip-marca.png' : 'assets/logo-vip-marca.png';
  d.querySelectorAll('.brand img,.footer-brand img').forEach((img) => {
    img.src = logo;
    img.alt = 'VIP Salud Ocupacional';
    img.style.objectFit = 'contain';
    img.style.objectPosition = 'center';
  });

  /* Tema visual basado en el logo + widget WhatsApp */
  const style = d.createElement('style');
  style.id = 'vip-brand-theme';
  style.textContent = `
    :root{
      --vip-blue:#2f4a9e;
      --vip-cyan:#2d8fc5;
      --vip-purple:#702b8f;
      --vip-orange:#ff8a1f;
      --vip-green:#4ea835;
      --vip-teal:#087c69;
      --wa:#25D366;
      --wa-dark:#128C7E;
    }

    html{scroll-padding-top:124px}
    section[id],.contact[id],.privacy[id]{scroll-margin-top:124px}
    .scroll-progress span{background:linear-gradient(90deg,var(--vip-blue),var(--vip-purple),var(--vip-orange),var(--vip-green),var(--vip-teal))!important}
    .utility-bar{background:linear-gradient(90deg,#183d7d 0%,#4d2a79 38%,#0b5f50 100%)!important;color:#edf4f2!important}
    .site-header{height:96px!important;background:rgba(255,255,255,.96)!important}
    .site-header.is-scrolled{height:84px!important;background:rgba(255,255,255,.98)!important;box-shadow:0 14px 36px rgba(47,74,158,.1)!important}
    .site-header::before{content:"";position:absolute;left:0;right:0;top:0;height:3px;background:linear-gradient(90deg,var(--vip-blue),var(--vip-purple),var(--vip-orange),var(--vip-green),var(--vip-teal));pointer-events:none}
    .brand{gap:15px!important}
    .brand img{width:108px!important;height:68px!important;object-fit:contain!important;object-position:center!important;filter:drop-shadow(0 6px 14px rgba(47,74,158,.12))!important}
    .brand strong{color:var(--vip-blue)!important}
    .brand small{color:#68747c!important}
    h1 span,h2 span{background:linear-gradient(90deg,var(--vip-blue),var(--vip-purple) 36%,var(--vip-orange) 68%,var(--vip-green));-webkit-background-clip:text;background-clip:text;color:transparent!important}
    .eyebrow{color:var(--vip-blue)!important}
    .main-nav>a:not(.btn)::after{background:linear-gradient(90deg,var(--vip-blue),var(--vip-purple),var(--vip-orange),var(--vip-green))!important}
    .main-nav>a:not(.btn):hover,.main-nav>a:not(.btn):focus-visible,.main-nav>a:not(.btn).is-active{color:var(--vip-blue)!important;background:linear-gradient(90deg,rgba(47,74,158,.08),rgba(112,43,143,.06),rgba(78,168,53,.08))!important;border-color:#d7dff0!important}
    .btn{background:linear-gradient(135deg,var(--vip-teal),#0b6558)!important;border-color:var(--vip-teal)!important}
    .btn:hover{background:linear-gradient(135deg,#0a6f60,#0b4d42)!important}
    .btn--accent{background:linear-gradient(135deg,var(--vip-orange),#f06b17)!important;border-color:var(--vip-orange)!important}
    .btn--ghost{background:#fff!important;color:var(--vip-blue)!important;border-color:#d7dff0!important}
    .btn--ghost:hover{background:linear-gradient(90deg,#f2f5ff,#f7f1fb,#f1faf3)!important}
    .hero{background:radial-gradient(circle at 84% 12%,rgba(78,168,53,.13),transparent 28%),radial-gradient(circle at 18% 0%,rgba(47,74,158,.08),transparent 30%),radial-gradient(circle at 62% 14%,rgba(112,43,143,.05),transparent 24%),#fbfaf7!important}
    .quick-card--featured{background:linear-gradient(135deg,#eef3ff 0%,#f8f1fb 34%,#fff4ea 66%,#eef8f1 100%)!important;border-color:#d5dbea!important}
    .quick-card>span{background:#eef2ff!important;color:var(--vip-purple)!important}
    .quick-card:nth-child(2)>span{background:#fff3e9!important;color:var(--vip-orange)!important}
    .quick-card:nth-child(3)>span{background:#eef8f1!important;color:var(--vip-green)!important}
    .quick-card:nth-child(4)>span{background:#edf7f4!important;color:var(--vip-teal)!important}
    .certificate,.portal-hero{background:linear-gradient(125deg,#203f86 0%,#5a2c7f 42%,#0a6c5c 100%)!important}
    .certificate h2 span,.portal-hero h1 span{background:linear-gradient(90deg,#9cc3ff,#d5a9ee,#ffc082,#9ddb93);-webkit-background-clip:text;background-clip:text;color:transparent!important}
    .package-card,.platform-card,.service-card{position:relative}
    .package-card::before,.platform-card::before,.service-card::before{content:"";position:absolute;left:0;right:0;top:0;height:3px;background:linear-gradient(90deg,var(--vip-blue),var(--vip-purple),var(--vip-orange),var(--vip-green));opacity:.76;z-index:4}
    .package-card:hover,.platform-card:hover,.service-card:hover{border-color:#cfd7e8!important;box-shadow:0 18px 44px rgba(47,74,158,.1)!important}
    .package-body>small,.platform-body>small{color:var(--vip-purple)!important}
    .service-card__media>span{color:var(--vip-blue)!important}
    .text-link{color:var(--vip-teal)!important}
    .footer{background:linear-gradient(120deg,#173d7b 0%,#44276d 32%,#0c4e44 72%,#0b3d34 100%)!important;color:#d1dfdb!important}
    .footer-brand img{width:138px!important;height:86px!important;object-fit:contain!important;background:#fff!important;border-radius:16px!important;padding:8px 10px!important;box-shadow:0 12px 28px rgba(14,50,38,.16)!important}
    .footer-bottom{border-top-color:rgba(255,255,255,.18)!important}
    .portal-support-link{background:linear-gradient(90deg,rgba(47,74,158,.08),rgba(112,43,143,.06),rgba(78,168,53,.08))!important;border-color:#d8dfeb!important;color:var(--vip-blue)!important}
    .portal-support-link span{color:var(--vip-teal)!important}

    .whatsapp-float{position:fixed!important;right:24px!important;bottom:24px!important;z-index:160!important;display:grid!important;place-items:center!important;width:66px!important;height:66px!important;min-height:66px!important;padding:0!important;border:0!important;border-radius:20px!important;background:linear-gradient(145deg,#2ee77a,var(--wa))!important;box-shadow:0 18px 38px rgba(37,211,102,.32),0 8px 18px rgba(19,93,64,.18)!important;transition:transform .28s ease,box-shadow .28s ease!important;cursor:pointer!important;overflow:visible!important}
    .whatsapp-float:hover{transform:translateY(-4px) scale(1.04)!important;box-shadow:0 22px 46px rgba(37,211,102,.38),0 10px 22px rgba(19,93,64,.2)!important}
    .whatsapp-float svg{width:35px;height:35px;fill:#fff;position:relative;z-index:2}
    .whatsapp-float::before{content:"";position:absolute;inset:7px;border:2px solid rgba(255,255,255,.48);border-radius:50%;pointer-events:none}

    .vip-wa-toast{position:fixed;right:102px;bottom:31px;z-index:158;width:min(290px,calc(100vw - 132px));padding:14px 16px 14px 17px;border:1px solid #dbe8e1;border-radius:18px;background:rgba(255,255,255,.98);color:#1f3d35;box-shadow:0 16px 42px rgba(22,73,54,.16);opacity:0;visibility:hidden;transform:translateX(18px) scale(.96);transform-origin:right center;transition:opacity .28s ease,transform .34s cubic-bezier(.16,1,.3,1),visibility .28s;pointer-events:none}
    .vip-wa-toast::after{content:"";position:absolute;right:-8px;bottom:20px;width:16px;height:16px;background:#fff;border-top:1px solid #dbe8e1;border-right:1px solid #dbe8e1;transform:rotate(45deg)}
    .vip-wa-toast.is-visible{opacity:1;visibility:visible;transform:none}
    .vip-wa-toast__eyebrow{display:block;margin-bottom:4px;font-size:.63rem;font-weight:850;letter-spacing:.13em;text-transform:uppercase;color:var(--vip-purple)}
    .vip-wa-toast strong{display:block;font-size:.9rem;line-height:1.25;color:#173f34}
    .vip-wa-toast small{display:block;margin-top:3px;font-size:.74rem;line-height:1.35;color:#6b7974}

    .vip-wa-panel{position:fixed;right:24px;bottom:104px;z-index:159;width:min(330px,calc(100vw - 32px));border:1px solid rgba(16,95,70,.14);border-radius:22px;background:#fff;box-shadow:0 26px 70px rgba(17,67,51,.25);overflow:hidden;opacity:0;visibility:hidden;transform:translateY(18px) scale(.96);transform-origin:right bottom;transition:opacity .28s ease,transform .36s cubic-bezier(.16,1,.3,1),visibility .28s}
    .vip-wa-panel.is-open{opacity:1;visibility:visible;transform:none}
    .vip-wa-panel__brandline{height:4px;background:linear-gradient(90deg,var(--vip-blue),var(--vip-purple),var(--vip-orange),var(--vip-green),var(--vip-teal))}
    .vip-wa-panel__head{position:relative;display:flex;gap:12px;align-items:center;padding:20px;background:linear-gradient(135deg,#26d86a,var(--wa));color:#fff}
    .vip-wa-panel__avatar{display:grid;place-items:center;flex:0 0 48px;width:48px;height:48px;border:2px solid rgba(255,255,255,.8);border-radius:50%;background:rgba(255,255,255,.1)}
    .vip-wa-panel__avatar svg{width:26px;height:26px;fill:#fff}
    .vip-wa-panel__head strong{display:block;font-size:.96rem;line-height:1.22}
    .vip-wa-panel__head small{display:block;margin-top:3px;font-size:.72rem;opacity:.94}
    .vip-wa-panel__close{position:absolute;right:12px;top:12px;display:grid;place-items:center;width:30px;height:30px;border:0;border-radius:50%;background:rgba(255,255,255,.16);color:#fff;font-size:1.2rem;line-height:1;cursor:pointer}
    .vip-wa-panel__body{padding:18px 18px 20px}
    .vip-wa-panel__hello{margin:0 0 14px;color:#40544d;font-size:.8rem;line-height:1.5}
    .vip-wa-panel__actions{display:grid;gap:9px}
    .vip-wa-panel__action{display:flex;align-items:center;gap:10px;min-height:48px;padding:11px 13px;border:1px solid #dce7e2;border-radius:13px;background:#fff;color:#214339;font-size:.78rem;font-weight:800;cursor:pointer;text-align:left;transition:transform .2s ease,border-color .2s ease,background .2s ease}
    .vip-wa-panel__action:hover{transform:translateY(-1px);border-color:#b9d9c9;background:#f3fbf6}
    .vip-wa-panel__action span{display:grid;place-items:center;flex:0 0 30px;width:30px;height:30px;border-radius:9px;background:#eaf8ef;color:#138c4b;font-size:.92rem}
    .vip-wa-panel__action--primary{background:#f1fbf5;border-color:#bfe5cc}
    .vip-wa-panel__foot{padding-top:13px;text-align:center;font-size:.65rem;color:#9aa6a1}

    @media(max-width:1020px){.site-header,.site-header.is-scrolled{height:84px!important}}
    @media(max-width:760px){.brand img{width:84px!important;height:54px!important}.whatsapp-float{right:14px!important;bottom:74px!important;width:62px!important;height:62px!important;min-height:62px!important;border-radius:19px!important}.whatsapp-float svg{width:32px;height:32px}.vip-wa-toast{right:87px;bottom:82px;width:min(245px,calc(100vw - 112px));padding:12px 14px}.vip-wa-panel{right:14px;bottom:148px;width:calc(100vw - 28px)}}
  `;
  d.head.appendChild(style);

  /* Widget de WhatsApp */
  const wa = d.querySelector('.whatsapp-float');
  if (wa) {
    const WA_SVG = '<svg viewBox="0 0 32 32" aria-hidden="true" focusable="false"><path d="M27.1 4.8A15.34 15.34 0 0 0 16.2.5C7.8.5 1 7.2 1 15.6c0 2.7.7 5.3 2.1 7.6L.5 31.5l8.5-2.2a15.1 15.1 0 0 0 7.2 1.8h.1c8.4 0 15.2-6.8 15.2-15.2 0-4.1-1.6-8-4.4-11.1Zm-10.9 23.7h-.1a12.5 12.5 0 0 1-6.4-1.8l-.5-.3-5 1.3 1.3-4.9-.3-.5a12.6 12.6 0 0 1 10.9-19.1c7 0 12.7 5.7 12.7 12.7 0 7-5.7 12.6-12.6 12.6Zm6.9-9.5c-.4-.2-2.3-1.1-2.6-1.3-.4-.1-.6-.2-.9.2-.3.4-1 1.3-1.2 1.5-.2.2-.4.3-.8.1-.4-.2-1.6-.6-3.1-1.9-1.1-1-1.9-2.2-2.1-2.6-.2-.4 0-.6.2-.8.2-.2.4-.4.6-.6.2-.2.3-.4.4-.7.1-.2 0-.5-.1-.7-.1-.2-.9-2.1-1.2-2.8-.3-.8-.6-.6-.9-.6h-.7c-.3 0-.7.1-1 .5-.4.4-1.4 1.4-1.4 3.3s1.4 3.8 1.6 4 .4.6 3.1 2.4c2.7 1.8 4.7 2.4 5.7 2.6 1 .2 1.9.2 2.6.1.8-.1 2.3-.9 2.6-1.8.3-.9.3-1.7.2-1.8-.1-.2-.4-.3-.8-.5Z"/></svg>';

    wa.innerHTML = WA_SVG;
    wa.setAttribute('aria-label', 'Abrir ayuda por WhatsApp');
    wa.setAttribute('role', 'button');
    wa.setAttribute('aria-expanded', 'false');

    const toast = d.createElement('div');
    toast.className = 'vip-wa-toast';
    toast.setAttribute('aria-live', 'polite');
    toast.innerHTML = '<span class="vip-wa-toast__eyebrow">WhatsApp VIP</span><strong></strong><small></small>';
    body.appendChild(toast);

    const panel = d.createElement('section');
    panel.className = 'vip-wa-panel';
    panel.setAttribute('aria-label', 'Ayuda por WhatsApp');
    panel.innerHTML = `<div class="vip-wa-panel__brandline"></div><div class="vip-wa-panel__head"><div class="vip-wa-panel__avatar">${WA_SVG}</div><div><strong>Estamos listos para ayudarte.</strong><small>VIP Salud Ocupacional · Respuesta por WhatsApp</small></div><button class="vip-wa-panel__close" type="button" aria-label="Cerrar">×</button></div><div class="vip-wa-panel__body"><p class="vip-wa-panel__hello">Seleccione una opción y abriremos WhatsApp con el mensaje listo para enviar.</p><div class="vip-wa-panel__actions"><button class="vip-wa-panel__action vip-wa-panel__action--primary" type="button" data-wa-message="Hola VIP, necesito información sobre sus servicios de salud ocupacional."><span>💬</span>Necesito información</button><button class="vip-wa-panel__action" type="button" data-wa-message="Hola VIP, quiero solicitar una cotización para mi empresa."><span>₿</span>Solicitar una cotización</button><button class="vip-wa-panel__action" type="button" data-wa-message="Hola VIP, necesito ayuda para ingresar al portal y descargar un certificado o concepto."><span>✓</span>Soporte con certificados</button><button class="vip-wa-panel__action" type="button" data-wa-message="Hola VIP, quiero agendar un examen ocupacional."><span>＋</span>Agendar un examen</button></div><div class="vip-wa-panel__foot">VIP Salud Ocupacional S.A.S.</div></div>`;
    body.appendChild(panel);

    const closeBtn = panel.querySelector('.vip-wa-panel__close');
    const toastTitle = toast.querySelector('strong');
    const toastHint = toast.querySelector('small');
    const messages = [['¿Necesita información?','Estamos disponibles para orientarle.'],['¿Quiere cotizar para su empresa?','Le ayudamos con paquetes y cobertura.'],['¿Desea agendar un examen?','Atención presencial y virtual.'],['¿Busca un certificado?','Le ayudamos con el acceso al portal.'],['¿Tiene alguna duda?','Escríbanos y reciba orientación rápida.']];
    let messageIndex = 0;
    let hideToastTimer = 0;

    const showToast = () => {
      const [title, hint] = messages[messageIndex];
      toastTitle.textContent = title;
      toastHint.textContent = hint;
      toast.classList.add('is-visible');
      w.clearTimeout(hideToastTimer);
      hideToastTimer = w.setTimeout(() => toast.classList.remove('is-visible'), 9000);
    };
    const openPanel = () => { toast.classList.remove('is-visible'); panel.classList.add('is-open'); wa.setAttribute('aria-expanded', 'true'); };
    const closePanel = () => { panel.classList.remove('is-open'); wa.setAttribute('aria-expanded', 'false'); };

    wa.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); panel.classList.contains('is-open') ? closePanel() : openPanel(); });
    closeBtn.addEventListener('click', closePanel);
    panel.addEventListener('click', (e) => e.stopPropagation());
    d.addEventListener('click', () => closePanel());
    d.addEventListener('keydown', (e) => { if (e.key === 'Escape') closePanel(); });

    panel.querySelectorAll('[data-wa-message]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const msg = btn.getAttribute('data-wa-message') || 'Hola VIP, necesito información.';
        const url = `https://api.whatsapp.com/send/?phone=%2B573102482964&text=${encodeURIComponent(msg)}&type=phone_number&app_absent=0`;
        w.open(url, '_blank', 'noopener,noreferrer');
      });
    });

    w.setTimeout(showToast, 1500);
    w.setInterval(() => {
      if (panel.classList.contains('is-open')) return;
      messageIndex = (messageIndex + 1) % messages.length;
      showToast();
    }, 30000);
  }

  const year = d.getElementById('year');
  if (year) year.textContent = String(new Date().getFullYear());
  update();

  /* Imágenes variadas */
  if (isPortal) return;
  const P = 'https://images.pexels.com/photos/';
  const hd = (id, width = 1200) => `${P}${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=${width}`;
  const swapImage = (img, url, fallback) => {
    if (!img || !url) return;
    const original = fallback || img.getAttribute('src') || '';
    img.decoding = 'async';
    img.referrerPolicy = 'no-referrer';
    img.src = url;
    img.addEventListener('error', () => {
      if (original && !img.dataset.vipFallbackUsed) {
        img.dataset.vipFallbackUsed = '1';
        img.removeAttribute('referrerpolicy');
        img.src = original;
      }
    }, { once: true });
  };

  swapImage(d.querySelector('.hero-photo > img'), hd('39192389', 1400), 'assets/valoracion-medica-vip.jpg');
  const packageImages = [[hd('6749698'),'assets/examen-visual-vip.jpg'],[hd('14558560'),'assets/valoracion-medica-vip.jpg'],[hd('12285817'),'assets/laboratorio-clinico-vip.jpg'],[hd('11843610'),'assets/optometria-vip.jpg'],[hd('9518018'),'assets/examen-visual-vip.jpg']];
  d.querySelectorAll('.package-card .package-media img').forEach((img, i) => { if (packageImages[i]) swapImage(img, packageImages[i][0], packageImages[i][1]); });
  const platformImages = [[hd('7195091'),'assets/optometria-vip.jpg'],[hd('6749757'),'assets/examen-visual-vip.jpg'],[hd('36841495'),'assets/valoracion-medica-vip.jpg']];
  d.querySelectorAll('.platform-card .platform-image img').forEach((img, i) => { if (platformImages[i]) swapImage(img, platformImages[i][0], platformImages[i][1]); });
  const serviceImages = [[hd('39192389',1000),'assets/valoracion-medica-vip.jpg'],[hd('12285817',1000),'assets/laboratorio-clinico-vip.jpg'],[hd('6749698',1000),'assets/optometria-vip.jpg'],[hd('39192389',1000),'assets/valoracion-medica-vip.jpg'],[hd('6749757',1000),'assets/examen-visual-vip.jpg'],[hd('7195091',1000),'assets/valoracion-medica-vip.jpg'],[hd('7176027',1000),'assets/valoracion-medica-vip.jpg'],[hd('14558560',1000),'assets/valoracion-medica-vip.jpg'],[hd('19544217',1000),'assets/valoracion-medica-vip.jpg'],[hd('20175025',1000),'assets/valoracion-medica-vip.jpg'],[hd('6129879',1000),'assets/laboratorio-clinico-vip.jpg'],[hd('5407235',1000),'assets/valoracion-medica-vip.jpg']];
  d.querySelectorAll('.service-card').forEach((card, i) => {
    const img = card.querySelector('.service-card__media img');
    const data = serviceImages[i] || serviceImages[0];
    if (img && data) swapImage(img, data[0], data[1]);
  });
})();
