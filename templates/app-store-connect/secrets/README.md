# Local-only secrets for App Store Connect API.
#
# Put your API private key here (gitignored):
#   secrets/AuthKey_XXXXXXXXXX.p8
#
# Or set:
#   export ASC_PRIVATE_KEY_PATH="/absolute/path/to/AuthKey_XXXXXXXXXX.p8"
#
# Required env (never commit real values):
#   ASC_ISSUER_ID   — Users and Access → Integrations → Issuer ID (UUID)
#   ASC_KEY_ID      — Key ID for that .p8
#   ASC_BUNDLE_ID   — e.g. com.example.yourapp
#
# Private key (one of):
#   secrets/AuthKey_XXXXXXXXXX.p8
#   ASC_PRIVATE_KEY_PATH=/absolute/path/AuthKey_XXXXXXXXXX.p8
#   ASC_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----..."   # EAS secret / env:pull
#
# Optional:
#   ASC_APP_APPLE_ID — numeric App Store Connect Apple ID
#   ASC_VERSION      — marketing version e.g. 1.3.1
#   ASC_TEAM_ID      — Apple Developer Team ID
#
# Create key:
#   App Store Connect → Users and Access → Integrations → App Store Connect API
#   → Generate API Key (Admin or App Manager) → download .p8 once
#
# Not needed for these scripts: Apple ID password / app-specific password.
