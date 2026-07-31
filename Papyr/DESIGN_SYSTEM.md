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

## Design Tokens

### Color Palette
#### Primary Palette (Brand)
- **Primary**: #2563EB (Blue-600)
- **Primary Foreground**: #FFFFFF
- **Secondary**: #64748B (Slate-500)
- **Secondary Foreground**: #FFFFFF

#### Neutral Backgrounds
- **Background**: #FFFFFF (White)
- **Background Variant**: #F8FAFC (Slate-50)
- **Background Muted**: #F1F5F9 (Slate-100)
- **Background Inverted**: #1E293B (Slate-800) - for dark mode

#### Neutral Foreground
- **Foreground Primary**: #1E293B (Slate-800)
- **Foreground Secondary**: #64748B (Slate-500)
- **Foreground Muted**: #94A3B8 (Slate-400)
- **Foreground Inverse**: #F8FAFC (Slate-50)

#### Accent Colors
- **Success**: #10B981 (Emerald-500)
- **Warning**: #F59E0B (Amber-500)
- **Error**: #EF4444 (Red-500)
- **Info**: #3B82F6 (Blue-500)

#### Interactive States
- **Hover Overlay**: rgba(0, 0, 0, 0.04)
- **Press Overlay**: rgba(0, 0, 0, 0.08)
- **Focus Ring**: 3px solid #2563EB (Blue-600) with 2px offset
- **Disabled**: opacity 0.5 + cursor: not-allowed

#### Paper & Canvas
- **Paper Background**: #FFFFFF
- **Paper Shadow**: 0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)
- **Canvas Background**: #FFFFFF
- **Canvas Grid** (optional): rgba(0,0,0,0.05) for light mode, rgba(255,255,255,0.1) for dark
- **Selection Highlight**: rgba(37, 99, 235, 0.2) (Blue-600 at 20% opacity)

### Typography
#### Font Family
- **Base**: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif
- **Heading**: Same as base
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
- **Full**: 9999px

#### Border Width
- **0**: 0px
- **1**: 1px
- **2**: 2px
- **4**: 4px
- **8**: 8px

### Shadows
- **Sm**: 0 1px 2px 0 rgba(0, 0, 0, 0.05)
- **Default**: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)
- **Md**: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)
- **Lg**: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)
- **Xl**: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05)
- **Inner**: inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)
- **None**: none

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
- **Linear**: linear
- **In**: cubic-bezier(0.4, 0, 1, 1)
- **Out**: cubic-bezier(0, 0, 0.2, 1)
- **InOut**: cubic-bezier(0.4, 0, 0.2, 1)

#### Animation Presets
- **Fade In**: opacity from 0 to 1 over 150ms ease-out
- **Fade Out**: opacity from 1 to 0 over 150ms ease-in
- **Slide Up**: translateY from 100% to 0 over 200ms ease-out
- **Slide Down**: translateY from -100% to 0 over 200ms ease-out
- **Scale In**: scale from 0.95 to 1 over 150ms ease-out
- **Pulse**: scale 1 → 1.05 → 1 over 1000ms ease-in-out

## Component Guidelines

### Component Categories
1. **Primitive**: Basic building blocks (Button, Input, Avatar, etc.)
2. **Layout**: Containers and grid systems (Container, Stack, Grid)
3. **Feedback**: Status indicators (Toast, Alert, Progress, Skeletons)
4. **Navigation**: Menus, breadcrumbs, pagination (Nav, Tabs, Breadcrumb)
5. **Overlay**: Modals, popovers, tooltips, dropdowns (Dialog, Popover, Tooltip, DropdownMenu)
6. **Data Display**: Tables, lists, badges, avatars
6. **Form Controls**: Inputs, selects, checkboxes, radios, switches
7. **Data Visualization**: Charts, graphs (future)
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
4. **Styles**: Either Tailwind classes or CSS modules (prefer Tailwind for utility-first)
5. **Accessibility**: ARIA attributes, keyboard navigation, focus management
6. **Events**: Clearly defined emitted events with payload types
7. **Documentation**: Usage examples and prop tables

### Specific Component Guidelines

#### Button Variants
- **Primary**: Solid background with primary color
- **Secondary**: Outline with primary color
- **Ghost**: Transparent background, text color
- **Danger**: Background with error color
- **Size**: xs, sm, md, lg, xl
- **States**: default, hover, active, disabled, loading

#### Input Fields
- **Types**: text, password, email, number, textarea, select
- **Sizes**: xs, sm, md, lg
- **States**: default, focus, error, disabled, read-only
- **Features**: label, helper text, prefix/suffix, clear button

#### Navigation Patterns
- **Top App Bar**: For primary navigation and actions
- **Sidebar**: Collapsible for secondary navigation (desktop)
- **Bottom Navigation**: For mobile primary navigation (3-5 items)
- **Tabs**: For switching between related views
- **Breadcrumb**: For hierarchical navigation depth > 2

#### Feedback Components
- **Toast**: Non-blocking, auto-dismiss, positionable (top/bottom, left/right/center)
- **Alert**: Inline, dismissible, variants (info, success, warning, error)
- **Progress**: Determinate and indeterminate variants
- **Skeleton**: Loading placeholders matching content shape
- **Tooltip**: On hover/focus/press, with delay and smart positioning

#### Dialogs & Overlays
- **Modal**: Blocks background, requires dismissal
- **Drawer**: Slide-in panel from side (left/right/top/bottom)
- **Popover**: Anchored to element, lightweight context
- **Tooltip**: Simple text on hover/focus
- **Context Menu**: Right-click or long-press menu

### Data Display
#### Tables
- **Features**: Sorting, pagination, row selection, expandable rows, column resizing
- **Density**: compact, comfortable, spacious
- **Striped**: Alternating row colors for readability
- **Hover**: Highlight row on hover
- **Sticky Headers**: Fixed header when scrolling

#### Lists
- **Types**: Basic, icon + text, avatar + text, multi-line
- **Dividers**: Between items or sectioned
- **Clickable**: With ripple effect
- **Swipeable**: For reveal actions (mobile)

### Forms
#### Layout Patterns
- **Stacked**: Label above input (mobile preferred)
- **Inline**: Label beside input (desktop forms)
- **Float Label**: Label moves up when focused
- **Stepped**: Multi-step form with progress indicator

#### Validation
- **Inline**: Show error as user types
- **On Blur**: Show error when field loses focus
- **On Submit**: Show all errors at once
- **Helpers**: Success/Icons, character counters

### Navigation & Wayfinding
#### Elevation
Use shadows to indicate layering:
- **Level 0**: No shadow (inline elements)
- **Level 1**: Small elevation (buttons, cards)
- **Level 2**: Medium elevation (dialogs, menus)
- **Level 3**: High elevation (drawers, full-screen modals)
- **Permanent**: Fixed positioning (nav bars, FABs)

#### Interaction Feedback
- **Press**: Scale down 2% or opacity 80%
- **Hover**: Slight elevation increase or color shift
- **Focus**: Visible outline (2px solid primary + 2px offset)
- **Disabled**: Reduced opacity (50%) and cursor: not-allowed
- **Loading**: Spinner overlay or button state change

### Dark Mode
#### Color Inversion
- **Background**: Swap with foreground values
- **Primary**: Use lighter tint for dark background
- **Accents**: Maintain brand recognition with adjusted brightness
- **Elevation**: Stronger shadows in dark mode for depth perception

#### Implementation
- CSS variables with `dark:` selectors
- Media query preference: `@media (prefers-color-scheme: dark)`
- Manual toggle available in settings
- Persists choice in localStorage

### Platform Adaptations

#### Mobile/Touch
- **Touch Targets**: Minimum 48x48px
- **Spacing**: Increased between interactive elements
- **Navigation**: Bottom tab bar for primary navigation
- **Menus**: Full-screen or bottom sheet
- **Forms**: Larger input fields, virtual keyboard optimization
- **Gestures**: Swipe to navigate, long-press for context menu

#### Pen/Stylus
- **Precision Areas**: Larger touch targets for fine control
- **Palm Handling**: Ignore touch input when pen is detected (OS level)
- **Pressure Sensitivity**: Variable line width and opacity
- **Tilt Support**: Future: shading based on pen tilt
- **Button Mapping**: Pen barrel button for right-click/context menu

#### Mouse/Desktop
- **Hover States**: Visible indicators for interactive elements
- **Right Click**: Context menu where appropriate
- **Keyboard Shortcuts**: Comprehensive keyboard navigation
- **Drag & Drop**: Visual feedback**: Show placeholder during drag
- **Scrolling**: Smooth scrolling with momentum

### Accessibility (a11y)
#### WCAG 2.1 AA Compliance
- **Color Contrast**: Minimum 4.5:1 for normal text, 3:1 for large text
- **Keyboard Navigation**: All interactive elements accessible via Tab
- **Focus Visibility**: Clear focus indicator (minimum 2px solid)
- **ARIA Labels**: Descriptive labels for icons and non-text content
- **Screen Reader**: Proper semantic HTML and live regions
- **Text Scaling**: Support up to 200% text scaling without loss of function
- **Reduced Motion**: Respect prefers-reduced-motion media query

#### Specific Considerations
- **Drawing Canvas**: Provide alternative input methods for users with motor impairments
- **Color Coding**: Never rely solely on color to convey information
- **Timing**: Allow users to adjust or disable time-based interactions
- **Audio**: Provide visual alternatives for audio cues
- **Seizure Safety**: No flashing content >3Hz or general flash thresholds

### Implementation Guidelines

#### Styling Approach
- **Utility-First**: Prefer Tailwind CSS utility classes
- **Component Scoping**: Use CSS modules only when necessary for complex animations
- **Dark Mode**: Use `dark:` variant for color inversions
- **Responsive**: Use responsive prefixes (sm:, md:, lg:, xl:) for breakpoints

#### Component Library
We use and extend shadcn/ui which provides:
- Radix UI primitives for accessibility
- Tailwind CSS for styling
- Headless architecture for flexibility
- Easy customization via CSS variables

#### Customization Points
1. **CSS Variables**: Define in `:root` and `.dark` for theme colors
2. **Tailwind Config**: Extend theme with custom values
3. **Component Props**: Allow overriding className via `className` prop
4. **Slot-Based Composition**: For flexible content projection

#### Code Organization
```
/components
  /ui              # shadcn/ui components (mostly unchanged)
  /features        # Feature-specific components
    /auth          # Authentication related
    /dashboard     # Dashboard layout and widgets
    /documents     # Document viewing and editing
    /drawing       # Canvas and drawing tools
    /navigation    # Navbars, sidebars, breadcrumbs
    /overlay       # Modals, popovers, tooltips
    /widgets       # Reusable UI widgets (buttons, inputs, etc.)
  /layout          # Page layouts, containers
  /shared          # Truly shared components across features
```

#### Documentation & Storybook
- Each component has storybook examples
- Props documented with JSDoc/TSDoc
- Usage guidelines in component comments
- Visual regression testing for UI changes

### Iconography
- **Library**: Lucide React (consistent, lightweight, MIT licensed)
- **Size**: 16px, 20px, 24px, 32px (based on context)
- **Color**: Inherit text color unless specifying variant
- **Weight**: Stroke width consistent (typically 1.5-2px)
- **Style**: Outline, monolinear, geometric
- **Custom Icons**: Created in same style when needed

### Illustration Style
- **Line Art**: Simple strokes, minimal fill
- **Color**: Single accent color or duotone
- **Perspective**: Flat or slight isometric for depth
- **Style**: Friendly, approachable, technical but not cold
- **Usage**: Empty states, onboarding, feature highlights

### Motion & Microinteractions
- **Principles**: Purposeful, concise, natural
- **Entrance/Exit**: Fade and slide combinations
- **Feedback**: Immediate (<100ms) for user actions
- **Transitions**: Shared element transitions for context preservation
- **Loading**: Skeleton screens over spinners when possible
- **Scroll**: Smooth scroll with momentum preservation
- **Physics**: Spring animations for bouncy, natural feel

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
- [ ] Has storybook stories for all variants
- [ ] Passes accessibility audit (axe-core)
- [ ] Includes unit tests for logic
- [ ] Has example usage in documentation
- [ ] Follows file structure conventions
- [ ] Is tree-shakeable (no side effects unless necessary)

### Version
- Document Version: 1.0.0
- Last Updated: 2026-07-31