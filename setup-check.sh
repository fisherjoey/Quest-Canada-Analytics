#!/bin/bash

################################################################################
# Quest Canada Web App - Setup Verification Script
#
# Checks all required dependencies and configurations for local development
# Run this after completing DEV_ENVIRONMENT_SETUP.md
#
# Usage: ./setup-check.sh
################################################################################

set -e  # Exit on error

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Counters
CHECKS_PASSED=0
CHECKS_FAILED=0
CHECKS_WARNING=0

# Minimum required versions
MIN_NODE_VERSION="22.12.0"
MIN_DOCKER_VERSION="20.10.0"
MIN_POSTGRES_VERSION="14.0"

################################################################################
# Helper Functions
################################################################################

print_header() {
    echo -e "${BLUE}=====================================================${NC}"
    echo -e "${BLUE}Quest Canada Web App - Setup Verification${NC}"
    echo -e "${BLUE}=====================================================${NC}"
    echo ""
}

print_section() {
    echo -e "\n${BLUE}--- $1 ---${NC}"
}

check_pass() {
    echo -e "${GREEN}[✓]${NC} $1"
    ((CHECKS_PASSED++))
}

check_fail() {
    echo -e "${RED}[✗]${NC} $1"
    ((CHECKS_FAILED++))
}

check_warn() {
    echo -e "${YELLOW}[!]${NC} $1"
    ((CHECKS_WARNING++))
}

version_compare() {
    # Compare two semantic versions (e.g., "22.12.0" vs "22.12.0")
    # Returns 0 if $1 >= $2, 1 otherwise
    local ver1=$1
    local ver2=$2

    # Remove 'v' prefix if present
    ver1=${ver1#v}
    ver2=${ver2#v}

    if [ "$ver1" = "$ver2" ]; then
        return 0
    fi

    local IFS=.
    local i ver1_arr=($ver1) ver2_arr=($ver2)

    # Fill empty positions with zeros
    for ((i=${#ver1_arr[@]}; i<${#ver2_arr[@]}; i++)); do
        ver1_arr[i]=0
    done

    for ((i=0; i<${#ver1_arr[@]}; i++)); do
        if [[ -z ${ver2_arr[i]} ]]; then
            ver2_arr[i]=0
        fi
        if ((10#${ver1_arr[i]} > 10#${ver2_arr[i]})); then
            return 0
        fi
        if ((10#${ver1_arr[i]} < 10#${ver2_arr[i]})); then
            return 1
        fi
    done

    return 0
}

################################################################################
# Check Functions
################################################################################

check_node() {
    print_section "Node.js & NPM"

    if command -v node &> /dev/null; then
        local node_version=$(node --version | sed 's/v//')
        if version_compare "$node_version" "$MIN_NODE_VERSION"; then
            check_pass "Node.js $node_version (>= $MIN_NODE_VERSION required)"
        else
            check_fail "Node.js $node_version (>= $MIN_NODE_VERSION required)"
            echo "       Install via NVM: nvm install $MIN_NODE_VERSION"
        fi
    else
        check_fail "Node.js not found"
        echo "       Install via NVM: curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.5/install.sh | bash"
    fi

    if command -v npm &> /dev/null; then
        local npm_version=$(npm --version)
        check_pass "NPM $npm_version"
    else
        check_fail "NPM not found (should be installed with Node.js)"
    fi
}

check_docker() {
    print_section "Docker"

    if command -v docker &> /dev/null; then
        local docker_version=$(docker --version | grep -oP '\d+\.\d+\.\d+' | head -1)
        if version_compare "$docker_version" "$MIN_DOCKER_VERSION"; then
            check_pass "Docker $docker_version (>= $MIN_DOCKER_VERSION required)"
        else
            check_warn "Docker $docker_version (>= $MIN_DOCKER_VERSION recommended)"
        fi

        # Check if Docker daemon is running
        if docker ps &> /dev/null; then
            check_pass "Docker daemon is running"
        else
            check_fail "Docker daemon is not running"
            echo "       Start Docker Desktop or run: sudo service docker start"
        fi
    else
        check_fail "Docker not found"
        echo "       Install Docker Desktop for Windows: https://www.docker.com/products/docker-desktop/"
    fi

    if command -v docker compose &> /dev/null; then
        local compose_version=$(docker compose version | grep -oP '\d+\.\d+\.\d+' | head -1)
        check_pass "Docker Compose $compose_version"
    else
        check_fail "Docker Compose not found (included with Docker Desktop)"
    fi
}

check_wasp() {
    print_section "Wasp CLI"

    if command -v wasp &> /dev/null; then
        local wasp_version=$(wasp version 2>/dev/null || echo "unknown")
        check_pass "Wasp CLI $wasp_version"
    else
        check_warn "Wasp CLI not found (required for Open SaaS)"
        echo "       Install: curl -sSL https://get.wasp-lang.dev/installer.sh | sh"
        echo "       Then add to PATH: export PATH=\"\$HOME/.wasp/bin:\$PATH\""
    fi
}

check_git() {
    print_section "Git"

    if command -v git &> /dev/null; then
        local git_version=$(git --version | grep -oP '\d+\.\d+\.\d+')
        check_pass "Git $git_version"

        # Check Git configuration
        local git_name=$(git config --global user.name 2>/dev/null || echo "")
        local git_email=$(git config --global user.email 2>/dev/null || echo "")

        if [ -n "$git_name" ] && [ -n "$git_email" ]; then
            check_pass "Git configured: $git_name <$git_email>"
        else
            check_warn "Git not fully configured"
            echo "       Run: git config --global user.name \"Your Name\""
            echo "       Run: git config --global user.email \"your.email@example.com\""
        fi
    else
        check_fail "Git not found"
        echo "       Install: sudo apt install git -y"
    fi
}

check_postgres() {
    print_section "PostgreSQL"

    # Check if psql client is available
    if command -v psql &> /dev/null; then
        check_pass "PostgreSQL client (psql) installed"
    else
        check_warn "PostgreSQL client not found (optional for testing)"
        echo "       Install: sudo apt install postgresql-client -y"
    fi

    # Try to connect to database
    if [ -f .env ]; then
        source .env 2>/dev/null || true

        if [ -n "$DATABASE_URL" ]; then
            # Extract connection details from DATABASE_URL
            # Format: postgresql://user:password@host:port/database
            if echo "$DATABASE_URL" | grep -q "postgresql://"; then
                check_pass "DATABASE_URL found in .env"

                # Try to connect (requires psql)
                if command -v psql &> /dev/null; then
                    if psql "$DATABASE_URL" -c "SELECT 1;" &> /dev/null; then
                        check_pass "PostgreSQL connection successful"

                        # Check PostgreSQL version
                        local pg_version=$(psql "$DATABASE_URL" -t -c "SHOW server_version;" 2>/dev/null | grep -oP '\d+\.\d+' | head -1)
                        if [ -n "$pg_version" ]; then
                            if version_compare "$pg_version" "14.0"; then
                                check_pass "PostgreSQL $pg_version (>= 14.0 required)"
                            else
                                check_warn "PostgreSQL $pg_version (>= 14.0 recommended)"
                            fi
                        fi
                    else
                        check_fail "Cannot connect to PostgreSQL"
                        echo "       Check database is running: docker compose -f docker-compose.dev.yml up -d postgres"
                        echo "       Or start local PostgreSQL: sudo service postgresql start"
                    fi
                fi
            else
                check_fail "DATABASE_URL format invalid (should start with postgresql://)"
            fi
        else
            check_fail "DATABASE_URL not found in .env"
            echo "       Add to .env: DATABASE_URL=\"postgresql://postgres:postgres@localhost:5432/quest_canada\""
        fi
    else
        check_fail ".env file not found"
        echo "       Create from template: cp .env.example .env"
    fi
}

check_env_file() {
    print_section "Environment Configuration"

    if [ -f .env ]; then
        check_pass ".env file exists"

        # Check for required environment variables
        local required_vars=("DATABASE_URL" "NODE_ENV")
        local optional_vars=("JWT_SECRET" "ANTHROPIC_API_KEY" "SUPERSET_URL")

        for var in "${required_vars[@]}"; do
            if grep -q "^${var}=" .env; then
                check_pass "$var is set"
            else
                check_fail "$var is missing from .env"
            fi
        done

        for var in "${optional_vars[@]}"; do
            if grep -q "^${var}=" .env; then
                check_pass "$var is set (optional)"
            else
                check_warn "$var not set (optional for initial setup)"
            fi
        done
    else
        check_fail ".env file not found"
        echo "       Create from template: cp .env.example .env"
    fi

    if [ -f .env.example ]; then
        check_pass ".env.example template exists"
    else
        check_warn ".env.example not found (should exist as reference)"
    fi
}

check_project_structure() {
    print_section "Project Structure"

    local required_dirs=("docs" "docs/database" "docs/planning")
    local optional_dirs=("src" "app" "node_modules")

    for dir in "${required_dirs[@]}"; do
        if [ -d "$dir" ]; then
            check_pass "Directory exists: $dir/"
        else
            check_fail "Directory missing: $dir/"
        fi
    done

    for dir in "${optional_dirs[@]}"; do
        if [ -d "$dir" ]; then
            check_pass "Directory exists: $dir/ (optional)"
        else
            check_warn "Directory not found: $dir/ (will be created during development)"
        fi
    done

    # Check for key files
    local key_files=("README.md" "docs/database/schema.prisma")

    for file in "${key_files[@]}"; do
        if [ -f "$file" ]; then
            check_pass "File exists: $file"
        else
            check_fail "File missing: $file"
        fi
    done
}

check_npm_packages() {
    print_section "NPM Dependencies"

    if [ -f package.json ]; then
        check_pass "package.json exists"

        if [ -d node_modules ]; then
            check_pass "node_modules/ exists (dependencies installed)"

            # Count installed packages
            local pkg_count=$(ls -1 node_modules | wc -l)
            check_pass "$pkg_count packages installed"
        else
            check_warn "node_modules/ not found"
            echo "       Run: npm install"
        fi
    else
        check_warn "package.json not found (may not be initialized yet)"
        echo "       This is normal if Wasp app hasn't been created yet"
    fi
}

check_docker_containers() {
    print_section "Docker Containers"

    if command -v docker &> /dev/null && docker ps &> /dev/null; then
        local postgres_running=$(docker ps --filter "name=quest_postgres" --format "{{.Names}}" 2>/dev/null)

        if [ -n "$postgres_running" ]; then
            check_pass "PostgreSQL container is running ($postgres_running)"
        else
            check_warn "PostgreSQL container not running"
            echo "       Start with: docker compose -f docker-compose.dev.yml up -d postgres"
        fi

        # Check other common containers
        local grafana_running=$(docker ps --filter "name=quest_grafana" --format "{{.Names}}" 2>/dev/null)
        if [ -n "$grafana_running" ]; then
            check_pass "Grafana container is running ($grafana_running)"
        fi

        local superset_running=$(docker ps --filter "name=superset" --format "{{.Names}}" 2>/dev/null)
        if [ -n "$superset_running" ]; then
            check_pass "Superset container is running ($superset_running)"
        fi
    fi
}

check_wsl() {
    print_section "WSL Environment (Windows Users)"

    # Check if running in WSL
    if grep -qi microsoft /proc/version 2>/dev/null; then
        check_pass "Running in WSL2 environment"

        # Check WSL version
        local wsl_version=$(uname -r | grep -oP 'microsoft.*' || echo "unknown")
        check_pass "WSL version: $wsl_version"

        # Check if in WSL filesystem (recommended)
        if [[ "$PWD" == /mnt/* ]]; then
            check_warn "Working directory is on Windows filesystem (/mnt/)"
            echo "       For better performance, use WSL filesystem: ~/quest-canada-web-app"
        else
            check_pass "Working directory is in WSL filesystem (optimal performance)"
        fi
    else
        check_warn "Not running in WSL (this script is optimized for WSL2)"
    fi
}

print_summary() {
    echo ""
    echo -e "${BLUE}=====================================================${NC}"
    echo -e "${BLUE}Setup Verification Summary${NC}"
    echo -e "${BLUE}=====================================================${NC}"
    echo ""
    echo -e "${GREEN}Passed:${NC}   $CHECKS_PASSED"
    echo -e "${YELLOW}Warnings:${NC} $CHECKS_WARNING"
    echo -e "${RED}Failed:${NC}   $CHECKS_FAILED"
    echo ""

    if [ $CHECKS_FAILED -eq 0 ]; then
        echo -e "${GREEN}=====================================================${NC}"
        echo -e "${GREEN}All critical checks passed! You're ready to develop.${NC}"
        echo -e "${GREEN}=====================================================${NC}"
        echo ""
        echo "Next steps:"
        echo "1. Review DEV_ENVIRONMENT_SETUP.md for detailed instructions"
        echo "2. Start development: wasp start (once app is initialized)"
        echo "3. Open Prisma Studio: npx prisma studio --schema=./docs/database/schema.prisma"
        echo ""
        return 0
    else
        echo -e "${RED}=====================================================${NC}"
        echo -e "${RED}Some checks failed. Please fix the issues above.${NC}"
        echo -e "${RED}=====================================================${NC}"
        echo ""
        echo "Troubleshooting:"
        echo "1. Review error messages above"
        echo "2. Check DEV_ENVIRONMENT_SETUP.md for solutions"
        echo "3. Run this script again after fixes"
        echo ""
        return 1
    fi
}

################################################################################
# Main Execution
################################################################################

main() {
    print_header

    check_wsl
    check_node
    check_docker
    check_wasp
    check_git
    check_postgres
    check_env_file
    check_project_structure
    check_npm_packages
    check_docker_containers

    print_summary
}

# Run main function
main

exit $?
