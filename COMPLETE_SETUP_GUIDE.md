# Complete Setup & Deployment Guide

Everything you need to get CIL MT Prep Arena up and running with database storage.

---

## What's Included

This application now has:

1. **Professional Dark Theme** - Beautiful dark UI with perfect readability
2. **Multi-Format File Import** - JSON, DOCX, PDF support
3. **Supabase Database** - Secure cloud database with Row Level Security
4. **API Endpoints** - Complete REST API for test management
5. **Production Ready** - Fully deployable to Vercel

---

## 5-Minute Quick Start

### Step 1: Create Supabase Account (2 min)
```
1. Go to https://supabase.com/dashboard
2. Click "New Project"
3. Enter project name, password, and region
4. Wait for initialization
```

### Step 2: Get Credentials (1 min)
```
1. In Supabase: Settings > API
2. Copy Project URL
3. Copy Anon Key
4. Copy Service Role Key
```

### Step 3: Setup Local Environment (1 min)
```bash
# In project root:
cp .env.example .env.local

# Edit .env.local - paste your credentials:
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_URL.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_key
```

### Step 4: Create Database (1 min)
```
1. In Supabase: SQL Editor > New Query
2. Copy contents of: supabase/migrations/init.sql
3. Paste and click "Run"
4. Done!
```

### Step 5: Test
```bash
pnpm dev
# Visit http://localhost:3000
```

---

## Detailed Step-by-Step

### Create Supabase Project

1. Go to https://supabase.com/dashboard
2. Click **"New project"** button
3. Fill in the form:
   - **Name**: `cil-mt-prep-arena`
   - **Database Password**: Create a strong password
   - **Region**: Choose closest to your location
4. Click **"Create new project"**
5. Wait for initialization (2-3 minutes)

### Get Your Credentials

After project is created:

1. Click your project name
2. Go to **Settings** (bottom left sidebar)
3. Click **"API"**
4. You'll see three important keys:

```
PROJECT URL
↓
https://YOUR_PROJECT_ID.supabase.co

ANON KEY (public)
↓
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

SERVICE ROLE KEY (secret!)
↓
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Copy each of these.

### Setup Environment Variables

1. In project root directory, run:
   ```bash
   cp .env.example .env.local
   ```

2. Open `.env.local` in your editor

3. Replace these three lines:
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=https://abc123.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...
   ```

4. Keep all other variables as default

5. Save the file

### Create Database Tables

1. Go back to Supabase dashboard
2. Click your project
3. Go to **SQL Editor** (left sidebar)
4. Click **"New Query"**
5. In your project, open this file:
   ```
   supabase/migrations/init.sql
   ```
6. Copy **all the contents**
7. Paste into Supabase SQL Editor
8. Click **"Run"** button (or press Ctrl+Enter)
9. Wait for it to complete (should show success)

### Start Development Server

```bash
# Install dependencies (if not already done)
pnpm install

# Start dev server
pnpm dev

# Open browser
http://localhost:3000
```

### Test Everything Works

1. **Dark Theme Check**
   - Look at the dashboard
   - Should be dark background with light text
   - All text should be clearly readable

2. **Import Test**
   - Click "Import Test" in navbar
   - Try importing a JSON file
   - Check it shows in the dashboard

3. **Database Check**
   - In Supabase dashboard, go to "Table Editor"
   - Click "tests" table
   - Should see your imported test
   - Click "questions" table
   - Should see questions from your test

4. **Take a Test**
   - Back on app: Click "Start Test"
   - Answer some questions
   - Submit test
   - Check results show correct answers

---

## File Import Guide

### Supported Formats

#### JSON Files
```json
{
  "testName": "My Test",
  "duration": 30,
  "questions": [
    {
      "id": 1,
      "section": "General Awareness",
      "difficulty": "medium",
      "question": "What is 2+2?",
      "options": {
        "A": "3",
        "B": "4",
        "C": "5",
        "D": "6"
      },
      "correctAnswer": "B",
      "explanation": "2+2 equals 4"
    }
  ]
}
```

#### DOCX Files
- Create a document in Microsoft Word
- Include the JSON somewhere in the document
- Export as .docx
- Upload through app
- App will extract and parse JSON

#### PDF Files
- Same as DOCX
- Include JSON in the PDF text
- Upload through app
- App will extract and parse JSON

### How to Import

1. Go to **Import Test** page
2. Click upload box or drag & drop a file
3. Supported: `.json`, `.docx`, `.pdf`
4. Click "Import Test"
5. Review parsed content
6. Click "Confirm Import"
7. Done! Test appears in dashboard

---

## API Endpoints Reference

### Create Test
```bash
curl -X POST http://localhost:3000/api/tests \
  -H "Content-Type: application/json" \
  -d '{
    "testName": "Mock Test 1",
    "duration": 30,
    "questions": [...],
    "userId": "your-user-id"
  }'
```

### Get User's Tests
```bash
curl "http://localhost:3000/api/tests?userId=your-user-id"
```

### Save Test Results
```bash
curl -X POST http://localhost:3000/api/results \
  -H "Content-Type: application/json" \
  -d '{
    "testId": "test-uuid",
    "userId": "your-user-id",
    "attemptId": "attempt-123",
    "correctAnswers": 15,
    "wrongAnswers": 10,
    "skipped": 5,
    "accuracy": 60,
    "timeTaken": 1800
  }'
```

### Get Test Results
```bash
curl "http://localhost:3000/api/results?userId=your-user-id"
```

---

## Environment Variables

### Must Have (For Database)
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

### Recommended
```
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000
ENABLE_DATABASE_STORAGE=true
ENABLE_FILE_UPLOADS=true
```

### Optional
```
MAX_FILE_UPLOAD_SIZE=10
ALLOWED_FILE_TYPES=json,docx,pdf
LOG_LEVEL=debug
```

For complete reference: See `ENV_VARIABLES.md` or `ENV_QUICK_REFERENCE.md`

---

## Deployment to Vercel

### Step 1: Push to GitHub
```bash
git add .
git commit -m "Add database integration"
git push origin main
```

### Step 2: Connect to Vercel
1. Go to https://vercel.com/dashboard
2. Click "New Project"
3. Import your GitHub repo
4. Select your project
5. Click "Import"

### Step 3: Add Environment Variables
1. In Vercel project settings
2. Go to "Environment Variables"
3. Add these:
   ```
   NEXT_PUBLIC_SUPABASE_URL          → Your Supabase URL
   NEXT_PUBLIC_SUPABASE_ANON_KEY     → Your Anon Key
   SUPABASE_SERVICE_ROLE_KEY         → Your Service Key (mark as Secret)
   NEXT_PUBLIC_APP_URL               → https://your-domain.vercel.app
   NODE_ENV                          → production
   ```

### Step 4: Deploy
1. Click "Deploy"
2. Wait for build to complete
3. Visit your live URL!

### Important!
- Mark `SUPABASE_SERVICE_ROLE_KEY` as "Secret"
- Never expose it in browser
- It should only be available on server

---

## Troubleshooting

### "No such file or directory: .env.local"
**Solution**: Create it manually:
```bash
cp .env.example .env.local
```

### "SUPABASE_SERVICE_ROLE_KEY is not defined"
**Solution**:
- Check `.env.local` exists
- Check spelling (exact case match)
- Restart dev server with `pnpm dev`

### "Database connection failed"
**Solution**:
- Verify your Supabase URL and keys
- Check Supabase project is still active
- Try in Supabase SQL Editor to test connection

### "File upload not working"
**Solution**:
- Check file size (max 10MB by default)
- Ensure file is .json, .docx, or .pdf
- Check browser console for error details
- Try with a simple JSON file first

### "Tests not saving to database"
**Solution**:
- Run database migration SQL from `init.sql`
- Check tables exist in Supabase "Table Editor"
- Verify `ENABLE_DATABASE_STORAGE=true`
- Check API response for errors

### "Text hard to read"
**Solution**:
- Make sure `dark` class is on `<html>` tag
- Check `app/layout.tsx` line 44 has `className="dark"`
- Refresh browser (Ctrl+Shift+R for hard refresh)

---

## Security Best Practices

### Do's
✅ Keep `.env.local` private
✅ Never commit `.env.local` to git
✅ Use Vercel Secrets for production
✅ Rotate keys periodically
✅ Use HTTPS in production
✅ Enable RLS on database

### Don'ts
❌ Share `SUPABASE_SERVICE_ROLE_KEY`
❌ Put secrets in code
❌ Use same credentials for multiple projects
❌ Expose secrets in client-side code
❌ Leave database wide open

### How RLS Works
- Each user can only access their own data
- Tests can be marked public for sharing
- Automatic user isolation via user_id
- Row Level Security prevents unauthorized access

---

## Monitoring & Debugging

### Check Database
```
In Supabase:
1. Table Editor
2. Click "tests" table
3. See all imported tests
4. Click "questions" table
5. See all questions
```

### View API Logs
```
In Vercel:
1. Project > Deployments
2. Click your deployment
3. Go to Logs tab
4. See API request logs
```

### Local Dev Debugging
```
In browser:
1. Press F12 (Developer Tools)
2. Go to Console tab
3. See any JavaScript errors
4. Check Network tab for API calls
```

---

## Performance Tips

1. **Database Queries**
   - Indexes already created for common queries
   - Queries are optimized in API routes

2. **File Uploads**
   - Keep files under 10MB
   - DOCX/PDF parsing is slower than JSON
   - Consider gzip for large JSON

3. **Caching**
   - Tests cached in browser state
   - Results stored in database
   - Clear cache by logging out

4. **Scaling**
   - Supabase free tier: 500MB database
   - Paid tiers available
   - Indexes prevent slow queries
   - RLS keeps data secure

---

## Next Steps

1. ✅ Set up Supabase
2. ✅ Configure environment variables
3. ✅ Create database tables
4. ✅ Test locally
5. ⬜ Deploy to Vercel
6. ⬜ Share with users
7. ⬜ Monitor usage
8. ⬜ Scale as needed

---

## Support Resources

### Documentation
- `DATABASE_SETUP.md` - Full database setup guide
- `ENV_VARIABLES.md` - Complete variable reference
- `ENV_QUICK_REFERENCE.md` - Quick copy-paste guide
- `IMPLEMENTATION_SUMMARY.md` - Feature overview

### External Help
- Supabase Docs: https://supabase.com/docs
- Supabase Discord: https://discord.supabase.io
- Next.js Docs: https://nextjs.org/docs
- Vercel Docs: https://vercel.com/docs

### Quick Links
- Supabase Dashboard: https://supabase.com/dashboard
- Vercel Dashboard: https://vercel.com/dashboard
- GitHub: https://github.com

---

## Checklist Before Launch

- [ ] Supabase project created
- [ ] Environment variables configured
- [ ] Database migration completed
- [ ] Local dev server running
- [ ] Dashboard displays correctly (dark theme)
- [ ] File import works with all formats
- [ ] Tests save to database
- [ ] Taking a test works
- [ ] Results display correctly
- [ ] Admin panel shows imported tests
- [ ] Vercel deployment successful
- [ ] Production environment variables set
- [ ] Live URL works correctly
- [ ] Database queries perform well

---

## Estimated Time

| Task | Time |
|------|------|
| Create Supabase account | 3 min |
| Create Supabase project | 5 min |
| Get credentials | 2 min |
| Setup environment | 2 min |
| Run database migration | 2 min |
| Test locally | 5 min |
| Deploy to Vercel | 10 min |
| **Total** | **~30 min** |

---

## Questions?

1. **Setup problems?** → See DATABASE_SETUP.md
2. **Environment variables?** → See ENV_QUICK_REFERENCE.md
3. **Features?** → See IMPLEMENTATION_SUMMARY.md
4. **Deployment?** → See this guide's Vercel section

---

**You're ready!** Follow the steps and your CIL MT Prep Arena will be up and running with a production-ready database.

Good luck! 🚀
