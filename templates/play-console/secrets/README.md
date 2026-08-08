# Local-only secrets for Play Android Publisher API.
# Put the service account JSON here (gitignored):
#   secrets/play-api-service-account.json
#
# Or set:
#   export GOOGLE_PLAY_SERVICE_ACCOUNT_JSON="/absolute/path/to/key.json"
#
# Required IAM: this SA must be Owner on its GCP project_id so agents can
# enable APIs, bind IAM, and provision Pub/Sub for RevenueCat RTDN.
# Also invite the SA in Play Console (Users and permissions) + upload the
# same JSON in RevenueCat → Play app → Service credentials.
