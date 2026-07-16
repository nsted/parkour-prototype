import kaplay from "kaplay";
import { CANVAS_WIDTH, CANVAS_HEIGHT, GRAVITY } from "./config";
import { registerGameScene } from "./scenes/game";

const k = kaplay({
  width: CANVAS_WIDTH,
  height: CANVAS_HEIGHT,
  background: [20, 20, 30],
  stretch: true,
  pixelDensity: window.devicePixelRatio || 1,
  global: false,
});

k.setGravity(GRAVITY);

k.loadSound("thunder", "/sfx/thunder.mp3");

registerGameScene(k);

k.go("game");
