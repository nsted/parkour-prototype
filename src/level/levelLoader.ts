import type { KAPLAYCtx } from "kaplay";
import { makeObstacle } from "../entities/obstacle";
import type { LevelSegment } from "./levelData";

export function loadSegment(k: KAPLAYCtx, segment: LevelSegment) {
  for (const spawn of segment.obstacles) {
    makeObstacle(k, spawn.type, spawn.x, spawn.y);
  }
}
