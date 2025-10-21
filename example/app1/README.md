# Bext Example App

This is an example application demonstrating the Bext router's capabilities with a RESTful API.

## Features

- File-based routing
- TypeScript support
- RESTful API endpoints
- Built-in request/response handling
- Error handling

## Getting Started

### Prerequisites

- Bun (v1.0.0 or later)
- Node.js (v18 or later)

### Installation

1. Install dependencies:

```bash
bun install
```

2. Start the development server:

```bash
bun run dev
```

The server will start at `http://localhost:4000`

## API Endpoints

### Hello World

- `GET /hello` - Simple hello world endpoint
- `GET /hello?name=YourName` - Personalized greeting

### Users

- `GET /users` - List all users
- `POST /users` - Create a new user
- `GET /users/:id` - Get a specific user
- `PUT /users/:id` - Update a user
- `DELETE /users/:id` - Delete a user

## Example Requests

### Get all users

```bash
curl http://localhost:4000/users
```

### Create a new user

```bash
curl -X POST http://localhost:4000/users \
  -H "Content-Type: application/json" \
  -d '{"name":"John Doe","email":"john@example.com"}'
```

### Get a specific user

```bash
curl http://localhost:4000/users/1
```

### Update a user

```bash
curl -X PUT http://localhost:4000/users/1 \
  -H "Content-Type: application/json" \
  -d '{"name":"John Updated","email":"john.updated@example.com"}'
```

### Delete a user

```bash
curl -X DELETE http://localhost:4000/users/1
```

## Project Structure

```
app1/
├── app/
│   └── routes/
│       ├── hello.get.ts        # GET /hello
│       └── users/
│           ├── index.get.ts    # GET /users
│           └── [id].get.ts     # GET/PUT/DELETE /users/:id
├── index.ts                   # Application entry point
└── package.json
```

## Development

- The server will automatically reload when you make changes to your code.
- All routes are automatically discovered based on the file system structure.
- TypeScript types are provided for better development experience.

## License

MIT
```bash
bun run index.ts
```

This project was created using `bun init` in bun v1.3.0. [Bun](https://bun.com) is a fast all-in-one JavaScript runtime.
