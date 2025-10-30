# Sky Snap Essence

A Next.js + Supabase image storage and gallery app, now with Face-Based Albums powered by face-api.js!

---

## 🚀 Features
- Upload images with client-side face detection
- Automatically group images by similar faces ("Face Albums", e.g., Me, Family, Friends)
- Realtime, privacy-first galleries
- AI-powered tags
- Sleek UI with TailwindCSS and Framer Motion

---
## 🖼️ Face-Based Albums

### How it works:
- When you upload a photo, faces are detected in the browser using [face-api.js](https://justadudewhohacks.github.io/face-api.js/).
- Each detected face is converted into an embedding (descriptor), which is sent to Supabase along with your image.
- Images are automatically grouped: if a face matches a previous cluster (similarity >= 0.8), it's added to that "album".
- A new page `/albums` displays all your grouped albums with live counts, preview faces, and smooth transitions.

### To Enable Face Detection:
- **face-api.js models folder:** Already present under `public/models/` – if missing, download from [here](https://github.com/justadudewhohacks/face-api.js-models) and place all folders under `public/models/`.
- No server-side compute needed – all runs efficiently in the browser!

### Database Requirements
You MUST have the following columns on Supabase:
```sql
ALTER TABLE public.images
  ADD COLUMN IF NOT EXISTS face_embeddings JSONB,
  ADD COLUMN IF NOT EXISTS main_face_cluster_id UUID;

ALTER TABLE public.image_metadata
  ADD COLUMN IF NOT EXISTS face_embeddings JSONB,
  ADD COLUMN IF NOT EXISTS face_cluster_ids JSONB;
```
- See `/supabase/migrations/` for reference migrations.

---
## 🏗️ Local Development

```
npm install
npm run dev
```

---
## 🔗 Album/Cluster Logic
- See `src/lib/faceDetection.ts` for detection/embedding utilities
- See `src/lib/faceClustering.ts` for clustering/group assignment code
- Page at `/albums` is implemented in `src/pages/Albums.tsx`

---
## ✨ Future Improvements
- Allow user to rename/merge albums
- Cache face embeddings locally
- Smoother transitions and advanced album management
---

## Technologies Used
- Vite
- React (Next.js-like filesystem routing)
- Supabase
- Tailwind CSS
- face-api.js (face detection in browser)
- Framer Motion (UI animations)
