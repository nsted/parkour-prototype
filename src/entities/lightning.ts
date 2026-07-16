import type { KAPLAYCtx } from "kaplay";

const MIN_INTERVAL = 3.5;
const MAX_INTERVAL = 8;
const FLASH_FADE = 0.25;
const BOLT_LIFETIME = 0.15;
const THUNDER_DELAY_MIN = 0.15;
const THUNDER_DELAY_MAX = 0.6;

function randomInterval(k: KAPLAYCtx) {
  return MIN_INTERVAL + k.rand(0, MAX_INTERVAL - MIN_INTERVAL);
}

function spawnBolt(k: KAPLAYCtx) {
  const x = k.rand(60, k.width() - 60);
  const segments = 5;
  const segmentHeight = k.height() / segments;
  const pts = [k.vec2(0, 0)];
  for (let i = 1; i <= segments; i++) {
    const jitter = k.rand(-18, 18);
    pts.push(k.vec2(jitter, i * segmentHeight));
  }

  const bolt = k.add([
    k.polygon(pts, { fill: false }),
    k.pos(x, 0),
    k.fixed(),
    k.z(90),
    k.outline(2, k.rgb(255, 255, 210)),
    k.opacity(0.85),
  ]);

  k.wait(BOLT_LIFETIME, () => bolt.destroy());
}

export interface LightningController {
  cancel(): void;
}

export function startLightning(k: KAPLAYCtx): LightningController {
  let cancelled = false;

  function scheduleNext() {
    if (cancelled) return;
    k.wait(randomInterval(k), () => {
      if (cancelled) return;
      k.flash(k.WHITE, FLASH_FADE);
      spawnBolt(k);
      k.wait(k.rand(THUNDER_DELAY_MIN, THUNDER_DELAY_MAX), () => {
        if (cancelled) return;
        k.play("thunder");
      });
      scheduleNext();
    });
  }

  scheduleNext();

  return {
    cancel() {
      cancelled = true;
    },
  };
}
