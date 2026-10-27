// Shared startup policy. Classic head script and safe side-effect module import.
(function (root) {
  if (root.__veniceInterfaceLanguage) return;
  const languages = ['en', 'it', 'ru'];
  function resolve(loc) {
    if (!loc) return 'ru'; // Node dictionary readers retain their source-language contract.
    if (/^\/ru\/?$/.test(loc.pathname)) return 'ru';
    const query = new URLSearchParams(loc.search).get('lang');
    return languages.includes(query) ? query : 'en';
  }
  let current = resolve(typeof location === 'undefined' ? null : location);
  const metadata = {
    en: {
      title: 'Venice, building by building',
      description: 'Historic Venice buildings in 3D, coloured by era of construction: the medieval core, the 19th century, the 20th century and buildings of unknown age. Data from the municipal VPRG classification and geographical sources.',
      short: 'Historic Venice buildings in 3D, coloured by era of construction.',
      label: 'Language',
    },
    it: {
      title: 'Venezia, edificio per edificio',
      description: 'Gli edifici della Venezia storica in 3D, colorati per epoca di costruzione: il nucleo medievale, il XIX secolo, il XX secolo e gli edifici di età ignota. Dati della classificazione comunale VPRG e di fonti geografiche.',
      short: 'Gli edifici della Venezia storica in 3D, colorati per epoca di costruzione.',
      label: 'Lingua',
    },
    ru: {
      title: 'Венеция, здание за зданием',
      description: 'Здания исторической Венеции в 3D, раскрашенные по эпохам застройки: средневековое ядро, XIX век, XX век и постройки с неизвестным возрастом. Данные муниципальной классификации VPRG и географических источников.',
      short: 'Здания исторической Венеции в 3D, раскрашенные по эпохам застройки.',
      label: 'Язык',
    },
  };
  function updateDocument() {
    if (typeof document === 'undefined') return;
    document.documentElement.lang = current;
    const text = metadata[current];
    document.title = text.title;
    for (const [selector, value] of [
      ['meta[name="description"]', text.description],
      ['meta[property="og:title"]', text.title],
      ['meta[property="og:description"]', text.short],
    ]) document.querySelector(selector)?.setAttribute('content', value);
    const buttons = document.getElementById('langs');
    buttons?.setAttribute('aria-label', text.label);
    buttons?.querySelectorAll('[data-lang]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.lang === current)));
  }
  root.__veniceInterfaceLanguage = {
    resolve,
    get: () => current,
    set(next) {
      if (!languages.includes(next)) return;
      current = next; // Route precedence is startup-only; explicit buttons remain usable.
      updateDocument();
    },
    updateDocument,
  };
  if (typeof document !== 'undefined') {
    document.documentElement.lang = current;
    // Hide untranslated source labels until the lightweight i18n module has run.
    document.documentElement.setAttribute('data-language-pending', '');
    document.addEventListener('DOMContentLoaded', updateDocument, {once:true});
  }
})(globalThis);
