FROM python:3.14-slim
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1 PIP_NO_CACHE_DIR=1
WORKDIR /app
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt \
    && groupadd --gid 10001 casemind \
    && useradd --uid 10001 --gid 10001 --no-create-home casemind \
    && mkdir -p /var/lib/casemind/documents \
    && chown -R 10001:10001 /var/lib/casemind
COPY app ./app
COPY alembic ./alembic
COPY alembic.ini main.py ./
ENV DOCUMENT_STORAGE_PATH=/var/lib/casemind/documents
USER 10001:10001
EXPOSE 8000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD python -c "from urllib.request import urlopen; urlopen('http://127.0.0.1:8000/api/v1/health/live', timeout=3)"
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--no-access-log", "--no-proxy-headers"]
