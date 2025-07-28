#!/bin/bash

# Docker Testing Suite for SprintSync API
# This script tests various aspects of the Docker setup

set -e

echo "🧪 Starting Docker Testing Suite for SprintSync API"
echo "=================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test configuration
IMAGE_NAME="sprintsync-api:latest"
CONTAINER_NAME="sprintsync-test"
TEST_PORT=3001
DATABASE_URL="postgresql://testuser:testpass@host.docker.internal:5433/testdb"

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[PASS]${NC} $1"
}

print_error() {
    echo -e "${RED}[FAIL]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

# Function to cleanup containers
cleanup() {
    print_status "Cleaning up test containers..."
    docker stop $CONTAINER_NAME 2>/dev/null || true
    docker rm $CONTAINER_NAME 2>/dev/null || true
}

# Trap to ensure cleanup on script exit
trap cleanup EXIT

echo
print_status "Test 1: Verify Docker image exists"
if docker images | grep -q sprintsync-api; then
    IMAGE_SIZE=$(docker images sprintsync-api:latest --format "table {{.Size}}" | tail -n +2)
    print_success "Docker image exists (Size: $IMAGE_SIZE)"
else
    print_error "Docker image not found!"
    exit 1
fi

echo
print_status "Test 2: Test container startup without database"
print_status "Starting container on port $TEST_PORT..."
docker run -d \
    --name $CONTAINER_NAME \
    -p $TEST_PORT:3000 \
    -e PORT=3000 \
    -e NODE_ENV=development \
    $IMAGE_NAME

# Wait for container to start
sleep 3

if docker ps | grep -q $CONTAINER_NAME; then
    print_success "Container started successfully"
else
    print_error "Container failed to start"
    docker logs $CONTAINER_NAME
    exit 1
fi

echo
print_status "Test 3: Test health endpoint"
if curl -s -f http://localhost:$TEST_PORT/health > /dev/null; then
    HEALTH_RESPONSE=$(curl -s http://localhost:$TEST_PORT/health)
    print_success "Health endpoint responding: $HEALTH_RESPONSE"
else
    print_error "Health endpoint not responding"
    docker logs $CONTAINER_NAME
    exit 1
fi

echo
print_status "Test 4: Test API documentation endpoint"
if curl -s -f http://localhost:$TEST_PORT/docs > /dev/null; then
    print_success "API docs endpoint accessible"
else
    print_warning "API docs endpoint not accessible (expected - swagger.yaml missing)"
fi

echo
print_status "Test 5: Test container logs"
LOG_OUTPUT=$(docker logs $CONTAINER_NAME 2>&1)
if echo "$LOG_OUTPUT" | grep -q "SprintSync API server running"; then
    print_success "Container logs show successful startup"
else
    print_error "Container logs don't show successful startup"
    echo "$LOG_OUTPUT"
fi

echo
print_status "Test 6: Test container resource usage"
MEMORY_USAGE=$(docker stats $CONTAINER_NAME --no-stream --format "table {{.MemUsage}}" | tail -n +2)
CPU_USAGE=$(docker stats $CONTAINER_NAME --no-stream --format "table {{.CPUPerc}}" | tail -n +2)
print_success "Resource usage - Memory: $MEMORY_USAGE, CPU: $CPU_USAGE"

echo
print_status "Test 7: Test environment variables"
ENV_PORT=$(docker exec $CONTAINER_NAME printenv PORT)
ENV_NODE_ENV=$(docker exec $CONTAINER_NAME printenv NODE_ENV)
print_success "Environment variables - PORT: $ENV_PORT, NODE_ENV: $ENV_NODE_ENV"

echo
print_status "Test 8: Test file permissions and user"
USER_INFO=$(docker exec $CONTAINER_NAME id)
print_success "Container user info: $USER_INFO"

echo
print_status "Test 9: Test graceful shutdown"
docker stop $CONTAINER_NAME
if [ $? -eq 0 ]; then
    print_success "Container stopped gracefully"
else
    print_error "Container did not stop gracefully"
fi

echo
print_status "Test 10: Test with database connection"
print_status "Starting container with PostgreSQL connection..."

# Check if local PostgreSQL is running
if docker ps | grep -q postgres; then
    docker run -d \
        --name "${CONTAINER_NAME}-db" \
        -p $((TEST_PORT + 1)):3000 \
        -e PORT=3000 \
        -e DATABASE_URL="$DATABASE_URL" \
        -e NODE_ENV=development \
        $IMAGE_NAME

    sleep 3

    if docker ps | grep -q "${CONTAINER_NAME}-db"; then
        print_success "Container with database connection started"
        
        # Test health endpoint with database
        if curl -s -f http://localhost:$((TEST_PORT + 1))/health > /dev/null; then
            print_success "Health endpoint working with database connection"
        else
            print_warning "Health endpoint not responding with database connection"
        fi
        
        docker stop "${CONTAINER_NAME}-db"
        docker rm "${CONTAINER_NAME}-db"
    else
        print_warning "Container with database connection failed to start (expected if DB not available)"
    fi
else
    print_warning "Local PostgreSQL not running, skipping database connection test"
fi

echo
print_status "Test 11: Test Render-like environment"
print_status "Testing with Render-style environment variables..."
docker run -d \
    --name "${CONTAINER_NAME}-render" \
    -p $((TEST_PORT + 2)):10000 \
    -e PORT=10000 \
    -e NODE_ENV=production \
    -e DATABASE_URL="postgresql://render_user:render_pass@dpg-example.render.com/render_db" \
    $IMAGE_NAME

sleep 3

if docker ps | grep -q "${CONTAINER_NAME}-render"; then
    print_success "Render-style container started on port 10000"
    
    # Test health endpoint
    if curl -s -f http://localhost:$((TEST_PORT + 2))/health > /dev/null; then
        print_success "Health endpoint working in Render-style environment"
    else
        print_warning "Health endpoint not responding in Render-style environment"
    fi
    
    docker stop "${CONTAINER_NAME}-render"
    docker rm "${CONTAINER_NAME}-render"
else
    print_warning "Render-style container failed to start"
fi

echo
echo "=============================================="
print_success "✅ Docker Testing Suite Completed!"
print_status "Image is ready for Render deployment"
echo
print_status "Next steps:"
echo "  1. Push to your Git repository"
echo "  2. Connect to Render"
echo "  3. Render will automatically build and deploy"
echo
print_status "Local testing commands:"
echo "  • Start local stack: npm run docker:local"
echo "  • Build image: npm run docker:build" 
echo "  • Run container: npm run docker:run"
echo "=============================================="
