# Talkestra — www.talkestra.com

Single-page site for **Talkestra's Modern Music Symposium**, a season of events
exploring modern music at The Barn, Causeway, Horsham.

## Layout

```
.
├── public/                 # ← this folder is the whole website
│   ├── index.html          # all page content
│   ├── styles.css          # design system + layout
│   ├── main.js             # small enhancements (nav, footer year, next event)
│   ├── favicon.svg
│   └── images/
│       ├── talkestra-logo.png   # brand mark, posterised to the brand colours
│       ├── modernist-melting-pot.jpg # artwork for the featured event
│       ├── picasso-ragtime.jpg  # watermark behind the featured event card
│       └── score-*.jpg          # manuscript backgrounds
├── orig/                   # source artwork & flyer photographs (not published)
├── server.ts               # local dev server
├── tsconfig.json
└── package.json
```

## Install & run

```bash
npm install
npm run dev
```

Then open <http://localhost:5173/>. Use `PORT=3000 npm run dev` for another port.

| Script              | What it does                              |
| ------------------- | ----------------------------------------- |
| `npm run dev`       | Starts the dev server (via `tsx`).        |
| `npm start`         | Alias for `npm run dev`.                  |
| `npm run typecheck` | Type-checks `server.ts` without emitting. |

## Publishing

The site is plain static files — **upload the contents of `public/`** to the web
root for `www.talkestra.com`. Nothing needs building and the dev server is not
used in production.

All asset paths are absolute (`/styles.css`, `/images/…`), so the site must live
at the domain root, which it does.

## Design system

Colours are taken from the digital logo artwork. Tokens live at the top of
`public/styles.css`.

| Token | Value | Use |
| ----- | ----- | --- |
| `--crimson` | `#d8004b` | headings, band, footer, logo panel |
| `--gold` | `#ffb20e` | tagline chip, accents, rules |
| `--cream` | `#ffe8b6` | brand cream, graphics |
| `--page` | `#fffaf1` | page background |
| `--card` | `#fffdf9` | cards and panels |

Two tokens are deliberately **not** the literal brand values, because the
brand's own pairings fail WCAG AA contrast:

| Token | Value | Why |
| ----- | ----- | --- |
| `--crimson-on-gold` | `#8f0030` | brand crimson on gold is only **2.89:1** |
| `--cream-text` | `#fff6e2` | brand cream on crimson is only **4.34:1** |

Swap either back in one line if brand fidelity is preferred over legibility.

## Fonts

Display type is **Lovelo**, body text is **Noto Serif**. The featured event's
card uses a third face, **Poiret One**, for its title and subtitle.

Noto Serif, Jost (the stand-in for Lovelo) and Poiret One load from Google
Fonts. **Lovelo is not on Google Fonts**, so the display stack currently falls
back to Jost.

The poster for the December event sets its title and subtitle in *Donau
Uppercase Neue* (Renzler Design, 2014 — lettering drawn from early 20th-century
Viennese sources), which is not on Google Fonts either. **Poiret One** stands in
for it: an Art Deco display face with the right period flavour. Two things
follow from that choice, and both are noted in `styles.css`:

- It ships **one weight only** (400), so weight is set with
  `--font-poster-stroke` in `:root` — a `-webkit-text-stroke` on the glyph
  outlines in the text colour. It adds stem thickness without changing advance
  widths, so the title cannot reflow or wrap. Tune it there; `0.02em` is roughly
  +70% on a stem, `0.035em` begins to close the counters of the subtitle.
- Its capitals are 0.75em against Donau's and Oswald's ~0.81em, and its glyphs
  are wider, so `.programme-title` keeps the size agreed for the previous face
  and drops letter-spacing to `normal`. Going bigger to match cap height would
  wrap the title below about 1050px viewport width.

*Donau* itself is the faithful option: $9/style, $18 for the family at
MyFonts, plus a separate **web font licence** (the desktop licence excludes
websites). Drop the `.woff2` into `public/fonts/`, add an `@font-face` block
alongside the Lovelo one, and lead `--font-poster` with it. Ignore the “free
Donau” downloads on font-mirror sites — their internal names are the MyFonts
webfont build, so they are unlicensed copies.

To self-host Lovelo:

1. Put the files in `public/fonts/` (e.g. `Lovelo-Black.woff2`).
2. Uncomment the `@font-face` block at the top of `public/styles.css`.
3. Optionally drop `Jost` from the Google Fonts link and the `--font-display` stack.

## Editing the site

- **Events** are `<li class="event">` items in `index.html`. Each has a
  `<time datetime="YYYY-MM-DD">`. `main.js` dims events whose date has passed,
  promotes the first upcoming event with the `.badge`, and keeps the hero's
  "Next event — …" button in sync. The static markup already marks the current
  next event, so the page is correct without JavaScript.
- **The featured event** is the `.programme` card. Its title, subtitle, copy,
  artwork, performers and facts are still edited by hand. Inside the card,
  `.programme-grid` puts the artwork in the left column, with the performer
  billing and then the banner (`.programme-intro`) stacked in the right one —
  the poster's arrangement. Both carry explicit `grid-column`/`grid-row`, so
  the mobile query resets them when the grid collapses to one column. When the next event
  changes, update the card and the matching `<li>` in the season list together.
- **Featured artwork** lives in `public/images/`; the card sets its ratio with
  `--portrait-ratio` on `.portrait img` (the painting's own `663 / 1081`
  today) plus `height: 100%`, so the ratio is a floor rather than a cap: the
  picture shows whole while it is the taller column, and grows — cropping at
  the sides — when the text beside it wraps taller, keeping the two columns
  level at every window width. The artwork column takes half the card's width
  (`.programme-grid`), so raising that column's `fr` or the ratio both enlarge
  the picture.
- **The featured card's watermark** is a second image layer behind the whole
  programme card: Picasso's 1919 drawing of Stravinsky at the piano. It is black ink on white paper, so it is `multiply`-blended — the
  paper vanishes and only the ink shows through the card, like ink seen
  through a printed programme cover. The image and its strength live in the
  `.programme::before` rule in `styles.css`:

  ```css
  background-image: image-set(
    url("/images/picasso-ragtime.webp") type("image/webp"),
    url("/images/picasso-ragtime.jpg") type("image/jpeg")
  );
  opacity: var(--watermark-opacity, 0.12);
  ```

  `--watermark-size` and `--watermark-position` adjust how the sheet fills
  the card. It is hidden below 44rem, where the card is much taller than the
  drawing and `cover` would show only a sliver of it.

  The card's title and subtitle carry their own semi-transparent panel
  (`--heading-veil` in `:root`) so the ink does not read through the
  lettering. The alpha is the knob: raise it to quieten the drawing further,
  lower it to let more through.

  To rebuild the asset from the scan in `orig/`, dropping the publisher's
  imprint strip at the foot of the sheet (it is an advert for the drawing, and
  it collided with the facts list):

  ```bash
  node -e "const s=require('sharp');s('orig/Picasso Ragtime.jpeg').rotate()
    .extract({left:0,top:0,width:481,height:540})
    .jpeg({quality:85,progressive:true,mozjpeg:true})
    .toFile('public/images/picasso-ragtime.jpg')"
  ```

- **Poster sources** can go in `orig/` (gitignored). To pull text and artwork
  out of a PDF:

  ```bash
  pdftotext -layout 'orig/Dec 13th.pdf' -
  pdftoppm -png -r 150 'orig/Dec 13th.pdf' /tmp/poster/page
  pdfimages -png -p 'orig/Dec 13th.pdf' /tmp/poster/img
  ```

  The last two commands come from `poppler-utils`.

## Notes

- `orig/` holds the source artwork, event posters and flyer photographs. It is
  kept for reference and should **not** be uploaded.
- The October event's portrait and score are no longer used by the page; their
  sources remain in `orig/`. The Schoenberg portrait carries a stamped
  photographer credit (reading approximately *Edwin E. Hufsheng*). Confirm the
  rights and any credit line before republishing it.
- The December artwork came from the poster. The poster carries no credit, so
  confirm the rights to reuse it outside the poster before publishing.
- The Picasso drawing behind the featured card is *Igor Stravinsky Ragtime*,
  signed and dated 1919 and published by Éditions de la Sirène. It is a
  drawing of Stravinsky, not a score by him — the title points at his ragtime
  pieces. The scan in `orig/` carries no credit line, so the rights and any
  required acknowledgement need confirming before publishing.
- Laurence Cuttriss has no performer drawer yet. Add a bio and photo to
  `orig/performers/`, run `npm run process-images`, then add an “About
  Laurence” trigger when they are available.
