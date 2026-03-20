# Especificação UI/UX — Sistema AEE MVP
### Versão 1.0 · 13/03/2026

> **Contexto:** PWA offline-first para gestão pedagógica de alunos com NEE. Usuárias primárias: professoras operando majoritariamente em celular, em ambientes com conectividade instável.

---

## 1. Design System Básico

### 1.1 Tokens de Cor

| Token | Hex | Uso |
|---|---|---|
| `--color-primary` | `#1A6F45` | Verde escuro — botões primários, FAB, logo, nav-item ativo |
| `--color-primary-hover` | `#155838` | Estado hover/pressed do primário |
| `--color-primary-light` | `#D1F0E0` | Fundo de badges de sucesso, chips ativos |
| `--color-surface` | `#F5F5F5` | Fundo geral das telas (cinza muito claro) |
| `--color-surface-card` | `#FFFFFF` | Fundo de cards e modais |
| `--color-text-primary` | `#1C1C1E` | Texto de corpo, títulos |
| `--color-text-secondary` | `#5C5C6E` | Labels, metadados, timestamps |
| `--color-border` | `#E0E0E0` | Bordas de cards, divisores |
| `--color-status-success` | `#22A05A` | Online / salvo com sucesso |
| `--color-status-warning` | `#D97706` | Offline / sincronizando |
| `--color-status-danger` | `#DC2626` | Erro / pendência crítica |
| `--color-status-info` | `#0891B2` | Informação / lembrete neutro |

> **Ratio de contraste mínimo:** 4.5:1 para texto normal · 3:1 para texto grande (≥18px) — WCAG AA

---

### 1.2 Tipografia

| Uso | Família | Peso | Tamanho |
|---|---|---|---|
| Títulos de tela (H1) | Atkinson Hyperlegible | 700 | 22px |
| Subtítulos / seção (H2) | Atkinson Hyperlegible | 700 | 18px |
| Nome do aluno (H3) | Atkinson Hyperlegible | 700 | 16px |
| Corpo de texto | Atkinson Hyperlegible | 400 | 15px |
| Labels / Metadados | Atkinson Hyperlegible | 400 | 13px |
| Chips / Badges | Atkinson Hyperlegible | 700 | 12px |

> **Justificativa:** Atkinson Hyperlegible foi criada pela Braille Institute para maximizar legibilidade, especialmente para usuárias com baixa acuidade visual ou dislexia — alinhado à missão do AEE.

```css
@import url('https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible:wght@400;700&display=swap');

:root {
  font-family: 'Atkinson Hyperlegible', system-ui, sans-serif;
  font-size: 15px;
  line-height: 1.6;
  -webkit-font-smoothing: antialiased;
}
```

---

### 1.3 Componentes Base

#### Botões

| Variante | Aparência | Uso |
|---|---|---|
| **Primário** | Fundo `--color-primary`, texto branco, `border-radius: 12px`, `min-height: 48px`, `padding: 12px 24px` | Ação principal da tela |
| **Secundário** | Borda `--color-primary`, texto `--color-primary`, fundo transparente | Ação alternativa |
| **Destrutivo** | Fundo `--color-status-danger`, texto branco | Confirmações de remoção/arquivamento |
| **Ghost** | Sem borda, texto `--color-primary` | Ações terciárias em listas |

> **Regra de ouro:** Todos os botões e alvos tocáveis devem ter **mínimo 44×44px** de área de toque. `touch-action: manipulation` para eliminar o delay de 300ms.

#### Cards de Aluno

```
╔══════════════════════════════════════╗
║  [Avatar iniciais]  Nome do Aluno    ║
║                     Escola Atual     ║
║                     [Chip: Pendente] ║
╚══════════════════════════════════════╝
```

- `border-radius: 16px`, `box-shadow: 0 2px 8px rgba(0,0,0,0.08)`
- Borda esquerda colorida: verde (em dia), vermelho (pendências), amarelo (offline)
- Área mínima de toque: tela inteira do card → `cursor-pointer`, `min-height: 72px`

#### Chips de Status / Tag Pedagógica

- `border-radius: 20px`, `padding: 4px 12px`, `font-weight: 700`, `font-size: 12px`
- Alto contraste: texto escuro em fundo claro, ou texto branco em fundo colorido
- Variantes: `success` (verde claro + verde escuro), `warning` (âmbar), `danger` (vermelho), `neutral` (cinza)

---

## 2. Padrões de Navegação e Layout Base

### 2.1 Layout Mobile (Principal)

```
┌─────────────────────────────────────┐
│  HEADER (56px fixo no topo)         │
│  [Logo AEE]  [Título da Tela]  [🔔] │
├─────────────────────────────────────┤
│  BANNER OFFLINE (condicional, 40px) │
│  ⚠ Você está offline — salvando     │
│     localmente                      │
├─────────────────────────────────────┤
│                                     │
│  CONTEÚDO PRINCIPAL                 │
│  (scroll vertical, padding-bottom:  │
│   80px para não cobrir bottom nav)  │
│                                     │
│                          [FAB ●]    │
├─────────────────────────────────────┤
│  BOTTOM NAVIGATION BAR (56px fixo) │
│  [🏠 Home] [👤 Alunos] [📄 Docs]    │
└─────────────────────────────────────┘
```

---

### 2.2 Header

- **Altura:** 56px, `position: sticky; top: 0; z-index: 100`
- **Fundo:** `--color-surface-card` com `box-shadow: 0 1px 4px rgba(0,0,0,0.1)`
- **Conteúdo:** Logotipo AEE (canto esquerdo) · Título da tela atual (centralizado, H2) · Ícone de notificações (canto direito, apenas para Prof. AEE e Coordenação)
- **Comportamento:** Não mostra ícone de configurações nem de cadastro de usuários para Profissional de Apoio e Prof. Regente

---

### 2.3 Bottom Navigation Bar

#### Prof. AEE / Coordenação

| Tab | Ícone (SVG Lucide) | Rota |
|---|---|---|
| Home | `home` | `/dashboard` |
| Alunos | `users` | `/alunos` |
| Documentos | `file-text` | `/documentos` |
| Configurações | `settings` | `/configuracoes` |

#### Profissional de Apoio / Prof. Regente

| Tab | Ícone (SVG Lucide) | Rota |
|---|---|---|
| Meus Alunos | `users` | `/meus-alunos` |
| Registros | `file-text` | `/registros` |

> **Regra de hierarquia:** Profissional de Apoio e Prof. Regente **não têm acesso** às abas de Configurações, Dashboard global ou Cadastro de alunos. A bottom nav reflete isso com apenas 2 abas.

---

### 2.4 Componente de Status Offline / Sync

Este é o componente mais crítico para a experiência das usuárias. Ele deve ser **sempre visível e compreensível sem precisar de treinamento**.

#### Estados Possíveis

| Estado | Banner | Cor | Ícone | Comportamento |
|---|---|---|---|---|
| **Online · Sync OK** | Nenhum banner (oculto) | — | — | Estado padrão — sem ruído visual |
| **Offline** | `Você está offline · Dados salvos localmente` | `--color-status-warning` fundo âmbar claro | `wifi-off` | Banner persistente no topo do conteúdo |
| **Sincronizando** | `Sincronizando X itens...` com barra de progresso animada | âmbar | `loader-2` girando | Após reconexão |
| **Conflito detectado** | `Conflito de dados — toque para revisar` | `--color-status-danger` | `alert-triangle` | Apenas para Prof. AEE; abre diálogo de resolução |
| **Sync concluída** | `Tudo sincronizado!` (desaparece em 3s) | verde claro | `check-circle` | Toast fugaz no topo |

#### Indicador de estado no card de relatório

Todo card de relatório / foto exibe um micro-indicador:
- `●` verde: sincronizado com o servidor
- `●` âmbar + ícone de nuvem: aguardando sync
- `●` vermelho: falha no upload (tocar para tentar novamente)

---

## 3. Mapeamento Descritivo das Telas Críticas

---

### 3.1 Tela Inicial — Dashboard da Prof. AEE

**Objetivo:** Dar visão geral das pendências e acesso imediato ao registro de momento fotográfico.

```
┌─────────────────────────────────────┐
│ [Logo]   Dashboard      [🔔 3]       │  ← Header (56px)
├─────────────────────────────────────┤
│ ⚠ Você está offline · Salvando     │  ← Banner offline (âmbar, condicional)
│   localmente                        │
├─────────────────────────────────────┤
│  Olá, Valdirene 👋                  │  ← Saudação personalizada (H2)
│  13 de março de 2026                │  ← Data (text-secondary, 13px)
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ PENDÊNCIAS DA SEMANA            │ │  ← Card de resumo (destaque)
│ │                                 │ │
│ │  🔴  5 relatórios sem prazo     │ │  ← Chip danger
│ │  🟡  3 fotos aguardando sync    │ │  ← Chip warning
│ │  🟢  12 alunos em dia           │ │  ← Chip success
│ └─────────────────────────────────┘ │
│                                     │
│  Minha Carteira ──────────────────  │  ← Seção (H2 + divisor)
│                                     │
│  [Filtro: Todas as escolas ▼]       │  ← Select com min-height: 44px
│                                     │
│ ┌─ Card Aluno ──────────────────┐   │
│ │ 🔴│ [AM] Artur Mendes         │   │  ← Borda vermelha = pendência
│ │   │ E.M. Flores do Campo      │   │
│ │   │ [Rel. AEE pendente]       │   │  ← Chip danger
│ └───────────────────────────────┘   │
│                                     │
│ ┌─ Card Aluno ──────────────────┐   │
│ │ 🟢│ [LC] Laura Carvalho       │   │  ← Borda verde = em dia
│ │   │ E.M. Ipê Amarelo          │   │
│ │   │ [Em dia ✓]                │   │
│ └───────────────────────────────┘   │
│                                     │
│                    ┌──────────────┐ │
│                    │  📸 Registrar │ │  ← FAB — botão verde proeminente
│                    │   Momento    │ │     (56px height, right: 16px,
│                    └──────────────┘ │      bottom: 72px acima do nav)
├─────────────────────────────────────┤
│ [🏠 Home] [👤 Alunos] [📄] [⚙️]    │  ← Bottom Nav
└─────────────────────────────────────┘
```

**Detalhes de Interação:**
- O FAB `📸 Registrar Momento` usa `position: fixed; bottom: 72px; right: 16px` — sempre acessível independente do scroll
- FAB tem `min-width: 160px; min-height: 56px; border-radius: 28px` e sombra proeminente (`box-shadow: 0 4px 16px rgba(26,111,69,0.4)`)
- Tocar num card de aluno navega para o Perfil do Aluno (`/alunos/:id`)
- Cards têm `active:scale-98` para feedback tátil

---

### 3.2 Fluxo "Registrar Momento" — Modal de 3 Toques

**Objetivo:** Foto pedagógica salva em no máximo 3 toques, funciona offline.

O modal ocupa **90% da altura da tela** (bottom sheet), sobreposto à tela atual.

#### Passo 1 — Foto (Toque 1 = abrir modal)

```
┌─────────────────────────────────────┐
│ ╳  Registrar Momento         [1/3]  │  ← Handle de fechar + passo atual
│─────────────────────────────────────│
│                                     │
│  ┌─────────────────────────────┐    │
│  │                             │    │
│  │   [Preview da câmera /      │    │
│  │    imagem selecionada]      │    │  ← Área principal (16:9)
│  │                             │    │
│  └─────────────────────────────┘    │
│                                     │
│   ┌─────────────┐ ┌─────────────┐   │
│   │  📷 Câmera  │ │ 🖼 Galeria  │   │  ← 2 botões iguais em largura
│   └─────────────┘ └─────────────┘   │     min-height: 52px
│                                     │
│  ● ○ ○   [Próximo →]               │  ← Progresso + botão primário
└─────────────────────────────────────┘
```

#### Passo 2 — Aluno (Toque 2 = confirmar foto)

```
┌─────────────────────────────────────┐
│ ←  Registrar Momento         [2/3]  │
│─────────────────────────────────────│
│                                     │
│  Para qual aluno?                   │  ← Label claro (H2)
│                                     │
│  ┌─────────────────────────────┐    │
│  │ 🔍 Buscar aluno...          │    │  ← Input de autocomplete
│  └─────────────────────────────┘    │  ← min-height: 52px
│                                     │
│  Recentes:                          │  ← Lista de atalho (últimos 3)
│  ┌─────────────────────────────┐    │
│  │ [AM] Artur Mendes           │    │  ← Item com avatar de iniciais
│  │ [LC] Laura Carvalho         │    │
│  │ [BF] Brenda Felix           │    │
│  └─────────────────────────────┘    │
│                                     │
│  ● ● ○   [Próximo →]               │
└─────────────────────────────────────┘
```

#### Passo 3 — Tag Pedagógica (Toque 3 = Salvar)

```
┌─────────────────────────────────────┐
│ ←  Registrar Momento         [3/3]  │
│─────────────────────────────────────│
│                                     │
│  Qual é o contexto deste momento?  │  ← Label motivacional
│                                     │
│  ┌──────────┐  ┌──────────────┐    │
│  │ Autonomia│  │ Comunicação  │    │  ← Tags como chips grandes
│  └──────────┘  └──────────────┘    │     min-height: 52px, selecionável
│  ┌──────────┐  ┌──────────────┐    │     (toque toggling cor primária)
│  │Motor Fino│  │ Socialização │    │
│  └──────────┘  └──────────────┘    │
│  ┌──────────┐                      │
│  │  Outro   │                      │
│  └──────────┘                      │
│                                     │
│  ● ● ●   [✓ Salvar e Fechar]       │  ← Botão primário verde
└─────────────────────────────────────┘
```

**Após salvar:**
- Modal fecha com animação `slide-down` (300ms)
- Toast **verde** aparece: `"Momento registrado! ☁ Sync pendente"` (se offline) ou `"Momento salvo ✓"` (se online)
- Dado gravado imediatamente em IndexedDB — sem esperar rede

---

### 3.3 Perfil do Aluno — Timeline e Galeria

**Objetivo:** Visão consolidada do aluno com histórico pedagógico e fotos.

```
┌─────────────────────────────────────┐
│ ←  Artur Mendes            [⋮]      │  ← Header com nome + menu overflow
├─────────────────────────────────────┤
│ ⚠ Offline · 2 itens não sincroniz. │  ← Banner offline (se aplicável)
├─────────────────────────────────────┤
│ [Avatar]  Artur Mendes              │  ← Seção de identidade
│           E.M. Flores do Campo      │     Avatar: iniciais em círculo
│           ●  Ativo                  │     verde (color-primary-light)
│                                     │
│  [🔴 Rel. AEE pendente]             │  ← Chip de pendência
│                                     │
│  [Tabs: Documentos | Galeria]       │  ← Tab switcher com underline ativo
│                                     │
│ ── ABA: DOCUMENTOS ────────────────  │
│                                     │
│  + Novo Relatório AEE              │  ← Botão secundário (só Prof. AEE)
│                                     │
│ ▼ 2026                              │  ← Accordion de ano
│  ┌─────────────────────────────┐   │
│  │ 📄 Relatório AEE · Mar 26   │   │  ← Card de documento
│  │    Por: Valdirene            │   │
│  │    ● Sincronizado            │   │  ← Micro-indicador de sync
│  │    [Abrir]        [PDF]      │   │  ← 2 botões ghost
│  └─────────────────────────────┘   │
│  ┌─────────────────────────────┐   │
│  │ 📄 Relatório Anual · Jan 26 │   │
│  │    Por: Valdirene            │   │
│  │    ⟳ Aguardando sync        │   │  ← Micro-indicador âmbar
│  │    [Abrir]        [PDF]      │   │
│  └─────────────────────────────┘   │
│                                     │
│ ── ABA: GALERIA ───────────────────  │
│                                     │
│  [🗓 Filtrar por tag ▼]             │
│                                     │
│  ┌────┐ ┌────┐ ┌────┐             │  ← Grid 3 colunas de fotos
│  │img │ │img │ │img │             │     aspect-ratio: 1/1, border-radius: 8px
│  │Auto│ │Comm│ │Mot.│             │     Tag pedagógica sobreposta (chip)
│  └────┘ └────┘ └────┘             │
│  ┌────┐ ┌────┐ ┌────┐             │
│  │img │ │img │ │⟳   │             │  ← Foto aguardando upload
│  │Soc.│ │Auto│ │    │             │     overlay âmbar semi-transparente
│  └────┘ └────┘ └────┘             │
│                                     │
│                    [FAB: 📸]        │  ← FAB apenas para Prof. AEE
├─────────────────────────────────────┤
│ [🏠 Home] [👤 Alunos] [📄] [⚙️]    │
└─────────────────────────────────────┘
```

**Detalhes de Interação:**
- Tabs com `underline` animado (transition: 200ms) — não usar fundo preenchido para não confundir com botão
- Accordion de ano: aberto por padrão o **ano atual**, demais colapsados
- Toque em foto: abre lightbox fullscreen com nome do aluno, data, tag e autor
- Botão `[PDF]` gera e faz download imediatamente (client-side rendering)
- Campos sensíveis (diagnóstico/laudo) são **ocultados** na tela — acessíveis apenas via botão explícito `"Ver laudo"` (apenas Prof. AEE / Coordenação) que gera entry no `audit_log`

---

### 3.4 Tela Inicial Simplificada — Profissional de Apoio / Prof. Regente

**Objetivo:** Interface reduzida ao essencial — lista dos seus alunos e acesso rápido ao relatório autorizado.

> **Auto-correção aplicada:** Esta tela **não contém** botão de Registrar Momento FAB (upload é exclusivo da Prof. AEE), não contém aba de Configurações, não exibe dados de outros alunos nem pendências globais. A bottom nav tem apenas 2 abas.

```
┌─────────────────────────────────────┐
│ [Logo]   Meus Alunos                │  ← Header sem notificações
├─────────────────────────────────────┤
│ ⚠ Você está offline · Salvando    │  ← Banner offline (âmbar, condicional)
│   localmente                        │
├─────────────────────────────────────┤
│  Olá, Gabriela 👋                   │  ← Saudação (H2)
│  13 de março, 2026                  │
│                                     │
│  Você tem 2 relatórios              │  ← Resumo contextual simples
│  a preencher este trimestre         │  ← Sem números de outros usuários
│                                     │
│ ┌─ Card Aluno ──────────────────┐   │
│ │ 🔴│ [AM] Artur Mendes         │   │  ← Borda vermelha = rel. pendente
│ │   │ 5º Ano — E.M. Flores      │   │
│ │   │ [Rel. Anual pendente]     │   │  ← Label do documento pendente
│ │   │       [→ Preencher agora] │   │  ← CTA direto (botão primário)
│ └───────────────────────────────┘   │
│                                     │
│ ┌─ Card Aluno ──────────────────┐   │
│ │ 🟢│ [JS] Juliana Santos       │   │  ← Em dia
│ │   │ 3º Ano — E.M. Ipê Amarelo │   │
│ │   │ [Em dia ✓]                │   │
│ │   │              [→ Ver perfil]│   │  ← Ação secundária
│ └───────────────────────────────┘   │
│                                     │
│  ── Não há mais alunos vinculados ──│  ← Estado final da lista
│                                     │
│ ⚠ Se precisar de ajuda, contate   │  ← Texto informativo passivo
│   a Professora AEE                  │  ← Sem botão de "Adicionar aluno"
├─────────────────────────────────────┤
│    [👤 Meus Alunos]  [📄 Registros] │  ← Bottom Nav simplificado (2 abas)
└─────────────────────────────────────┘
```

**Detalhes de Interação:**
- **Profissional de Apoio:** O botão primário em cards abre o editor de **Relatório Anual**
- **Prof. Regente:** O botão primário em cards abre o editor de **Relatório Trimestral**
- A tela sabe qual papel está logado e adapta o label do botão automaticamente
- Sem editor de template disponível — templates são pré-definidos pela Prof. AEE
- Fotos: a Profissional de Apoio/PI **pode adicionar fotos** dentro do perfil do aluno, mas **não através do FAB** (o FAB não existe nesta visão)
- O banner offline é idêntico ao da Prof. AEE — mesma visibilidade, mesma urgência

---

## 4. Checklist de Auto-Revisão UX

| Critério | Verificação |
|---|---|
| Hierarquia de acesso respeitada | ✅ Profissional de Apoio/PI não vê configurações, cadastros ou dashboard global |
| FAB de registro visível na Home da Prof. AEE | ✅ `position: fixed`, acima do nav, sempre acessível |
| Estado offline visível em todas as telas | ✅ Banner condicional no topo do conteúdo em toda tela |
| Área de toque mínima 44×44px | ✅ Todos os botões, chips e cards respeitam o mínimo |
| Contraste WCAG AA (4.5:1) | ✅ Paleta `#1C1C1E` sobre `#F5F5F5` → ratio 15:1 |
| Fluxo de 3 toques para Registrar Momento | ✅ Passo 1 (foto) → Passo 2 (aluno) → Passo 3 (tag + salvar) |
| Dados sensíveis ocultados por padrão | ✅ Laudo/diagnóstico atrás de botão explícito com auditoria |
| Profissional de Apoio/PI não vê botão de Registrar Momento (FAB) | ✅ FAB não existe na visão simplificada |
| Indicador de sync por item | ✅ Micro-indicador `●` em cada card de relatório e foto |
| Tipografia acessível e legível | ✅ Atkinson Hyperlegible — otimizada para legibilidade |

---

*Especificação gerada com base no PRD final (v1.1), design.md e análise da skill ui-ux-pro-max.*
*Próximo passo: protótipo de alta fidelidade e design de telas secundárias (Edição de Relatório, Configurações, Login).*
