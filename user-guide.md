# English Card Memory Program - User Guide

This guide will help you use the English Card Memory Program to improve your vocabulary.

## Getting Started

1.  **Prerequisites:** Make sure you have a modern web browser like Chrome, Firefox, or Safari.
2.  **Running the application:** The application now has two parts: a frontend and a backend. Both must be running. See the "For Developers" section for instructions.
3.  **Accessing the application:** Open your web browser and navigate to the URL for the frontend (usually `http://localhost:3000`).

1.  **Select Data File:** Use the dropdown menu at the top to choose between different word lists:
    *   `Should-memory.csv`: The primary English word list.
    *   `Should-memory-V2.csv`: An updated version of the English word list.
    *   `Should-memory-spanish.csv`: A Spanish-English word list.
2.  **Flashcard Interaction:**
    *   The front of the card shows a word or phrase.
    *   Click **"Show Answer"** to see the translation.
    *   Click **"Next Word"** to get a new random word from the selected list.
3.  **Find Usage:**
    *   After revealing the answer, click **"Find Usage"** to see an example sentence or definition (Note: currently optimized for English words).
4.  **Switch Mode:**
    *   Use the **"Switch to..."** button to toggle between learning directions (e.g., English to Korean or Korean to English).

### CSV Data Format

The application expects CSV files in the `public/` folder with the following headers:
- `내가 모은 영어 문장`: The word or phrase to be tested (Front of card).
- `한글 뜻`: The translation or meaning (Back of card).
- `메모`: Additional notes or context.

## For Developers

The application now consists of two parts:
1.  **Frontend:** The React user interface.
2.  **Backend:** A local Node.js server that fetches usage examples from the web.

Both must be running simultaneously for the "Find Usage" feature to work.

### Running the Full Application (Frontend + Backend)

You will need two separate terminals.

**Terminal 1: Start the Backend**
1. Navigate to the `server` directory: `cd server`
2. Install dependencies (only required the first time): `npm install`
3. Start the server: `npm start`
4. The server will be running on `http://localhost:3001`. Keep this terminal open.

**Terminal 2: Start the Frontend**
1. In a new terminal, navigate to the project's root `english-card-memory` directory.
2. Start the React application: `npm start`
3. The application will automatically open in your default web browser at `http://localhost:3000`.


Here are the changes I made:
   1. Frontend Update: I modified src/App.tsx to communicate with /api/usage instead of http://localhost:3001.
   2. Backend Integration: I created a new file english-card-memory/api/usage.js containing your server logic. This allows Vercel to run your backend
      as a "Serverless Function" automatically, removing the need for a separate server.
   3. Dependencies: I installed axios in the main project so the new backend function can use it.
   4. Local Development: I added a proxy to your package.json so that npm start (or yarn start) will still work locally by forwarding API requests to
      your old server (localhost:3001) if you choose to run it that way.

  How to Deploy (배포 방법)

   1. Push to GitHub:
      Commit your changes and push this project to a GitHub repository.
      (변경 사항을 커밋하고 GitHub 저장소에 푸시하세요.)

   2. Deploy on Vercel:
       * Go to Vercel.com (https://vercel.com) and sign up/log in.
       * Click "Add New Project" and import your GitHub repository.
       * Vercel will detect it's a React app. Just click "Deploy".
       * (Vercel.com에 접속하여 로그인 후, "Add New Project"를 클릭하고 GitHub 저장소를 가져오세요. "Deploy" 버튼만 누르면 자동으로 배포됩니다.)

   3. Access Anywhere:
      Once deployed, Vercel will give you a URL (e.g., english-card-memory.vercel.app). You can open this link on your phone, tablet, or any computer
  to use your app!
      (배포가 완료되면 URL이 생성됩니다. 이 주소로 언제 어디서든 접속할 수 있습니다!)

  Local Development (로컬에서 실행하기)

  You can still run the app locally:
   * Terminal 1: cd english-card-memory && npm start (Frontend)
   * Terminal 2: cd english-card-memory/server && node server.js (Old Backend for local proxy)

  Alternatively, if you install the Vercel CLI (npm i -g vercel), you can just run vercel dev to simulate the production environment perfectly.