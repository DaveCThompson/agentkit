---
name: react-flow-architect
description: Use when creating or reviewing React Flow diagrams, especially custom nodes, handle routing, layout geometry, or interaction contracts.
tier: tech:react-flow
---

# React Flow Architect

## When to use

Use for diagram architecture and rendered edge correctness. Preserve the requested interaction
mode: an editor, navigable diagram and static illustration have different needs. A review request
does not authorize implementation. Use `pattern-ui-copy.md` for labels and the local design system
for visual styling.

## Approach

### Discover the local contract

Inspect the package version, actual source roots, existing diagrams, node/edge types, styles,
wrapper and registration code. Use available file reading and search; do not assume a `reference/`
directory or a `<ReactFlowDiagram>` wrapper. Follow an existing wrapper when it supplies required
behavior. Keep import casing consistent with actual files and the project's build environment.

Identify which data changes at runtime, who owns nodes/edges, and whether layout is saved,
computed, or user-driven. Keep type registration stable across renders, typically outside the
render function; avoid recreating node component definitions during rendering. Separate reusable
diagram data when useful, without requiring a new module for a small local diagram.

### Validate the handle contract

Build the edge check from actual rendered node declarations, including conditional handles and
their current IDs. For each edge, resolve source/target nodes, their types, the specified handle
IDs, directions and connection mode. Validate uniqueness and any application-specific connection
rules. Do not infer IDs from visual position alone. If a node has multiple handles of one type,
give them distinct IDs and reference the intended one explicitly.

An optional schema for a left-to-right diagram could be:

| Node handle | Declaration | Edge field |
| --- | --- | --- |
| Output on right | `<Handle type="source" position={Position.Right} id="out" />` | `sourceHandle: 'out'` |
| Input on left | `<Handle type="target" position={Position.Left} id="in" />` | `targetHandle: 'in'` |

The `in` and `out` names are examples, not library defaults. Top, bottom and multiple-side handles
work the same way. In loose connection mode, apply the installed version's connection semantics
rather than rejecting valid typeless connections. [React Flow's handle guide](https://reactflow.dev/learn/customization/handles)
documents IDs, connection modes, and hiding handles without removing their dimensions.

### Preserve measurable geometry

- Give the React Flow parent a real width and height and load the package's required styles.
- Inspect node dimensions, coordinate origins, handle offsets, viewport zoom and custom edge
  path inputs when an edge is missing or unexpectedly long. A matched ID alone is insufficient.
- Keep hidden handles measurable with `visibility: hidden` or `opacity: 0`; `display: none`
  removes the dimensions needed for routing. Separately disable connection interaction when required.
- When handles are added, removed or repositioned dynamically, update node internals after the
  DOM reflects the change. Check [useUpdateNodeInternals](https://reactflow.dev/api-reference/hooks/use-update-node-internals)
  for the installed version. Recheck layout after fonts or asynchronous content change dimensions.
- For custom edges, verify the actual source/target coordinates and positions passed to the path
  helper. Account for labels, arrow markers, hit areas and clipping at the viewport boundary.

### Choose presentation and interaction deliberately

Use existing theme tokens and verify edge contrast against the actual canvas in supported themes.
Do not mandate one token name, a 1px container border, animated forward edges or solid feedback
edges without a local contract. Flow direction can use markers or labels; animation is optional
and needs reduced-motion handling. Avoid using color alone for a meaningful distinction.

Retain dragging, selection, zoom, controls and keyboard behavior when the task is an editor.
For a static illustration, disable editing intentionally while keeping the diagram legible and
accessible at the supported viewport sizes. Do not disable navigation merely to match an example.
Use meaningful node and edge labels, with secondary text only when it clarifies a role or action.
Preserve exact technical names where simplifying them would change meaning. Provide a textual
equivalent when the visual connections carry information unavailable to assistive technology.

## Verification workflow

Compare edges with the discovered node/handle declarations. Then render the affected diagram and
inspect visible paths, markers, labels and console warnings. Exercise relevant dynamic handle
changes, resize/zoom, selection/dragging, keyboard use, themes and reduced motion. Check both a
valid connection and the invalid connection the application must reject when changing validation.

If rendering is unavailable, deliver the source/contract checks with the exact pending visual
states. Do not call an ID audit proof that edges render. Reuse focused evidence via
`foundation-testing.md`; do not add a separate whole-application gate.

## Definition of done

The diagram follows the actual local contract, edges reach existing handles, geometry remains
valid in the required states, and the requested interaction and accessible meaning are preserved.
Report material findings or changes with evidence and limitations; no findings is a valid review.
