import { GameObject } from './GameObject';

export class Player extends GameObject {
  speed: number = 300; // pixels per second

  constructor(x: number, y: number) {
    super(x, y, 15, 'white');
  }
}
