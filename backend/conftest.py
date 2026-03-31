"""
conftest.py — raiz do backend
==============================
Configurações globais de pytest.

Notas:
- SQLModel com 'table=True' registra metadados em _SQLModelState.
  Ao importar múltiplas entidades em conjunto (ex: via domain/__init__.py),
  o SQLModel tenta recriar tabelas já registradas.
  A solução por ora é NÃO importar o domain/__init__ nos testes unitários
  de domínio — cada test_*.py importa somente o que precisa.
"""
