# Unveil – Wedding Communication & Memory Platform

Unveil is a modern, mobile-first app designed to help couples communicate effortlessly with their wedding guests, stay organized across their wedding weekend, and preserve shared memories for years to come. It's built for hosts and guests alike—with real-time messaging, media sharing, and a post-wedding time capsule experience.

This project is being developed as a clean, production-grade MVP and will be tested live at the creator's own wedding.

---

## ✨ Core Purpose

Unveil simplifies wedding communication and memory sharing—before, during, and after the event. Hosts can send updates, manage schedules, and collect media. Guests can stay informed, upload photos, and revisit memories over time.

---

## 🧱 Tech Stack

| Layer           | Tool/Framework        | Purpose                              |
|----------------|------------------------|--------------------------------------|
| Frontend       | Next.js (App Router)   | Core application framework           |
| Styling        | Tailwind CSS           | Utility-first responsive design      |
| UI Components  | shadcn/ui              | Reusable, modern component library   |
| Backend        | Supabase (PostgreSQL)  | DB, Auth, Storage, RLS               |
| Deployment     | Vercel                 | Hosting & CI/CD                      |
| IDE            | Cursor                 | AI-powered coding workflow           |
| Design         | Figma + Untitled UI    | Visual design system                 |
| Project Mgmt   | Notion                 | Roadmap, tasks, and logs             |

---

## 🧑‍🤝‍🧑 User Roles

- **Hosts**: Create and manage an event, invite guests, send segmented messages, and view uploaded media.
- **Guests**: Join a wedding, receive updates, view the schedule, upload photos/videos, and revisit shared memories.

---

## ✅ MVP Feature Set

| Feature                 | Description                                                   |
|------------------------|---------------------------------------------------------------|
| Guest List & Tagging   | Import, manage, and segment guests                            |
| Schedule & Itinerary   | Share a timeline of events with notifications                 |
| Messaging              | Send push/email messages to all or specific guest groups      |
| Media Upload & Gallery | Guests can upload + browse media by event/day                |
| Post-Wedding Capsule   | Send curated recaps or messages on anniversaries              |

---

## 🗂 Reference Folder

The `/reference` folder contains the system's architectural snapshot:

- `schema.sql` – Current Supabase schema (exported via CLI)
- `supabase.types.ts` – Generated TypeScript types from Supabase
- `session-log.md` – Daily build logs of what changed and why
- `decisions.md` – Structural/product decisions with rationale
- `questions.md` – Open questions for review or debugging

🔒 Status
This is an active MVP in development. Testing will be done live at an upcoming wedding. Feedback loops are tightly integrated with Notion and AI-based code auditing.

---

## 🧠 Architecture

- Each user may be a **Host** for one or more events, and a **Guest** for others.
- Core tables include: `users`, `events`, `guests`, `messages`, `media`
- Supabase RLS enforces role-based data access and event-specific permissions
- The app is modular, with clean separation of concerns across `/app`, `/components`, `/lib`, and `/types`

---

## 🛠 Setup Instructions (Local Dev)

```bash
git clone https://github.com/[your-username]/unveil-app
cd unveil-app

# Install dependencies
npm install

# Configure environment
cp .env.local.example .env.local
# Fill in Supabase credentials + Vercel URL

# Run the dev server
npm run dev
```

---

## 👋 About the Builder

This app is being built by a solo founder/product manager with strong PM fundamentals and AI-accelerated build workflows. It's designed to be easily handed off to a future CTO or dev partner—with clean architecture, typed schema, and clear documentation from the start.