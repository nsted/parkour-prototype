import type { KAPLAYCtx } from "kaplay";

export function registerTitleScene(k: KAPLAYCtx) {
  k.scene("title", () => {
    k.add([
      k.text("Blocksburg Parkour", { size: 40, align: "center" }),
      k.pos(k.width() / 2, k.height() / 2 - 20),
      k.anchor("center"),
    ]);

    k.add([
      k.text("Press SPACE or tap to begin", { size: 20, align: "center" }),
      k.pos(k.width() / 2, k.height() / 2 + 30),
      k.anchor("center"),
      k.color(180, 180, 190),
    ]);

    k.onKeyPress("space", () => {
      k.go("game");
    });

    k.onTouchStart(() => {
      k.go("game");
    });
  });
}
