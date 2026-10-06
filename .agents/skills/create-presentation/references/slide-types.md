# Slide type catalog

Every slide is an object with a `type` and the fields below. Inline HTML (`<strong>`, `<br>`) is allowed in text fields. `\n` becomes a line break (and `\n\n` a paragraph break in `image-text`).

**Fields valid on every slide**

| Field | Meaning |
|---|---|
| `notes` | Speaker notes (shown with the `N` key). |
| `kicker` | Short label above the title (slides with a header, `cover`, `hero`, `section`, `animation`). |
| `theme` | Slide mode: `"light"`, `"dark"` or `"orange"` (filled with the deck's brand color). Each type has a default (see *Default modes*). |
| `chrome` | `false` hides the logo, footer and page number. |

**Deck object**

```json
{
  "meta": {
    "title": "Short title (footer and browser tab)", "date": "Month Year", "author": "Name or team",
    "theme": "ing | marino | ocean | esmeralda | violeta | carmin",
    "transition": "slide | fade | zoom",
    "brand": "Text shown as the logo (themes other than ing/marino)", "logo": "https://… image URL"
  },
  "slides": [ ]
}
```

**Writing rules (apply to every type)**: titles ≤ 8 words, text blocks ≤ 40 words, sentence case. Numeric values carry their unit inside the string (`"+15%"`, `"2.4M"`, `"120M€"`, `"≈27M"`) because the engine animates them counting up from zero. Icons are [Phosphor](https://phosphoricons.com) names with or without the `ph-` prefix (`"ph-rocket-launch"`). Images are absolute `https://` URLs (Unsplash `https://images.unsplash.com/photo-…` or `https://placehold.co/…`); a failing image is replaced by a placeholder automatically. Colors by keyword: `orange` (brand), `navy` (ink), `blue` (secondary), plus `amber`, `sky`, `gray` in charts.

**Default modes**: `cover`, `section`, `closing` → dark · `statement` → orange · `hero`, `quote`, `big-number`, `animation` → dark · everything else → light.

---

## Opening, structure and closing

### `cover` — opening slide
```json
{"type":"cover","kicker":"Optional label","title":"…","subtitle":"…"}
```
Uses `meta.date` and `meta.author` automatically. One per deck, first.

### `section` — chapter divider
```json
{"type":"section","title":"…","subtitle":"…","number":"01"}
```
Auto-numbers (01, 02, …) when `number` is omitted. Use to split a deck into 3–5 blocks.

### `agenda` — numbered list (≤ 7 items)
```json
{"type":"agenda","title":"Agenda","subtitle":"…","items":[{"title":"…","desc":"…"}]}
```
Items may also be plain strings.

### `closing` — final slide
```json
{"type":"closing","title":"Thank you","subtitle":"…","contacts":[{"icon":"ph-envelope-simple","text":"name@example.com"}],"cta":"Button text"}
```

## Impact

### `hero` — full-bleed image with a headline
```json
{"type":"hero","kicker":"…","title":"…","subtitle":"…","image":"https://…"}
```

### `statement` — one big sentence on the brand color
```json
{"type":"statement","kicker":"…","text":"Make banking so *simple* that people stop *noticing* it.","source":"Optional attribution"}
```
Wrap words in `*asterisks*` to emphasize them.

### `big-number` — one hero figure with a counter
```json
{"type":"big-number","kicker":"…","value":"2.4M","label":"new customers","desc":"One or two sentences of context.","image":"https://… (optional faded background)"}
```

### `quote` — highlighted quotation
```json
{"type":"quote","text":"…","author":"Name","role":"Role or source (optional)"}
```
Keep real quotations short and attribute them; flag translations in `role` ("translated").

## Cards, lists and comparisons

### `features` — 3 cards (max 4)
```json
{"type":"features","title":"…","subtitle":"…","cards":[{"icon":"ph-rocket-launch","title":"…","text":"…","style":"orange | navy"}]}
```

### `icons` — icon catalog (≤ 4 = large cards with description · 5–8 = compact grid)
```json
{"type":"icons","title":"…","subtitle":"…","icons":[{"icon":"ph-wallet","title":"…","desc":"…","color":"orange | navy | blue"}]}
```

### `bullets` — key points (≤ 8; two columns above 4 without image)
```json
{"type":"bullets","title":"…","subtitle":"…","numbered":false,"image":"https://… (optional side image)","items":[{"icon":"ph-check","title":"…","text":"…"}]}
```
Items may be plain strings. `numbered: true` shows 1, 2, 3 instead of icons.

### `split-text` — two columns (before/after, challenge/solution)
```json
{"type":"split-text","title":"…","subtitle":"…","connector":"arrow | VS | false","columns":[{"title":"…","icon":"ph-warning-circle","text":"…"}]}
```
The second column is highlighted. 2 columns get the connector badge; up to 3 columns allowed.

### `versus` — two opposed panels (3–5 points each) with optional verdict
```json
{"type":"versus","title":"…","subtitle":"…","verdict":"Key takeaway (optional)",
 "left":{"title":"…","icon":"ph-minus-circle","items":["…","…"]},
 "right":{"title":"…","icon":"ph-check-circle","items":["…","…"]}}
```

### `matrix` — 2×2 (SWOT, prioritization). Order: top-left, top-right, bottom-left, bottom-right
```json
{"type":"matrix","title":"…","subtitle":"…","axes":{"x":"Horizontal label","y":"Vertical label"},
 "quadrants":[{"title":"…","icon":"ph-barbell","tone":"orange | navy | blue","items":["…"]}]}
```
A quadrant may use `"text"` instead of `"items"`.

### `plans` — 2–4 pricing/option cards
```json
{"type":"plans","title":"…","subtitle":"…","plans":[{"name":"Plus","price":"9€","period":"/month","desc":"…","highlight":true,"tag":"Recommended","features":["…","…"]}]}
```

### `testimonials` — ≤ 3 customer quotes
```json
{"type":"testimonials","title":"…","subtitle":"…","items":[{"text":"…","author":"…","role":"…","rating":5,"image":"https://… (optional)"}]}
```

### `faq` — ≤ 6 questions
```json
{"type":"faq","title":"…","subtitle":"…","items":[{"q":"…","a":"…"}]}
```

## Numbers and data

### `number-grid` — KPI cards (≤ 4)
```json
{"type":"number-grid","title":"…","subtitle":"…","metrics":[{"value":"+15%","label":"Gross margin","desc":"vs. last year"}]}
```
Long values shrink automatically (`"≈300.000"`).

### `gauges` — circular progress rings (≤ 4); optional `"max"` per item (default 100)
```json
{"type":"gauges","title":"…","subtitle":"…","items":[{"value":"92%","label":"…","desc":"…","color":"orange | navy | blue"}]}
```

### `bars` — animated progress bars (≤ 6); `value` 0–100, or set `"max"` and `"unit"` on the slide
```json
{"type":"bars","title":"…","subtitle":"…","unit":"%","max":100,"items":[{"label":"…","note":"…","value":75,"color":"orange"}]}
```

### `funnel` — descending stages (2–6; numeric values; conversion % is computed)
```json
{"type":"funnel","title":"…","subtitle":"…","stages":[{"label":"Visits","value":"120.000","desc":"optional"}]}
```

### `table` — data table (≤ 8 rows; ≤ 6 reads best)
```json
{"type":"table","title":"…","subtitle":"…","highlight":1,"headers":["Name","Q1","Q2"],"rows":[["A","450","485"]]}
```
Every row must have as many cells as `headers`. `highlight` is an optional column index. Cells like `+7.7%`/`-3.1%` and words like `Positive`, `Stable`, `Excellent` get colored chips.

### `charts` — 1–3 charts per slide
```json
{"type":"charts","title":"…","subtitle":"…","charts":[
 {"type":"bar","title":"…","labels":["Q1","Q2"],"datasets":[{"label":"A","data":[12,19],"color":"orange"},{"label":"B","data":[5,8],"color":"navy"}]},
 {"type":"doughnut","title":"…","labels":["A","B","C"],"data":[50,30,20],"center":{"value":"100%","label":"Total"}}
]}
```
Chart types: `bar`, `hbar`, `line`, `area`, `radar`, `doughnut`, `pie`. Every dataset's `data` length must equal `labels` length. Doughnut/pie take a flat `data` array (and optional `colors`).

## Processes, time and structure

### `timeline` — 2–6 dated steps
```json
{"type":"timeline","title":"…","subtitle":"…","steps":[{"date":"Q1 2026","title":"…","desc":"…"}]}
```

### `process` — chevron flow (2–5 steps)
```json
{"type":"process","title":"…","subtitle":"…","steps":[{"icon":"ph-magnifying-glass","title":"…","desc":"…"}]}
```

### `cycle` — circular loop (3–6 steps), `center` = label in the middle
```json
{"type":"cycle","title":"…","subtitle":"…","center":"Continuous improvement","steps":[{"icon":"ph-magnifying-glass","title":"…","desc":"…"}]}
```

### `gantt` — schedule (≤ 7 rows). `start`/`end` are 0-based, inclusive period indexes; `today` is a decimal position of the "Today" marker
```json
{"type":"gantt","title":"…","subtitle":"…","periods":["Q1","Q2","Q3","Q4"],"today":2.4,
 "rows":[{"label":"Cloud migration","note":"Platform","start":0,"end":1,"color":"orange","text":"60% done"}]}
```
A row may use `"span"` instead of `"end"`.

### `pyramid` — hierarchy (2–5 levels, top to bottom)
```json
{"type":"pyramid","title":"…","subtitle":"…","levels":[{"title":"…","desc":"…"}]}
```

### `venn` — 2–3 overlapping sets; `center` labels the intersection
```json
{"type":"venn","title":"…","subtitle":"…","center":"Advantage","sets":[{"title":"…","desc":"…"}]}
```

### `org` — org chart (≤ 3 levels; ≤ 4 children per node, ≤ 3 grandchildren)
```json
{"type":"org","title":"…","subtitle":"…","root":{"name":"…","role":"…","image":"https://… (optional)","children":[{"name":"…","role":"…","children":[]}]}}
```

## People, images and media

### `team` — ≤ 4 members
```json
{"type":"team","title":"…","subtitle":"…","members":[{"name":"…","role":"…","image":"https://…","desc":"…"}]}
```

### `image-text` — image beside text
```json
{"type":"image-text","title":"…","subtitle":"…","image":"https://…","text":"Paragraph one.\n\nParagraph two.","layout":"left-image | right-image"}
```

### `gallery` — 2–4 images with captions
```json
{"type":"gallery","title":"…","subtitle":"…","images":[{"image":"https://…","title":"…","caption":"…"}]}
```

### `image-cards` — 2–4 cards with a top image
```json
{"type":"image-cards","title":"…","subtitle":"…","cards":[{"image":"https://…","tag":"Label","title":"…","text":"…"}]}
```

### `compare` — before/after image slider (draggable)
```json
{"type":"compare","title":"…","subtitle":"…","before":"https://…","after":"https://…","beforeLabel":"Before","afterLabel":"After"}
```

### `video` — YouTube, Vimeo or MP4 (empty `src` shows a poster with a play button)
```json
{"type":"video","title":"…","subtitle":"…","src":"https://www.youtube.com/watch?v=…","poster":"https://…","caption":"optional"}
```

### `logos` — partner/customer grid (≤ 8); items are names or objects
```json
{"type":"logos","title":"…","subtitle":"…","items":[{"name":"Acme","icon":"ph-flask"},{"name":"Globex","image":"https://… logo"}]}
```
Use text names or generic icons; never fabricate real third-party logos.

### `code` — code window with syntax highlighting (≤ 14 lines)
```json
{"type":"code","title":"…","subtitle":"…","file":"app.py","code":"line 1\nline 2","highlight":[2],"caption":"optional"}
```
`highlight` holds 1-based line numbers.

## Full-screen animation

### `animation` — looping canvas animation that fills the slide
```json
{"type":"animation","kicker":"Optional","title":"Optional title","caption":"One didactic sentence.",
 "params":{"speed":1},"overlay":true,"chrome":true,"theme":"dark",
 "src":"animations/red-neuronal.js"}
```
Provide **either** `"code"` (array of JavaScript lines: only the *body* of the function) **or** `"src"` (path relative to `index.html` to a file that wraps its code in `registerAnimation(function (api) { … })`). `params` is a free object read as `api.params`. `overlay:false` hides the title card; `chrome:false` hides logo/footer/page number for a pure full-screen scene. See the `create-animation` skill for the API.

Bundled animations: `animations/_plantilla.js` (interactive particles, template), `red-neuronal.js` (params `layers`, `names`, `outputs`), `ordenacion.js` (`count`, `speed`), `llm-wiki-compilar.js`, `llm-wiki-lint.js`, `ww2-bandos.js`, `ww2-frente-oriental.js`, `ww2-dday.js`, `sol-nacimiento.js`, `sol-orbitas.js`, `sol-escala.js`, `luna-fases.js`.
