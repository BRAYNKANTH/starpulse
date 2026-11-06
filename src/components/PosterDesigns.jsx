import { useLayoutEffect, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Radio } from 'lucide-react';
import { POSTER_SIZES, posterCover, posterPalette, posterQrColors } from '../data/qrDesign';
import { loadPosterFonts } from '../utils/posterFonts';
import './posterDesigns.css';

// The signature poster designs. Each is laid out at its true print size, so the preview, the PNG and the print match.
// The PNG export copies computed styles and can't see ::before or ::after, so every shape here is a real element.

// Long shop names and headlines shrink until they fit their space.
function useFitText(root, deps) {
  useLayoutEffect(() => {
    let active = true;
    const fit = () => {
      if (!active || !root.current) return;
      root.current.querySelectorAll('[data-fit]').forEach(element => {
        element.style.fontSize = '';
        const start = parseFloat(getComputedStyle(element).fontSize);
        let size = start;
        // The height the lines need, measured with the box released. scrollHeight won't do: it counts letter shapes that overhang tight lines.
        const linesHeight = () => {
          const { flex, width, height, maxHeight, alignSelf } = element.style;
          const released = { flex: 'none', width: `${element.clientWidth}px`, height: 'auto', maxHeight: 'none', alignSelf: 'flex-start' };
          Object.assign(element.style, released);
          const needed = element.clientHeight;
          Object.assign(element.style, { flex, width, height, maxHeight, alignSelf });
          return needed;
        };
        const overflowing = () => element.scrollWidth > element.clientWidth + 1 || linesHeight() > element.clientHeight + 1;
        while (overflowing() && size > start * .3) { size *= .96; element.style.fontSize = `${size}px`; }
      });
    };
    fit();
    loadPosterFonts().then(fit);
    return () => { active = false; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

function Face({ theme, format, profile, poster, design, headline, subtitle, link }) {
  const root = useRef(null);
  const palette = posterPalette(theme, profile.accentColor);
  const colors = posterQrColors(palette, design);
  const coverSrc = posterCover({ ...poster, theme }, profile.coverImage, format);
  const hasLogo = !!profile.logo;
  useFitText(root, [theme, format, profile.name, headline, subtitle, coverSrc, poster.coverFocus, hasLogo, poster.showNfc, poster.logoShape]);

  const qrSize = POSTER_SIZES[format].qr;
  const logoSize = Math.round(qrSize * .17);
  // "Whole" never crops the photo and never lays the logo or name over it, so words inside a banner stay readable.
  const whole = !!coverSrc && poster.coverFocus === 'whole';
  const cover = coverSrc && <img className="ph-cover" src={coverSrc} alt="" style={whole ? undefined : { objectPosition: `center ${poster.coverFocus}` }} />;
  const logo = hasLogo && <span className={`ph-logo shape-${poster.logoShape}`}><img src={profile.logo} alt="" /></span>;
  const name = <h2 className="ph-name" data-fit>{profile.name}</h2>;
  const head = <h3 className="ph-head" data-fit>{headline}</h3>;
  const sub = subtitle && <p className="ph-sub" data-fit>{subtitle}</p>;
  const nfc = poster.showNfc && <p className="ph-nfc"><Radio aria-hidden="true" />Or tap your phone here</p>;
  const qr = <span className="ph-plate"><QRCodeSVG title={`QR code for ${profile.name}`} value={link} size={qrSize} level="H" marginSize={4} fgColor={colors.foreground} bgColor={colors.background}
    imageSettings={design.showLogo && hasLogo ? { src: profile.logo, height: logoSize, width: logoSize, excavate: true } : undefined} /></span>;

  const idRow = <div className="ph-idrow">{logo}{name}</div>;
  const layouts = {
    archway: whole ? <>
      <div className="ph-a-top">{cover}</div>
      <div className="ph-a-door"><i className="ph-a-echo" />{idRow}{head}{qr}{poster.subtitle && sub}{nfc}</div>
    </> : <>
      <div className="ph-a-top">{cover}{cover && <i className="ph-scrim" />}{name}</div>
      <div className="ph-a-door"><i className="ph-a-echo" />{logo}{head}{qr}{sub}{nfc}</div>
    </>,
    estate: <>
      <i className="ph-e-frame" /><i className="ph-e-frame inner" />
      {whole ? <><div className="ph-e-cameo">{cover}</div>{idRow}</> : <>
        <div className="ph-e-cameo">{cover ? <span className="ph-e-oval">{cover}</span> : logo}{cover && logo}</div>
        {name}
      </>}
      <svg className="ph-e-rule" viewBox="0 0 120 10" aria-hidden="true"><path d="M0 5h50M70 5h50" stroke="currentColor" strokeWidth="1" /><path d="M60 .5l4.5 4.5-4.5 4.5-4.5-4.5z" fill="currentColor" /></svg>
      {head}{qr}{sub}{nfc}
    </>,
    marquee: <>
      {cover && <div className="ph-m-photo">{cover}</div>}
      <div className="ph-m-body">
        {!whole && logo}{name}
        <div className="ph-m-foot"><div className="ph-m-copy">{whole && logo}{head}{sub}{nfc}</div>{qr}</div>
      </div>
    </>,
    ticket: <div className="ph-t-paper">
      <div className="ph-t-stub">{cover && <div className="ph-t-photo">{cover}</div>}<div className="ph-t-id">{logo}{name}</div></div>
      <div className="ph-t-perf"><i className="ph-t-notch left" /><i className="ph-t-dash" /><i className="ph-t-notch right" /></div>
      <div className="ph-t-main">{head}{qr}{sub}{nfc}</div>
    </div>,
    gallery: <>
      <i className="ph-g-edge" />
      <div className="ph-g-main">
        {cover && <div className="ph-g-photo">{cover}</div>}
        {whole ? idRow : <>{logo}{name}</>}{head}
        <div className="ph-g-foot"><div className="ph-g-note">{sub}{nfc}</div>{qr}</div>
      </div>
    </>,
  };
  // Tent faces are wide and short, and stickers are small: both share one arrangement, in the design's own type and colour.
  const content = format === 'tent' ? <>
    <i className="ph-l-frame" /><i className="ph-g-edge" />
    {(cover || logo) && <div className={`ph-l-media ${cover ? 'has-photo' : ''}`}>{cover || logo}</div>}
    <div className="ph-l-copy">{cover && logo}{name}{head}{nfc}</div>
    <i className="ph-l-perf" />
    <div className="ph-l-code">{qr}</div>
  </> : format === 'sticker' ? <>
    <i className="ph-l-frame" />
    <div className="ph-s-id">{logo}{name}</div>{qr}{head}
  </> : layouts[theme];

  return <div ref={root} className={`ph-card ph-${theme} ph-f-${format} ${format === 'tent' || format === 'sticker' ? '' : 'ph-portrait'} ${coverSrc ? 'with-cover' : 'no-cover'} ${whole ? 'cover-whole' : ''} ${hasLogo ? 'with-logo' : 'no-logo'}`}
    style={{ '--ph-field': palette.field, '--ph-on-field': palette.onField, '--ph-metal': palette.metal, '--ph-plate': palette.plate, '--ph-ink': palette.ink }}>{content}</div>;
}

export function PosterSheet({ sheetRef, format, theme, ...rest }) {
  if (format !== 'tent') return <div ref={sheetRef} data-print-sheet className="ph-sheet"><Face theme={theme} format={format} {...rest} /></div>;
  // One A5 sheet, two faces: the top one is upside down so both read the right way up once folded. The ticks mark the fold.
  return <div ref={sheetRef} data-print-sheet className="ph-sheet ph-tent-sheet">
    <div className="ph-tent-flip"><Face theme={theme} format="tent" {...rest} /></div>
    <Face theme={theme} format="tent" {...rest} />
    <i className="ph-fold left" /><i className="ph-fold right" />
  </div>;
}

// A real, tiny copy of the design using the shop's own name, logo and colours.
export function PosterThumb({ theme, ...rest }) {
  return <span className="ph-thumb" aria-hidden="true"><span className="ph-thumb-scale"><Face theme={theme} format="tabletop" {...rest} /></span></span>;
}
