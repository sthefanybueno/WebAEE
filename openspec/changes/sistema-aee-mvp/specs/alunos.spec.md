# Especificações de Comportamento: Gestão de Alunos (LGPD e RLS)

> Este documento segue as definições do **RFC 2119**.

## Cenário 1: Cadastro Básico de Aluno (Caminho Feliz)
**Given (Dado)** que uma Professora AEE (ou Coordenação) deseja cadastrar um aluno,
**When (Quando)** ela preenche o formulário com dados essenciais e marca "Consentimento LGPD Ativo",
**Then (Então)** o backend MUST inserir o Aluno com status `ativo` atrelado ao `tenant_id` atual.
**And (E)** a interface MUST fechar o Modal e anexar (hydrate) a nova row na Tabela.

## Cenário 2: Falta de Consentimento LGPD (Caminho de Erro)
**Given (Dado)** que o usuário ignora ou desmarca o checkbox "Possuo Consentimento dos Responsáveis",
**When (Quando)** ele tenta enviar o POST para a API de `/alunos`,
**Then (Então)** o Pydantic Schema de validação MUST interceptar o erro de payload (campo boleano retornado false) e estourar HTTP 422 Unprocessable Entity.
**And (E)** o FrontEnd MUST mostrar um badge de erro de "Consentimento Obrigatório" pelo standard shadcn.

## Cenário 3: Exclusão Lógica Estrita (Soft Delete)
**Given (Dado)** que um aluno se muda de cidade definitivamente,
**When (Quando)** a Coordenação aciona o botão `Excluir Cadastro` em um modal destrutivo,
**Then (Então)** a query SQLAlchemy MUST NOT usar o verbo SQL destrutivo de `DELETE FROM students`.
**And (E)** MUST apenas executar um PATCH setando `status = 'arquivado'`. A UI MUST sumir com o aluno das visualizações padrões.

## Cenário 4: Blindagem de Acesso a Laudos (Auditoria)
**Given (Dado)** que o dado 'Laudo Clínico' do Aluno é sensível,
**When (Quando)** o usuário clica em "Ver Laudo" na aba de Documentos do Perfil,
**Then (Então)** o Backend MUST despachar uma inserção imediata e irrecusável em `audit_log` marcando o evento, usuário e timstamp.
