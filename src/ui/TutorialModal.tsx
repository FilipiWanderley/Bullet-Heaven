
import React from 'react';

interface TutorialModalProps {
  onConfirm: () => void;
}

export const TutorialModal: React.FC<TutorialModalProps> = ({ onConfirm }) => {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-black/90 z-50 animate-fade-in backdrop-blur-sm">
      <div className="w-full max-w-4xl p-8 border border-cyan-500/30 bg-gray-900/80 rounded-lg shadow-[0_0_50px_rgba(6,182,212,0.15)]">
        <h2 className="text-4xl font-bold text-center mb-12 text-cyan-400 tracking-widest drop-shadow-[0_0_10px_rgba(6,182,212,0.5)]">
          INSTRUÇÕES DE MISSÃO
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {/* Movimento */}
          <div className="flex flex-col items-center text-center space-y-4 p-6 bg-gray-800/50 rounded-lg border border-gray-700/50 hover:border-cyan-500/50 transition-colors">
            <div className="text-5xl mb-2">🕹️</div>
            <h3 className="text-xl font-bold text-white uppercase tracking-wider">Movimentação</h3>
            <div className="flex gap-2 justify-center font-mono text-sm text-gray-400">
              <span className="px-2 py-1 border border-gray-600 rounded">W</span>
              <span className="px-2 py-1 border border-gray-600 rounded">A</span>
              <span className="px-2 py-1 border border-gray-600 rounded">S</span>
              <span className="px-2 py-1 border border-gray-600 rounded">D</span>
            </div>
            <p className="text-sm text-gray-300 leading-relaxed">
              Use as teclas WASD ou as Setas do teclado para pilotar sua nave através do grid.
            </p>
          </div>

          {/* Combate */}
          <div className="flex flex-col items-center text-center space-y-4 p-6 bg-gray-800/50 rounded-lg border border-gray-700/50 hover:border-red-500/50 transition-colors">
            <div className="text-5xl mb-2">🎯</div>
            <h3 className="text-xl font-bold text-white uppercase tracking-wider">Combate</h3>
            <div className="flex gap-2 justify-center font-mono text-sm text-gray-400">
              <span className="px-2 py-1 border border-gray-600 rounded">MOUSE</span>
            </div>
            <p className="text-sm text-gray-300 leading-relaxed">
              Mire com o cursor e CLIQUE para disparar seus canhões de plasma.
            </p>
          </div>

          {/* Objetivo */}
          <div className="flex flex-col items-center text-center space-y-4 p-6 bg-gray-800/50 rounded-lg border border-gray-700/50 hover:border-yellow-500/50 transition-colors">
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
        </div>

        <div className="flex justify-center">
          <button
            onClick={onConfirm}
            className="group relative px-16 py-4 bg-cyan-600 hover:bg-cyan-500 transition-all duration-300 clip-path-polygon"
            style={{ clipPath: 'polygon(10% 0, 100% 0, 90% 100%, 0% 100%)' }}
          >
            <span className="relative text-xl font-bold tracking-[0.2em] text-white group-hover:text-black transition-colors">
              INICIAR SISTEMAS
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
