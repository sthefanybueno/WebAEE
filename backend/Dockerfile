FROM python:3.12-slim

WORKDIR /app

# Instala dependências do sistema necessárias para asyncpg e bcrypt
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Copia e instala dependências Python primeiro (cache de layer Docker)
COPY pyproject.toml .
RUN pip install --no-cache-dir -e ".[dev]"

# Copia o código da aplicação
COPY . .

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
