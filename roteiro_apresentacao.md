# 🎤 Roteiro de Apresentação de 5 Minutos (Ajustado ao Layout) — Sistema WebAEE
> **Tema:** Frontend PWA com Clean Architecture, Sincronização Local-First e Conformidade com a LGPD.
> **Apresentadora:** Sthefany Bueno  
> **Tempo Estimado Total:** 5 minutos (300 segundos) — Ultra-objetivo e focado em engenharia.

---

## 🗺️ Cronômetro e Divisão de Tempo (300 segundos)

| Slide | Título | Tempo Sugerido | Cronômetro Acumulado | Foco do Discurso |
|---|---|---|---|---|
| **01** | Capa | **30s** | `00:30` | Apresentação pessoal e divisão arquitetural |
| **02** | O Sistema WebAEE | **45s** | `01:15` | Dores das escolas (offline), fluxo e matriz RBAC |
| **03** | Evolução e Escolhas Tecnológicas | **45s** | `02:00` | Escolhas (Next.js/Tailwind v4/Dexie) e exemplos inferiores |
| **04** | Camada de Domínio | **35s** | `02:35` | Entidades no topo e esquema/contratos na base |
| **05** | Camada de Aplicação | **35s** | `03:10` | Reatividade no topo e código de leitura/escrita na base |
| **06** | Infraestrutura HTTP & Proteção LGPD | **35s** | `03:45` | Conformidade LGPD no topo e intercepção/queries na base |
| **07** | Garantia de Qualidade | **35s** | `04:20` | Estratégia BDD no topo e mocks/asserções na base |
| **08** | Conclusão & Próximos Passos | **40s** | `05:00` | Impacto social e cronograma de fases final |

---

## Slide 01 — Capa
* **Duração:** 30 segundos (`00:00` a `00:30`)  
* **Ação na Tela:** Slide 1 aberto. Aponte brevemente para o **grid de divisão arquitetural posicionado no rodapé do slide**.

### 🗣️ O que falar:
> *"Bom dia aos membros da banca examinadora. Meu nome é **Sthefany Bueno** e apresento a defesa arquitetural do frontend do **Sistema AEE — Atendimento Educacional Especializado**.*
>
> *Nesta apresentação objetiva de 5 minutos, demonstrarei como projetamos uma aplicação PWA resiliente e altamente segura, dividida nas três camadas de Clean Architecture descritas no rodapé da tela: **Domain**, para persistência local transacional; **Application**, para orquestração reativa de dados; e **Infrastructure**, garantindo a conformidade rígida da LGPD."*

---

## Slide 02 — O Sistema WebAEE
* **Duração:** 45 segundos (`00:30` a `01:15`)  
* **Ação na Tela:** Avance para o **Slide 2**. Indique o diagrama de fluxo centralizado no topo e, em seguida, chame a atenção da banca para a **Tabela de Permissões Granulares (RBAC) na base**.

### 🗣️ O que falar:
> *"O WebAEE gerencia a rotina pedagógica de alunos com necessidades especiais. O maior desafio é a **precariedade de internet nas escolas públicas**. Se dependêssemos de conexão constante, o sistema seria inviabilizado. Por isso, definimos o fluxo superior: o professor anexa relatórios e fotos pedagógicas offline de forma instantânea, e a sincronização ocorre em lote quando há sinal.*
>
> *Como os relatórios contêm dados confidenciais de saúde infantojuvenil protegidos pela LGPD, implementamos a **Matriz de Permissões (RBAC)** que vocês veem na base do slide, garantindo que o acesso a laudos sensíveis permaneça estritamente restrito a professores vinculados e coordenadores, sob rígida auditoria de logs."*

---

## Slide 03 — Evolução e Escolhas Tecnológicas
* **Duração:** 45 segundos (`01:15` a `02:00`)  
* **Ação na Tela:** Avance para o **Slide 3**. Explique brevemente as cards conceituais do topo e, em seguida, guie os olhos da banca para as **evidências de código posicionadas na parte inferior do slide**.

### 🗣️ O que falar:
> *"Operamos com **Next.js 16** e **React 19** para carregamento rápido. Um diferencial de estilo foi o uso inovador do **Tailwind CSS v4**. Ao contrário da v3, a nova versão é CSS-First, eliminando arquivos estáticos de configuração em JS. Como exemplificado no código à esquerda na base do slide, os tokens de estilo são compilados nativamente em Rust direto em `globals.css` como variáveis nativas de CSS, facilitando a acessibilidade em tempo de execução.*
>
> *Abaixo das cards explicativas, também expomos como o React 19 muta o estado local de forma otimista. Essa reatividade é suportada pelo **Dexie.js e IndexedDB**, que escolhemos em substituição ao LocalStorage. O IndexedDB roda de forma assíncrona, transacional (ACID) e com espaço livre de gigabytes, viabilizando o armazenamento de anexos de fotos pedagógicas pesadas locais."*

---

## Slide 04 — Camada de Domínio
* **Duração:** 35 segundos (`02:00` a `02:35`)  
* **Ação na Tela:** Avance para o **Slide 4**. Destaque os conceitos de persistência no topo e indique os **dois blocos de código na base (Dexie Schema e Interfaces)**.

### 🗣️ O que falar:
> *"Respeitando os princípios da Arquitetura Limpa, a camada de **Domínio** no topo centraliza os modelos puros de negócio livres de dependências externas. *
>
> *Se vocês olharem para a base do slide, verão a definição exata do nosso schema local e interfaces TypeScript. Criamos as entidades locais `AlunoLocal` e `FotoLocal`. O motor do domínio gerencia a fila de sincronização `sync_queue` aplicando a regra de negócio de **precedência de dados**: relatórios pedagógicos recebem prioridade '1' (urgência alta e leves), enquanto mídias e fotos recebem prioridade '2' (pesados). Isso otimiza e preserva a rede móvel das escolas."*

---

## Slide 05 — Camada de Aplicação
* **Duração:** 35 segundos (`02:35` a `03:10`)  
* **Ação na Tela:** Avance para o **Slide 5**. Comente a reatividade sem polling descrita no topo e mostre os **dois exemplos práticos de escrita e leitura de código na base**.

### 🗣️ O que falar:
> *"Na camada de **Aplicação**, orquestramos a reatividade da interface eliminando qualquer uso de polling periódico na UI. Usamos o hook `useLiveQuery` da biblioteca `dexie-react-hooks`.*
>
> *Como demonstrado nas evidências práticas na parte inferior do slide, a lógica é dividida de forma limpa:*
> * *À esquerda, o serviço de escrita `salvarAlunoLocal` persiste o dado em IndexedDB em estado pendente e enfileira o sync na fila local com prioridade 2.*
> * *À direita, o hook customizado `useAlunos` extrai do banco local reativamente, aplicando filtros de busca e status diretamente na query. Quando a fila sincroniza em segundo plano, a interface atualiza o status de pendente para sincronizado instantaneamente."*

---

## Slide 06 — Infraestrutura HTTP & Proteção LGPD
* **Duração:** 35 segundos (`03:10` a `03:45`)  
* **Ação na Tela:** Avance para o **Slide 6**. Comente os conceitos de barreira de acesso e auditoria no topo e guie os olhos da banca para a **intercepção HTTP e Query SQL de auditoria expostas embaixo**.

### 🗣️ O que falar:
> *"Na camada de **Infraestrutura**, isolamos a rede no `apiClient`. Centralizamos as chamadas HTTP e implementamos uma barreira crítica de conformidade com a LGPD em computadores compartilhados de escolas.*
>
> *Como exposto no código à esquerda na base, se o servidor expirar a sessão e retornar status **401 Unauthorized**, o interceptor limpa instantaneamente o IndexedDB e localStorage de dados sensíveis na memória volátil e redireciona o browser para `/login` imediatamente.*
>
> *Além disso, os laudos médicos são auditados. À direita, exibimos a query SQL real que monitora os logs na nuvem. Qualquer clique do professor para revelar diagnósticos confidenciais registra de forma permanente quem acessou, de qual aluno e o horário exato."*

---

## Slide 07 — Garantia de Qualidade & Testes BDD
* **Duração:** 35 segundos (`03:45` a `04:20`)  
* **Ação na Tela:** Avance para o **Slide 7**. Destaque a estratégia de qualidade no topo e aponte para as **asserções e mocks do teste na base do slide**.

### 🗣️ O que falar:
> *"Nossa suite de testes roda no **Vitest** sob o padrão BDD de **Given / When / Then**. O grande desafio ao testar fluxos offline-first com IndexedDB é que as transações assíncronas nativas do browser inviabilizariam testes rápidos na thread do Node.*
>
> *A nossa solução de engenharia, exposta no código à esquerda na base da tela, foi mockar o hook do `useLiveQuery` de forma síncrona nos testes de renderização. Isso isola o banco e nos permite validar em milissegundos a busca de nomes. À direita, também testamos com precisão se o serviço local persiste em IndexedDB e se o sync_queue é enfileirado com a prioridade estipulada pelo domínio, garantindo que o hook não vaze responsabilidades de negócio para a interface."*

---

## Slide 08 — Conclusão & Próximos Passos
* **Duração:** 40 segundos (`04:20` a `05:00`)  
* **Ação na Tela:** Avance para o **Slide 8** (Último Slide). Destaque a entrega de impacto e guie a banca para o **Cronograma de Roadmap final no rodapé do slide**.

### 🗣️ O que falar:
> *"Em conclusão, o frontend do **Sistema AEE** prova que o desenvolvimento público inclusivo pode atingir a excelência técnica de nível internacional, equilibrando tolerância offline Local-First extrema com a privacidade por design exigida pela LGPD.*
>
> *Para os próximos passos de evolução do nosso roadmap técnico — exposto na tabela final no rodapé do slide — planejamos:*
> * *1. O pré-cacheamento total de fontes e dependências estáticas com Service Workers (Assets Caching);*
> * *2. Interface visual para resolução manual de conflitos de edição baseada em LWW (Last Write Wins); e*
> * *3. Dashboard analítico de logs de acesso LGPD para fins de fiscalização pela coordenação.*
>
> *Agradeço imensamente à banca e coloco-me agora à inteira disposição para a fase de arguição técnica. Muito obrigada."*

---

## 🛡️ Defesa Expressa — Respostas Rápidas para a Banca (15 segundos)

Se a banca te pressionar em tópicos específicos durante a arguição, utilize estas respostas diretas:

1. **"Por que IndexedDB e não LocalStorage?"**
   > *"O LocalStorage bloqueia a renderização da interface por ser síncrono e tem limite de 5MB. O IndexedDB, via Dexie, é assíncrono, aceita blobs pesados de fotos pedagógicas e oferece segurança transacional."*

2. **"Como o app resolve conflito de sincronização?"**
   > *"Atualmente, os relatórios possuem carimbo de data `updated_at`. Na sincronização, a versão com data de modificação mais recente no dispositivo substitui (Last Write Wins). Nosso roadmap prevê uma interface de fusão visual para que o professor resolva manualmente conflitos de texto complexos."*

3. **"Como vocês garantem a privacidade local dos dados sensíveis da LGPD?"**
   > *"Diagnósticos e laudos médicos confidenciais nunca residem permanentemente no banco local geral do IndexedDB. Eles são consultados sob demanda via HTTPS seguro e expiram imediatamente na memória volátil ao término da sessão do usuário."*
