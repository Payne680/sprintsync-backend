# SprintSync Backend API
## [Video Link](https://www.loom.com/share/2ca1ad0a08ae460d8363a924f0ab7d17?sid=540ac882-ad33-4c8a-9bcc-23b67eb3f9f6)

A comprehensive task management API built with Express.js, Prisma ORM, and PostgreSQL, featuring JWT authentication and AI-powered task suggestions.

## 🚀 Features

- **Authentication System**: JWT-based authentication with bcrypt password hashing
- **Task Management**: Full CRUD operations for tasks with status tracking
- **AI Integration**: Multi-provider AI system with Google Gemini and OpenAI support
- **User Scoping**: Tasks are automatically scoped to authenticated users
- **Comprehensive Logging**: Structured logging with Winston
- **API Documentation**: Interactive Swagger/OpenAPI documentation
- **Testing Suite**: Complete test coverage with Jest and Supertest
- **Docker Support**: Full containerization with Docker Compose
- **Database Migrations**: Automated Prisma migrations

## 📋 Prerequisites

- Node.js 16+
- PostgreSQL 12+
- Google API key for Gemini AI (optional: OpenAI API key)

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

   # Edit .env with your database credentials, JWT secret, and API keys:

   # DATABASE_URL, JWT_SECRET, GOOGLE_API_KEY, OPENAI_API_KEY (optional)

   \`\`\`

3. **Set up the database:**
   \`\`\`bash
   npm run db:migrate && npm run db:generate
   npm run db:seed # Optional demo data
   \`\`\`

4. **Start the development server:**
   \`\`\`bash
   npm run dev
   \`\`\`

### Docker Deployment

\`\`\`bash
docker-compose up -d # Starts PostgreSQL + API on port 3000
\`\`\`

## 📚 API Documentation

Once the server is running, visit:

- **API Documentation**: http://localhost:3000/docs
- **Health Check**: http://localhost:3000/health

## 🔐 Quick API Examples

**Register:** `POST /auth/signup` with `{name, email, password}`  
**Login:** `POST /auth/login` with `{email, password}`  
**Create Task:** `POST /tasks` with `{title, description, totalMinutes}` + Bearer token  
**Get Tasks:** `GET /tasks` + Bearer token  
**Update Status:** `PATCH /tasks/:id/status` with `{status}` + Bearer token

## 🤖 AI Suggestions

Get AI-powered task descriptions using our multi-provider system (Gemini/OpenAI):

\`\`\`bash
curl -X POST http://localhost:3000/ai/suggest \
 -H "Authorization: Bearer YOUR_JWT_TOKEN" \
 -H "Content-Type: application/json" \
 -d '{"title": "Setup CI/CD pipeline", "description": "Initial setup requirements"}'
\`\`\`

Response includes confidence scores and detailed task breakdowns.

## 🧪 Testing

\`\`\`bash
npm test # Run all tests
npm run test:watch # Watch mode
npm run test:coverage # Coverage report
\`\`\`

## 📊 Database Schema

**Users:** `id`, `name`, `email`, `passwordHash`, `isAdmin`, `tasks[]`  
**Tasks:** `id`, `title`, `description`, `status` (TODO/IN_PROGRESS/DONE), `totalMinutes`, `userId`

## 🔧 Configuration

### Environment Variables

| Variable         | Description                  | Default     |
| ---------------- | ---------------------------- | ----------- |
| `DATABASE_URL`   | PostgreSQL connection string | Required    |
| `JWT_SECRET`     | JWT signing secret           | Required    |
| `GOOGLE_API_KEY` | Google Gemini AI API key     | Optional    |
| `OPENAI_API_KEY` | OpenAI API key (backup)      | Optional    |
| `PORT`           | Server port                  | 3000        |
| `NODE_ENV`       | Environment                  | development |

## 🚀 Deployment

1. Set secure environment variables (`JWT_SECRET`, `DATABASE_URL`, API keys)
2. Run migrations: `npx prisma migrate deploy`
3. Start: `npm install --production && npm start`

For Docker: `docker-compose -f docker-compose.prod.yml up -d`

## 🔮 Future Enhancements

- Real-time notifications with WebSockets
- File attachments for tasks
- Team collaboration features
- Time tracking with start/stop functionality
- Task templates and automation
- Advanced reporting and analytics

## 🤝 Contributing

1. Fork → Create feature branch → Make changes → Add tests → Submit PR

## 🆘 Support

- 📖 API docs: http://localhost:3000/docs
- 🐛 Issues: Create an issue in this repository
- 📝 Examples: Check the test files

---

**SprintSync Backend** - Production-ready task management API with AI integration.
