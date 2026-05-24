# CIL MT Prep Arena - Database Setup Guide

## Overview

This guide will help you set up the Supabase database integration for the CIL MT Prep Arena application. The application supports both local storage (for development) and Supabase database (for production and data persistence).

## Prerequisites

- A Supabase account (free at https://supabase.com)
- Git and Node.js/PNPM installed
- The CIL MT Prep Arena project

## Step-by-Step Setup

### 1. Create a Supabase Project

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Click **"New project"**
3. Fill in the project details:
   - **Name**: `cil-mt-prep-arena` (or your preferred name)
   - **Database Password**: Create a strong password
   - **Region**: Choose closest to your location
4. Click **"Create new project"**
5. Wait for the project to be initialized (2-3 minutes)

### 2. Get Your API Credentials

1. Once your project is ready, go to **Settings** (bottom left) > **API**
2. You'll see several important values:
   - **Project URL**: Copy this → `NEXT_PUBLIC_SUPABASE_URL`
   - **Anon Key**: Copy this → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **Service Role Key**: Copy this → `SUPABASE_SERVICE_ROLE_KEY` (Keep this secret!)

### 3. Setup Database Schema

1. In your Supabase dashboard, go to **SQL Editor** (left sidebar)
2. Click **"New Query"**
3. Copy the entire contents of `supabase/migrations/init.sql` from the project
4. Paste it into the SQL editor
5. Click **"Run"** (or press Ctrl+Enter)
6. Wait for the query to complete successfully

This will create all necessary tables:
- `tests` - Stores test information
- `questions` - Stores questions with their options
- `test_results` - Stores user test attempt results
- `user_answers` - Stores individual answers for tracking
- All indexes and Row Level Security policies

### 4. Create Environment Variables File

1. In the project root, copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Open `.env.local` and fill in the values you copied from Supabase:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   NODE_ENV=development
   ```

3. **Important**: Never commit `.env.local` to version control!

### 5. Verify Installation

1. Start the development server:
   ```bash
   pnpm dev
   ```

2. Go to http://localhost:3000

3. Try importing a test - it should now save to your Supabase database

4. Check in Supabase dashboard:
   - Go to **SQL Editor**
   - Run: `SELECT * FROM tests;`
   - You should see your imported tests

## Environment Variables Explained

### Required Variables

| Variable | Purpose | Example |
|----------|---------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | `https://abc123.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public API key | `eyJhbGciOi...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Secret admin key (server-only) | `eyJhbGciOi...` |

### Optional Variables

| Variable | Purpose | Default |
|----------|---------|---------|
| `NEXT_PUBLIC_APP_URL` | Application URL | `http://localhost:3000` |
| `NODE_ENV` | Environment | `development` |
| `ENABLE_DATABASE_STORAGE` | Use database instead of localStorage | `true` |
| `ENABLE_FILE_UPLOADS` | Allow DOCX/PDF imports | `true` |
| `MAX_FILE_UPLOAD_SIZE` | Max file size in MB | `10` |

## Database Schema

### tests Table
Stores information about each test/test bank

```sql
- id (UUID, Primary Key)
- test_name (String)
- duration (Integer) - in minutes
- description (Text)
- user_id (UUID) - Reference to auth user
- is_public (Boolean)
- created_at (Timestamp)
- updated_at (Timestamp)
```

### questions Table
Stores individual questions for each test

```sql
- id (UUID, Primary Key)
- test_id (UUID) - Reference to tests
- question_text (Text)
- section (String) - e.g., "GK", "Reasoning"
- difficulty (String) - "easy", "medium", "hard"
- option_a, option_b, option_c, option_d (Text)
- correct_answer (String) - A, B, C, or D
- explanation (Text)
- question_order (Integer)
- created_at (Timestamp)
```

### test_results Table
Stores results from each test attempt

```sql
- id (UUID, Primary Key)
- test_id (UUID)
- user_id (UUID)
- attempt_id (String)
- correct_answers (Integer)
- wrong_answers (Integer)
- skipped (Integer)
- accuracy (Numeric) - percentage
- time_taken (Integer) - in seconds
- completed_at (Timestamp)
```

### user_answers Table
Stores individual answers for each question attempt

```sql
- id (UUID, Primary Key)
- result_id (UUID)
- question_id (UUID)
- selected_answer (String) - A, B, C, D, or null
- time_spent (Integer) - seconds
- marked_for_review (Boolean)
```

## API Endpoints

### POST /api/tests
Create a new test
```json
{
  "testName": "Mock Test 1",
  "duration": 30,
  "questions": [...],
  "userId": "user-uuid",
  "isPublic": false
}
```

### GET /api/tests
Get all tests for a user
```
GET /api/tests?userId=user-uuid
```

### POST /api/results
Save test results
```json
{
  "testId": "test-uuid",
  "userId": "user-uuid",
  "attemptId": "attempt-123",
  "correctAnswers": 15,
  "wrongAnswers": 10,
  "skipped": 5,
  "accuracy": 60.0,
  "timeTaken": 1800,
  "answers": {...}
}
```

### GET /api/results
Get test results
```
GET /api/results?userId=user-uuid
GET /api/results?userId=user-uuid&testId=test-uuid
```

## Troubleshooting

### Connection Errors
- Verify all environment variables are correct
- Check Supabase project is active
- Ensure `.env.local` is in the project root

### Database Query Errors
- Run the SQL migration script again
- Check Supabase SQL Editor for syntax errors
- Verify table names match exactly (case-sensitive)

### File Upload Issues
- Check `MAX_FILE_UPLOAD_SIZE` setting
- Verify file format (JSON, DOCX, or PDF)
- Check browser console for detailed error messages

### Row Level Security (RLS) Errors
- RLS is enabled by default for security
- Tests without `user_id` won't be accessible
- Check Supabase RLS policies in Table Editor

## Security Best Practices

1. **Never commit secrets**: Always use `.env.local` for sensitive values
2. **Rotate keys regularly**: Change credentials periodically
3. **Use RLS**: Row Level Security ensures users can only access their data
4. **Validate input**: Server-side validation prevents SQL injection
5. **HTTPS only**: Always use HTTPS in production

## Deployment to Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Connect your repository
3. Add environment variables:
   - Go to **Settings** > **Environment Variables**
   - Add all variables from `.env.example`
4. Deploy!

Vercel automatically deploys on push to your default branch.

## Monitoring & Debugging

### Check Database Activity
In Supabase dashboard:
1. Go to **Database** > **Tables**
2. Click on a table to see its data
3. Use **SQL Editor** to run custom queries

### View API Logs
In the project:
1. Check browser console (F12) for client errors
2. Check server logs in Vercel dashboard for API errors

### Performance Tips
- Add database indexes (already done in migration)
- Cache frequently accessed tests
- Paginate large result sets

## Support & Resources

- Supabase Docs: https://supabase.com/docs
- Supabase Community: https://discord.supabase.io
- This Project: Check GitHub issues
- Next.js Docs: https://nextjs.org/docs

## Next Steps

1. ✅ Set up Supabase project
2. ✅ Configure environment variables
3. ✅ Import a test from the app
4. ✅ Take a test and check if results are saved
5. Share tests with others using the share feature
6. Monitor performance and scale as needed

Happy testing!
