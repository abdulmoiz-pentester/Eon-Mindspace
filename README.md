
# Eon-Mindspace 🌌

**AI-Powered Secure Conversational Platform**

[![TypeScript](https://img.shields.io/badge/TypeScript-4.9+-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.2+-61DAFB.svg)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-5.0+-646CFF.svg)](https://vitejs.dev/)
[![AWS Bedrock](https://img.shields.io/badge/AWS%20Bedrock-Enabled-232F3E.svg)](https://aws.amazon.com/bedrock/)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

Eon-Mindspace is a cutting-edge AI-powered conversational platform designed for secure, enterprise-grade interactions. Built with TypeScript, React, and AWS Bedrock, it provides intelligent, context-aware responses while maintaining robust security through SAML authentication and comprehensive access controls.

## ✨ Features

✅ **AI-Powered Conversations** - Seamless integration with AWS Bedrock for advanced AI capabilities\
✅ **Enterprise-Grade Security** - SAML-based authentication with AWS SSO support\
✅ **Modern UI/UX** - Beautiful, responsive interface with shadcn/ui components\
✅ **Secure Chat History** - Persistent conversation storage with encryption\
✅ **Role-Based Access** - Fine-grained control over system access\
✅ **Multi-Environment Support** - Development, staging, and production configurations\
✅ **TypeScript First** - Full type safety throughout the application\
✅ **Customizable Themes** - Light/dark mode with medical-themed color schemes\
✅ **Comprehensive Analytics** - Built-in monitoring and logging capabilities\

## 🛠️ Tech Stack

### Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **UI Components**: shadcn/ui (Radix UI primitives)
- **State Management**: Pinia + TanStack Query
- **Styling**: Tailwind CSS with custom medical theme
- **Authentication**: JWT with SAML integration
- **AI Integration**: AWS Bedrock Agent Runtime

### Backend
- **Framework**: Express.js with TypeScript
- **Authentication**: Passport.js with SAML strategy
- **AWS Services**: Bedrock, STS, SSO
- **Session Management**: Express Session
- **Security**: JWT, CORS, CSRF protection

### DevOps & Tools
- **Package Manager**: npm
- **Linting**: ESLint with TypeScript plugin
- **Testing**: Jest (with mocking support)
- **Containerization**: Docker (optional)
- **CI/CD**: GitHub Actions (recommended)

## 📦 Installation

### Prerequisites

Before you begin, ensure you have the following installed:
- [Node.js](https://nodejs.org/) (v18 or higher)
- [npm](https://www.npmjs.com/) (comes with Node.js)
- [Git](https://git-scm.com/)
- AWS account with Bedrock access
- Keycloak or AWS SSO for authentication

### Quick Start

1. **Clone the repository:**
   ```bash
   git clone https://github.com/abdulmoiz-pentester/eon-mindspace.git
   cd eon-mindspace
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   ```bash
   # Create a copy of the example environment file
   cp backend/.env.example backend/.env

   # Edit the .env file with your configuration
   # See backend/README.md for detailed instructions
   ```

4. **Start the development servers:**
   ```bash
   # Start backend server
   cd backend && npm run dev

   # In another terminal, start frontend
   npm run dev
   ```

5. **Access the application:**
   Open [http://localhost:5173](http://localhost:5173) in your browser

## 🎯 Usage

### Basic Chat Interface

The application provides a secure chat interface with these key features:

```tsx
// Example of how to use the chat components
import { useState } from "react";
import { ChatArea } from "@/components/chat/ChatArea";
import { ChatSidebar } from "@/components/chat/ChatSidebar";

function AppChat() {
  const [messages, setMessages] = useState([
    { id: "1", role: "assistant", content: "Hello! How can I help you with security today?" }
  ]);

  const handleSend = (message: string) => {
    // Add user message
    setMessages(prev => [...prev, { id: Date.now().toString(), role: "user", content: message }]);

    // Simulate AI response
    setTimeout(() => {
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: "assistant",
        content: `I received your message: "${message}". Here's some security advice...`
      }]);
    }, 1000);
  };

  return (
    <div className="flex h-screen">
      <ChatSidebar
        chatHistory={[]}
        activeChatId={null}
        onSelectChat={() => {}}
        onNewChat={() => {}}
        onDeleteChat={() => {}}
        user={{ name: "Test User", email: "user@example.com" }}
        onSignOut={() => {}}
      />
      <div className="flex-1">
        <ChatArea
          messages={messages}
          isLoading={false}
          onSend={handleSend}
        />
      </div>
    </div>
  );
}
```

### AWS Bedrock Integration

The platform connects to AWS Bedrock for AI-powered responses:

```typescript
// Example of invoking the Bedrock agent
import { invokeAgent } from "@/lib/bedrock-api";

async function getSecurityAdvice(question: string) {
  try {
    const response = await invokeAgent({
      message: question,
      agentAliasId: "L3UQ4TMBQ8" // Production alias
    });

    console.log("AI Response:", response.answer);
    return response.answer;
  } catch (error) {
    console.error("Error getting response:", error);
    throw error;
  }
}

// Usage
getSecurityAdvice("What are our password policies?")
  .then(advice => console.log("Security advice:", advice))
  .catch(err => console.error("Failed to get advice:", err));
```

### SAML Authentication Flow

For production deployment, configure SAML with either Keycloak or AWS SSO:

```typescript
// Example SAML configuration in backend/.env
ENABLE_SAML=true
SAML_PROVIDER=aws-sso
AWS_SSO_ENTRY_POINT=https://your-aws-sso-url
AWS_SSO_ISSUER=your-issuer-identifier
AWS_SSO_CERTIFICATE=your-certificate-here
```

## 📁 Project Structure

```
eon-mindspace/
├── public/                  # Static assets
├── src/
│   ├── assets/              # Application assets
│   ├── components/          # Reusable UI components
│   │   ├── chat/            # Chat-specific components
│   │   ├── ui/              # shadcn/ui components
│   │   └── ...              # Other component groups
│   ├── hooks/               # Custom React hooks
│   ├── lib/                 # Utility functions and services
│   ├── pages/               # Page components
│   ├── styles/              # Global styles
│   └── types/               # TypeScript types and interfaces
├── backend/                 # Server-side code
│   ├── src/                 # Backend source
│   ├── config/              # Configuration files
│   ├── controllers/         # Route controllers
│   ├── middlewares/         # Express middleware
│   ├── routes/              # Route definitions
│   ├── services/            # Business logic services
│   └── utils/               # Utility functions
├── .gitignore
├── index.html               # Main HTML template
├── package.json
├── tsconfig.json            # TypeScript configuration
├── vite.config.ts           # Vite configuration
└── README.md                # Project documentation
```

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the `backend` directory with these required variables:

```
# Server Configuration
PORT=5000
FRONTEND_URL=http://localhost:5173
NODE_ENV=development
SESSION_SECRET=your-secure-secret
JWT_SECRET=your-jwt-secret

# SAML Configuration
ENABLE_SAML=true
SAML_PROVIDER=samling  # or aws-sso
SAML_ENTRY_POINT=https://your-saml-provider
SAML_ISSUER=your-app-issuer
SAML_CALLBACK_URL=http://localhost:5000/auth/saml/callback

# AWS Bedrock Configuration
BEDROCK_AGENT_ARN=arn:aws:bedrock:region:account-id:agent/your-agent-id
```

### Customization Options

1. **Theming**: Modify `src/index.css` to change color schemes
2. **Components**: Extend or override shadcn/ui components in `src/components/ui/`
3. **AI Models**: Change the Bedrock agent ARN in environment variables
4. **Authentication**: Configure different SAML providers in `backend/src/config/passport.ts`

## 🤝 Contributing

We welcome contributions from the community! Here's how you can help:

### Development Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/abdulmoiz-pentester/eon-mindspace.git
   cd eon-mindspace
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up AWS credentials:**
   ```bash
   aws configure
   ```

4. **Start development:**
   ```bash
   # In one terminal
   cd backend && npm run dev

   # In another terminal
   npm run dev
   ```

### Code Style Guidelines

1. **TypeScript**: Use strict type checking
2. **Formatting**: Follow Tailwind CSS naming conventions
3. **Commit Messages**: Use conventional commit format
4. **Documentation**: Add JSDoc comments for all public APIs

### Pull Request Process

1. Fork the project
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Authors & Contributors

**Maintainers:**
- [Abdul Moiz](https://github.com/abdulmoiz-pentester) - Initial work
- [Wajahat Ali Abid](https://github.com/WajahatAliAbid) - Additional features

**Special Thanks:**
- AWS Bedrock team for the powerful AI services
- shadcn/ui for the beautiful component library
- TypeScript team for excellent type safety

## 🐛 Issues & Support

### Reporting Issues

If you encounter problems, please:
1. Check the [GitHub Issues](https://github.com/abdulmoiz-pentester/eon-mindspace/issues) for existing reports
2. Create a new issue with:
   - Clear description of the problem
   - Steps to reproduce
   - Expected behavior
   - Screenshots or error logs

### Getting Help

For questions or support:
- Open an issue on GitHub

## 🗺️ Roadmap

### Planned Features

✅ **Version 1.0** - Core functionality complete
🚧 **Version 1.1** (Next Release)
- Enhanced analytics dashboard
- Multi-language support
- Advanced role permissions
- Mobile app integration

🔮 **Future Improvements**
- Voice interface support
- Plugin architecture for custom AI models
- Advanced audit logging
- Integration with other AWS services

### Known Issues

- [#12] SAML configuration can be complex for first-time users
- [#23] Mobile responsiveness needs additional testing
- [#35] Some Bedrock agent configurations require AWS permissions

## 🚀 Deployment

### Production Deployment

1. **Backend Deployment:**
   ```bash
   # Build the backend
   cd backend
   npm run build

   # Deploy to your preferred hosting (AWS, Heroku, etc.)
   ```

2. **Frontend Deployment:**
   ```bash
   # Build the frontend
   npm run build

   # Deploy to your preferred hosting (Vercel, Netlify, etc.)
   ```

3. **Environment Configuration:**
   - Set `NODE_ENV=production`
   - Configure proper SSL certificates
   - Set up monitoring and logging

### Docker Deployment (Optional)

For containerized deployment:

```dockerfile
# Dockerfile for backend
FROM node:18-alpine

WORKDIR /app
COPY backend/package*.json ./
RUN npm install --production
COPY backend .
EXPOSE 5000
CMD ["npm", "start"]
```

## 🎉 Getting Started Guide

1. **First Time Setup:**
   ```bash
   # Clone and install
   git clone https://github.com/yourusername/eon-mindspace.git
   cd eon-mindspace
   npm install

   # Set up AWS credentials
   aws configure

   # Start development servers
   cd backend && npm run dev
   npm run dev
   ```

2. **First Chat Session:**
   - Access the application at [http://localhost:5173](http://localhost:5173)
   - Complete the SAML authentication flow
   - Start a new conversation with your security questions

3. **Customization:**
   - Modify `src/index.css` for theming
   - Extend components in `src/components/`
   - Update environment variables for different configurations

## 📚 Resources

- [AWS Bedrock Documentation](https://docs.aws.amazon.com/bedrock/latest/userguide/what-is-bedrock.html)
- [shadcn/ui Documentation](https://ui.shadcn.com/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/tsconfig-json.html)
- [React Router Documentation](https://reactrouter.com/en/main)

## 📢 Community

Join our community to stay updated and participate:

- [GitHub Discussions](https://github.com/yourusername/eon-mindspace/discussions)
- [Twitter](https://twitter.com/eonhealth)
- [LinkedIn](https://linkedin.com/company/eonhealth)

## 🤝 Sponsors

Support the development of Eon-Mindspace:

[![GitHub Sponsors](https://img.shields.io/badge/sponsor-30363D?style=for-the-badge&logo=GitHub-Sponsors&logoColor=#EA4AAA)](https://github.com/sponsors/yourusername)

## 📋 Contribution Checklist

Before submitting a pull request, please verify:

- [ ] Code follows TypeScript type safety
- [ ] All new functionality is properly tested
- [ ] Documentation is updated
- [ ] Commit messages follow conventional format
- [ ] Changes are compatible with existing codebase
- [ ] All dependencies are properly declared

Thank you for your interest in Eon-Mindspace! We're excited to see what you'll build with this powerful platform.
```
