# Sistema AEE — Documento de Requisitos e Proposta Arquitetural Final

**Versão:** 1.0 — Definitiva  
**Data:** 10/03/2026  
**Status:** ✅ Aprovado para desenvolvimento  
**Autores:** Sessões de exploração arquitetural + Tree-of-Thought (06–10/03/2026)

---

## 1. Visão Geral do Produto

### O que é

O **Sistema AEE** é uma aplicação web progressiva (PWA) para gestão do Atendimento Educacional Especializado em escolas públicas. Centraliza o trabalho da Professora AEE e das Professoras de Apoio, substituindo fluxos dispersos em papel, WhatsApp e drives pessoais.

### Problema Principal

A Professora AEE atua em múltiplas escolas simultaneamente, coordena Professoras de Apoio vinculadas a alunos com Necessidades Educacionais Especiais (NEE), e precisa produzir e organizar documentos pedagógicos (PDI, relatórios de atendimento, relatórios periódicos de apoio) em um ambiente com **conectividade de rede intermitente ou inexistente**.

Hoje, esse fluxo é caótico: dados espalhados, relatórios sem rastreabilidade, fotos sem contexto pedagógico, pendências invisíveis. O sistema resolve exatamente isso.

### Escopo Inicial (MVP — Fase 1)

- **1 Professora AEE** (Valdirene), atuando em até 3 escolas
- Expansão futura: múltiplas Professoras AEE, múltiplas SEMEDs (multi-tenant)

---

## 2. Matriz de Papéis e Permissões

### Hierarquia de Acesso

```
Coordenador Geral
    └── Professora AEE  (1 por espaço, pode atuar em N escolas)
            └── Professora de Apoio  (vinculada a alunos específicos)
```

Os pais/responsáveis **não têm acesso ao sistema** em nenhuma fase.

---

### 2.1 Coordenador Geral

| Ação | Permitido |
|---|---|
| Visualizar dados pedagógicos de todos os alunos (leitura) | ✅ |
| Visualizar relatórios e PDIs (leitura) | ✅ |
| Cadastrar Professoras AEE | ✅ |
| Vincular Professoras AEE às suas escolas | ✅ |
| Criar, editar ou excluir alunos, relatórios ou PDIs | ❌ |
| Acessar laudos médicos detalhados | ❌ (campos marcados como restritos) |

> **Princípio:** O Coordenador Geral tem visão global somente-leitura. Não intervém nos dados pedagógicos.

---

### 2.2 Professora AEE (Admin do seu ecossistema)

| Ação | Permitido |
|---|---|
| Cadastrar, editar e arquivar alunos | ✅ |
| Cadastrar e gerenciar Professoras de Apoio | ✅ |
| Vincular e desvincular Professoras de Apoio a alunos | ✅ |
| Registrar transferência de escola de aluno | ✅ |
| Redigir o PDI do aluno | ✅ (exclusivo) |
| Redigir relatórios de atendimento | ✅ (exclusivo) |
| Registrar fotos pedagógicas dos alunos | ✅ (exclusivo) |
| Usar o atalho "📸 Registrar Momento" | ✅ |
| Visualizar relatórios das Professoras de Apoio | ✅ |
| Exportar qualquer documento como PDF | ✅ |
| Ver dashboard de pendências de toda a sua carteira | ✅ |

---

### 2.3 Professora de Apoio (Acesso restrito)

| Ação | Permitido |
|---|---|
| Visualizar apenas os alunos vinculados a ela | ✅ |
| Redigir relatório periódico (semanal/mensal) dos seus alunos | ✅ |
| Redigir relatório anual dos seus alunos | ✅ |
| Exportar seus próprios relatórios como PDF | ✅ |
| Visualizar ou editar PDIs | ❌ |
| Visualizar relatórios de outras Professoras de Apoio | ❌ |
| Upload de fotos pedagógicas | ❌ (exclusivo da Prof. AEE) |
| Gerenciar alunos ou escola | ❌ |

> **Importante:** O acesso da Professora de Apoio a um aluno é **vinculado ao período** de atuação. Após uma transferência ou desvinculação, ela perde o acesso a novos dados — o histórico anterior fica arquivado e visível apenas para a Prof. AEE.

---

## 3. Funcionalidades Críticas do MVP (Fase 1)

### 3.1 Autenticação e Controle de Acesso

- **Login por e-mail e senha** para todos os perfis. **Não haverá magic link nem acesso por URL sem senha**, dado o caráter altamente sensível dos dados de menores com NEE.
- Sessões com expiração configurável.
- Row-Level Security (RLS) no banco de dados PostgreSQL: cada query retorna exclusivamente os dados autorizados pelo papel e pelo tenant do usuário autenticado. Essa camada de segurança **não é delegada à lógica de aplicação**.

---

### 3.2 Gestão de Alunos e Histórico

**Cadastro de alunos**
- Campos obrigatórios: nome, data de nascimento, escola atual, diagnóstico (campo restrito), responsável legal.
- Campo `consentimento_lgpd: boolean` + `data_consentimento` + `base_legal: "Art. 58 LDB"` registrados no momento do cadastro.
- Campos marcados internamente como `sensível: true` (ex: diagnóstico, laudo) nunca aparecem em exportações gerais e geram log ao serem acessados.

**Transferência de escola**
- Aluno possui `escola_atual` + `histórico_escolas[]` (array de `{escola, data_inicio, data_fim}`).
- Ao registrar uma transferência, a Prof. de Apoio anterior perde acesso imediato ao aluno.
- Relatórios e fotos do período anterior ficam **arquivados** — visíveis apenas para a Prof. AEE, não para a nova Prof. de Apoio.

**Arquivamento (Soft Delete)**
- Nenhum dado é excluído permanentemente do banco.
- Alunos possuem `status: ativo | arquivado`. Alunos arquivados não aparecem nos fluxos ativos, mas o histórico é preservado integralmente.
- Política de retenção declarada: dados são mantidos pelo prazo legal aplicável à documentação escolar e exibidos no aviso de privacidade do sistema.

**Dashboard de pendências**
- Visão por aluno: indicadores de completude por tipo de documento (`PDI`, `Relatório de Apoio`, `Relatório Anual`).
- Filtros por escola e por período.
- Implementação: query agregada no PostgreSQL + lista com chips de status (verde/vermelho).

---

### 3.3 Funcionalidades de Relatório e Registro

**Templates dinâmicos por tipo de documento**

Cada tipo de relatório possui estrutura própria e mutável ao longo do tempo. O sistema implementa templates como **conjuntos de seções configuráveis**:

| Tipo | Quem redige | Periodicidade |
|---|---|---|
| PDI (Plano de Desenvolvimento Individual) | Prof. AEE | Por semestre ou sob demanda |
| Relatório de Atendimento | Prof. AEE | Por sessão / sob demanda |
| Relatório Periódico (semanal/mensal) | Prof. de Apoio | Periódico |
| Relatório Anual | Prof. de Apoio | Anual |

- Seções de cada template são adicionáveis/removíveis pela Prof. AEE **sem necessidade de código** (configuração armazenada como JSON estruturado no banco).
- Relatório **guarda uma snapshot da versão do template** no momento em que foi gerado, garantindo que mudanças futuras no template não alterem relatórios já emitidos.
- Campo padrão em todos os relatórios: `última_edição: {timestamp, nome_do_usuário}` — exibido na visualização do documento.

**Exportação PDF**
- Qualquer relatório ou PDI pode ser exportado como PDF formatado para entrega institucional.
- PDF gerado a partir do template renderizado no frontend (sem renderização server-side no MVP).

**📸 Atalho "Registrar Momento" (Captura Rápida)**
- Botão fixo na tela principal da Prof. AEE.
- Fluxo: abrir → selecionar ou tirar foto → associar ao aluno (autocomplete) → aplicar tag pedagógica (ex: `Autonomia`, `Comunicação`, `Motor Fino`, `Socialização`) → salvar.
- Máximo de 3 toques do botão até o registro estar salvo.
- Funciona offline: a foto é gravada localmente (IndexedDB) e sincronizada quando a conexão for restabelecida.
- Upload de fotos é **exclusivo da Prof. AEE**.

---

## 4. Decisões Arquiteturais e de Segurança

### 4.1 Stack Técnica

| Camada | Tecnologia | Justificativa |
|---|---|---|
| **Frontend (PWA)** | Next.js + Service Worker | SSR para performance + suporte a PWA instalável |
| **Cache offline** | Dexie.js (IndexedDB) | API moderna e tipada para persistência local no browser |
| **Backend (API)** | Node.js (Fastify) ou FastAPI (Python) | A definir conforme stack do time |
| **Banco de dados** | PostgreSQL com RLS ativado | Controle de acesso no nível de linha — obrigatório |
| **Armazenamento de fotos** | Cloudflare R2 (ou AWS S3) | Custo baixo, CDN integrado |
| **Autenticação** | NextAuth (ou Clerk) | Multi-tenant ready, suporte a roles customizados |
| **Exportação PDF** | `react-pdf` ou `@react-pdf/renderer` | Geração client-side sem dependência de puppeteer no MVP |
| **Hospedagem** | Vercel (frontend) + Railway ou Render (API) | Deploy simplificado para time pequeno |

---

### 4.2 Estratégia Offline-First (PWA)

```
FLUXO OFFLINE → ONLINE

[Usuário offline]
    ↓ cria/edita dado
[IndexedDB local]  ← dados persistidos imediatamente
    ↓ reconexão detectada
[Fila de sync]
    ↓ envia ao backend
[PostgreSQL]  ← estado canônico
```

**Política de merge (resolução de conflitos):**
- **Textos de relatórios** — cada relatório é uma unidade atômica de escrita. `last-write-wins` com timestamp registrado no `updated_at`. Em caso de conflito detectado (mesmo relatório editado em dois dispositivos offline), o sistema preserva ambas as versões e sinaliza conflito para resolução manual pela Prof. AEE. *(Fase 2: interface de diff visual)*
- **Fotos** — nunca conflitam com textos. Cada foto é uma entidade independente referenciada por ID. Upload é idempotente.
- **Status de aluno / vínculos** — mudanças administrativas (transferência, desvinculação de apoio) têm precedência de aplicação quando sincronizadas.

**Prioridade de sync:** metadados e textos sincronizam primeiro; arquivos de imagem sincronizam em segundo plano com indicador de progresso.

---

### 4.3 Conformidade LGPD — Dados Sensíveis de Crianças com NEE

Os dados gerenciados pelo sistema enquadram-se no **Art. 11 da LGPD** (dados sensíveis). As medidas abaixo são **obrigatórias desde o MVP**:

| Medida | Implementação | Referência LGPD |
|---|---|---|
| **RLS no banco de dados** | Políticas RLS no PostgreSQL — toda query é filtrada pelo tenant e pelo papel | Art. 46 |
| **Log de acesso a dados sensíveis** | Tabela `audit_log`: `quem_acessou`, `quando`, `qual_aluno`, `qual_campo` | Art. 37 |
| **Campos restritos marcados** | Flag `sensivel: true` no schema — nunca aparecem em exports gerais | Art. 46 |
| **Consentimento / base legal no cadastro** | Campos `consentimento_lgpd`, `data_consentimento`, `base_legal: "Art. 58 LDB"` | Art. 7, 11 |
| **Soft delete (nunca exclusão física)** | `status: ativo | arquivado` — dados históricos preservados | Obrigação legal escolar |
| **Política de retenção declarada** | Texto estático na tela de privacidade e no cadastro do aluno | Art. 9 |
| **Criptografia em repouso** | Banco de dados com criptografia ativada no provedor (padrão nos serviços cloud indicados) | Art. 46 |

> **Nota:** Responsáveis legais **não têm acesso ao sistema** no MVP nem em fases futuras planejadas. O acesso de terceiros externos (incluindo famílias) não faz parte do escopo deste produto.

---

## 5. Escopo Funcional Definitivo do MVP (Fase 1)

### ✅ Incluído no MVP

**Autenticação e Permissões**
- Login por e-mail e senha com sessão gerenciada (sem magic link, sem acesso por URL pública)
- Três perfis com permissões distintas: Coordenador Geral, Prof. AEE, Prof. de Apoio
- RLS no PostgreSQL — habilitado desde o primeiro deploy

**Gestão de Alunos e Histórico**
- CRUD de alunos pela Prof. AEE (com campos sensíveis auditados)
- Registro de consentimento LGPD + base legal no cadastro
- Transferência de escola com corte de acesso da Prof. de Apoio anterior
- Histórico de escolas por aluno (array com datas)
- Soft delete (arquivamento) — sem exclusão física
- Dashboard de pendências por aluno (PDI / Relatório Apoio / Relatório Anual)

**Funcionalidades de Relatório e Registro**
- Templates configuráveis por tipo de documento (JSON de seções)
- Snapshot do template gravada com cada relatório emitido
- Campo `última_edição: {timestamp, nome}` em todos os relatórios
- Exportação PDF de qualquer documento
- Atalho **"📸 Registrar Momento"** — captura rápida de foto com tag pedagógica (máx. 3 toques)
- Upload de fotos exclusivo para Prof. AEE
- Galeria de fotos por aluno

**Infraestrutura**
- PWA instalável com suporte offline completo
- Sync offline: merge por entidade (textos e fotos como unidades independentes)
- Log de acesso a campos sensíveis (tabela `audit_log`)

---

### ❌ Módulos Descartados (fora do escopo — não retornam)

| Módulo | Motivo do descarte |
|---|---|
| **Magic link / login sem senha** | Incompatível com a sensibilidade dos dados (crianças com NEE, laudos médicos) |
| **Upload de fotos pela Prof. de Apoio** | Exclusividade pedagógica da Prof. AEE; evita mistura de responsabilidades |
| **Portal do Responsável / Acesso dos Pais** | Fora do escopo de todas as fases planejadas |
| **Exclusão física de dados** | Proibido — obrigação legal de manutenção de histórico escolar |
| **Notificação automática de transferência de escola** | Fase 2 — baixa complexidade, mas não crítico para o MVP |
| **Interface de diff para conflitos de sync** | Fase 2 — conflito resolvido no MVP por timestamp + sinalização |
| **Exclusão automatizada de dados por cron (LGPD)** | Fase 3 — substituída por política de retenção declarada no MVP |

---

## 6. Fases de Desenvolvimento

| Fase | Foco | Estimativa |
|---|---|---|
| **Fase 1 — MVP** | Tudo descrito neste documento | 8–12 semanas |
| **Fase 2 — Consolidação** | Interface de diff para conflitos, notificação de transferência, templates com editor visual | 4–6 semanas |
| **Fase 3 — Escala** | Multi-tenant completo (várias SEMEDs), onboarding automatizado, exclusão automatizada LGPD | 6–8 semanas |

---

*Documento definitivo — Sistema AEE — 10/03/2026*  
*Consolidado a partir das sessões de exploração arquitetural (06/03) e análise Tree-of-Thought (10/03)*
