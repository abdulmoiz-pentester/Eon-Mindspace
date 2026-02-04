
# Eon-Mindspace
[![TypeScript](https://img.shields.io/badge/TypeScript-4.9+-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.2+-61DAFB.svg)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-5.0+-646CFF.svg)](https://vitejs.dev/)
[![AWS Bedrock](https://img.shields.io/badge/AWS%20Bedrock-Enabled-232F3E.svg)](https://aws.amazon.com/bedrock/)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

Eon-Mindspace is a cutting-edge, secure conversational AI platform built for enterprise environments. It leverages the power of AWS Bedrock to provide intelligent, context-aware dialogue while ensuring robust security through SAML-based authentication and session management. This repository contains the full-stack application, featuring a modern React frontend and an Express.js backend.

## ✨ Features

-   **AI-Powered Conversations**: Integrates with AWS Bedrock Agent Runtime to deliver intelligent and context-aware responses.
-   **Enterprise-Grade Security**: Implements SAML-based authentication with support for providers like AWS SSO.
-   **Modern User Interface**: A responsive and intuitive chat interface built with React, Vite, and Shadcn/ui components.
-   **Customizable Theme**: Supports light and dark modes with a professional, medical-themed color palette.
-   **Session Management**: Secure session and JWT management for handling user authentication state.
-   **Type-Safe Codebase**: Fully written in TypeScript for both frontend and backend to ensure reliability and maintainability.
-   **Streaming Responses**: The backend service is capable of streaming responses from the AI agent for a real-time chat experience.

## 🛠️ Tech Stack

-   **Frontend**:
    -   React, TypeScript, Vite
    -   Tailwind CSS, Shadcn/ui
    -   TanStack Query for data fetching
    -   Zustand & Pinia for state management
-   **Backend**:
    -   Node.js, Express.js, TypeScript
    -   Passport.js with `passport-saml` for SAML authentication
    -   JWT for stateless session management
    -   AWS SDK for Bedrock
-   **Tooling**:
    -   ESLint, Prettier
    -   NPM for package management

## 📦 Getting Started

### Prerequisites

-   Node.js (v24.x recommended, see `.nvmrc`)
-   `npm` or a compatible package manager
-   An AWS account with access to Bedrock
-   A configured SAML Identity Provider (e.g., AWS SSO, Keycloak)

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/abdulmoiz-pentester/eon-mindspace.git
    cd eon-mindspace
    ```

2.  **Install Frontend Dependencies:**
    ```bash
    npm install
    ```

3.  **Install Backend Dependencies:**
    ```bash
    cd backend
    npm install
    ```

4.  **Configure Environment Variables:**
    -   Navigate to the `backend` directory.
    -   Copy the example environment file:
        ```bash
        cp .env.example .env
        ```
    -   Edit the `.env` file with your specific configuration, including server settings, SAML provider details, and AWS Bedrock agent ARN.

5.  **Run the Application:**
    -   **Start the Backend Server:**
        In the `backend` directory, run:
        ```bash
        npm run dev
        ```
    -   **Start the Frontend Development Server:**
        In a separate terminal, from the root directory, run:
        ```bash
        npm run dev
        ```

6.  **Access the Application:**
    Open your browser and navigate to `http://localhost:8080` (or the port specified by Vite).

## 📁 Project Structure

The repository is organized into a frontend application and a backend service.

```
.
├── backend/                # Express.js backend application
│   ├── src/
│   │   ├── config/         # Passport.js and SAML strategy configuration
│   │   ├── controllers/    # Route handlers for auth and API
│   │   ├── middlewares/    # Custom Express middlewares
│   │   ├── routes/         # API and authentication routes
│   │   └── services/       # Business logic for Bedrock and sessions
│   └── .env.example        # Environment variable template
├── public/                 # Static assets for the frontend
├── src/                    # React frontend application
│   ├── components/
│   │   ├── chat/           # Core chat UI components (Sidebar, Message Area, Input)
│   │   └── ui/             # Reusable UI components from Shadcn
│   ├── hooks/              # Custom React hooks for auth and theme
│   ├── lib/                # Client-side API calls and utilities
│   └── pages/              # Top-level page components
└── package.json            # Frontend dependencies and scripts
```

## ⚙️ Configuration

The application's behavior is controlled primarily through environment variables in the `backend/.env` file.

### Key Environment Variables

-   `PORT`: The port for the backend server.
-   `FRONTEND_URL`: The URL of the frontend application for CORS and redirects.
-   `SESSION_SECRET`, `JWT_SECRET`: Secret keys for session and token security.
-   `ENABLE_SAML`: Set to `true` to enable SAML authentication.
-   `SAML_PROVIDER`: Can be `samling` for development or `aws-sso` for production.
-   `AWS_SSO_*`: Configuration details for your AWS SSO SAML application (entry point, issuer, certificate).
-   `BEDROCK_AGENT_ARN`: The ARN of your AWS Bedrock agent.

## 🤝 Contributing

Contributions are welcome! Please follow these steps to contribute:

1.  **Fork the repository.**
2.  **Create a new feature branch:**
    ```bash
    git checkout -b feature/your-amazing-feature
    ```
3.  **Make your changes.** Ensure your code adheres to the existing style.
4.  **Commit your changes:**
    ```bash
    git commit -m "feat: Add some amazing feature"
    ```
5.  **Push to your branch:**
    ```bash
    git push origin feature/your-amazing-feature
    ```
6.  **Open a Pull Request** against the `main` branch.

## 📝 License

This project is licensed under the MIT License.



