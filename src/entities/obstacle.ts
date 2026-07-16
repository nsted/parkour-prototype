import type { GameObj, KAPLAYCtx } from "kaplay";
import { groundY } from "./player";

export type ObstacleType = "spike" | "block" | "overheadBar";

const SPIKE_WIDTH = 34;
const SPIKE_HEIGHT = 40;
const BLOCK_SIZE = 40;
const BLOCK_RADIUS = 4;
const BAR_WIDTH = 60;
const BAR_HEIGHT = 24;
const BAR_RADIUS = 4;
const OUTLINE_WIDTH = 2;

// Inset margin so obstacle hitboxes are a little smaller than their visible
// shape, matching the player's forgiving-hitbox treatment.
const HITBOX_INSET = 0.12;

export interface ScrollingObstacle extends GameObj {
  // Fixed position in its segment's local course distance (0 at the
  // segment's start), independent of scroll direction. The scene
  // recomputes screen x from this every frame.
  spawnX: number;
}

function insetRect(k: KAPLAYCtx, width: number, height: number) {
  return new k.Rect(
    k.vec2(width * HITBOX_INSET, height * HITBOX_INSET),
    width * (1 - HITBOX_INSET * 2),
    height * (1 - HITBOX_INSET * 2),
  );
}

export function makeObstacle(
  k: KAPLAYCtx,
  type: ObstacleType,
  x: number,
  y?: number,
): ScrollingObstacle {
  const ground = groundY(k);
  const spawnXComp = { spawnX: x };

  if (type === "spike") {
    return k.add([
      k.polygon(
        [k.vec2(0, SPIKE_HEIGHT), k.vec2(SPIKE_WIDTH / 2, 0), k.vec2(SPIKE_WIDTH, SPIKE_HEIGHT)],
        { fill: false },
      ),
      k.pos(x, ground - SPIKE_HEIGHT),
      k.area({ shape: insetRect(k, SPIKE_WIDTH, SPIKE_HEIGHT) }),
      k.outline(OUTLINE_WIDTH, k.rgb(255, 90, 90)),
      "obstacle",
      "scroll",
      spawnXComp,
    ]) as unknown as ScrollingObstacle;
  }

  if (type === "block") {
    return k.add([
      k.rect(BLOCK_SIZE, BLOCK_SIZE, { radius: BLOCK_RADIUS, fill: false }),
      k.pos(x, ground - BLOCK_SIZE),
      k.area({ shape: insetRect(k, BLOCK_SIZE, BLOCK_SIZE) }),
      k.outline(OUTLINE_WIDTH, k.rgb(200, 200, 215)),
      "obstacle",
      "scroll",
      spawnXComp,
    ]) as unknown as ScrollingObstacle;
  }

  // overheadBar: hangs a fixed gap above the ground; player must duck
  // (shorter hitbox) to pass underneath.
  const gap = y ?? 40;
  return k.add([
    k.rect(BAR_WIDTH, BAR_HEIGHT, { radius: BAR_RADIUS, fill: false }),
    k.pos(x, ground - gap - BAR_HEIGHT),
    k.area({ shape: insetRect(k, BAR_WIDTH, BAR_HEIGHT) }),
    k.outline(OUTLINE_WIDTH, k.rgb(255, 170, 60)),
    "obstacle",
    "scroll",
    spawnXComp,
  ]) as unknown as ScrollingObstacle;
}
