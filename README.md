# Neon Survivor 🕹️

> Um Roguelike de sobrevivência espacial de alto desempenho construído do zero com TypeScript e Canvas API.

## 🚀 Sobre o Projeto

Neon Survivor é um jogo de ação frenética onde você controla uma nave em um espaço infinito, combatendo hordas de inimigos e enfrentando chefes poderosos. O projeto foi desenvolvido com foco em **Performance**, **Arquitetura de Software** e **Clean Code**.

### 🛠️ Stack Tecnológica

- **Frontend**: React 18
- **Linguagem**: TypeScript (Strict Mode)
- **Renderização**: HTML5 Canvas API (High Performance)
- **Estilização**: TailwindCSS
- **Bundler**: Vite

---

## 🧠 Arquitetura e Design Patterns

Este projeto demonstra o uso prático de padrões de projeto avançados para resolver problemas reais de desenvolvimento de jogos.

### 1. Game Loop Pattern 🔄
O coração do jogo. Separamos a lógica de **Update** (Física, IA, Regras) da lógica de **Draw** (Renderização).
- **Update**: Roda em delta-time fixo ou variável para garantir movimento suave independente da taxa de quadros.
- **Draw**: Renderiza o estado atual o mais rápido possível (requestAnimationFrame).

### 2. Strategy Pattern (Sistema de Armas) 🔫
Para permitir que o jogador troque de armas dinamicamente sem encher o código do Player de `if/else`, utilizamos o padrão Strategy.
- **Interface**: `WeaponStrategy` define o contrato `shoot()`.
- **Concretas**: `DefaultWeaponStrategy`, `TripleShotWeaponStrategy`, `OrbitalFireStrategy`.
- **Benefício**: Adicionar uma nova arma é tão simples quanto criar uma nova classe, sem tocar na classe `Player`.

### 3. State Machine (Fluxo de Jogo) 🚦
O jogo transita entre estados bem definidos para controlar o fluxo e a UI.
- **Estados**: `START` -> `PLAYING` -> `BOSS_FIGHT` -> `GAMEOVER`.
- **Benefício**: Impede comportamentos indesejados (ex: inimigos spawnando na tela de menu) e facilita o gerenciamento da UI.

### 4. Object Pooling (Gerenciamento de Memória) ♻️
Criar e destruir objetos (como balas e partículas) milhares de vezes por segundo causa travamentos devido ao Garbage Collector.
- **Solução**: Pré-alocamos um "pool" de objetos inativos. Quando precisamos de um, pegamos do pool. Quando ele "morre", devolvemos ao pool em vez de destruir.
- **Resultado**: Zero alocações de memória durante o gameplay intenso = 60 FPS cravados.

### 5. Spatial Hash Grid (Otimização de Colisão) 🗺️
Checar colisão de "todos contra todos" tem complexidade O(N²), o que mata a performance com muitos inimigos.
- **Solução**: Dividimos o mundo em uma grade. Só checamos colisão entre objetos que estão na mesma célula da grade.
- **Resultado**: Complexidade próxima de O(N), permitindo centenas de inimigos na tela.

---

## 🎮 Como Jogar

1. **Movimento**: W, A, S, D ou Setas.
2. **Tiro**: Mouse (Clique para atirar na direção do cursor).
3. **Objetivo**: Sobreviva o máximo de tempo possível e derrote o **CYBER LORD**.

### Dicas
- Colete **XP (Azul)** para subir de nível e curar sua nave.
- O Boss aparece após **60 segundos** de sobrevivência.
- Fique atento à sua barra de vida no topo da tela!

---

## 📦 Instalação e Execução

```bash
# Instalar dependências
npm install

# Rodar servidor de desenvolvimento
npm run dev
```

---

*Desenvolvido com 💜 e TypeScript.*
