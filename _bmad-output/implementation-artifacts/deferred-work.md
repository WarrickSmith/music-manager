# Deferred Work

## Dockerfile: Unpinned runtime dependency install

**Source:** Edge case hunter review of spec-techstack-update
**Severity:** Low
**Description:** The Dockerfile runner stage runs `npm install dotenv node-appwrite` without version pinning or a lockfile. This means the versions installed at image build time may drift from what was tested. Consider copying `package-lock.json` into the runner stage or pinning exact versions.
**File:** `Dockerfile:70`
