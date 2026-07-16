import type { KAPLAYCtx } from "kaplay";
import {
  GROUND_HEIGHT,
  JUMP_HOLD_FORCE,
  MAX_DT,
  MAX_JUMP_HOLD_TIME,
  MAX_SCROLL_SPEED,
  MIN_JUMP_FORCE,
  PLAYER_SCREEN_X,
  PLAYER_SIZE,
  SPEED_RAMP,
  TRANSITION_SPEED,
} from "../config";
import { groundY, makePlayer } from "../entities/player";
import type { ScrollingObstacle } from "../entities/obstacle";
import { startLightning } from "../entities/lightning";
import { level1, level2, level3, type LevelData } from "../level/levelData";
import { loadSegment } from "../level/levelLoader";
import { makeHud } from "../ui/hud";
import { startMusic, stopMusic, setMusicRate } from "../audio/music";

const STARTING_LIVES = 3;

let attemptCount = 0;
let livesRemaining = STARTING_LIVES;

type Phase = "intro" | "playing" | "switching" | "outro" | "dead" | "completed";

export function registerGameScene(k: KAPLAYCtx) {
  // Dev shortcut: option+1/2/3 jumps straight to that level, at any point in
  // the game. Bound to the raw keydown event (not k.onKeyPress) because on
  // Mac, holding Option changes what KeyboardEvent.key reports for digit
  // keys (e.g. option+1 -> "¡"), so kaplay's key system — which keys off
  // event.key — never sees a "1" press while option is held. event.code is
  // layout-independent and unaffected by the modifier.
  const LEVEL_SHORTCUTS: Record<string, LevelData> = {
    Digit1: level1,
    Digit2: level2,
    Digit3: level3,
  };
  let cancelCurrentLightning: (() => void) | null = null;
  window.addEventListener("keydown", (e) => {
    if (!e.altKey) return;
    const target = LEVEL_SHORTCUTS[e.code];
    if (!target) return;
    e.preventDefault();
    cancelCurrentLightning?.();
    k.go("game", target);
  });

  k.scene("game", (level: LevelData = level1) => {
    attemptCount += 1;

    // Rest position (where the player stands and jumps/ducks) for a given
    // direction, and the offscreen points a run-off/run-on animation uses:
    // entry is "behind" the rest position along the direction of travel,
    // exit is "ahead" of it.
    const restX = (reversed: boolean) => (reversed ? k.width() - PLAYER_SCREEN_X : PLAYER_SCREEN_X);
    const entryX = (reversed: boolean) => (reversed ? k.width() + PLAYER_SIZE : -PLAYER_SIZE);
    const exitX = (reversed: boolean) => (reversed ? -PLAYER_SIZE : k.width() + PLAYER_SIZE);

    // Which mini-level (segment) is active, and how far the player has
    // progressed within it. Each segment's obstacles are positioned purely
    // from this local distance and don't exist in the world until their
    // segment is loaded, so a segment boundary can never leak obstacles
    // from the segment before or after it.
    let segmentIndex = 0;
    let localDistance = 0;
    let scrollSpeed = level.scrollSpeed;
    let jumpHoldTime = 0;
    let isHoldingJump = false;
    let outOfLives = false;

    let phase: Phase = "intro";
    let transitionTarget = restX(level.segments[0].reversed);
    // Tracked only for "outro" (an actual level clear): how far the run to
    // the edge has progressed, so its speed can ramp from normal up to 2x
    // by the time he reaches the edge. A mid-level "switching" glide never
    // sets these and always runs at normal speed.
    let outroStartX = 0;
    let outroTotalDistance = 0;

    k.add([
      k.rect(k.width(), GROUND_HEIGHT),
      k.pos(0, k.height() - GROUND_HEIGHT),
      k.area(),
      k.body({ isStatic: true }),
      k.color(50, 50, 65),
      k.outline(1, k.rgb(90, 90, 110)),
    ]);

    const player = makePlayer(k, entryX(level.segments[0].reversed));
    loadSegment(k, level.segments[0]);
    repositionObstacles();
    const hud = makeHud(k, attemptCount, livesRemaining);
    hud.setLevelName(level.name);

    startMusic();
    const lightning = startLightning(k);
    cancelCurrentLightning = lightning.cancel;

    function restart() {
      lightning.cancel();
      if (outOfLives) {
        livesRemaining = STARTING_LIVES;
        k.go("game", level1);
      } else {
        k.go("game", level);
      }
    }

    function advanceLevel() {
      lightning.cancel();
      if (level.next) {
        k.go("game", level.next());
      } else {
        k.go("victory");
      }
    }

    function killPlayer() {
      if (phase !== "playing") return;
      phase = "dead";
      livesRemaining -= 1;
      outOfLives = livesRemaining <= 0;
      player.setPlayerState("dead");
      hud.setLives(Math.max(livesRemaining, 0));
      hud.setMessage(
        outOfLives
          ? "GAME OVER — Press SPACE or tap to restart"
          : `You Died — ${livesRemaining} lives left — Press SPACE or tap to continue`,
      );
      stopMusic();
    }

    player.onCollide("obstacle", killPlayer);

    // Shared by keyboard (space/down) and touch input below, so both
    // control schemes drive the exact same state transitions.
    function startJump() {
      if (phase === "dead") return restart();
      if (phase === "completed") return advanceLevel();
      if (phase !== "playing") return;
      if (player.isGrounded()) {
        player.jump(MIN_JUMP_FORCE);
        jumpHoldTime = 0;
        isHoldingJump = true;
      }
    }

    function endJump() {
      isHoldingJump = false;
    }

    function startDuck() {
      if (phase !== "playing") return;
      if (player.isGrounded()) {
        player.setPlayerState("ducking");
      }
    }

    function endDuck() {
      if (phase !== "playing" || player.state !== "ducking") return;
      player.setPlayerState("running");
    }

    k.onKeyPress("space", startJump);
    k.onKeyRelease("space", endJump);
    k.onKeyDown("down", startDuck);
    k.onKeyRelease("down", endDuck);

    k.onKeyPress("r", () => {
      if (phase === "dead") restart();
      else if (phase === "completed") advanceLevel();
    });

    // Touch controls: tap to jump, swipe down to duck. Each touch starts
    // "unresolved" — a quick downward swipe (tracked per touch identifier,
    // since multiple touches can be in flight) resolves it as a duck before
    // a jump ever fires; otherwise it resolves as a jump either as soon as
    // TAP_RESOLVE_MS elapses (so a held tap still feels instant) or on
    // release, whichever comes first. This ordering matters because once a
    // jump is triggered it can't be undone into a duck — jumping instead of
    // ducking under an overhead bar would kill the player.
    const SWIPE_DOWN_PX = 24;
    const TAP_RESOLVE_MS = 90;
    type TouchGesture = { startY: number; resolved: "jump" | "duck" | null; timer: number };
    const activeTouches = new Map<number, TouchGesture>();

    k.onTouchStart((pos, t) => {
      const gesture: TouchGesture = { startY: pos.y, resolved: null, timer: 0 };
      gesture.timer = window.setTimeout(() => {
        if (gesture.resolved) return;
        gesture.resolved = "jump";
        startJump();
      }, TAP_RESOLVE_MS);
      activeTouches.set(t.identifier, gesture);
    });

    k.onTouchMove((pos, t) => {
      const gesture = activeTouches.get(t.identifier);
      if (!gesture || gesture.resolved) return;
      if (pos.y - gesture.startY > SWIPE_DOWN_PX) {
        window.clearTimeout(gesture.timer);
        gesture.resolved = "duck";
        startDuck();
      }
    });

    k.onTouchEnd((_pos, t) => {
      const gesture = activeTouches.get(t.identifier);
      if (!gesture) return;
      window.clearTimeout(gesture.timer);
      if (!gesture.resolved) {
        gesture.resolved = "jump";
        startJump();
      }
      if (gesture.resolved === "jump") endJump();
      else endDuck();
      activeTouches.delete(t.identifier);
    });

    // Used for the scripted run-on/run-off animations (level intro/outro and
    // level-3-style mid-level direction switches). These move the player
    // horizontally through x positions the ground body doesn't cover
    // (offscreen), so gravity is held off and the player is pinned to
    // ground level for the duration rather than left to fall.
    function stepPlayerToward(target: number, dt: number, speedMultiplier = 1): boolean {
      player.pos.y = groundY(k) - player.height;
      player.vel.y = 0;

      const diff = target - player.pos.x;
      const maxDelta = TRANSITION_SPEED * speedMultiplier * dt;
      if (Math.abs(diff) <= maxDelta) {
        player.pos.x = target;
        return true;
      }
      player.pos.x += Math.sign(diff) * maxDelta;
      return false;
    }

    // Places every obstacle from its fixed segment-local spawnX and the
    // current localDistance/direction. makeObstacle() sets an obstacle's
    // initial x to its raw local spawnX, uncorrected for direction — this
    // must run once right after loadSegment(), before that frame renders,
    // or a reversed segment's obstacles flash at their un-mirrored spots
    // for a frame before snapping to the right place.
    function repositionObstacles() {
      const reversed = level.segments[segmentIndex].reversed;
      for (const obstacle of k.get("scroll") as ScrollingObstacle[]) {
        const normalX = obstacle.spawnX - localDistance;
        obstacle.pos.x = reversed ? k.width() - normalX : normalX;
      }
    }

    // Advances scroll speed/distance and repositions every obstacle. Only
    // ever called while a segment's obstacles are the ones loaded, so this
    // needs no direction-change handling of its own — segment transitions
    // are handled by swapping which obstacles exist (see the "switching"
    // phase below).
    function advanceWorld(dt: number) {
      scrollSpeed = Math.min(scrollSpeed + SPEED_RAMP * dt, MAX_SCROLL_SPEED);
      setMusicRate(scrollSpeed / level.scrollSpeed);
      localDistance += scrollSpeed * dt;
      repositionObstacles();
    }

    k.onUpdate(() => {
      const dt = Math.min(k.dt(), MAX_DT);

      if (phase === "dead" || phase === "completed") return;

      if (phase === "intro") {
        if (stepPlayerToward(transitionTarget, dt)) phase = "playing";
        return;
      }

      if (phase === "switching") {
        // The old segment's obstacles are already gone (destroyed the
        // moment it finished) and the next segment's haven't spawned yet —
        // the screen is genuinely, completely empty for the whole glide,
        // exactly like level1's outro. Once the player arrives at the new
        // rest spot, the next mini-level loads and starts fresh, the same
        // way any level's obstacles first ease into view at its start.
        if (stepPlayerToward(transitionTarget, dt)) {
          segmentIndex += 1;
          localDistance = 0;
          loadSegment(k, level.segments[segmentIndex]);
          repositionObstacles();
          phase = "playing";
        }
        return;
      }

      if (phase === "outro") {
        const progress =
          outroTotalDistance > 0
            ? Math.min(Math.abs(player.pos.x - outroStartX) / outroTotalDistance, 1)
            : 1;
        stepPlayerToward(transitionTarget, dt, 1 + progress * 2);
        if (player.pos.x === transitionTarget) {
          phase = "completed";
          hud.setMessage("You made it! Press SPACE or tap for the next level");
          stopMusic();
        }
        return;
      }

      // phase === "playing"
      if (isHoldingJump && player.isJumping() && jumpHoldTime < MAX_JUMP_HOLD_TIME) {
        player.addForce(k.vec2(0, -JUMP_HOLD_FORCE));
        jumpHoldTime += dt;
      } else {
        isHoldingJump = false;
      }

      if (!player.isGrounded()) {
        player.setPlayerState("jumping");
      } else if (player.state === "jumping") {
        player.setPlayerState("running");
      }

      advanceWorld(dt);
      const segment = level.segments[segmentIndex];

      if (localDistance >= segment.length) {
        for (const obstacle of k.get("scroll") as ScrollingObstacle[]) {
          obstacle.destroy();
        }
        if (segmentIndex === level.segments.length - 1) {
          phase = "outro";
          transitionTarget = exitX(segment.reversed);
          outroStartX = player.pos.x;
          outroTotalDistance = Math.abs(transitionTarget - outroStartX);
        } else {
          phase = "switching";
          transitionTarget = restX(level.segments[segmentIndex + 1].reversed);
        }
        return;
      }

      player.pos.x = restX(segment.reversed);
    });
  });
}
