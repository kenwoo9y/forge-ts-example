.PHONY: help lint-check lint-fix format-check format-fix
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

psql: ## Access PostgreSQL Database
	psql -h postgres -U postgres -d forge_ts_dev

migrate-generate:  ## Generate migration
	cd packages/db && npx prisma migrate dev --create-only

migrate:  ## Execute migration
	cd packages/db && npx prisma migrate dev

help: ## Show options
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'