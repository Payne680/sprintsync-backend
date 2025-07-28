-- Initialize SprintSync database
-- This script runs automatically when the PostgreSQL container starts

-- Create database if it doesn't exist (handled by Docker environment variables)
-- The database 'sprintsync' is created automatically by the postgres image

-- Create extensions if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Grant permissions
GRANT ALL PRIVILEGES ON DATABASE sprintsync TO sprintsync_user;

-- Log initialization
SELECT 'SprintSync database initialized successfully' as message;
