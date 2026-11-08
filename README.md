# MONO

Дайджест новостей по кибербезопасности.

- [frontend/](frontend/) — лендинг, вход и дашборд на Next.js.
- [backend/](backend/) — обработка публикаций и HTTP API на Go.

## Локальный запуск

Понадобятся Node.js 20.9+ и Go 1.23+. Запустите серверы в двух терминалах из корня репозитория.

Терминал 1:

```sh
cd backend
MONO_ADDR=127.0.0.1:8080 ALLOWED_TEST_RECIPIENTS=test@example.com go run ./cmd/monod --mock
```

Терминал 2:

```sh
cd frontend
npm ci
npm run dev -- --webpack --hostname 127.0.0.1 --port 3107
```

Откройте [лендинг](http://127.0.0.1:3107/) или [дашборд](http://127.0.0.1:3107/dashboard). В дашборде нажмите «Собрать дайджест», чтобы обработать учебный набор. Режим `--mock` работает без внешней модели.

Если у API другой адрес, укажите `DIGEST_API_URL` в `frontend/.env.local`. Настройки для внешней модели описаны в [документации бэкенда](backend/README.md).

### Бэкенд в Docker

Из корня репозитория соберите и запустите бэкенд вместо команды из терминала 1.

```sh
docker build -t mono:local ./backend
docker run --rm -p 127.0.0.1:8080:8080 -e ALLOWED_TEST_RECIPIENTS=test@example.com mono:local --mock
```

Фронтенд подключится к контейнеру по адресу `http://127.0.0.1:8080`. Учебный набор входит в образ.
