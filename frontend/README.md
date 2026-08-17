# Structurify Frontend

This is the Next.js 14 frontend application for **Structurify**. It provides a sleek, modern, glassmorphic UI for users to upload unstructured datasets and define strict target schemas.

## Tech Stack
- **Framework:** Next.js 14 (App Router)
- **Styling:** TailwindCSS
- **State & Real-time:** Firebase Client SDK (Firestore `onSnapshot`)
- **Authentication:** Firebase Auth (Google OAuth, SAML, OIDC)
- **Typography:** Space Grotesk (Sans) and JetBrains Mono (Monospace)
- **Icons:** Lucide React

## Local Development

Ensure you have Node.js >= 20 installed.

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Copy the environment variables:
   ```bash
   cp .env.example .env.local
   ```
   *Note: Populate `.env.local` with your Firebase project credentials and set `NEXT_PUBLIC_BACKEND_URL=http://localhost:8000` to point to the local FastAPI Gateway.*

3. Install dependencies:
   ```bash
   npm install
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) with your browser.

## Testing
We use Jest and React Testing Library to ensure UI components and hooks behave correctly.
```bash
npm run test
```

## Deployment
The frontend is statically exported and deployed to **Firebase Hosting** globally.

```bash
# In the root of the project
./deploy.sh <PROJECT_ID> <REGION> frontend
```
*Note: We do not deploy to Vercel. Our pipeline leverages Firebase Hosting to keep the architecture entirely within Google Cloud.*
