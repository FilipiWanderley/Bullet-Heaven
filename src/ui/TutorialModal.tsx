
import React from 'react';

interface TutorialModalProps {
  onConfirm: () => void;
}

export const TutorialModal: React.FC<TutorialModalProps> = ({ onConfirm }) => {
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/90 animate-fade-in backdrop-blur-sm touch-auto">
      <div className="min-h-full flex items-center justify-center p-4">
        <div className="w-full max-w-4xl p-6 md:p-8 border border-cyan-500/30 bg-gray-900/95 rounded-lg shadow-[0_0_50px_rgba(6,182,212,0.15)] relative">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-8 md:mb-12 text-cyan-400 tracking-widest drop-shadow-[0_0_10px_rgba(6,182,212,0.5)]">
            INSTRUÇÕES DE MISSÃO
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 mb-8 md:mb-12">
            {/* Movimento */}
            <div className="flex flex-col items-center text-center space-y-4 p-6 bg-gray-800/50 rounded-lg border border-gray-700/50 hover:border-cyan-500/50 transition-colors h-full">
              <div className="text-5xl mb-2">🕹️</div>
              <h3 className="text-xl font-bold text-white uppercase tracking-wider">Movimentação</h3>
              <div className="flex gap-2 justify-center font-mono text-sm text-gray-400 flex-wrap">
                <span className="px-2 py-1 border border-gray-600 rounded">WASD</span>
                <span className="px-2 py-1 border border-cyan-500/50 text-cyan-400 rounded">JOYSTICK</span>
              </div>
              <p className="text-sm text-gray-300 leading-relaxed">
                Use as teclas WASD no PC ou o Joystick Virtual no Mobile.
              </p>
            </div>

            {/* Combate */}
            <div className="flex flex-col items-center text-center space-y-4 p-6 bg-gray-800/50 rounded-lg border border-gray-700/50 hover:border-red-500/50 transition-colors h-full">
              <div className="text-5xl mb-2">🎯</div>
              <h3 className="text-xl font-bold text-white uppercase tracking-wider">Combate</h3>
              <div className="flex gap-2 justify-center font-mono text-sm text-gray-400 flex-wrap">
                <span className="px-2 py-1 border border-gray-600 rounded">MOUSE</span>
                <span className="px-2 py-1 border border-cyan-500/50 text-cyan-400 rounded">TOQUE</span>
              </div>
              <p className="text-sm text-gray-300 leading-relaxed">
                Mire e clique com o Mouse ou toque na tela para disparar.
              </p>
            </div>

            {/* Objetivo */}
            <div className="flex flex-col items-center text-center space-y-4 p-6 bg-gray-800/50 rounded-lg border border-gray-700/50 hover:border-yellow-500/50 transition-colors h-full">
              <div className="text-5xl mb-2">⚡</div>
              <h3 className="text-xl font-bold text-white uppercase tracking-wider">Sobrevivência</h3>
              <div className="flex gap-2 justify-center font-mono text-sm text-gray-400">
                <span className="px-2 py-1 border border-gray-600 rounded">XP</span>
                <span className="px-2 py-1 border border-gray-600 rounded">UPGRADES</span>
              </div>
              <p className="text-sm text-gray-300 leading-relaxed">
                Elimine inimigos para coletar XP e Power-ups. Sobreviva até o Boss aparecer.
              </p>
            </div>

            {/* Escudo de Proteção */}
            <div className="flex flex-col items-center text-center space-y-4 p-6 bg-gray-800/50 rounded-lg border border-gray-700/50 hover:border-blue-500/50 transition-colors h-full">
              <div className="text-5xl mb-2">🛡️</div>
              <h3 className="text-xl font-bold text-white uppercase tracking-wider">Escudo</h3>
              <div className="flex gap-2 justify-center font-mono text-sm text-gray-400 flex-wrap">
                <span className="px-2 py-1 border border-gray-600 rounded">TECLA E</span>
                <span className="px-2 py-1 border border-cyan-500/50 text-cyan-400 rounded">ÍCONE</span>
              </div>
              <p className="text-sm text-gray-300 leading-relaxed">
                Invulnerabilidade por 5s. Use contra Bosses ou quando cercado.
              </p>
            </div>

            {/* Foguete de Elite */}
            <div className="flex flex-col items-center text-center space-y-4 p-6 bg-gray-800/50 rounded-lg border border-gray-700/50 hover:border-orange-500/50 transition-colors h-full">
              <div className="text-5xl mb-2">🚀</div>
              <h3 className="text-xl font-bold text-white uppercase tracking-wider">Elite Rocket</h3>
              <div className="flex gap-2 justify-center font-mono text-sm text-gray-400 flex-wrap">
                <span className="px-2 py-1 border border-gray-600 rounded">TECLA R</span>
                <span className="px-2 py-1 border border-cyan-500/50 text-cyan-400 rounded">ÍCONE</span>
              </div>
              <p className="text-sm text-gray-300 leading-relaxed">
                Transformação por 5s: +Velocidade e +Ataque. Ideal para fugas rápidas.
              </p>
            </div>

            {/* Fundo Espacial */}
            <div className="flex flex-col items-center text-center space-y-4 p-6 bg-gray-800/50 rounded-lg border border-gray-700/50 hover:border-purple-500/50 transition-colors h-full">
              <div className="text-5xl mb-2">🌌</div>
              <h3 className="text-xl font-bold text-white uppercase tracking-wider">Espaço</h3>
              <div className="flex gap-2 justify-center font-mono text-sm text-gray-400">
                <span className="px-2 py-1 border border-gray-600 rounded">CÓSMICO</span>
              </div>
              <p className="text-sm text-gray-300 leading-relaxed">
                Ambiente espacial dinâmico. Fique atento a novos obstáculos do universo.
              </p>
            </div>
          </div>

          <div className="flex justify-center pb-4 md:pb-0">
            <button
              onClick={onConfirm}
              className="group relative px-12 md:px-16 py-4 bg-cyan-600 hover:bg-cyan-500 transition-all duration-300 clip-path-polygon active:scale-95"
              style={{ clipPath: 'polygon(10% 0, 100% 0, 90% 100%, 0% 100%)' }}
            >
              <span className="relative text-lg md:text-xl font-bold tracking-[0.2em] text-white group-hover:text-black transition-colors">
                INICIAR SISTEMAS
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
