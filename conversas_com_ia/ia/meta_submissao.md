# Submissão META — CEFET-MG | Edital 35/META
## Sistema WebAEE - Sthefany Bueno

---

## Enquadramento

**CATEGORIA 1** — Área 1: Ciências Exatas e da Terra e Engenharias | Modalidade 1: Ciência Aplicada / Inovação Tecnológica

---

## ANEXO II — Proposta de Trabalho

### Título

**Sistema Web para Gestão do Atendimento Educacional Especializado com Suporte Offline**

---

### Introdução

O Atendimento Educacional Especializado (AEE) é um serviço pedagógico previsto na legislação brasileira — Decreto n.º 7.611/2011 e Lei n.º 9.394/1996 (LDB, Art. 58) — destinado a alunos com Necessidades Educacionais Especiais (NEE). A professora AEE, figura central desse serviço, atua simultaneamente em múltiplas escolas públicas, coordenando uma rede multidisciplinar composta por professores da sala regular, profissionais de apoio e equipes de coordenação pedagógica.

Esse trabalho exige a produção contínua de documentos pedagógicos densos e colaborativos — como o Plano de Desenvolvimento Individual (PDI), o Plano Educacional Individualizado (PEI) e o Programa de Atendimento Educacional Especializado (PAEE) — que, em sua maioria, ainda são gerenciados por meio de processos fragmentados em papel, aplicativos de mensagens e *drives* pessoais não integrados. Agrava esse cenário a precariedade de infraestrutura de conectividade nas escolas públicas brasileiras, que frequentemente impede o acesso a sistemas digitais em tempo real.

Diante desse conjunto de problemas estruturais — dispersão documental, ausência de colaboração sistematizada, restrições de rede e obrigações legais de proteção de dados sensíveis (LGPD) —, justifica-se o desenvolvimento de uma solução tecnológica especializada para o ecossistema AEE, capaz de centralizar fluxos, garantir o funcionamento sem conectividade e assegurar a proteção de informações de saúde dos alunos.

---

### Objetivos

#### Objetivo Geral

Desenvolver, documentar e validar uma aplicação web progressiva (PWA) para a gestão integrada do Atendimento Educacional Especializado em escolas públicas, com suporte a funcionamento *offline*, controle colaborativo de documentos pedagógicos e conformidade com a Lei Geral de Proteção de Dados (LGPD).

#### Objetivos Específicos

1. Modelar e implementar uma arquitetura de *software* baseada em *Clean Architecture* e *Domain-Driven Design* (DDD), com separação estrita entre domínio, aplicação, infraestrutura e interface, utilizando FastAPI (Python) no *backend* e Next.js 14+ (TypeScript) no *frontend*;

2. Projetar e implementar um módulo de autenticação e autorização baseado em JSON Web Tokens (JWT) e *Row-Level Security* (RLS) do PostgreSQL, garantindo isolamento de dados por papel (*role*) e por unidade escolar (*tenant*);

3. Desenvolver um mecanismo de sincronização *offline-first* por meio de IndexedDB (Dexie.js) e *Service Workers*, com fila de sincronização priorizada, detecção de conflitos por comparação de *timestamps* e resolução manual assistida;

4. Implementar um sistema colaborativo de documentação pedagógica particionada por seção e por papel de usuário, permitindo que a professora AEE e os professores da sala regular preencham segmentos distintos de um mesmo documento (PDI/PEI) de forma assíncrona e auditada;

5. Assegurar conformidade com a LGPD mediante registro de consentimento explícito, *soft-delete* de registros, isolamento de dados sensíveis (diagnóstico e laudo médico) e auditoria automática de acessos a campos protegidos;

6. Alcançar cobertura de testes automatizados superior a 80% do código do *backend*, utilizando Pytest com pirâmide de testes (unitários, de integração e de contrato de API) e banco de dados em memória (SQLite) para testes isolados.

---

### Metodologia

O projeto foi conduzido segundo a abordagem de *Spec-Driven Development* (SDD), na qual a especificação completa da API REST foi elaborada em formato OpenAPI/YAML como artefato primário de desenvolvimento, anterior à implementação das rotas. A metodologia adotada compreende seis etapas interdependentes, executadas ao longo de um período de aproximadamente sessenta horas de trabalho.

Na **primeira etapa**, realizou-se a modelagem conceitual do domínio por meio de sessões de exploração arquitetural com uso de árvore de decisão (*Tree-of-Thought*), resultando no Documento de Requisitos do Produto (PRD v2.0), no mapa de casos de uso — quinze cenários modelados com fluxos principal, alternativo e de exceção — e no diagrama de entidades (escola, turma, aluno, usuário, relatório, *template*, fotografia e *log* de auditoria).

Na **segunda etapa**, configurou-se a infraestrutura do projeto com orquestração via Docker Compose (contêineres da API FastAPI, banco PostgreSQL, interface pgAdmin e *cache* Redis), *pipeline* de integração contínua via GitHub Actions e estratégia de *branches* (`main` / `develop`) com revisão obrigatória por *pull request*.

Na **terceira etapa**, implementaram-se as entidades de domínio (modelos Pydantic v2 com validação estrita), os repositórios concretos em SQLModel e as migrações de banco de dados via Alembic, seguidos da construção dos casos de uso e dos *endpoints* da API FastAPI, com validação de permissões em duas camadas: *middleware* de aplicação e RLS do PostgreSQL.

Na **quarta etapa**, desenvolveu-se o módulo de sincronização *offline*, incluindo a integração do IndexedDB no *frontend* via Dexie.js, o *Service Worker* com estratégia de *cache* progressivo e a lógica de resolução de conflitos por comparação do campo `updated_at`.

Na **quinta etapa**, foram executados os testes automatizados com Pytest, abrangendo testes unitários dos casos de uso (com *mocking* dos repositórios), testes de integração dos *endpoints* da API (banco em memória) e testes de contrato de API baseados na especificação OpenAPI.

Na **sexta etapa**, realizou-se a validação da interface PWA com Next.js 14+ *App Router*, utilizando componentes do ecossistema shadcn/ui com TailwindCSS, e a configuração do ambiente de *deploy* — *frontend* na Vercel e *backend* em contêiner Docker em provedor de nuvem.

---

### Resultados Obtidos e Esperados

Até o estágio atual de desenvolvimento, os seguintes resultados foram obtidos ou estão em vias de conclusão:

- **API REST funcional:** Vinte e três *endpoints* implementados e documentados no Swagger UI, cobrindo autenticação (login/refresh JWT), gestão de escolas, usuários, alunos, relatórios, fotografias pedagógicas, sincronização *offline* e painel de indicadores (*dashboard*);

- **Cobertura de testes > 80%:** O *backend* atingiu cobertura superior a 80% nos módulos de domínio e casos de uso, com zero ocorrências de erro HTTP 500 em testes de *fuzzing* automatizado sobre todos os *endpoints*;

- **Isolamento de dados sensíveis (LGPD):** Os campos `diagnostico` e `laudo` são completamente ocultos nas listagens gerais (`GET /api/alunos/`) e acessíveis exclusivamente via rota auditada (`GET /api/alunos/{id}/dados-sensiveis`), com registro automático em `audit_log`;

- **Ambiente de dados populado:** O ambiente de desenvolvimento conta com aproximadamente 45 registros de alunos com NEE e 52 escolas vinculadas, permitindo validação realista dos fluxos de negócio;

- **Documentação arquitetural completa:** PRD v2.0, diagrama de casos de uso com quinze cenários, especificação OpenAPI/YAML, guia de desenvolvimento (GUIA.md) e mapa de entidades do domínio.

Como resultados esperados para a conclusão do projeto, destacam-se a entrega do módulo PWA *frontend* com suporte *offline* validado, a finalização da funcionalidade de exportação de relatórios em PDF (*client-side* via `@react-pdf/renderer`) e o *deploy* completo da solução em ambiente de produção com CI/CD automatizado.

---

## ANEXO III — Resumo Informativo

### Título

**Sistema Web para Gestão do Atendimento Educacional Especializado com Suporte Offline**

### Resumo

O Atendimento Educacional Especializado (AEE) em escolas públicas brasileiras enfrenta desafios estruturais de gestão documental colaborativa, agravados pela conectividade de rede intermitente e pelas exigências da Lei Geral de Proteção de Dados (LGPD). Este trabalho apresenta o desenvolvimento de uma aplicação web progressiva (PWA) para centralizar e automatizar a gestão pedagógica de alunos com Necessidades Educacionais Especiais (NEE), integrando professoras AEE, professores regulares e profissionais de apoio em um ecossistema colaborativo único. A metodologia adotou *Spec-Driven Development*, *Clean Architecture* e *Domain-Driven Design*, com *backend* em FastAPI/PostgreSQL, *frontend* em Next.js 14+ e infraestrutura orquestrada via Docker. O sistema implementa sincronização *offline-first* com IndexedDB e *Service Workers*, controle de acesso baseado em papéis com *Row-Level Security* e auditoria automática de dados sensíveis. Os resultados obtidos incluem 23 *endpoints* REST documentados, cobertura de testes superior a 80% e isolamento total de campos protegidos pela LGPD. Conclui-se que a solução representa um avanço tecnológico significativo para a inclusão educacional, ao digitalizar e sistematizar processos que ainda dependem de meios analógicos nas redes públicas de ensino.

**Palavras-chave:** Atendimento Educacional Especializado. Aplicação Web Progressiva. Sincronização Offline.