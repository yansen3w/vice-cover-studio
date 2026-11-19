# Vice Cover Studio

[![make.fun](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/yansen3w/vice-cover-studio/rank.svg)](https://make.fun/bounty/gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/yansen3w/vice-cover-studio/reward.svg)](https://make.fun/bounty/gta6-cover-art-01)

Turn your own photo and a caption into GTA-style multi-panel cover art, exported as a PNG.

## What it does

- Load your own photos from your machine (or try the two built-in samples).
- Place each photo in a panel, drag to reposition it, zoom to crop it.
- Five poster layouts: Hero + Strip, Four Grid, Full Frame, Triptych, Duo Split.
- Five colour grades: Vice Sunset, Neon Nights, Palm Dusk, Hot Pink, Teal Noir.
- Bold gradient caption lettering with a script subtitle, in your own words.
- Export at 1080 × 1080, 1080 × 1350 or 1920 × 1080.

## Try it

```sh
node serve.ts
```

Then open http://localhost:8080 — everything runs offline in the browser, photos never leave the machine.

## Entry

Built for the [make.fun](https://make.fun/bounty/gta6-cover-art-01) bounty **gta6-cover-art-01** ("Make GTA 6 Cover Art"). The entry program is `main.ts` at the repository root; it stages `app/` and `screenshots/` and writes `dossier.json`.

Original design. No Rockstar Games logo, artwork, character or font is used. Display type is Anton and Great Vibes, both under the SIL Open Font License (see `app/fonts/OFL.txt`). Sample photos were made with an image model and are free to use.
