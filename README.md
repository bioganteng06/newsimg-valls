# The World in One Day — Monday 23 November 2026

This is the make.fun entry for the news-image-20261123 competition:
a program that sums up the world's news of Monday 23 November 2026 in
one image.

`main.ts` (Node 22, standard library only) draws a one-page newspaper
infographic, "THE WORLD IN ONE DAY", dated MONDAY 23 NOVEMBER 2026,
with six stories from that day:

- **Climate** — COP31 ends with no deal in Antalya, Turkey, after the
  EU and about 130 other parties reject a text that omits fossil fuels.
- **Politics** — Democrats win 258 US House seats, their largest
  majority since 1992.
- **Conflict** — Ukrainian naval drones sink the Russian corvette
  Merkury off Benghazi, Libya.
- **Markets** — An AI stock sell-off: Japan's Nikkei falls 5.06% and
  the S&P 500 falls 3.7%.
- **Disaster** — A candy factory fire in Banten, Indonesia, kills at
  least 24 people, with about 30 missing.
- **Sport** — Marc Márquez wins his eighth MotoGP title, equalling
  Agostini.

## Run it

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

It writes `out/entry.png`, a deterministic 1024×1024 PNG (two runs
produce byte-identical output). The image is drawn entirely in code
with an embedded bitmap font — no network, no external assets.

Sources: AP, Reuters, Xinhua. Licence: MIT.
