# Taskify — Jira Clone

> A full-stack project management app built with Next.js, Hono.js, and Appwrite. Supports workspaces, projects, kanban boards, and team collaboration.

![Next.js](https://img.shields.io/badge/Next.js-%23000000.svg?style=for-the-badge&logo=next.js&logoColor=white)
![React](https://img.shields.io/badge/React-%2361DAFB.svg?style=for-the-badge&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-%233178C6.svg?style=for-the-badge&logo=typescript&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-%2306B6D4.svg?style=for-the-badge&logo=tailwindcss&logoColor=white)
![Hono](https://img.shields.io/badge/Hono.js-%23E36002.svg?style=for-the-badge&logo=hono&logoColor=white)
![Appwrite](https://img.shields.io/badge/Appwrite-%23FD366E.svg?style=for-the-badge&logo=appwrite&logoColor=white)
![Vercel](https://img.shields.io/badge/Vercel-%23000000.svg?style=for-the-badge&logo=vercel&logoColor=white)

[App GIF placeholder]

🔗 **[Live Demo](https://taskify-demo.vercel.app)**  ·  🐛 **[Report a Bug](../../issues)**

---

## Features

- **Workspaces** — Create isolated workspaces for different teams or clients, each with their own members and settings
- **Projects** — Organise work into projects within a workspace, with custom emoji icons
- **Task Management** — Create, assign, and prioritise tasks with due dates and status tracking
- **Kanban Board** — Drag-and-drop task cards across `Backlog`, `In Progress`, `In Review`, and `Done` columns
- **Table & Calendar Views** — Switch between kanban, a sortable data table, and a monthly calendar view
- **Member Roles** — Workspace-level `Admin` and `Member` roles with permission-gated actions
- **Invite System** — Generate and reset invite links to bring teammates into a workspace
- **Analytics Dashboard** — Per-project task counts, overdue tracking, and assigned-task metrics
- **Authentication** — Email/password sign-up and OAuth (GitHub & Google) via Appwrite

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS + shadcn/ui |
| API | Hono.js (on Next.js route handlers) |
| Database / Auth | Appwrite Cloud |
| Server State | Tanstack Query (React Query) |
| Drag & Drop | @hello-pangea/dnd |
| Validation | Zod |
| URL State | nuqs |
| Deployment | Vercel |

---

## Getting Started

### Prerequisites

- Node.js `v18+`
- An [Appwrite Cloud](https://appwrite.io) account (free tier works)

### Installation

```bash
# 1. Clone the repo
git clone https://github.com/yourusername/jira-clone.git
cd jira-clone

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env.local
```

Fill in `.env.local` (see [Configuration](#configuration) below), then:

```bash
# 4. Start the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Configuration

Create `.env.local` from `.env.example` and fill in the following:

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_APP_URL` | Your app's URL (`http://localhost:3000` locally) |
| `NEXT_PUBLIC_APPWRITE_ENDPOINT` | Appwrite API endpoint (`https://cloud.appwrite.io/v1`) |
| `NEXT_PUBLIC_APPWRITE_PROJECT` | Your Appwrite project ID |
| `NEXT_APPWRITE_KEY` | Appwrite API key (server-side only — never expose this) |
| `NEXT_PUBLIC_APPWRITE_DATABASE_ID` | Appwrite database ID |
| `NEXT_PUBLIC_APPWRITE_WORKSPACES_ID` | Workspaces collection ID |
| `NEXT_PUBLIC_APPWRITE_MEMBERS_ID` | Members collection ID |
| `NEXT_PUBLIC_APPWRITE_PROJECTS_ID` | Projects collection ID |
| `NEXT_PUBLIC_APPWRITE_TASKS_ID` | Tasks collection ID |
| `NEXT_PUBLIC_APPWRITE_IMAGES_BUCKET_ID` | Storage bucket ID for workspace images |

> **Appwrite setup:** Create a project, enable Email/Password and OAuth auth providers, create a database with the collections above, and create a storage bucket. Match the IDs exactly.

---

## Project Structure

```
├── src/
│   ├── app/                  # Next.js App Router pages & layouts
│   │   ├── (auth)/           # Sign-in / sign-up routes
│   │   ├── (dashboard)/      # Protected workspace routes
│   │   └── api/[[...route]]/ # Hono.js API catch-all
│   ├── components/           # Shared UI components (shadcn + custom)
│   ├── features/             # Feature-sliced modules
│   │   ├── auth/             # Auth hooks, forms, server actions
│   │   ├── workspaces/       # Workspace CRUD, members, invite links
│   │   ├── projects/         # Project CRUD
│   │   └── tasks/            # Tasks, kanban, table, calendar views
│   ├── hooks/                # Global utility hooks
│   └── lib/                  # Appwrite client/server setup, utils
├── public/
└── .env.example
```

---

## Roadmap

- [x] Real-time updates (Appwrite Realtime)
- [ ] Task comments and activity log
- [ ] File attachments on tasks
- [ ] Email notifications
- [ ] Dark mode

---

## Acknowledgements

Built by following the **[Build a Jira Clone With Nextjs, React, Tailwind, Hono.js (2024)](https://www.youtube.com/watch?v=...)** tutorial series by [Code With Antonio](https://www.youtube.com/@codewithantonio). All credit for the original design and architecture goes to Antonio Erdeljac.

---

## License

[MIT](./LICENSE)
