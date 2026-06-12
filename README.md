# GroupChat Frontend

React + TypeScript frontend for the GroupChat backend.

## Setup

1. **Install dependencies**

```bash
npm install
```

2. **Configure environment**

Copy `.env.example` to `.env` and update the URLs:

```bash
cp .env.example .env
```

```env
VITE_API_BASE_URL=http://localhost:8080/api   # Your backend URL
VITE_SOCKET_URL=http://localhost:8080          # Socket.io URL (usually same host, no /api)
```

3. **Start dev servers**

```bash
npm run dev
```

4. **Build for production**

```bash
npm run build
```

## Features

- **Auth** — Register, login, and logout with session via HTTP-only cookie
- **Groups** — Join any group by ID, view your groups in the sidebar, leave groups
- **Real-time Chat** — Send and receive messages instantly via Socket.io
- **Pagination** — Load older messages on demand with cursor-based pagination

## Stack

- React 18 + TypeScript
- React Router v6
- Socket.io Client
- Vite

## Notes

- The backend must have CORS configured to allow your frontend origin with `credentials: true`
- The `VITE_API_BASE_URL` must point to the `/api` prefix used in the backend router
- Sessions are stored as HTTP-only cookies — ensure your frontend and backend share the same domain in production, or configure the backend CORS/cookie settings appropriately.
