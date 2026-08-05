---
name: frontend-design
description: Use this before building or reshaping any Papyr UI — pages, components, forms, previews. Grounds design decisions in Papyr's actual shipped brand (not the stale doc, not generic SaaS defaults) and catches the specific mistakes that have already shipped once.
---

# Papyr Frontend Design

Papyr's entire pitch is "this feels like your paper ledger, not software." Every UI decision gets judged against that, not against what a generic Next.js + Tailwind admin panel would do. Before writing any UI code, ask: *would this exist in a physical notebook?* If the honest answer is no (category pickers, tag clouds, dashboard widgets, template galleries), that's a signal to cut it, not to design it well. Check `MVP_SCOPE.md`'s "Out of Scope" list before adding any new UI concept — if it reads like categorization, tagging, or templating, it's already been ruled out.

## Ground truth for tokens — the shipped components, not the doc

`DESIGN_SYSTEM.md` says primary is Blue-600. That's stale. The actual shipped, user-facing brand — `LoginForm.tsx`, `SignUpForm.tsx`, `PapyrLogo.tsx` — uses:
- **Primary action / ink**: `slate-900` (near-black buttons, primary text)
- **Accent / selected state**: `teal-600`
- **Warm surface accent**: `amber-50`
- Rounded-full inputs and buttons, `rounded-2xl` cards
- Inter (or system sans) for UI chrome

When a task involves color and you're unsure which is right, open `LoginForm.tsx` or `SignUpForm.tsx` and match what's actually there — not `DESIGN_SYSTEM.md`, and never `indigo-600` or `blue-600` as a default (that's the generic-SaaS reflex, and it's how the current book-creation page ended up visually disconnected from the rest of the app). If you notice the doc and the shipped code disagree, say so — don't silently pick one.

## The mistake already made once — don't repeat it

The book-creation page tried to build dynamic colors like this:
```
className="bg-[{theme === 'Graphite' ? '#282a2c' : ...}]/20"
```
This is not valid JS interpolation (no `${}`, not a template literal) and even fixed, Tailwind's compiler only generates CSS for class names that exist as complete literal strings in source — it cannot resolve a runtime-computed arbitrary value. The result was a blank white box shipped as a "high-quality notebook mockup."

**Rule: any color, size, or style value that depends on component state or props goes through the `style` prop (or a CSS custom property), never through a constructed Tailwind class string.** `style={{ backgroundColor: theme.color }}` — not `` className={`bg-[${theme.color}]`} ``, and never a literal string with `{}` inside `className` quotes.

## Papyr's actual material language

The paper/ledger metaphor is the signature — spend the design budget there, keep everything else quiet:
- Covers read as fabric/leather-bound notebooks: a dominant surface color, a subtle corner-fold or embossed geometric mark, soft directional shadow (like a book resting on a table), not a flat rounded rectangle.
- Titles on a cover use a serif display face, set apart from the sans-serif UI chrome around it — the one deliberate typographic contrast in the product, reserved for this moment.
- Empty states and previews should always show *something* concrete (a real book with a real name, not a gray skeleton box) — paper is never really blank, it has the name written on it the moment you start.

## Process before building

1. State the token plan in one short list before writing code: which existing colors, which existing components you're extending, what (if anything) is genuinely new.
2. Check it against `MVP_SCOPE.md` and the shipped auth components — is anything here a template/category/tag in disguise? Is any color not traceable to something already live?
3. Build.
4. Before calling it done: could this same visual bug (blank/unstyled element, wrong brand color) be sitting behind a test that only checks text content or DOM presence, not actual rendered style? For anything with dynamic visual state (a color swatch, a live preview), write a test that asserts the actual computed style/inline style value — not just that the element exists. A "7/7 tests passing" summary means little if none of the tests would have caught a blank box.

## Writing in the interface

Plain, active voice, ledger vocabulary: "Book," "Page," "Cover" — not "Document," "Template," "Workspace." A button says what it does ("Create Book," not "Submit"). Empty and error states explain what happened and what to do next, in the interface's voice, without apologizing.
