# Clinical Design System: FEES Analytics & Workflow Optimizer

## 1. Overview & Creative North Star
The "Creative North Star" for this design system is **The Precision Curator**.

In a clinical environment, cognitive load is the enemy. This system rejects the "dashboard fatigue" of traditional medical software—characterized by rigid grids and harsh borders—in favor of a high-end editorial experience. We treat medical data with the same reverence as a premium architectural journal. By using intentional asymmetry, generous white space (breathing room), and "Tonal Layering," we guide the clinician's eye to what matters most: the pathology and the patient.

This is not just a tool; it is a supportive, high-fidelity environment that feels as precise as the medical instruments used to gather the data.

---

## 2. Colors & Surface Philosophy
The palette is rooted in medical trust but executed with sophisticated depth. We move beyond flat UI by utilizing Material 3-inspired tonal tiers.

### The Color Palette
- **Primary (`#005280`):** The authoritative anchor. Used for high-level navigation and critical actions.
- **Secondary (`#006e1c`):** "Within Normal Limits" (WNL). A calming, clinical green that signals safety without being neon.
- **Tertiary/Error (`#a10012`):** Pathological findings (PAS Scores/Aspirations). A muted, serious red that commands attention without causing panic.
- **Neutral/Surface (`#f8f9fa`):** The "Clean Room" canvas.

### The "No-Line" Rule
**Borders are prohibited for sectioning.** To achieve a premium look, define boundaries solely through background color shifts.
- A `surface-container-low` section sitting on a `surface` background provides all the separation a clinician needs without the visual clutter of a 1px line.
- Use `spacing-8` or `spacing-12` to let content breathe, allowing the eye to perceive groupings through proximity.

### The Glass & Gradient Rule
To prevent the UI from feeling like a static template:
- **Glassmorphism:** Use semi-transparent `surface-container-lowest` (80% opacity) with a `backdrop-blur` of 12px for floating headers or mobile navigation bars. This allows the clinical data to scroll "underneath" the UI, creating a sense of physical depth.
- **Signature Gradients:** Main CTAs should utilize a subtle linear gradient from `primary` to `primary-container`. This adds a "jewel-like" quality to the interaction points, making them feel tactile and intentional.

---

## 3. Typography
We use a dual-font approach to balance authority with utility.

- **Display & Headlines (Manrope):** A modern, geometric sans-serif with an editorial feel. It provides a confident "voice" for patient names and high-level anatomical categories.
- **Body & Labels (Inter):** The workhorse. Highly legible at small scales for clinical notes, PAS scores, and data-dense anatomical tables.

**Hierarchy as Diagnosis:**
- **Headline-LG:** Used for the current procedural step (e.g., "Bolus Administration").
- **Title-SM:** Used for anatomical landmarks (e.g., "Pyriform Sinuses").
- **Label-MD:** Used for metadata (e.g., "Timestamp 04:22").

---

## 4. Elevation & Depth
We eschew traditional "Drop Shadows" for **Tonal Layering**.

### The Layering Principle
Depth is achieved by stacking `surface-container` tokens:
1. **Base:** `surface` (#f8f9fa)
2. **Sectioning:** `surface-container-low` (#f3f4f5)
3. **Interactive Cards:** `surface-container-lowest` (#ffffff)

### Ambient Shadows
When an element must float (e.g., a critical Alert Modal for Aspiration), use an **Ambient Shadow**:
- **Color:** A 6% opacity tint of `on-surface` (#191c1d).
- **Blur:** 24px to 32px.
- **Result:** A soft, natural lift that mimics a light source in a clinical suite, rather than a "computer-generated" shadow.

### The Ghost Border Fallback
If a border is required for accessibility in data-heavy report tables, use a **Ghost Border**: `outline-variant` at 15% opacity. It should be barely perceptible—a suggestion of a boundary, not a cage.

---

## 5. Components

### Touch-Friendly Buttons & Toggles
- **Primary Button:** Large touch targets (min-height: `spacing-12`). Roundedness: `xl` (0.75rem). Use the Signature Gradient.
- **Segmented Toggles:** For binary findings (Normal vs. Pathological). Use `surface-container-high` for the track and `primary` for the selected state.

### Anatomical Data Cards
- **Structure:** No borders. Use `surface-container-lowest` on a `surface-container-low` background.
- **Visual Cue:** A vertical 4px "accent bar" on the left side using `secondary` (WNL) or `tertiary` (Pathological) to allow for rapid scanning during a high-speed FEES review.

### Progress Indicators (The Workflow Optimizer)
- **Design:** A linear, thin track using `outline-variant`. Completed steps transition to `primary` with a subtle `primary-fixed-dim` glow. Avoid numbered circles; use `label-md` text for a cleaner, more sophisticated look.

### Input Fields
- **Style:** "Bottom-line only" or "Soft Fill." For clinical speed, use `surface-container-highest` with a 2px `primary` underline on focus. Forbid high-contrast boxes that break the editorial flow.

### AI-Generated Report Review
- **The "Pulse" Card:** AI suggestions should be wrapped in a container with a very subtle `primary-fixed` subtle glow and a `glassmorphism` background. This distinguishes human-entered data from AI-generated insights.

---

## 6. Do's and Don'ts

### Do
- **Do** use `spacing-16` or `spacing-20` for page margins to create an elite, spacious feel.
- **Do** use `secondary_container` and `tertiary_container` for large background areas of findings to keep the text readable.
- **Do** prioritize "Smartphone-first" hit areas (minimum 44x44px) for clinicians wearing gloves or moving quickly.

### Don't
- **Don't** use 100% black text. Use `on-surface` (#191c1d) for a softer, more professional contrast.
- **Don't** use standard Material Design "Floating Action Buttons" (FABs) in the corner. Instead, use an integrated, sophisticated navigation bar using the Glassmorphism rule.
- **Don't** use dividers between list items. Use `spacing-4` of vertical whitespace to separate patient findings.
- **Don't** use "Alert Red" (#ff0000). Always use the `tertiary` palette (#a10012) to maintain a clinical, controlled atmosphere.

---
*This design system is a living document intended to evolve with clinical feedback, ensuring the "Precision Curator" remains the gold standard for FEES analytics.*
