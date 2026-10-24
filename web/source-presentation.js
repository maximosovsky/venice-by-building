// Presentation only: raw datasets, identifiers, geometry and provenance stay unchanged.
// About renders the original attribution; other renderers explicitly use this formatter.
const BRAND = /OpenStreetMaps?|OpenStereetMaps?|\bOSM\b/gi;
const GEO = {ru:'геоданные',it:'dati geografici',en:'geographical source'};
export const sourceAboutLabel = lang => ({ru:'Источник указан в разделе «О проекте»',it:'Fonte documentata in Informazioni sul progetto',en:'Source documented in About the project'}[lang] || 'Source documented in About the project');
export function isGeographicalSourceURL(value) {
  try {
    const url = new URL(String(value));
    return /(^|\.)openstreetmap\.(org|fr)$/i.test(url.hostname) || /\.(osm|pbf)(\.|$)/i.test(url.pathname);
  } catch { return false; }
}
export const sourcePresentationHref = value => isGeographicalSourceURL(value) ? '#notes' : value;
export function sourcePresentationText(value, lang = 'en') {
  const text = String(value ?? '');
  // Do not expose branded download paths as prose; the original source remains in About.
  if (isGeographicalSourceURL(text)) return sourceAboutLabel(lang);
  let out = text;
  if (lang === 'ru') {
    out = out.replace(/(?:в|из) (?:OpenStreetMaps?|OpenStereetMaps?|OSM)\b/gi, match => match.startsWith('из ') ? 'из геоданных' : 'в геоданных')
      .replace(/по числу этажей OSM/gi, 'по числу этажей в геоданных')
      .replace(/по тегу OSM/gi, 'по тегу в геоданных')
      .replace(/тег OSM/gi, 'тег геоданных')
      .replace(/где их нанёс OSM/gi, 'где они нанесены в геоданных');
  } else if (lang === 'it') {
    out = out.replace(/in (?:OpenStreetMaps?|OpenStereetMaps?|OSM)\b/gi, 'nei dati geografici')
      .replace(/da (?:OpenStreetMaps?|OpenStereetMaps?|OSM)\b/gi, 'dai dati geografici');
  }
  return out.replace(BRAND, GEO[lang] || GEO.en);
}
export function sourcePresentationPicker(picker) {
  const lang = picker({ru:'ru',it:'it',en:'en'});
  return value => {
    const selected = picker(value);
    return typeof selected === 'string' ? sourcePresentationText(selected, lang) : selected;
  };
}
