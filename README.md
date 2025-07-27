# SprintSync Backend API

A comprehensive task management API built with Express.js, Prisma ORM, and PostgreSQL, featuring JWT authentication and AI-powered task suggestions.

## 🚀 Features

- **Authentication System**: JWT-based authentication with bcrypt password hashing
- **Task Management**: Full CRUD operations for tasks with status tracking
- **AI Integration**: AI-powered task description suggestions (ready for LLM integration)
- **User Scoping**: Tasks are automatically scoped to authenticated users
- **Comprehensive Logging**: Structured logging with Winston
- **API Documentation**: Interactive Swagger/OpenAPI documentation
- **Testing Suite**: Complete test coverage with Jest and Supertest
- **Docker Support**: Full containerization with Docker Compose
- **Database Migrations**: Automated Prisma migrations

## 📋 Prerequisites

- Node.js 16+
- PostgreSQL 12+
- Docker & Docker Compose (optional)

## 🛠️ Installation

### Local Development

1. **Clone and install dependencies:**
   \`\`\`bash
   git clone <repository-url>
   cd sprintsync-backend
   npm install
   \`\`\`

2. **Set up environment variables:**
   \`\`\`bash
   cp .env.example .env

# Edit .env with your database credentials and JWT secret

\`\`\`

3. **Set up the database:**
   \`\`\`bash

# Run migrations

npm run db:migrate

# Generate Prisma client

npm run db:generate

# Seed demo data (optional)

npm run db:seed
\`\`\`

4. **Start the development server:**
   \`\`\`bash
   npm run dev
   \`\`\`

### Docker Deployment

1. **Start with Docker Compose:**
   \`\`\`bash
   docker-compose up -d
   \`\`\`

This will start:

- PostgreSQL database on port 5432
- SprintSync API on port 3000

## 📚 API Documentation

Once the server is running, visit:

- **API Documentation**: http://localhost:3000/docs
- **Health Check**: http://localhost:3000/health

## 🔐 Authentication

### Register a new user

\`\`\`bash
curl -X POST http://localhost:3000/auth/signup \
 -H "Content-Type: application/json" \
 -d '{
"name": "John Doe",
"email": "john@example.com",
"password": "securepassword123"
}'
\`\`\`

### Login

\`\`\`bash
curl -X POST http://localhost:3000/auth/login \
 -H "Content-Type: application/json" \
 -d '{
"email": "john@example.com",
"password": "securepassword123"
}'
\`\`\`

## 📋 Task Management

### Create a task

\`\`\`bash
curl -X POST http://localhost:3000/tasks \
 -H "Authorization: Bearer YOUR_JWT_TOKEN" \
 -H "Content-Type: application/json" \
 -d '{
"title": "Implement user authentication",
"description": "Add JWT-based auth to the API",
"totalMinutes": 120
}'
\`\`\`

### Get all tasks

\`\`\`bash
curl -X GET http://localhost:3000/tasks \
 -H "Authorization: Bearer YOUR_JWT_TOKEN"
\`\`\`

### Update task status

\`\`\`bash
curl -X PATCH http://localhost:3000/tasks/1/status \
 -H "Authorization: Bearer YOUR_JWT_TOKEN" \
 -H "Content-Type: application/json" \
 -d '{"status": "IN_PROGRESS"}'
\`\`\`

## 🤖 AI Suggestions

### Get AI-generated task description

\`\`\`bash
curl -X POST http://localhost:3000/ai/suggest \
 -H "Authorization: Bearer YOUR_JWT_TOKEN" \
 -H "Content-Type: application/json" \
 -d '{"title": "Setup CI/CD pipeline"}'
\`\`\`

## 🧪 Testing

\`\`\`bash

# Run all tests

npm test

# Run tests in watch mode

npm run test:watch

# Generate coverage report

npm run test:coverage
\`\`\`

## 📊 Database Schema

### User Model

- `id`: Auto-increment primary key
- `name`: User's full name
- `email`: Unique email address
- `passwordHash`: Bcrypt hashed password
- `isAdmin`: Admin flag (default: false)
- `tasks`: One-to-many relation to tasks

### Task Model

- `id`: Auto-increment primary key
- `title`: Task title (required)
- `description`: Optional task description
- `status`: Enum (TODO, IN_PROGRESS, DONE)
- `totalMinutes`: Time tracking (default: 0)
- `userId`: Foreign key to user
- `user`: Many-to-one relation to user

## 🔧 Configuration

### Environment Variables

| Variable         | Description                  | Default                |
| ---------------- | ---------------------------- | ---------------------- |
| `DATABASE_URL`   | PostgreSQL connection string | Required               |
| `JWT_SECRET`     | JWT signing secret           | Required in production |
| `JWT_EXPIRES_IN` | JWT expiration time          | 7d                     |
| `PORT`           | Server port                  | 3000                   |
| `NODE_ENV`       | Environment                  | development            |
| `LOG_LEVEL`      | Logging level                | info                   |

## 🚀 Deployment

### Production Checklist

1. **Set secure environment variables:**

   - Generate a strong `JWT_SECRET`
   - Use a production PostgreSQL database
   - Set `NODE_ENV=production`

2. **Database setup:**
   \`\`\`bash
   npx prisma migrate deploy
   \`\`\`

3. **Build and start:**
   \`\`\`bash
   npm install --production
   npm start
   \`\`\`

### Docker Production

\`\`\`bash

# Build production image

docker build -t sprintsync-api .

# Run with production environment

docker-compose -f docker-compose.prod.yml up -d
\`\`\`

## 🔮 Future Enhancements

### AI Integration

The AI suggestion endpoint is currently stubbed with deterministic responses. To integrate with a real LLM:

1. **Install AI SDK:**
   \`\`\`bash
   npm install openai @ai-sdk/openai ai
   \`\`\`

2. **Update AI controller:**
   \`\`\`javascript
   // Replace the stub in src/controllers/aiController.js
   const { generateText } = require('ai');
   const { openai } = require('@ai-sdk/openai');

const suggestTaskDescription = async (req, res, next) => {
try {
const { title } = req.body;

    const { text } = await generateText({
      model: openai('gpt-3.5-turbo'),
      prompt: `Generate a detailed task description for: "${title}". Include specific steps and considerations.`,
    });

    res.json({
      title,
      suggestion: {
        description: text,
        confidence: 0.95,
        source: 'openai-gpt-3.5-turbo'
      }
    });

} catch (error) {
next(error);
}
};
\`\`\`

### Additional Features

- Real-time notifications with WebSockets
- File attachments for tasks
- Team collaboration features
- Time tracking with start/stop functionality
- Task templates and automation
- Advanced reporting and analytics

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:

- Create an issue in the repository
- Check the API documentation at `/docs`
- Review the test files for usage examples

---

**SprintSync** - Streamline your productivity with intelligent task management.
