# SchedulePoint — website

The marketing / explainer site for
[**SchedulePoint**](https://github.com/HuttonHomeHub/SchedulePoint_1): a
browser-based construction scheduling application built around a Time-Scaled
Logic Diagram.

The site's only job is to explain what the application does — what it is, the
scheduling capabilities it implements, who it is for, and what it deliberately is
not.

## What's here

```text
index.html              The whole site — one page, sectioned
assets/css/styles.css   All styles; colour tokens mirror the app's design system
assets/js/main.js       Theme toggle + current-section nav highlighting
assets/img/favicon.svg  The mark
```

**No build step and no dependencies.** It is static HTML, CSS and ~100 lines of
vanilla JavaScript, so it can be served by anything that serves files.

## Running it locally

Open `index.html` in a browser, or serve the folder if you'd rather have a real
origin:

```bash
python3 -m http.server 8000
# then visit http://localhost:8000
```

## Deploying

A workflow at [`.github/workflows/deploy-pages.yml`](.github/workflows/deploy-pages.yml)
publishes the repository root to GitHub Pages on every push to `main`. To turn it
on, set **Settings → Pages → Build and deployment → Source** to **GitHub Actions**.

Any other static host works too — upload the repository contents as-is.

## Conventions

- **Design tokens mirror the application.** Colours are authored in OKLCH with
  semantic names (`--primary`, `--muted-foreground`, …) and full light and dark
  values, matching
  [`docs/DESIGN_SYSTEM.md`](https://github.com/HuttonHomeHub/SchedulePoint_1/blob/main/docs/DESIGN_SYSTEM.md)
  in the product repo. Keep the two in step when the product's palette changes.
- **Accessibility is not optional.** Landmarks, one `<h1>`, no skipped heading
  levels, visible focus rings, a skip link, `prefers-reduced-motion` and
  `prefers-color-scheme` all honoured. The hero diagram carries a text
  description because it is meaningful, not decorative.
- **Claims must be true.** The copy is drawn from the product repo's
  [project brief](https://github.com/HuttonHomeHub/SchedulePoint_1/blob/main/docs/PROJECT_BRIEF.md)
  and [roadmap](https://github.com/HuttonHomeHub/SchedulePoint_1/blob/main/docs/ROADMAP.md).
  If a feature has not shipped, the site does not claim it has.

## Licence

MIT, matching the product repository.
