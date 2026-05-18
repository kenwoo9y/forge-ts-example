-include .devcontainer/.env

.PHONY: help lint-check lint-fix format-check format-fix check check-fix type-check secrets-scan psql migrate-generate migrate
.DEFAULT_GOAL := help

lint-check: ## Run lint check
	pnpm exec biome lint .

lint-fix: ## Run lint fix
	pnpm exec biome lint --write .

format-check: ## Run format check
	pnpm exec biome format .

format-fix: ## Run format fix
	pnpm exec biome format --write .

check: ## Run check
	pnpm exec biome check .

check-fix: ## Run check fix
	pnpm exec biome check --write .

type-check: ## Run type check
	pnpm exec tsc --noEmit .

secrets-scan: ## Run AWS Git Secrets Scan
	git secrets --scan

psql: ## Access PostgreSQL Database
	psql -h postgres -U $(POSTGRES_USER) -d $(POSTGRES_DB)

migrate-generate:  ## Generate migration
	cd packages/db && npx prisma migrate dev --create-only

migrate:  ## Execute migration
	cd packages/db && npx prisma migrate dev

help: ## Show options
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(firstword $(MAKEFILE_LIST)) | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'