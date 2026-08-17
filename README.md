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

Page order is the sales argument: problem → how it works → **head-to-head against
P6 and NetPoint** → benefits → feature checklist → who it's for → what it isn't →
FAQ → call to action.

All calls to action point at the application itself:
**https://schedulepoint.huttonhomehub.co.uk**

## The comparison section is the one to be careful with

`#compare` names Primavera P6, NetPoint and MS Project and makes capability
claims about them. Rules for touching it:

- **Every row must be defensible** against those products' generally available
  editions. If a claim can't be sourced, drop the row rather than soften it.
- **Concede what they do better.** The table has a deliberate row where
  SchedulePoint says "No — deliberately out of scope", and each head-to-head
  card opens by granting the competitor its strengths. A comparison that only
  flatters itself doesn't get believed, and it invites a correction in public.
- **Keep the trademark notice in the footer current** if a product is added.
- Re-verify the rows when those products ship major releases — the claims are a
  snapshot, and a stale comparison is a wrong one.

## What's here

```text
index.html                The whole site — one page, sectioned
assets/css/styles.css     All styles; tokens, motion, and the demo's skin
assets/js/main.js         Theme toggle, nav highlight, reveals, counters
assets/js/tsld-demo.js    The hero's live sample: a real (tiny) CPM engine —
                          forward/backward pass, float, critical path — driving
                          an interactive SVG. Drag a bar (or arrow-key it) and
                          the network re-flows. Without JS the static SVG stands.
assets/fonts/             Fraunces + Instrument Sans, latin-subset WOFF2
assets/img/               Mark, favicons, app icons, OG share card
site.webmanifest          Install-as-app metadata
robots.txt / sitemap.xml  Crawl hygiene
```

The demo engine is honest CPM on purpose: pins are start-no-earlier
constraints, a pin dragged left of what logic allows clears itself (logic
wins), float and driving links are computed, not styled. If the numbers in it
ever look wrong, treat that as a bug, not a styling choice.

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
