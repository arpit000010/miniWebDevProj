# JWT Authentication System

A production-level authentication system built with Node.js, Express, MongoDB, and JWT. Implements access token + refresh token flow with httpOnly cookie security.

---

## Table of Contents

- [Overview](#overview)
- [How It Works](#how-it-works)
- [Project Structure](#project-structure)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [API Reference](#api-reference)
- [Security Decisions](#security-decisions)
- [Auth Flow Diagrams](#auth-flow-diagrams)
- [Key Concepts](#key-concepts)

---

## Overview

This project implements a complete stateless authentication system using JSON Web Tokens (JWT). It solves the fundamental problem of HTTP being stateless — the server has no memory of previous requests, so we need a way to identify users across requests without storing session data on the server.

The system uses two tokens:
- **Access Token** — short-lived (15 min), stored in JS memory on the client, verified with math (no DB lookup)
- **Refresh Token** — long-lived (7 days), stored in an httpOnly cookie and in the database, used to issue new access tokens

---

## How It Works

### Registration Flow

```
Client                          Server                        Database
  |                               |                               |
  |  POST /api/auth/register      |                               |
  |  { email, password }          |                               |
  |------------------------------>|                               |
  |                               |  validate fields              |
  |                               |  check if email exists ------>|
  |                               |<------ user not found        |
  |                               |  bcrypt.hash(password, 10)   |
  |                               |  create user --------------->|
  |                               |<------ user saved            |
  |  201 { message: "registered"} |                               |
  |<------------------------------|                               |
```

### Login Flow

```
Client                          Server                        Database
  |                               |                               |
  |  POST /api/auth/login         |                               |
  |  { email, password }          |                               |
  |------------------------------>|                               |
  |                               |  find user by email -------->|
  |                               |<------ user found            |
  |                               |  bcrypt.compare(password)    |
  |                               |  jwt.sign → accessToken      |
  |                               |  jwt.sign → refreshToken     |
  |                               |  save refreshToken --------->|
  |                               |  set httpOnly cookie         |
  |  200 { accessToken }          |                               |
  |  + Set-Cookie: refreshToken   |                               |
  |<------------------------------|                               |
```

### Authenticated Request Flow

```
Client                          Server
  |                               |
  |  GET /api/auth/profile        |
  |  Authorization: Bearer <token>|
  |------------------------------>|
  |                               |  extract token from header
  |                               |  jwt.verify(token, SECRET)
  |                               |  recompute signature → match?
  |                               |  attach decoded to req.user
  |  200 { user profile }         |
  |<------------------------------|
```

### Token Refresh Flow

```
Client                          Server                        Database
  |                               |                               |
  |  [access token expires]       |                               |
  |  POST /api/auth/refresh-token |                               |
  |  Cookie: refreshToken         |                               |
  |------------------------------>|                               |
  |                               |  read refreshToken from cookie|
  |                               |  jwt.verify(token, REFRESH_SECRET)
  |                               |  find user in DB ----------->|
  |                               |  compare token with DB value |
  |                               |<------ match confirmed       |
  |                               |  jwt.sign → new accessToken  |
  |  200 { accessToken }          |                               |
  |<------------------------------|                               |
```

### Logout Flow

```
Client                          Server                        Database
  |                               |                               |
  |  POST /api/auth/logout        |                               |
  |  Cookie: refreshToken         |                               |
  |------------------------------>|                               |
  |                               |  find user by refreshToken -->|
  |                               |  set refreshToken: null ----->|
  |                               |  res.clearCookie()            |
  |  200 { message: "logged out"} |                               |
  |<------------------------------|                               |
```

---

## Project Structure

```
auth-system/
├── controllers/
│   └── auth.controller.js     # register, login, refresh, logout logic
├── middleware/
│   └── auth.middleware.js     # JWT verification middleware
├── models/
│   └── user.model.js          # Mongoose user schema
├── routes/
│   └── auth.route.js          # Route definitions
├── .env                       # Environment variables (never commit)
├── .env.example               # Template for environment variables
├── .gitignore
├── index.js                   # App entry point
└── package.json
```

---

## Tech Stack

| Technology | Purpose |
|------------|---------|
| Node.js | Runtime environment |
| Express.js | Web framework |
| MongoDB Atlas | Cloud database |
| Mongoose | MongoDB ODM |
| jsonwebtoken | JWT creation and verification |
| bcryptjs | Password hashing |
| cookie-parser | Parse httpOnly cookies |
| dotenv | Environment variable management |

---

## Getting Started

### Prerequisites

- Node.js v18+
- MongoDB Atlas account (or local MongoDB)

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/auth-system.git
cd auth-system

# Install dependencies
npm install

# Create environment file
cp .env.example .env
# Fill in your values in .env

# Start the server
node index.js
```

Server will start on `http://localhost:3000`

---

## Environment Variables

Create a `.env` file in the root directory:

```env
PORT=3000
MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/authdb
JWT_SECRET=your_super_secret_access_key_here
JWT_REFRESH_SECRET=your_super_secret_refresh_key_here
NODE_ENV=development
```

> **Important:** Never commit your `.env` file. It is already included in `.gitignore`.

### Why Two Secrets?

Access token and refresh token use different secrets intentionally. If the access token secret leaks, the refresh token secret remains safe — attackers cannot forge refresh tokens and maintain persistent access.

---

## API Reference

### POST `/api/auth/register`

Register a new user.

**Request Body:**
```json
{
  "email": "arpit@gmail.com",
  "password": "securepassword"
}
```

**Responses:**

| Status | Description |
|--------|-------------|
| 201 | User registered successfully |
| 400 | Missing fields or user already exists |
| 500 | Server error |

---

### POST `/api/auth/login`

Login with email and password.

**Request Body:**
```json
{
  "email": "arpit@gmail.com",
  "password": "securepassword"
}
```

**Response:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

Also sets an httpOnly cookie: `refreshToken`

| Status | Description |
|--------|-------------|
| 200 | Login successful, tokens issued |
| 400 | Missing fields |
| 401 | Invalid credentials |
| 500 | Server error |

---

### GET `/api/auth/profile` 🔒 Protected

Get the logged-in user's profile. Requires valid access token.

**Headers:**
```
Authorization: Bearer <accessToken>
```

**Response:**
```json
{
  "message": "Welcome arpit@gmail.com! This is your profile."
}
```

| Status | Description |
|--------|-------------|
| 200 | Profile returned |
| 401 | Missing, expired, or invalid token |

---

### POST `/api/auth/refresh-token`

Get a new access token using the refresh token cookie.

**No body required.** The refresh token is automatically sent via cookie.

**Response:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

| Status | Description |
|--------|-------------|
| 200 | New access token issued |
| 401 | Missing, invalid, or expired refresh token |

---

### POST `/api/auth/logout`

Logout the current user. Clears the refresh token from DB and cookie.

**No body required.**

**Response:**
```json
{
  "message": "Logged out successfully"
}
```

| Status | Description |
|--------|-------------|
| 200 | Logged out successfully |
| 500 | Server error |

---

## Security Decisions

### 1. Passwords hashed with bcrypt (salt rounds: 10)

Passwords are never stored in plain text. bcrypt generates a random salt for each password, meaning two users with the same password will have different hashes. Salt rounds of 10 provides a good balance between security and performance.

### 2. Access token stored in JS memory, not localStorage

localStorage is accessible by any JavaScript on the page — including malicious scripts injected via XSS attacks. Storing the access token in a JS variable means it cannot be stolen by third-party scripts.

### 3. Refresh token stored in httpOnly cookie

The `httpOnly` flag prevents JavaScript from reading the cookie entirely. Even if an XSS attack occurs, the attacker cannot access the refresh token. The browser sends it automatically with every request to the server.

```js
res.cookie('refreshToken', refreshToken, {
  httpOnly: true,               // JS cannot read this
  secure: process.env.NODE_ENV === 'production', // HTTPS only in prod
  sameSite: 'strict',           // not sent on cross-site requests
  maxAge: 7 * 24 * 60 * 60 * 1000
});
```

### 4. Refresh token stored in database

Unlike access tokens, refresh tokens are persisted in the database. This gives us **revocation power** — we can delete a specific device's token at any time, immediately invalidating that session without affecting other devices.

### 5. Same error message for wrong email and wrong password

```js
// Both cases return the same message
return res.status(401).json({ message: 'Invalid credentials' });
```

Returning different messages like "email not found" vs "wrong password" tells attackers which emails are registered in your system. A generic message reveals nothing.

### 6. Password field never returned in responses

The `select: false` option on the password field in the schema ensures it is never included in query results unless explicitly requested.

```js
password: {
  type: String,
  required: true,
  select: false  // never comes back in queries
}
```

### 7. Two separate JWT secrets

Access token and refresh token are signed with different secrets (`JWT_SECRET` and `JWT_REFRESH_SECRET`). If one leaks, the other remains secure.

---

## Key Concepts

### Why JWT over Sessions?

| | Sessions | JWT |
|---|---------|-----|
| Server storage | Stores session in DB | Stores nothing (access token) |
| DB hit per request | Every request | Only on token refresh |
| Scalability | Harder — all servers need same DB | Easy — any server with the secret can verify |
| Revocation | Easy — delete session | Hard for access tokens, possible for refresh tokens |

JWT wins on **scale and performance.** Sessions win on **instant revocation.** This system gets the best of both worlds — stateless access tokens for speed + stored refresh tokens for revocation control.

### JWT Structure

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9    ← Header (base64)
.
eyJpZCI6IjY2NWYyMiIsImVtYWlsIjoiYX0    ← Payload (base64)
.
SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw  ← Signature (HMAC SHA256)
```

- **Header** — algorithm used (`HS256`) and token type (`JWT`)
- **Payload** — user data (`id`, `email`, `iat`, `exp`) — readable by anyone, never put sensitive data here
- **Signature** — `HMAC_SHA256(header + payload, SECRET_KEY)` — tamper proof seal

### How Signature Verification Works

```
Server receives token
       ↓
Split into header, payload, signature
       ↓
Recompute: HMAC_SHA256(header + payload, SECRET_KEY)
       ↓
Compare recomputed signature with received signature
       ↓
Match → valid ✅     No match → tampered ❌
```

The server never stores tokens — it just recomputes and compares. This is why JWT scales horizontally — any server with the same secret can verify any token.

---

## Testing with Postman

1. **Register** — `POST /api/auth/register` with email + password
2. **Login** — `POST /api/auth/login` — copy the `accessToken` from response, cookie is set automatically
3. **Profile** — `GET /api/auth/profile` — set `Authorization: Bearer <token>` in Headers tab
4. **Refresh** — `POST /api/auth/refresh-token` — no setup needed, cookie sent automatically
5. **Logout** — `POST /api/auth/logout` — clears everything

---

*Built as part of backend engineering practice — NIT Durgapur, 2024*