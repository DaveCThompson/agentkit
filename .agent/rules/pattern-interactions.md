---
trigger: model-decision
description: Consult when designing hover/click/completion states for cards and lists — sync-hover promotion, inert completed items, whole-card hit targets (Fitts's law), neutral scannability.
tier: kind:app
domain: layout
---

# Interaction Patterns

Premium interaction standards for the the application.

## 1. Promoted Indicator Pattern (Sync-Hover)
When using a whole-card click model, internal Call-to-Action (CTA) elements MUST synchronize their visual state with the parent card.
*   **Rule:** If the card is hovered, the CTA (button/chevron) should automatically enter its 'highlight' or 'active' visual state.
*   **Implementation:** Use parent-selector targeting in CSS Modules (e.g., `.card:hover .cta { ... }`).
*   **Why:** Creates a unified, premium feel where the entire component responds as a single intelligent unit.

## 2. Inert Completion Policy
Completed or terminal states MUST be visually distinguished as non-interactive.
*   **Rule:** Completed items (cards, rows, tasks) MUST:
    *   Remove all hover shadows and lift effects.
    *   Remove `cursor: pointer`.
    *   Be excluded from keyboard tab order if no longer actionable.
*   **Styling:** Use flat backgrounds or subtle "recessed" gradients. Avoid "raised" shadows on completed work.
*   **Why:** Provides clear visual feedback that a task is finished and requires no further action (REDUCED COGNITIVE LOAD).

## 3. Whole-Card Interaction Model (Fitts's Law)
For list-based navigation (Tasks, Sessions, Resources), the entire card/row SHOULD be the primary hit target.
*   **Rule:** The interactive area should be maximized (whole card) rather than limited to a small text link or button.
*   **A11y:** The card MUST have `role="button"`, proper `aria-labels`, and handle `Enter`/`Space` keys.
*   **Nested Links:** Discrete secondary actions (e.g., "View Terms") MUST use `e.stopPropagation()` to prevent double-triggering the primary card action.

## 4. Neutral Scannability
Avoid aggressive brand colors or alert colors (red/pink) for standard interaction transitions in high-density lists.
*   **Rule:** Standard hover borders SHOULD use theme-aware neutral tokens (e.g., `var(--surface-border-strong)`).
*   **Action:** Darken in light mode, lighten in dark mode.
*   **Why:** Prevents "rainbow fatigue" and keeps the focus on the content during scanning.
