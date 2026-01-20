export type GameState = 'start' | 'playing' | 'boss_fight' | 'gameover' | 'paused';

export interface InputKeys {
  [key: string]: boolean;
}

export interface HUDState {
  xp: number;
  level: number;
  score: number;
  maxXp: number;
}
