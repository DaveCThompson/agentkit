---
name: implement-component-scaffold
description: Generate boilerplate for new React components following project patterns. Use when creating new UI components.
tier: tech:react
---

# Implement Component Scaffold

Generate standardized component boilerplate following project conventions.

## When to Use
- Creating a new UI component
- Scaffolding a new feature page
- Adding a new shared component to the design system

## Approach

### Phase 1: Clone Doctrine Routing
1. **IF** the target is a lab/wizard surface (new feature in the features tree, new assistant, new wizard):
   - **STOP.** Route to `pattern-feature-scaffolding.md` §1 clone procedure.
   - Do NOT scaffold from scratch — clone an existing proven surface.
2. **ELSE** (shared component in the components tree): proceed to Phase 2.

### Phase 2: Context Gathering
1. Determine component type: Shared or Feature.
2. Identify the target directory.
3. Check for similar existing components for pattern reference.
4. **Styling home decision:**
   - Does a parent `@layer` sheet already exist for this component family (e.g., Button, Modal)?
   - IF yes: add styles to the existing global `@layer` sheet, do NOT create a new CSS Module.
   - IF no: create a new CSS Module in the component directory.

### Phase 3: File Structure
**Shared Component (components tree):**
```
components/
└── component-name/
    ├── component-name.tsx          # Main component
    ├── component-name.module.css   # Styles
    └── index.tsx                   # Barrel export
```

**Feature Component (features tree):**
```
features/
└── feature-name/
    ├── pages/                      # Page components
    ├── components/                 # Feature-specific components
    ├── atoms/                      # State atoms (action, derived, input, lifecycle, hooks)
    └── index.tsx                   # Barrel export
```

### Phase 4: Component Template
```tsx
// component-name.tsx
import styles from './component-name.module.css';

interface ComponentNameProps {
  /** Description of prop */
  propName?: string;
}

export function ComponentName({ propName }: ComponentNameProps) {
  return (
    <div className={styles.wrapper}>
      {/* Component content */}
    </div>
  );
}
```

### Phase 5: CSS Module Template
```css
/* component-name.module.css */
.wrapper {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-3);
}
```

### Phase 6: Barrel Export
```typescript
// index.ts
export { ComponentName } from './component-name';
export type { ComponentNameProps } from './component-name';
```

## Constraints
- Use kebab-case for file names
- Use PascalCase for component names and exports
- All styling via CSS Modules or existing global `@layer` sheet — no inline styles
- Zero hex values — use design tokens only
- Props interface must be exported for documentation
- Use `interface` over `type` for component props
- Use function declarations (`export function`) not arrow functions, to support React 19 ref-as-prop
- Include JSDoc comments for public props

## Output
- Component directory with all required files
- Barrel export configured
- Ready for implementation
