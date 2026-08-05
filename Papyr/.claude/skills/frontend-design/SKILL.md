# Frontend Design Skill — Papyr

This skill encodes the specific mistakes already made once on the book-creation page so they don't happen again.

## 1. Dynamic Colors: Never Construct Tailwind Classes at Runtime

**The mistake:** Using `bg-[{theme === 'Graphite' ? '#282a2c' : ...}]` inside a plain `className` string. Tailwind scans source files at build time; it cannot resolve dynamic interpolation. The result is a blank white box because the generated class doesn't exist in the CSS bundle.

**The rule:** Dynamic colors go through the `style` prop, never through constructed class strings.

```tsx
// ❌ Wrong — Tailwind can't see this
<div className="bg-[{themeColor}]/10" />

// ✅ Correct — inline style for dynamic values
<div style={{ backgroundColor: `${themeColor}1A` }} className="..." />

// ✅ Also correct — CSS variables if you have many dynamic values
<div style={{ '--theme-bg': themeColor }} className="bg-[var(--theme-bg)]/10" />
```

For the 8 theme swatches and the live preview, compute the hex once, then pass it via `style={{ backgroundColor: hex }}`.

## 2. Brand Tokens: No `indigo-*` Anywhere

**The mistake:** The page uses `indigo-500`, `indigo-600`, `indigo-700` for focus rings, selected borders, button backgrounds, and hover states.

**The real brand (from `LoginForm.tsx` / `SignUpForm.tsx`):**
- Primary: `slate-900` (`#1e293b`) — buttons, primary text, focus rings
- Accent/Selected: `teal-600` (`#0d9488`) — selected-state borders, checkmarks, accent links
- Secondary: `slate-500` — muted text, placeholder

**Replacement map:**
| Old | New |
|-----|-----|
| `indigo-500` | `slate-900` (focus ring) / `teal-600` (selected border) |
| `indigo-600` | `slate-900` (button bg) |
| `indigo-700` | `slate-800` (button hover) |
| `bg-indigo-50` | `bg-teal-50` (selected card bg) |
| `border-indigo-500` | `border-teal-600` (selected card border) |
| `text-indigo-600` | `text-teal-600` (selected icon) |

**Focus ring pattern** (from auth forms):
```tsx
focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2
```

**Selected card pattern:**
```tsx
border-teal-600 bg-teal-50
```

## 3. Theme Data Structure

The 8 themes live in the page file today. Keep them as a constant array of objects:
```ts
type Theme = { name: string; color: string; accent: string };
const THEMES: Theme[] = [ ... ];
```

Each theme has:
- `color` — the cover's main surface hex (used for the preview background via `style`)
- `accent` — the accent hex (stored in `cover_color` for the dashboard list view)

## 4. Schema Change Required

The `books` table has `cover_color TEXT` but no `cover_theme` column. Add:
```sql
ALTER TABLE books ADD COLUMN cover_theme TEXT DEFAULT 'Graphite';
```
Tell the user this exact statement — you cannot run it (no migrations folder/CLI wired up).

## 5. Component Structure for This Page

- `BookCoverPreview.tsx` — new component, receives `title: string`, `theme: Theme`. Renders the notebook mockup via `style` for dynamic colors.
- `page.tsx` — imports `BookCoverPreview`, uses it for both the large live preview and each theme swatch (rendered small).
- `page.test.tsx` — rewritten from scratch per the TDD steps in the task prompt.

## 6. Layout Reference

After removing the category picker:
- Single white `rounded-2xl` card
- Two-column grid: form ~65% left, live preview ~35% right (desktop)
- Mobile: single column, preview below form
- Numbered sections: **1. Book Name**, **2. Description (Optional)**, **3. Cover Design**
- Small progress pill at top: "① Book Details ─── ② Choose Cover" (presentational only, not a wizard)
- "Live Preview" label above the preview panel

## 7. BookCoverPreview Visual Spec

- Theme's main color as surface via `style={{ backgroundColor: theme.color }}`
- Subtle corner-fold/embossed geometric mark (SVG or layered divs with low-opacity overlays), consistent across all 8 themes
- Soft directional shadow (`shadow-lg` or custom) so it reads as an object
- Title in serif display face (`font-serif`), centered, fallback "Book Name" when empty
- No category caption (category feature removed)

## 8. Testing Rules

- Test dynamic colors via `toHaveStyle({ backgroundColor: ... })` — not class names
- Test that category UI is completely gone (`queryByText(/business category/i)` → null)
- Test that submitting inserts both `cover_theme` and `cover_color`

## 9. Verification Checklist (Run Before Declaring Done)

- [ ] `grep -r "indigo" src/app/dashboard/books/new/` returns nothing
- [ ] `grep -r "bg-\[.*\{" src/app/dashboard/books/new/` returns nothing (no dynamic class construction)
- [ ] `npm run typecheck && npm run lint && npm run test && npm run build` all pass
- [ ] Visual check: preview renders colored, not white; swatches show real text in each theme