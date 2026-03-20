# Design System Strategy: Liquid Glass & The Intelligent Dark Mode

## 1. Overview & Creative North Star
The North Star for this design system is **"The Ethereal Intelligence."** 

We are moving away from the utilitarian, blocky nature of traditional translation tools to create a digital experience that feels like a fluid extension of thought. This system leverages the "Liquid Glass" aesthetic—a sophisticated interplay of deep architectural charcoals and translucent, frosted layers. By prioritizing a **Dark Mode First** approach and a **One-Handed UX** layout, we ensure that the interface remains unobtrusive and accessible. 

The design breaks the "template" look by using intentional asymmetry in decorative elements and high-contrast typography scales that command attention while maintaining a calm, professional tone.

---

## 2. Colors: Tonal Depth & The "No-Line" Rule

The palette is anchored in deep midnight tones to reduce eye strain, accented by high-frequency electric indigos.

### Core Tokens
- **Background (Base):** `#111318` (The canvas for all layering).
- **Primary Accent:** `#aec6ff` (Primary Fixed Dim) transitioning to `#0054ba` (On Primary Container).
- **Secondary (Glass Action):** `#00daf3` (Secondary Fixed Dim).
- **Surface Tiers:** Use `surface-container-low` (`#1a1c20`) for secondary areas and `surface-container-highest` (`#333539`) for floating interactive elements.

### The "No-Line" Rule
**Explicit Instruction:** Do not use 1px solid borders to section content. Boundaries must be defined solely through background color shifts or tonal transitions. To separate a translation input from the history list, place the input in a `surface-container-high` container over the `surface` background. The change in luminance is your divider.

### The Glass & Gradient Rule
Main Action Buttons (CTAs) should not be flat. Use a linear gradient from `primary_fixed` to `primary_container` at a 135-degree angle. For input containers, apply `backdrop-blur: 24px` with a 40% opacity fill of `surface_container_highest` to achieve the "Liquid Glass" effect.

---

## 3. Typography: Editorial Authority

We use a dual-font strategy to balance high-tech precision with human-centric legibility.

- **The Sans-Serif Foundation (Inter):** Used for all functional data. 
    - **Display-LG (3.5rem):** Reserved for dramatic language titles or hero numbers.
    - **Title-MD (1.125rem):** The standard for translated output text to ensure readability across complex scripts.
- **The Modern Accent (Manrope):** Used for labels and metadata.
    - **Label-MD (0.75rem):** Provides a technical, refined look for "Detected Language" or "Character Count" indicators.

The hierarchy is intentionally steep. A `headline-lg` should feel significantly more authoritative than `body-md` to guide the eye instantly to the core translation.

---

## 4. Elevation & Depth: Tonal Layering

Depth in this system is not about "rising off the page" with harsh shadows; it is about "stacking" light-bending materials.

### The Layering Principle
Stack tiers to create hierarchy:
1. **Level 0 (Base):** `surface` (`#111318`)
2. **Level 1 (Sections):** `surface-container-low` (`#1a1c20`)
3. **Level 2 (Cards/Inputs):** `surface-container-high` (`#282a2e`) + Glassmorphism.

### Ambient Shadows
For floating elements like "Language Selectors," use extra-diffused shadows:
- **Shadow:** `0px 24px 48px rgba(0, 0, 0, 0.4)`
- **Shadow Tint:** Use a 4% opacity of `on_surface` (`#e2e2e8`) within the shadow to mimic ambient light reflecting off the "glass" edges.

### The Ghost Border
If accessibility requires a container edge, use the "Ghost Border": `outline_variant` (`#3b494c`) at **15% opacity**. This creates a hint of a physical edge without breaking the liquid flow.

---

## 5. Components: The Thumb-Zone Library

All primary interactions are clustered in the bottom 40% of the screen (the "Thumb Zone") to support one-handed usage on modern large-format devices.

### Buttons & Chips
- **Primary Action (XL Radius - 24px):** A high-gloss gradient container using `primary_fixed`.
- **Secondary Chips (MD Radius - 12px):** Glassmorphic containers. Use `surface_variant` at 50% opacity with a blur.
- **Icon-Heavy Navigation:** Icons should be high-contrast (`on_surface`) and sized at 24dp, placed in the bottom bar with a clear `surface_container_highest` glass background.

### Inputs & Translation Cards
- **The Liquid Input:** Forbid divider lines between the "From" and "To" sections. Use a `spacing: 6` (2rem) vertical gap or a subtle shift from `surface-container-low` to `surface-container-high`.
- **Text Areas:** Use `body-lg` for input and `title-lg` for output. The output should always feel "heavier" and more important.

### List Items
- **Spacing Scale:** Use `spacing: 4` (1.4rem) between items. 
- **Eliminate Dividers:** Never use a horizontal rule. The separation is created by the rhythm of the text and the `surface-container` background of the active item.

---

## 6. Do’s and Don’ts

### Do:
*   **Do** embrace negative space. Use `spacing: 12` (4rem) to separate major functional blocks (e.g., Input vs. History).
*   **Do** use translucency on the bottom navigation bar so the "Liquid Glass" feel persists as content scrolls behind it.
*   **Do** ensure all text on vibrant accents uses `on_primary` or `on_secondary` for WCAG AAA compliance.

### Don't:
*   **Don't** use 100% black (`#000000`) for backgrounds; it kills the "Liquid" depth. Stick to `surface` (`#111318`).
*   **Don't** use sharp corners. Everything must be `xl` (1.5rem/24px) or `lg` (1rem/16px) to maintain the "Soft Minimalism" personality.
*   **Don't** place primary navigation icons at the top of the screen. Keep the top 60% for display and the bottom 40% for touch.
*   **Don't** use standard blue. Use the specified `secondary_fixed_dim` (`#00daf3`) for a more "intelligent/neon" feel.