# Design: RentLedger

The locked system. Every Hallmark run reads this first and pages share it. Change it on purpose; the file is the rule.

## System
- Genre: modern-minimal
- Shape of the first page: app screen (left rail, one working column)
- Theme: custom brand (vibe: "ruled ledger paper, one verification stamp")
- Axes: light/grotesk-sans/chromatic-green · posture: restrained

## Tokens
`apps/web/src/app/tokens.css` is the source of truth. The roles:
```css
:root {
  --color-paper: oklch(98.2% 0.004 91);  --color-paper-2: oklch(96.2% 0.007 91);  --color-paper-3: oklch(93.4% 0.010 91);
  --color-ink: oklch(21% 0.034 263);  --color-ink-2: oklch(31% 0.035 262);  --color-muted: oklch(44.2% 0.035 258);  --color-rule: oklch(91% 0.013 92);
  --color-accent: oklch(46.9% 0.095 164);  --color-accent-ink: oklch(100% 0 0);  --color-focus: oklch(46.9% 0.095 164);
  --font-display: "Rethink Sans Variable";  --font-body: "Hanken Grotesk Variable";  --font-outlier: "Geist Mono Variable";
  --radius-card: 12px;  --radius-input: 8px;  --radius-pill: 999px;  --rule-hair: 1px;  --shadow-card: a lit top edge and a soft drop;
}
```
The brand is the project's own: the stamp green (`#0f6b4c`, now `--color-accent`), the warm paper and the ink were kept from the original `globals.css`. Inter and the Google `@import` were replaced by self-hosted Fontsource faces.
The spacing scale, the type scale, the easings and the durations are the scaffold's and live in `tokens.css`.

## Surfaces and the signature
- `.panel`: a sheet of cotton stock (white, hairline rule, 12px, a lit top edge). The one surface records stand on.
- `.ledger-head`: every page opens with its title over a double rule. It is the only signature object.
- `.ledger-table`: sentence-case heads, hairline rows, money in Geist Mono, right-aligned.
- `.ruled-paper`: faint ruled lines behind the sign-in screens only.
- Status is a pill with a dot (`Badge`); green is the only signal colour, red is for rejected and errors only.

## Controls
- Primary: accent fill, 1px deeper rim, 8px radius, 40px (36px small), presses down 1px.
- Secondary: white, hairline rule, same radius and height.

## Motion
- Character: brisk, one reveal at most (the VERIFIED stamp landing); under reduced motion everything ends at once.

## Exports
`tokens.css` in this project. Tailwind, DTCG or shadcn blocks are added here on request, per `export-formats.md`.
