# 💬 Chat App

A real-time chat application built with React, TypeScript, and Firebase.

## 🚀 Features

- Real-time messaging with Firebase Firestore
- File & image sharing via Firebase Storage
- User authentication
- Responsive UI

## 🛠️ Tech Stack

- **Frontend:** React, TypeScript, Vite
- **Backend:** Firebase (Firestore, Storage, Auth)
- **Styling:** CSS

## ⚙️ Setup & Installation

### Prerequisites
- Node.js
- Firebase project

### Steps

1. Clone the repository
```bash
   git clone https://github.com/mdaktarujjaman/Chat_App.git
   cd Chat_App
```

2. Install dependencies
```bash
   npm install
```

3. Create `.env.local` file from example
```bash
   cp .env.example .env.local
```

4. Add your Firebase credentials in `.env.local`
```env
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_AUTH_DOMAIN=your_project.firebaseapp.com
   VITE_PROJECT_ID=your_project_id
   VITE_STORAGE_BUCKET=your_project.appspot.com
   VITE_MESSAGING_SENDER_ID=your_sender_id
   VITE_APP_ID=your_app_id
```

5. Run the app
```bash
   npm run dev
```

## 📁 Project Structure

src/

├── components/     # UI components

├── utils/          # Helper functions

├── firebase.ts     # Firebase configuration

├── App.tsx         # Root component

└── main.tsx        # Entry point

## 🔐 Environment Variables

All Firebase credentials are stored in `.env.local` (not committed to git).
See `.env.example` for required variables.

## 📄 License

MIT
