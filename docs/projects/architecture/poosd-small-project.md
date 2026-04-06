# POOSD Small Project — System Design Architecture

## Overview
Contact management web application built as a group project for UCF's COP4331c (Principles of Object-Oriented Software Development). Features user registration, authentication, and full CRUD operations on personal contacts.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend Framework | React 19 + TypeScript |
| Build Tool | Vite 7 + @vitejs/plugin-react |
| Routing | React Router DOM v7 |
| Styling | CSS modules |
| Backend | PHP (LAMP stack) |
| Database | MySQL (via PHP/LAMP) |

---

## Architecture Diagram

```
┌──────────────────────────────────────────────────────────────┐
│              React SPA (Vite 7)                             │
│                                                              │
│  src/
│  ├── App.tsx            # Root + routing                    │
│  ├── Login.tsx          # Login page                        │
│  ├── Signup.tsx         # Registration page                 │
│  ├── Contacts.tsx       # Contact list + management         │
│  └── config/            # API base URL config               │
│                                                              │
│  React Router DOM                                            │
│  /           → Login                                        │
│  /signup     → Register                                     │
│  /contacts   → Contact dashboard (protected)                │
└────────────────────────┬─────────────────────────────────────┘
                         │ HTTP (fetch/axios)
                         ▼
┌──────────────────────────────────────────────────────────────┐
│              PHP REST API (LAMP Stack)                      │
│              LAMPAPI/                                        │
│                                                              │
│  Login.php           → Validate credentials, return token   │
│  Register.php        → Create user account                  │
│  AddContact.php      → Insert new contact                   │
│  DeleteContact.php   → Remove contact by ID                 │
│  EditContacts.php    → Update contact fields                │
│  SearchContacts.php  → Query contacts by keyword            │
│  config.php          → DB connection settings               │
└────────────────────────┬─────────────────────────────────────┘
                         │ MySQL query
                         ▼
┌──────────────────────────────────────────────────────────────┐
│                  MySQL Database                             │
│                                                              │
│  users (id, username, password_hash, email)                 │
│  contacts (id, user_id, first_name, last_name, email,       │
│            phone, ...)                                       │
└──────────────────────────────────────────────────────────────┘
```

---

## PHP API Endpoints

| File | Method | Description |
|---|---|---|
| `Login.php` | POST | Validate credentials, return session token |
| `Register.php` | POST | Create new user account |
| `AddContact.php` | POST | Add a new contact for current user |
| `DeleteContact.php` | POST | Delete contact by ID |
| `EditContacts.php` | POST | Update contact fields |
| `SearchContacts.php` | POST | Search user's contacts by keyword |

---

## Frontend Pages

| Route | Component | Description |
|---|---|---|
| `/` | `Login.tsx` | Login form; redirects to `/contacts` on success |
| `/signup` | `Signup.tsx` | Registration form |
| `/contacts` | `Contacts.tsx` | Contact list with add/edit/delete/search UI |

---

## Data Models

```sql
users (
  id           INT PRIMARY KEY AUTO_INCREMENT,
  username     VARCHAR(50) UNIQUE,
  email        VARCHAR(100) UNIQUE,
  password_hash VARCHAR(255)
)

contacts (
  id           INT PRIMARY KEY AUTO_INCREMENT,
  user_id      INT REFERENCES users(id),
  first_name   VARCHAR(50),
  last_name    VARCHAR(50),
  email        VARCHAR(100),
  phone        VARCHAR(20)
)
```

---

## Key Features

- User registration and login with session management
- Create, read, update, delete contacts (CRUD)
- Search contacts by name or keyword
- Contacts scoped to authenticated user (no cross-user data access)

---

## Development & Deployment

```bash
# Frontend
cd frontend
npm install
npm run dev      # Vite dev server

# Backend
# Requires LAMP environment (Linux + Apache + MySQL + PHP)
# or XAMPP/WAMP for local development
# Place LAMPAPI/ in Apache web root
```

| Concern | Detail |
|---|---|
| Frontend | Vite dev server (local) or static hosting |
| Backend | Apache + PHP on shared hosting or LAMP server |
| Database | MySQL on same LAMP server |
