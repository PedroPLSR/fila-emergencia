# Fila de Emergência — Coleta e Exame de Sangue

Simulação de posto emergencial (Castelão) com **totem público** e **painel da equipe**, rodando localmente via **Docker Compose**.

## Subir o ambiente

Requisito: Docker Desktop em execução.

```bash
cp .env.example .env
docker compose up --build -d
```

| Superfície | URL |
|------------|-----|
| Entrada | http://localhost:8080/ |
| Totem | http://localhost:8080/totem/ |
| Painel | http://localhost:8080/painel/ |
| API | http://localhost:3000/api/ |

Validação ponta a ponta: [specs/001-fila-emergencia-sangue/quickstart.md](specs/001-fila-emergencia-sangue/quickstart.md).

## Stack

- Frontend: HTML/CSS/JS (nginx)
- API: Node.js 20 + Express
- Banco: PostgreSQL 16

## Encerrar

```bash
docker compose down
# apagar dados do banco:
docker compose down -v
```
