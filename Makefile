-include .devcontainer/.env

.PHONY: help lint-check lint-fix format-check format-fix yaml-format-check yaml-format-fix check check-fix type-check secrets-scan psql migrate-generate migrate aws-login
.DEFAULT_GOAL := help

lint-check: ## Run lint check
	pnpm exec biome lint .

lint-fix: ## Run lint fix
	pnpm exec biome lint --write .

format-check: ## Run format check
	pnpm exec biome format .

format-fix: ## Run format fix
	pnpm exec biome format --write .

yaml-format-check: ## Run YAML format check
	pnpm exec prettier --check "**/*.{yml,yaml}"

yaml-format-fix: ## Run YAML format fix
	pnpm exec prettier --write "**/*.{yml,yaml}"

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

aws-login: ## Login to AWS
	@test -n "$(SSO_SESSION)" || (echo "Error: SSO_SESSION is not set. Please configure .devcontainer/.env"; exit 1)
	@bash .devcontainer/setup-aws.sh
	aws sso login --sso-session=$(SSO_SESSION)

cdk-bootstrap: ## Bootstrap CDK for AWS account/region (requires aws-login first)
	@test -n "$(SSO_ACCOUNT_ID)" || (echo "Error: SSO_ACCOUNT_ID is not set. Please configure .devcontainer/.env"; exit 1)
	@test -n "$(SSO_REGION)" || (echo "Error: SSO_REGION is not set. Please configure .devcontainer/.env"; exit 1)
	cd infra && pnpm exec cdk bootstrap aws://$(SSO_ACCOUNT_ID)/$(SSO_REGION)

help: ## Show options
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(firstword $(MAKEFILE_LIST)) | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'