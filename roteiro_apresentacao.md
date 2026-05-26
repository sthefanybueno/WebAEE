# 🎤 Roteiro de Apresentação de 10 Minutos (Ajustado ao Layout) — Sistema WebAEE
> **Tema:** Frontend PWA com Clean Architecture, Sincronização Local-First e Conformidade com a LGPD.
> **Apresentadora:** Sthefany Bueno  
> **Tempo Estimado Total:** 10 minutos (600 segundos) — Técnico, aprofundado e focado em engenharia de software.

---

## 🗺️ Cronômetro e Divisão de Tempo (600 segundos)

| Slide | Título | Tempo Sugerido | Cronômetro Acumulado | Foco do Discurso |
|---|---|---|---|---|
| **01** | Capa | **60s** | `01:00` | Apresentação pessoal, objetivos e divisão arquitetural |
| **02** | O Sistema WebAEE | **90s** | `02:30` | Dores das escolas (offline), fluxos pedagógicos e Matriz RBAC |
| **03** | Evolução e Escolhas Tecnológicas | **90s** | `04:00` | Next.js 16, React 19, Tailwind v4 vs v3, Dexie.js e códigos da base |
| **04** | Camada de Domínio | **70s** | `05:10` | DDD na Clean Architecture, persistência e schemas/tipos na base |
| **05** | Camada de Aplicação | **70s** | `06:20` | Casos de uso, reatividade sem polling e leitura/escrita na base |
| **06** | Infraestrutura HTTP & Proteção LGPD | **70s** | `07:30` | API FastAPI, barreira de acesso 401 e auditoria PostgreSQL na base |
| **07** | Garantia de Qualidade | **70s** | `08:40` | Suite Vitest, Given-When-Then, mocks do useLiveQuery e asserções |
| **08** | Conclusão & Próximos Passos | **80s** | `10:00` | Ganhos de engenharia, impacto público e cronograma de roadmap |

---

## Slide 01 — Capa
* **Duração:** 60 segundos (`00:00` a `01:00`)  
* **Ação na Tela:** Slide 1 ativo. Faça gestos abertos direcionando a atenção para o **grid de divisão arquitetural posicionado no rodapé do slide**.

### 🗣️ O que falar:
> *"Bom dia à ilustre banca examinadora, professores e colegas presentes. Meu nome é **Sthefany Bueno** e tenho a honra de apresentar a defesa arquitetural do frontend do **Sistema AEE — Atendimento Educacional Especializado**.*
>
> *Nesta apresentação de 10 minutos, demonstrarei como projetamos e desenvolvemos uma aplicação PWA moderna, resiliente e altamente segura, projetada para as salas de recursos do ensino público. Nosso foco de engenharia foi resolver a instabilidade de rede e garantir a privacidade rigorosa de dados sensíveis infantojuvenis.*
>
> *Como vocês podem observar no grid posicionado no rodapé da nossa capa, a nossa aplicação baseia-se nos princípios rígidos da **Clean Architecture**, dividida de forma limpa: a camada de **Domain & Core** isola nossas regras locais de IndexedDB; a camada de **Application Hooks** gerencia a reatividade da interface; e a camada de **Infrastructure** faz a ponte segura com o nosso backend, blindando o tráfego em conformidade estrita com a LGPD."*

---

## Slide 02 — O Sistema WebAEE & Regras de Negócio
* **Duração:** 90 segundos (`01:00` a `02:30`)  
* **Ação na Tela:** Avance para o **Slide 2**. Indique o diagrama de fluxo centralizado no topo e, em seguida, guie os olhos da banca com calma para a **Tabela de Permissões Granulares (RBAC) na base**.

### 🗣️ O que falar:
> *"O WebAEE gerencia o fluxo pedagógico especializado de alunos com **Necessidades Educacionais Especiais (NEE)**. O nosso maior desafio técnico é o cenário real das salas de recursos das escolas públicas: **conexão à internet extremamente oscilante ou inexistente**. Se dependêssemos de requisições HTTP bloqueantes a cada clique, a aplicação seria inviabilizada.*
>
> *Projetamos o fluxo de quatro etapas exposto no topo: o professor cadastra o aluno com consentimento LGPD explícito, elabora o **Plano de Desenvolvimento Individualizado (PDI)**, registra o diário de atendimento e anexa fotos locais offline. A sincronização em lote ocorre sequencialmente e em segundo plano assim que a conexão é restaurada.*
>
> *Entretanto, laudos e históricos médicos de menores são classificados como **dados sensíveis** pela LGPD. Por isso, implementamos a **Matriz de Permissões Granulares (RBAC)** exibida na tabela inferior. O Administrador tem escrita total em inquilinos e escolas. O Coordenador gerencia os alunos da sua unidade. O Professor AEE possui escrita total restrita a alunos sob seu vínculo pedagógico. Já o Professor de Apoio tem apenas leitura de vínculo para diários, enquanto o Professor Regente possui acesso estritamente limitado à leitura básica. Mais importante: para visualizar laudos protegidos por lei, o Coordenador ou Professor AEE precisa clicar em 'Revelar', gerando instantaneamente um log imutável de auditoria no servidor."*

---

## Slide 03 — Evolução e Escolhas Tecnológicas
* **Duração:** 90 segundos (`02:30` a `04:00`)  
* **Ação na Tela:** Avance para o **Slide 3**. Comente com clareza as escolhas tecnológicas na coluna esquerda e as decisões de engenharia na direita. Aponte para os **dois painéis de código posicionados lado a lado no rodapé**.

### 🗣️ O que falar:
> *"Para suportar essa arquitetura resiliente, nossas decisões tecnológicas foram minuciosas. Operamos com o **Next.js 16** e **React 19** para hidratação eficiente e renderização de alta performance. *
>
> *Um diferencial de estilo moderno foi o uso inovador do **Tailwind CSS v4.0**. Ao contrário da v3, a v4 é CSS-First. Como vocês podem ver no código de evidência à esquerda na base do slide, a configuração ocorre diretamente em `globals.css` usando a declaração `@theme`. Isso elimina arquivos JS estáticos pesados de configuração e compila nativamente em Rust na pipeline de compilação, gerando um bundle extremamente leve para redes móveis lentas.*
>
> *Substituímos o LocalStorage convencional pelo **Dexie.js com IndexedDB**. O LocalStorage bloqueia a thread principal por ser síncrono e é limitado a apenas **5MB** de texto plano. O IndexedDB roda de forma assíncrona, oferece segurança transacional (ACID) e limite de gigabytes, o que nos permite guardar relatórios e blobs de imagens offline. Na base direita, exemplificamos como usamos o novo `useOptimistic` do React 19. A interface adiciona o aluno localmente no estado de forma instantânea e otimista, realizando a mutação assíncrona com o banco local e sincronização remota sem travar a experiência do professor."*

---

## Slide 04 — Camada de Domínio & Modelos Locais
* **Duração:** 70 segundos (`04:00` a `05:10`)  
* **Ação na Tela:** Avance para o **Slide 4**. Aponte para os conceitos de domínio no topo e detalhe a definição exata das tabelas locais nos **dois blocos de código na base (Dexie Schema e Interfaces TypeScript)**.

### 🗣️ O que falar:
> *"Respeitando os princípios da Clean Architecture, a nossa camada de **Domínio** isola completamente os modelos de dados e as regras puras de negócio de dependências externas de infraestrutura ou frameworks.*
>
> *Se olharmos para as evidências de código no rodapé do slide, vemos o coração da persistência local do aplicativo:*
> * *À esquerda, a definição das tabelas IndexedDB na classe `AeeDatabase` do Dexie. Mapeamos as tabelas `alunos`, `relatorios`, `fotos` e a fila `sync_queue`.*
> * *À direita, as interfaces TypeScript estritas. A entidade `AlunoLocal` gerencia metadados locais de sync, como `sync_status` e `updated_at`. A entidade `SyncQueueItem` encapsula operações pendentes com prioridades estritas.*
>
> *O motor do domínio aplica a regra de precedência de dados offline: diários e relatórios pedagógicos recebem Prioridade 1 (extrema urgência e leves), enquanto mídias binárias recebem Prioridade 2 (enviadas sequencialmente em segundo plano). Isso garante que registros críticos de atendimento cheguem primeiro ao servidor, economizando franquias limitadas de internet móvel das escolas públicas."*

---

## Slide 05 — Camada de Aplicação & Hooks Reativos
* **Duração:** 70 segundos (`05:10` a `06:20`)  
* **Ação na Tela:** Avance para o **Slide 5**. Explique a reatividade baseada em eventos locais no topo e guie a banca para as **duas peças de código integradas na base (Serviço de Escrita e Hook de Leitura)**.

### 🗣️ O que falar:
> *"A camada de **Aplicação** é responsável por orquestrar os Casos de Uso pedagógicos por meio de hooks customizados, eliminando completamente consultas periódicas invasivas à CPU (*polling* na UI).*
>
> *Ao observar os exemplos de código prático no rodapé do slide, percebemos o ciclo reativo Local-First completo:*
> * *À esquerda, o serviço de escrita `salvarAlunoLocal` persiste dados em IndexedDB com `sync_status: 'pending'` e, na mesma transação atômica, enfileira a operação na fila de sincronização local com prioridade 2.*
> * *À direita, o hook customizado de leitura `useAlunos` assina a tabela IndexedDB por meio do hook `useLiveQuery`. Graças a essa assinatura de eventos de baixo nível do navegador, a interface é re-renderizada automaticamente no momento exato em que um aluno é salvo ou quando o sincronizador atualiza o status de pendente para sincronizado.*
>
> *Isso garante reatividade síncrona local com atualização assíncrona remota transparente."*

---

## Slide 06 — Infraestrutura HTTP & Proteção LGPD
* **Duração:** 70 segundos (`06:20` a `07:30`)  
* **Ação na Tela:** Avance para o **Slide 6**. Destaque os conceitos de controle de acesso e auditoria no topo e chame a atenção para o **interceptor HTTP e a Query SQL de auditoria de banco expostas na base**.

### 🗣️ O que falar:
> *"A camada de **Infraestrutura** lida diretamente com o ecossistema de rede e endpoints FastAPI do backend. Para garantir a barreira de acesso e conformidade LGPD em computadores compartilhados da escola, encapsulamos as requisições no `apiClient`.*
>
> *À esquerda na base do slide, exibimos o nosso interceptor de sessão. Se o servidor retornar status **401 Unauthorized** (indicando expiração de sessão por inatividade), o interceptor é acionado imediatamente. Ele destrói instantaneamente o token de autorização JWT e limpa os dados sensíveis do aluno da memória volátil da aplicação e do localStorage, redirecionando o navegador para `/login` de forma automática, impedindo o vazamento de laudos por distração do professor.*
>
> *Além disso, implementamos logs de auditoria imutáveis. À direita, exibimos a query SQL de auditoria rodando no PostgreSQL do backend. Toda leitura de laudo protegido gera um registro permanente com o ID de quem leu, qual aluno foi consultado, o campo específico lido e o timestamp exato, permitindo auditorias periódicas em conformidade total com as normas brasileiras."*

---

## Slide 07 — Garantia de Qualidade & Testes BDD
* **Duração:** 70 segundos (`07:30` a `08:40`)  
* **Ação na Tela:** Avance para o **Slide 7**. Detalhe as vantagens dos testes rápidos no topo e aponte para a **especificação do hook e o teste de persistência e fila na base**.

### 🗣️ O que falar:
> *"Uma arquitetura resiliente exige garantias rigorosas. Nossa suite de testes automatizados roda sob o **Vitest** e segue a metodologia **BDD (Given / When / Then)**. Testar aplicações Local-First traz um desafio de engenharia: as transações assíncronas nativas do IndexedDB do navegador não rodam facilmente em threads puras de Node, inviabilizando testes rápidos de integração.*
>
> *Nossa solução técnica está exposta nas especificações à esquerda na base da tela: mockamos síncronamente o hook `useLiveQuery` e o retorno do banco por meio de dublês de teste do Vitest. Isso nos permite validar em milissegundos o filtro de busca do hook `useAlunos` de forma isolada do browser.*
>
> *À direita na base, testamos a atomicidade do nosso serviço local. O teste garante que ao invocar `salvarAlunoLocal`, o registro é gravado com status pendente no IndexedDB e o item correspondente da fila de sincronização é enfileirado com a prioridade exata estipulada pelas regras do domínio. Isso blinda a integridade da fila de sincronização contra regressões."*

---

## Slide 08 — Conclusão & Próximos Passos
* **Duração:** 80 segundos (`08:40` a `10:00`)  
* **Ação na Tela:** Avance para o **Slide 8** (Último Slide). Destaque a entrega social no topo e guie com orgulho a banca para a **Tabela de Cronograma de Evolução Técnica do Roadmap no rodapé**.

### 🗣️ O que falar:
> *"Em conclusão, a arquitetura de frontend projetada para o **Sistema AEE** prova a plena viabilidade técnica de desenvolver soluções públicas inclusivas de alto nível de engenharia. Conseguimos conciliar tolerância extrema offline por meio de sincronização Local-First com proteção e privacidade de dados exigidas por lei.*
>
> *Como roadmap de evolução técnica exposto no rodapé, dividimos nossos próximos passos em três fases claras:*
> * * **Fase 1 — Cache de Ativos:** Implementar Service Workers para cachear imagens, fontes e arquivos JS estáticos, garantindo carregamento inicial e navegação 100% offline da aplicação.*
> * * **Fase 2 — Resolução Visual:** Desenvolver uma interface interativa de sincronização baseada na regra LWW (Last Write Wins) para que o professor resolva manualmente conflitos complexos de texto.*
> * * **Fase 3 — Analítico LGPD:** Fornecer painéis de monitoramento visual de acessos sensíveis para auditoria simplificada por parte da coordenação e do encarregado de dados.*
>
> *Agradeço imensamente a atenção de todos os membros da banca examinadora e coloco-me agora à inteira disposição para responder a quaisquer questionamentos técnicos sobre a nossa arquitetura. Muito obrigada."*

---

## 🛡️ Defesa Expressa — Respostas Rápidas para a Banca (15 segundos)

Se a banca te pressionar em tópicos específicos durante a arguição, utilize estas respostas diretas:

1. **"Por que IndexedDB e não LocalStorage?"**
   > *"O LocalStorage bloqueia a renderização da interface por ser síncrono e tem limite de 5MB. O IndexedDB, via Dexie, é assíncrono, aceita blobs pesados de fotos pedagógicas e oferece segurança transacional."*

2. **"Como o app resolve conflito de sincronização?"**
   > *"Atualmente, os relatórios possuem carimbo de data `updated_at`. Na sincronização, a versão com data de modificação mais recente no dispositivo substitui (Last Write Wins). Nosso roadmap prevê uma interface de fusão visual para que o professor resolva manualmente conflitos de texto complexos."*

3. **"Como vocês garantem a privacidade local dos dados sensíveis da LGPD?"**
   > *"Diagnósticos e laudos médicos confidenciais nunca residem permanentemente no banco local geral do IndexedDB. Eles são consultados sob demanda via HTTPS seguro e expiram imediatamente na memória volátil ao término da sessão do usuário."*
