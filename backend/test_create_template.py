import asyncio

from sqlalchemy.ext.asyncio import AsyncSession

from app.application.use_cases.reports.create_report_template import (
    CreateReportTemplateInput,
    CreateReportTemplateUseCase,
)
from app.domain.entities.user import PapelUsuario
from app.infrastructure.database import engine
from app.infrastructure.repositories.report_template_repository_impl import (
    SQLModelReportTemplateRepository,
)
from app.infrastructure.unit_of_work_impl import SQLAlchemyUnitOfWork


async def main():
    async with AsyncSession(engine) as session:
        uow = SQLAlchemyUnitOfWork(session)
        repo = SQLModelReportTemplateRepository(session)
        use_case = CreateReportTemplateUseCase(uow, repo)
        
        dto = CreateReportTemplateInput(
            nome="Test Template",
            descricao="Test Desc",
            secoes={"campos": [{"id": "c1", "label": "Test", "tipo": "text"}]},
            papeis_com_acesso=["admin"],
            papel_autor=PapelUsuario.ADMIN
        )
        
        try:
            res = await use_case.execute(dto)
            print("SUCCESS! ID:", res.id)
        except Exception:
            import traceback
            traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(main())
