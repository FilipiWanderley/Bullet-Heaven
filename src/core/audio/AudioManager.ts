
/**
 * Gerenciador de Áudio utilizando Web Audio API.
 * Implementa um Singleton para garantir uma única instância de contexto de áudio.
 * Gera sons sintéticos para evitar dependência de assets externos.
 */
export class AudioManager {
  private static instance: AudioManager;
  private context: AudioContext | null = null;
  private masterGain: GainNode | null = null;

  private constructor() {}

  /**
   * Retorna a instância única do AudioManager.
   */
  static getInstance(): AudioManager {
    if (!AudioManager.instance) {
      AudioManager.instance = new AudioManager();
    }
    return AudioManager.instance;
  }

  /**
   * Inicializa o contexto de áudio (deve ser chamado após interação do usuário).
   */
  init() {
    if (!this.context) {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.context = new AudioContextClass();
      this.masterGain = this.context.createGain();
      this.masterGain.gain.value = 0.3; // Volume global
      this.masterGain.connect(this.context.destination);
    }
    if (this.context.state === 'suspended') {
      this.context.resume();
    }
  }

  /**
   * Toca um som de explosão sintetizado.
   * Usa ruído branco e osciladores para criar um efeito de impacto "retro".
   */
  playExplosion() {
    if (!this.context || !this.masterGain) return;

    const t = this.context.currentTime;
    
    // Oscilador para o "corpo" da explosão (frequência baixa caindo)
    const osc = this.context.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(100, t);
    osc.frequency.exponentialRampToValueAtTime(0.01, t + 0.5);

    // Envelope de volume (Ataque rápido, decaimento suave)
    const gain = this.context.createGain();
    gain.gain.setValueAtTime(1, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.5);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.5);
  }

  /**
   * Toca um som de coleta de item (Power-up).
   * Som agudo e rápido.
   */
  playPowerUp() {
    if (!this.context || !this.masterGain) return;

    const t = this.context.currentTime;
    const osc = this.context.createOscillator();
    osc.type = 'sine';
    
    // Efeito de "moeda" (duas notas rápidas)
    osc.frequency.setValueAtTime(600, t);
    osc.frequency.setValueAtTime(1200, t + 0.1);

    const gain = this.context.createGain();
    gain.gain.setValueAtTime(0.5, t);
    gain.gain.linearRampToValueAtTime(0, t + 0.3);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.3);
  }

  playBossSpawn() {
    if (!this.context || !this.masterGain) return;
    const t = this.context.currentTime;
    
    // Low frequency drone/warning
    const osc = this.context.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(50, t);
    osc.frequency.linearRampToValueAtTime(150, t + 2.0); // Pitch up

    const gain = this.context.createGain();
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(1, t + 0.5);
    gain.gain.linearRampToValueAtTime(0, t + 2.0);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 2.0);
  }

  playHeartbeat() {
    if (!this.context || !this.masterGain) return;

    const t = this.context.currentTime;
    const osc = this.context.createOscillator();
    osc.type = 'sine';

    const gain = this.context.createGain();
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.8, t + 0.03);
    gain.gain.linearRampToValueAtTime(0, t + 0.25);

    osc.frequency.setValueAtTime(80, t);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.3);
  }

  /**
   * Toca um som de tiro.
   * Som curto e percussivo.
   */
  playShoot() {
    if (!this.context || !this.masterGain) return;

    const t = this.context.currentTime;
    const osc = this.context.createOscillator();
    osc.type = 'square';
    osc.frequency.setValueAtTime(200, t);
    osc.frequency.exponentialRampToValueAtTime(100, t + 0.1);

    const gain = this.context.createGain();
    gain.gain.setValueAtTime(0.1, t);
    gain.gain.linearRampToValueAtTime(0, t + 0.1);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.1);
  }

  /**
   * Toca um som de impacto no inimigo.
   * Som curto e metálico.
   */
  playEnemyHit() {
    if (!this.context || !this.masterGain) return;

    const t = this.context.currentTime;
    const osc = this.context.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(300, t);
    osc.frequency.linearRampToValueAtTime(100, t + 0.1);

    const gain = this.context.createGain();
    gain.gain.setValueAtTime(0.1, t);
    gain.gain.linearRampToValueAtTime(0, t + 0.1);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.1);
  }

  /**
   * Toca um som de dano no jogador.
   * Som grave e "glitchy".
   */
  playPlayerDamage() {
    if (!this.context || !this.masterGain) return;

    const t = this.context.currentTime;
    
    // Oscilador 1: Grave
    const osc1 = this.context.createOscillator();
    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(150, t);
    osc1.frequency.linearRampToValueAtTime(50, t + 0.2);

    // Oscilador 2: Dissonante
    const osc2 = this.context.createOscillator();
    osc2.type = 'square';
    osc2.frequency.setValueAtTime(140, t); // Levemente desafinado
    osc2.frequency.linearRampToValueAtTime(40, t + 0.2);

    const gain = this.context.createGain();
    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.3);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.masterGain);

    osc1.start(t);
    osc2.start(t);
    osc1.stop(t + 0.3);
    osc2.stop(t + 0.3);
  }
}
