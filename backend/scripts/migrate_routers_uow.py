"""
Script: migrar routers de session= para uow= com SQLAlchemyUnitOfWork.
Execução: python scripts/migrate_routers_uow.py (a partir do backend/)
"""
import pathlib
import re

routers_dir = pathlib.Path("app/interfaces/routers")
modified = []

for py_file in routers_dir.glob("*.py"):
    if py_file.name == "students.py":
        continue  # já migrado manualmente

    content = py_file.read_text(encoding="utf-8")

    if "session=session" not in content and "session=AsyncSession" not in content:
        continue

    # 1. Adicionar import de SQLAlchemyUnitOfWork se não houver
    uow_import = "from app.infrastructure.unit_of_work_impl import SQLAlchemyUnitOfWork\n"
    if "SQLAlchemyUnitOfWork" not in content:
        # Inserir após a última linha de imports de infrastructure
        content = re.sub(
            r"(from app\.infrastructure\.[^\n]+\n)(?!from app\.infrastructure)",
            r"\1" + uow_import,
            content,
            count=1,
        )

    # 2. Substituir session=session, por uow=SQLAlchemyUnitOfWork(session),
    content = re.sub(
        r"session=session,?\s*\n",
        "uow=SQLAlchemyUnitOfWork(session),\n",
        content,
    )
    # Caso session=session seja o último argumento sem vírgula antes do )
    content = re.sub(
        r"session=session\s*\)",
        "uow=SQLAlchemyUnitOfWork(session))",
        content,
    )

    py_file.write_text(new_content := content, encoding="utf-8")
    modified.append(str(py_file))

for f in modified:
    print("OK:", f)
print(f"\nTotal: {len(modified)} arquivo(s)")
