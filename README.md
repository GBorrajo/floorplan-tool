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

**Versions** — the (purple) tab strip above the floor tabs holds a complete,
independent copy of every floor under one named tab: trace a floorplan, then
rename its tab (double-click) to something like "ORIGINAL FLOORPLAN". Click
the ⧉ icon on any version's tab to duplicate it into a new tab (e.g.
"ORIGINAL FLOORPLAN copy") — every floor, wall, door, window and piece of
furniture is deep-copied, so editing the copy never touches the version it
came from. Switch between versions by clicking their tabs (instant, no
reload) to compare floorplan ideas side by side; "+ New version" starts a
fresh blank one instead of copying. The × on a tab deletes that version and
every floor in it (you always need at least one). Undo/redo, Save/Load and
autosave all cover every version at once, same as they already covered every
floor within one.

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
2b. **Measure distance** — next to Calibrate scale. Click-drag anywhere to
   read a distance (needs the scale calibrated first, otherwise it's flagged
   "(approx)"). Snaps onto nearby wall ends/edges by default, Shift for a
   free-form line. Stays armed for repeat measurements — useful for sizing
   a space once walls have been removed/moved. Press Escape or pick another
   tool to put it away.
3. **Draw wall** — click-drag to trace each wall segment over the image.
   New walls snap to the nearest 45° (0°/45°/90°/135°/...) by default; hold
   Shift to open the angle lock and draw freely. Endpoints separately snap
   to nearby wall/window endpoints and edges when dragged close either way
   (see Snapping below).
4. **Window** — press-drag the Window button in Structure onto a wall to
   drop one (see workflow step 8 below); renders as a window symbol (thick
   white band with dark frame/mullion lines) instead of a solid wall. Drag
   its end handle to extend it along the wall, or its amber centre handle
   to pull it outward into a bay/bow window — an even circular arc between
   its two (still wall-attached) ends, for a curved bow window or an
   approximation of an angular bay. The bow amount is stored as one signed
   number (`bowCm`); re-derived fresh from the window's endpoints every
   time it's drawn or hit-tested, so extending an already-bowed window
   keeps it bowed.
5. **Add door** — drops a door symbol you can then drag/rotate into place.
   Select it to flip which end the hinge is on and which way it swings (the
   panel shows "Flip hinge side" / "Flip swing direction" buttons), so the
   swing arc matches the real floorplan. Dragging a door snaps it onto the
   nearest wall's centreline and aligns its rotation to that wall — hold
   Shift while dragging to bypass.
6. **Snapping** — while drawing/moving a wall or window endpoint, it snaps
   (within a small pixel radius) to any nearby wall/window endpoint or onto
   another segment's edge, so adjoining walls line up without needing
   pixel-perfect dragging; failing that, a freshly-drawn wall locks to the
   nearest 45° instead. Hold Shift during a wall/window drag to open the
   angle lock and draw freely. Doors snap onto the nearest wall the same way
   (see above), so they end up at whatever angle that wall has.
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
8b. **Round dining table** — in the Dining section of the Furniture palette,
   alongside the rectangular one. Round as standard (its width and depth
   start equal, and dragging a corner handle keeps it a true circle — both
   axes follow whichever the cursor has moved further, so the circle grows
   to keep containing the cursor). Hold Shift while dragging a corner to
   stretch it into an independent oval instead — same "hold Shift to
   unlock a default constraint" convention as angle-locked walls (above)
   and 90°-snapped rotation.
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
16. **Furniture palette** — grouped by room (Living room, Dining, Kitchen,
    Bedroom, Bathroom, Office/other), covering the full house: seating and
    tables, TV unit/bookshelf/fireplace, dining chairs, kitchen
    unit/sink/cooker/fridge/dishwasher/washing machine, beds/wardrobe/chest
    of drawers/bedside table, toilet/bath/shower/bathroom sink, desk/office
    chair/radiator. Click a type to arm it as a "stamp": it rides the
    cursor, and each click on the canvas drops another copy — click the
    same button again, press Escape, or pick another tool to put it away.
    Handy for dropping several of the same item (e.g. a run of kitchen
    units) without re-arming each time; custom items go through the same
    flow. Dragging an item close to another of the *same type* snaps them
    together — edges flush when moved side-by-side (a run of kitchen
    units), or lined up on a shared edge/centre when moved into a row
    without necessarily touching (dining chairs around a table) — hold
    Shift to bypass. Corner handle resizes an existing item, top handle
    rotates it (default-snaps to the nearest 90°, hold Shift for a free
    angle). The side panel also lets you type exact width/depth (cm) and
    rotation (degrees). Each type renders as a simple top-down icon (sofa,
    dining table + chairs, beds, wardrobe, kitchen/bathroom fixtures, etc.)
    rather than a plain box, with its label wrapped onto a second line
    rather than overrunning the item's own edges (and hidden entirely once
    there isn't room for even one line). Ctrl/Cmd+C/V copies and pastes the
    selected furniture item, cascading diagonally on repeated paste.
    Placing a kitchen appliance (fridge, cooker/hob, sink, dishwasher,
    washing machine) over a kitchen unit cuts the unit back to fit — resized
    if the appliance sits at one end, split into two if it lands in the
    middle (e.g. a hob cut into the middle of an island) — rather than the
    two layering on top of each other.
17. **Save** — downloads a `.json` with everything (image, walls, windows,
    doors, furniture, text labels, scale). **Load** reopens one. The tool
    also autosaves to this browser's local storage, so a refresh won't lose
    work — Save is for backups / moving between machines.
18. **Export PNG** — flattens the current view to an image, handles hidden.
19. **Room areas** — "Areas" section in the sidebar. Automatically computed
    from the traced walls: rasterizes them at their real thickness and
    flood-fills every fully enclosed gap as a room, so it only works where
    the walls actually form a closed loop around a space — a wall that's a
    few pixels short of reaching another is bridged automatically, but a
    genuinely missing wall (or a floor that isn't fully traced yet) makes
    that space merge with its neighbour, or leak to the outside and not get
    counted at all, rather than silently guessing. A door never breaks this
    — it's drawn with a gap but never actually cut out of the wall's own
    traced line (see the boxes comment in the Data model below), so a
    doorway doesn't split a room in two. Shows each room's area (m² and
    ft²) as a label on the canvas (toggle: "Show area on each room"), plus
    a running total for the current floor and for every floor in the
    current version ("whole house"). Nothing here is saved in the project
    `.json` — it's recomputed fresh from the walls every time, so it can
    never go stale or drift from what's actually traced.

## Flooring (2026-10-08)

The right-hand **Flooring** panel is a searchable library of ~330 built-in
floors (wood planks/herringbone/chevron/parquet, laminate & vinyl, ceramic
and porcelain tile, natural stone, carpet, microcement & concrete, plus
cork/rubber/lino/outdoor). Every one is drawn by the tool itself as a
seamless texture at true size from the floor's calibration — no image files.

- **Drag** a swatch onto a room to lay it; or **click** a swatch to arm it
  and click each room in turn (click the swatch again or press Escape to
  stop). The "No flooring" swatch strips a room the same two ways.
- A "room" is exactly what the area calculator finds: a fully enclosed gap
  between traced walls. No area label on a space means it can't be floored.
- **Rooms on this floor** lists every room with its flooring; hover a row to
  highlight the room, ↻ Turn turns the lay direction 45° (double-clicking
  the room on the canvas does the same), ✕ removes it.
- **Schedule** totals m² per flooring across every floor of the current
  version, with an "order" figure that adds the wastage % you set.
- Room labels show the flooring name under the area when there's space.
- Flooring is stored per floor as `floorings: [{x,y,material,rotation}]` —
  a point inside the room plus a material id — and is copied with versions,
  saved in the .json, and covered by undo/redo.

Not done yet: real retailer products with photos (the likely next step),
and uploading your own sample photo as a swatch.

## Rugs (2026-10-08)

Furniture → **Rugs**: pick one of 40 colours, then a shape (rectangular,
square, round, runner) and click the canvas to lay it. A rug is an ordinary
furniture box (`type: "rug"` / `"ruground"`) that always draws, and is
clicked, *underneath* every other piece of furniture — enforced at draw
time (`boxesInDrawOrder`), not by array order, so it holds no matter when
the rug was added. Select a rug and pick a colour (sidebar or the selection
panel) to recolour it. Round rugs stay circular on resize; Shift = oval.

## Copy/paste between floors, and staircases with turns (2026-10-09)

**Copy/paste** (Ctrl/Cmd+C / V, or the buttons under "Copy between floors")
now covers the whole selection: any mix of walls, windows, doors and
furniture, one item or a group. Ctrl/Cmd+A selects everything on the floor.
Pasting onto a different floor lands at the same coordinates (scaled if the
two floors are calibrated differently, so real sizes are kept); a blank
floor takes on the source floor's scale. Pasting on the same floor, or
again, steps each copy 20cm. Pasted items come back selected as a group.
Doors/windows stay attached to their wall if the wall was copied too.
Flooring is not copied.

**Staircases** can turn. Select one: drag a ＋ to add a turn in that flight,
drag dots to set angle/length (15° steps; Shift = any angle), click a
turn's dot then "Make this turn curved/sharp" in the selection panel
(sharp = mitred landing, curved = winding steps), double-click a dot to
remove it. Stored on the stairs box as `path` (centreline points in cm,
box-local, bottom step to top, `curve:true` on curved turns) plus
`stairWidthCm`; a staircase with no `path` is a plain straight flight.

## Curved walls and door types (2026-10-18)

**Curved walls**: select a wall and drag the amber dot in its middle to bend
it into an arc (same mechanism as a bay window; stored as the wall's
`bowCm`). Drag it back to the line, or use "Straighten", to undo the bend.
Room areas, door cuts, door/window snapping and the length readout all
follow the curve; a door dropped on a curved wall turns to sit along it.

**Round a corner** (Structure → "◜ Round a corner"): hover where two
straight walls meet (an amber dot marks the corner — walls that overshoot or
stop just short of each other still count), click for a 1m-radius curve, or
press and drag outward to size it with a live radius readout. Both walls are
trimmed back and joined by an ordinary curved wall tangent to each, so the
result can be bent, straightened or deleted like any wall. Works at any
corner angle, not just 90°. Stays armed until Escape / another tool.

**Door types**: Door, Double doors, French doors, Sliding doors, Bifold
doors, Pocket door, Opening — each its own drag-onto-a-wall button, stored
as the door's `doorType` (missing = the original single door). A selected
door shows a handle at each end: drag either one to stretch the door to any
width (sliding doors gain a panel per ~1.5m, bifolds a leaf per ~65cm).
Change a placed door's type from the selection panel.

## Build / Flooring / Furnish modes (2026-10-21)

The sidebar works in three stages, switched at the top (remembered between
visits). Sections opt in with `data-modes="build|flooring|furnish"`.

- **Build**: image & scale, walls, doors, windows, staircase, round-a-corner,
  copy between floors, detection — and **Rooms**: every enclosed room with a
  dropdown to say what it is (or a custom name). Stored per floor as
  `roomNames: [{x,y,name}]` (same point-in-room scheme as flooring).
- **Flooring**: the flooring library (now in the left bar; the right-hand
  panel is gone).
- **Furnish**: click a room's floor and it's focused — every other room dims
  20% — and the bar lists what belongs in that kind of room first
  (ROOM_TYPES), then everything else by group. Pick an item, then click on
  the plan to place it; wall-standing things (WALL_BACKED_TYPES) dropped near
  a wall turn and sit flush against it. Kitchen units, wardrobes, shelves and
  dining chairs can also be pressed and dragged to lay a run, previewed live:
  - the drag is smoothed into straight 45° legs, so an L or U drawn by hand
    becomes an L or U run that follows the walls;
  - an end within 70cm of a wall across its path goes right up to it, and a
    drag through a wall stops at it;
  - kitchen units are 60cm each; each square corner gets an L-shaped corner
    unit (90cm arms, `kitchencorner`), and a leg closed at both ends (wall or
    corner unit) has its last unit stretched or shrunk to fit exactly;
  - dining chairs go at 60cm centres, tucked 10cm under and facing a
    rectangular table they run alongside (clipped to its edge), or facing a
    round table's centre.
  Each run is one undo step and comes back selected.
- Plain drag on empty floor is the selection box again (Shift adds to it);
  a click on empty floor focuses that room (Build / Furnish).
- Rug colours/shapes, custom items and clearance guides live in Furnish.

## View fitting and steadiness (2026-10-21)

"Fit" now fits the image *and* everything traced (walls/furniture that run
past the image's edges included — `contentBounds`/`fitView`). The view is
refitted only on load, switching floor, opening a new image, and the Fit
button. Everything else — undo/redo, paste, version switch, window resize,
the zoom slider — keeps whatever is in the middle of the view where it is
(`resizeCanvas()` with no options), instead of re-centring.

## Furniture can't go into walls (2026-10-21)

Placing or dragging furniture into a wall pushes it back out to the wall
face (door openings stay passable). Drags move in 4cm steps with the
push-out after each, so things slide along a wall and can't tunnel through
a thin partition on a fast drag. Shift while dragging bypasses it. See
pushOutOfWalls / moveClearOfWalls.

## Kitchen appliances and units (2026-10-21)

- **Under-counter appliances** — dishwasher, washing machine, tumble dryer,
  standalone oven — dropped on a kitchen unit go *under* it: the unit stays,
  records `under: <type>`, is tinted toward the appliance's colour and
  labelled e.g. "Dishwasher (under)". The appliance keeps its own 60cm
  width whatever unit it lands on: the run is re-cut so a 60cm unit sits
  over it, lined up with an existing cabinet edge (the nearest one that
  doesn't leave an offcut under 30cm), and the rest of the run is
  re-divided around it. Change or clear it from the unit's "Under the
  worktop" dropdown. Not over a unit, they stand on their own.
- **Full-height / own-worktop** items — fridge freezer, cooker, sink,
  stacked washer-dryer — replace the units they cover. A sink stays exactly
  where it's dropped along the run (only its back snaps, to the wall). For
  the others: if the units
  left on one side come to under 45cm, the appliance slides over to close
  that side up and the space goes to the other side; the plain units on
  each side are re-divided into 60cm units with one odd unit (30–90cm)
  next to the appliance; an offcut still under 30cm is absorbed into a
  corner unit it touches (its arm grows) or kept as a "Filler".
- **Moving an appliance along a run** — a sink, hob, fridge freezer or
  stacked washer-dryer dragged out of its place leaves no gap: the old slot
  is filled with a unit and that run re-divided (only if it was in a run —
  a unit on the same wall line butting against one of its sides).
- **Stacking** — a tumble dryer dropped on a washing machine (or the other
  way round) becomes one "Washer + dryer (stacked)"; it's also in the list.
- New items: Tumble dryer, Standalone oven, Washer + dryer (stacked).

## Sofas: drop, then stretch or L-shape from the ends (2026-10-21, third pass)

In Furnish, pick Sofa: the outline follows the cursor, turned to face away
from any wall within 1.5m (direction only — never pulled against it), and a
click drops a 2-seater (160cm) exactly there, then switches to Select with
it selected. A selected sofa has a handle at each end:
- **straight sofa**: drag either end along the sofa to lengthen it (never
  below 160cm); the name updates live (2, 2.5 (175+), 3 (200+), 4 (230+),
  5 seater (270+)) beside the cursor. Pull an end out into the room past
  the seat depth (+30cm) and that end becomes the return of an L-shaped
  corner sofa, its outer corner following the cursor; push back to
  straighten.
- **corner sofa**: the main body's end handle changes only the main
  length; the return's end handle changes only the return (push it back
  in to straighten the sofa).
Each drag is one undo step. Stored as a sofa box with `cornerSide` (±1) and
`sofaDepthCm`; `autoLabel` keeps the name following the size until a label
is typed.

## Autosave moved to IndexedDB (2026-10-21)

Autosave used localStorage, whose ~5MB-per-site quota a real project
outgrew (floorplan images are stored inside the project as base64, and
"New version" copies them) — every autosave then failed with
QuotaExceededError and a refresh brought back the last copy that fitted.
It now writes to IndexedDB (quota is a share of free disk). Startup reads
IndexedDB first, then any old localStorage copy (deleted after the first
successful IndexedDB save). Nothing is written until that read finishes,
and nothing is rewritten unless something changed.

## Furniture squares up to angled rooms; kitchen unit depth (2026-10-22)

- Free-standing furniture (tables, chairs, rugs...) drops square to the walls
  of the room it's in, and the rotate handle's 90° snap counts from those
  walls (`roomWallAngle`: the length-weighted dominant wall angle of the
  enclosing room). Armchairs face away from a nearby wall like sofas.
  Dragged runs snap their legs to 45° steps from the room's walls too.
- Flooring lays along the room's walls; ↻ Turn counts from there.
- Kitchen units: Depth tabs (60cm / 30cm / custom) under the Kitchen unit
  button set new units and runs; selecting placed units (one or several)
  shows the same tabs to change them, backs kept against the wall.

## Costs mode (2026-10-22)

④ Costs tracks a rough cost for structural changes — walls, windows,
doors/doorways, flooring — made since **Reset costs**:

- Reset snapshots each floor's walls, doors and floorings as
  `floor.costBaseline` and sets `version.costs.startedAt`. The change list is
  the live diff of the plan against that snapshot (`costChangesForFloor`), so
  undoing an edit un-costs it. A door or window inside a removed wall is
  folded into that wall's line.
- New version = deep copy, costs included (`cloneFloorWithNewIds` renumbers
  the baseline in step with the walls/doors). Resetting a version only
  touches its own copy. (The same renumbering now also keeps doors' and
  windows' `wallId` pointing at their wall in the copy.)
- Per-change questions (load-bearing? stud or block?) are stored on the
  element as `cost` — the baseline copy for removals.
- Unanswered load-bearing questions default by rule of thumb: exterior
  walls are load-bearing, interior aren't (shown "assumed — exterior/interior
  wall"; any answer overrides). Exterior = room on one side, outside on the
  other; rooms both sides = interior however thick; thickness (20cm+) only
  decides when there's no enclosed room either side. Doors/windows take the
  default from the wall they sit in.
- Property details (location, type, age, ceiling height, finish, VAT,
  listed, contingency %) are project-wide: `state.costSettings`.
- "Estimate costs with Claude" (claude-opus-5-5, structured output,
  optional web search for local prices, `fallbacks: "default"`) prices each
  change plus whole-job extras (engineer, Building Control, skip...);
  contingency is added locally. Prices are stored per change by a signature
  of its geometry + answers, so an edited change shows "—" until
  re-estimated, and copies keep their prices. Uses the API key from Build →
  AI Detect.

## Furniture styles (2026-11-13)

Select a piece of furniture and the side panel shows **Style**: a row of tiles, each a little 3D render of that piece in that style (at its own size), plus colour swatches for each part that can change (fabric, wood, paint, metal, worktop, bedding). Picking a style starts it in that style's own colours; picking a swatch keeps the style. Works on a multi-selection of the same kind too, and **Use on all…** copies the look to every piece of that kind on the floor (**Use on the whole kitchen** for kitchen units, sinks and integrated dishwashers).

- Families and styles live in `FURNITURE_STYLES` (sofas & armchairs, beds, dining tables, round tables, dining chairs, coffee tables, desks, desk chairs, TV units, bookshelves, wardrobes, chests/bedsides, kitchen, baths, basins, toilets, fireplaces, fridges, radiators); palettes in `FINISH_PALETTES`. Each style has a 3D builder (`v3BuildStyled`) and a `desc` used by `furnitureDescription(b)` ("forest deep-buttoned leather Chesterfield sofa") — for the AI image prompt to come.
- Stored on the box as `style` and `finishes` ({slot: hex}); missing = the family's first style in its default colours. Once a piece has a style, the plan fills it with its chosen colour instead of the category colour.
- The last style/colours picked for a type are remembered in this browser and given to the next one placed — choose a sofa look once and every sofa after it matches.
- 3D scenes now have a soft reflection environment (`v3Environment`) so steel, mirror, glass and gloss read properly.

## 3D view (2026-11-13)

**🎥 3D view** (top bar) opens a live 3D model of the floor you're on, in a panel over the plan. It updates as you edit (drag furniture and watch it move). **⤢** makes it fill the canvas; **Esc** or **✕** closes it.

- **🚶 Walk** looks through a camera at eye height (1.6m). The camera shows on the plan as a small amber camera with its view cone: drag the camera to move it, drag the amber dot to aim it. In the 3D panel: hold **Space** and drag to look around, **W A S D** / arrow keys to walk and turn, scroll to step. Saved per floor (`floor.camera`); first placed in the middle of the biggest room, square to its walls.
- **🏠 Dollhouse** looks down on the whole floor: hold **Space** and drag to spin (right-drag or Shift-drag to slide), scroll to zoom. **Walls down** cuts every wall to a stub (dark top caps) so you can see in; doors and wall cupboards hide with it.
- Built from the plan: walls at the Costs ceiling height (default 2.4m) with door openings (2.05m) and windows (sill 0.9m, head 2.1m, bays follow their curve); door leaves shown open by type (French glazed, sliding/bifold as glass panels, pocket/opening clear); each room's flooring as its real pattern; every furniture type as a simple model in real-world colours (the plan's colours are category colours). A 30cm kitchen unit is taken as a wall cupboard, hung at 1.45m. Appliances set under a unit sit under its worktop.
- three.js 0.187 is vendored in `vendor/` (loaded only when the 3D view first opens, cached for offline by `sw.js`), falling back to jsDelivr if the local file can't load (e.g. opened from a file).

## Editing in 3D (2026-11-14)

The 3D view is also an editor: without Space held, a press picks things rather than moving the camera. Its selection is the plan's own, so both stay in step and undo/redo (Cmd/Ctrl-Z) covers both.

- **Furniture:** click to pick it (blue outline and floor pad); drag to slide it across the floor with the plan's snapping (Shift-drag for none); **Q / E** turn it 45° (Shift: 15°); **Delete** removes it; **Esc** deselects (Esc again closes the view). A bar over the view repeats these, plus **▲ Up / ▼ Down** to lift it 5cm at a time.
- **Height:** the selection panel has **Height** and **Off the floor** (cm) for furniture. Empty = the model's own (shown as "… (auto)"). Height stretches the model (`box.hCm`); off the floor sets where its bottom sits (`box.elevCm`) — wall-hung TV, floating shelves, a raised bed.
- **Wall colour:** click a wall in 3D, then a swatch (in the bar over the view or the selection panel), or mix your own. **Whole room** paints every wall facing that room (`floor.paints`, seed points like flooring); **Just this wall** makes a feature wall: that face, only where it faces that room (`wall.paint = [{side, x, y, color}]`), so a long wall behind two rooms can differ in each. Whole room clears that room's feature walls; "Plain" (striped swatch) removes a colour.
- **Paint colours (`paints.js`):** Farrow & Ball (144 current + 158 Archive), Dulux (2,078), Benjamin Moore (3,589, split into its ranges: Classic, Colour Preview, Historical, Off-White, Affinity, Colour Stories, Williamsburg, Designer Classics) and Lick (79 of its 109 — the other 30 have no colour value anywhere on lick.com, only photos, so they're left out rather than guessed), plus a short Simple set. Names, numbers and on-screen hex as each brand's own site gives them (scraped Nov 2026). Grouped in families like a paint card, light to dark; search by name or number; "In this house" repeats every colour already used on the floor. On-screen colours only approximate real paint — order by name and number.
- **Ceilings:** click the ceiling in 🚶 Walk, or pick **Ceiling** next to Whole room / Just this wall. Per room (`floor.ceilings`, seed points like `floor.paints`); paint only.
- **Wallpaper (`wallpapers.js`, loaded the first time it's needed):** the picker's **🌿 Wallpaper** tab — Cole & Son, Farrow & Ball, Graham & Brown, Harlequin, House of Hackney, Morris & Co and Scion, every repeating paper on their sites (murals, borders and friezes left out). The file holds only names, codes and links to each maker's own pattern images; nothing is copied. Graham & Brown, Cole & Son and House of Hackney allow their images in a 3D view directly; the other four are fetched through images.weserv.nl (a free public image relay that adds that permission) — so if a paper shows plain beige, the relay or the maker's site is down. Shown at real size: tile width = roll width (or the maker's own usable width / one pattern repeat where given; House of Hackney's close-up crops ≈ 90cm). A wall finish is stored as a hex or `wp:<brand>:<code>` in the same places as paint.
- **Selection outline:** a thin blue frame round the picked wall face (or, for Whole room, round every face it would paint), so the colour itself stays visible.

## Kitchen islands, worktops and benches (2026-11-14)

- **3D window:** when small, drag its top bar to move it and its bottom-right corner to size it; where and how big is remembered per browser (`floorplan.view3dBox`). ⤢ still toggles full size.
- **Kitchen island** (Kitchen): free-standing, cupboards on its front (+y), and when it's 85cm deep or more the worktop runs on 30cm over the back for stools (dashed line on the plan). Takes the kitchen styles; "Use on the whole kitchen" includes it.
- **Worktop styles** (any kitchen unit, corner unit, sink, island): Stone 40mm, Slim quartz, Marble + upstand, Wooden block, Chunky concrete, Stainless steel — `box.worktop`, with the colour swatches switching to that worktop's own range. Units placed before keep their old look (oak-coloured tops as wood, others stone).
- **Bench seat / Corner bench** (Dining): back against the wall — the corner one into a room corner, back square to both walls, dropped there automatically. Near a round table the seat's front edge follows the table's curve (benchShape: the seat outline with the table's circle, less ~8cm of overhang, taken out; round a table the seat may run up to 72cm from the wall so the curve carries round the corner). Move the table and the bench re-shapes. Styles: Upholstered, Panelled (tongue and groove), Timber.

## Wide view, placing in 3D, cooking, doors and windows (2026-11-14)

- **Field of view:** the walk view starts at 100° across, 60°–120° — pinch on a trackpad (or the ↔ slider in the 3D bar); saved with the floor's camera (`camera.fovDeg`). An ordinary camera: a curved wide-angle (Pannini) version was tried and dropped — it looked like a fisheye. Two-finger scroll in the walk view steps gently.
- **Doors and windows in 3D:** click one to select it (glass and all); the sidebar jumps to its Style options and the bar over the view has 🎨 Style / 🗑 / ✕. Any mode — no need to go back to Build.
- **Deselect:** ✕ Deselect at the top of the selection panel, ✕ on the bar over the 3D view (and on the paint picker), or Esc. Picking something new scrolls the sidebar to its options.
- **Placing in 3D:** pick an item in the Furnish list and the 3D view shows a see-through ghost under the pointer — click to place it (against the nearest wall, into a corner, square to the room, just as on the plan); for run items (kitchen units, wall cupboards, wardrobes, shelves, chairs) press and drag along the walls to lay a run. Or drag an item straight out of the list and drop it in the 3D view (or on the plan). Esc puts the item down.
- **Kitchen:** Wall cupboard (hung at 1.45m, laid in runs like base units, dashed on the plan), Tall unit (larder, oven + microwave tower, double oven tower, integrated fridge freezer — picked in the selection panel), Hob (gas, induction, ceramic, gas with wok burner — dropped on a unit it goes into that unit's worktop, `unit.hob`, so the oven can be underneath or somewhere else), Built-in oven (dropped on a unit it goes under the worktop like a dishwasher), Range cooker / AGA (range, AGA, professional; enamel colours). Hobs also go on islands and corner units.
- **Doors** (any door type, in the Style panel): Flush, Victorian 4-panel, Georgian 6-panel, Shaker, Ledged & braced, Half-glazed, Fully glazed, Georgian glazed, Crittall, Slim aluminium, Front door (composite). Colours for door, frame and handle (painted or natural timber); glass for the glazed ones (clear, frosted, reeded, tinted, stained); frame: square, Victorian moulded, chunky or none, with a lining round the opening. Existing French doors start glazed, sliding/bifold slim aluminium, the rest flush.
- **Windows:** Casement, Georgian sash, Victorian sash, Crittall, Picture, Leaded cottage; frame colour (the sill board follows it) and glass. A bay's pattern is laid out round its whole curve.
- **Windows replace the wall they sit in** (`wallCutters`): like a door, a window cuts its stretch out of the wall in the plan, in 3D and for furniture, and the room's outline (area, flooring, paint, ceiling) runs out to the window's own line — so bending a window into a bay takes the wall with it and the bay becomes part of the room. A wall that was bent to follow a bay by hand is cut the same way (it can be straightened again).

## Island appliances, fridges, cupboard heights, stairs, outside walls (2026-11-14)
- **Appliances in an island**: drop a sink, hob, cooker, dishwasher, built-in oven, washing machine, dryer or under-counter fridge/freezer onto an island and it's fitted into one of its ~60cm cupboard bays (`fitIntoIsland`): sink and hob in the worktop (`island.sinkX` / `hobX`, cm from its middle), the rest behind that bay's door (`island.fit = [{type, x}]`); a cooker becomes a hob with an oven under it. The selection panel lists what's fitted, with ◀ ▶ to move each one a cupboard along and ✕ to take it out. Drawn on the plan too.
- **Fridges**: "Integrated fridge freezer" in the palette is a tall unit (`tall: "fridge"`); the tall-unit menu also has 50/50, tall fridge, tall freezer and fridge-under-oven. "Under-counter fridge" / "Under-counter freezer" go under a unit's worktop like a dishwasher (or stand as their own unit).
- **Wall cupboards and tall units**: their own height fields — bottom, and a top that's a set height, up to the ceiling, or a gap short of it (`wuBottomCm`, `wuTop`, `wuHCm`, `wuGapCm`; see `wallUnitSpan`). "Line up all wall cupboards & tall units like this" copies the top line to every one on the floor.
- **Snapping** (`snapAlongRun`): kitchen pieces snap in their own frame to any kitchen neighbour facing the same way on the same wall line — a wall cupboard butts up to a tall unit or fridge freezer, on a wall at any angle — and something high dropped on another high thing slides off to the nearer side. Used when placing, dragging on the plan and dragging in 3D.
- **Windows**: bottom and top heights (`sillCm`, `headCm`; 0 at the bottom = down to the floor), in the panel or with the Top/Bottom ▲▼ buttons on the 3D bar.
- **Front doors**: Victorian, Georgian, Edwardian, cottage, stable, contemporary and grooved-oak styles join the door catalogue.
- **Staircases** have styles (Classic, Victorian, Cottage, Open oak, Oak & glass, Floating, Industrial), a carpet runner or full carpet, and for each side going up a banister, a wall rail or nothing (`railL`/`railR`; "Auto" picks a wall rail where a wall runs alongside). Treads follow the turns: winders round a curve, a flat landing at a sharp corner.
- **Outside of the house**: brick (several), render, pebbledash, stone, flint, weatherboard, cedar and tile hanging, drawn as real-size textures (`EXTERIOR_FINISHES`). Set the whole outside of a floor in Build → "Outside of the house" (`floor.exterior`), or click an outside face in 3D for "Whole outside" / "Just this wall", with paint as the other option.

## Whole house: floors stacked in 3D (2026-11-14)

- **Floor order:** the floor tabs run bottom to top, and the first tab is the ground floor. Build → **Floors of the house** lists them top first. ▲▼ reorders them, and each floor can have its own room height (left blank, it uses the Costs ceiling height). Floors are spaced by room height + 25cm of floor structure (`FLOOR_DEPTH_M`).
- **Where each floor sits:** each floor was traced from its own image at its own scale, so `floor.stack = {x, z, rot}` places its plan (in metres) in one shared house frame. Because that frame is absolute, reordering or deleting floors never moves the others.
  - A floor without a stack is lined up on the one below it the first time it's needed (`autoStackFloor`). It tries lining up the outlines' edges and centres, then nudges in finer steps to put as much wall as possible on walls below, with outside walls counting double.
  - "🧲 Line up on the floor below" re-runs that and reports how much of the outside wall landed. "✥ Line up by hand" lets you drag the plan, or use the arrow keys (Shift for 1cm). There's also a ⟳ 90° turn.
- **Matching sizes:** floors calibrated at different spots come out slightly different sizes.
  - "🧲 Line up & match size" also tries sizes within ±10%, in 1% steps and then finer. It keeps a new size only if the walls fit clearly better. It corrects the floor's calibration (walls, doors and windows scale together; furniture keeps its real size, since it's stored in cm). A final sharp pass measures to the real wall lines rather than a grid, and lands within about 1mm in tests. It takes about a second.
  - "📐 Match two corners": click a corner of this floor, then the same corner on the blue floor below, and repeat for a second corner. That sets size, turn and position exactly. Clicks snap to wall ends nearby.
  - "⇥ Snap walls onto the floor below" slides each outside wall of this floor onto a parallel wall below it (within 3° and 30cm), so the outside faces are flush even if the walls differ in thickness. If walls are selected, it snaps only those. Walls that meet a snapped wall, at a corner or a T, slide their end along their own line so they still meet. Doors, windows and wall-backed furniture on it move with it (`moveWallSideways`).
- **Ghost of the floor below:** the plan shows the floor below faintly in blue (walls, windows, and stairs with an arrow up the flight). Toggle it with "Show the floor below".
- **3D:**
  - 🏘 **Whole house** builds every floor. The scene stays in the active floor's own frame, so picking, dragging and placing work as before, and other floors get a relative matrix (`v3RelMatrix`).
  - In the dollhouse, floors above the active one lift off unless "⬆ Show floors above" is on. Walk mode shows them all.
  - ▼▲ steps between floors, and clicking another floor switches to it, keeping the camera on the same spot.
  - Walls run up through the floor depth to meet the floor above. A lower floor's ceiling shows as the flat top of any single-storey part.
- **Outside finish carries up:** a floor without its own outside finish uses the one below (`floorExterior`).
- **Saving:** `exterior` (and `stack` and `roomHM`) are now kept by `normalizeFloor`. Before this, the outside finish was lost on reload.
- **Fix:** where an inside wall meets an outside wall, the outside finish no longer creeps a few centimetres onto the inside face.
- **One staircase between floors (stage 2):** in Whole house, a staircase going up from a floor with the next floor in the scene climbs room height + floor depth and lands on that floor. Its rise per step comes from its tread count as before.
  - It opens a stairwell in the floor above, covering the stretch of the flight from where headroom under that floor drops below 2m (`stairWellStart`) to the top. The opening is cut out of the upper floor's texture and the lower floor's ceiling texture (`v3CutHoles`).
  - The opening's edge is lined in ceiling white, and a landing banister in the stair's own style runs along each side set to banister and across the low end, leaving the top open (`v3StairWell`).
  - On the upstairs plan the stairwell shows hatched, with "stairwell" written in it, even when the ghost of the floor below is off (`drawStairWells`).
  - A staircase also drawn on the upper floor (plans often show it "down") that sits over one coming up from below counts as the same staircase, and isn't built in 3D (`isStairTopFromBelow`).
  - Walking about, every floor in the house gets its ceiling, so looking up the stairwell shows the floor above.
- **Walking up the stairs:** in walk mode your eye follows a staircase's slope (`v3StairLift`, using the same `stairProfile` the 3D stairs are built from), easing from the floor at the foot to the full height at the top.
  - In Whole house, stepping off the top step (or striding past it) moves you onto the floor above at the same spot and facing the same way, and the plan switches floor with you. Walking well into a stairwell from above takes you back down (`v3StairHop`).
  - The switch up happens within 5cm of the top and the switch down more than 15cm in, so you can't flicker between floors at the edge.
  - With no floor above in the scene, the climb stops short of the ceiling.
- **Next:** loft rooms inside the roof, chimneys, and gutters.

## Roofs (2026-11-14)

- **Where roofs live:** each floor can carry a roof (`floor.roof`) sitting on its wall tops: the top floor's main roof, or a lower floor's roof over whatever sticks out beyond the floor above.
- **Sections (wings):** a roof is made of rectangular sections, each with its own spine: `{cx, cy, lenCm, widCm, rot, ridge 0..1, riseCm, ends [gable|hip|half, …], flat}`.
  - `roofWingModel` turns a section into planes, and the surface is the lowest plane at each point: a slope each side of the spine, a hip at each hipped end (a half-hip starts at 60% of the height), and a flat cap at the spine height.
  - Moving the spine off-centre gives uneven pitches with level eaves. At an edge it becomes a single slope, with a high wall on that side.
  - `roofWingFacets` clips the rectangle by the planes into exact faces, which both the plan drawing and the 3D use.
  - Sections overlap freely, and the 3D shows the highest at each point, so an L or T roof gets valleys where its sections meet.
- **Building from the house shape:** `autoRoofWings` grids the floor's footprint square to the house (10cm cells, rooms grown out to the wall faces) and takes the biggest rectangles first. Each becomes a 40° gabled section with its spine along its length.
  - A later section that runs into an earlier one is carried on to that one's spine, with a slightly lower ridge.
  - On a floor with another above it, only the parts outside the floor above get a roof: a 15° single slope rising to the house wall, capped to stay under the upstairs window sills.
- **3D:**
  - Gables and high sides are in the floor's outside finish. Eaves get a white fascia and soffit, with a 30cm overhang that you can change.
  - Roofs show in walk mode, and in the dollhouse when "⌂ Roof on" is set or while you're editing the roof.
  - Walls only run up through the floor depth where the floor above actually sits on them, so they no longer poke through a single-storey roof.
- **Coverings:** Welsh, dark and green slate; clay plain tiles (red, brindle); pantiles (red, black glazed); concrete tiles (brown, grey); cedar shingles; standing seam (zinc, anthracite); thatch. Flat roofs: felt, rubber (EPDM), fibreglass, lead, sedum, gravel. All are drawn procedurally at real size (`drawRoofCover`).
- **Editing (Build → Roof):**
  - Presets for the whole roof or one section: Gabled, Hipped, Half-hipped, Single slope, Flat.
  - You can set the spine height (pitches shown), spine position (slider, or drag the amber spine on the plan; it snaps to the middle and the edges), each end's style (or click the round end markers), length and width (or drag the square handles), move, turn 90°, "＋ Add a turn" (a section at right angles off the end), delete, rebuild from the house shape, and remove.
- **Roof windows:** small, medium and large centre-pivot roof windows; conservation rooflight; flat rooflight; dome; roof lantern; gable, hipped and box dormers.
  - Each sits on whichever section is highest under it, square to that slope.
  - Dormers face down the slope, are buried at the back and shrink to stay under the ridge.
  - Pick one in the panel, click the roof to place it, then drag it. Delete removes it.

## Fixes from the real plan: brick indoors, floor joins, roof turns and bays (2026-11-15)

- **Brick showing indoors:** a wall slab's ends and top used to take the +1 side's finish, so an outside wall could show brick on a window or door reveal, or at a corner, from inside. `v3Slab` now takes separate end and top materials. A reveal gets the room side's finish. A corner end gets the finish of the side the corner sticks out on: the outside round the house, or the room where the house steps in. The strip through the floor's depth is outside finish all round.
- **Which side is a room:** the sample point in front of a face could land inside another wall at a corner or T, or in the rounded-off corner of a room's outline, and get read as outside. `sideRoom` in `v3BuildStructure` looks along the face past the other wall (`pointInWallOf`), then a little further out from the face, before calling it outside.
- **Corners:** `wallEndExtM` works out how far each piece runs past its end. At a right angle that's half the other wall's thickness, as before. At a bay's shallow turn it's less, so the inside face no longer pokes out through the corner. Running straight on into a window it's nothing, and into the side of another wall (a T) it's nothing.
- **Gaps between floors:** the strip through the floor depth now also counts as under the floor above where the point lands in one of that floor's walls, not only in a room. Separately traced floors' outside walls rarely sit exactly on each other.
- **Auto-roof:** after the main section, small parts count (0.5m across and 1m² is enough), so a shallow L-turn or a bay gets roofed. A part built onto an earlier section along one side gets its spine at right angles to it, a cross gable carried on into the main roof, whichever way is longer. A lower floor has no main roof, so its bays and porches aren't held to the main roof's size threshold. Lean-tos up to 4m long are hipped round their ends at 30°.
- **Adding a section by hand:** "＋ Add another section" in the roof panel is always there once a floor has a roof. It drops a section in the middle of the view. On a floor the one above covers, "Add a roof section by hand" now makes a small hipped lean-to where you're looking, not an 8m roof over the whole floor.
- Tested on a synthetic two-floor house (slight L, splayed bay, side window, upstairs traced 6cm off) on localhost, not on the user's real plan.
- **Curved bay windows get a lead top** (`bayCapOutlines`, `v3BuildBayCaps`). A bowed window (`type: "window"` with `bowCm`) that bulges out of the house with no floor above it gets a thin flat lead roof on its wall tops. It runs from 5cm past the curve's outside face back to its chord, tucked into the main wall. The roof's rectangular sections can't follow the curve, and a 50cm-deep bay is under their size threshold anyway. It's drawn whenever roofs are, whether or not the floor has a roof of its own. A checkbox in the roof panel ("Lead tops on curved bay windows") turns it off per floor (`floor.bayCaps = false`). Bowed *walls* (rounded corners) don't get one.
- **Under the floor above, a curved bay's mouth is bridged:** a straight strip of outside brickwork along the bay's chord, through the floor's depth, carries the wall above. Before, there was a gap over the bay's lead top. The bay's own curved pieces no longer get a floor-depth strip, which used to leave brick stubs standing on its ends.
- **Gables sit on the wall line:** the brick carried up at a gable, or at a lean-to's high side, stands on the section's own edge (`±L/2`, `±W/2`), not out at the verge. Only the tiles overhang, with a 12cm bargeboard in the trim colour along their edge.
- **An L-turn's carried-on part is cut back** (`w.joins`, `roofWingRegions`, `roofWingPieces`). `autoRoofWings` records where a section meets the wall of the one it runs into. Beyond that point, its roof, edges and soffit only appear inside the other section's rectangle: out to that one's eaves, but only to its walls at a gable. Before, its eaves overhang ran on past the main roof's gable as a strip of roof and a white soffit. Existing roofs need "Rebuild from the house shape" to pick this up. Moving a section moves its join points with it; turning it 90° drops them.
- A wall's end where it meets a window counts as the window's jamb at a shallow turn (`reveal` in `wallEndExtM`, turn under 60°; a square corner beside a window is still the corner's outside face), so it takes the room's finish. Before, looking through a curved bay's glass showed brick on its sides.

## Installable app and updates (2026-10-24)

Served over https (GitHub Pages), the planner installs as an app from Edge
or Chrome (address-bar Install icon, or ⋯ → Apps → Install this site as an
app): desktop/Start-menu icon, own window, works offline.

- `manifest.webmanifest` + `icons/` — name and icons for the installed app.
- `sw.js` — network-first cache: online, it always opens the latest
  published version; offline, the cached copy.
- While open, the page re-checks `index.html` (on returning to the window,
  and every 30 minutes) and if it has changed shows "A new version of the
  planner is ready — Reload now / Later"; Reload saves first.
- Publishing an update = commit and push; nothing to bump.
- Plans stay in each person's browser (IndexedDB for that web address) —
  Save/Load .json to back up or share. Opening `index.html` directly as a
  file still works as before (no offline/update parts).

## Data model (for future edits)

State lives in one JS object (`state` in `index.html`):

- `state.versions`: an array of version objects (see Versions above);
  `state.activeVersionId` says which one is currently shown/edited. Every
  floor-scoped function/field below is reached through the active version
  (`activeVersion().floors`), never off `state` directly.
- Each version is `{id, name, floors, activeFloorId}` — `floors` is the
  array of floor objects described below, `activeFloorId` says which of
  *that version's own* floors is currently shown/edited. Duplicating a
  version (`cloneVersion`/`cloneFloorWithNewIds`) deep-copies every floor,
  wall, box and label with a fresh id each, so the copy can never alias the
  original's objects.
- Each floor is fully independent:
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
- Saved `.json` files contain all versions (and every version's floors) at
  once. Older saves from before versions existed still load fine — a
  pre-versions multi-floor save migrates into a single "Version 1"; an
  even older single-floor save migrates into "Version 1" → "Floor 1".

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
- 2026-08-25 — first real-world run of door detection (12 West Street),
  and the user reported doors placed/angled wrong near the narrow
  stairwell/hallway, plus windows still appearing on the interior doorway
  walls into the dining/sitting rooms. Two real fixes, not just
  more-of-the-same threshold tuning:
  - **Door snap bug.** `runDoorDetect` was snapping each door onto its
    nearest confirmed wall using the *midpoint* between the AI-reported
    hinge and leaf-tip points, not the hinge point itself. The hinge is
    defined to sit on the wall; the tip sits a full door-width away, in
    whichever direction the door swings. In a wide room that offset is
    harmless, but in a narrow corridor (like this house's stairwell) it's
    large enough relative to the corridor width to pull the snap target
    closer to the *opposite* wall than the one the door is actually in —
    and since both position **and** rotation/swing are derived from
    whichever wall gets picked, a wrong wall means both come out wrong
    together. That's exactly the failure the user saw. Fixed by snapping
    on the hinge point directly. Reproduced the bug and confirmed the fix
    with a standalone test (60px-wide two-wall corridor, 80cm door: old
    midpoint math picked the far wall, hinge-point math picks the near
    one correctly).
  - **Window/door overlap suppression.** The stairwell-wall false-positive
    class documented above (a door's swing-arc ink reading as
    window-glazing density) was previously just accepted as a known
    limitation. Now that door positions are independently known, pixel
    window detection filters out any window span that overlaps an
    already-known door's footprint along the same wall
    (`doorSpansOnWall`/`spansOverlap` in `scanWallForWindowSpans`) —
    turning an accepted limitation into an actual fix. Verified with a
    standalone test: two window-like density bands on a wall, one
    overlapping a door's position — only the non-overlapping one survives
    once the door is passed in. Practical implication: run "Auto-detect
    doors" *before* pixel window detection (or trace doors manually
    first) so this filter has something to check against.
  - **Corner/T-junction snap bug**, found after retesting the fixes above —
    doors were *still* inconsistent. Asked whether inconsistent
    wall-tracing-over-doorway-gaps was the cause; checked `readImageDataUrl`
    and confirmed the AI door-detect call reads the raw source image
    directly, never the traced overlay, so that wasn't it. The real second
    cause: `nearestWallPointAndAngle` picked whichever wall's *clamped*
    segment (capped at its own endpoints) was Euclidean-nearest. A real
    doorway is very often right next to a corner or T-junction — so a hinge
    point sitting just past its own wall's endpoint (into the doorway gap)
    could end up numerically closer to a totally different, perpendicular
    wall's endpoint than to the correct wall's own clamped point, even
    though the hinge sits almost exactly ON the correct wall's line. Wrong
    wall picked → wrong angle (90° off in the T-junction case). Fixed by
    scoring a wall on perpendicular distance to its own *line*, extended a
    little past its endpoints (enough to cover a doorway-sized gap), before
    falling back to plain nearest-clamped-point distance for genuinely
    off-axis points. Verified with the exact failure scenario (a doorway
    gap next to a T-junction: old code picked the perpendicular wall at
    distance 10 over the correct wall's clamped distance of 15; new code
    correctly picks the correct wall via its 3px perpendicular offset) plus
    a sanity check that a point genuinely on the perpendicular wall still
    picks that wall, and the original narrow-corridor regression test from
    the fix above.
  - **Hinge-side calculation was structurally broken — found by replaying
    real ground-truth data through the pipeline, not by inspection.**
    Retested the two fixes above against 12 West Street's real confirmed
    wall list and its 4 manually-verified doors (reconstructing each
    door's true hinge/tip points and feeding them through the actual
    pipeline code). The T-junction fix genuinely mattered on real data —
    the front-entrance door snapped to the wrong wall under the old logic,
    correctly onto the right one after the fix, confirmed against the
    source image. But investigating that door's numbers further exposed a
    third, more fundamental bug: `deriveDoorOrientation` computed hinge
    side from `hingeWorld − snappedPoint`, where `snappedPoint` is the
    wall-projection of the hinge itself — and a point minus its own
    perpendicular projection onto a line is, by definition, always
    perpendicular to that line. So the "along the wall" component this was
    testing is mathematically ~0 in the ordinary case (hinge safely inside
    a wall segment, not near a clamped corner), and the sign comparison
    silently defaults to the same side almost every time. Confirmed
    directly: fed two mirror-image doors (one truly hinged left, one truly
    hinged right) through the function and both came back `hinge: 1`.
    Compounding it, the new door's stored position was set directly to
    that same hinge point, while the renderer expects the stored position
    to be the *center* of the opening (hinge offset half a door-width away
    from it) — so every AI-detected door was landing roughly half a
    door-width off from its true position, in whichever direction the
    (effectively arbitrary) hinge side happened to land. This is very
    likely the real, unified explanation for "sometimes placement looks
    off, sometimes swing looks wrong" — one root cause, two visible
    symptoms.
  - **Fix, user-chosen over asking the AI for a third point:** determine
    which side of the hinge the opening actually extends toward via pixel
    density, the same way window detection already works — scan a
    doorway-width band along the wall on each side of the hinge using the
    strict wall-fill dark mask; the genuinely open side reads far more
    blank than the still-solid wall on the other side
    (`wallOpeningDirection`). `deriveDoorOrientation` now takes that
    resolved direction directly instead of computing (and getting wrong)
    a hinge sign itself, and derives the door's true center from it
    (`hingeWorld − hinge·halfWidth·direction`) rather than storing the
    hinge point as if it were the center. `runDoorDetect` now loads the
    floor image's pixel data (previously only ever sent to the AI, never
    read locally) to run this scan. Verified with a synthetic mirrored
    pair (confirms hinge sign and center are now correctly distinguished,
    where before both cases came back identical) and, more importantly,
    replayed against door 32's exact real image pixels from 12 West
    Street: `wallOpeningDirection` + `deriveDoorOrientation` reproduce
    hinge=-1, swing=-1, center=(480, 1855) — an exact match to the
    manually-verified ground truth, computed from real pixels rather than
    a synthetic mask. Full existing regression set (corridor snap,
    T-junction snap, window/door overlap suppression) still passes
    alongside it (11/11).
  - **`temperature: 0` attempt reverted for Opus 5/Sonnet 5 — no sampling
    control exists on those models at all.** The API rejected it outright:
    "`temperature` is deprecated for this model." Checked properly (not
    assumed): temperature/top_p/top_k are removed entirely on Claude Opus 5
    and Sonnet 5 — a 400 on any value, not just non-default ones — so
    there is no user-facing sampling knob to reduce variance with on either
    model. Still applied for Haiku 4.5 (the one model of the three where
    it's actually allowed), gated the same way `effort` already is for the
    other two. Practical implication: the user tested door detection 3
    times on Opus 5 (the most capable of the three, and the one being
    used) *before* this attempted fix and saw meaningfully different
    placement/swing each run — with no sampling lever available on that
    model to address it via request parameters, that variance most likely
    reflects genuine visual ambiguity in how the model reads this specific
    symbol (a dashed quarter-circle arc against wall/text clutter), not a
    fixable API setting. Given the geometry pipeline has now been verified
    deterministic and correct three separate ways (synthetic corridor/
    T-junction cases, a synthetic mirrored hinge/opening pair, and a replay
    against door 32's actual real image pixels), this closes off the
    "make the AI reading more consistent" avenue — the deterministic
    pixel-based arc/line shape-matching approach discussed earlier is now
    the strongest remaining path forward for doors, not just an
    alternative worth considering.

## Pixel-based door detection (replaces AI for door position/hinge/swing)

Ported from a validated Python prototype after AI-based door reading proved
fundamentally inconsistent in practice (see the temperature investigation
above — re-running detection on an unchanged image gave different
placement/swing each time, even on Opus 5, with no sampling control
available on that model to fix it at all).

**What was tried and discarded first:** a generic whole-image Hough-circle
search (OpenCV `HoughCircles`). It missed real, clearly-visible door arcs
entirely (door 32's arc — obvious to the eye — didn't even survive the
initial raw candidate list) while matching furniture icons and bath/sink
fixtures as "circles" instead. Blind shape search over the whole image
isn't the right tool for a *partial* (quarter-circle) arc.

**What works:** exact template matching. Since every wall's line and angle
is already known from wall detection/tracing, generate the *exact* shape
`drawDoorSymbol` itself draws — a quarter-arc + straight leaf line,
centered at a candidate hinge point on the wall — for every plausible
position/radius/orientation along that wall, and score how much real ink
in the source image lies along that specific template. This is a matched
filter anchored to known geometry, not a generic shape search.

One real bug caught mid-prototype, worth keeping documented: the first
version of the scorer rated a stretch of plain solid wall as a perfect
match, because "is there ink at every sample point" is trivially true when
the whole swept area is solid black fill. Fixed by also requiring the
*interior* of the swept quarter-sector to be mostly blank (real open
floor), not solid — reusing the same blank-density philosophy already
used for wall/window/doorway-gap detection elsewhere in this project
(`DOOR_ARC_INTERIOR_DENSITY_MAX`).

**Ported functions** (`index.html`): `scoreDoorTemplate` (the matched-filter
score for one hinge/radius/orientation candidate), `detectDoorsFromWalls`
(sweeps every confirmed wall, keeps the best-scoring orientation at each
position, then non-max-suppresses nearby duplicates before applying the
`DOOR_ARC_MIN_SCORE` acceptance threshold), `runPixelDoorDetect` (the
button handler — loads the floor image's pixels, runs detection, creates
door boxes the same way the AI path did, same status-message pattern as
wall/window pixel detection).

**Verified against real data before and after porting**, not just code
review: the Python prototype was checked against the real 12 West Street
ground floor and its known ground-truth doors (door 32 matched almost
exactly — hinge side and swing direction both correct, position within
~11px). After porting to JS, re-ran the *exact same real image* through
the ported function and confirmed: (1) it reproduces materially the same
candidates as the Python prototype (same walls, same hinge/swing signs,
comparable positions/scores), (2) running it twice on identical input
gives byte-identical results (the entire point — no AI call, no sampling,
nothing left to vary), and (3) the full `runPixelDoorDetect` wrapper
(image load → detection → door box creation → status message) works
end-to-end, not just the inner scoring function.

**UI change:** the AI-based door detector is kept (relabeled "AI, less
consistent") for comparison, but the pixel-based detector is now the
recommended button, moved into the deterministic "Auto-detect
(pixel-based)" section alongside wall/window detection. Constants worth
knowing about if results need tuning on a different property:
`DOOR_ARC_MIN_SCORE` (0.68 — acceptance threshold; testing showed scores
above ~0.7 were clean, 0.55–0.7 was a mix of real doors and noise, so this
sits just above that mixed band), `DOOR_ARC_MIN_WIDTH_CM`/`MAX_WIDTH_CM`
(45–110cm plausible door width range), `DOOR_ARC_DARK_THRESHOLD` (160,
looser than the wall detector's 120 since arc/leaf lines are thin and
anti-aliased, not solid fill).

**Known limitation, same class as wall/window detection's:** this depends
on confirmed walls being correct where the door actually sits, and on the
plan actually drawing the arc/leaf swing symbol — a plan showing only a
blank gap with no swing symbol won't be found this way (that was the
original, less successful design covered earlier in this file).

## Debugging session (2026-08-25): pixel door detect found nothing on a real floor

User reported the new pixel-based door detector produced zero results on a
real floor, with no visible error — worked through this methodically since
"silently does nothing" could mean many things:

1. Verified the script itself loads and the button is correctly wired
   (headless jsdom load, then a simulated real click) — both clean, no
   errors, ruling out a code/wiring bug outright.
2. Had the user call `runPixelDoorDetect()` directly from the Safari
   console with an explicit `.catch()` — printed "DONE OK", proving the
   function completes successfully with zero doors found, not a silent
   crash.
3. Had the user run a diagnostic sweep (same logic as `detectDoorsFromWalls`
   but printing top-scoring candidates regardless of threshold) — found
   real signal clustered on two walls, just scoring 0.41-0.66, under the
   0.68 acceptance threshold. Genuine near-misses, not random noise (score
   clustering by wall/position is what real signal looks like).
4. Had the user export the actual project JSON and pulled it in directly.
   Root cause, found by inspecting the data rather than guessing further:
   **the floor's `calibration` was `null` — never calibrated.**
   `metersPerWorldUnit()` falls back to "assume the image spans about 10m
   across" when uncalibrated; for this real terrace house (~4.4m wide),
   that fallback was off by >2x. Wall/window detection are unaffected by
   this because they measure thickness in pixels and convert back through
   the SAME (wrong) scale, so the error cancels out in the round-trip.
   Door width has no such round-trip — `DOOR_ARC_MIN/MAX_WIDTH_CM` are
   fixed real-world facts converted through calibration in one direction
   only, so the bad fallback went straight into the search radius
   (19.9-48.6px instead of the ~46-112px real door symbols need) with
   nothing to cancel it out.

**Fixed two ways:**
- `runPixelDoorDetect` now checks `floor.calibration` up front and blocks
  with a clear explanatory alert if missing, instead of silently searching
  at the wrong pixel scale and reporting "0 doors" with no clue why.
- Verified the underlying detector actually works correctly once
  calibrated: pulled the user's real image + wall list, estimated the
  correct calibration from the printed room dimensions (dining room's
  labeled 3.05m depth against its measured pixel span), and re-ran
  detection — found real doors (score 0.70-0.84) in the same
  wall/position clusters the earlier under-threshold diagnostic had
  already flagged as likely real. This is a second real data point (a
  differently-scaled export of the same 12 West Street image) confirming
  the detector generalizes, not just overfit to the original file it was
  built against.

## Calibrating after detection made walls render "super chunky" (2026-08-25)

Root cause: wall thickness (and pixel/AI-door-detected door width) is
stored as a real-world cm value, but for anything from the pixel
detectors it's *derived from a pixel measurement* via `worldToCm()` at
detection time — not an independent fact. The user's floor had walls
pixel-detected *before* ever calibrating (using the ~10m fallback guess,
same session as the earlier door-detection debugging above), then
calibrated properly afterwards. The already-stored `thicknessCm` values
didn't change, but rendering re-interprets them through the *new*,
correct (much smaller) scale — so a wall whose real pixel thickness was
~25px, previously described as "56.56cm" under the inflated fallback
scale, now rendered at `cmToWorld(56.56cm)` under the *correct* scale =
~57px on screen. Walls got thicker, not thinner, because the old fallback
scale was itself inflated relative to reality for this house.

**Fixed:** `rescaleWallAndDoorSizesForCalibration(floor, oldMpwu, newMpwu)`
— called right before the manual "📏 Calibrate scale" tool overwrites
`floor.calibration`, using the scale that was in effect a moment
earlier. Rescales walls'/windows' `thicknessCm` and doors' `wCm` by
`newMpwu/oldMpwu`, which maps back to the same on-screen pixel size those
values actually measured, not the (now-wrong) cm number they happened to
produce under the old scale. Deliberately does NOT touch furniture sizes
(a real-world catalog fact — a sofa really is ~200cm regardless of scale)
or door `dCm` (always a fixed constant, never pixel-derived). Verified:
a wall's inflated 56.56cm shrinks to a plausible ~24.7cm, a door's
inflated 172cm shrinks to a plausible ~75.3cm, furniture is untouched,
and it's a no-op when the scale doesn't actually change. Also added
`pushUndoSnapshot`/`render`/`scheduleAutosave` calls to the calibrate
handler, which it was missing even before this fix (calibrating alone
used to change nothing visible, so their absence was never noticed).

**Known related gap, not fixed this round:** the *AI*-detect calibration
path (`applyDetection`, when Claude reads printed room dimensions) can
have the same staleness within a single detection call — AI-reported
wall thickness is a genuine real-world reading (fine, no rescale needed),
but AI-detected *door width* is pixel-derived (hinge-to-tip distance
converted via `worldToCm`) and calibration gets applied to the floor
*after* those doors are created in the same function — so a first-ever
detection run that reads both dimensions and doors together could produce
a door width computed under the pre-calibration fallback scale, went
stale the moment the AI's own dimension-derived calibration lands
moments later. Not fixed here since it wasn't the reported bug and needs
its own careful look at the door-creation ordering rather than reusing
this same helper blindly. Worth a look next time AI-detected doors are
touched.

## Neighborhood-consistency fix for the max-radius false positive (2026-08-25)

After the calibration fix above, the user retested and got a *worse*
result: two "doors" both near a stairwell corner, one clearly mis-placed.
Root cause, found by inspecting the actual stored data rather than
guessing: both had `wCm: 101.875` — identical, and not a coincidence —
`worldToCm()` of the exact *largest* radius the search tries under this
floor's calibration. The scorer wasn't finding the true door size; it was
locking onto the edge of the search range. Diagnosis: `scoreDoorTemplate`
checks "is there dark ink roughly where expected" with no penalty for a
larger, wrong-sized template coincidentally grazing *unrelated* nearby
ink — and a stairwell corner is exactly where that's likely (tread lines,
"Dn"/"Up" text, arrows all nearby).

**Fixed:** `neighborhoodConsistency()` — a genuine door's arc/leaf scores
well not just at its true radius but at nearby radii too (the real ink
is actually there, so a slightly-off template still mostly overlaps it):
a smooth peak. A score driven by coincidentally hitting unrelated ink
tends to be a lonely spike — good at that one exact radius, much worse
one step either side, since the incidental ink isn't actually arc/leaf
shaped. Every candidate now has its winning orientation re-scored at
neighboring radii (±`rStep`); if the average neighbor score isn't at
least `DOOR_ARC_NEIGHBOR_SCORE_FRAC` (0.7) of the peak, it's rejected. A
candidate at the very edge of the search range with no interior neighbor
on one side is scored only against the side that exists (stricter, not
laxer, than having two neighbors to average).

**Verified against both real datasets, not just reasoned about:**
12 West Street (the original validated file) still finds all 4 known-good
doors with unchanged scores — the fix doesn't reject genuine matches. On
the user's actual real export with their actual real calibration
(`0.01292034714159325`, confirmed via console rather than estimated),
the two-candidate max-radius double-match collapsed to one — the
duplicate is gone.

**Honest state, not oversold:** only 1 of the ~7 real doors on the user's
floor is being found even after this fix, and the one that survives still
has a wide `wCm` (~102cm) close to the top of the search range — plausibly
genuine (it independently showed up in an earlier diagnostic sweep run
under a *different* calibration estimate too, which is real
cross-validating evidence, not proof) but not confirmed against the
image directly. This fix demonstrably closes the specific reported bug
(the false double-match) without breaking the previously-validated data,
but doesn't by itself solve low recall on this specific
lower-resolution image — that remains open. Door detection has now been
through three different technical approaches (pixel-gap detection, AI
hinge/tip reading, deterministic template matching) each hitting a real
limitation; worth an honest conversation with the user about whether
further tuning, manual tracing, or the AI path is the better use of
effort from here, rather than continuing to iterate in isolation.

## Threshold-loosening tried and rejected, with evidence (2026-08-25)

User asked to try loosening `DOOR_ARC_MIN_SCORE`/`DOOR_ARC_NEIGHBOR_SCORE_FRAC`
to recover more real doors, after confirming the one surviving detection
was genuinely correct. Swept several threshold pairs (0.68/0.7 down to
0.40/0.5) against both real datasets, then — critically — visually
rendered and checked every *new* candidate that appeared at each looser
level against the real source image, not just counted them.

**Result: rejected.** At 0.55/0.6 (the least aggressive loosening tried),
both new candidates on the original validated 12 West Street file were
wrong: one a mirrored match (correct wall, swinging into the *wrong
room*), one a clean false positive on a furniture bracket shape (no real
door there at all). The same furniture-bracket false positive
independently reappeared at the same threshold on the user's floor —
same nook, same shape, same wrong match — which is strong evidence this
is a systematic failure mode of the scoring approach, not a coincidence
tied to one image. The other new candidate on the user's floor was very
likely a near-duplicate of the already-correct detection (a different
wall meeting at the same real-world corner), not a genuinely new find.

Looser scoring trades a small chance of one duplicate for a repeatable,
cross-image false positive class. Reverted (the real file's constants
were only ever changed in in-memory test copies during this
investigation, never in `index.html` itself, so no revert was actually
needed). Left at 0.68/0.7.

**Where this leaves door detection:** precision is good (everything it
finds at the current threshold has been directly visually confirmed
correct against real source images, across two different real datasets),
but recall is low (finds roughly 1 in 7 real doors on a lower-resolution
image). Best used as a first pass that catches some doors reliably,
not a complete solution — the remaining doors need manual placement,
using the angle-lock/snapping/hover-cursor UX already built for that.

- 2026-08-31 — third feedback round, five additions: (1) walls/furniture
  rotation now default-snap to the nearest 90° (was: free-form for walls
  unless Shift, and always free for furniture) — Shift now opens the angle
  lock for a free angle/rotation instead of the old 15° wall snap; doors
  need no separate change since they already inherit whatever angle their
  host wall has. (2) added a "Measure distance" tool next to Calibrate —
  click-drag anywhere for a distance readout (snaps to nearby wall ends/
  edges by default, Shift for free-form), flagged "(approx)" if the floor
  isn't calibrated yet, stays armed for repeat measurements. (3) furniture
  palette buttons are now click-to-arm/click-to-place stamps: click a type,
  then click the canvas as many times as needed (e.g. a run of kitchen
  units) without re-arming each time; click the same button again, press
  Escape, or pick another tool to put it away — custom items go through the
  same flow. (4) furniture now renders as a simple top-down icon per type
  (sofa: backrest + arms + cushion seams; dining table: chairs along its
  long edges; beds: headboard pillows + foot fold line; wardrobe: door
  split + handles; desk/kitchen unit: a plain back/worktop edge line) built
  as flat shapes clipped to the existing footprint rect, so hit-testing/
  resize/rotate are untouched. (5) Ctrl/Cmd+C/V copies and pastes the
  selected furniture item, cascading diagonally on repeated paste.

- 2026-08-31, later same day — two more additions. (1) **Furniture-to-
  furniture snapping**: dragging a piece near another of the *same type*
  (matched on `type`, or `label` for custom items so two unrelated custom
  pieces don't snap to each other) now snaps on each axis independently —
  either edges touching flush (kitchen units placed side-by-side) or an
  edge/centre lining up without touching (dining chairs kept in a neat
  row) — whichever candidate is closest, within a small pixel threshold
  (`BOX_SNAP_SCREEN_PX`), same approach as the existing wall colinear
  guide. Candidates come from each box's world-space AABB (`boxAABB`,
  rotation-aware) so it works at any rotation, not just axis-aligned;
  neighbours further than 4m away are ignored outright so a stray on-axis
  coincidence can't snap two chairs across the house. Shift bypasses, same
  convention as every other snap in the tool. (2) **Expanded furniture
  catalog** from 9 to 26 items, now grouped by room (Living room, Dining,
  Kitchen, Bedroom, Bathroom, Office/other) in the sidebar instead of one
  flat list: added TV unit, bookshelf, fireplace, dining chair, kitchen
  sink, cooker/hob, fridge freezer, dishwasher, washing machine, chest of
  drawers, bedside table, toilet, bath, shower, bathroom sink, office
  chair, and radiator — each with its own simple top-down icon (bathroom/
  kitchen fixtures as bowl/ring/door shapes; bedside table reuses the
  coffee table's inset-outline icon, matching how visually similar the two
  are). Verified both in a real Chrome tab: dragging one kitchen unit onto
  another lands edges bit-exact flush and then bit-exact centre-aligned on
  the next nudge; Shift-held drag lands at the raw un-snapped position;
  and a dining chair dragged to exactly where a same-type snap would have
  fired next to a kitchen unit correctly did NOT snap (different types).

- 2026-08-31, third round: three more requests. (1) **Furniture labels wrap
  to a second line** (`wrapLabelLines`/`drawFurnitureLabel`, shared by
  `drawBoxes` and `drawStampPreview`) instead of overrunning a narrow
  item's edges — picks whichever word-boundary split keeps the wider of
  the two lines narrowest, falls back to letting a single unsplittable
  word overflow slightly, and skips the label entirely once there's no
  room for even one line. (2) **Bay/bow windows**: a window (still just a
  `walls[]` entry with `type:"window"`) gained one optional signed field,
  `bowCm` — the sagitta (bulge) at its midpoint, dragged via a new amber
  handle at the window's centre. Nothing else about the shape is stored:
  `windowCenterlinePoints` derives a sampled circular arc (standard
  sagitta→radius/centre formula, clamped to `WINDOW_BOW_MAX_FRACTION`
  (0.8) of the half-chord to keep the "sweep the minor arc" assumption
  always correct) fresh from `x1/y1/x2/y2/bowCm` every time it's needed —
  same philosophy as `wallVisibleSegments` deriving a door's cut fresh
  each frame. `drawWindowSegment` now ribbons a banded polygon along
  whatever centreline it gets (a straight 2-point line or a 17-point arc),
  so it renders bit-identical to the old straight-only version when
  there's no bow; `hitTestWalls` and the new `hitTestWindowBowHandle`
  reuse the same sampled points (`pointsToSegments`) so both hit-testing
  and the drag handle correctly follow the curve. Endpoint-drag,
  extend-along-wall, and wall-attachment are all completely untouched —
  the bow just re-derives against whatever the new chord is. (3)
  **Kitchen units yield to appliances placed over them**
  (`resolveKitchenUnitOverlaps`, `KITCHEN_APPLIANCE_TYPES` = fridge,
  cooker/hob, sink, dishwasher, washing machine): transforms the
  appliance's corners into the kitchen unit's own local frame, clips to
  get the overlap span, and — mirroring the door/wall-cut model but as a
  one-time mutation rather than a per-frame render computation, since a
  kitchen unit is a plain movable/resizable box, not a derived-on-render
  shape — cuts along whichever local axis (width/"run", or depth) the
  overlap does NOT fully span, keeping 0/1/2 remainder pieces (a remainder
  under `KITCHEN_UNIT_MIN_PIECE_CM` (8cm) is dropped as an unusable
  sliver). One remaining piece = the unit visibly resizes; two = it splits
  around the appliance (the literal "island loses a 60×60 square for the
  hob" case); zero = fully consumed. Resolved once, at the moment an
  appliance is placed (`addBoxAt`, covering stamp-placement and paste) or
  a drag of one is released (`pointerup`'s `move-box` case) — deliberately
  not continuously during the drag itself, both to avoid mutating other
  boxes' geometry mid-gesture and because "placed over," not "passed
  over," is what was asked for.

  **One real test-methodology lesson, not an app bug, worth remembering
  for next time**: `toScreen()` returns canvas-*local* pixel coordinates,
  not page/viewport ones — feeding its output straight into a `computer`
  tool click (which expects page coordinates) silently clicks the wrong
  spot whenever the canvas isn't flush with the page origin (it never is
  here; the sidebar offsets it). Cost real time chasing a phantom
  "endpoint-drag might be broken by the bow-handle change" theory before
  spotting it — always add `cv.getBoundingClientRect().left/top` to a
  `toScreen()` result before using it as a real click coordinate, or
  just add `rect.left/top` inside a synthetic-PointerEvent dispatch
  (`clientX: rect.left+x`) the way the reliable `pointerId:1`-after-a-
  real-click technique from earlier sessions already does correctly.
  Once corrected, endpoint-drag on a bowed window was confirmed to extend
  the chord while preserving the bow (re-deriving the arc against the new,
  longer chord), exactly as designed. Both the split/resize kitchen-unit
  cases and the bow-window math (sagitta formula, arc sampling, endpoint
  preservation) were also verified numerically in a standalone Node
  script before ever touching the browser.
