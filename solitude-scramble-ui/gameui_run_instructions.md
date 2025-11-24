# How to Run the Solitude Scramble React App

This guide explains how to set up the environment to run the provided React code locally using **Vite**, **Tailwind CSS**, and **Lucide React**.

## Prerequisites
* **Node.js** (Version 21+ needs to be installed) installed on your machine.

```bash
sudo apt install nodejs npm -y
```
* Select `no` to `use rolldown vite`

## Quick Start Guide

### 1. Create a New Project
Open your terminal and run the following commands to scaffold a new React project:

```bash
npm create vite@latest solitude-scramble -- --template react
cd solitude-scramble
npm install
```

### 2. Install & Configure Tailwind CSS

The app uses Tailwind classes (e.g., `bg-slate-50`, `text-indigo-600`) for styling.

**A. Install dependencies:**

```bash
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

**B. Configure** `tailwind.config.js:` Open the `tailwind.config.js` file in your project root and replace the content array to match the following:

```JavaScript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

**C. Add Tailwind directives to CSS:** Open src/index.css. Delete the existing content and add these three lines at the top:

```CSS
@tailwind base;
@tailwind components;
@tailwind utilities;
```

**3. Install Icon Library**
The app imports icons from lucide-react. Run:

```bash
npm install lucide-react
```

**4. Add the Application Code**
- Open `src/App.jsx` in your code editor.
- Delete all existing code in that file.
- Paste the provided React code (Solitude Scramble) into the file.

**5. Run the Application**
Start the local development server:

```bash
npm run dev
```

Check your terminal for the local URL (usually `http://localhost:5173`) and open it in your browser.

