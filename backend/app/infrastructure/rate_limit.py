from slowapi import Limiter
from slowapi.util import get_remote_address

# Limiter global. 
# No MVP usamos In-Memory (default). 
# Para produção com múltiplos workers/containers, trocar para Redis (storage_uri="redis://...").
limiter = Limiter(key_func=get_remote_address)
