# Taskaro — Personal Task Management Web Application

- **Live Application URL:** [https://taskaro-8dd33.web.app](https://taskaro-8dd33.web.app) *(Replace with your live Vercel / Firebase Hosting URL)*
- **Source Code Repository:** *(Your GitHub repository link)*

Taskaro is a lightweight, high-responsiveness personal task management web application built with **Next.js (App Router)**, **Tailwind CSS**, **React Bits** (`Antigravity` 3D particle ring & `SlingButton` launcher), and **Firebase (Google Authentication + Cloud Firestore)**. Designed with a sleek monochrome **Black & White** Dark/Light theme, it focuses on zero-friction task tracking, strict per-user data isolation, and instant optimistic status transitions.

---

## 1. How to Access and Use the Application

1. **Sign In (Google Authentication):**
   - Open the application URL in your browser.
   - Move your cursor across the login screen to interact with the **React Bits `Antigravity`** 3D particle ring background.
   - Toggle between **Dark Mode (Black)** and **Light Mode (White)** at any time using the theme button in the top-right corner.
   - Click **"Sign in with Google"** and select your Google account in the pop-up window.
2. **Create a Task (with `SlingButton`):**
   - Type a task title (up to 100 characters) into the **"Create a New Task"** input field at the top of the dashboard.
   - Either **tap** the **React Bits `SlingButton`**, **pull and release** the slingshot pad to launch the task with a particle burst, or press `Enter`. Every new task starts in the `Planned` state.
3. **View & Filter Tasks:**
   - View all your tasks in real time via Cloud Firestore `onSnapshot` listeners, or filter by **All**, **Planned**, **In Progress**, or **Complete**.
4. **Update Task Status (One-Click Optimistic UI):**
   - On any task card, click `Planned`, `In Progress`, or `Complete` in the inline status pill group. The UI updates immediately without opening an edit modal.
5. **Switch Accounts / Sign Out:**
   - Click **"Logout"** in the top-right header. Because Google OAuth is configured with `prompt: "select_account"`, signing in again prompts you to choose another Google account so evaluators can verify strict per-user data isolation.

---

## 2. Important Assumptions Made (Handling Ambiguity)

Where the prompt left implementation details open, the following product and engineering decisions were made to guarantee reliability, security, and a clean user experience:

- **Strict Per-User Data Isolation:** Tasks are strictly scoped to the authenticated user's Firebase `uid` (`userId == request.auth.uid`) both in client-side Firestore queries (`src/components/Dashboard.jsx`) and in server-side **Firestore Security Rules** (`firestore.rules`). Logging in with a second Google account shows only that second account's tasks.
- **Default Initial Status:** Newly created tasks default to `Planned` so users can capture tasks rapidly with a single input field.
- **Input Sanitization & Validation Limits:**
  - Leading and trailing whitespace is trimmed before submission; whitespace-only inputs (`"   "`) are blocked with a warning toast.
  - Task titles are capped at **100 characters** (with a live character counter) to prevent layout overflow and oversized Firestore documents.
- **Inline Optimistic Status Updates:** Changing a task's status updates the local React state (`optimisticStatusMap`) immediately before Firestore confirms the write. If a network or permission error occurs, the UI automatically rolls back to the previous status and displays an error toast.
- **Accessible Slingshot Submission (`tapSends` + `Enter`):** While the `SlingButton` supports an interactive pull-and-release physics launch (`armAt={48}`, `maxPull={160}`), `tapSends` and standard keyboard `Enter` submission are enabled so users can also create tasks with a single click or keystroke.
- **Persistent Dark & Light Theme:** Theme preference (`dark` / `light`) is persisted in `localStorage` (`taskaro-theme`) and synchronized across both the Login screen and the Dashboard.
- **Zero-Index-Friction Sorting:** Tasks are filtered by `userId` in Firestore and sorted chronologically on the client so evaluators never encounter missing composite index errors.

---

## 3. Known Limitations & Warnings

- **Browser Pop-ups Required for Google Sign-In:** Authentication uses Firebase `signInWithPopup`. If your browser blocks pop-ups, allow pop-ups for the domain and retry.
- **Permanent Task Deletion:** Deleting a task via the trash icon permanently removes the document from Cloud Firestore with no undo or trash bin.
- **Intentionally Focused Scope:** To keep the workflow fast and distraction-free, multi-user team collaboration, comments, and subtasks are intentionally excluded.

---

## 4. Local Setup & Deployment Instructions

### Prerequisites
- Node.js `v18.17+`
- A Firebase project with **Google Authentication** and **Cloud Firestore** enabled.

### Local Installation
```bash
git clone <your-repo-url>
cd Taskaro
npm install
```

### Environment Variables
Copy `.env.example` to `.env.local` in the project root and populate your Firebase project credentials:
```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

### Firestore Security Rules
Copy the contents of `firestore.rules` into **Firebase Console → Firestore Database → Rules** and click **Publish**:
```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    match /tasks/{taskId} {
      allow create, update: if request.auth != null && request.auth.uid == request.resource.data.userId;
      allow read, delete: if request.auth != null && request.auth.uid == resource.data.userId;
    }
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

### Configuring Google OAuth Authorized Domains (Crucial for Production)
When deploying to Vercel or Netlify, add your production domain in two places so Google Sign-In works outside `localhost`:
1. **Firebase Console:** Go to **Authentication → Settings → Authorized domains** and add your deployment domain (e.g., `your-app.vercel.app`).
2. **Google Cloud Console:** Go to **APIs & Services → Credentials → OAuth 2.0 Client IDs**, and add your production URL to **Authorized JavaScript origins** and **Authorized redirect URIs**.

### Running Locally
```bash
npm run dev
```
Open `http://localhost:3000` in your browser.

---

## 5. AI Usage Summary

### 1. Which AI Tools Were Used
- **Google Antigravity IDE (Gemini Coding Assistant):** Used for Next.js App Router project scaffolding, React component composition, Tailwind CSS monochrome theme refinement, and documentation structuring.
- **React Bits (`reactbits.dev`):** Used as the design reference for the interactive 3D `Antigravity` particle ring background on the Login screen and the physics-based `SlingButton` task launcher on the Dashboard.

### 2. How They Were Used
- **Component Scaffolding & UI Polish:** Generated the initial Next.js App Router layout, skeleton loading states, empty-state cards, and responsive header controls.
- **Interactive Visual Components:** Integrated the Three.js / `@react-three/fiber` instanced-mesh `Antigravity` particle system on the Login screen and the SVG elastic `SlingButton` launcher on the Task creation form.
- **Edge-Case Brainstorming:** Used AI to review potential edge cases (whitespace-only task titles, 100-character overflow, blocked OAuth pop-ups, and optimistic status rollbacks).

### 3. Example Prompts Used
- *"Act as a Principal Frontend Engineer and Lead Product Designer. Build a lightweight, highly polished Task Management Web Application using Next.js (App Router), Tailwind CSS, Firebase Google Authentication, and Firestore with strict per-user UID isolation, 100-character input validation, skeleton loaders, and one-click optimistic status updates (`Planned`, `In Progress`, `Complete`)."*
- *"Integrate the React Bits `Antigravity` 3D particle ring background exclusively on the Login screen and the `SlingButton` physics button for creating tasks on the Dashboard."*
- *"Replace the bluish slate dark theme with a pure monochrome Black & White theme and add a persistent Dark/Light mode toggle across the Login and Dashboard screens."*

### 4. What AI-Generated Code Was Modified or Corrected Manually
- **Firestore Security Rules (`resource.data` vs `request.resource.data`):**
  - *Issue:* A naive single-line security rule (`allow create, read, update, delete: if request.auth.uid == request.resource.data.userId`) fails on `read` and `delete` requests because `request.resource` is `null` when reading or deleting existing documents.
  - *Manual Correction:* Split the rule in `firestore.rules` so `create` and `update` validate `request.resource.data.userId`, while `read` and `delete` validate `resource.data.userId`. Also ensured `updateDoc` in `Dashboard.jsx` includes `userId: user.uid`.
- **Single-Field Query + Client-Side Chronological Sorting:**
  - *Issue:* Combining `where("userId", "==", user.uid)` with `orderBy("createdAt", "desc")` in Firestore throws a runtime error until a composite index is manually built in the Firebase Console.
  - *Manual Correction:* Filtered by `userId` in the Firestore query and performed chronological sorting in memory (`loaded.sort(...)`) using `createdAt.toMillis()` with a `clientCreatedAt` fallback so newly created tasks sort accurately even before the server timestamp resolves.
- **Multi-Account Testing (`prompt: "select_account"`):**
  - *Manual Addition:* Configured `googleProvider.setCustomParameters({ prompt: "select_account" })` in `src/lib/firebase.js` so signing out and clicking "Sign in with Google" always displays the Google account chooser rather than silently re-authenticating the previous user.
