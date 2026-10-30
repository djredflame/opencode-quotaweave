#!/usr/bin/env bash
# common.sh - Shared library functions for bash scripts
#
# Source this file in other scripts:
#   source "$(dirname "${BASH_SOURCE[0]}")/lib/common.sh"

# Prevent multiple sourcing
if [[ -n "${COMMON_SH_LOADED:-}" ]]; then
	return 0
fi
COMMON_SH_LOADED=1

# Colors for output
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly BLUE='\033[0;34m'
readonly NC='\033[0m' # No Color

# Logging functions
log_info() { echo -e "${BLUE}[INFO]${NC} $*"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $*"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $*"; }
log_error() { echo -e "${RED}[ERROR]${NC} $*"; }
log_debug() { [[ "${DEBUG:-0}" == "1" ]] && echo -e "${YELLOW}[DEBUG]${NC} $*"; }

# Check if command exists
command_exists() {
	command -v "$1" &>/dev/null
}

# Check if running in CI
is_ci() {
	[[ -n "${CI:-}" ]] || [[ -n "${GITHUB_ACTIONS:-}" ]] || [[ -n "${GITEA_ACTIONS:-}" ]]
}

# Check if running in act
is_act() {
	[[ -n "${ACT:-}" ]]
}

# Validate required tools
require_tools() {
	local missing=()
	for tool in "$@"; do
		if ! command_exists "${tool}"; then
			missing+=("${tool}")
		fi
	done

	if ((${#missing[@]} > 0)); then
		log_error "Missing required tools: ${missing[*]}"
		return 1
	fi
	return 0
}
