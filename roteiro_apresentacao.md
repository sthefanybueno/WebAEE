# 🎤 Roteiro de Apresentação de 10 Minutos — Sistema WebAEE
> **Tema:** Frontend PWA com Clean Architecture, Sincronização Local-First e Conformidade com a LGPD.
> **Apresentadora:** Sthefany Bueno  
> **Tempo Estimado Total:** 10 minutos (600 segundos) — Conversacional, dinâmico e tecnicamente aprofundado.

As frases em **negrito** são os seus **pontos de âncora**: coloque mais energia na voz ao dizê-las para demonstrar domínio técnico e reter a atenção da banca examinadora.

---

## 🗺️ Cronômetro e Divisão de Tempo (600 segundos)

| Slide | Título | Tempo Sugerido | Cronômetro Acumulado | Foco do Discurso |
|---|---|---|---|---|
| **01** | Capa | **60s** | `01:00` | Apresentação pessoal e divisão arquitetural |
| **02** | O Sistema WebAEE & Regras | **90s** | `02:30` | Dores das escolas (offline), fluxos e Matriz RBAC |
| **03** | Evolução e Escolhas Tecnológicas | **110s** | `04:20` | Stacks conceituais, Tailwind v4 vs v3, React 19 `useOptimistic` |
| **04** | Camada de Domínio & Modelos | **85s** | `05:45` | Pureza de Domínio, tabelas do schema Dexie e tipos TS |
| **05** | Camada de Aplicação & Hooks | **90s** | `07:15` | Reatividade sem polling, serviço de escrita e `useLiveQuery` |
| **06** | Infraestrutura HTTP & LGPD | **85s** | `08:40` | Cliente encapsulado, interceptador 401 e query SQL de auditoria |
| **07** | Garantia de Qualidade & Testes | **90s** | `10:10` | Suite Vitest BDD, isolamento assíncrono e asserções da fila |
| **08** | Conclusão & Próximos Passos | **80s** | `11:30` | Resumo de ganhos, impacto social e cronograma de roadmap |

*(Nota: O tempo total planejado é de 10 a 11 minutos, proporcionando uma margem confortável para pausas e respiração entre as transições).*

---

## Slide 01 — Capa
* **Duração:** 60 segundos (`00:00` a `01:00`)  
* **Ação na Tela:** Slide 1 aberto com tema verde escolar sálvia premium e letras ampliadas. Olhe para a banca com confiança.

### 🗣️ O que falar:
> *"Olá, muito boa tarde a todos os membros da banca examinadora. Meu nome é **Sthefany Bueno** e hoje apresento com grande entusiasmo a defesa arquitetural do frontend do **Sistema AEE — Atendimento Educacional Especializado**.*
>
> *O objetivo principal deste projeto desenvolvido para o Laboratório de Programação Web foi criar uma aplicação PWA moderna, robusta e inclusiva, construída sobre três pilares técnicos inegociáveis: **Clean Architecture, sincronização Local-First de alta tolerância offline e conformidade absoluta com a LGPD**.*
>
> *Ao longo desta apresentação, demonstrarei como dividimos as responsabilidades do frontend para garantir que dados sensíveis de menores permaneçam blindados, enquanto oferecemos uma experiência de usuário fluida e responsiva para os professores do ensino público."*

---

## Slide 02 — O Sistema WebAEE & Regras de Negócio
* **Duração:** 90 segundos (`01:00` a `02:30`)  
* **Ação na Tela:** Avance para o **Slide 2**. Aponte para o diagrama superior de 4 etapas e, em seguida, guie os olhos da banca para a **Tabela de Permissões (RBAC) com badges coloridos**.

### 🗣️ O que falar:
> *"Antes de mergulharmos no código, precisamos compreender o domínio do negócio. O sistema gerencia a rotina do Atendimento Educacional Especializado. Como lidamos diretamente com laudos médicos e históricos pedagógicos de menores de idade, **a LGPD guiou todo o design e arquitetura da nossa interface**.*
>
> *Por padrão, diagnósticos e informações clínicas ficam ocultos na tela, exigindo uma ação voluntária de revelar. No topo do slide, vocês observam nosso fluxo offline-first: o professor cadastra o aluno com consentimento, preenche o Plano de Desenvolvimento Individualizado (PDI), anexa relatórios pedagógicos e fotos locais e a sincronização com o banco centralizado ocorre em segundo plano.*
>
> *Para proteger esses dados, estruturamos a **Matriz de Permissões Granulares (RBAC)** que vocês veem na base da tela. O Administrador tem controle de escrita total. O Coordenador gerencia a escola. O Professor AEE escreve apenas nos alunos sob seu vínculo direto. Os Professores de Apoio e Regentes têm acesso drasticamente limitado a leituras básicas. Nós garantimos diretamente no roteamento e injeção do frontend que **um professor de apoio ou regente jamais acesse um laudo ou diagnóstico clínico que compete estritamente ao administrador ou ao coordenador da unidade**."*

---

## Slide 03 — Evolução e Escolhas Tecnológicas
* **Duração:** 110 segundos (`02:30` a `04:20`)  
* **Ação na Tela:** Avance para o **Slide 3**. Destaque a stack à esquerda e as decisões críticas à direita. Em seguida, guie a banca para a **base do slide com os dois snippets de código ampliados**.

### 🗣️ O que falar:
> *"Em termos de stack, adotamos Next.js 16 e React 19, mas a nossa decisão crítica de engenharia foi adotar a **Estratégia Local-First com IndexedDB e Dexie.js** em substituição ao LocalStorage. As salas de recursos escolares das redes públicas sofrem com sinal de rede muito oscilante. O navegador precisava ser nosso banco de dados primário, com espaço livre de gigabytes e suporte transacional.*
>
> ***Se vocês olharem os exemplos de código aqui embaixo na base**, verão duas implementações fundamentais da nossa stack:*
>
> * * **À esquerda, a nossa evolução para o Tailwind CSS v4.0:** Notem que eliminamos aquele antigo arquivo estático de configuração em JavaScript e adotamos uma **abordagem CSS-First puramente declarativa**. Nós importamos o tailwindcss diretamente e customizamos os tokens de estilo no bloco `@theme`, injetando variáveis nativas (como `--color-brand-primary` e `--radius-xl`). Isso é compilado nativamente por um compilador ultrarrápido em Rust, reduzindo o tempo de build e o tamanho dos arquivos enviados pelo ar.*
>
> * * **À direita, o gerenciamento otimista do React 19:** Para que a interface não sofra travamentos (freeze) enquanto o banco processa dados, nós usamos o hook `useOptimistic`. Ele recebe o array base `alunos` e uma função redutora. No momento em que o professor salva um novo cadastro, a lista na tela atualiza instantaneamente por meio do estado otimista, enquanto a inserção transacional no IndexedDB e o sync remoto ocorrem em segundo plano de forma silenciosa. Com isso, **nós zeramos completamente a percepção de latência do usuário no preenchimento do PDI**."*

---

## Slide 04 — Camada de Domínio & Modelos Locais
* **Duração:** 85 segundos (`04:20` a `05:45`)  
* **Ação na Tela:** Avance para o **Slide 4**. Explique a isolação de regras no topo e aponte para os **dois painéis de código no rodapé (Dexie Schema e Interfaces TypeScript)**.

### 🗣️ O que falar:
> *"Seguindo a risca os princípios da Clean Architecture, a nossa camada de **Domínio** é 100% pura. Ela não sabe o que é uma requisição HTTP ou um endpoint FastAPI. É aqui que definimos as nossas entidades locais e a lógica da nossa **Fila de Sincronização Transacional com Precedência**.*
>
> ***Nas evidências de código posicionadas abaixo**, demonstramos esse encapsulamento:*
>
> * * **À esquerda, o Schema local no Dexie (`db.ts`):** Estendemos a classe `Dexie` e declaramos nossas tabelas, como `alunos`, `relatorios`, `fotos` e a fila de tarefas `sync_queue`. Notem que usamos um incremental automático `++id` como chave primária estritamente local (evitando requisições de ID na nuvem durante o modo offline) e indexamos propriedades como `sync_status` e `updated_at` para acelerar filtros de busca local.*
>
> * * **À direita, as Interfaces e Contratos TypeScript Estritos:** A propriedade `sync_status` recebe a união tipada `'synced' | 'pending'`. A entidade `SyncQueueItem` encapsula de forma genérica a entidade afetada, a operação realizada (`create`, `update`, `delete`) e um payload dinâmico. Isso garante que a nossa fila de sync processe qualquer alteração de forma genérica, **blindando o banco local contra qualquer inserção de dados inconsistentes**."*

---

## Slide 05 — Camada de Aplicação & Hooks Reativos
* **Duração:** 90 segundos (`05:45` a `07:15`)  
* **Ação na Tela:** Avance para o **Slide 5**. Comente a reatividade local no topo e mostre os **dois exemplos práticos integrados no rodapé (Serviço de Escrita e Hook de Leitura)**.

### 🗣️ O que falar:
> *"Na camada de Aplicação, nós implementamos os nossos Casos de Uso. Um grande avanço foi que **nós abandonamos completamente o polling** — a aplicação não fica sobrecarregando o servidor com requisições HTTP repetitivas para saber se há dados novos. A nossa interface é **100% reativa às mutações do banco local**.*
>
> ***Como mostro nas implementações de código abaixo:**
>
> * * **À esquerda, o Serviço de Escrita (`salvarAlunoLocal`):** Esta função encapsula o caso de uso de salvar. Ela recebe os dados, insere de forma assíncrona no IndexedDB local com status `'pending'` e, no mesmo bloco, chama a função `enqueue` para inserir a tarefa correspondente na fila `sync_queue` com prioridade 2. Percebam que a lógica de rede não reside no componente; a persistência local é o limite da responsabilidade do serviço.*
>
> * * **À direita, o Hook Customizado de Leitura (`useAlunos`):** Para expor os dados à interface de forma limpa, criamos um hook reativo que usa o `useLiveQuery` da biblioteca `dexie-react-hooks`. Esse hook atua como um padrão *Observer* nativo de banco de dados. Ele executa a query local em IndexedDB e se subscreve a ela. No momento exato em que o serviço de escrita grava um aluno no IndexedDB, **o hook capta a alteração de forma imediata e re-renderiza a tela do professor automaticamente**, sem precisarmos escrever `useEffect` complexos ou gerenciamento de estado global manual."*

---

## Slide 06 — Infraestrutura HTTP & Proteção LGPD
* **Duração:** 85 segundos (`07:15` a `08:40`)  
* **Ação na Tela:** Avance para o **Slide 6**. Destaque a proteção e auditoria no topo e guie os olhos da banca examinadora para os **snippets inferiores (apiClient e Query SQL de auditoria)**.

### 🗣️ O que falar:
> *"Na camada de Infraestrutura, nós isolamos a rede. Aplicamos a regra rígida de que **é proibido realizar chamadas brutas de API (`fetch`) soltas nos componentes de visualização**. Todo o tráfego de rede passa obrigatoriamente por um `apiClient` encapsulado, o que nos deu uma barreira de proteção ativa.*
>
> ***Vejam as evidências técnicas posicionadas abaixo:**
>
> * * **À esquerda, o nosso interceptor de requisições:** O cliente injeta o token JWT `Bearer` do cabeçalho automaticamente a cada chamada de rede. E aqui está a nossa barreira LGPD contra falhas humanas: se a API retornar erro status **401 Unauthorized** (sessão expirada por inatividade), o interceptor é disparado, executa um `removeItem` imediato do token e limpa os dados confidenciais locais. **Nenhum laudo ou diagnóstico confidencial permanece exposto na tela do computador compartilhado da escola se o professor se ausentar**.*
>
> * * **À direita, a query de auditoria rodando direto no PostgreSQL:** Toda descriptografia de dados sensíveis na rota do backend FastAPI registra um log permanente no banco de dados. Como mostra o comando SQL `SELECT user_id, student_id, field_accessed, accessed_at FROM audit_log`, nós salvamos o ID do professor, o ID do aluno, o campo lido e o timestamp exato em microssegundos. **Cada visualização de laudo gera um rastro de auditoria inalterável para conformidade absoluta com a LGPD**."*

---

## Slide 07 — Garantia de Qualidade & Testes BDD
* **Duração:** 90 segundos (`08:40` a `10:10`)  
* **Ação na Tela:** Avance para o **Slide 7**. Detalhe os desafios de teste no topo e direcione os olhos da banca examinadora para os **blocos de testes lado a lado no rodapé**.

### 🗣️ O que falar:
> *"Para garantir que a nossa engrenagem Local-First não quebre com futuras atualizações, adotamos o Vitest sob o padrão **BDD (Given / When / Then)**. Bancos IndexedDB do navegador rodam em transações assíncronas complexas que são extremamente difíceis de testar em esteiras de integração contínua (CI/CD) em linha de comando. Nossa solução técnica de engenharia foi **mockar o Dexie e simular o IndexedDB de forma síncrona nos testes**.*
>
> ***Nos testes que exibimos na base da tela**, comprovamos essa qualidade de teste:*
>
> * * **À esquerda, a especificação de teste do hook `useAlunos`:** Simulamos no bloco 'Given' um array com dois alunos ('Ana' e 'Pedro'). Usamos `mockToArray.mockReturnValue` para dublar a chamada do banco e executamos o hook via `renderHook` com busca filtrada por 'Ana'. O teste assere que apenas 1 aluno foi retornado e que o nome é Ana Silva, validando o isolamento total da regra de filtragem na aplicação.*
>
> * * **À direita, a validação atômica da persistência offline:** Este teste unitário invoca a função concreta do serviço `salvarAlunoLocal`. Por meio das asserções de expectativa (`expect`), nós validamos de forma síncrona que o método `mockAdd` foi chamado gravando o status `'pending'` em IndexedDB e que o `mockEnqueue` colocou a tarefa na fila com a prioridade estipulada pelo domínio. **Se qualquer desenvolvedor quebrar a lógica da fila de sync no futuro, o teste reprova o deploy na hora**."*

---

## Slide 08 — Conclusão & Próximos Passos
* **Duração:** 80 segundos (`10:10` a `11:30`)  
* **Ação na Tela:** Avance para o **Slide 8** (Último slide). Comente os ganhos pedagógicos no topo e aponte para a **Tabela de Roadmap no rodapé**.

### 🗣️ O que falar:
> *"Concluindo a nossa defesa de engenharia, a arquitetura do Sistema AEE prova que **é perfeitamente viável criar uma aplicação de altíssima resiliência à falta de internet, sem sacrificar um milímetro da segurança e privacidade exigidas pela LGPD**.*
>
> *Ao observar a tabela final no rodapé do slide, estabelecemos o cronograma de evolução técnica do nosso roadmap em três fases claras:*
> * * **Fase 1 — Cache de Ativos:** Implementar Service Workers para pré-cachear fontes e arquivos JS estáticos, garantindo carregamento inicial e navegação 100% offline da aplicação.*
> * * **Fase 2 — Resolução de Conflitos:** Criar uma interface visual de fusão manual baseada na regra LWW (Last Write Wins) para que o professor resolva conflitos de digitação simultânea.*
> * * **Fase 3 — Painel Analítico:** Fornecer dashboards DPO para monitoramento simplificado e auditoria visual de logs de acesso sensíveis pela coordenação.*
>
> *Agradeço imensamente a atenção de todos os professores e membros da banca examinadora e coloco-me agora à inteira disposição para a fase de arguição técnica. Muito obrigada."*

---

## 💡 Dicas Extras para o Momento da Apresentação

1. **Ritmo e Pausas:** Ao mudar de slide na barra lateral, faça uma pausa de **2 segundos em silêncio**. Respire fundo e recomece. Isso demonstra total controle emocional e prende a atenção da banca.
2. **Apontamento Visual:** Quando disser as frases que introduzem o código (*"Se vocês olharem os exemplos de código...", "Nas evidências de código posicionadas abaixo..."*), faça um gesto físico em direção ao slide projetado para reforçar o sincronismo.
3. **Domínio Técnico nas Respostas:** Se a banca questionar a segurança do IndexedDB local, reafirme que dados confidenciais (laudos) nunca são guardados permanentemente no banco local geral — eles residem apenas em memória volátil de sessão ativa e são limpos no deslog por inatividade.
