# Product Requirements Document (PRD) - Neon Survivor

**Versão:** 1.3 (Cyberpunk & Performance Update)  
**Data:** 20/01/2026  
**Status:** Em Desenvolvimento / Estável  
**Stack:** React 18, TypeScript, HTML5 Canvas, TailwindCSS, Vite.

---

## 1. Visão Geral do Produto
**Neon Survivor** é um jogo de ação roguelite estilo "Bullet Heaven" (similar a Vampire Survivors) rodando inteiramente no navegador. O objetivo é sobreviver a hordas infinitas de inimigos, coletar XP, subir de nível e derrotar chefes, tudo renderizado com uma estética Cyberpunk/Neon de alta performance.

## 2. Objetivos Técnicos
*   **Performance Extrema:** Garantir 60 FPS estáveis mesmo com 500+ entidades na tela.
*   **Arquitetura Desacoplada:** O Game Loop (Lógica) roda independente da renderização do React (UI).
*   **Zero Garbage Collection Spikes:** Gerenciamento de memória manual para evitar travamentos.

---

## 3. Mecânicas de Gameplay (Core Loop)

### 3.1 Controles
*   **Desktop:** Teclas `WASD` ou Setas para movimento. Mouse para mirar (opcional, dependendo da arma). `P` para Pausar.
*   **Mobile:** Joystick Virtual com zona morta ajustada e feedback visual.
*   **Mecânica de Tiro:** Automático ou direcionado, baseado na estratégia da arma equipada.

### 3.2 Progressão
*   **XP e Níveis:** Inimigos dropam orbes de XP. Coletar preenche a barra de nível.
*   **Level Up:** Ao subir de nível, o jogador recebe feedback visual (explosão de partículas e texto) e melhoria incremental de atributos.
*   **Score:** Pontuação baseada no tempo de sobrevivência e inimigos derrotados.

---

## 4. Sistema de Combate (Strategy Pattern)

O jogador utiliza diferentes estratégias de armas que podem ser alternadas via Power-Ups:

1.  **Default Blaster:** Disparo único linear, velocidade média.
2.  **Triple Shot (Shotgun):** Dispara 3 projéteis em arco (spread de 15 graus).
3.  **Orbital Shield:** 4 projéteis que orbitam o jogador e giram em espiral, criando uma zona de proteção.
4.  **Rocket Launcher:** Dispara mísseis teleguiados ou lineares com rastro de fumaça.
5.  **Triple Rocket (Ultimate):** Dispara 3 mísseis simultâneos com alto dano de área.

---

## 5. Inimigos e IA

### 5.1 Inimigo Básico (Chaser)
*   **Comportamento:** Segue o jogador linearmente.
*   **Visual:** Formas geométricas simples com rastro.
*   **Dificuldade:** Aumenta velocidade conforme o nível do jogador.

### 5.2 Rocket Enemy (Kamikaze)
*   **Comportamento:** Movimento rápido com "wobble" (oscilação), explode ao contato.
*   **Visual:** Formato de foguete, rastro de partículas neon.
*   **Morte:** Gera uma explosão massiva com partículas coloridas e shockwave.

### 5.3 Boss (The Rocket Boss)
*   **Spawn:** Aparece aos 60 segundos de jogo.
*   **Atributos:** Barra de vida visível (HUD), tamanho massivo, aura pulsante.
*   **Máquina de Estados (AI):**
    *   *Phase 1:* Perseguição lenta.
    *   *Phase 2:* Disparo de mísseis multidirecionais.
    *   *Phase 3 (Enrage):* Aumenta velocidade e agressividade quando HP < 50%.

---

## 6. Sistema de Power-Ups e Itens
Drops aleatórios com probabilidades definidas:

*   **Health Pack (45%):** Restaura 30 HP.
*   **XP Orb (55%):** Concede XP extra.
*   **Speed Boost:** Aumenta velocidade de movimento temporariamente.
*   **Shield:** Invulnerabilidade temporária.
*   **Magnet:** Atrai todos os orbes de XP próximos.
*   **Weapon Drops (Raros):** Troca a arma atual do jogador (Triple Shot, Rocket, Orbital).

---

## 7. UI/UX e "Game Juice" (Feedback Visual)

Foco total na satisfação sensorial do jogador:

*   **Screen Shake:** A tela treme ao receber dano, em explosões grandes e spawn do Boss.
*   **Damage Flash:** Vinheta vermelha e flash na tela ao receber dano.
*   **Pickup Flash:** Flash branco aditivo ("Lighter") ao coletar itens importantes.
*   **Neon Particles:** Sistema de partículas com *Additive Blending* (brilho intenso sem custo de CPU).
*   **Glitch Effect:** Tela de Game Over com distorção RGB, ruído estático e texto tremulo.
*   **HUD Otimizado:** Barras de vida e XP renderizadas via React com *throttling* para não impactar o FPS do Canvas.

---

## 8. Arquitetura Técnica (Under the Hood)

Funcionalidades de engenharia de software sênior implementadas:

### 8.1 Spatial Hash Grid V2
*   **O que é:** Algoritmo de detecção de colisão `O(N)`.
*   **Otimização V2:** Uso de chaves *Bitwise* (números inteiros) em vez de Strings para as células da grade.
*   **Resultado:** Zero alocação de memória durante a fase de física.

### 8.2 Object Pooling System
*   **O que é:** Reutilização de objetos (projéteis, partículas, inimigos) em vez de destruir/criar.
*   **Implementação:** Pools genéricos tipados.
*   **Benefício:** Elimina "lags" causados pelo Garbage Collector do navegador.

### 8.3 Renderização Híbrida
*   **Canvas API:** Usado para o jogo (60 FPS). Uso de `globalCompositeOperation = 'lighter'` para efeitos de neon via GPU.
*   **React:** Usado apenas para a camada de UI estática (Menu, HUD), atualizado a uma taxa menor (10 FPS) para poupar recursos.

---

## 9. Próximos Passos (Backlog Sugerido)
*   [ ] Sistema de Save Local (Persistência de High Score).
*   [ ] Menu de Seleção de Personagem.
*   [ ] Suporte a Gamepad físico.
*   [ ] Árvore de Habilidades (Meta-progresso).
