# Candidate Scout

A two-sided candidate scouting app. Applicants can upload a resume and review an extracted profile; invited recruiters can search applicant-submitted profiles stored in Supabase.

---

## 🎯 Problem

Recruiters need a quick way to explore candidate profiles against the role, skills, and experience they are looking for.

---

## 💡 Solution

This system:

- Lets applicants submit a resume without creating an account
- Uses AI to extract candidate details and lets applicants review them before submission
- Stores reviewed profile data in Supabase; uploaded resume files are processed in memory and discarded
- Restricts recruiter search to invited, authenticated accounts
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
- Supabase Auth and Postgres
- Google Gemini API for resume extraction

### Frontend

- React (Vite)
- CSS

### Deployment

- Frontend: Vercel
- Backend: Render

---

## 🔍 How It Works

1. An applicant uploads a PDF, DOCX, or TXT resume without signing in
2. The backend sends the resume to Gemini for structured extraction, then discards the original file
3. The applicant reviews and corrects the extracted profile before submitting it to Supabase
4. An invited recruiter signs in with Supabase Auth and enters a job description in natural language
5. The recruiter submits the full job description
6. Gemini extracts its role, skills, and experience requirements, including clearly intended terms with ordinary typos
7. The backend compares the extracted criteria with applicant profiles stored in Supabase and shows the detected search parameters with the results
8. Exact fits rank first; relevant potential matches remain available when some criteria differ
9. Recruiters can adjust match priorities, filter results, and browse the shortlist 10 profiles per page
10. Each card shows match evidence on the front and candidate details on the back

Recruiter searches use applicant-submitted profiles stored in Supabase. There is no bundled sample candidate dataset.

Resume and job description extraction use the Gemini API. Applicants are told that the resume is sent to Google for extraction before they upload. Google’s [Gemini API pricing and data-use page](https://ai.google.dev/gemini-api/docs/pricing) says free-tier content may be used to improve its products, while paid-tier content is not; use a paid tier before processing real resumes if that data handling is not acceptable.

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

- Gemini extracts role, skill, and experience criteria from the submitted job description without a fixed role or skill alias list
- Gemini analyzes the description when the recruiter submits it; detected search parameters are shown with the results
- Experience requirements such as “3+ years,” “less than two years,” and “more than 8 years” are supported
- Near matches are retained and labeled as potential matches rather than being removed by a strict overall score cutoff
- Skill coverage, role alignment, and experience are shown on the match-summary side of each card
- Ranking priorities for skills, role, and experience can be adjusted; available weights are normalized automatically
- Filter results by candidate name, title, company, location, required skill coverage, role fit, and experience fit
- Search progress shows the requirement parsing, profile comparison, priority scoring, and shortlist preparation stages
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

Copy `frontend/.env.example` to `frontend/.env.local` and `backend/.env.example` to `backend/.env`, then fill in the values. Never commit either environment file.

### Backend

```
cd backend
npm install
npm start
```

The backend needs `SUPABASE_URL`, `SUPABASE_SECRET_KEY`, and `GEMINI_API_KEY`. `GEMINI_MODEL` and `GEMINI_TIMEOUT_MS` are optional; the defaults are shown in `backend/.env.example`. The Supabase secret key and Gemini key must stay server-side. Recruiter search is protected by Supabase Auth; public sign-ups should remain disabled.

### Supabase database

In the Supabase SQL Editor, create the profile table used by applicant submissions and recruiter search:

```sql
create table if not exists public.candidate_profiles (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null default '',
  title text not null default '',
  company text not null default '',
  experience numeric,
  location text not null default '',
  skills text[] not null default '{}',
  bio text not null default '',
  work_mode text not null default 'Not specified',
  availability text not null default 'Not specified',
  consented_at timestamptz not null,
  extraction_details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.candidate_profiles enable row level security;
grant all on table public.candidate_profiles to service_role;
```

The app accesses this table only from the backend using the Supabase secret key. Do not add public table policies or expose the secret key in the frontend. Invite recruiter accounts through Supabase Auth; keep public sign-ups disabled.

### Frontend

```
cd frontend
npm install
npm run dev
```

---

## 🌐 Deployment Notes

- Frontend: Vercel, with the project root directory set to `frontend`
- Backend: Render Web Service, with the root directory set to `backend`, build command `npm install`, and start command `npm start`
- Set these Vercel environment variables for Production (and Preview if those deployments should work): `VITE_API_URL` (the Render service URL, without a route suffix), `VITE_SUPABASE_URL`, and `VITE_SUPABASE_PUBLISHABLE_KEY`
- Set these Render environment variables: `SUPABASE_URL`, `SUPABASE_SECRET_KEY`, and `GEMINI_API_KEY`. `GEMINI_MODEL` and `GEMINI_TIMEOUT_MS` are optional.
- Set Supabase Auth’s Site URL to the production Vercel URL and add the production URL plus `http://localhost:5173/**` to its allowed redirect URLs. Add any Vercel preview URLs you intend to use.
- After changing frontend code or Vercel variables, redeploy Vercel. After changing backend code or Render variables, redeploy Render. Pushing a commit triggers deployment only if automatic deploys are enabled and the service is connected to that Git branch.

---

## 👨‍💻 Author

Gaurav Kaushik

