"""
Sistema AEE — Router: Notificações
=====================================
Responsabilidade: traduzir HTTP → Use Case → Resposta HTTP.

Endpoints:
  GET  /api/notificacoes         — lista notificações do tenant
  PATCH /api/notificacoes/{id}/lida — marca notificação como lida
"""

import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlmodel.ext.asyncio.session import AsyncSession

from app.application.use_cases.notifications.list_notifications import (
    ListNotificationsInput,
    ListNotificationsUseCase,
)
from app.application.use_cases.notifications.mark_notification_read import (
    MarkNotificationReadInput,
    MarkNotificationReadUseCase,
)
from app.domain.exceptions import (
    DomainException,
    NotificacaoNaoEncontradaError,
    TenantMismatchError,
)
from app.infrastructure.database import get_session
from app.infrastructure.repositories.notification_repository_impl import (
    SQLModelNotificationRepository,
)
from app.interfaces.dependencies import CurrentUser, get_current_user

router = APIRouter(prefix="/api/notificacoes", tags=["notificações"])

_DOMAIN_TO_HTTP: dict[type, int] = {
    NotificacaoNaoEncontradaError: status.HTTP_404_NOT_FOUND,
    TenantMismatchError: status.HTTP_403_FORBIDDEN,
}


def _domain_to_http(exc: DomainException) -> HTTPException:
    http_status = _DOMAIN_TO_HTTP.get(type(exc), status.HTTP_400_BAD_REQUEST)
    return HTTPException(status_code=http_status, detail=str(exc))


@router.get("/", response_model=list[dict])
async def listar_notificacoes(
    apenas_nao_lidas: bool = Query(default=False, description="Retorna apenas notificações não lidas."),
    current_user: CurrentUser = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    """Lista notificações do tenant do usuário logado.

    Visível para: ADMIN, COORDENACAO, PROF_AEE.
    """
    repo = SQLModelNotificationRepository(session)
    use_case = ListNotificationsUseCase(repo)
    notifications = await use_case.execute(
        ListNotificationsInput(
            tenant_id=current_user.tenant_id,
            papel=current_user.papel,
            apenas_nao_lidas=apenas_nao_lidas,
        )
    )
    return [n.model_dump() for n in notifications]


@router.patch("/{notification_id}/lida", response_model=dict)
async def marcar_como_lida(
    notification_id: uuid.UUID,
    current_user: CurrentUser = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    """Marca uma notificação como lida."""
    repo = SQLModelNotificationRepository(session)
    use_case = MarkNotificationReadUseCase(repo)
    try:
        notification = await use_case.execute(
            MarkNotificationReadInput(
                notification_id=notification_id,
                tenant_id=current_user.tenant_id,
            )
        )
    except DomainException as exc:
        raise _domain_to_http(exc) from exc

    return notification.model_dump()
