import type { ObstacleType } from "../entities/obstacle";
import { SCROLL_SPEED } from "../config";

export interface ObstacleSpawn {
  type: ObstacleType;
  x: number;
  y?: number;
}

// A level is one or more "mini levels" run back to back. Each segment is
// self-contained: its obstacles are positioned purely by that segment's own
// local distance (x, and the local progress counter, both start at 0 at the
// segment's start), and its obstacles only exist in the world while it's
// the active segment. A plain single-direction level (level1, level2) is
// just a level with one segment; level3's mid-level direction flips are
// segment boundaries.
export interface LevelSegment {
  length: number;
  reversed: boolean;
  obstacles: ObstacleSpawn[];
}

export interface LevelData {
  name: string;
  scrollSpeed: number;
  segments: LevelSegment[];
  next?: () => LevelData;
}

export const level1: LevelData = {
  name: "Prototype Run",
  scrollSpeed: SCROLL_SPEED,
  segments: [
    {
      length: 8000,
      reversed: false,
      obstacles: [
        { type: "spike", x: 600 },
        { type: "spike", x: 900 },
        { type: "overheadBar", x: 1300, y: 40 },
        { type: "block", x: 1700 },
        { type: "spike", x: 1900 },
        { type: "overheadBar", x: 2300, y: 40 },
        { type: "spike", x: 2650 },
        { type: "block", x: 2950 },
        { type: "spike", x: 3200 },
        { type: "overheadBar", x: 3600, y: 40 },
        { type: "spike", x: 3950 },
        { type: "spike", x: 4200 },
        { type: "block", x: 4550 },
        { type: "overheadBar", x: 4900, y: 40 },
        { type: "spike", x: 5250 },
        { type: "block", x: 5550 },
        { type: "spike", x: 5800 },
        { type: "overheadBar", x: 6100, y: 40 },
        { type: "spike", x: 6450 },
        { type: "spike", x: 6700 },
        { type: "block", x: 7000 },
        { type: "overheadBar", x: 7350, y: 40 },
        { type: "spike", x: 7700 },
      ],
    },
  ],
  next: () => level2,
};

export const level2: LevelData = {
  name: "Second Wind",
  scrollSpeed: SCROLL_SPEED * 1.15,
  segments: [
    {
      length: 9000,
      reversed: true,
      obstacles: [
        { type: "spike", x: 550 },
        { type: "overheadBar", x: 850, y: 40 },
        { type: "spike", x: 1150 },
        { type: "spike", x: 1400 },
        { type: "block", x: 1700 },
        { type: "overheadBar", x: 2000, y: 40 },
        { type: "spike", x: 2300 },
        { type: "block", x: 2600 },
        { type: "spike", x: 2850 },
        { type: "overheadBar", x: 3150, y: 40 },
        { type: "spike", x: 3450 },
        { type: "spike", x: 3700 },
        { type: "block", x: 4000 },
        { type: "spike", x: 4250 },
        { type: "overheadBar", x: 4550, y: 40 },
        { type: "block", x: 4850 },
        { type: "spike", x: 5100 },
        { type: "spike", x: 5350 },
        { type: "overheadBar", x: 5650, y: 40 },
        { type: "spike", x: 5950 },
        { type: "block", x: 6250 },
        { type: "spike", x: 6500 },
        { type: "overheadBar", x: 6800, y: 40 },
        { type: "spike", x: 7100 },
        { type: "spike", x: 7350 },
        { type: "block", x: 7650 },
        { type: "overheadBar", x: 7950, y: 40 },
        { type: "spike", x: 8300 },
        { type: "spike", x: 8600 },
      ],
    },
  ],
  next: () => level3,
};

export const level3: LevelData = {
  name: "Switchback",
  scrollSpeed: SCROLL_SPEED,
  segments: [
    // Mini level1: normal direction.
    {
      length: 3000,
      reversed: false,
      obstacles: [
        { type: "spike", x: 500 },
        { type: "overheadBar", x: 800, y: 40 },
        { type: "spike", x: 1100 },
        { type: "block", x: 1400 },
        { type: "spike", x: 1700 },
        { type: "overheadBar", x: 2000, y: 40 },
        { type: "spike", x: 2300 },
        { type: "spike", x: 2550 },
        { type: "block", x: 2800 },
      ],
    },
    // Mini level2: reversed direction. Opening gap matches level2's own
    // 550-unit head start (so the first obstacle isn't right on top of the
    // player the instant they land here).
    {
      length: 3300,
      reversed: true,
      obstacles: [
        { type: "spike", x: 550 },
        { type: "overheadBar", x: 850, y: 40 },
        { type: "spike", x: 1150 },
        { type: "block", x: 1450 },
        { type: "spike", x: 1700 },
        { type: "spike", x: 1950 },
        { type: "overheadBar", x: 2250, y: 40 },
        { type: "block", x: 2550 },
        { type: "spike", x: 2800 },
        { type: "spike", x: 3050 },
      ],
    },
    // Mini level1 again: normal direction. Opening gap matches level1's own
    // 600-unit head start.
    {
      length: 3300,
      reversed: false,
      obstacles: [
        { type: "spike", x: 600 },
        { type: "overheadBar", x: 900, y: 40 },
        { type: "spike", x: 1200 },
        { type: "block", x: 1500 },
        { type: "spike", x: 1750 },
        { type: "spike", x: 2000 },
        { type: "overheadBar", x: 2300, y: 40 },
        { type: "block", x: 2600 },
        { type: "spike", x: 2850 },
        { type: "spike", x: 3100 },
      ],
    },
  ],
  // No next level — finishing this one is the end of the game (see
  // advanceLevel() in game.ts, which routes to the victory screen).
};
