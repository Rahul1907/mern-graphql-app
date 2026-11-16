# MERN GraphQL Real-Time Platform

🔗 **Live Application URL:** [https://mern-graphql-app.vercel.app/](https://mern-graphql-app.vercel.app/)

A fully featured, highly performant MERN stack blogging and social platform utilizing **GraphQL** for data transport, **WebSockets** for real-time subscriptions, and a premium **glassmorphic dark-mode React interface** with infinite scrolling.

---

## 🚀 Key Features

* **Real-Time Subscriptions:** New posts and comments instantly broadcast to all active sessions via WebSockets (`graphql-ws` protocol) without page refreshing or polling.
* **Cursor-Based Infinite Scroll:** High-performance feed pagination using MongoDB `_id` cursors. An `IntersectionObserver` handles fetching more posts automatically as you scroll down.
* **Stable Commenting & Threaded Replies:** Nested comment trees support deep-threaded discussions. Posting replies or comments uses optimized single-post GraphQL queries so the paginated feed scroll position never resets.
* **JWT Authentication:** Fully secure registration, sign-in, and session persistence. Authed links attach credentials for both HTTP and WebSocket handshakes.
* **TypeScript End-to-End:** Complete type safety on both backend schemas/resolvers and frontend components/queries.

---

## 🛠️ Technology Stack

### Backend
* **Core:** Node.js, Express, TypeScript (Node16 module resolution)
* **GraphQL Engine:** Apollo Server v3 (`apollo-server-express`)
* **Real-Time Communication:** `ws`, `graphql-ws` protocols, and `graphql-subscriptions` for local PubSub events
* **Database & ODM:** MongoDB, Mongoose
* **Security:** JSON Web Tokens (JWT) for authentication, BCrypt for password hashing

### Frontend
* **Core:** React 18, TypeScript, Create React App (`react-scripts` v5)
* **GraphQL Client:** Apollo Client (`@apollo/client`) configured with split transport links (HTTP for queries/mutations, WebSockets for subscriptions)
* **State & Cache Management:** Apollo `InMemoryCache` with custom merge and read field policies to manage paginated cursors and deduplication
* **Infinite Scrolling:** Web Browser `IntersectionObserver` API
* **Design & Styling:** Custom vanilla CSS styling featuring glassmorphism, responsive grids, sleek gradients, and custom typography (Outfit font)

---

## 📂 Project Structure

```
mern-graphql-app/
├── backend/
│   ├── config/              # Database connection
│   ├── graphql/             # GraphQL schemas (typeDefs) and resolvers
│   ├── models/              # Mongoose database models (User, Post, Comment)
│   ├── server.ts            # Entry point wrapping Express in http/ws servers
│   └── tsconfig.json        # TypeScript server configuration
└── frontend/
    ├── public/              # Static HTML shell
    ├── src/
    │   ├── components/      # UI components (PostList, CommentSection, UserProfile, etc.)
    │   ├── graphql/         # GraphQL queries, mutations, and subscriptions
    │   ├── apollo.ts        # Apollo Client Link splitting and cache policies configuration
    │   ├── types.ts         # Shared TypeScript interfaces & globals declarations
    │   └── index.tsx        # React mounting entry point
    └── package.json         # React dependencies
```

---

## 🔄 Workflow

### Development Workflow

The application follows a decoupled client-server architecture. The backend exposes a single GraphQL endpoint (`/graphql`) that serves both queries/mutations over HTTP and subscriptions over WebSockets. The frontend uses Apollo Client with a split link to route operations to the correct transport.

#### 1. Backend Request Lifecycle

```
Client Request
     │
     ▼
┌─────────────────┐
│  Express + CORS │  [backend/server.ts:23]
└─────────────────┘
     │
     ▼
┌─────────────────┐
│  JWT Auth Middle│  Extracts Bearer token, verifies,
│  (context)      │  attaches `user` to GraphQL context   [server.ts:70-82]
└─────────────────┘
     │
     ▼
┌─────────────────┐
│  Apollo Server  │  Executes GraphQL operation against   [server.ts:56-83]
│  (typeDefs +    │  the executable schema                [graphql/typeDefs.ts]
│   resolvers)    │                                       [graphql/resolvers.ts]
└─────────────────┘
     │
     ▼
┌─────────────────┐
│  DataLoaders    │  Batches & caches DB lookups for      [graphql/loaders.ts]
│                 │  users, posts, comments (N+1 fix)     [resolvers.ts:66-93]
└─────────────────┘
     │
     ▼
┌─────────────────┐
│  Mongoose Models│  MongoDB queries (User, Post, Comment) [models/]
└─────────────────┘
     │
     ▼
   Response (JSON)
```

#### 2. Real-Time Subscription Workflow

Subscriptions use the `graphql-ws` protocol over a dedicated WebSocket server sharing the same HTTP port:

```
1. Client establishes WS connection to ws://localhost:5000/graphql
   └─ Sends connectionParams { authorization: "Bearer <token>" }  [apollo.ts:24-34]

2. Backend verifies JWT from connectionParams and builds WS context [server.ts:38-51]

3. Client subscribes to:
   - postAdded          → global pubsub channel "POST_ADDED"
   - commentAdded(postId) → channel "COMMENT_ADDED_<postId>"      [resolvers.ts:96-105]

4. When a mutation runs (addPost / addComment):
   └─ Resolver calls pubsub.publish(...)                          [resolvers.ts:107+]
   └─ All subscribed clients receive the new entity instantly

5. Apollo Client cache updates via InMemoryCache merge policies   [apollo.ts:50-80]
```

#### 3. Authentication Flow

```
Registration / Login
     │
     ▼
Mutation: register / login  [typeDefs.ts:59-60]
     │
     ▼
Resolver validates credentials, issues JWT signed with JWT_SECRET [resolvers.ts:107+]
     │
     ▼
Returns { token, user } → Client stores token in localStorage
     │
     ▼
Subsequent requests:
  - HTTP:  Authorization header attached via authLink        [apollo.ts:14-22]
  - WS:    connectionParams.authorization on handshake       [apollo.ts:27-33]
     │
     ▼
Backend verifies token on every HTTP request and WS connection [server.ts:38-82]
```

#### 4. Cursor-Based Infinite Scroll Workflow

```
1. User scrolls to bottom of feed
   └─ IntersectionObserver triggers load more

2. Client queries `posts(limit: 5, cursor: <lastPostId>)`  [typeDefs.ts:43]
   └─ First load: cursor is null → returns newest posts

3. Backend:
   └─ If cursor provided, filters `_id: { $lt: cursor }`   [resolvers.ts:35-37]
   └─ Sorts by _id descending, fetches limit + 1 docs      [resolvers.ts:40-42]
   └─ Returns posts, nextCursor, hasMore                   [resolvers.ts:48-52]

4. Apollo InMemoryCache merges new posts into existing list [apollo.ts:56-75]
   └─ Deduplicates by __ref, preserves scroll position

5. Comment actions use single-post queries so feed state   [typeDefs.ts:44]
   └─ is never invalidated or reset                          [resolvers.ts:55-57]
```

#### 5. Comment Threading Workflow

```
1. User opens a post → Query `post(id: ...)` fetches full post + comments [typeDefs.ts:44]

2. Nested comments resolved via DataLoaders:
   - post.comments        → postCommentsLoader  [resolvers.ts:75-77]
   - comment.replies      → commentRepliesLoader [resolvers.ts:91-93]
   - comment.parentComment → Comment.findById   [resolvers.ts:87-90]

3. User adds reply:
   Mutation: addComment(postId, content, parentCommentId)  [typeDefs.ts:58]
   └─ Publishes to "COMMENT_ADDED_<postId>" subscription channel
   └─ Subscribed clients receive the new comment in real time
```

---

## ⚙️ Setup & Installation

### 1. Prerequisites
Ensure you have **Node.js** (v18+) and **pnpm** (or `npm`/`yarn`) installed, and a running **MongoDB** database instance.

### 2. Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   pnpm install
   ```
3. Create a `.env` file in the `backend/` directory:
   ```env
   PORT=5000
   MONGO_URI=mongodb://localhost:27017/mern-graphql-app
   JWT_SECRET=your_jwt_secret_key
   ```
4. Run the backend development server:
   ```bash
   pnpm dev
   ```
   *The backend will be running at `http://localhost:5000` with the GraphQL playground mounted at `/graphql`.*

### 3. Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd ../frontend
   ```
2. Install dependencies:
   ```bash
   pnpm install
   ```
3. Create a `.env` file in the `frontend/` directory:
   ```env
   REACT_APP_BACKEND_SERVER_URL=http://localhost:5000/graphql
   ```
4. Run the React development server:
   ```bash
   pnpm start
   ```
   *The frontend will boot up and be accessible in your browser at `http://localhost:3000`.*

### 4. Running Both Together (Recommended)
From the repository root, you can run both in parallel using two terminals:

**Terminal 1 — Backend:**
```bash
cd backend && pnpm dev
```

**Terminal 2 — Frontend:**
```bash
cd frontend && pnpm start
```

Then open `http://localhost:3000` in your browser. The GraphQL playground is available at `http://localhost:5000/graphql`.