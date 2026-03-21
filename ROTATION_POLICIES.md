# Rotation Policies Documentation

## Overview
This directory contains Git-tracked rotation policies that define how secrets are rotated across the system. Each policy document specifies the rotation schedule, dependent services, validation requirements, and rollback procedures.

## Policy Structure

### Active Policies

1. **Database Credentials Policy** (`db-credentials.policy.md`)
   - Rotation Schedule: Weekly (Sunday 3:00 AM UTC)
   - Dependent Services: PostgreSQL, MySQL, MongoDB clients
   - Validation: Database connectivity checks
   - Rollback: Automatic if validation fails

2. **API Keys Policy** (`api-keys.policy.md`)
   - Rotation Schedule: Monthly (1st of month 2:00 AM UTC)
   - Dependent Services: API Gateway, Microservices
   - Validation: API health checks
   - Rollback: Automatic if health checks fail

3. **Certificates Policy** (`certificates.policy.md`)
   - Rotation Schedule: Quarterly (Every 90 days)
   - Dependent Services: Load Balancers, Reverse Proxies
   - Validation: Certificate validity checks
   - Rollback: Manual review required

## Policy Format

```markdown
# [Secret Name] Rotation Policy

## Overview
Brief description of the secret and its purpose

## Rotation Schedule
- **Frequency**: (e.g., Weekly, Monthly, Quarterly)
- **Time**: (UTC timezone)
- **Cron Expression**: (e.g., "0 3 * * 0")

## Dependent Services
- Service 1
- Service 2
- Service 3

## Validation Requirements
- Health check endpoint
- Connection test
- Functionality verification

## Rollback Procedure
1. Step 1
2. Step 2
3. Step 3

## Owner
- Team/Person responsible
- Contact: email@example.com

## Last Updated
[Date and version]
```

## Policy Versioning

All policies follow semantic versioning:
- `v1.0.0` - Initial policy
- `v1.1.0` - Minor updates (new services, adjusted schedule)
- `v2.0.0` - Major changes (completely new approach)

## Making Policy Changes

1. Create a new branch: `git checkout -b update/policy-name`
2. Update the policy file
3. Test the new policy in staging environment
4. Create a pull request for review
5. Merge after approval
6. Deploy to production

## Tracking Rotations

Each rotation is logged with:
- Rotation ID
- Secret name
- Old version → New version
- Affected services
- Status (success/failed/rolled-back)
- Timestamp

See MongoDB collections:
- `rotationlogs` - All rotation events
- `rotationschedules` - Active rotation schedules
- `secretvaults` - Secret metadata and history

## Important Notes

- All policies are stored in Git for audit trail
- Changes to policies require code review
- Emergency rotations are logged separately
- Rollback procedures must be tested quarterly
- Policies are enforced by the rotation service automatically
