# Sky Snap Essence

A modern image gallery app built with Next.js (React), Supabase, Tailwind CSS, and Framer Motion.

---

## 🚀 Features
- Upload images securely with per-user cloud storage
- Add optional AI-powered tags (if API integration enabled)
- Simple, private per-user galleries
- 500MB storage quota per user, with progress bar and usage tracking
- Beautiful UI with TailwindCSS and Framer Motion

---

## 🖼️ Storage Quota Tracking
- The upload page displays each user's total MB used (out of 500MB)
- Uploads are blocked if they would exceed the quota
- Quota is calculated automatically from your Supabase storage bucket

---

## 🏗️ Getting Started (Local Development)

```
git clone <YOUR_GIT_REPO_URL>
cd sky-snap-essence
npm install
npm run dev
```
- Visit [http://localhost:5173](http://localhost:5173) (Vite default) or your project's dev URL.

---

## 🔗 How it Works
- Images are uploaded and stored in Supabase Storage, organized by user
- Metadata (friend name, birthday, optional tags) is saved with each image
- Image gallery page displays all uploaded images, sorted by upload date
- Quota bar and stats automatically update after each upload

---

## 🗄️ Supabase Schema Requirements
- `images` table (for storing metadata about uploaded images)
- Supabase Storage bucket (e.g., `user-images`) with appropriate RLS policies (per user)

---

## 🛠️ Technologies Used
- Vite + React
- Supabase (Storage + SQL Database)
- Tailwind CSS
- Framer Motion (UI Animations)

---

## 📦 Deployment
- Deploy easily to Vercel, Netlify, or any provider that supports Vite/React
- Set up and link your own Supabase project and storage bucket

---

## ✨ License
Open source project — use, remix, or deploy for your own cloud-photo gallery!
