# 🎮 Neon Survivor - Expert Grade Game Engine

<p align="center">
  <img src="public/logo.svg" alt="Neon Survivor Logo" width="600">
</p>

> **Projeto 100% desenvolvido no VS Code**, transformado em uma demonstração técnica de nível sênior. Este repositório ilustra como aplicar padrões de projeto avançados (Engine Architecture, Spatial Partitioning) e otimizações algorítmicas em um motor de jogo TypeScript.

---

## 🏗️ Arquitetura de Engine (ECS-lite)

Refatoramos o núcleo do jogo para seguir princípios de motores profissionais em C++:

- **Separação de Sistemas**: A lógica de *Physics Update* (movimento, colisão) é completamente desacoplada do *Render Loop*. Isso permite simular a física em passos fixos (se desejado) e interpolar a renderização, além de facilitar testes unitários da lógica sem dependência do Canvas.
- **Componentização**: Embora mantenhamos herança para simplicidade, as responsabilidades são divididas em "Sistemas": `PhysicsSystem`, `CollisionSystem`, `RenderSystem`.

---

## ⚡ Análise de Complexidade Algorítmica

Um dos maiores desafios em engines 2D é a detecção de colisão eficiente.

### Colisão Ingênua: $O(N^2)$
A abordagem inicial compara cada entidade com todas as outras.
- Para 1000 entidades: $1000 \times 1000 = 1.000.000$ verificações por frame.
- **Resultado**: Inviável para jogos em tempo real (FPS < 10).

### Spatial Hash Grid: $O(N)$
Implementamos uma Grade de Particionamento Espacial (`SpatialHashGrid`). O mapa é dividido em células (buckets).
1.  **Fase de Hash**: Cada entidade é atribuída a uma célula baseada em sua posição ($O(1)$).
2.  **Fase de Broad-Phase**: Para checar colisão, consultamos apenas as entidades na mesma célula e vizinhas (máximo 9 células).
3.  **Complexidade Média**: O número de verificações por entidade torna-se constante $k$ (densidade local), resultando em complexidade total linear $O(N \times k) \approx O(N)$.
- **Resultado**: 1000+ entidades a 60 FPS estáveis.

---

## 💾 Gestão de Ciclo de Vida de Memória

Em ambientes Garbage Collected (JS/V8), alocações frequentes são o inimigo da fluidez.

### Object Pooling (Zero-Alloc Loop)
Implementamos pools para `Projectiles` e `Particles`.
- **Problema**: `new Projectile()` cria lixo de memória a cada tiro. O GC pausa o jogo para limpar (Stop-the-world).
- **Solução**: Pré-alocamos arrays de objetos inativos.
    - `pool.get()`: Reutiliza uma instância existente, resetando seu estado.
    - `pool.release()`: Marca como inativo para uso futuro.
- **Impacto**: O heap de memória permanece estável durante tiroteios intensos.

### Swap-Remove
Removemos entidades de arrays usando a técnica *Swap & Pop*.
- **Padrão JS (`splice`)**: $O(N)$ - Desloca todos os elementos subsequentes.
- **Otimização**: $O(1)$ - Trocamos o elemento a remover pelo último do array e fazemos `pop()`. A ordem não importa para renderização, mas a performance é crítica.

---

## 🎨 Visual "Juice" (Polimento Sênior)

Técnicas visuais para aumentar o impacto do gameplay:

*   **Bloom & Glow**: Uso estratégico de `shadowBlur` no Canvas Context para simular emissão de luz em projéteis neon e explosões.
*   **Hit-Stop**: O Engine congela propositalmente a lógica por ~100ms ao impactar inimigos, vendendo a "força" do impacto (inspirado em jogos de luta).
*   **Motion Trails**: O Player deixa um rastro de pós-imagem, calculado via buffer circular de posições passadas com fade-out de alpha.
*   **Camera Shake**: Algoritmo de tremor com decaimento exponencial para feedback de dano.

---

## 🛠️ Stack Tecnológica

*   **Core**: TypeScript (Strict Mode), HTML5 Canvas API.
*   **Math**: Álgebra Vetorial Customizada (`Vector2`).
*   **UI**: React 18 (apenas HUD/Menus), Tailwind CSS.
*   **Tooling**: Vite, VS Code.

---

*Código limpo, arquitetura escalável e performance em primeiro lugar.*
