# Design System Strategy: Specialized Educational Care (AEE)

## 1. Overview & Creative North Star: "The Clarified Path"
In the context of Specialized Educational Care (AEE), the interface must be more than just functional; it must be a calm, authoritative guide. Our Creative North Star is **"The Clarified Path."** 

This system rejects the cluttered, "dashboard-heavy" look of traditional management software. Instead, we embrace a **High-End Editorial** approach. We achieve this through intentional asymmetry—where large typographic headlines create a strong anchor point—and "breathing" layouts that prioritize cognitive ease. We move beyond the "template" feel by layering surfaces like fine paper, ensuring that educators and specialists feel a sense of professional serenity rather than administrative burden.

---

## 2. Colors: Tonal Architecture
We move away from rigid lines. Depth is defined by light and tone, not by ink.

*   **Primary (#1A6F45):** Use for "Authoritative Actions." It represents growth and stability.
*   **Secondary & Tertiary:** Used for subtle categorization and "On-Surface" hierarchy to prevent visual fatigue.
*   **The "No-Line" Rule:** **Prohibit 1px solid borders for sectioning.** Boundaries must be defined solely through background color shifts. For example, a `surface-container-low` section sitting on a `surface` background creates a clear but soft distinction.
*   **Surface Hierarchy & Nesting:** Treat the UI as physical layers. 
    *   *Lowest:* Backgrounds (`surface`).
    *   *Mid:* Main content areas (`surface-container-low`).
    *   *Highest:* Floating cards or modals (`surface-container-lowest` / White).
*   **The "Glass & Gradient" Rule:** Use `backdrop-blur-md` with semi-transparent primary lights (`primary-light/80`) for floating headers. Apply a subtle linear gradient (from `primary` to `primary-container`) on hero buttons to give them a "jewel" quality that flat colors lack.

---

## 3. Typography: Absolute Legibility
We use **Atkinson Hyperlegible** not just for accessibility, but as a high-contrast editorial tool.

*   **Display (3.5rem - 2.25rem):** Used for student names or major section headers. It should feel like a title in a premium journal.
*   **Headline (2rem - 1.5rem):** Provides immediate context. Use `font-bold` and `tracking-tight`.
*   **Body (1rem - 0.875rem):** The workhorse. Always use high contrast (`on-surface`) for maximum readability.
*   **Hierarchy Strategy:** Use a "Type-First" layout. Instead of a box containing a title, let the large, bold title define the space, with the content flowing organically beneath it.

---

## 4. Elevation & Depth: Tonal Layering
Traditional shadows are too heavy for an educational environment. We use **Tonal Layering**.

*   **The Layering Principle:** Stack `surface-container-lowest` (White) cards on `surface-container-low` (#F3F3F3) backgrounds. This creates a "lift" that feels natural and light.
*   **Ambient Shadows:** If a card must float (e.g., a student profile preview), use a hyper-diffused shadow: `shadow-[0_8px_30px_rgb(28,28,30,0.04)]`. The shadow is a whisper, not a shout.
*   **The "Ghost Border" Fallback:** If a container needs more definition on a white background, use `border-outline-variant/10`. Forbid 100% opaque borders; they create "visual noise" that distracts from the student data.
*   **Glassmorphism:** Use `bg-white/70 backdrop-blur-xl` for sticky navigation bars. This allows the primary brand colors to bleed through as the user scrolls, maintaining a sense of place.

---

## 5. Components: Editorial Implementation

### Buttons (The Anchor)
*   **Primary:** Tailwind `bg-primary text-on-primary rounded-md px-6 py-3 font-bold transition-all hover:bg-primary-container`.
*   **Secondary:** No background. Use `border-2 border-primary/20 text-primary hover:bg-primary-light/30`.
*   **Tertiary:** `text-primary font-bold hover:underline underline-offset-4`.

### Cards & Lists (The Flow)
*   **Forbid Divider Lines.** To separate a list of students, use vertical white space (`py-4`) and a subtle background toggle on hover (`hover:bg-surface-container-low`).
*   **Student Profile Card:** Use an asymmetric layout. The student name in `headline-sm` on the top left, with the status chip (`Success` or `Info`) floating in the top right, unencumbered by a box.

### Input Fields (The Clarity)
*   **Style:** `bg-surface-container-highest/30 border-b-2 border-outline-variant focus:border-primary focus:bg-white transition-all duration-300`. 
*   Avoid the "four-sided box" look; an underline-heavy approach feels more like a professional form and less like a generic web app.

### Progress Chips (AEE Specific)
*   Use `rounded-full px-3 py-1 text-label-md font-bold`. Colors must be soft: `bg-primary-light text-on-primary-fixed-variant`.

---

## 6. Do's and Don'ts

### Do:
*   **Embrace White Space:** If you think a section needs more room, double the padding.
*   **Use Lucide Icons Sparingly:** Use them as "Wayfinders" (e.g., a `BookOpen` icon next to a lesson plan title), not as decoration.
*   **Color for Meaning:** Use the Status tokens (`Success`, `Warning`, `Danger`) only for student milestones or urgent alerts.

### Don't:
*   **Don't use 1px Dividers:** Use `space-y-6` instead of `<hr />`.
*   **Don't use Dark Shadows:** Avoid `shadow-lg` or default black opacities. They feel "dirty" against the clean primary green.
*   **Don't Center-Align Data:** Data is for reading. Keep it left-aligned like an editorial column to ensure the eye follows a predictable path.

---

## 7. Tailwind Implementation Snippet