import type { KAPLAYCtx } from "kaplay";

export function registerVictoryScene(k: KAPLAYCtx) {
  k.scene("victory", () => {
    k.add([
      k.text("YOU WON", { size: 56, align: "center" }),
      k.pos(k.width() / 2, k.height() / 2 - 60),
      k.anchor("center"),
    ]);

    k.add([
      k.text("Blocksburg Parkour is in active development,\ncome back soon for updates.", {
        size: 18,
        align: "center",
      }),
      k.pos(k.width() / 2, k.height() / 2 + 10),
      k.anchor("center"),
      k.color(180, 180, 190),
    ]);

    k.add([
      k.text("Contact oscar@devicist.com with comments and queries.", {
        size: 16,
        align: "center",
      }),
      k.pos(k.width() / 2, k.height() / 2 + 70),
      k.anchor("center"),
      k.color(140, 140, 150),
    ]);
  });
}
