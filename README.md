# Eon Mindspace

Eon Mindspace is a security-focused chatbot platform powered by Amazon Bedrock, delivering intelligent assistance through a modern web interface with secure SSO authentication.

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Requirements](#requirements)
- [Backend Setup](#backend-setup)
- [Frontend Setup](#frontend-setup)
- [Running the App](#running-the-app)
- [Environment Variables](#environment-variables)
- [Screenshots](#screenshots)
- [License](#license)

## Features

- **Secure chatbot interface**
- **Bedrock-powered AI responses**
- **SSO authentication**
- Express API backend
- End-to-end TypeScript
- Modern React UI

## Tech Stack

| Layer     | Technology                |
|-----------|---------------------------|
| Frontend  | React, TypeScript         |
| Backend   | Express, TypeScript       |
| Auth      | SSO                       |
| AI        | Amazon Bedrock            |

> Frontend lives in the project root, backend API runs from `/backend`.

## Project Structure
Eon-Mindspace/
├─ src/ # React frontend source
├─ public/ # Static assets
├─ backend/ # Express API backend
├─ index.html
├─ package.json
└─ backend/.env.example

text

## Requirements

- Node.js (recommended via nvm)
- npm
- Backend environment configuration for Bedrock and SSO

## Backend Setup

1. **Move to backend folder:**

   ```bash
   cd backend
Install dependencies:

bash
npm install
Create environment file:

bash
cp .env.example .env
Configure the required environment variables (see Environment Variables section)

Compile TypeScript:

bash
npx tsc
Start backend:

bash
npx ts-node src/app.ts
Backend runs on the port configured in .env.

Frontend Setup
From project root, install dependencies:

bash
npm install
Start frontend:

bash
npm run dev
Frontend typically runs at http://localhost:5173

Running the App
Start backend first, then frontend, then open the frontend URL in your browser to access Eon Mindspace.

Environment Variables
Variable	Description
ENABLE_SAML	Enable SAML authentication
ALLOW_DEV_LOGIN	Allow developer login
SAML_ENTRY_POINT	Keycloak SAML entry URL
SAML_ISSUER	SAML issuer identifier
SAML_IDP_CERT	Identity Provider certificate
BEDROCK_API_KEY	Amazon Bedrock API key
Screenshots
(Add screenshots here if available)

License
Internal / proprietary project.
