import youngSerif from '../assets/poster-fonts/young-serif-latin-400-normal.woff2?url';
import hanken400 from '../assets/poster-fonts/hanken-grotesk-latin-400-normal.woff2?url';
import hanken600 from '../assets/poster-fonts/hanken-grotesk-latin-600-normal.woff2?url';
import bodoni500 from '../assets/poster-fonts/bodoni-moda-latin-500-normal.woff2?url';
import bodoniItalic from '../assets/poster-fonts/bodoni-moda-latin-400-italic.woff2?url';
import anton from '../assets/poster-fonts/anton-latin-400-normal.woff2?url';
import barlow600 from '../assets/poster-fonts/barlow-condensed-latin-600-normal.woff2?url';
import barlow700 from '../assets/poster-fonts/barlow-condensed-latin-700-normal.woff2?url';
import cormorant500 from '../assets/poster-fonts/cormorant-garamond-latin-500-normal.woff2?url';
import cormorantItalic from '../assets/poster-fonts/cormorant-garamond-latin-500-italic.woff2?url';

const HANKEN = [['Hanken Grotesk', hanken400, '400', 'normal'], ['Hanken Grotesk', hanken600, '600', 'normal']];
const THEME_FONTS = {
  archway: [['Young Serif', youngSerif, '400', 'normal'], ...HANKEN],
  estate: [['Bodoni Moda', bodoni500, '500', 'normal'], ['Bodoni Moda', bodoniItalic, '400', 'italic'], ...HANKEN],
  marquee: [['Anton', anton, '400', 'normal'], ...HANKEN],
  ticket: [['Barlow Condensed', barlow600, '600', 'normal'], ['Barlow Condensed', barlow700, '700', 'normal'], ...HANKEN],
  gallery: [['Cormorant Garamond', cormorant500, '500', 'normal'], ['Cormorant Garamond', cormorantItalic, '500', 'italic'], ...HANKEN],
};

// Loaded when the designer opens, so the rest of the app never downloads them.
let loading;
export function loadPosterFonts() {
  if (!loading) {
    const unique = new Map(Object.values(THEME_FONTS).flat().map(font => [font[1], font]));
    loading = Promise.all([...unique.values()].map(async ([family, url, weight, style]) => {
      const face = new FontFace(family, `url(${url})`, { weight, style });
      document.fonts.add(await face.load());
    })).catch(() => undefined); // A missing font falls back to the system one and the poster still works.
  }
  return loading;
}

const asDataUrl = async url => {
  const blob = await (await fetch(url)).blob();
  return new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.onerror = reject; reader.readAsDataURL(blob); });
};

// The PNG download is drawn inside an isolated image, which can't reach web fonts, so the theme's fonts travel inside it.
export async function posterFontCss(theme) {
  const rules = await Promise.all((THEME_FONTS[theme] || []).map(async ([family, url, weight, style]) => `@font-face{font-family:"${family}";font-weight:${weight};font-style:${style};src:url(${await asDataUrl(url)}) format("woff2");}`));
  return rules.join('');
}
