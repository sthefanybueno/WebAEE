from pydantic import BaseModel
import uuid
from datetime import datetime
from app.domain.models import TagPedagogica, SyncStatus

class CreatePhotoRequest(BaseModel):
    aluno_id: uuid.UUID
    foto_url: str
    tag: TagPedagogica

class PhotoResponse(BaseModel):
    id: uuid.UUID
    aluno_id: uuid.UUID
    autor_id: uuid.UUID
    foto_url: str
    tag: TagPedagogica
    sync_status: SyncStatus
    created_at: datetime
