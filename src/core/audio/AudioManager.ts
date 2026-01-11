
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
      this.context = new (window.AudioContext || (window as any).webkitAudioContext)();
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
}
