# AcademiaPro · Design system (Apple style)

The app should look and feel like a first-party iOS / macOS app (Fitness, Health, Settings).
The foundation lives in `css/app.css`, `js/ui.js`, `js/app.js` (shell) and `js/shell.js`.
**Area agents edit only their own `css/<area>.css` and `js/views/<area>.js`.** Use the tokens and classes below. Do not invent new colors, radii, shadows or easings.

## 0. Palette: rugged, strong, first-party Apple (mandatory)

The user wants "colores de hombre, rudos, fuertes": a masculine, rugged palette that still reads as a first-party Apple app. Every area follows this.

| Role | Light | Dark | Token |
|---|---|---|---|
| Page background | `#EEEEEC` warm stone | `#000` | `--bg` |
| Cards | `#FFFFFF` | `#161616` | `--surface` |
| Inset or elevated items | `#EEEEEC` | `#232323` | `--surface2` |
| Label | `#1A1A1A` | `#F2F2F0` | `--text` |
| Secondary label | `#5C5C58` graphite | `#A1A19C` | `--muted` |
| Accent fill (white text on it) | `#C8102E` blood red | `#C41E30` | `--accent` |
| Accent text and icons | `#C8102E` | `#FF4B57` | `--accent2` |
| Accent for bars and dots | `#C8102E` | `#E5303F` | `--tint`, `--crimson` |
| Success (olive, military green) | `#4D6220` text, `#556B2F` fill | `#8FAF4E` text, `#6B8E2F` fill | `--ok`, `--olive` |
| Warning (burnt orange, amber) | `#9A4A0C` text | `#E08A3A` text | `--warn`, `--burnt`, `--amber` |
| Info (steel blue) | `#2F5878` text | `#7FA8CC` text | `--info`, `--steel` |
| Highlight (brass, gold): rankings, belts, medals | `#7E5F12` text | `#C9A24A` text | `--gold`, `--gold-bg`, `--brass`, `--bronze` |
| Neutrals | graphite `#2E2E2C`, charcoal `#1A1A1A`, gunmetal `#4A5560` | same | `--graphite`, `--charcoal`, `--gunmetal` |

**Rules**
- **No pastels, purple, violet, pink, mint or coral**, anywhere: tints, icon chips, charts, avatars or gradients. The `--system-purple`, `--system-pink`, `--system-indigo` and `--system-mint` names still exist, but they now point at oxblood, crimson, gunmetal and olive. Do not reach for them to get variety; use the chip tokens below.
- **Icon chips** (a rounded square or circle with an icon, such as `.kpi-ic`, `.li-ic`, `.row-ic` and `.empty-ic`) use **dark solid fills with white glyphs**, like iOS Settings icons. Never use a tinted background with a colored icon.
  - Tokens: `--chip-crimson`, `--chip-olive`, `--chip-steel`, `--chip-burnt`, `--chip-gunmetal`, `--chip-brass`, `--chip-graphite`.
  - `.kpi-ic.c1` to `.c6` map to steel, olive, crimson, burnt, gunmetal and brass.
- **Gradients** are dark, gritty and high contrast. Examples: frases cards, entreno art tiles, heroes, podiums. Allowed families:
  - graphite to crimson: `linear-gradient(160deg,#2E2E2C,#7A0F1C)`;
  - charcoal to blood: `#1A1A1A` to `#C8102E`;
  - gunmetal: `#4A5560` to `#1F252B`;
  - olive: `#556B2F` to `#232B14`;
  - bronze or brass: `#8C6A2F` to `#3A2A10`;
  - steel: `#3E5C76` to `#18242F`.

  Text on these gradients is white. Never use light, washed or pastel gradients.
- **Typography** is heavier: titles and big numbers are **800 weight with tight tracking** (`-.026em` to `-.03em`). That covers the large title, title1, title2, `.kpi b`, `.stat-v` and hero numbers. Body text stays 400 to 600.
- **Status tints** (`--ok-bg` etc.) are muted olive, rust, steel or blood, never candy colors.
- **Contrast:** all text tokens above pass 4.5:1 on their surfaces. Do not put `--tint` (dark `#E5303F`) behind white text, or use it as small text on `#232323`. Use `--accent` and `--accent2` for that.

## 1. Tokens (`css/app.css` `:root`, dark by default, `[data-theme=light]` overrides)

**Legacy names (keep using them; they already map to the new look)**

| Token | Use |
|---|---|
| `--bg` | Page background (grouped: `#EEEEEC` light, `#000` dark) |
| `--surface` | Cards and grouped sections (`#fff` / `#161616`) |
| `--surface2` | Inset items inside a card (`#EEEEEC` / `#232323`) |
| `--bg2` | Elevated surfaces like popovers and tooltips |
| `--line`, `--line2` | Hairlines and borders. Prefer `--separator` with `.5px` |
| `--text`, `--muted` | Label and secondary label. Both pass 4.5:1 |
| `--accent` | Brand red **fill** (white text on it passes 4.5:1) |
| `--accent2` | Brand red **text** and icons (passes 4.5:1) |
| `--accent-bg` | Tinted red background |
| `--ok` `--warn` `--err` `--info` | Status **text** colors (pass 4.5:1) |
| `--ok-bg` `--warn-bg` `--err-bg` `--info-bg` | Status tints |
| `--r` (20px), `--r2` (10px) | Card and small radius |
| `--shadow-sm`, `--shadow` | Card and floating shadows (almost none in dark) |
| `--top-h`, `--bottom-h` | Height of the nav bar and tab bar, for `position:sticky` offsets |

**New tokens**

- **iOS system colors.** Use these for fills, dots and charts, never for small text: `--system-red`, `--system-orange`, `--system-yellow`, `--system-green`, `--system-mint`, `--system-teal`, `--system-cyan`, `--system-blue`, `--system-indigo`, `--system-purple`, `--system-pink`, `--system-brown`, `--system-gray` … `--system-gray6`.
- **Accessible text versions:** `--green-text`, `--orange-text`, `--red-text`, `--blue-text`, `--gold-text`, `--accent-text`.
- **Rugged named tones:** `--crimson`, `--oxblood`, `--graphite`, `--charcoal`, `--gunmetal`, `--steel`, `--olive`, `--burnt`, `--amber`, `--brass`, `--bronze`, and `--chip-*` (see section 0).
- **Backgrounds:** `--bg-primary`, `--bg-secondary`, `--bg-tertiary`, `--bg-grouped`, `--bg-grouped-2`, `--bg-grouped-3`, `--bg-elevated`, `--bg-elevated-2`.
- **Labels:** `--label`, `--label-2`, `--label-3`, `--label-4`. Use `--label-3` and `--label-4` only for decoration such as chevrons and placeholders, never for text that must be read.
- **Separators:** `--separator` (draw it as a `.5px` line) and `--separator-opaque`.
- **Fills:** `--fill`, `--fill-2`, `--fill-3`, `--fill-4`, from strongest to faintest. Use them for gray buttons, search fields, segmented tracks and hover states.
- **Brand:** `--tint` (= `--accent`) and `--tint-press`.
- **Type:** `--font`, `--font-display` and `--font-mono`. Each text style has a size, line height and tracking (`--fs-*`, `--lh-*`, `--tr-*`):

  | Style | Size / line height | Weight |
  |---|---|---|
  | `large` | 34 / 41 | heavy (800) |
  | `title1` | 28 | heavy (800) |
  | `title2` | 22 | heavy (800) |
  | `title3` | 20 | |
  | `headline` | 17 | semibold |
  | `body` | 17 | |
  | `callout` | 16 | |
  | `subhead` | 15 | |
  | `footnote` | 13 | |
  | `caption` | 12 | |
  | `caption2` | 11 | |

  Utility classes: `.t-large`, `.t-title1`, `.t-title2`, `.t-title3`, `.t-headline`, `.t-body`, `.t-callout`, `.t-subhead`, `.t-footnote`, `.t-caption`, `.tnum` (tabular numbers).
- **Radii:** `--radius-sm` 10, `--radius-md` 14, `--radius-lg` 20, `--radius-xl` 28, `--radius-full`.
- **Spacing:** `--sp-1` … `--sp-10` (4 to 40px) and `--gutter` (20px desktop, 16px phone).
- **Shadows:** `--shadow-1`, `--shadow-2`, `--shadow-3`, `--shadow-float`.
- **Materials (glass):** `--material-ultrathin`, `--material-thin`, `--material-regular`, `--material-thick`, `--material-chrome`, plus `--blur` and `--blur-thick` for `backdrop-filter`. When backdrop-filter is not supported, the materials fall back to opaque colors.
- **Motion:**
  - `--spring` (calm, tiny overshoot) and `--spring-bouncy`. Both use `linear()`, with a cubic-bezier fallback.
  - `--ease-out-ios` (`cubic-bezier(.32,.72,0,1)`), `--ease-in-ios`, `--ease-std`.
  - Durations: `--dur-press` .14s, `--dur-fast` .2s, `--dur-base` .35s, `--dur-slow` .5s, `--dur-spring` .55s, `--dur-sheet` .5s, `--dur-push` .45s.
- **Others:** `--scrim`, `--seg-thumb`, `--focus`.

## 2. Components

**Buttons (`.btn`)**

- Variants:
  - `primary` or `filled`: red fill.
  - `tinted`: red text on a red tint.
  - `ghost` or `gray`: gray fill with label-colored text.
  - `plain`: text only.
  - `ok`, `danger`, and `danger ghost`.
- Sizes: `small` (32px capsule), default (38px desktop, 44px phone, 12px radius), and `big` (50px capsule, for primary calls to action).
- Every `.btn` scales to .97 with the spring when pressed. You do not need to add it.
- Other button classes:
  - `.icon-btn`: circular. Add `.gray` to put it on a fill.
  - `.btn-link`: tinted text.
  - `.fab`: floating circle.

**Cards and lists**

- **`.card`**: an inset grouped section. White on stone in light mode, `#161616` on black in dark mode, 20px radius, no border.
  - `.card.flush` holds a full-bleed list.
  - `.card-h` is its header row.
  - Cards are 20px apart (16px on phones).
- **`.section-header`**: an uppercase footnote label placed **above** a grouped card, as in Settings. It may contain a right-aligned `.btn-link`. Pair it with `.section-footer` below the card.
- **`.grouped`**: a container for Settings-style rows (`.row-inset`).
- **`.row-inset`**: a 44px row with an inset separator.
  - Lead it with an `.ic`, or with `.row-ic` (a solid dark rounded square with a white glyph; set `--rc:var(--chip-steel)`).
  - Put a right-hand value in `.row-val`.
  - An `a.row-inset` (or `.chev`) gets a gray chevron automatically.
- **`.li`**: list row. The separator is inset to start after a leading `.avatar` or `.li-ic` (automatic via `:has`). Hovering or pressing the row highlights it.
- **`.kpi`**: a stat tile. **`.stat`** is a Health-style stat with three parts: `.stat-l` (colored label with an icon, color set by `--sc`), `.stat-v` (big number, with optional `<small>` unit) and `.stat-s` (caption).
- **`.hero`**: a featured card (`.card.hero`): a graphite wash with a crimson top rule in light mode, and a blood-to-black wash in dark mode.

**Controls and status**

- **`.seg`**: iOS segmented control (radio `label > input + span`, or `button.on`). The thumb slides with the spring automatically (`ui.js`). Use `.seg.small` for a compact version.
- **`.tabs` / `.tab.on`**: a segmented-style tab strip. It scrolls horizontally on phones.
- **`.chip`**: a filter pill (checkbox). Set `--dc` to change the selected color.
- **`.switch`**: the iOS toggle. Write `<label class="check"><input type="checkbox" class="switch"><span>Label</span></label>`. The switch is placed on the right automatically, and toggling it gives light haptic feedback. Use it wherever a checkbox turns a setting on or off. A plain `.check` checkbox (not `.switch`) renders as a round iOS checkmark.
- **Fields:**
  - `.field` > `.lbl` + input/select/textarea + `.hint` gives 44px rounded fields with a focus ring.
  - Selects get the iOS up/down chevron.
  - `.form-sec` is an uppercase section label inside forms.
- **Badges and states:**
  - `.badge`, plus `.badge.red` and `.badge.accent`.
  - `.pill.aldia`, `.pill.pronto`, `.pill.vencido`, `.pill.beca`, `.pill.inactivo`.
  - `.tag` and `.count-b`.
- **`emptyState()`** (ui.js): a white icon in a solid dark circle (crimson, or olive, steel or burnt for each tone), a title3 heading and a call to action.
- **Skeletons:** `.skeleton` or `.sk` (with `.sk-line`) show a shimmering placeholder.
- **Glass:** `.glass`, `.glass-thin`, `.glass-thick` give a translucent blurred surface.
- **`.press`**: adds the spring press-down scale to any clickable element.
- **`.stagger`**: its first 8 children fade up in cascade when the screen is entered (not on re-render).
- **`.large-title`**: the 34pt title style. The shell already renders one.

## 3. Shell (app.js, do not duplicate)

- **Large title.** The shell shows the route title (or `ctx.setTitle(text)`) as a **large title** above `#main`. When it scrolls under the glass nav bar, it collapses into a small centered title, and the bar's hairline appears.
  - **Do not repeat the page title** as an `h1` or `h2` at the top of your view. Start with content. A greeting or subtitle is fine.
- **Back button.** On phones, routes with `parent` and sub-screens (`entreno/x`) get a "‹ Parent" back button in the nav bar. If your view starts with `<a class="back" href>`, the bar adopts its link and label and hides the in-content copy on phones.
- **Tab bar.** On phones the bottom tab bar is glass, 49px tall plus the safe area. Content needs bottom padding, which `main` already has. For sticky footers, use `bottom: calc(var(--bottom-h) + env(safe-area-inset-bottom) + 10px)`.
- **Sidebar.** On desktop it is a floating glass panel.
- **Search.** The Ctrl+K palette is a Spotlight-style glass panel.

## 4. Motion

- **Screen transitions** use View Transitions and are set by app.js:
  - **push** when going deeper (a route with `parent`, or more path segments);
  - **pop** for browser back or going up;
  - **fade + scale** between sibling sections.
- The nav bars stay still. On first paint, the first 8 children of `#main` fade up in cascade.
- `prefers-reduced-motion` disables all of this. Do the same for your own motion: rely on the global reduce rule, and never make information depend on an animation.
- **For your own animations,** use `transition: transform var(--dur-spring) var(--spring)` for interactive motion and `var(--ease-out-ios)` for entrances and exits. Animate only `transform` and `opacity`.

## 5. Sheets, modals, toasts, haptics (`js/ui.js`)

- **`sheet({title, body, onClose, cls})`**
  - On phones it is a bottom sheet with a grabber that springs in. Drag it down to dismiss (velocity-aware) or tap the scrim. The page behind scales to .94 with rounded corners.
  - On desktop it is a centered panel that scales in.
- **`modal({...})`**
  - Same as a sheet on phones.
  - On desktop it is a centered spring scale-in.
  - The focus trap, `inert` and Esc behave as before. A dirty form refuses tap-outside and drag-to-dismiss with a nudge.
- **`toast(msg, kind)`**
  - On phones it is an iOS banner that springs down from the top. On desktop it is a glass capsule at the bottom.
  - It fires a success, warning or error haptic automatically.
- **`haptic(kind)`**: `import {haptic} from "../ui.js"`.
  - `kind` is one of `"selection"`, `"light"`, `"medium"`, `"success"`, `"warning"` or `"error"`.
  - It only does something on touch devices with `navigator.vibrate`, after the user has interacted, and it never throws.
  - Shared code already calls it for tab changes, segmented changes, switches, sheet dismiss and toasts. Call it yourself only for meaningful custom actions, such as marking attendance with `"selection"`. Do not call it on scroll or hover.

## 6. Do and don't

**Do**
- Use `var(--surface)` cards on `var(--bg)`. Give cards no border and use generous padding (16 to 18px).
- Group related rows in one card, and add a `.section-header` above it.
- Use `--accent2` for red text and icons, and `--accent` only for fills with white text.
- Use `--ok`, `--warn`, `--err`, `--info` and `--gold` for status text. Use the rugged tones (`--olive`, `--steel`, `--burnt`, `--brass`, `--gunmetal`, `--crimson`) for dots, bars and chart fills.
- Use `.5px solid var(--separator)` for hairlines.
- Use SF weights: 400 regular, 500 medium, 600 semibold for text, and 800 heavy with tight tracking for titles and big numbers.
- Make touch targets at least 44px on `(pointer:coarse)`.
- Test at 390 and 1366 px, light and dark, ES and EN (`scripts/smoke.mjs --quick`).

**Don't**
- Don't use hard-coded hex colors, except for content colors such as belts and discipline colors, and the gradient stops listed in section 0.
- Don't use 900 font weight, uppercase headings (except `.section-header` and `.form-sec`), or heavy borders on cards.
- Don't put gradients on buttons.
- Don't use pastel, purple, pink, mint or coral colors, or tinted icon chips (see section 0).
- Don't add new `box-shadow` stacks. Use `--shadow-*`.
- Don't set `view-transition-name` on your elements. A permanent name kills the glass blur and conflicts with the screen transitions.
- Don't use em dashes in UI text.
- Don't rename classes, ids or `data-*` hooks used by JS.
