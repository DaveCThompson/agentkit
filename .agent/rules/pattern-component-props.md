---
trigger: glob
globs: ["**/*component*.ts", "**/*reducers*.ts", "**/*dnd*.ts", "**/*types*.ts"]
tier: kind:app
domain: state
---

# Property Propagation Through Multi-Stage Pipelines

When a value must survive a multi-stage data pipeline — type definition → action/payload → state
transition → reducer/handler → extraction/serialization boundary — **every stage must carry it.**
Miss one stage and the value is *silently* dropped at the boundary (a drag-and-drop commit, a
serialize/deserialize round-trip, an undo/redo replay). The compiler will not catch an optional field
that a reducer simply forgets to copy.

## The rule
Adding or renaming a propagated property is never a one-file change. Walk the whole chain:

1. **Type** — add the field to the component/entity interface.
2. **Payload** — add it to the create/update action payload (creation-time values MUST be in the
   *add* payload, not only the update payload).
3. **Action union** — extend the action type so the payload field is representable.
4. **Reducer/handler** — copy the field from payload → new instance. *This is the usual failure
   point:* the handler builds the instance but forgets the optional styling/metadata props.
5. **Extraction boundary** — at the DnD / serialization / hydration seam, destructure the field from
   the transported data and pass it into the commit payload.

Any static source (a sidebar item, a preset, a seed) that supplies the property must include it in
its own `data`/config object, and the transport interface must be able to represent it.

## Where the concrete pipeline lives
The exact stage files/symbols for this repo (the type module, payload interfaces, the reducer, the
DnD/serialization hook) are project-specific — record them in `project-invariants.md` (or a
`domain-*` rule owning that surface), and follow that list as the checklist when propagating a field.
This rule is the *principle*; the wiring is the project's.
