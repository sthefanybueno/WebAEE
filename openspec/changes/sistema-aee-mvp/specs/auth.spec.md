# Especificações de Comportamento: Autenticação e Autorização

> Este documento segue as definições do **RFC 2119**. Palavras como MUST, MUST NOT, REQUIRED, SHALL, SHALL NOT, SHOULD, SHOULD NOT, RECOMMENDED, MAY e OPTIONAL no texto devem ser interpretadas conforme o RFC.

## Cenário 1: Login Válido e Redirecionamento
**Given (Dado)** que o usuário possui credenciais ativas e cadastradas no banco,
**When (Quando)** o usuário submete e-mail e senha corretos ao formulário de login via Client Component,
**Then (Então)** a API MUST retornar HTTP 200 OK com o token JWT emitido.
**And (E)** o frontend MUST decodificar o payload do token, identificar o `role` do usuário e direcioná-lo imperativamente para seu respectivo layout protegido (e.g. `/dashboard` para AEE).

## Cenário 2: Login Inválido (Caminho de Erro Front/Back)
**Given (Dado)** que o usuário insere uma combinação errada de e-mail e senha,
**When (Quando)** ele tenta logar,
**Then (Então)** a API MUST identificar o descasamento de hash e retornar HTTP 401 Unauthorized imediatamente (sem delay artificial).
**And (E)** o Client Component do Next.js MUST capturar o erro e mostrar um outline vermelho nos inputs usando a prop de erro do `shadcn/ui Form`, MUST NOT apagar o e-mail providenciado pelo usuário para UX.

## Cenário 3: Proteção Estrita Transversal de Rotas Backend (RBAC)
**Given (Dado)** que um usuário que ostenta a flag `role: prof_apoio` logou validamente,
**When (Quando)** este usuário tenta disparar um POST para rotas dedicadas à `Coordenação` ou `Prof. AEE` (como a rota de Cadastro de Novo Usuário),
**Then (Então)** o middleware da API MUST interceptar via o decorator de papel e retornar HTTP 403 Forbidden.
**And (E)** O backend MUST NOT abrir transação nem tocar no PostgreSQL nestes casos cross-role blocker.

## Cenário 4: Interceptação Automática de Token Ausente/Expirado
**Given (Dado)** que uma requisição `fetch` interceptada pelo frontend seja retida por tempo limite ou token expirado na API,
**When (Quando)** o backend rejeitar com HTTP 401 Unauthorized,
**Then (Então)** a camada global axios/fetch do React MUST forçar o unmount da rota autenticada e empurrá-lo de volta para a `/login`.
