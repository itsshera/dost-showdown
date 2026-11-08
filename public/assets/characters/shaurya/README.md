# shaurya — modular GLB slot

The game ships with a detailed procedural fighter for this character. To replace it
with a custom model, drop a .glb file here and point the appearance override at it:

`	s
useRosterStore.getState().setOverride('shaurya', {
  appearance: {
    modelUrl: '/assets/characters/shaurya/model.glb',
    modelScale: 1,
    modelYOffset: 0,
    modelRotation: 0,
  },
})
`

The same fields are persisted by the Power Lab / roster override store, so the
replacement survives reloads.

## Expected model contract

- Y-up, facing +Z in the file (the renderer applies the game facing yaw).
- Roughly 1.75–2 units tall at scale 1.
- Optional animation clips named after fighter states:
  idle, walk, ackwalk, jump, crouch, lock, punch, kick,
  special, hit, stunned, knockdown, ictory, defeat.
  Missing clips fall back to the first clip, then to a static pose.
- Keep gameplay stats in src/data/characters.ts or Power Lab overrides — the
  model only changes the visual.

No third-party assets are bundled. Only use models you have the right to ship.
