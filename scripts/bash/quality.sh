#!/usr/bin/env bash
# quality.sh - Local quality checks for opencode-quotaweave
#
# Usage: ./scripts/bash/quality.sh

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"

source "${SCRIPT_DIR}/lib/common.sh"

main() {
	cd "${PROJECT_ROOT}"

	log_info "Running local quality checks..."

	log_info "Installing dependencies..."
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

	log_info "Running ESLint..."
	pnpm lint || return 1

	log_info "Running Prettier format check..."
	pnpm format:check || return 1

	log_info "Running TypeScript typecheck..."
	pnpm typecheck:all || return 1

	log_info "Running tests..."
	pnpm test:all || return 1

	log_info "Checking for Git write operations..."
	"${SCRIPT_DIR}/git-safety-check.sh" "${PROJECT_ROOT}" || return 1

	log_success "All quality checks passed!"
	return 0
}

main "$@"
