import type { GameObj, KAPLAYCtx } from "kaplay";

export interface Hud {
  attemptLabel: GameObj;
  messageLabel: GameObj;
  levelLabel: GameObj;
  livesLabel: GameObj;
  setMessage(text: string): void;
  setLevelName(name: string): void;
  setLives(lives: number): void;
}

export function makeHud(k: KAPLAYCtx, attempt: number, lives: number): Hud {
  const attemptLabel = k.add([
    k.text(`Attempts: ${attempt}`, { size: 20 }),
    k.pos(12, 12),
    k.fixed(),
    k.z(100),
  ]);

  const livesLabel = k.add([
    k.text(`Lives: ${lives}`, { size: 20 }),
    k.pos(12, 60),
    k.fixed(),
    k.z(100),
  ]);

  const levelLabel = k.add([
    k.text("", { size: 16 }),
    k.pos(12, 86),
    k.fixed(),
    k.z(100),
    k.color(180, 180, 190),
  ]);

  const messageLabel = k.add([
    k.text("", { size: 28, align: "center" }),
    k.pos(k.width() / 2, k.height() / 2),
    k.anchor("center"),
    k.fixed(),
    k.z(100),
  ]);

  return {
    attemptLabel,
    messageLabel,
    levelLabel,
    livesLabel,
    setMessage(text: string) {
      messageLabel.text = text;
    },
    setLevelName(name: string) {
      levelLabel.text = name;
    },
    setLives(lives: number) {
      livesLabel.text = `Lives: ${lives}`;
    },
  };
}
