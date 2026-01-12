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
    <div className="absolute inset-0 flex flex-col items-center justify-center z-50 overflow-hidden">
      {/* Background Image (Cyberpunk City) */}
      <div 
        className="absolute inset-0 bg-cover bg-center z-0 scale-105 animate-pulse-slow"
        style={{ 
            backgroundImage: 'url("https://images.unsplash.com/photo-1577113398331-d843d3341a63?q=80&w=2874&auto=format&fit=crop")',
            filter: 'brightness(0.6) blur(2px)'
        }}
      />
      
      {/* Overlay gradiente para legibilidade */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/80 z-10" />

      {/* Conteúdo */}
      <div className="relative z-20 text-center space-y-8 animate-fade-in flex flex-col items-center">
        <img src="/logo.svg" alt="Neon Survivor Logo" className="w-[600px] max-w-full h-auto drop-shadow-[0_0_30px_rgba(0,255,255,0.3)]" />
        
        <p className="text-xl text-gray-300 tracking-widest uppercase font-light drop-shadow-md">
          {subtitle}
        </p>

        <button
          onClick={onStart}
          className="group relative px-12 py-5 bg-black/50 overflow-hidden rounded-none border-2 border-cyan-500 hover:border-purple-500 transition-all duration-300 backdrop-blur-md"
        >
          <div className="absolute inset-0 w-0 bg-cyan-500/20 transition-all duration-[250ms] ease-out group-hover:w-full"></div>
          <span className="relative text-2xl font-bold tracking-[0.2em] text-cyan-400 group-hover:text-purple-300 transition-colors drop-shadow-[0_0_10px_rgba(0,255,255,0.5)]">
            {buttonText}
          </span>
        </button>
      </div>
    </div>
  );
};
