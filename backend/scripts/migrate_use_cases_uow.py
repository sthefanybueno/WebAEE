"""
Script de refatoração: migra Use Cases restantes de AsyncSession → AbstractUnitOfWork.
Execução: python scripts/migrate_use_cases_uow.py (a partir do diretório backend/)
"""
import os
import re
import pathlib

use_cases_root = pathlib.Path("app/application/use_cases")
modified = []

for py_file in use_cases_root.rglob("*.py"):
    content = py_file.read_text(encoding="utf-8")
    
    # Pula arquivos que já foram migrados ou que não usam AsyncSession
    if "from sqlmodel.ext.asyncio.session import AsyncSession" not in content:
        continue
    if "students" in str(py_file):
        continue  # já migrado manualmente

    # 1. Substituir import
    new_content = content.replace(
        "from sqlmodel.ext.asyncio.session import AsyncSession",
        "from app.application.ports.unit_of_work import AbstractUnitOfWork",
    )
    # 2. Substituir assinatura do parâmetro
    new_content = re.sub(r"session: AsyncSession", "uow: AbstractUnitOfWork", new_content)
    # 3. Substituir uso de transação
    new_content = re.sub(
        r"async with self\.session\.begin\(\):",
        "async with self.uow.transaction():",
        new_content,
    )
    # 4. Substituir atribuição no __init__
    new_content = re.sub(r"self\.session = session", "self.uow = uow", new_content)

    py_file.write_text(new_content, encoding="utf-8")
    modified.append(str(py_file))

for f in modified:
    print("OK:", f)

print(f"\nTotal modificado: {len(modified)} arquivo(s)")
