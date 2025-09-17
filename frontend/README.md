# Ctrl + LAB - Frontend

This directory contains the source code for the frontend of the **Ctrl + LAB** application. It is a modern, responsive Single-Page Application (SPA) built with React and Vite.

This application provides the complete user interface for teachers and administrators to interact with the backend API, manage schedules, book lab sessions, and use the AI assistant "Controly".

## Technology Stack

- **Framework:** [React 19](https://react.dev/)
- **Build Tool:** [Vite](https://vitejs.dev/)
- **Routing:** [React Router DOM](https://reactrouter.com/)
- **HTTP Client:** [Axios](https://axios-http.com/)
- **Styling:** Pure CSS with CSS Variables for theming (Light & Dark modes).
- **Internationalization:** [i18next](https://www.i18next.com/) for English and Spanish support.
- **Linting:** ESLint

## Getting Started

These instructions assume you are running the backend service separately as described in the main project `README.md`.

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or later recommended)
- [npm](https://www.npmjs.com/) (usually included with Node.js)

### Installation & Setup

1.  **Navigate to the frontend directory:**

    ```sh
    cd frontend
    ```

2.  **Install dependencies:**

    ```sh
    npm install
    ```

3.  **Configure Environment Variables:**
    Create a `.env` file in this directory (`/frontend/.env`). This file is used to tell the React application where the backend API is located.

    ```env
    # URL of the running backend API
    VITE_API_BASE_URL=http://localhost:8000
    ```

## Available Scripts

In the project directory, you can run:

### `npm run dev`

Runs the app in development mode.
Open [http://localhost:5173](http://localhost:5173) to view it in your browser.

The page will reload when you make changes, and you will see any lint errors in the console.

### `npm run build`

Builds the app for production to the `dist` folder.
It correctly bundles React in production mode and optimizes the build for the best performance.

### `npm run lint`

Lints the project files for code quality and style issues according to the configured ESLint rules.
