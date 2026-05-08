SHELL := /bin/bash
.DEFAULT_GOAL := help

COMPOSE := docker compose
PHP     := $(COMPOSE) exec app php
COMPOSER:= $(COMPOSE) exec app composer

# ---- help ------------------------------------------------------------
help:
	@echo "Usage:"
	@echo "  make up          Start all services in background"
	@echo "  make down        Stop all services"
	@echo "  make restart     Restart all services"
	@echo "  make build       Build images (no cache)"
	@echo "  make fresh       Fresh database + seed"
	@echo "  make seed        Re-seed database"
	@echo "  make shell       Open app shell"
	@echo "  make mysql       Open MySQL shell"
	@echo "  make redis       Open Redis CLI"
	@echo "  make art t=...   Run artisan command"
	@echo "  make test        Run PHPUnit"
	@echo "  make logs        Tail all logs"
	@echo "  make ps          Show container status"
	@echo ""
	@echo "Services:"
	@echo "  http://localhost:8000   — Application"
	@echo "  http://localhost:8080   — Adminer (DB)"
	@echo "  http://localhost:8025   — MailHog (Email)"

# ---- start / stop ----------------------------------------------------
up:
	$(COMPOSE) up -d
	@echo "==> App       : http://localhost:8000"
	@echo "==> Adminer   : http://localhost:8080"
	@echo "==> MailHog   : http://localhost:8025"

dev:
	$(COMPOSE) --profile dev up -d
	@echo "==> App       : http://localhost:8000"
	@echo "==> Vite      : http://localhost:5173"

down:
	$(COMPOSE) down --remove-orphans

restart: down up

# ---- build -----------------------------------------------------------
build:
	$(COMPOSE) build --no-cache
	$(COMPOSE) up -d

rebuild:
	$(COMPOSE) down
	$(COMPOSE) build --no-cache
	$(COMPOSE) up -d

# ---- database --------------------------------------------------------
fresh:
	$(PHP) artisan migrate:fresh --force
	$(PHP) artisan db:seed --force
	$(PHP) artisan optimize

seed:
	$(PHP) artisan db:seed --force

migrate:
	$(PHP) artisan migrate --force

# ---- artisan helpers -------------------------------------------------
art:
	$(PHP) artisan $(t)

tinker:
	$(PHP) artisan tinker

cache:
	$(PHP) artisan optimize

clear:
	$(PHP) artisan optimize:clear

# ---- dev helpers -----------------------------------------------------
composer-install:
	$(COMPOSER) install

npm-install:
	$(COMPOSE) run --rm vite npm install

npm-build:
	$(COMPOSE) run --rm vite npm run build

# ---- shell -----------------------------------------------------------
shell:
	$(COMPOSE) exec app bash

mysql:
	$(COMPOSE) exec db mysql -u helpdesk -psecret helpdesk_db

redis-cli:
	$(COMPOSE) exec redis redis-cli

# ---- testing ---------------------------------------------------------
test:
	$(PHP) artisan test

# ---- logs & monitoring -----------------------------------------------
logs:
	$(COMPOSE) logs -f

ps:
	$(COMPOSE) ps

stats:
	docker stats helpdesk-app helpdesk-db helpdesk-redis helpdesk-nginx

# ---- cleanup ---------------------------------------------------------
prune:
	$(COMPOSE) down -v --remove-orphans
	docker system prune -f