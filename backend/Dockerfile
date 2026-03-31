FROM python:3.12-slim

WORKDIR /app

# Dependências do sistema necessárias para asyncpg e bcrypt
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Copia apenas o pyproject.toml primeiro (layer de cache)
COPY pyproject.toml .

# Instala dependências sem o pacote local (melhor cache)
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
    "pytest>=8.2" \
    "pytest-asyncio>=0.23" \
    "pytest-cov>=5.0" \
    "httpx>=0.27"

# Copia o código e instala o pacote local (editable)
COPY . .
RUN pip install --no-cache-dir -e .

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
