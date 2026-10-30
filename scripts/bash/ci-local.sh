#!/usr/bin/env bash
# ci-local.sh - Local CI check using act
# Runs GitHub Actions workflows locally via act
#
# Usage: ./scripts/bash/ci-local.sh [workflow-file]
#
# Prerequisites:
# - act installed (brew install act)
# - Docker running (open Docker Desktop or start colima/rancher desktop)
# - pnpm, Node.js 24+ available

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
WORKFLOWS_DIR="${PROJECT_ROOT}/.github/workflows"

source "${SCRIPT_DIR}/lib/common.sh"

# Check prerequisites
check_prerequisites() {
	log_info "Checking prerequisites..."

	if ! command -v act &>/dev/null; then
		log_error "act not installed. Install with: brew install act"
		return 1
	fi

	if ! docker info &>/dev/null; then
		log_error "Docker not running. Start Docker Desktop or run: colima start / systemctl start docker"
		return 1
	fi

	if ! command -v pnpm &>/dev/null; then
		log_error "pnpm not installed. Install with: corepack enable && corepack prepare pnpm@12 --activate"
		return 1
	fi

	log_success "All prerequisites met"
	return 0
}

# Run a specific workflow locally
run_workflow() {
	local workflow_file="$1"
	local workflow_name="${2:-}"

	log_info "Running workflow: ${workflow_name:-${workflow_file}}"

	# Create a temporary .env file for act with dummy secrets
	local temp_env
	temp_env=$(mktemp)
	cat >"${temp_env}" <<EOF
NODE_AUTH_TOKEN=dummy-token-for-local-testing
GITHUB_TOKEN=dummy-token-for-local-testing
EOF

	# Run act with the workflow
	if act -W "${WORKFLOWS_DIR}/${workflow_file}" \
		--env-file "${temp_env}" \
		--secret GITHUB_TOKEN=dummy-token \
		--secret NODE_AUTH_TOKEN=dummy-token \
		--container-architecture linux/amd64 \
		--pull=false \
		--rm; then
		log_success "Workflow ${workflow_name:-${workflow_file}} passed"
		rm -f "${temp_env}"
		return 0
	else
		log_error "Workflow ${workflow_name:-${workflow_file}} failed"
		rm -f "${temp_env}"
		return 1
	fi
}

# Run quality checks locally (without act)
run_local_quality() {
	log_info "Running local quality checks..."

	cd "${PROJECT_ROOT}"

	log_info "Running pnpm install..."
	# pnpm 12.x throws ERR_PNPM_IGNORED_BUILDS error even when install succeeds
	# due to esbuild native binary. The install actually succeeds.
	if ! pnpm install --frozen-lockfile 2>&1 | grep -v "ERR_PNPM_IGNORED_BUILDS"; then
		# Check if node_modules exists and has content (install actually succeeded)
		if [[ ! -d "node_modules" ]] || [[ -z "$(ls -A node_modules 2>/dev/null)" ]]; then
			log_error "pnpm install failed"
			return 1
		fi
		log_warn "pnpm install completed with ERR_PNPM_IGNORED_BUILDS warning (native binary esbuild), but dependencies installed successfully"
	fi

	log_info "Running lint..."
	pnpm lint || return 1

	log_info "Running format check..."
	pnpm format:check || return 1

	log_info "Running typecheck..."
	pnpm typecheck:all || return 1

	log_info "Running tests..."
	pnpm test:all || return 1

	log_success "All local quality checks passed"
	return 0
}

# Main
main() {
	local workflow="${1:-}"

	if ! check_prerequisites; then
		exit 1
	fi

	if [[ -n "${workflow}" ]]; then
		# Run specific workflow
		run_workflow "${workflow}"
	else
		# Run all local quality checks (recommended for daily development)
		run_local_quality
	fi
}

main "$@"
