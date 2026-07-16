export const CANVAS_WIDTH = 800;
export const CANVAS_HEIGHT = 450;

export const GROUND_HEIGHT = 48;
export const PLAYER_SIZE = 32;
export const PLAYER_SCREEN_X = 150;
export const PLAYER_CORNER_RADIUS = 6;

export const GRAVITY = 2200;

// Variable-height jump: tapping space gives a small hop (MIN_JUMP_FORCE);
// holding it applies extra upward force each frame, up to MAX_JUMP_HOLD_TIME,
// so jump height scales with how long the key is held.
export const MIN_JUMP_FORCE = 480;
export const JUMP_HOLD_FORCE = 1300;
export const MAX_JUMP_HOLD_TIME = 0.42;

// Base scroll speed a level starts at; ramps up while playing (see SPEED_RAMP).
export const SCROLL_SPEED = 300;
export const MAX_SCROLL_SPEED = 750;
// px/sec added to scroll speed per second of survival.
export const SPEED_RAMP = 5;

// Cap per-frame dt so a stalled/throttled frame can't let the player
// tunnel through an obstacle in one big jump.
export const MAX_DT = 1 / 30;

// Speed of the offscreen entry/exit run animations (level start, level end,
// and level-3-style mid-level direction switches) — matches the player's
// jump takeoff speed so transitions don't feel faster than normal movement.
export const TRANSITION_SPEED = MIN_JUMP_FORCE;
