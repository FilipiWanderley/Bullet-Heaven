# 🎮 Neon Survivor - Enterprise Grade Survival Engine

> **Desenvolvido inteiramente no VS Code**, este projeto representa uma implementação robusta e escalável de um motor de jogo 2D, utilizando práticas modernas de Engenharia de Software e a stack mais performática do ecossistema React.

---

## 🔭 Visão Geral

O **Neon Survivor** não é apenas um jogo; é uma demonstração técnica de um **Game Loop** determinístico desacoplado da camada de renderização. O coração do sistema é o `Survival Engine`, um motor físico leve capaz de gerenciar centenas de entidades simultâneas, detecção de colisão espacial e lógica de progressão (RPG), tudo rodando a 60 FPS estáveis.

A arquitetura foi desenhada para separar estritamente a **Lógica de Domínio (Core)** da **Camada de Apresentação (UI)**, garantindo manutenibilidade e testabilidade.

---

## 🛠️ Stack Técnica

A escolha tecnológica priorizou performance bruta e tipagem estrita:

- **Core**: TypeScript (Strict Mode) & HTML5 Canvas API (Renderização de baixo nível).
- **UI/HUD**: React 18+ (Gerenciamento de interfaces complexas).
- **Estilização**: Tailwind CSS (Design System atômico e responsivo).
- **Build Tool**: Vite (HMR instantâneo e build otimizado).
- **IDE**: VS Code (Com configurações avançadas de Linting e Debugging).

---

## 📐 Engenharia de Software

### 1. Física Vetorial (Vector Math)
Toda a movimentação e posicionamento utilizam uma implementação customizada de **Álgebra Linear** (`Vector2`).
- **Normalização de Vetores**: Garante que a velocidade diagonal não exceda a velocidade linear (o clássico bug de mover-se mais rápido na diagonal foi matematicamente eliminado).
- **Cálculos de Direção**: Uso de vetores unitários para cálculos precisos de trajetória de projéteis e perseguição de inimigos.

### 2. Arquitetura Desacoplada
O `GameEngine` opera independentemente do React.
- **Game Loop Customizado**: Um hook `useGameLoop` gerencia o ciclo de atualização usando `requestAnimationFrame` e cálculos de `deltaTime`, garantindo que a física do jogo seja independente da taxa de quadros (frame-independent physics).
- **Estado Reativo Controlado**: O estado do jogo é sincronizado com o React apenas quando necessário (ex: mudanças no HUD), evitando re-renders custosos e "Jank" na animação.

### 3. Ciclo de Vida de Entidades
Implementação de polimorfismo através de classes base abstratas (`GameObject`), permitindo que `Player`, `Enemy` e `Projectile` compartilhem comportamentos físicos enquanto especializam suas lógicas de jogo.

---

## ⚔️ Desafios Vencidos

### Performance de Renderização
Renderizar centenas de inimigos e partículas via DOM (HTML Elements) seria inviável.
- **Solução**: Uso da **Canvas API** para desenhar todas as entidades em um único contexto 2D (Batch Rendering implícito), delegando ao React apenas a UI estática (Menus, HUD).

### Gestão de Memória (Garbage Collection)
Em jogos de sobrevivência, a criação e destruição de objetos é constante. Deixar referências soltas causaria *Memory Leaks* fatais.
- **Solução**: Implementação de um sistema de **Manual Garbage Collection** no final de cada frame. Entidades marcadas como "mortas" ou projéteis fora da tela são removidos dos arrays de controle imediatamente, mantendo o heap de memória limpo e previsível.

---

## 🚀 Como Rodar

Este projeto foi otimizado para o **VS Code**. Siga os passos abaixo para iniciar o ambiente de desenvolvimento:

1. **Instale as dependências**:
   ```bash
   npm install
   ```

2. **Execute o servidor de desenvolvimento**:
   ```bash
   npm run dev
   ```

3. **Acesse o jogo**:
   O servidor iniciará automaticamente (geralmente em `http://localhost:5173`).

---

*Desenvolvido com paixão e rigor técnico.*
