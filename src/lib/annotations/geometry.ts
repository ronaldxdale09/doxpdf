import type { Annotation, Point } from "@/types/annotations";

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Displayed page size (points) for a source page rotated by `rotation`. */
export function displaySize(rotation: number, srcW: number, srcH: number) {
  return rotation % 180 === 0
    ? { width: srcW, height: srcH }
    : { width: srcH, height: srcW };
}

/** Map a point from the displayed (rotated) space back to base page space. */
function displayToBase(dx: number, dy: number, r: number, W: number, H: number): Point {
  switch (((r % 360) + 360) % 360) {
    case 90:
      return { x: dy, y: H - dx };
    case 180:
      return { x: W - dx, y: H - dy };
    case 270:
      return { x: W - dy, y: dx };
    default:
      return { x: dx, y: dy };
  }
}

/** Map a point from base page space to the displayed (rotated) space. */
function baseToDisplay(x: number, y: number, r: number, W: number, H: number): Point {
  switch (((r % 360) + 360) % 360) {
    case 90:
      return { x: H - y, y: x };
    case 180:
      return { x: W - x, y: H - y };
    case 270:
      return { x: y, y: W - x };
    default:
      return { x, y };
  }
}

/**
 * Re-express an annotation's geometry when a page rotates from `fromR` to `toR`
 * (W/H are the *source*, unrotated page dimensions). Used both when the user
 * rotates a page (so annotations stay attached) and at bake time (toR = 0, to
 * convert display coords into the page's base coordinate space).
 */
export function rotateAnnotationGeometry(
  a: Pick<Annotation, "x" | "y" | "width" | "height"> & {
    points?: Annotation["points"];
  },
  fromR: number,
  toR: number,
  W: number,
  H: number,
): Partial<Annotation> {
  const map = (p: Point): Point => {
    const base = displayToBase(p.x, p.y, fromR, W, H);
    return baseToDisplay(base.x, base.y, toR, W, H);
  };
  const c1 = map({ x: a.x, y: a.y });
  const c2 = map({ x: a.x + a.width, y: a.y + a.height });
  const patch: Partial<Annotation> = {
    x: Math.min(c1.x, c2.x),
    y: Math.min(c1.y, c2.y),
    width: Math.abs(c2.x - c1.x),
    height: Math.abs(c2.y - c1.y),
  };
  if (a.points) patch.points = a.points.map(map);
  return patch;
}

/** Axis-aligned bounding box of a set of points, with optional padding. */
export function bboxFromPoints(points: Point[], pad = 0): Rect {
  if (points.length === 0) return { x: 0, y: 0, width: 0, height: 0 };
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const p of points) {
    if (p.x < minX) minX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.x > maxX) maxX = p.x;
    if (p.y > maxY) maxY = p.y;
  }
  return {
    x: minX - pad,
    y: minY - pad,
    width: maxX - minX + pad * 2,
    height: maxY - minY + pad * 2,
  };
}

/** Build a positive-area rect from two corner points. */
export function rectFromCorners(a: Point, b: Point): Rect {
  return {
    x: Math.min(a.x, b.x),
    y: Math.min(a.y, b.y),
    width: Math.abs(b.x - a.x),
    height: Math.abs(b.y - a.y),
  };
}

/** Translate every point by (dx, dy). */
export function translatePoints(points: Point[], dx: number, dy: number): Point[] {
  return points.map((p) => ({ x: p.x + dx, y: p.y + dy }));
}

/** A drawn alignment guide: a full-page line at `pos` along the given axis. */
export interface Guide {
  axis: "x" | "y";
  pos: number;
}

/**
 * Snap a dragged box to nearby alignment targets — the page's edges and center,
 * and every other annotation's edges and center. Returns the snapped top-left
 * plus the guide lines to draw. `threshold` is the snap radius in points.
 */
export function computeSnap(
  rect: Rect,
  others: Rect[],
  pageW: number,
  pageH: number,
  threshold: number,
): { x: number; y: number; guides: Guide[] } {
  const xTargets = [0, pageW / 2, pageW];
  const yTargets = [0, pageH / 2, pageH];
  for (const o of others) {
    xTargets.push(o.x, o.x + o.width / 2, o.x + o.width);
    yTargets.push(o.y, o.y + o.height / 2, o.y + o.height);
  }

  // The dragged box's left/center/right and top/center/bottom.
  const xEdges = [rect.x, rect.x + rect.width / 2, rect.x + rect.width];
  const yEdges = [rect.y, rect.y + rect.height / 2, rect.y + rect.height];

  const fit = (edges: number[], targets: number[], origin: number) => {
    let best = threshold;
    let snapped = origin;
    let guide: number | null = null;
    for (const edge of edges) {
      for (const t of targets) {
        const d = Math.abs(edge - t);
        if (d < best) {
          best = d;
          snapped = origin + (t - edge);
          guide = t;
        }
      }
    }
    return { snapped, guide };
  };

  const fx = fit(xEdges, xTargets, rect.x);
  const fy = fit(yEdges, yTargets, rect.y);

  const guides: Guide[] = [];
  if (fx.guide !== null) guides.push({ axis: "x", pos: fx.guide });
  if (fy.guide !== null) guides.push({ axis: "y", pos: fy.guide });

  return { x: fx.snapped, y: fy.snapped, guides };
}
