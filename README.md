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

Display type is **Lovelo**, body text is **Noto Serif**.

Noto Serif (and Jost, the stand-in for Lovelo) load from Google Fonts. **Lovelo
is not on Google Fonts**, so the display stack currently falls back to Jost.

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
  artwork, performers and facts are still edited by hand. When the next event
  changes, update the card and the matching `<li>` in the season list together.
- **Featured artwork** lives in `public/images/`; the card crops portraits and
  artwork to 4:5 with CSS (`object-fit: cover`).
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
- Laurence Cuttriss has no performer drawer yet. Add a bio and photo to
  `orig/performers/`, run `npm run process-images`, then add an “About
  Laurence” trigger when they are available.
