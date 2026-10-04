# 📚 Padhante - Book Recommendation Site & Community Library

A modern, responsive book recommendation and personal reading tracker website built with Next.js, React, Tailwind CSS, and Drizzle ORM.

## ✨ Features

- **📖 Interactive Book Discovery**: Browse extensive genre shelves, curated collections, and carousel views.
- **✨ 3D Coverflow Hero**: Interactive 3D coverflow carousel highlighting popular and classic literature.
- **🎯 Recommendations**: Contextual and genre-based book recommendations.
- **🔒 Authentication & Privacy**: Secure user authentication (Sign In / Sign Up) with private reading shelves.
- **📚 Personal Reading Shelves**: Track books you're reading, want to read, or have completed.
- **🔍 Fast Search**: Instant catalog search with responsive filtering.
- **🎨 Modern Design**: Sleek UI built with Tailwind CSS, Lucide icons, and Framer Motion transitions.

## 🛠️ Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) (App Router)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **UI & Styling**: [Tailwind CSS](https://tailwindcss.com/), [Lucide React](https://lucide.dev/), [Framer Motion](https://motion.dev/)
- **Database / ORM**: [PGlite](https://electric-sql.com/docs/reference/pglite) & [Drizzle ORM](https://orm.drizzle.team/)
- **Data Validation**: [Zod](https://zod.dev/)

## 🚀 Getting Started

### Prerequisites

Ensure you have [Node.js](https://nodejs.org/) (v18 or higher) installed.

### Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Run database migrations and seed data:
   ```bash
   npm run db:migrate
   npm run db:seed
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📜 Available Scripts

- `npm run dev`: Starts local Next.js dev server.
- `npm run build`: Compiles production build.
- `npm run start`: Runs production server.
- `npm run lint`: Runs ESLint checks.
- `npm run db:migrate`: Executes database migrations.
- `npm run db:seed`: Seeds local database with catalog books.
- `npm run db:ingest`: Ingests catalog records.

## 📄 License

This project is licensed under the MIT License.
