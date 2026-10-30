#!/usr/bin/env bash
# Deploy QuotaWeave plugin to local OpenCode development directory
# This script builds the plugin and copies only the necessary artifacts

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
PLUGIN_DIR="${REPO_ROOT}/packages/opencode-plugin"
CORE_DIR="${REPO_ROOT}/packages/core"
DEPLOY_DIR="${REPO_ROOT}/.opencode/plugins/opencode-quotaweave"

echo "Building QuotaWeave core..."
cd "${REPO_ROOT}"
pnpm --filter=@opencode-quotaweave/core run build

echo "Building QuotaWeave plugin..."
pnpm --filter=@opencode-quotaweave/opencode-plugin run build

echo "Deploying to local OpenCode plugin directory..."
mkdir -p "${DEPLOY_DIR}"

# Copy built artifacts (replace the previous build completely)
rm -rf "${DEPLOY_DIR}/dist"
cp -r "${PLUGIN_DIR}/dist" "${DEPLOY_DIR}/"

# Copy entry point wrapper files
cp "${PLUGIN_DIR}/server.js" "${DEPLOY_DIR}/"
cp "${PLUGIN_DIR}/tui.js" "${DEPLOY_DIR}/"

# Copy package.json for version/dependency info
cp "${PLUGIN_DIR}/package.json" "${DEPLOY_DIR}/"

# Copy core package to local plugin's node_modules for runtime resolution
mkdir -p "${DEPLOY_DIR}/node_modules/@opencode-quotaweave/core"
cp -r "${CORE_DIR}/dist" "${DEPLOY_DIR}/node_modules/@opencode-quotaweave/core"
cp "${CORE_DIR}/package.json" "${DEPLOY_DIR}/node_modules/@opencode-quotaweave/core/"

# Copy dependencies from the built plugin's node_modules
echo "Copying plugin dependencies..."
mkdir -p "${DEPLOY_DIR}/node_modules"
# Copy production dependencies from the built plugin
for dep in "@opencode-ai/plugin" "@opencode/plugin" "solid-js" "zod"; do
	if [[ -d "${PLUGIN_DIR}/node_modules/${dep}" ]]; then
		mkdir -p "${DEPLOY_DIR}/node_modules/$(dirname "${dep}")"
		cp -r "${PLUGIN_DIR}/node_modules/${dep}" "${DEPLOY_DIR}/node_modules/${dep}"
	fi
done

# Also copy @opentui dependencies
for dep in "@opentui/core" "@opentui/keymap" "@opentui/solid"; do
	if [[ -d "${PLUGIN_DIR}/node_modules/${dep}" ]]; then
		mkdir -p "${DEPLOY_DIR}/node_modules/${dep%%/*}"
		cp -r "${PLUGIN_DIR}/node_modules/${dep}" "${DEPLOY_DIR}/node_modules/${dep%%/*}/"
	fi
done

# Add build marker for runtime verification
BUILD_ID="$(date -u +%Y%m%d-%H%M%S)-$(git -C "${REPO_ROOT}" rev-parse --short HEAD 2>/dev/null || echo "nogit")"
echo "{\"buildId\": \"${BUILD_ID}\", \"deployedAt\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"}" >"${DEPLOY_DIR}/.build-info.json"

echo "Local plugin deployed to ${DEPLOY_DIR}"
echo "Build ID: ${BUILD_ID}"
