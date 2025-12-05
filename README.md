# 🚀 AI Auto-Poster SaaS

A professional, multi-platform social media management tool designed to automate publishing to **Facebook, Instagram, Twitter (X), and TikTok**. It features AI-powered content generation using Google Gemini.

## ✨ Features

- **Multi-Platform Support:** Publish to Facebook, Instagram, Twitter, and TikTok simultaneously.
- **AI Content Generator:** Integrated with Google Gemini AI to write engaging posts in Arabic and English.
- **Media Support:** Upload Images and Videos (with automatic format handling).
- **Scheduling:** Schedule posts for later (backed by SQLite/Supabase).
- **Management:** Edit and Delete posts directly from the dashboard.
- **Smart UI:** Dark Mode, Multi-language support (AR/EN), and Live Preview.

## 🛠️ Tech Stack

- **Frontend:** React, Tailwind CSS, Lucide Icons.
- **Backend:** Node.js, Express.
- **Database/Storage:** Supabase & SQLite.
- **APIs:** Facebook Graph API, Twitter API v2, TikTok Open API, Google Gemini AI.

## 🚀 How to Run

1.  **Install Dependencies:**
    ```bash
    npm install
    ```

2.  **Configure Keys:**
    - Open `server.js` and `constants.ts`.
    - Add your API Keys for Facebook, Twitter, and Gemini.
    - For TikTok, run `npm run tiktok-auth` to generate a token.

3.  **Start the Server:**
    ```bash
    npm start
    ```

4.  **Launch Frontend:**
    Open `index.html` (or serve via your preferred React build tool).

## 📝 License

This project is licensed under the ISC License.
