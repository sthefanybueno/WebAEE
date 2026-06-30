# ==========================================
# ESTÁGIO DE BUILD
# ==========================================
FROM python:3.12-slim AS builder

WORKDIR /app

# Dependências do sistema para compilação (asyncpg, bcrypt, etc)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Cria virtualenv para isolamento das dependências
RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Copia e instala as dependências otimizando o cache de layers
COPY pyproject.toml .
RUN pip install --no-cache-dir \
    "fastapi[standard]>=0.115" \
    "sqlmodel>=0.0.21" \
    "pydantic>=2.7" \
    "pydantic-settings>=2.3" \
    "alembic>=1.13" \
    "asyncpg>=0.29" \
    "python-jose[cryptography]>=3.3" \
    "passlib[bcrypt]>=1.7" \
    "python-multipart>=0.0.9" \
    "httpx>=0.27"

# Copia a aplicação e instala (sem modo editável para produção)
COPY . .
RUN pip install --no-cache-dir .

# ==========================================
# ESTÁGIO DE RUNTIME (PRODUÇÃO)
# ==========================================
FROM python:3.12-slim AS runner

# Fuso horário para logs e datetime
ENV TZ=America/Sao_Paulo

# Dependências em runtime (apenas as estritamente necessárias)
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq-dev \
    tzdata \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Usuário não-root por segurança
RUN adduser --disabled-password --gecos "" appuser

WORKDIR /app

# Copia virtualenv compilado do builder
COPY --from=builder /opt/venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Copia o código final do builder (ignorando os arquivos pelo .dockerignore)
COPY --from=builder /app /app

# Ajuste de propriedade para o appuser
RUN chown -R appuser:appuser /app

# Utilizar o usuário criado
USER appuser

EXPOSE 8000

CMD sh -c "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"
