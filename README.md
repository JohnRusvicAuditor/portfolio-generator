# PortfolioGen – Online Portfolio Template Generator

## Project Description
A database-driven web app where users enter their information, save it to an online database, choose 1 of 3 templates (Simple, Modern, Creative), generate a portfolio, and edit or delete it.

## Technologies Used
HTML, CSS, JavaScript (Vite), Supabase JS client

## Database Platform
Supabase (PostgreSQL) — project: *Portfolio Generator*

## Hosting / Deployment
Vercel — **Published URL:** https://your-project.vercel.app  <!-- replace -->

## Database Structure — table `portfolios`
| Column | Type | Notes |
|---|---|---|
| id | uuid | primary key, auto-generated |
| full_name | text | required |
| email, contact_number, address | text | |
| about | text | |
| photo | text | resized image stored as data URL |
| education, skills, projects, experience, links | jsonb | arrays |
| template | int | 1, 2 or 3 |
| created_at, updated_at | timestamptz | |

## Run locally
1. `npm install`
2. Copy `.env.example` to `.env` and fill in your Supabase URL + anon key
3. Create the table: paste `supabase/schema.sql` into Supabase > SQL Editor > Run
4. `npm run dev` and open the link shown (usually http://localhost:5173)

## Deploy
1. Push to GitHub.
2. Vercel > Add New Project > import the repo (Framework: Vite is auto-detected).
3. Settings > Environment Variables: add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
4. Deploy (redeploy after adding variables).

## Screenshots
Add screenshots of each page and of the 3 templates here.
