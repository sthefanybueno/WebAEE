# 🌳 Análise Tree-of-Thought — Sistema AEE
**Perspectiva:** Product Manager Sênior + UX Expert  
**Data:** 10/03/2026 | **Base:** Conversa arquitetural de 06/03/2026

---

> **Metodologia:** Para cada perspectiva, ramificamos 2–3 caminhos, avaliamos cada um com nota de **Impacto (1–10) × Complexidade (1–10)** e filtramos apenas as ideias com melhor relação custo-benefício para o MVP ou Fase 2.

---

## 🌿 Perspectiva 1 — Jornada do Usuário: Casos Limites (Edge Cases)

### Problema Raiz
O sistema precisa funcionar com **falha de conectividade**, **múltiplos atores humanos** e **transições administrativas** que não aparecem nos fluxos "felizes".

---

### 🌱 Ramo 1.A — Conflito de Sincronização Offline

**Cenário:** Valdirene edita o PDI do aluno João no notebook da sala de recursos (offline). Simultaneamente, a Profissional de Apoio carrega uma foto no celular (também offline). Quando ambas ficam online, o que acontece?

| Sub-ramo | Abordagem | Impacto | Complexidade | Veredicto |
|---|---|---|---|---|
| **1.A.1** Last-Write-Wins | A última gravação vence, sobrescrevendo | 4 | 2 | ❌ **Descartado** — risco de perda silenciosa de dado pedagógico crítico |
| **1.A.2** Merge por campo | Cada campo sincroniza independentemente (ex: foto não conflita com texto do PDI) | **8** | 5 | ✅ **Incluir no MVP** |
| **1.A.3** Fila de conflitos com resolução manual | Sistema detecta conflito e apresenta diff para a coordenadora aprovar | 9 | 8 | 🔶 **Fase 2** — muito valor, mas complexidade alta para MVP |

> **✅ Decisão Fase 1:** Implementar **merge por entidade separada** (fotos nunca conflitam com campos de texto; campos de texto por relatório = unidade atômica de sync). Adicionar **timestamp de última edição** visível ao usuário.

---

### 🌱 Ramo 1.B — Usuária sem Familiaridade Tecnológica (Profissional de Apoio)

**Cenário:** A professora de apoio tem 55 anos, nunca usou sistema web, acessa pelo celular pessoal em 3G. Ela precisa subir um relatório quinzenal.

| Sub-ramo | Abordagem | Impacto | Complexidade | Veredicto |
|---|---|---|---|---|
| **1.B.1** Interface simplificada separada | App "modo apoio" com apenas 3 botões: Meus Alunos / Escrever / Enviar Foto | **9** | 4 | ✅ **Incluir no MVP** |
| **1.B.2** Formulário guiado passo a passo | Wizard sequencial com 1 pergunta por tela, sem menus nem sidebar | 8 | 3 | ✅ **Incluir no MVP** (complementar ao 1.B.1) |
| **1.B.3** Acesso via link mágico (magic link) | Login sem senha — recebe link por WhatsApp para cada sessão | 7 | 3 | ✅ **Incluir no MVP** — remove barreira de conta/senha |

> **✅ Decisão Fase 1:** O papel "Professora de Apoio" deve ter uma **UX completamente diferente** da coordenadora — wizard de relatório, magic link de acesso, upload de foto simplificado. A mesma base de código, mas duas "faces" da aplicação.

---

### 🌱 Ramo 1.C — Troca de Escola no Meio do Ano

**Cenário:** O aluno Pedro é transferido da Escola A para a Escola B em junho. Seus dados, fotos e relatórios devem seguir ele — mas a Profissional de Apoio da Escola A não deve mais acessá-los.

| Sub-ramo | Abordagem | Impacto | Complexidade | Veredicto |
|---|---|---|---|---|
| **1.C.1** Transferência com corte de acesso retroativo | Aluno muda de escola; apoio antiga perde acesso a partir da data de transferência | **9** | 4 | ✅ **Incluir no MVP** — critério LGPD e pedagógico |
| **1.C.2** Histórico imutável por período | Relatórios anteriores ficam "arquivados" — visíveis apenas para Valdirene, não para a nova apoio | 9 | 3 | ✅ **Incluir no MVP** |
| **1.C.3** Notificação automática de transferência | Sistema detecta mudança de escola e avisa Valdirene para reatribuir apoio | 7 | 5 | 🔶 **Fase 2** |

> **✅ Decisão Fase 1:** Aluno tem campo `escola_atual` + `histórico de escolas (com datas)`. Permissão de Profissional de Apoio é **vinculada ao período**, não ao aluno. Relatórios "congelados" do período anterior ficam somente para Valdirene.

---

## 🍎 Perspectiva 2 — Funcionalidades Ocultas (Low-Hanging Fruits)

### Problema Raiz
Funcionalidades simples de implementar que geram **adoção e retenção** imediata — reduzindo o risco de abandono do sistema nas primeiras semanas de uso.

---

### 🍏 Ramo 2.A — "Foto do Dia" com Contexto Pedagógico

**Cenário:** Hoje a Valdirene tira uma foto do João pintando. Ela precisa associar isso a uma competência do PDI. Atualmente, ela precisaria: abrir o aluno → galeria → upload → descrever. Isso é fricção demais no calor do momento.

**Ideia:** Um botão de atalho na tela inicial — **"📸 Registrar momento"** — que abre câmera/upload, pede aluno (autocomplete) e pede uma tag pedagógica (ex: "Autonomia", "Comunicação", "Motor fino") em 2 toques.

| Avaliação | Nota |
|---|---|
| Impacto no dia a dia | **9/10** |
| Complexidade técnica | **3/10** |
| **Relação custo-benefício** | ⭐⭐⭐⭐⭐ |

> **✅ Incluir no MVP.** Resolve a maior dor de uso em campo — o momento pedagógico acontece agora, o registro não pode esperar o fluxo completo.

---

### 🍏 Ramo 2.B — Relatório com "Última Vez Editado Por"

**Cenário:** Valdirene abre o relatório de uma Profissional de Apoio e não sabe se o que está vendo é a versão mais recente ou uma versão antiga. Não há indicação de quando foi editado ou por quem.

**Ideia:** Cada relatório exibe `Última edição: 08/03 às 14h32 — Profª Ana`. Nenhum "controle de versão" complexo — apenas auditoria simples de `updated_at` + `updated_by`.

| Avaliação | Nota |
|---|---|
| Impacto na confiança/QA | **8/10** |
| Complexidade técnica | **1/10** |
| **Relação custo-benefício** | ⭐⭐⭐⭐⭐ |

> **✅ Incluir no MVP.** É uma coluna no banco de dados — `updated_at`, `updated_by`. O valor percebido é enorme, especialmente para contextos de fiscalização e reuniões de SEMED.

---

### 🍏 Ramo 2.C — Checklist de Pendências por Aluno

**Cenário:** Valdirene atende 3 escolas com ~20 alunos cada. Ela perde tempo mentalmente rastreando "qual aluno ainda não tem PDI do 1º semestre?" ou "quais apoios ainda não enviaram o relatório de fevereiro?".

**Ideia:** Tela de dashboard com **indicadores de completude por aluno**: PDI ✅ | Relatório Apoio ❌ (pendente) | Fotos (3/5). Com filtros por escola e por período.

| Avaliação | Nota |
|---|---|
| Impacto operacional | **9/10** |
| Complexidade técnica | **4/10** |
| **Relação custo-benefício** | ⭐⭐⭐⭐ |

> **✅ Incluir no MVP (versão simples).** O dashboard não precisa ser sofisticado — apenas verde/vermelho por tipo de documento, por aluno. Implementação: query agregada no PostgreSQL + componente de listagem.

---

## ⚖️ Perspectiva 3 — Riscos de Negócio e LGPD

### Problema Raiz
Dados de **crianças com diagnóstico de Necessidade Educacional Especial** são classificados como **dados sensíveis** pelo Art. 11 da LGPD. Uma falha aqui não é só técnica — é **responsabilidade pessoal da professora e da instituição**.

---

### 🔴 Ramo 3.A — Dados Sensíveis sem Controle de Acesso Granular

**Cenário:** A Profissional de Apoio Ana consegue, por um bug ou descuido, acessar o laudo médico do aluno que não é dela. Esse laudo contém diagnóstico de TEA.

| Sub-ramo | Abordagem | Impacto | Complexidade | Veredicto |
|---|---|---|---|---|
| **3.A.1** RLS no PostgreSQL | Cada query retorna apenas dados autorizados por papel e tenant — sem depender da lógica de aplicação | **10** | 4 | ✅ **MVP — não negociável** |
| **3.A.2** Log de acesso a dados sensíveis | Toda visualização de laudo ou PDI gera registro: `quem viu`, `quando`, `qual aluno` | **9** | 3 | ✅ **MVP** — exigido pelo Art. 37 LGPD para rastreabilidade |
| **3.A.3** Campos marcados como "Restrito" | Campos com diagnóstico médico têm flag `sensivel=true`, nunca aparecem em exports gerais | 8 | 3 | ✅ **MVP** — implementação simples, alto impacto legal |

> **✅ Decisão Fase 1:** Implementar **RLS no banco + log de acesso + marcação de campos sensíveis**. Estes três itens juntos formam a base mínima de conformidade LGPD para dados de crianças com NEE.

---

### 🔴 Ramo 3.B — Ausência de Consentimento e Base Legal Documentada

**Cenário:** A família do aluno nunca assinou nada autorizando o armazenamento de fotos e laudos em uma plataforma digital. Em caso de denúncia ao ANPD, não há evidência de consentimento.

| Sub-ramo | Abordagem | Impacto | Complexidade | Veredicto |
|---|---|---|---|---|
| **3.B.1** Fluxo de cadastro com checkbox de consentimento | Ao cadastrar o aluno, exige confirmação de que os responsáveis autorizaram (com data registrada) | **9** | 2 | ✅ **MVP** |
| **3.B.2** Base legal alternativa: "obrigação legal" | O sistema AEE é obrigação da escola (LDB Art. 58). Documentar isso como base legal no sistema, sem precisar de consentimento explícito | 8 | 2 | ✅ **MVP** — complementar ao 3.B.1 com aviso institucional |
| **3.B.3** Portal do Responsável | Área onde os pais podem ver os dados do filho e solicitar exclusão | 7 | 8 | 🔶 **Fase 3** — alto impacto LGPD mas complexidade desnecessária agora |

> **✅ Decisão Fase 1:** Ao cadastrar cada aluno, o sistema registra: `consentimento_responsavel: true/false` + `data_consentimento` + `base_legal: "art58_LDB"`. Não é preciso portal do responsável no MVP — apenas o campo auditável.

---

### 🔴 Ramo 3.C — Retenção e Exclusão de Dados

**Cenário:** O aluno completa o ciclo escolar e sai da escola. Os dados devem ser mantidos por quanto tempo? E se a família pedir exclusão?

| Sub-ramo | Abordagem | Impacto | Complexidade | Veredicto |
|---|---|---|---|---|
| **3.C.1** Política de retenção declarada no sistema | Dados são retidos por X anos conforme obrigação legal educacional — exibido no aviso de privacidade | **8** | 2 | ✅ **MVP** — texto de política, sem automação |
| **3.C.2** Soft delete com flag de "arquivado" | Aluno "formado" vai para estado `arquivado` — dados existem mas não aparecem nos fluxos ativos | 7 | 2 | ✅ **MVP** — tecnicamente trivial, importante para organização |
| **3.C.3** Exclusão automatizada por data | Cron job que anonimiza/exclui dados após X anos | 7 | 6 | 🔶 **Fase 3** |

> **✅ Decisão Fase 1:** `status_aluno: ativo | arquivado | excluído`. Soft delete no MVP. Política de retenção como texto estático na tela de privacidade. Automação de exclusão fica para Fase 3.

---

## 📊 Matriz de Priorização Final

| ID | Ideia | Fase | Impacto | Complexidade | Prioridade |
|---|---|---|---|---|---|
| 1.A.2 | Merge por entidade separada (sync offline) | MVP | 8 | 5 | 🟡 Alta |
| 1.B.1+2 | UX diferenciada para Profissional de Apoio + wizard | MVP | 9 | 4 | 🔴 Crítica |
| 1.B.3 | Login via magic link para Profissional de Apoio | MVP | 7 | 3 | 🟡 Alta |
| 1.C.1+2 | Transferência de escola com corte de acesso | MVP | 9 | 4 | 🔴 Crítica |
| 2.A | Atalho "📸 Registrar Momento" | MVP | 9 | 3 | 🔴 Crítica |
| 2.B | "Última edição por [nome]" em relatórios | MVP | 8 | 1 | 🔴 Crítica |
| 2.C | Dashboard de pendências por aluno | MVP | 9 | 4 | 🔴 Crítica |
| 3.A.1 | RLS no PostgreSQL | MVP | 10 | 4 | 🔴 **Não negociável** |
| 3.A.2 | Log de acesso a dados sensíveis | MVP | 9 | 3 | 🔴 **Não negociável** |
| 3.A.3 | Campos marcados como "Restrito" | MVP | 8 | 3 | 🔴 **Não negociável** |
| 3.B.1+2 | Consentimento + base legal no cadastro | MVP | 9 | 2 | 🔴 **Não negociável** |
| 3.C.1+2 | Política de retenção + soft delete | MVP | 8 | 2 | 🟡 Alta |
| 1.A.3 | Fila de conflitos com diff visual | Fase 2 | 9 | 8 | 🔶 Futura |
| 1.C.3 | Notificação de transferência | Fase 2 | 7 | 5 | 🔶 Futura |
| 3.B.3 | Portal do Responsável | Fase 3 | 7 | 8 | 🔶 Futura |
| 3.C.3 | Exclusão automatizada por data | Fase 3 | 7 | 6 | 🔶 Futura |

---

## 🧭 Pontos Cegos Críticos Encontrados

Estes itens **não estavam no escopo original** e merecem discussão antes de fechar o PRD:

1. **🔑 Magic link / login simplificado para Profissional de Apoio** — sem isso, a adoção por professoras com baixa afinidade digital fracassa no dia 1.
2. **📸 Captura rápida "no momento"** — o fluxo atual exige navegar por menus para tirar uma foto associada; isso mata o hábito de uso.
3. **⚖️ Base legal declarada no sistema** — sem isso, o sistema pode ser operacionalmente funcional mas juridicamente vulnerável desde o primeiro dado cadastrado.
4. **🔒 RLS no banco de dados** — a arquitetura atual menciona RLS mas não o coloca como requisito de MVP. Dado que há dados sensíveis de crianças, **não pode ser Fase 2**.
5. **📋 Transferência de escola como evento de negócio** — não estava modelada; aluno parecia ser um dado estático de escola.

---

*Análise gerada em 10/03/2026 — Sessão de Tree-of-Thought — Sistema AEE*
