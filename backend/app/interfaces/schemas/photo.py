import uuid
from datetime import datetime

from pydantic import BaseModel

from app.domain.models import SyncStatus, TagPedagogica


class CreatePhotoRequest(BaseModel):
    aluno_id: uuid.UUID
    url: str
    tag: TagPedagogica

class PhotoResponse(BaseModel):
    id: uuid.UUID
    aluno_id: uuid.UUID
    autor_id: uuid.UUID
    url: str
    tag: TagPedagogica
    sync_status: SyncStatus
    created_at: datetime



class SyncPhotoItemRequest(BaseModel):
    id: uuid.UUID
    aluno_id: uuid.UUID
    url: str
    tag: TagPedagogica
    sync_status: SyncStatus

class SyncPhotoRequest(BaseModel):
    items: list[SyncPhotoItemRequest]
