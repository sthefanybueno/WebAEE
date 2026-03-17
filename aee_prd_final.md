# Sistema AEE — Documento de Requisitos e Proposta Arquitetural (PRD v2.0)

**Versão:** 2.0 — Revisão e Expansão de Escopo  
**Data:** 17/03/2026  
**Status:** ✅ Aprovado para desenvolvimento (Fase de Elaboração V2)  
**Autores:** Sessões de exploração arquitetural + Tree-of-Thought + Expansão V2.0 (Comunidade Pedagógica e Ecossistema da Escola)

---

## 1. Visão Geral do Produto

### O que é

O **Sistema AEE** é uma plataforma de colaboração pedagógica multidisciplinar e uma aplicação web progressiva (PWA) para gestão do Atendimento Educacional Especializado e acompanhamento do desenvolvimento de alunos em escolas públicas. Ele centraliza o trabalho da Professora AEE, Professores de Sala Regular e Profissionais de Apoio, substituindo fluxos dispersos em papel, WhatsApp e drives pessoais.

### Problema Principal

A Professora AEE atua em múltiplas escolas simultaneamente, coordenando os atendimentos especializados junto a Profissionais de Apoio, Professores Regulares e alunos com Necessidades Educacionais Especiais (NEE). Este trabalho requer a produção de documentos pedagógicos densos e colaborativos, num cenário de escola pública que frequentemente sofre com **conectividade de rede intermitente ou inexistente**.

O sistema resolve o problema garantindo que todos os agentes do ecossistema colaborem em um ambiente centralizado, com segurança máxima de acesso aos dados, usabilidade voltada para ação (UX focada em abater pendências) e suporte robusto para trabalho offline.

### Evolução do Escopo (PRD v2.0)

O sistema expande além de uma ferramenta isolada da Prof. AEE, tornando-se o **ecossistema de colaboração acadêmica** completo para alunos NEE:
- Integra a grade de horários, turmas e matérias da escola.
- Incorpora o Professor da Sala Regular ativamente no preenchimento de documentos pedagógicos.
- Estruturação profunda de hierarquias de entidades (escolas > turmas > matérias > professores > alunos).

---

## 2. Entidades do Sistema e Hierarquia

Para suportar fluxos avançados de cruzamento de turmas com a gestão pedagógica, o banco de dados e a sincronização offline atuarão sobre a seguinte hierarquia:

### 2.1 Ecossistema da Escola (Macro)
* **Escola:** O ambiente base da instituição.
* **Matérias (Disciplinas):** Cadastro de currículos (ex: Matemática, Português, R1, R2, etc).
* **Turmas:** Agrupamentos de alunos que pertencem a uma escola.
* **Professor (Sala Regular):** Vinculado a uma ou mais matérias; leciona em uma ou mais turmas. Compartilha com o AEE a responsabilidade por partes específicas da documentação do aluno NEE.
* **Alunos:** Pertencem a uma turma (e, por consequência, herdam os professores atrelados àquela turma).

### 2.2 Gestão AEE (Micro)
* **Professora AEE:** Atende escolas e gerencia seus alunos foco. Responsável pela coordenação pedagógica da plataforma.
* **Profissional de Apoio / Prof. PI:** Profissionais vinculados a alunos para suporte ou práticas inclusivas diárias.
* **Modelos de Relatório (Templates):** Cadastro flexível (mutável) da estrutura dos relatórios avaliativos no banco (JSON/Seções).
* **Horários de Atendimento:** Grade de horários matriz (Seg a Sex), dividida em blocos ao longo do dia, cruzando o aluno, a Prof. AEE e a grade escolar da turma (matéria / horário) para assegurar o agendamento correto e garantir que o aluno não saia de atividades essenciais curriculares sem planejamento.

---

## 3. Matriz de Papéis e Permissões (Documentos Colaborativos)

A V2.0 refina a divisão de responsabilidades, introduzindo relatórios **colaborativos e particionados**. O sistema deve gerenciar permissões a nível de "seção do documento" utilizando Row-Level Security e validações de aplicação.

| Papel | Relatório Responsável | Periodicidade |
| :--- | :--- | :--- |
| **Professora AEE** | PAEE | Trimestral |
| | PDI Fundamental (Parte 1) | Trimestral |
| | PDI Ed. Infantil (Parte 1) | Trimestral |
| | PEI Ed. Infantil (Parte 1) | Trimestral |
| | Entrevista Familiar | Anual |
| | Estudo de Caso | Anual |
| | Oferta do Atendimento / Desistência | Anual / Sob demanda |
| | Avaliação Fundamental / Educação | Sob demanda |
| | Registros de Atividades Desenvolvidas | Todo atendimento (Diário) |
| | Observações Complementares | A qualquer momento |
| **Professor (Sala Regular)** | PDI Fundamental (Parte 2 - seção de sua matéria) | Trimestral |
| | PDI Ed. Infantil (Parte 1)* | Trimestral |
| | PEI Ed. Infantil (Parte 2) | Trimestral |
| **Profissional de Apoio**| Relatório de Apoio | Anual |

*\* Observação de Colaboração (PDI Ed. Infantil - Parte 1): Como ambos preenchem a Parte 1, a edição ocorrerá em formato colaborativo assíncrono. O sistema auditará alterações. A Prof. AEE terá permissões finais para revisar, consolidar e "travar/fechar" o documento.*

> **Importante:** Assim como na V1, responsáveis (famílias) e alunos **não possuem acesso** ao sistema por questões de escopo e LGPD. O papel "Coordenação" e "Admin" permanecem como super-usuários para configuração e visão gerencial ampla.

---

## 4. Mapeamento de Telas e Experiência (UX/UI)

O foco da interface (Mobile-First / PWA) será impulsionar o encerramento de pendências com **Call-to-Actions (CTAs) eficientes**, evitando "labirintos de navegação".

### 📱 Tela Principal — Professora AEE
* **Header:** Seletor ágil de Escola (troca de contexto).
* **Dashboard Resumo:** Total de alunos foco da escola + Qtd. total de relatórios atrasados/pendentes.
* **Ações Frequentes:** Botão hero (rápido) **"Relatório Diário"** (Atalho *Registrar Momento*, com upload de foto e 3 toques max) e navegação para últimos alunos visualizados.
* **Footer Navigation:** `Home` \| `Meus Alunos` \| `Meus Relatórios` \| `Outros` *(Acesso as configs: Cadastros Base, Matérias, Perfis de Professores).*

### 📱 Tela Principal — Professor (Sala Regular)
* **Dashboard Prático:** Qual a quantidade de pendências imediatas? (Focado em preencher a Parte 2 dos PDIs/PEIs de suas disciplinas).
* **Ações:** Listagem consolidada unicamente dos Alunos NEE mapeados em suas turmas.
* **Footer Navigation:** `Home` \| `Meus Alunos` \| `Meus Relatórios`.

### 📱 Tela Principal — Profissional de Apoio
* **Dashboard Direto:** Status dos seus Relatórios Anuais / periódicos a realizar.
* **Ações:** Listagem fechada e restrita aos alunos em que possui vínculo ativo no período vigente.

### 👤 Perfil do Aluno (Visão Prof. AEE)
* **Cabeçalho:** Card fotográfico do estudante, Nome, Idade, Status do Relatório Diário / Presença do Atendimento de Hoje (Concluído/Pendente).
* **Pendências Documentais:** Lista com badges coloridos (vermelho/verde) apontando os PDI/PEIs que faltam assinar, atualizar ou cobrar.
* **Ação Rápida no Ponto:** "Fazer relatório diário [Data de Hoje]".
* **Galeria Ativa:** Grid de fotos pedagógicas com o botão central "Adicionar Foto" (captura imersiva offline-ready de fotos indexadas ao aluno).

### 📋 Hub Documental ("Meus Relatórios")
* A visão central para gestão documental: **Cards agrupados por tipo/modelo**. Ex: Card de "PDIs", Card "Entrevistas", apontando volume e gargalos. Central para baixar versão em lote ou aplicar PDF export.

---

## 5. Arquitetura Central e Análise Crítica V2.0

### 5.1 A Malha Curricular e Matriz de Horários
Um dos grandes desafios introduzidos na V2.0:
* O acompanhamento semanal é visual (cruza-se Matéria/Turma x Horário Atendimento x Prof. AEE).
* A integração precisa ser "à prova de erros" para garantir e rastrear que o Prof de Apoio localize o aluno e que a Prof. AEE não saque o aluno de matérias vitais (Matemática, PT-BR) para ir à sala de recursos.
* A interface deverá exibir essa Grade de Atendimento em formato calendário simples.

### 5.2 Estratégia Offline-First (Cache Progressivo Profundo)
O problema de conectividade da Prof. AEE na sala de recursos torna-se exponencial com a inclusão de Turmas e Professores Regulares.
* Quando a Prof. AEE puxa dados online e entra na escola (ficando offline), a persistência local (IndexedDB) tem que trazer **dados relacionais pré-calculados**: turmas daquela escola, grade de matérias da turma, relatórios pendentes, etc.
* Sem isso, a Prof. AEE, no ambiente sem rede, tentaria iniciar um relatório diário e o celular dela "não saberia" em qual aula o aluno deveria estar, impedindo o preenchimento qualificado.
* A política de sincronismo offline mantém merge por entidades como text/fields (Relatórios atômicos atualizando o campo `updated_at`) e upload de media isolado (Fila idempotente para o R2 / S3 Storage).

### 5.3 Conformidade com Segurança Sensível e LGPD (Stack Base)
### 5.3 Conformidade com Segurança Sensível e LGPD (Stack Base)
A arquitetura permanece baseada na stack imutável apresentada na elaboração V1:

### 5.4 Stack Tecnológica Exigida (O Motor e a Interface)

| Camadas e Disciplinas | Tecnologia Fundamental | Justificativa / Conceitos-Chave |
|---|---|---|
| **Backend (API)** | **FastAPI + PostgreSQL** | FastAPI com tipagem estrita via Pydantic v2. Banco de dados relacional PostgreSQL[cite: 107, 123, 209]. |
| **Frontend (PWA)** | **Next.js 14+ + TypeScript** | Next.js 14+ com App Router. TypeScript obrigatório em 100% dos arquivos[cite: 139, 151]. |
| **Estilização e UI** | **TailwindCSS + Shadcn/UI** | TailwindCSS e uso exclusivo de componentes do ecossistema shadcn/ui[cite: 162, 163]. |
| **Banco de Dados (ORM)** | **PostgreSQL + SQLModel** | Nuvem relacional (RLS Habilitado para ocultação forçada baseada em acesso e base legal LGPD Art 58). Manipulação do banco efetuada nativamente através do framework SQLModel. |
| **Autenticação** | **JWT (JSON Web Tokens)** | Proteção estrita aos endpoints da API. Proibido Magic Links (devido ao sigilo dos dados médicos de alunos). |
| **Arquivos Brutos (Storage)**| **PostgreSQL (Bytea / Large Objects)** | Armazenamento de arquivos e imagens convertido para armazenamento nativo direto no banco relacional para simplificação de infraestrutura. |

### 5.5 Arquitetura, Testes e Qualidade

| Metodologia e Ferramentas | Descrição e Requisitos Mínimos |
|---|---|
| **Arquitetura Base** | Utilização de **Clean Architecture** associada ao **Domain-Driven Design (DDD)** para separação clara de responsabilidades. |
| **Desenvolvimento API** | Adoção do **Spec-Driven Development (SDD)**: A API deve ser descrita primeiro (OpenAPI/YAML) antes de escrever as rotas. Uso do **Swagger UI** para testes visuais. |
| **Testes Backend** | Obrigatório uso do **Pytest**, garantindo cobertura rigorosa e indispensável de **>80% do projeto**. Construção forte sobre Pirâmide de Testes (E2E, Integração e Unitários) e Mocking (SQLite em mem). |
| **Testes Frontend** | Validação através do **Vitest** e **Testing Library** para simulação de interações e comportamento de renderização dos componentes React. |

### 5.6 Infraestrutura, DevOps e Inteligência Artificial

| Domínio DevOps | Aplicação no Projeto |
|---|---|
| **Infraestrutura e Orquestração** | Orquestração completa via **Docker e docker-compose**. Otimização com multi-stage builds[cite: 177, 186, 188]. |
| **Repositório e CI/CD** | **Git/GitHub** com branches isoladas (`main`, `develop`), Pull Requests exigindo Code Review e pipeline construído 100% via **GitHub Actions** para testes e entregas. |
| **Deploy Oficial** | Frontend na **Vercel** e Backend/DB em provedor de nuvem via **Docker Registry**[cite: 203, 207, 208]. |
| **Integração IA** | Adotados **Stitch AI** para co-pilotagem de código e **Figma AI** no prototipamento. Condicionante central: Prompt Engineering afiado e validação crítica contra *alucinações*. |

### 5.7 Documentação Final (Entregáveis Críticos)

A documentação será insumo oficial e corresponde a uma parcela central da validação arquitetural. Deverá conter obrigatoriamente:
1. Especificação de API detalhada via arquivo **OpenAPI/YAML** (gerado no SDD).
2. **README.md completo** contendo instruções de Setup (Docker), scripts, topologia do DB e comandos primários de build e teste.

---

### 6. Cronograma e Fases (Constraint de 60 horas)

Devido ao cenário de projeto acadêmico/aulas, o desenvolvimento possui **prazo estrito de 60 horas totais de trabalho**. Todas as estimativas abaixo devem caber neste orçamento de tempo agressivo, exigindo uso intenso das ferramentas de produtividade e IA.

| Fase | Foco Prioritário | Esforço Alocado |
|---|---|---|
| **Semana 1: Arquitetura e SDD** | Setup Docker, Especificação OpenAPI (YAML), Configuração de CI/CD basilar e Modelagem de Dados PostgreSQL (RLS). | ~10 horas |
| **Semanas 2-3: Core Backend** | Construção das 5 rotas CRUD via FastAPI. Testes TDD via Pytest focados em cobrir >80%. Implementação do JWT e Auth. | ~20 horas |
| **Semanas 4-5: PWA e Interface** | Setup do Next.js (Server/Client components). Construção ágil das vitrines com *shadcn/ui* e Tailwind. PDI Colaborativo Simplificado. Setup offline base. | ~20 horas |
| **Semana 6: QA, Integração e Deploy** | Garantia de integração ponta a ponta (Vitest/Testing Library). Deploy vercel (frontend) e nuvem (backend em container). Finalização do `README.md` abrangente. | ~10 horas |

*(Nota: Fases complexas de "Consolidação V2" como diff visual complexo, template engine drag-and-drop e integrações multi-tenant com SEMEDs ficam oficialmente para evolução futura pós-disciplina, garantindo a entrega do escopo dentro de 60h).*
