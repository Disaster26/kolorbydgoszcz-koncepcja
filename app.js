(function () {
  'use strict';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* menu mobilne */
  var burger = document.querySelector('.burger');
  var menu = document.getElementById('menu-mob');
  function zamknij() { menu.hidden = true; burger.setAttribute('aria-expanded', 'false'); burger.setAttribute('aria-label', 'Otwórz menu'); }
  burger.addEventListener('click', function () {
    var otw = menu.hidden;
    menu.hidden = !otw;
    burger.setAttribute('aria-expanded', String(otw));
    burger.setAttribute('aria-label', otw ? 'Zamknij menu' : 'Otwórz menu');
  });
  menu.addEventListener('click', function (e) { if (e.target.closest('a')) zamknij(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !menu.hidden) { zamknij(); burger.focus(); } });
  window.addEventListener('resize', function () { if (window.innerWidth > 1100 && !menu.hidden) zamknij(); });

  /* hero: zdjęcia (auto + przesuwanie palcem) */
  var hero = document.querySelector('[data-slider]');
  if (hero) {
    var slides = hero.querySelectorAll('.slide'), dots = hero.querySelectorAll('.hero-kropki button');
    var cur = 0, timer = null;
    function laduj(i) {
      var src = slides[i].querySelector('source');
      if (src && src.dataset.srcset) { src.srcset = src.dataset.srcset; delete src.dataset.srcset; }
      var img = slides[i].querySelector('img');
      if (img.dataset.src) { img.srcset = img.dataset.srcset; img.src = img.dataset.src; delete img.dataset.src; delete img.dataset.srcset; }
    }
    function pokaz(i) {
      i = (i + slides.length) % slides.length;
      laduj(i); laduj((i + 1) % slides.length);
      slides[cur].classList.remove('on'); dots[cur].classList.remove('on');
      cur = i;
      slides[cur].classList.add('on'); dots[cur].classList.add('on');
    }
    function stop() { if (timer) clearInterval(timer); timer = null; }
    function start() { if (reduce) return; stop(); timer = setInterval(function () { pokaz(cur + 1); }, 6000); }
    [].forEach.call(dots, function (d, i) { d.addEventListener('click', function () { pokaz(i); start(); }); });
    var sx = null, sy = 0;
    hero.addEventListener('pointerdown', function (e) { if (e.target.closest('button,a')) return; sx = e.clientX; sy = e.clientY; });
    hero.addEventListener('pointerup', function (e) {
      if (sx === null) return;
      var dx = e.clientX - sx, dy = e.clientY - sy; sx = null;
      if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) { pokaz(cur + (dx < 0 ? 1 : -1)); start(); }
    });
    hero.addEventListener('pointercancel', function () { sx = null; });
    document.addEventListener('visibilitychange', function () { if (document.hidden) stop(); else start(); });
    window.addEventListener('load', function () { laduj(1); start(); });
  }

  /* galeria: palec, mysz, strzałki, klawiatura */
  var tor = document.getElementById('rz-tor');
  if (tor) {
    var btn = document.querySelectorAll('[data-rz]');
    function krok() { var k = tor.querySelector('.rz'); return k.getBoundingClientRect().width + parseFloat(getComputedStyle(tor).columnGap || 22); }
    function stan() {
      if (!btn.length) return;
      btn[0].disabled = tor.scrollLeft < 4;
      btn[1].disabled = tor.scrollLeft > tor.scrollWidth - tor.clientWidth - 4;
    }
    function idz(d) { tor.scrollBy({ left: d * krok(), behavior: reduce ? 'auto' : 'smooth' }); }
    [].forEach.call(btn, function (b) { b.addEventListener('click', function () { idz(+b.dataset.rz); }); });
    tor.addEventListener('scroll', function () { window.requestAnimationFrame(stan); }, { passive: true });
    tor.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') { e.preventDefault(); idz(1); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); idz(-1); }
    });
    var p0 = null, sl = 0, ruch = false;
    tor.addEventListener('pointerdown', function (e) {
      if (e.pointerType !== 'mouse' || e.button !== 0) return;
      p0 = e.clientX; sl = tor.scrollLeft; ruch = false;
      tor.setPointerCapture(e.pointerId);
    });
    tor.addEventListener('pointermove', function (e) {
      if (p0 === null) return;
      var dx = e.clientX - p0;
      if (Math.abs(dx) > 4) { ruch = true; tor.classList.add('ciag'); }
      if (ruch) tor.scrollLeft = sl - dx;
    });
    function koniec() {
      if (p0 === null) return;
      p0 = null;
      if (ruch) {
        var k = krok(), cel = Math.round(tor.scrollLeft / k) * k;
        tor.classList.remove('ciag');
        tor.scrollTo({ left: cel, behavior: reduce ? 'auto' : 'smooth' });
      }
    }
    tor.addEventListener('pointerup', koniec);
    tor.addEventListener('pointercancel', koniec);
    tor.addEventListener('click', function (e) { if (ruch) { e.preventDefault(); e.stopPropagation(); ruch = false; } }, true);
    window.addEventListener('resize', stan);
    stan();
  }

  /* pole pliku: nazwy wybranych zdjęć */
  var plik = document.querySelector('.plik input'), plikNazwa = document.getElementById('plik-nazwa');
  var plikDomyslnie = plikNazwa ? plikNazwa.innerHTML : '';
  function pokazPliki() {
    if (!plik) return;
    var f = plik.files;
    if (!f || !f.length) { plikNazwa.innerHTML = plikDomyslnie; return; }
    var b = document.createElement('b'); b.textContent = f.length === 1 ? 'Dodano 1 zdjęcie' : 'Dodano zdjęcia: ' + f.length;
    plikNazwa.textContent = ''; plikNazwa.appendChild(b);
    plikNazwa.appendChild(document.createTextNode([].map.call(f, function (x) { return x.name; }).join(', ')));
  }
  if (plik) plik.addEventListener('change', pokazPliki);

  /* formularz pokazowy - bez wysyłki */
  var form = document.getElementById('form');
  var info = document.getElementById('form-info');
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!form.imie.value.trim() || !form.tel.value.trim()) {
      info.className = 'form-info blad';
      info.textContent = 'Podaj imię i numer telefonu, żebyśmy mogli oddzwonić.';
      return;
    }
    info.className = 'form-info ok';
    info.textContent = 'Dziękujemy. Na docelowej stronie zapytanie razem ze zdjęciami trafi od razu na biuro@kolor.bydgoszcz.pl.';
    form.reset(); pokazPliki();
  });

  /* dolny pasek na telefonie: dopiero po przewinięciu za przycisk w hero */
  var pasek = document.getElementById('mob-pasek');
  var cta = document.getElementById('hero-cta');
  var kontakt = document.getElementById('kontakt');
  if ('IntersectionObserver' in window && pasek && cta) {
    var zaCta = false, wKontakcie = false;
    function ustaw() {
      var w = zaCta && !wKontakcie;
      pasek.classList.toggle('widac', w);
      pasek.setAttribute('aria-hidden', String(!w));
      pasek.querySelectorAll('a').forEach(function (a) { a.tabIndex = w ? 0 : -1; });
    }
    new IntersectionObserver(function (en) { zaCta = !en[0].isIntersecting && en[0].boundingClientRect.top < 0; ustaw(); }).observe(cta);
    new IntersectionObserver(function (en) { wKontakcie = en[0].isIntersecting; ustaw(); }, { threshold: 0.15 }).observe(kontakt);
  }
})();
