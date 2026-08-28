# DESIGN_SYSTEM.md

## Design System Overview
Papyr's design system is built on principles of simplicity, clarity, and accessibility. It provides a cohesive visual language that emphasizes the paper-like experience while leveraging digital advantages.

## Design Principles
1. **Paper First**: Interface should feel like an extension of paper, not a barrier to it
2. **Get Out of the Way**: UI elements appear only when needed and disappear during focus work
3. **Tactile Feedback**: Visual and subtle haptic feedback for interactions
4. **Accessibility First**: WCAG 2.1 AA compliance as minimum standard
5. **Adaptive Density**: Interface adapts to input method (touch vs pen vs mouse)
6. **Performance Conscious**: Visual effects never compromise core 60fps experience

---

## Design Tokens

### Color Palette

#### Primary Palette (Brand) — **Ground Truth: Shipped Components**
> **Source of truth**: `LoginForm.tsx`, `SignUpForm.tsx`, `PapyrLogo.tsx` — NOT the stale Blue-600 values below.
> - **Primary action / ink**: `slate-900` (`#0f172a`) — buttons, primary text, focus rings
> - **Accent / selected state**: `teal-600` (`#0d9488`) — selected borders, checkmarks, accent links
> - **Warm surface accent**: `amber-50` (`#fefce8`) — selected card backgrounds, highlights
> - **Muted text**: `slate-500` (`#64748b`) — placeholders, secondary text
> - **Rounded-full** inputs and buttons, `rounded-2xl` cards
> - **Serif display face** (`font-serif`) for book cover titles — the one deliberate typographic contrast

#### Legacy/Stale Values (DO NOT USE)
> The following were the original design tokens but **do not match shipped code**. Kept here only for migration reference.
> - ~~Primary: #2563EB (Blue-600)~~ → **Use slate-900**
> - ~~Focus Ring: Blue-600~~ → **Use slate-900**
> - ~~Selected/Accent: Indigo/Blue~~ → **Use teal-600**

#### Neutral Backgrounds
- **Background**: `#FFFFFF` (White)
- **Background Variant**: `#F8FAFC` (Slate-50)
- **Background Muted**: `#F1F5F9` (Slate-100)
- **Background Inverted**: `#0F172A` (Slate-900) — for dark mode surfaces

#### Neutral Foreground
- **Foreground Primary**: `#0F172A` (Slate-900)
- **Foreground Secondary**: `#64748B` (Slate-500)
- **Foreground Muted**: `#94A3B8` (Slate-400)
- **Foreground Inverse**: `#F8FAFC` (Slate-50)

#### Semantic/Accent Colors
- **Success**: `#10B981` (Emerald-500)
- **Warning**: `#F59E0B` (Amber-500)
- **Error**: `#EF4444` (Red-500)
- **Info**: `#3B82F6` (Blue-500)

#### Interactive States (from shipped auth forms)
- **Focus Ring**: `focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2`
- **Selected Card**: `border-teal-600 bg-teal-50`
- **Hover Overlay**: `rgba(0, 0, 0, 0.04)`
- **Press Overlay**: `rgba(0, 0, 0, 0.08)`
- **Disabled**: `opacity-50 cursor-not-allowed`

#### Paper & Canvas
- **Paper Background**: `#F8F6EE` (warm off-white, used in ledger workspace)
- **Paper Grain**: 3% noise overlay
- **Row Lines**: `rgba(0,0,0,0.06)` horizontal, 44px spacing
- **Column Dividers**: `rgba(0,0,0,0.08)` vertical
- **Cell Selection Highlight**: `#FFFBEA` (amber-50)
- **Current Cell Indicator**: `border-teal-600` with subtle glow

---

### Typography

#### Font Family
- **Base/UI**: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif
- **Display/Serif (Book Covers)**: "Georgia", "Times New Roman", serif (`font-serif`)
- **Monospace**: "JetBrains Mono", "Fira Code", "Courier New", monospace

#### Font Weights
- **Light**: 300
- **Regular**: 400
- **Medium**: 500
- **Semibold**: 600
- **Bold**: 700

#### Font Sizes (Base: 16px)
- **Text XS**: 0.75rem (12px)
- **Text SM**: 0.875rem (14px)
- **Text BASE**: 1rem (16px)
- **Text LG**: 1.125rem (18px)
- **Text XL**: 1.25rem (20px)
- **Text 2XL**: 1.5rem (24px)
- **Text 3XL**: 1.875rem (30px)
- **Text 4XL**: 2.25rem (36px)
- **Text 5XL**: 3rem (48px)
- **Text 6XL**: 3.75rem (60px)

#### Line Heights
- **Tight**: 1.2
- **Snug**: 1.3
- **Normal**: 1.5
- **Relaxed**: 1.75
- **Loose**: 2

---

### Spacing & Sizing

#### Base Unit: 4px
All spacing and dimensions use multiples of 4px for vertical rhythm.

#### Spacing Scale
- **0**: 0px
- **1**: 4px
- **2**: 8px
- **3**: 12px
- **4**: 16px
- **5**: 20px
- **6**: 24px
- **8**: 32px
- **10**: 40px
- **12**: 48px
- **16**: 64px
- **20**: 80px
- **24**: 96px

#### Border Radius
- **None**: 0px
- **Sm**: 2px
- **Default**: 4px
- **Md**: 6px
- **Lg**: 8px
- **Xl**: 12px
- **2xl**: 16px (cards)
- **Full**: 9999px (buttons, inputs)

#### Border Width
- **0**: 0px
- **1**: 1px
- **2**: 2px
- **4**: 4px
- **8**: 8px

---

### Shadows
- **Sm**: `0 1px 2px 0 rgba(0, 0, 0, 0.05)`
- **Default**: `0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)`
- **Md**: `0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)`
- **Lg**: `0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)`
- **Xl**: `0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05)`
- **Book Cover**: `0 10px 40px -10px rgba(0,0,0,0.25), 0 4px 20px -4px rgba(0,0,0,0.15)` (soft directional, like book on table)
- **Inner**: `inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)`
- **None**: `none`

---

### Opacity
- **0**: 0%
- **5**: 5%
- **10**: 10%
- **20**: 20%
- **25**: 25%
- **30**: 30%
- **40**: 40%
- **50**: 50%
- **60**: 60%
- **70**: 70%
- **75**: 75%
- **80**: 80%
- **90**: 90%
- **95**: 95%
- **100**: 100%

---

### Transition & Animation

#### Duration
- **Fastest**: 50ms
- **Faster**: 100ms
- **Fast**: 150ms
- **Normal**: 200ms
- **Slow**: 300ms
- **Slower**: 400ms
- **Slowest**: 600ms

#### Easing Functions
- **Linear**: `linear`
- **In**: `cubic-bezier(0.4, 0, 1, 1)`
- **Out**: `cubic-bezier(0, 0, 0.2, 1)`
- **InOut**: `cubic-bezier(0.4, 0, 0.2, 1)`

#### Animation Presets
- **Fade In**: opacity from 0 to 1 over 150ms ease-out
- **Fade Out**: opacity from 1 to 0 over 150ms ease-in
- **Slide Up**: translateY from 100% to 0 over 200ms ease-out
- **Scale In**: scale from 0.95 to 1 over 150ms ease-out

---

## Component Guidelines

### Component Categories
1. **Primitive**: Basic building blocks (Button, Input, Avatar, etc.)
2. **Layout**: Containers and grid systems (Container, Stack, Grid)
3. **Feedback**: Status indicators (Toast, Alert, Progress, Skeletons)
4. **Navigation**: Menus, breadcrumbs, pagination (Nav, Tabs, Breadcrumb)
5. **Overlay**: Modals, popovers, tooltips, dropdowns (Dialog, Popover, Tooltip, DropdownMenu)
6. **Data Display**: Tables, lists, badges, avatars
7. **Form Controls**: Inputs, selects, checkboxes, radios, switches
8. **Canvas & Drawing**: Specialized drawing components
9. **Workspace**: Document-specific components (PageViewer, Toolbar, Sidebar)

### Component Naming Convention
- **PascalCase** for component names
- **Descriptive and specific**: Avoid generic names like "Container" when more specific exists
- **Prefix with context when ambiguous**: e.g., "DialogHeader" vs "ModalHeader"
- **Suffix with variant when needed**: e.g., "ButtonPrimary", "ButtonSecondary"

### Component Structure
Each component should include:
1. **Types**: TypeScript interfaces for props and state
2. **Props**: Clearly documented with JSDoc
3. **Default Props**: Sensible defaults where applicable
4. **Styles**: Tailwind classes (utility-first)
5. **Accessibility**: ARIA attributes, keyboard navigation, focus management
6. **Events**: Clearly defined emitted events with payload types
7. **Documentation**: Usage examples and prop tables

---

### Specific Component Guidelines

#### Button Variants (from shipped auth forms)
- **Primary**: `bg-slate-900 text-white hover:bg-slate-800 focus:ring-2 focus:ring-slate-900 focus:ring-offset-2`
- **Secondary**: `bg-transparent border border-slate-300 text-slate-900 hover:bg-slate-50`
- **Ghost**: `bg-transparent text-slate-600 hover:bg-slate-100`
- **Selected/Accent**: `border-teal-600 bg-teal-50 text-teal-700`
- **Size**: `rounded-full px-4 py-2` (default), `px-6 py-3` (lg)
- **States**: default, hover, active, disabled, loading

#### Input Fields (from shipped auth forms)
- **Base**: `w-full rounded-full border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2`
- **Error**: `border-red-500 focus:ring-red-500`
- **Sizes**: default (py-3), sm (py-2), lg (py-4)
- **States**: default, focus, error, disabled, read-only
- **Features**: label, helper text, prefix/suffix, clear button

#### Book Cover Preview (from book creation page)
- **Surface**: `style={{ backgroundColor: theme.color }}` (dynamic via inline style)
- **Corner fold/emboss**: Subtle SVG or layered divs with low-opacity overlays
- **Shadow**: Book cover shadow (soft directional, see above)
- **Title**: `font-serif text-center`, fallback "Book Name" when empty
- **No category caption** (category feature removed per MVP_SCOPE.md)

#### Navigation Patterns
- **Top App Bar**: Fixed header with logo, minimal actions
- **Dashboard**: Book shelf grid, no sidebar
- **Mobile**: Full-width, stacked layout

#### Feedback Components
- **Toast**: Non-blocking, auto-dismiss, bottom-center
- **Alert**: Inline, dismissible, variants (info, success, warning, error)
- **Progress**: Determinate and indeterminate variants
- **Skeleton**: Loading placeholders matching content shape

---

### Data Display

#### Tables
- Not a primary pattern in Papyr (ledger uses canvas grid, not HTML tables)

#### Lists
- **Book Shelf**: Grid of cover previews with title, page count
- **Dividers**: Subtle (`border-slate-100`)

---

### Forms

#### Layout Patterns
- **Stacked**: Label above input (mobile preferred, used in auth forms)
- **Inline**: Label beside input (desktop forms)

#### Validation
- **Inline**: Show error as user types (on blur for password confirm)
- **Helpers**: Character counters, strength meter

---

### Dark Mode

#### Color Inversion
- **Background**: Swap with foreground values (Slate-900 → Slate-50)
- **Primary**: Slate-100 for buttons/text on dark
- **Accent**: Teal-400 for selected states on dark
- **Elevation**: Stronger shadows in dark mode for depth perception

#### Implementation
- CSS variables with `dark:` selectors
- Media query preference: `@media (prefers-color-scheme: dark)`
- Manual toggle available in settings (future)
- Persists choice in localStorage

---

### Platform Adaptations

#### Mobile/Touch
- **Touch Targets**: Minimum 48x48px
- **Spacing**: Increased between interactive elements
- **Navigation**: Single column, full-width cards
- **Forms**: Larger input fields, virtual keyboard optimization
- **Canvas**: Full viewport, no scrolling, toolbar at bottom

#### Pen/Stylus
- **Precision Areas**: Larger touch targets for fine control
- **Palm Handling**: Ignore touch input when pen is detected (OS level)
- **Pressure Sensitivity**: Variable line width and opacity
- **Tilt Support**: Future: shading based on pen tilt

#### Mouse/Desktop
- **Hover States**: Visible indicators for interactive elements
- **Right Click**: Context menu where appropriate
- **Keyboard Shortcuts**: Comprehensive keyboard navigation (Ctrl+Z/Y, etc.)

---

### Accessibility (a11y)

#### WCAG 2.1 AA Compliance
- **Color Contrast**: Minimum 4.5:1 for normal text, 3:1 for large text (slate-900 on white = 15.8:1 ✓)
- **Keyboard Navigation**: All interactive elements accessible via Tab
- **Focus Visibility**: Clear focus indicator (2px solid slate-900 + 2px offset)
- **ARIA Labels**: Descriptive labels for icons and non-text content
- **Screen Reader**: Proper semantic HTML and live regions
- **Text Scaling**: Support up to 200% text scaling without loss of function
- **Reduced Motion**: Respect `prefers-reduced-motion` media query

#### Specific Considerations
- **Drawing Canvas**: Provide alternative input methods for users with motor impairments
- **Color Coding**: Never rely solely on color to convey information
- **Timing**: Allow users to adjust or disable time-based interactions

---

## Implementation Guidelines

### Styling Approach
- **Utility-First**: Prefer Tailwind CSS utility classes
- **Dynamic Values**: Use `style` prop (or CSS custom properties), NEVER construct Tailwind classes at runtime
- **Dark Mode**: Use `dark:` variant for color inversions
- **Responsive**: Use responsive prefixes (sm:, md:, lg:, xl:) for breakpoints

### Component Library
We use and extend shadcn/ui which provides:
- Radix UI primitives for accessibility
- Tailwind CSS for styling
- Headless architecture for flexibility
- Easy customization via CSS variables

### Customization Points
1. **CSS Variables**: Define in `:root` and `.dark` for theme colors
2. **Tailwind Config**: Extend theme with custom values
3. **Component Props**: Allow overriding className via `className` prop
4. **Slot-Based Composition**: For flexible content projection

### Code Organization
```
/components
  /ui              # shadcn/ui components (mostly unchanged)
  /features        # Feature-specific components
    /auth          # Authentication related
    /dashboard     # Dashboard layout and widgets
    /documents     # Document viewing and editing
    /drawing       # Canvas and drawing tools
    /ledger-workspace  # Ledger-specific components (NEW)
    /navigation    # Navbars, sidebars, breadcrumbs
    /overlay       # Modals, popovers, tooltips
    /widgets       # Reusable UI widgets (buttons, inputs, etc.)
  /layout          # Page layouts, containers
  /shared          # Truly shared components across features
```

### Documentation & Storybook
- Each component has usage examples in code comments
- Props documented with JSDoc/TSDoc
- Visual regression testing for UI changes (Chromatic)

---

### Iconography
- **Library**: Lucide React (consistent, lightweight, MIT licensed)
- **Size**: 16px, 20px, 24px, 32px (based on context)
- **Color**: Inherit text color unless specifying variant
- **Weight**: Stroke width consistent (typically 1.5-2px)
- **Style**: Outline, monolinear, geometric

---

### Book Cover Themes (8 Predefined)
| Theme | Surface Color | Accent Color | Use Case |
|-------|--------------|--------------|----------|
| Graphite | `#1e293b` (slate-800) | `#0d9488` (teal-600) | Default, professional |
| Midnight | `#0f172a` (slate-900) | `#06b6d4` (cyan-500) | Dark, elegant |
| Forest | `#14532d` (green-900) | `#22c55e` (green-500) | Nature, growth |
| Terracotta | `#7f1d1d` (red-900) | `#f97316` (orange-500) | Warm, energetic |
| Ocean | `#1e3a5f` (blue-900) | `#0ea5e9` (sky-500) | Calm, trust |
| Amber | `#78350f` (amber-900) | `#f59e0b` (amber-500) | Creative, bold |
| Sage | `#365314` (lime-900) | `#84cc16` (lime-500) | Fresh, organic |
| Cream | `#fefce8` (amber-50) | `#ca8a04` (yellow-600) | Minimal, clean |

**Storage**: `cover_theme` (TEXT) + `cover_color` (TEXT, the accent hex) in `books` table.

---

### Motion & Microinteractions
- **Principles**: Purposeful, concise, natural
- **Entrance/Exit**: Fade and slide combinations
- **Feedback**: Immediate (<100ms) for user actions
- **Loading**: Skeleton screens over spinners when possible

---

### Implementation Checklist for New Components
- [ ] Follows naming convention
- [ ] Has proper TypeScript types
- [ ] Includes JSDoc for all props and methods
- [ ] Implements keyboard navigation where applicable
- [ ] Has appropriate ARIA attributes
- [ ] Responds to hover/focus/active states
- [ ] Handles disabled state properly
- [ ] Works in both light and dark modes
- [ ] Respects reduced motion preferences
- [ ] **Uses `style` prop for dynamic colors — no runtime Tailwind class construction**
- [ ] **Uses brand tokens (slate-900, teal-600, amber-50) — no indigo/blue defaults**
- [ ] Includes unit tests for logic
- [ ] Follows file structure conventions

---

### Version
- Document Version: 2.0.0
- Last Updated: 2026-08-16
- **Major change**: Corrected brand tokens to match shipped components (was Blue-600, now slate-900/teal-600)