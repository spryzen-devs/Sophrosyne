# Sentinel Backend API Foundation

Production-ready healthcare IoT platform foundation.

## Tech Stack
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database ORM**: Prisma
- **Validation**: Zod
- **Security**: Helmet, JWT, CORS
- **Logging**: Morgan

## Project Structure
```
backend/
├── src/
│   ├── config/          # Centralized configuration (env, prisma)
│   ├── controllers/     # Request handlers
│   ├── services/        # Business logic
│   ├── repositories/    # Data access (Prisma)
│   ├── routes/          # Express routes
│   ├── middleware/      # Global/Custom middleware
│   ├── validators/      # Zod validation schemas
│   ├── utils/           # Shared utilities
│   ├── app.js           # Express app configuration
│   └── server.js        # Server entry point
├── prisma/              # Prisma schema and migrations
├── .env                 # Environment variables
└── package.json
```

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure environment variables in `.env`.

3. Generate Prisma client:
   ```bash
   npx prisma generate
   ```

4. Run migrations:
   ```bash
   npx prisma migrate dev
   ```

5. Start the server:
   ```bash
   npm run dev
   ```

## Health Check
- **Endpoint**: `GET /api/v1/health`
- **Response**:
  ```json
  {
    "success": true,
    "message": "Sentinel Backend Running",
    "database": "Connected",
    "timestamp": "2024-03-21T12:00:00.000Z"
  }
  ```
