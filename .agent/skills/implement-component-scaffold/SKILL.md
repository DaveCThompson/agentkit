---
name: implement-component-scaffold
description: Create a new React component scaffold when the user wants boilerplate aligned with the project's existing component, styling, state, and export conventions.
tier: tech:react
---

# Implement Component Scaffold

A linked rule absent from the project's selected `.agent/rules` is unavailable, not read.
Check its applicability against project contracts; carry any required missing guidance as
unresolved.
The feature-scaffolding reference applies to repeated feature surfaces; design-token guidance
applies when adding themed visual treatment. React membership alone does not make those app
contracts mandatory. Use applicable project equivalents in tooling/library repositories; missing
guidance required by the actual target remains unresolved until supplied. Do not widen project kind
or reinstall an excluded capability merely to satisfy a conditional citation.

## When to Use

Use for new React components or feature surfaces. Creating a scaffold does not authorize a
framework migration, design-system rewrite, or new state library.

## Approach

### Phase 1: Context and Reuse

Locate the intended consumer, component role, and nearest applicable project example. Read
the component, styling, export, and design-token contracts that actually govern the target.

For repeated feature surfaces, use [pattern-feature-scaffolding](../../../.agent/rules/pattern-feature-scaffolding.md),
Clone to Create, to choose a proven sibling where one fits. Preserve its useful interaction,
scroll, responsive, and lifecycle contracts while adapting the new feature's semantics. If no
suitable sibling exists, build the smallest scaffold consistent with the project; record the
missing reference rather than copying an unrelated surface.

### Phase 2: Choose the Files

Create only files with a current consumer. Follow the project's naming and directory conventions.
Do not add empty pages, atoms, hooks, or component directories merely because an example has them.

Resolve styling before writing imports:

- If the family uses an existing global layer sheet, add scoped selectors there and use its
  established loading path. Do not create or import a nonexistent CSS Module.
- If the project uses CSS Modules for this surface, create the matching module and import it.
- If the project uses another styling system, follow that contract.

Resolve state ownership from actual behavior; React membership does not imply atoms.
Create a barrel only when the project or consumer needs it. A type/export-only barrel can use
`index.ts`; preserve the project's established extension convention consistently.

### Phase 3: Component Template

The following is a conditional TypeScript/CSS-Module example, not a required project layout.
It assumes the project's JSX runtime and CSS-Module typings are configured. Replace the name
and choose real props; every scaffold prop must have a purpose.

```tsx
// component-name.tsx
import type { ReactNode } from 'react';
import styles from './component-name.module.css';

export interface ComponentNameProps {
  children: ReactNode;
}

export function ComponentName({ children }: ComponentNameProps) {
  return <div className={styles.wrapper}>{children}</div>;
}
```

```css
/* component-name.module.css */
.wrapper {
  display: flex;
  flex-direction: column;
}
```

Add spacing, colors, and other treatments using tokens verified in the actual project under
[foundation-design-tokens](../../../.agent/rules/foundation-design-tokens.md). Do not invent a token
definition or copy an unrelated spacing scale.

For a global-sheet variant, replace the CSS-Module import and class usage together. With the
same ReactNode import and props interface above, the component is:

```tsx
export function ComponentName({ children }: ComponentNameProps) {
  return <div className="component-name">{children}</div>;
}
```

Place the corresponding `.component-name` rule in the chosen existing sheet. Confirm that the
consumer loads that sheet; the example is not permission to add a second global stylesheet.

### Phase 4: Exports and Compatibility

If a barrel is required, the component's public type must actually be exported:

```typescript
// index.ts
export { ComponentName } from './component-name';
export type { ComponentNameProps } from './component-name';
```

Follow applicable [pattern-code-standards](../../../.agent/rules/pattern-code-standards.md) for naming,
declaration style, imports, comments, and framework exceptions. Document non-obvious public
prop constraints; do not add comments that repeat the type.

Choose ref handling for the project's supported React version and component contract.
React 19 permits ref as a prop on function components; declaration versus arrow syntax is not
what enables it. See [React 19: ref as a prop](https://react.dev/blog/2024/12/05/react-19#ref-as-a-prop).
Do not migrate existing compatibility wrappers just to match this example.

### Phase 5: Verification

Check that imports, exported types, styling selectors, and the actual consumer resolve. Use
the project's applicable type/build checks through
[foundation-testing](../../../.agent/rules/foundation-testing.md), Lifecycle-Aware Verification Gate.
For interactive scaffolds, check semantic controls, focus, disabled behavior, and required runtime
proof under [foundation-browser-usage](../../../.agent/rules/foundation-browser-usage.md).

## Definition of Done

The scaffold contains only needed files, follows inspected project conventions, and is usable
from its intended consumer. Report which integration/styling checks ran and what implementation
remains. A scaffold ready for implementation is not a completed feature.
