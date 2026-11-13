#!/bin/bash

# Leadline - Quick Setup Script
# Sets up a local development environment. Safe to re-run.

set -e

echo "🚀 Setting up Leadline..."

# Node.js 22.22+
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 22.22+ and try again."
    exit 1
fi

node_version=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$node_version" -lt 22 ]; then
    echo "❌ Node.js version must be 22 or higher. Current version: $(node -v)"
    exit 1
fi
echo "✅ Node.js $(node -v) detected"

# pnpm — prefer Corepack so the version pinned in package.json is used
if ! command -v pnpm &> /dev/null; then
    echo "📦 pnpm not found. Enabling it via Corepack..."
    if command -v corepack &> /dev/null; then
        corepack enable
    else
        npm install -g pnpm
    fi
fi
echo "✅ pnpm $(pnpm -v) detected"

echo "📦 Installing dependencies..."
pnpm install --frozen-lockfile

# .env — every VITE_ var has a default, so this only matters for overrides
if [ ! -f .env ]; then
    echo "📝 Creating .env from .env.example..."
    cp .env.example .env
else
    echo "✅ .env already exists"
fi

# SESSION_SECRET signs the httpOnly session cookie (server-only; required in
# production). Generate one locally if it isn't set yet.
if ! grep -qE '^SESSION_SECRET=.+' .env; then
    secret=$(node -e "console.log(require('crypto').randomBytes(32).toString('base64'))")
    # Drop any commented/empty placeholder line, then append the real value.
    sed -i.bak -E '/^#? ?SESSION_SECRET=$/d' .env && rm -f .env.bak
    echo "SESSION_SECRET=${secret}" >> .env
    echo "🔐 Generated SESSION_SECRET in .env (keep it out of version control)"
else
    echo "✅ SESSION_SECRET already set"
fi

echo "🔍 Running type check..."
pnpm typecheck

echo ""
echo "✨ Setup complete! Next:"
echo "  • pnpm dev        — start the dev server (http://localhost:3000)"
echo "  • pnpm test       — run tests in watch mode (pnpm test:run for a single run)"
echo "  • pnpm lint       — typegen + tsc + eslint"
echo "  • pnpm build      — production build"
echo ""
echo "🧪 The in-browser mock API is on by default."
echo "   Sign in with amina.otieno@example.org / LeadlineDemo2026! (after `python manage.py seed`)"
echo "   (owner of Kijani Health, member of Savanna Tech, one pending invite)."
echo "   Set API_URL (e.g. http://127.0.0.1:8000/api/v1) to use the Leadline backend (auth so far)."
echo ""
echo "📖 More:"
echo "  • README.md        — overview and scripts"
echo "  • AGENTS.md        — architecture, conventions and patterns"
echo "  • CONTRIBUTING.md  — commits, branches and PR checklist"
echo "  • RELEASE.md       — versioning with Changesets"
echo ""
echo "Happy building! 🎉"
