# Real-Time Collaborative Document Editor

This project is a full-stack, real-time collaborative document editing platform built with React, Node.js, Express, and Socket.IO. It allows multiple users to create, share, and simultaneously edit documents, with changes reflected instantly for all collaborators.

## Live Demo

**You can view the live application here:** **You can view the live application here:** (https://collab-doc-git-main-snehils-projects-4954fa41.vercel.app)

---

The application is architected with a modern, decoupled approach:

* **Frontend:** Deployed on **Vercel** for optimal performance and scalability.
* **Backend:** Deployed on **Render** to support the persistent WebSocket connections required for real-time functionality.
* **Database:** Powered by **Supabase** (PostgreSQL) for robust data storage and user authentication.

## Features

* **User Authentication:** Secure user registration and login system.
* **Real-Time Collaboration:** Multiple users can edit the same document simultaneously, with changes broadcast instantly using WebSockets.
* **Document Management:** A central dashboard where users can view documents they own or have been invited to collaborate on.
* **Document Sharing:** Document owners can share their documents with other registered users via email.
* **Version History:** Users can save snapshots of a document's content and revert to any previous version.

## Tech Stack

| Category     | Technology                                  |
| :----------- | :------------------------------------------ |
| **Frontend** | React, React Router, Socket.IO Client       |
| **Backend** | Node.js, Express, Socket.IO, JWT, Bcrypt.js |
| **Database** | Supabase (PostgreSQL)                       |
| **Deployment** | Vercel (Frontend), Render (Backend)         |

## Project Structure

The project is organized as a monorepo with two distinct applications:

```
/
├── client/         # React Frontend Application
├── server/         # Node.js + Express Backend API
├── .gitignore      # Specifies files for Git to ignore
└── vercel.json     # Vercel deployment configuration
```

## Local Development Setup

To run this project on your local machine, follow these steps.

### Prerequisites

* [Node.js](https://nodejs.org/) (v18.x or later)
* [Git](https://git-scm.com/)
* A free [Supabase](https://supabase.com/) account
* A free [Render](https://render.com/) account (for deployment)
* A free [Vercel](https://vercel.com/) account (for deployment)

### 1. Clone the Repository

```bash
git clone https://github.com/Snehil25/Collab-Doc
cd Collab-Doc
```

### 2. Backend Setup (`/server`)

1.  **Navigate to the server directory:**
    ```bash
    cd server
    ```
2.  **Install dependencies:**
    ```bash
    npm install
    ```
3.  **Create the `.env` file:** Create a file named `.env` in the `/server` directory and add the following variables. Get the values from your Supabase project dashboard (Settings > API).
    ```env
    # Get from Supabase Project > Settings > API
    SUPABASE_URL=YOUR_SUPABASE_PROJECT_URL
    SUPABASE_SERVICE_KEY=YOUR_SUPABASE_SERVICE_ROLE_KEY

    # Create a long, random string for signing tokens
    JWT_SECRET=YOUR_SUPER_LONG_AND_RANDOM_SECRET_STRING
    ```
4.  **Run the backend server:**
    ```bash
    npm run dev
    ```
    The server will be running on `http://localhost:3001`.

### 3. Frontend Setup (`/client`)

1.  **Navigate to the client directory (from the root):**
    ```bash
    cd client
    ```
2.  **Install dependencies:**
    ```bash
    npm install
    ```
3.  **Create the `.env` file:** Create a file named `.env` in the `/client` directory and add the following variable:
    ```env
    REACT_APP_API_URL=http://localhost:3001
    ```
4.  **Run the frontend server:**
    ```bash
    npm start
    ```
    The React application will open in your browser at `http://localhost:3000`.

## Deployment

The application is designed to be deployed on two separate platforms for optimal performance.

### 1. Backend on Render

* **Service Type:** Web Service
* **Root Directory:** `server`
* **Build Command:** `npm install`
* **Start Command:** `npm start`
* **Environment Variables:**
    * `SUPABASE_URL`: (Your Supabase URL)
    * `SUPABASE_SERVICE_KEY`: (Your Supabase `service_role` key)
    * `JWT_SECRET`: (Your JWT secret string)
    * `FRONTEND_URL`: (Your final Vercel production URL)

### 2. Frontend on Vercel

* **Framework Preset:** Create React App
* **Root Directory:** `client`
* **Environment Variables:**
    * `REACT_APP_API_URL`: (The URL of your deployed Render backend, e.g., `https://your-app.onrender.com`)

### 3. Supabase Database Setup

For the application to function correctly, your Supabase database needs specific tables and security policies. These should be run in the **SQL Editor** in your Supabase project.

* **Tables:** `documents`, `document_collaborators`
* **Functions:** `get_documents_for_user()`
* **RLS Policies:** Row Level Security policies are required to allow users to create and access documents securely. Refer to the final SQL scripts from our development process to ensure these are set up correctly.
