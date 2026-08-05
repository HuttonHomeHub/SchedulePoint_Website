# SchedulePoint — website

The product site for
[**SchedulePoint**](https://github.com/HuttonHomeHub/SchedulePoint_1): a
browser-based construction scheduling application built around a Time-Scaled
Logic Diagram.

**Live at https://huttonhomehub.github.io/SchedulePoint_Website/**

The site is written for the buyer — a construction planner — not for a developer.
It sells the outcome (a programme the whole team can read, dates you can defend,
answers while you are still in the meeting) and treats the feature list as
supporting evidence. Implementation detail is deliberately absent: no framework
names, no architecture, no stack.

Page order is the sales argument: problem → how it works → benefits → feature
checklist → how it compares → who it's for → what it isn't → FAQ → call to
action.

## What's here

```text
index.html              The whole site — one page, sectioned
assets/css/styles.css   All styles; colour tokens mirror the app's design system
assets/js/main.js       Theme toggle + current-section nav highlighting
assets/img/favicon.svg  The mark
robots.txt              Crawlable, points at the sitemap
sitemap.xml             The single page
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
  If a feature has not shipped, the site does not claim it has. There are no
  testimonials, customer logos or usage figures, because there are none to
  report yet — inventing them is the fastest way to lose a planner's trust.
- **Benefit first, feature second.** Every block in the "What you get" section
  leads with the outcome and closes with a "What that's worth" line. If a new
  section can only be written as a feature list, it belongs in the checklist.
- **The reader is a planner, not an engineer.** Nothing on the page names a
  language, framework or database. The one implementation fact that earns its
  place is the MIT licence, because "you can't have it taken away from you" is
  a buying argument.

## Licence

MIT, matching the product repository.
