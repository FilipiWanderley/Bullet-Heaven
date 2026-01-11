import React from 'react';

interface StartScreenProps {
  onStart: () => void;
  title?: string;
  subtitle?: string;
  buttonText?: string;
}

/**
 * Componente de tela inicial/menu.
 * Exibe o título do jogo e um botão para iniciar.
 */
export const StartScreen: React.FC<StartScreenProps> = ({
  onStart,
  title = "NEON SURVIVOR",
  subtitle = "Sobreviva ao enxame cibernético",
  buttonText = "INICIAR MISSÃO"
}) => {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm z-50">
      <div className="text-center space-y-8 animate-fade-in">
        <h1 className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-600 drop-shadow-[0_0_15px_rgba(6,182,212,0.5)]">
          {title}
        </h1>
        
        <p className="text-xl text-gray-300 tracking-widest uppercase">
          {subtitle}
        </p>

        <button
          onClick={onStart}
          className="group relative px-8 py-4 bg-transparent overflow-hidden rounded-none border border-cyan-500 hover:border-purple-500 transition-all duration-300"
        >
          <div className="absolute inset-0 w-0 bg-cyan-500/20 transition-all duration-[250ms] ease-out group-hover:w-full"></div>
          <span className="relative text-xl font-bold tracking-widest text-cyan-400 group-hover:text-purple-300 transition-colors">
            {buttonText}
          </span>
        </button>
      </div>
    </div>
  );
};
