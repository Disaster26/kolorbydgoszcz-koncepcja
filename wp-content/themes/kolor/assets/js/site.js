(function () {
  'use strict';
  var d = document;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function $(s, c) { return (c || d).querySelector(s); }
  function $$(s, c) { return [].slice.call((c || d).querySelectorAll(s)); }

  /* ---------- menu mobilne ---------- */
  var burger = $('.burger'), menu = $('#menu-mob');
  if (burger && menu) {
    var zamknij = function () { menu.hidden = true; burger.setAttribute('aria-expanded', 'false'); burger.setAttribute('aria-label', 'Otwórz menu'); };
    burger.addEventListener('click', function () {
      var otw = menu.hidden;
      menu.hidden = !otw;
      burger.setAttribute('aria-expanded', String(otw));
      burger.setAttribute('aria-label', otw ? 'Zamknij menu' : 'Otwórz menu');
    });
    menu.addEventListener('click', function (e) { if (e.target.closest('a')) zamknij(); });
    d.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !menu.hidden) { zamknij(); burger.focus(); } });
    window.addEventListener('resize', function () { if (window.innerWidth > 1100 && !menu.hidden) zamknij(); });
  }

  /* ---------- pierwszy ekran: zdjęcia (auto + przesuwanie palcem) ---------- */
  var hero = $('[data-slider]');
  if (hero) {
    var slides = $$('.slide', hero), dots = $$('.hero-kropki button', hero);
    var cur = 0, timer = null;
    var laduj = function (i) {
      var s = slides[i]; if (!s) return;
      var src = $('source', s);
      if (src && src.dataset.srcset) { src.srcset = src.dataset.srcset; delete src.dataset.srcset; }
      var img = $('img', s);
      if (img.dataset.src) { if (img.dataset.srcset) img.srcset = img.dataset.srcset; img.src = img.dataset.src; delete img.dataset.src; delete img.dataset.srcset; }
    };
    var pokaz = function (i) {
      if (slides.length < 2) return;
      i = (i + slides.length) % slides.length;
      laduj(i); laduj((i + 1) % slides.length);
      slides[cur].classList.remove('on'); if (dots[cur]) dots[cur].classList.remove('on');
      cur = i;
      slides[cur].classList.add('on'); if (dots[cur]) dots[cur].classList.add('on');
    };
    var stop = function () { if (timer) clearInterval(timer); timer = null; };
    var start = function () { if (reduce || slides.length < 2) return; stop(); timer = setInterval(function () { pokaz(cur + 1); }, 6000); };
    dots.forEach(function (b, i) { b.addEventListener('click', function () { pokaz(i); start(); }); });
    var sx = null, sy = 0;
    hero.addEventListener('pointerdown', function (e) { if (e.target.closest('button,a')) return; sx = e.clientX; sy = e.clientY; });
    hero.addEventListener('pointerup', function (e) {
      if (sx === null) return;
      var dx = e.clientX - sx, dy = e.clientY - sy; sx = null;
      if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) { pokaz(cur + (dx < 0 ? 1 : -1)); start(); }
    });
    hero.addEventListener('pointercancel', function () { sx = null; });
    d.addEventListener('visibilitychange', function () { if (d.hidden) stop(); else start(); });
    window.addEventListener('load', function () { setTimeout(function () { laduj(1); }, 2500); start(); }); /* 1.1: drugie zdjęcie po chwili, nie w trakcie ładowania pierwszego ekranu */
  }

  /* ---------- galeria: palec, mysz, strzałki, klawiatura ---------- */
  var tor = $('#rz-tor'), ruchTor = false;
  if (tor) {
    var btn = $$('[data-rz]');
    var krok = function () { var k = $('.rz', tor); return k.getBoundingClientRect().width + parseFloat(getComputedStyle(tor).columnGap || 22); };
    var stan = function () {
      if (btn.length < 2) return;
      btn[0].disabled = tor.scrollLeft < 4;
      btn[1].disabled = tor.scrollLeft > tor.scrollWidth - tor.clientWidth - 4;
    };
    var idz = function (k) { tor.scrollBy({ left: k * krok(), behavior: reduce ? 'auto' : 'smooth' }); };
    btn.forEach(function (b) { b.addEventListener('click', function () { idz(+b.dataset.rz); }); });
    tor.addEventListener('scroll', function () { window.requestAnimationFrame(stan); }, { passive: true });
    tor.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') { e.preventDefault(); idz(1); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); idz(-1); }
    });
    var p0 = null, sl = 0;
    tor.addEventListener('pointerdown', function (e) {
      if (e.pointerType !== 'mouse' || e.button !== 0) return;
      p0 = e.clientX; sl = tor.scrollLeft; ruchTor = false;
    });
    tor.addEventListener('pointermove', function (e) {
      if (p0 === null) return;
      var dx = e.clientX - p0;
      if (!ruchTor && Math.abs(dx) > 5) { ruchTor = true; tor.classList.add('ciag'); try { tor.setPointerCapture(e.pointerId); } catch (x) {} }
      if (ruchTor) tor.scrollLeft = sl - dx;
    });
    var koniec = function () {
      if (p0 === null) return;
      p0 = null;
      if (ruchTor) {
        var k = krok(), cel = Math.round(tor.scrollLeft / k) * k;
        tor.classList.remove('ciag');
        tor.scrollTo({ left: cel, behavior: reduce ? 'auto' : 'smooth' });
        setTimeout(function () { ruchTor = false; }, 60);
      }
    };
    tor.addEventListener('pointerup', koniec);
    tor.addEventListener('pointercancel', koniec);
    tor.addEventListener('click', function (e) { if (ruchTor) { e.preventDefault(); e.stopPropagation(); } }, true);
    tor.addEventListener('dragstart', function (e) { e.preventDefault(); });
    window.addEventListener('resize', function () { window.requestAnimationFrame(stan); });
    window.requestAnimationFrame(stan); /* 1.1: bez wymuszonego przeliczenia układu w trakcie startu skryptu */
  }

  /* ---------- powiększenie zdjęć galerii ---------- */
  var lb = $('#lb');
  if (lb && tor) {
    var linki = $$('[data-lb]', tor), nr = 0, ostatni = null;
    var img = $('#lbImg'), podpis = $('#lbPodpis'), licz = $('#lbLicz');
    var pokazLb = function (i) {
      nr = (i + linki.length) % linki.length;
      var a = linki[nr];
      img.src = a.href; img.alt = (a.querySelector('img') || {}).alt || '';
      podpis.textContent = a.dataset.podpis || img.alt; licz.textContent = (nr + 1) + ' / ' + linki.length;
    };
    var zamknijLb = function () { lb.hidden = true; d.body.style.overflow = ''; img.removeAttribute('src'); if (ostatni) ostatni.focus(); };
    linki.forEach(function (a, i) {
      a.addEventListener('click', function (e) {
        e.preventDefault(); if (ruchTor) return;
        ostatni = a; pokazLb(i); lb.hidden = false; d.body.style.overflow = 'hidden'; $('#lbZamknij').focus();
      });
    });
    $('#lbZamknij').addEventListener('click', zamknijLb);
    $('#lbPop').addEventListener('click', function () { pokazLb(nr - 1); });
    $('#lbNast').addEventListener('click', function () { pokazLb(nr + 1); });
    $('#lbScena').addEventListener('click', function (e) { if (e.target.id === 'lbScena') zamknijLb(); });
    d.addEventListener('keydown', function (e) {
      if (lb.hidden) return;
      if (e.key === 'Escape') zamknijLb();
      if (e.key === 'ArrowRight') pokazLb(nr + 1);
      if (e.key === 'ArrowLeft') pokazLb(nr - 1);
    });
    var lx = null;
    $('#lbScena').addEventListener('pointerdown', function (e) { lx = e.clientX; });
    $('#lbScena').addEventListener('pointerup', function (e) { if (lx === null) return; var dx = e.clientX - lx; lx = null; if (Math.abs(dx) > 50) pokazLb(nr + (dx < 0 ? 1 : -1)); });
  }

  /* ---------- zgoda na cookies (12 miesięcy) i mapa Google ---------- */
  var ck = $('#ck'), ZGODA = null;
  var zgCzytaj = function () {
    var m = d.cookie.match(/(?:^|; )kl_zgoda=([^;]+)/);
    if (!m) return null;
    var a = decodeURIComponent(m[1]).split('|');
    return { mapy: a[0] === '1', stat: a[1] === '1', t: +a[2] || Date.now() };
  };
  var zgZapisz = function (z) {
    z.t = Date.now(); ZGODA = z;
    d.cookie = 'kl_zgoda=' + encodeURIComponent((z.mapy ? '1' : '0') + '|' + (z.stat ? '1' : '0') + '|' + z.t) + '; max-age=31536000; path=/; SameSite=Lax' + (location.protocol === 'https:' ? '; Secure' : '');
    zastosuj();
  };
  var mapaWczytaj = function (el) {
    if ($('iframe', el)) return;
    var f = d.createElement('iframe');
    f.src = el.dataset.src; f.title = 'Mapa Google: dojazd do sklepu KOLOR'; f.loading = 'lazy'; f.referrerPolicy = 'no-referrer-when-downgrade'; f.allowFullscreen = true;
    el.insertBefore(f, el.firstChild); el.classList.add('wczytana');
  };
  var mapaZdejmij = function (el) { var f = $('iframe', el); if (f) f.remove(); el.classList.remove('wczytana'); };
  var zastosuj = function () {
    $$('[data-mapa]').forEach(function (el) { if (ZGODA && ZGODA.mapy) mapaWczytaj(el); else mapaZdejmij(el); });
    if (ZGODA && ZGODA.stat && ck && ck.dataset.ga4 && !window.gtag) {
      var g = ck.dataset.ga4, s = d.createElement('script'); s.async = true; s.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(g); d.head.appendChild(s);
      window.dataLayer = window.dataLayer || []; window.gtag = function () { window.dataLayer.push(arguments); };
      window.gtag('js', new Date()); window.gtag('config', g, { anonymize_ip: true });
    }
  };
  var banerPokaz = function (ust) {
    if (!ck) return; ck.hidden = false;
    var m = $('#ckMapy'), st = $('#ckStat');
    if (m) m.checked = !!(ZGODA && ZGODA.mapy); if (st) st.checked = !!(ZGODA && ZGODA.stat);
    $('#ckUst').hidden = !ust; $('[data-ck="zapisz"]', ck).hidden = !ust; $('[data-ck="ustawienia"]', ck).hidden = !!ust;
    $('[data-ck="ustawienia"]', ck).setAttribute('aria-expanded', String(!!ust));
  };
  var banerZamknij = function () { if (ck) ck.hidden = true; };
  ZGODA = zgCzytaj();
  if (ck) {
    ck.addEventListener('click', function (e) {
      var b = e.target.closest('[data-ck]'); if (!b) return; var a = b.dataset.ck;
      if (a === 'wszystkie') { zgZapisz({ mapy: true, stat: true }); banerZamknij(); }
      else if (a === 'niezbedne') { zgZapisz({ mapy: false, stat: false }); banerZamknij(); }
      else if (a === 'ustawienia') banerPokaz(true);
      else if (a === 'zapisz') { var st = $('#ckStat'); zgZapisz({ mapy: $('#ckMapy').checked, stat: st ? st.checked : false }); banerZamknij(); }
    });
    if (!ZGODA) banerPokaz(false);
  }
  $$('[data-cookies-ustaw]').forEach(function (b) { b.addEventListener('click', function () { banerPokaz(true); }); });
  $$('.mz-pokaz').forEach(function (b) { b.addEventListener('click', function () { var z = ZGODA || { stat: false }; z.mapy = true; zgZapisz(z); banerZamknij(); }); });
  zastosuj();

  /* ---------- pole pliku: nazwy wybranych zdjęć ---------- */
  var plik = $('.plik input'), plikNazwa = $('#plik-nazwa');
  var plikDomyslnie = plikNazwa ? plikNazwa.innerHTML : '';
  var pokazPliki = function () {
    if (!plik) return;
    var f = plik.files;
    if (!f || !f.length) { plikNazwa.innerHTML = plikDomyslnie; return; }
    var b = d.createElement('b'); b.textContent = f.length === 1 ? 'Dodano 1 zdjęcie' : 'Dodano zdjęcia: ' + f.length;
    plikNazwa.textContent = ''; plikNazwa.appendChild(b);
    plikNazwa.appendChild(d.createTextNode([].map.call(f, function (x) { return x.name; }).join(', ')));
  };
  if (plik) plik.addEventListener('change', pokazPliki);

  /* ---------- formularz zapytania (REST WordPressa, zdjęcia jako załączniki) ---------- */
  var form = $('#form'), info = $('#form-info');
  if (form) {
    var ep = form.dataset.endpoint, tk = '';
    var bilet = function () {
      if (!ep) return;
      fetch(ep, { credentials: 'same-origin', cache: 'no-store' }).then(function (r) { return r.json(); }).then(function (j) { tk = j.tk || ''; }).catch(function () {});
    };
    var wpisany = false;
    form.addEventListener('focusin', function () { if (!wpisany) { wpisany = true; bilet(); } });
    var komunikat = function (t, typ) { info.className = 'form-info ' + typ; info.textContent = t; };
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var tel = form.tel.value.replace(/\D/g, ''), mail = form.email.value.trim();
      if (!form.imie.value.trim() || (tel.length < 9 && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail))) {
        komunikat('Podaj imię i numer telefonu, żebyśmy mogli oddzwonić.', 'blad'); (form.imie.value.trim() ? form.tel : form.imie).focus(); return;
      }
      if (mail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail)) { komunikat('Sprawdź adres e-mail albo zostaw to pole puste.', 'blad'); form.email.focus(); return; }
      if (plik && plik.files.length > 3) { komunikat('Można dołączyć najwyżej 3 zdjęcia.', 'blad'); return; }
      if (plik && [].some.call(plik.files, function (x) { return x.size > 8 * 1024 * 1024; })) { komunikat('Jedno ze zdjęć ma więcej niż 8 MB. Wybierz mniejsze.', 'blad'); return; }
      if (!form.zgoda.checked) { komunikat('Zaznacz zgodę na kontakt w sprawie zapytania.', 'blad'); form.zgoda.focus(); return; }
      if (!ep) {
        komunikat('Wersja testowa: formularz działa, ale nic nie wysyła. Po uruchomieniu strony zapytanie razem ze zdjęciami trafi na ' + (form.dataset.email || 'biuro@kolor.bydgoszcz.pl') + '.', 'demo');
        return;
      }
      var b = form.querySelector('button[type=submit]'), napis = b.textContent;
      b.disabled = true; b.textContent = 'Wysyłanie...';
      var wyslij = function () {
        var fd = new FormData(form); fd.append('tk', tk);
        return fetch(ep, { method: 'POST', body: fd, credentials: 'same-origin' }).then(function (r) { return r.json().then(function (j) { return { s: r.status, j: j }; }); });
      };
      var poczekaj = tk ? Promise.resolve() : new Promise(function (ok) { bilet(); setTimeout(ok, 4200); });
      poczekaj.then(wyslij).then(function (o) {
        if (o.j.ok) { komunikat(o.j.msg, o.j.demo ? 'demo' : 'ok'); if (!o.j.demo) { form.reset(); pokazPliki(); } }
        else komunikat(o.j.msg || 'Nie udało się wysłać. Zadzwoń do nas.', 'blad');
      }).catch(function () { komunikat('Brak połączenia. Spróbuj ponownie albo zadzwoń.', 'blad'); })
        .then(function () { b.disabled = false; b.textContent = napis; });
    });
  }

  /* ---------- dolny pasek na telefonie: po przewinięciu za przycisk w pierwszym ekranie ---------- */
  var pasek = $('#mob-pasek'), cta = $('#hero-cta'), kontakt = $('#kontakt');
  if ('IntersectionObserver' in window && pasek && cta && kontakt) {
    var zaCta = false, wKontakcie = false;
    var ustaw = function () {
      var w = zaCta && !wKontakcie;
      pasek.classList.toggle('widac', w);
      pasek.setAttribute('aria-hidden', String(!w));
      $$('a', pasek).forEach(function (a) { a.tabIndex = w ? 0 : -1; });
    };
    new IntersectionObserver(function (en) { zaCta = !en[0].isIntersecting && en[0].boundingClientRect.top < 0; ustaw(); }).observe(cta);
    new IntersectionObserver(function (en) { wKontakcie = en[0].isIntersecting; ustaw(); }, { threshold: 0.15 }).observe(kontakt);
  }
})();

/* 1.3: tło ze zdjęć sklepu - wczytywane dopiero po pierwszym przewinięciu (nie konkuruje z pierwszym ekranem), zdjęcie zmienia się z postępem przewijania */
(function () {
  var t = document.querySelector('.tlo-foto');
  if (!t) return;
  var f = [].slice.call(t.querySelectorAll('.tf')), akt = -1, start = false, czeka = false;
  function pokaz(i) {
    if (i === akt) return;
    var el = f[i];
    if (!el.style.backgroundImage) el.style.backgroundImage = 'url("' + el.getAttribute('data-tf') + '")';
    f.forEach(function (x, j) { x.classList.toggle('on', j === i); });
    akt = i;
  }
  function licz() {
    czeka = false;
    var h = document.documentElement.scrollHeight - innerHeight;
    var p = h > 0 ? scrollY / h : 0;
    pokaz(Math.min(f.length - 1, Math.floor(p * f.length)));
  }
  function przewin() {
    if (!start) {
      if (scrollY < 40) return;
      start = true; t.classList.add('on');
    }
    if (!czeka) { czeka = true; requestAnimationFrame(licz); }
  }
  addEventListener('scroll', przewin, { passive: true });
})();
