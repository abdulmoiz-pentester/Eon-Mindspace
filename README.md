# **Eon-Mindspace Technical Documentation**

---

## **1. Overview**
**Eon-Mindspace** is a **security-focused AI chatbot platform** powered by **Amazon Bedrock**, providing intelligent, secure, and compliant AI-driven conversations through a modern web interface. The platform integrates **SSO authentication** (SAML) for secure access and leverages **TypeScript** for full-stack development.

### **Key Features**
- **AI-Powered Chatbot** (Amazon Bedrock)
- **Secure SSO Authentication** (SAML)
- **Modern React UI** with **shadcn/ui** components
- **TypeScript** for type safety
- **Bedrock Agent Integration** for conversational AI
- **Responsive & Accessible UI**

---

## **2. Tech Stack**
| **Layer**       | **Technologies**                                                                 |
|-----------------|---------------------------------------------------------------------------------|
| **Frontend**    | React, TypeScript, Vite, Tailwind CSS, shadcn/ui, Radix UI, Pinia (State Mgmt) |
| **Backend**     | Node.js, Express, TypeScript, AWS SDK, Passport-SAML, JWT                     |
| **Authentication** | SAML (AWS SSO / Keycloak), JWT, Session Management                          |
| **AI Integration** | Amazon Bedrock, Bedrock Agent Runtime, AWS STS Credentials                    |
| **State Mgmt**  | TanStack Query (React Query), Pinia                                           |
| **UI Components** | shadcn/ui, Radix UI, Lucide Icons                                             |
| **Dev Tools**   | ESLint, Prettier, Vite, TypeScript, Jest (if applicable)                     |

---

## **3. Project Structure**
```
Eon-Mindspace/
├── src/                  # Frontend (React + TypeScript)
│   ├── components/       # Reusable UI components
│   ├── hooks/            # Custom React hooks
│   ├── lib/              # Utility functions
│   ├── pages/            # Page components
│   ├── App.tsx           # Main app entry
│   └── index.css         # Global styles
│
├── backend/              # Backend (Express + TypeScript)
│   ├── config/           # Configuration files
│   ├── controllers/      # Route handlers
│   ├── middlewares/      # Express middleware
│   ├── routes/           # API routes
│   ├── services/         # Business logic
│   ├── types/            # TypeScript interfaces
│   └── app.ts            # Express server entry
│
├── public/               # Static assets
├── .env.example          # Environment variables template
├── package.json          # Frontend dependencies
├── backend/package.json  # Backend dependencies
└── vite.config.ts        # Vite configuration
```

---

## **4. Setup & Installation**

### **Prerequisites**
- **Node.js** (v18+ recommended)
- **npm** or **yarn** (v2+ recommended)
- **AWS Account** (for Bedrock & SSO)
- **Supabase** (if using for local auth)

### **Frontend Setup**
1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Eon-Mindspace
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Run the development server**
   ```bash
   npm run dev
   ```
   - Frontend runs at `http://localhost:5173`

### **Backend Setup**
1. **Navigate to the backend directory**
   ```bash
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   - Copy `.env.example` to `.env`
   - Configure AWS Bedrock, SAML, and session settings
   ```bash
   cp .env.example .env
   ```

4. **Start the backend server**
   ```bash
   npm run dev
   ```
   - Backend runs at `http://localhost:5000`

---

## **5. API Documentation**

### **Base URL**
`http://localhost:5000/api`

### **Authentication**
- **SAML-based authentication** (for production)
- **JWT-based authentication** (for development)

### **Endpoints**

#### **1. `/api/bedrock-agent` (POST)**
- **Description**: Invokes the Bedrock Agent with a user message.
- **Request Body**:
  ```json
  {
    "message": "What is our password policy?",
    "agentAliasId": "L3UQ4TMBQ8"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "answer": "The password policy requires 12+ characters with special symbols.",
    "agentAliasUsed": "L3UQ4TMBQ8",
    "timestamp": "2024-05-20T12:00:00Z"
  }
  ```

#### **2. `/auth/saml/login` (GET)**
- **Description**: Initiates SAML login.
- **Response**: Redirects to SAML provider.

#### **3. `/auth/saml/callback` (POST)**
- **Description**: Handles SAML callback after authentication.
- **Response**: Redirects to frontend with JWT.

#### **4. `/auth/check` (GET)**
- **Description**: Checks if the user is authenticated.
- **Response**:
  ```json
  {
    "authenticated": true,
    "user": {
      "email": "user@example.com",
      "name": "John Doe"
    }
  }
  ```

---

## **6. Database Schema (If Applicable)**
*(Note: Eon-Mindspace primarily uses **localStorage** for chat history and **AWS SSO** for authentication. No traditional database is used.)*

### **LocalStorage (Chat History)**
- **Key**: `eon_chat_history`
- **Structure**:
  ```json
  [
    {
      "id": "chat-1",
      "title": "Security Policy",
      "date": "2024-05-20",
      "preview": "What is our password policy?",
      "messages": [
        {
          "id": "msg-1",
          "role": "user",
          "content": "What is our password policy?",
          "timestamp": "2024-05-20T12:00:00Z"
        },
        {
          "id": "msg-2",
          "role": "assistant",
          "content": "The password policy requires 12+ characters with special symbols.",
          "timestamp": "2024-05-20T12:01:00Z"
        }
      ]
    }
  ]
  ```

---

## **7. Configuration**

### **Environment Variables**
| Variable | Description | Example |
|----------|------------|---------|
| `PORT` | Backend server port | `5000` |
| `FRONTEND_URL` | Frontend URL | `http://localhost:5173` |
| `SESSION_SECRET` | Session secret key | `your-secret-key` |
| `JWT_SECRET` | JWT secret key | `your-jwt-secret` |
| `AWS_SSO_ENTRY_POINT` | AWS SSO login URL | `https://secure-login.awsapps.com/start/` |
| `SAML_CALLBACK_URL` | SAML callback URL | `http://localhost:5000/auth/saml/callback` |
| `BEDROCK_AGENT_ARN` | Bedrock Agent ARN | `arn:aws:bedrock:us-west-2:965631485706:agent/ZBYIUMEYOE` |

### **AWS Bedrock Configuration**
- **Agent ARN**: `arn:aws:bedrock:us-west-2:965631485706:agent/ZBYIUMEYOE`
- **Alias ID**: `L3UQ4TMBQ8` (default)

---

## **8. Development Guidelines**

### **Frontend Best Practices**
- **TypeScript**: Enforce strict typing.
- **shadcn/ui**: Use for consistent UI components.
- **Pinia**: For state management.
- **React Query**: For data fetching and caching.

### **Backend Best Practices**
- **Express Middleware**: Use for authentication and error handling.
- **AWS SDK**: For secure AWS interactions.
- **JWT & Sessions**: For stateless authentication.

### **Testing**
- **Unit Tests**: Use Jest (if applicable).
- **Integration Tests**: Test API endpoints.
- **E2E Tests**: Test user flows.

---

## **9. Deployment Instructions**

### **Frontend Deployment**
1. **Build the frontend**
   ```bash
   npm run build
   ```
2. **Deploy to Vercel/Netlify**
   - Push to GitHub/GitLab.
   - Configure CI/CD in deployment platform.

### **Backend Deployment**
1. **Build the backend**
   ```bash
   npm run build
   ```
2. **Deploy to AWS (EC2/ECS)**
   - Configure environment variables.
   - Set up reverse proxy (Nginx/Apache).
   - Configure AWS SSO and Bedrock permissions.

### **AWS Permissions**
- Ensure the IAM role has:
  - `bedrock:InvokeAgent` permission.
  - `sts:AssumeRoleWithSAML` permission.

---

## **10. Troubleshooting**

### **Common Issues & Fixes**
| Issue | Solution |
|-------|----------|
| **SAML Login Fails** | Check `.env` for correct `SAML_CALLBACK_URL`. |
| **Bedrock Agent Not Responding** | Ensure AWS credentials are valid. |
| **JWT Errors** | Verify `JWT_SECRET` in `.env`. |
| **LocalStorage Not Persisting** | Check browser settings for localStorage. |

---

## **11. Contributing**
1. **Fork the repository**.
2. **Create a feature branch**:
   ```bash
   git checkout -b feature/your-feature
   ```
3. **Commit changes**:
   ```bash
   git commit -m "Add new feature"
   ```
4. **Push to the branch**:
   ```bash
   git push origin feature/your-feature
   ```
5. **Open a Pull Request**.

---

## **12. License**
This project is licensed under **MIT**.

---

## **13. Appendix**

### **Key Files Explained**
| File | Purpose |
|------|---------|
| `src/App.tsx` | Main React app entry. |
| `backend/app.ts` | Express server entry. |
| `src/components/chat/ChatArea.tsx` | Chat UI component. |
| `backend/src/services/bedrockService.ts` | Bedrock Agent integration. |
| `backend/src/middlewares/authMiddleware.ts` | Authentication middleware. |

### **Dependencies**
| Dependency | Purpose |
|------------|---------|
| `@supabase/supabase-js` | Supabase client (if used). |
| `@tanstack/react-query` | Data fetching & caching. |
| `shadcn/ui` | UI component library. |
| `@aws-sdk/client-bedrock` | AWS Bedrock client. |

---

