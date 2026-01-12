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
      <div className="text-center space-y-8 animate-fade-in flex flex-col items-center">
        <img src="/logo.svg" alt="Neon Survivor Logo" className="w-[600px] max-w-full h-auto drop-shadow-[0_0_30px_rgba(0,255,255,0.3)]" />
        
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
