# Floorplan Tool

A single-file, personal-use floorplan editor. No install, no build step, no
account, no server — just open `index.html` in a browser.

Originally scoped as a business idea with a hybrid vision-LLM + OpenCV
detection pipeline; that's shelved. This is the trimmed-down version for
personal use: trace walls over a photo/screenshot of a floorplan (e.g. saved
from a property listing — the tool never fetches listings itself), or let
Claude take a first pass and correct it, calibrate the scale, and place
furniture.

## Running it

Just open `index.html` in a browser (double-click it, or `open index.html` on
macOS). Everything runs client-side.

## Basic workflow

0. **Floors** — the tab strip at the top holds one tab per floor. "+ Add
   floor" makes a new blank one; click a tab to switch to it, double-click to
   rename, and the × on a tab deletes it (you always need at least one).
   Each floor has its own image, scale calibration, walls, doors and
   furniture — they don't show on top of each other.
1. **Open / paste floorplan image** — file picker, or `Cmd+V` to paste a
   screenshot straight in. Applies to whichever floor tab is active.
2. **Calibrate scale** — drag along something on the image with a known
   real-world length (a printed dimension, a door you know is ~80cm, etc.)
   and type that length in metres. Until you do this, furniture is sized off
   a rough guess.
3. **Draw wall** — click-drag to trace each wall segment over the image.
   Hold Shift to snap to 0/45/90°; otherwise endpoints snap to nearby
   wall/window endpoints and edges when dragged close (see Snapping below).
4. **Draw window** — same click-drag tracing as walls, but renders as a
   window symbol (thick white band with dark frame/mullion lines) instead of
   a solid wall. Use it for actual windows, including each straight side of a
   bay window's step-out. Same snapping as walls.
5. **Add door** — drops a door symbol you can then drag/rotate into place.
   Select it to flip which end the hinge is on and which way it swings (the
   panel shows "Flip hinge side" / "Flip swing direction" buttons), so the
   swing arc matches the real floorplan. Dragging a door snaps it onto the
   nearest wall's centreline and aligns its rotation to that wall — hold
   Shift while dragging to bypass.
6. **Snapping** — while drawing/moving a wall or window endpoint, it snaps
   (within a small pixel radius) to any nearby wall/window endpoint or onto
   another segment's edge, so adjoining walls line up without needing
   pixel-perfect dragging. Hold Shift during a wall/window drag to use
   angle-snapping (0/45/90°) instead. Doors snap onto the nearest wall the
   same way (see above).
7. **Lock wall angles when resizing** — on by default (checkbox in
   Structure). With an existing wall or window selected, dragging one of
   its two endpoint handles is constrained to slide along that segment's
   *existing* angle — only its length changes, not its direction. Meant
   for trimming an auto-detected wall that's the right angle but the wrong
   length, without nudging it out of true in the process. Hold Shift
   during that drag (or untick the checkbox) for the old free-drag
   behaviour.
8. **Resize vs. move cursor** — with something selected, hovering over an
   endpoint/corner handle shows a directional resize cursor (the same
   ns/ew/diagonal family macOS uses for window edges — for a wall or
   window it's oriented to match that segment's actual angle, not just
   horizontal/vertical), while hovering over the body shows a move cursor
   — so it's clear which a drag will do *before* you commit to it, rather
   than finding out by nudging something the wrong way.
9. **Auto-detect walls (pixel-based)** — no AI, no API key, no cost,
   deterministic. Tracing a solid black line is a mechanical pattern-match,
   not a judgment call, so this handles it with actual image processing
   instead of asking a vision model to guess coordinates: threshold the
   image for dark pixels, keep only regions at least as thick as a
   reference wall you pick, split what survives into long horizontal/
   vertical runs, bridge gaps that still have faint dark content (a
   window's glazing lines interrupt a wall's *solid* fill without really
   breaking it) while leaving genuinely blank gaps alone (a real doorway or
   open-plan connection), and read off the exact pixel extents as walls.
   Two steps: **"Pick wall thickness"** — drag once, perpendicular, across
   the *thinnest* wall you want caught (usually an interior partition, not
   an exterior wall — this drawing's exterior walls were ~35px vs ~17px
   for interior ones, and a threshold set from the thicker one alone
   silently missed every interior wall). Then **"Auto-detect walls from
   image"** — runs the pipeline and adds whatever it finds. Validated
   against a real listing PDF: caught essentially every wall on two floors
   with the same settings, no floor-specific tuning needed. Known
   limitation: an open-plan gap decorated with door-swing arcs or a
   level-change zigzag can occasionally read as "dark enough" and get
   bridged into a wall that shouldn't be there — an easy one to spot and
   delete, a far more forgiving failure mode than a missing wall.

   Once the walls above look right, **"Auto-detect windows along walls"**
   (same section) finds windows the same deterministic way — but scans
   *along the confirmed wall segments themselves* rather than the whole
   image, using each wall's own line as a corridor. A window interrupts a
   wall's otherwise-solid fill without leaving it truly blank (its glazing
   bars still show up as content, just lighter — measured ~150-190
   luminance in a real listing image, nowhere near black, which is why
   window detection uses its own much looser brightness threshold than
   wall detection's — reusing the wall threshold reads every window as
   empty space). No separate calibration step, and every result lands
   exactly on a confirmed wall's line by construction, since it's scanned
   from that wall's own geometry rather than guessed independently.

   Two known gaps, investigated and confirmed rather than assumed:
   - **A doorway decorated with a swing arc can get mistaken for a window
     — and it's the same root cause as wall detection's own known
     limitation, not a separate bug.** If wall detection bridges across a
     real doorway (because the arc's ink gives that gap some density,
     exactly as documented above), window detection then sees one
     continuous wall spanning the doorway and can flag the arc's density
     as window-like. Tried fixing this directly (checking the *minimum*
     density across sub-windows of a gap, not just its average, so a
     short solid pier between two doors couldn't average the whole span
     up past the bridging threshold) and confirmed it does fix that
     specific case — but broke real window detection elsewhere: measured
     against the actual listing image, real windows range from 0.09 to
     0.51 density depending on the window, while a confirmed-blank,
     arc-decorated doorway measured 0.30 — squarely inside that range. No
     single density threshold (average or minimum, strict or loose
     brightness cutoff) can include every real window while excluding
     every arc-decorated doorway, because the ranges genuinely overlap.
     Telling a curved arc apart from straight glazing bars is shape
     recognition, not a threshold — the fix is knowing where the real
     doors are, which is what door detection (next up, AI-assisted
     specifically for this kind of symbol reading) will provide.
   - **A bay window won't be found** — it doesn't sit *within* any single
     wall segment's own thickness band (what this scanner reads), it sits
     in the *gap* between two wall segments that step outward at an angle
     rather than continuing in a straight line. Detecting it needs
     recognising that stepped-polygon shape between two wall endpoints,
     which this scanner doesn't attempt. Trace it manually with the
     "Draw window" tool for now (the angle lock + hover cursor from
     earlier make this quick) — happy to build dedicated bay-window
     detection if it comes up often enough to be worth it.

   **"Auto-detect doors"** (same section, needs an API key — see AI Detect
   below) does the shape-recognition step the paragraph above pointed to.
   Position-finding purely from wall geometry (no AI) was tried first and
   tested against a real 11-wall trace before being adopted — it found
   zero usable doors, because door gaps decorated with a swing arc almost
   always get bridged into a continuous wall (the same mechanism as the
   window/doorway confusion above), so genuinely unbridged gaps are rare.
   Instead, one AI call per floor reads the whole image for doors,
   reporting just two points per door (the hinge, and the leaf's open
   tip) rather than guessing a rotation/hinge-side/swing-direction
   triple directly — then each reported door is *snapped onto its
   nearest pixel-confirmed wall* and its hinge/swing derived from the
   two points relative to that wall's true angle, so a rough AI position
   still lands as an exactly axis-true door once a confirmed wall is
   nearby, and a reported door nowhere near any confirmed wall is
   dropped rather than placed floating. Review with Select afterward —
   the "Flip hinge side"/"Flip swing direction" buttons fix a wrong
   reading without needing to redraw the door.
10. **AI Detect (beta)** — paste an Anthropic API key (from
   console.anthropic.com; stored only in this browser's local storage, never
   written into the project JSON). Two buttons:
   - **Split multi-floor image into tabs** — for a listing image that shows
     every floor on one picture (common — each sub-plan usually labelled
     "Ground Floor" / "First Floor" / etc. near its bottom). Claude finds each
     floor's region and its label; the tool crops each one out into its own
     new floor tab, replacing the current floor (which must have nothing
     traced on it yet, since only its image carries over). Run this first,
     before tracing anything, on the combined image.
   - **Detect walls, doors & dimensions** — runs per floor, after splitting
     (or on any single-floor image). Claude adds its best-guess walls (solid
     black bands, each with an estimated thickness), windows (recognised
     separately from walls — mostly white/unfilled bands with dark frame
     details, including bay windows as multiple segments), and doors
     (located from their swing arc, with hinge side and swing direction read
     off that arc so the placed symbol matches). It also reads every room's
     printed width/depth measurement — floorplans typically mark each one
     with small arrows at the wall it's measured between (12+6 o'clock for a
     vertical measurement, 3+9 for horizontal) — combining all of them
     (median, so one misread arrow doesn't skew things) into a single scale
     calibration for that floor instead of you having to pick one line by
     hand, and reads room names/dimension text onto a separate text layer
     (toggle it off with the "Text layer" checkbox in the top bar — handy
     once you've traced over it and just want the plan underneath). All
     these actions **add** to what's already on the floor rather than
     replacing it, so it's safe to re-run — always review and correct the
     result with the Select tool afterwards. Each run costs a small amount
     on your Anthropic account (a few cents on Claude Opus 5 per image; the
     Model dropdown lets you pick a cheaper one).
   - **High-accuracy detect (tiled, ~2x cost)** — same detection, but splits
     the floor image into a 2x2 grid and runs detection on each quadrant at
     full resolution, instead of one pass on a possibly-downscaled whole
     image (Claude's vision input is capped at a fixed number of "visual
     tokens" per image — a tile sees more actual pixels per wall than the
     whole plan would). Each tile is *cropped* with a bit of overlap past
     its own quadrant (so it has context for anything dipping slightly past
     its edge) but only *owns* results centred within its own exclusive
     quadrant — this ownership rule is what prevents duplicates, rather
     than trying to spot near-identical detections after the fact. A wall
     that gets truncated by whichever tile owns its midpoint (because that
     tile's crop didn't reach far enough to see the whole thing) is stitched
     back together with any matching fragment from a neighbouring tile in a
     separate merge step — safe for walls/windows since two collinear,
     touching fragments really are (near enough always) the same physical
     wall. Dimension readings are **not** fragment-merged, only
     ownership-filtered: two different rooms' width measurements are often
     drawn collinear along a shared wall, and merging them the same way
     walls are merged would fuse two distinct readings into one bogus span
     while keeping only one room's length — corrupting the scale
     calibration (this was an actual bug in an earlier version, caught from
     a ~168%-variance calibration warning). The merged result is then
     handled exactly like a normal pass (same review-and-correct workflow).
     Costs roughly 2x a single pass — most of that extra cost is the fixed
     prompt sent 4 times, not the image data — typically a few cents to
     well under $0.15 on Opus 5 for one floor. Worth trying when a normal
     pass leaves walls noticeably off from the underlying image. **Only run
     this on an image that's already a single floor** — if the loaded image
     still shows multiple levels together (a listing image with
     Ground/First/Cellar in one picture), run "Split multi-floor image into
     tabs" first. The tiled pass has no whole-image context to judge "which
     floor is this really", so a tile landing mostly on a different level
     can get detected as if it were part of this one — a prompt safeguard
     tells it to ignore an edge sliver of a differently-labelled floor, but
     that only helps with a thin bleed at a tile's edge, not a tile that's
     mostly a different floor.
11. **Wall/window thickness** — the "New wall thickness (cm)" and "New window
   thickness (cm)" fields set the thickness for segments you draw from then
   on; select an existing one (or one Claude added) to edit its thickness
   individually.
12. **Image opacity** — the slider in the top bar fades the background
   floorplan image so traced walls/windows/doors stand out; it's a view
   setting only (not saved in the project).
13. **Traced floorplan toggle** — the "Traced floorplan" checkbox in the top
    bar hides everything you've drawn/detected (walls, windows, doors,
    furniture — not the background image or the text layer), so you can
    compare the traced result against the bare underlying image without
    losing any of it. Also view-only, not saved.
14. **Zoom** — the slider in the top bar (25%–400%, "Fit" resets to 100%)
    zooms independently of the window size. Above 100% the canvas grows
    past the visible area and the window scrolls/pans natively (trackpad,
    scrollbar) to reach the rest — useful for tracing precisely. Below
    100% shrinks the whole view within the same visible area — useful if
    something (most often an AI-detected wall with a slightly out-of-range
    coordinate) is positioned outside the image bounds and would otherwise
    render off-canvas, invisible; zooming out brings it back into view so
    you can find and fix it.
15. **Undo / Redo** — the buttons in the top bar (or Ctrl/Cmd+Z, Ctrl/Cmd+
    Shift+Z) step back/forward through every change: drawing, moving,
    deleting, AI detect runs, floor add/delete/rename, even Load and Clear.
    A whole burst of rapid edits to one field (typing a label, dragging a
    number field) undoes as a single step rather than one step per
    keystroke. History resets each time you reload the page (it's separate
    from the autosave, which is what survives a refresh).
16. **Furniture palette** — click a type to drop it in the middle of the
    canvas, then drag it into place. Corner handle resizes, top handle
    rotates. The side panel also lets you type exact width/depth (cm) and
    rotation (degrees).
17. **Save** — downloads a `.json` with everything (image, walls, windows,
    doors, furniture, text labels, scale). **Load** reopens one. The tool
    also autosaves to this browser's local storage, so a refresh won't lose
    work — Save is for backups / moving between machines.
18. **Export PNG** — flattens the current view to an image, handles hidden.

## Data model (for future edits)

State lives in one JS object (`state` in `index.html`):

- `state.floors`: an array of floor objects; `state.activeFloorId` says which
  one is currently shown/edited. Each floor is fully independent:
  - `image`, `worldWidth`/`worldHeight` — the floor's background image and
    its native pixel size.
  - `walls`: line segments `{x1,y1,x2,y2,thicknessCm,type}` — position in
    **image-pixel ("world") coordinates** (wherever you traced them), but
    thickness in real-world centimetres, same convention as furniture below.
    `type` is `"wall"` (default, so old saves without the field still work)
    or `"window"` — windows are geometrically identical line segments, just
    rendered/detected differently, so they share every bit of hit-testing,
    dragging and snapping code with walls.
  - `boxes`: furniture and doors, `{x,y,wCm,dCm,rotation,...}` — position is
    in world coordinates (pinned to the image), but size is stored in
    real-world **centimetres**, converted to on-screen size via the current
    calibration. This means recalibrating later automatically resizes
    everything correctly. Doors additionally carry `hinge` (-1/+1, which end
    of the opening pivots) and `swing` (-1/+1, which way the leaf sweeps) —
    combined with `rotation` these give all 8 possible door orientations.
  - `labels`: `{x,y,text}` — optional AI-read room names/dimension text, in
    world coordinates, shown as a separate toggleable layer (never affects
    geometry or calibration).
  - `calibration`: `{metersPerWorldUnit}`, derived from the one line you drew
    on that floor.
- Saved `.json` files contain all floors at once. Older single-floor saves
  (from before floors existed) still load fine — they migrate into a single
  "Floor 1".

Everything else (rendering, hit-testing, drag/resize/rotate math) is plain
`<canvas>` 2D — no libraries.

## Ideas backlog — add as they come to mind

Nothing here is built yet; this is just a place to note ideas between
sessions so they don't get lost.

- **Clearance/gap rules** — industry-recommended minimum spacing (e.g. ~90cm
  walking clearance around a dining table, TV-to-sofa viewing distance,
  ~60cm in front of a wardrobe). Likely approach: a small lookup table of
  rules keyed by furniture-type pairs or furniture-to-wall, checked whenever
  something moves, rendered as a warning outline/measurement when violated.
- Furniture-to-wall snapping (wall/window/door snapping is now built).
- Floor area calculation from traced walls.
- Multiple rooms/floors as separate saved plans, or a floor switcher.
- ~~Pan & zoom~~ — built (zoom slider + native scroll to pan when zoomed in).
- ~~Undo/redo~~ — built (top bar buttons + Ctrl/Cmd+Z / Ctrl/Cmd+Shift+Z).
- A richer furniture catalog (actual product dimensions instead of generic
  boxes) if that ever becomes worth the effort.

## History

- 2026-08-13 — original business-scoped spec (hybrid AI detection, Next.js,
  Postgres, S3, accounts) — shelved.
- 2026-08-23 — rebuilt as this single-file personal tool: manual wall tracing
  instead of auto-detection, manual scale calibration instead of reading
  printed dimensions, local JSON/localStorage instead of a database.
- 2026-08-23 — added multiple floors (tab strip, independent image/walls/
  doors/furniture/calibration per floor, all saved in one `.json`).
- 2026-08-23 — brought back AI-assisted detection as an optional first pass
  (direct browser call to the Anthropic API with a user-supplied key,
  structured JSON output for walls/doors/a calibration hint), and gave walls
  a per-wall thickness instead of one fixed value.
- 2026-08-23 — added "split multi-floor image into tabs" (crops one combined
  listing image into per-floor tabs using AI-detected regions + labels), and
  upgraded detection to read every room's arrow-marked dimension and combine
  them into one scale calibration per floor instead of a single hint.
- 2026-08-24 — first feedback round: detection prompt now tells walls apart
  from windows and doorway gaps explicitly (don't bridge a wall across
  either); added a proper window type (traced like a wall, rendered as a
  white banded symbol, AI-detected separately, bay windows as multiple
  segments); doors now have a hinge side + swing direction so the drawn arc
  can match the real floorplan (AI reads both off the swing arc, and you can
  flip either from the selection panel); added an AI-read text layer for
  room names/dimensions, toggleable in the top bar; added a background image
  opacity slider in the top bar; added wall/window endpoint snapping to
  nearby walls/windows and door-to-wall snapping.
- 2026-08-24 — second feedback round: opacity slider now goes to 0. Added
  axis regularization (walls/windows within 4° of horizontal or vertical get
  snapped exactly onto that axis after detection, since real floorplans are
  almost always orthogonal — closes small AI coordinate errors with no extra
  API cost). Added a "High-accuracy detect (tiled)" option — splits the
  floor image into a 2x2 overlapping grid, detects each tile separately at
  full resolution, remaps and merges the results, then applies them the
  same way as a normal pass (~2x the API cost, since Claude's per-image
  token budget is capped regardless of resolution but the fixed prompt cost
  is paid per tile).
- 2026-08-24 — third feedback round, fixing issues found using the tiled
  pass: walls/windows appearing layered/duplicated was the merge logic only
  catching two tiles reporting near-*identical* extents, not two tiles each
  reporting a different-length *fragment* of the same wall (which is what
  actually happens when a wall isn't fully inside one tile's overlap band)
  — replaced endpoint-proximity dedup with proper collinear-segment merging
  that unions overlapping/near-touching fragments into one segment while
  still leaving a genuine doorway gap or a perpendicular wall alone. Also
  fixed the tiled pass picking up other floors (cellar, first floor) when
  run on a still-combined multi-level image — added a tile-specific prompt
  note to ignore a differently-labelled floor bleeding in at a tile's edge,
  and added an in-app reminder to run "Split multi-floor image into tabs"
  first, since a combined image is the real fix (the per-tile prompt note
  only helps with edge bleed, not a tile that's mostly a different floor).
- 2026-08-24 — fourth feedback round, from actually running the round-3
  fix: still-messy/wrongly-placed walls and duplicated, overlapping text.
  Root cause of the worst symptom (a dimension-calibration prompt reporting
  ~168% variance between readings) was the collinear-merge logic itself —
  applying wall-style fragment-merging to *dimension* readings, when two
  different rooms' width measurements are often drawn collinear along a
  shared wall, fused two distinct readings into one bogus span while
  keeping only one room's length. Redesigned the whole tiling pipeline
  around ownership: each tile is still *cropped* with overlap for context,
  but only *owns* (keeps) detections centred within its own exclusive,
  non-overlapping quadrant — this is now the primary de-duplication
  mechanism, structurally preventing two tiles from both reporting the same
  real-world feature, rather than trying to spot duplicates after the fact.
  Fragment-merging is now applied only to walls/windows (to stitch a wall
  truncated at a quadrant boundary back together — safe there, since two
  touching collinear wall fragments really are the same wall), never to
  dimensions (ownership filtering alone). Also added a prompt note that
  each dimension reading must come from its own arrow pair, never combined
  across adjacent rooms' arrows even when their lines look continuous
  (applies to the normal single pass too, not just tiled). Text-label
  duplication was a second bug — position-only dedup was too strict for
  labels whose estimated centre shifts near a tile edge; replaced with a
  text-content-aware dedupe (same normalized text, generous proximity)
  which doesn't risk merging two different labels that just happen to sit
  close together. Verified the redesigned pipeline with targeted tests:
  two distinct collinear dimensions both survive with correct lengths, a
  wall crossing a tile boundary stitches into one full-length wall, a
  "phantom" partial detection glimpsed by a neighbouring tile outside its
  own core is correctly discarded.
- 2026-08-24 — fifth feedback round: added a "Traced floorplan" checkbox in
  the top bar to hide walls/windows/doors/furniture (background image and
  text layer unaffected) for comparing the trace against the bare image.
  Added a zoom slider (25%–400%, "Fit" resets to 100%) — previously the
  view was always exactly fit-to-window with no way to zoom in for precise
  tracing, or to zoom out far enough to find something drawn outside the
  image bounds (which happened after an AI detect run and rendered
  literally off-canvas, invisible, with no way to scroll to it). Above
  100% the canvas grows past the visible viewport and the browser's native
  scroll pans it; below 100% the content shrinks within the same
  fixed-size viewport instead, which is what brings an out-of-bounds
  coordinate back into visible range.
- 2026-08-24 — added Undo/Redo: whole-project snapshots (undo also switches
  back to whichever floor was active at that point), covering every
  mutation — drawing, moving, deleting, AI detect runs, floor add/delete/
  rename, Load and Clear. Text/number field edits collapse a rapid burst of
  keystrokes into one undo step instead of one per keystroke. Toolbar
  buttons plus Ctrl/Cmd+Z and Ctrl/Cmd+Shift+Z (native browser undo still
  wins while a text field has focus).
- 2026-08-24 — added pixel-based automatic wall detection (see workflow
  step 7 above) after AI/manual tracing kept missing real walls on a live
  test image. Reasoning: tracing a solid black line is a mechanical
  pattern-match, not a judgment call — the right tool is deterministic
  image processing, not a vision model's coordinate guess. Threshold +
  morphological opening (separable, via a monotonic-deque sliding-window
  min/max for O(n) performance regardless of kernel size) finds thick dark
  regions; directional opening splits them into horizontal/vertical runs;
  a content-aware bridging pass reconnects a wall run interrupted by a
  window (still has faint dark content — the glazing lines) while leaving
  a genuine doorway alone (actually blank); a length filter drops
  furniture-bracket-sized leftovers. Prototyped and tuned in Python
  (numpy/scipy) against a real listing PDF first, then ported to vanilla
  JS — verified the port matches the validated prototype's output almost
  exactly (within ~2px) by feeding the same image's raw pixel data through
  both implementations directly, and separately verified the sliding-
  window min/max against a naive O(n·k) reference across several kernel
  sizes. Requires the user to pick a reference thickness from the
  *thinnest* wall they care about — this drawing's exterior walls (~35px)
  and interior partitions (~17px) needed different thresholds, and one
  tuned to the thicker walls alone silently missed every thinner one.
- 2026-08-24 — fixed a real gap found live: opening an image that fails to
  decode gave no feedback at all — no error, nothing on screen, just
  silence, because neither `new Image()` call in the file had an `onerror`
  handler. Added `onerror` (and `FileReader.onerror`) to both image-load
  paths, plus a 20s timeout in case the failure is a silent hang rather
  than an outright decode error. Root cause in the wild turned out to be a
  specific, apparently-not-rare case: a property-listing floorplan
  downloaded as `.jpg`/`.png` that's actually a PDF underneath (some sites'
  "download as image" export serves a PDF regardless of the extension you
  ask for). The tool now sniffs the file's first bytes for the PDF
  signature (`%PDF`) before attempting to load it and gives a specific,
  actionable message instead of a generic decode-failure one.
- 2026-08-24 — added "Lock wall angles when resizing" (workflow step 7
  above), on by default. Dragging an auto-detected wall's endpoint to trim
  its length was also nudging its angle off — most floor-plan walls meet
  at 90°, and once pixel-detection got the angle right the length was the
  only thing usually left to fix. The drag is now projected onto the
  segment's own existing line (captured at drag-start from the far/fixed
  endpoint) rather than following the raw cursor position; Shift or the
  checkbox bypass it for the old free-drag behaviour.
- 2026-08-24 — added the resize/move hover cursor (workflow step 8 above),
  requested alongside the angle lock for the same reason: telling resize
  and move apart *before* committing to a drag, not by finding out mid-
  drag. Reuses CSS's own directional resize-cursor keywords (the same
  ns/ew/nwse/nesw family macOS uses for window edges) — a wall/window
  endpoint's cursor is picked from the segment's actual angle rather than
  just snapping to horizontal/vertical, and a furniture corner's cursor
  accounts for the item's current rotation.
- 2026-08-24 — added pixel-based window detection, scanning along already-
  confirmed wall segments rather than the whole image (workflow step 9
  above) — this was the user's own proposed strategy ("walls are confirmed
  correct, use them as a reference for the other detected items"), taken a
  step further: rather than telling an AI detector not to move the walls
  (which it can't literally guarantee, since its coordinates are independent
  guesses), scanning along the walls' own geometry makes every window's
  position *structurally* tied to a confirmed wall — no separate guess to
  drift out of alignment. Reused the wall detector's window/blank density
  signal (already built for deciding whether to bridge a wall fragment
  across a window) but had to give it its own, much looser brightness
  threshold after the first real-image test came back with zero windows on
  a wall known to have three — window glazing bars measured ~150-190
  luminance in the actual listing image, comfortably above the wall
  detector's deliberately strict solid-black threshold (120), so reusing
  that threshold read every window as empty space. Verified end-to-end
  against the real 12 West Street image (using the wall detector's own
  output as the "confirmed" reference, matching the real workflow):
  correctly found all three windows on the kitchen/bathroom wall including
  the pier between the two kitchen windows fixed manually earlier in this
  project, at the cost of 2 false positives on the stairwell wall where a
  door's hinge/arc lines run close to it — same class of tradeoff as the
  wall detector's own known limitation, and called out the same way in the
  tool's status message.
- 2026-08-24 — investigated the stairwell false positives above properly
  rather than leaving them as an assumption: direct pixel inspection
  confirmed the wall detector had genuinely missed two real doorways there
  (merged across them into one wall), which is what fed window detection
  the arc symbols as "window-like" content. Tried a real fix — requiring a
  gap's *minimum* sub-window density to clear the bridging threshold, not
  just its average, so a short solid pier between two doors couldn't pull
  the whole span's average up past the bar — confirmed this does fix that
  specific case (and the original kitchen/dining false positive as a
  bonus), but broke legitimate window detection elsewhere: real windows
  measured 0.09-0.51 density depending on the window, and the confirmed-
  blank arc-decorated doorway measured 0.30, squarely inside that range.
  No density threshold can cleanly separate the two. Reverted to the
  validated behaviour and documented the finding directly rather than
  re-attempt more threshold tuning — this specific ambiguity needs actual
  door detection (recognising the arc symbol itself), not a better
  density cutoff. Also documented why a bay window isn't found at all: it
  sits in the gap *between* two wall segments that step outward at an
  angle, not within either one, which this scanner doesn't examine.
- 2026-08-24 — added door detection (workflow step 9, continued), following
  on from the paragraph above. First design tried finding door *positions*
  purely from structural gaps between separate wall segments (no AI needed
  for position, mirroring the window detector's approach) — tested this
  directly against the real 11-wall trace from 12 West Street's ground
  floor before writing a single line of orchestration code, and it found
  **zero** usable candidates. Root cause: `bridgeWallSegments`'s density
  check (the thing responsible for the stairwell false positives above)
  already merges almost every arc-decorated door gap back into one
  continuous wall on real drawings — genuine *unbridged* structural gaps
  are the rare exception, not the rule, so a detector that only looks for
  those misses nearly every real door. Recognising "there's a door here"
  is exactly the shape-recognition problem pixel statistics can't solve
  (per the paragraph above) — so that job now goes to a single whole-image
  AI call per floor, reporting only two points per door (hinge, leaf tip)
  rather than a rotation/hinge-side/swing-direction guess directly (the
  same "give the model the easiest possible visual task, do the geometry
  yourself" principle used everywhere else in this tool). The reported
  position is never trusted on its own though: each door gets snapped
  onto its *nearest pixel-confirmed wall* (within ~4 wall-thicknesses),
  and hinge/swing are derived from the two AI points relative to that
  wall's true angle, not any rotation the AI reported — so a rough AI
  guess still lands as an exactly axis-true door once there's a confirmed
  wall nearby, and a reported "door" nowhere near any confirmed wall is
  discarded rather than placed floating. Verified: the hinge/swing vector
  math against synthetic points on both a horizontal and a vertical wall
  (all four hinge-side/swing-direction combinations), and the full
  candidate→snap→orient pipeline against the real wall list with a
  simulated AI report for the dining/sitting door, matching the expected
  hinge/swing/rotation exactly. Existing wall/window regression tests
  (11 walls, 7 windows) unaffected.
