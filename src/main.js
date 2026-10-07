import Phaser from 'phaser';
import { GAME } from './data/gameplay.js';
import BootScene from './scenes/BootScene.js';
import CountryScene from './scenes/CountryScene.js';

// Configuration Phaser : pixel art net, 480 x 270 agrandi sans lissage
const config = {
  type: Phaser.AUTO,
  parent: 'game',
  width: GAME.width,
  height: GAME.height,
  backgroundColor: '#050407',
  pixelArt: true,
  roundPixels: true,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  physics: {
    default: 'arcade',
    arcade: { gravity: { y: GAME.gravity }, debug: false },
  },
  scene: [BootScene, CountryScene],
};

window.__penombre = new Phaser.Game(config);
