/* Google Analytics 4 — venice.osovsky.com, ресурс «Venice by Building».
   Подключается без баннера согласия: тег грузится сразу при загрузке страницы.
   Файл самодостаточный — ничего в существующих скриптах не меняется. */
(function () {
  var MEASUREMENT_ID = 'G-1BLYSVL0DV';

  if (!MEASUREMENT_ID || MEASUREMENT_ID.indexOf('XXXX') !== -1) return;
  if (window.__veniceAnalyticsLoaded) return;
  window.__veniceAnalyticsLoaded = true;

  window.dataLayer = window.dataLayer || [];
  window.gtag = function () { window.dataLayer.push(arguments); };

  var tag = document.createElement('script');
  tag.async = true;
  tag.src = 'https://www.googletagmanager.com/gtag/js?id=' + MEASUREMENT_ID;
  document.head.appendChild(tag);

  gtag('js', new Date());
  gtag('config', MEASUREMENT_ID);

  /* Язык интерфейса: i18n.js выставляет <html lang="…">, наблюдаем за сменой. */
  function currentLanguage() {
    return (document.documentElement.getAttribute('lang') || '').toLowerCase();
  }

  var lastLanguage = currentLanguage();

  function reportLanguage(lang) {
    if (!lang || lang === lastLanguage) return;
    lastLanguage = lang;
    gtag('event', 'language_change', { language: lang });
  }

  try {
    var observer = new MutationObserver(function () {
      reportLanguage(currentLanguage());
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
  } catch (e) {
    /* MutationObserver недоступен — обходимся без отслеживания языка. */
  }
})();