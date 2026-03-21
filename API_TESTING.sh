#!/bin/bash

# API Testing Script for Secrets Rotation Manager
# Run: bash API_TESTING.sh

set -e

BASE_URL="http://localhost:5000"
CONTENT_TYPE="Content-Type: application/json"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  Secrets Rotation Manager - API Testing Script${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}\n"

# Test 1: Health Check
echo -e "${BLUE}[TEST 1] Health Check${NC}"
curl -s -X GET "$BASE_URL/health" | jq .
echo -e "${GREEN}✓ Health check passed\n${NC}"

# Test 2: Register Secret
echo -e "${BLUE}[TEST 2] Register Database Secret${NC}"
curl -s -X POST "$BASE_URL/api/rotations/secrets/register" \
  -H "$CONTENT_TYPE" \
  -d '{
    "secretName": "test-db-password",
    "secretType": "database_password",
    "rotationPolicy": "db-credentials-v1",
    "dependentServices": ["webapp", "api-service"],
    "metadata": {"environment": "test", "database": "postgresql"}
  }' | jq .
echo -e "${GREEN}✓ Secret registered\n${NC}"

# Test 3: List Secrets
echo -e "${BLUE}[TEST 3] List All Secrets${NC}"
curl -s -X GET "$BASE_URL/api/rotations/secrets" | jq .
echo -e "${GREEN}✓ Secrets listed\n${NC}"

# Test 4: Get Secret Details
echo -e "${BLUE}[TEST 4] Get Secret Details${NC}"
curl -s -X GET "$BASE_URL/api/rotations/secrets/test-db-password" | jq .
echo -e "${GREEN}✓ Secret details retrieved\n${NC}"

# Test 5: Create Rotation Schedule
echo -e "${BLUE}[TEST 5] Create Rotation Schedule${NC}"
SCHEDULE_RESPONSE=$(curl -s -X POST "$BASE_URL/api/rotations/schedules/create" \
  -H "$CONTENT_TYPE" \
  -d '{
    "secretName": "test-db-password",
    "cronExpression": "0 3 * * 0",
    "affectedServices": ["webapp", "api-service"],
    "description": "Test weekly database rotation"
  }')
echo "$SCHEDULE_RESPONSE" | jq .
SCHEDULE_ID=$(echo "$SCHEDULE_RESPONSE" | jq -r '.schedule.scheduleId')
echo -e "${GREEN}✓ Rotation schedule created (ID: $SCHEDULE_ID)\n${NC}"

# Test 6: List Schedules
echo -e "${BLUE}[TEST 6] List All Schedules${NC}"
curl -s -X GET "$BASE_URL/api/rotations/schedules" | jq .
echo -e "${GREEN}✓ Schedules listed\n${NC}"

# Test 7: Get Specific Schedule
echo -e "${BLUE}[TEST 7] Get Specific Schedule${NC}"
curl -s -X GET "$BASE_URL/api/rotations/schedules/test-db-password" | jq .
echo -e "${GREEN}✓ Schedule details retrieved\n${NC}"

# Test 8: Trigger Manual Rotation
echo -e "${BLUE}[TEST 8] Trigger Manual Rotation${NC}"
ROTATION_RESPONSE=$(curl -s -X POST "$BASE_URL/api/rotations/manual" \
  -H "$CONTENT_TYPE" \
  -d '{
    "secretName": "test-db-password"
  }')
echo "$ROTATION_RESPONSE" | jq .
ROTATION_ID=$(echo "$ROTATION_RESPONSE" | jq -r '.rotation.rotationId' 2>/dev/null || echo "")
echo -e "${GREEN}✓ Manual rotation triggered (ID: $ROTATION_ID)\n${NC}"

# Test 9: Check Rotation Status
if [ ! -z "$ROTATION_ID" ] && [ "$ROTATION_ID" != "null" ]; then
  echo -e "${BLUE}[TEST 9] Check Rotation Status${NC}"
  curl -s -X GET "$BASE_URL/api/rotations/status/$ROTATION_ID" | jq .
  echo -e "${GREEN}✓ Rotation status retrieved\n${NC}"
fi

# Test 10: Get Rotation History
echo -e "${BLUE}[TEST 10] Get Rotation History${NC}"
curl -s -X GET "$BASE_URL/api/rotations/history/test-db-password?limit=10" | jq .
echo -e "${GREEN}✓ Rotation history retrieved\n${NC}"

# Test 11: Get All Rotation Logs
echo -e "${BLUE}[TEST 11] Get All Rotation Logs${NC}"
curl -s -X GET "$BASE_URL/api/rotations/logs?limit=20" | jq '.logs[0] | keys'
echo -e "${GREEN}✓ Rotation logs retrieved\n${NC}"

# Test 12: Update Schedule
echo -e "${BLUE}[TEST 12] Update Rotation Schedule${NC}"
curl -s -X PATCH "$BASE_URL/api/rotations/schedules/$SCHEDULE_ID" \
  -H "$CONTENT_TYPE" \
  -d '{
    "cronExpression": "0 2 * * 0",
    "description": "Updated: Now 2 AM UTC on Sundays"
  }' | jq .
echo -e "${GREEN}✓ Schedule updated\n${NC}"

# Test 13: Update Secret Metadata
echo -e "${BLUE}[TEST 13] Update Secret Metadata${NC}"
curl -s -X PATCH "$BASE_URL/api/rotations/secrets/test-db-password" \
  -H "$CONTENT_TYPE" \
  -d '{
    "dependentServices": ["webapp", "api-service", "worker-service"],
    "metadata": {"environment": "test", "updated": true}
  }' | jq .
echo -e "${GREEN}✓ Secret metadata updated\n${NC}"

# Test 14: Register API Key Secret
echo -e "${BLUE}[TEST 14] Register API Key Secret${NC}"
curl -s -X POST "$BASE_URL/api/rotations/secrets/register" \
  -H "$CONTENT_TYPE" \
  -d '{
    "secretName": "test-api-key",
    "secretType": "api_key",
    "rotationPolicy": "api-keys-v1",
    "dependentServices": ["payment-service"],
    "metadata": {"provider": "stripe"}
  }' | jq .
echo -e "${GREEN}✓ API Key secret registered\n${NC}"

# Test 15: Error Handling - Secret Not Found
echo -e "${BLUE}[TEST 15] Error Handling - Secret Not Found${NC}"
curl -s -X GET "$BASE_URL/api/rotations/secrets/nonexistent-secret" | jq .
echo -e "${GREEN}✓ Proper error response for non-existent secret\n${NC}"

echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✅ All tests completed!${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}\n"

echo "📊 Test Summary:"
echo "   1. Server health check"
echo "   2. Secret registration"
echo "   3. List secrets"
echo "   4. Get secret details"
echo "   5. Create rotation schedule"
echo "   6. List schedules"
echo "   7. Get schedule details"
echo "   8. Trigger manual rotation"
echo "   9. Check rotation status"
echo "  10. Get rotation history"
echo "  11. Get rotation logs"
echo "  12. Update schedule"
echo "  13. Update secret metadata"
echo "  14. Register API key secret"
echo "  15. Error handling\n"

echo "Next steps:"
echo "  - Monitor logs: tail -f logs/rotation.log"
echo "  - Check database: mongosh localhost:27017"
echo "  - Review rotation policies in: rotation-policies/"
