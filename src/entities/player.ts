import type { GameObj, KAPLAYCtx } from "kaplay";
import {
  GROUND_HEIGHT,
  MIN_JUMP_FORCE,
  PLAYER_CORNER_RADIUS,
  PLAYER_SCREEN_X,
  PLAYER_SIZE,
} from "../config";

export type PlayerState = "running" | "jumping" | "ducking" | "dead";

const STAND_HEIGHT = PLAYER_SIZE;
const DUCK_HEIGHT = PLAYER_SIZE / 2;
const OUTLINE_WIDTH = 2;

const RUNNING_COLOR = { r: 130, g: 210, b: 255 };
const DUCKING_COLOR = { r: 255, g: 210, b: 90 };
const DEAD_COLOR = { r: 255, g: 90, b: 90 };

// Inset margin so the collision box is smaller than the visible sprite —
// makes near-misses look/feel fair instead of cheap.
const HITBOX_INSET = 0.18;

export interface Player extends GameObj {
  state: PlayerState;
  setPlayerState(next: PlayerState): void;
}

export function groundY(k: KAPLAYCtx) {
  return k.height() - GROUND_HEIGHT;
}

function hitboxShape(k: KAPLAYCtx, height: number) {
  return new k.Rect(
    k.vec2(PLAYER_SIZE * HITBOX_INSET, height * HITBOX_INSET),
    PLAYER_SIZE * (1 - HITBOX_INSET * 2),
    height * (1 - HITBOX_INSET * 2),
  );
}

export function makePlayer(k: KAPLAYCtx, screenX: number = PLAYER_SCREEN_X): Player {
  const player = k.add([
    k.rect(PLAYER_SIZE, STAND_HEIGHT, { radius: PLAYER_CORNER_RADIUS, fill: false }),
    k.pos(screenX, groundY(k) - STAND_HEIGHT),
    k.area({ shape: hitboxShape(k, STAND_HEIGHT) }),
    k.body({ jumpForce: MIN_JUMP_FORCE }),
    k.outline(OUTLINE_WIDTH, k.rgb(RUNNING_COLOR.r, RUNNING_COLOR.g, RUNNING_COLOR.b)),
    "player",
    { state: "running" as PlayerState },
  ]) as unknown as Player;

  player.setPlayerState = (next: PlayerState) => {
    if (player.state === "dead" || player.state === next) return;

    const wasDucking = player.state === "ducking";
    const willDuck = next === "ducking";

    if (willDuck !== wasDucking) {
      const newHeight = willDuck ? DUCK_HEIGHT : STAND_HEIGHT;
      const heightDelta = player.height - newHeight;
      player.height = newHeight;
      player.pos.y += heightDelta; // keep the bottom edge anchored to the ground
      player.area.shape = hitboxShape(k, newHeight);
      const c = willDuck ? DUCKING_COLOR : RUNNING_COLOR;
      player.outline.color = k.rgb(c.r, c.g, c.b);
    }

    if (next === "dead") {
      player.outline.color = k.rgb(DEAD_COLOR.r, DEAD_COLOR.g, DEAD_COLOR.b);
    }

    player.state = next;
  };

  return player;
}
