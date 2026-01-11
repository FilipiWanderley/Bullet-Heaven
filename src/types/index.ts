export type GameState = 'start' | 'playing' | 'gameover';

export interface InputKeys {
  [key: string]: boolean;
}

export interface HUDState {
  xp: number;
  level: number;
  score: number;
  maxXp: number;
}
