# Candidate Scouting & Matching App

A recruiter-facing app for comparing job descriptions with a local pool of candidate profiles.

---

## 🎯 Problem

Recruiters need a quick way to explore candidate profiles against the role, skills, and experience they are looking for.

---

## 💡 Solution

This system:

- Accepts a job description written in natural language
- Matches the role, skills, and experience against candidate profiles
- Ranks exact fits ahead of potential matches
- Shows match evidence and candidate details in an interactive shortlist

---

## 🚀 Live Demo

Frontend: https://candidate-scouting-and-matching-app.vercel.app/

---

## ⚙️ Tech Stack

### Backend

- Node.js
- Express.js

### Frontend

- React (Vite)
- CSS

### Deployment

- Frontend: Vercel
- Backend: Render

---

## 🔍 How It Works

1. A recruiter enters a job description in natural language
2. The app recognizes supported role, skill, and experience phrases
3. The backend compares the criteria with profiles in `backend/src/data/candidates.json`
4. Exact fits rank first; relevant potential matches remain available when some criteria differ
5. The shortlist displays 10 profiles per page, with additional matches available through pagination
6. Each card shows match evidence on the front and the candidate profile on the back

The current candidate pool contains 1,000 synthetic sample profiles. It is local demo data, not a live candidate feed.

---

## 📊 Scoring Logic

### Match Score

- Role and skill alignment contribute to the evidence score
- Experience contributes up to 30% when the job description includes an experience requirement
- Exact criteria fits rank ahead of potential matches

### Ranking

- A stable simulated interest factor contributes to ordering candidates with similar match scores
- The same query and candidate data produce a repeatable shortlist

---

## 🔎 Matching and Results

- Common role, technology, and experience phrases are recognized by a rule-based parser
- Experience requirements such as “3+ years,” “less than two years,” and “more than 8 years” are supported
- Near matches are retained and labeled as potential matches rather than being removed by a strict overall score cutoff
- Skill coverage, role alignment, and experience are shown on the match-summary side of each card
- Click a card to view the candidate’s name, email, title, company, location, experience, skills, bio, and availability
- Use the page controls to browse all relevant results, 10 profiles at a time
- A light/dark mode switch is available in the page header

---

## 🧪 Sample Inputs

```text
Looking for a backend developer with Node.js, MongoDB, Express, AWS, and 3+ years of experience.
```

```text
Looking for a full-stack engineer with less than two years of experience.
```

```text
Looking for a DevOps engineer with Docker, AWS, Java, and SQL, with more than 8 years of experience.
```

---

## 📦 Setup Instructions

### Backend

```
cd backend
npm install
npm start
```

Candidate data is loaded from the local `backend/src/data/candidates.json` file.

### Frontend

```
cd frontend
npm install
npm run dev
```

---

## 🌐 Deployment Notes

- Frontend is deployed on Vercel
- Backend is deployed on Render
- The frontend calls the backend URL configured in `VITE_API_URL` (or the production fallback in `frontend/src/pages/Home.jsx`)

---

## 👨‍💻 Author

Gaurav Kaushik

