import kaplay from "kaplay";
import { CANVAS_WIDTH, CANVAS_HEIGHT, GRAVITY } from "./config";
import { registerGameScene } from "./scenes/game";
import { registerTitleScene } from "./scenes/title";
import { registerVictoryScene } from "./scenes/victory";

const k = kaplay({
  width: CANVAS_WIDTH,
  height: CANVAS_HEIGHT,
  background: [20, 20, 30],
  stretch: true,
  pixelDensity: window.devicePixelRatio || 1,
  global: false,
});

k.setGravity(GRAVITY);

k.loadSound("thunder", `${import.meta.env.BASE_URL}sfx/thunder.mp3`);

registerGameScene(k);
registerTitleScene(k);
registerVictoryScene(k);

k.go("title");
