# Environment Variables - Quick Reference

Copy and paste this template to get started immediately.

## For Local Development (.env.local)

```bash
# ============================================================================
# SUPABASE - Get from https://supabase.com/dashboard -> Settings > API
# ============================================================================
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# ============================================================================
# APPLICATION SETTINGS
# ============================================================================
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000
APP_NAME=CIL MT Prep Arena

# ============================================================================
# DATABASE (Usually auto-configured by Supabase)
# ============================================================================
DB_HOST=db.your-project-id.supabase.co
DB_PORT=5432
DB_NAME=postgres
DB_USER=postgres
DB_PASSWORD=your_password_here

# ============================================================================
# FEATURE FLAGS
# ============================================================================
ENABLE_DATABASE_STORAGE=true
ENABLE_FILE_UPLOADS=true
ENABLE_AUTH=true
ENABLE_TEST_SHARING=true

# ============================================================================
# FILE UPLOAD SETTINGS
# ============================================================================
MAX_FILE_UPLOAD_SIZE=10
ALLOWED_FILE_TYPES=json,docx,pdf

# ============================================================================
# LOGGING
# ============================================================================
LOG_LEVEL=debug
ENABLE_API_LOGGING=true
```

---

## For Production (Vercel Environment Variables)

Add these in **Vercel Dashboard** → **Settings** → **Environment Variables**

```
NEXT_PUBLIC_SUPABASE_URL              → Copy from Supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY         → Copy from Supabase
SUPABASE_SERVICE_ROLE_KEY             → Copy from Supabase (use Secrets)
NEXT_PUBLIC_APP_URL                   → https://your-domain.com
NODE_ENV                              → production
ENABLE_DATABASE_STORAGE               → true
ENABLE_FILE_UPLOADS                   → true
LOG_LEVEL                             → warn
ENABLE_API_LOGGING                    → false
```

---

## How to Get Your Supabase Credentials

### Step 1: Create Supabase Project
1. Go to https://supabase.com/dashboard
2. Click "New Project"
3. Fill in project details
4. Wait for initialization

### Step 2: Find Your Credentials
1. In Supabase dashboard, click your project
2. Go to **Settings** (bottom left) > **API**
3. You'll see:
   - **Project URL** → Copy to `NEXT_PUBLIC_SUPABASE_URL`
   - **Anon Key** → Copy to `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **Service Role Key** → Copy to `SUPABASE_SERVICE_ROLE_KEY`

### Step 3: Setup Database
1. Go to **SQL Editor**
2. Create **New Query**
3. Copy contents of `supabase/migrations/init.sql`
4. Paste into editor
5. Click **Run**

---

## Variable Descriptions (Detailed)

### NEXT_PUBLIC_SUPABASE_URL
The base URL of your Supabase project  
**Example**: `https://abc123def456.supabase.co`  
**Where to find**: Supabase Dashboard > Settings > API > Project URL

### NEXT_PUBLIC_SUPABASE_ANON_KEY
Public API key (safe to use in browser)  
**Example**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6...`  
**Where to find**: Supabase Dashboard > Settings > API > Anon key (public)  
**Security**: Safe to expose in client-side code

### SUPABASE_SERVICE_ROLE_KEY
Admin API key for server-side operations  
**Where to find**: Supabase Dashboard > Settings > API > Service Role key  
**Security**: KEEP SECRET - Never expose to client  
**Usage**: Server-side API routes only

### NEXT_PUBLIC_APP_URL
Your application's public URL  
**Development**: `http://localhost:3000`  
**Production**: `https://yourdomain.com`  
**Usage**: Auth redirects, email links

### NODE_ENV
Runtime environment  
**Values**: `development`, `production`, `test`  
**Default**: `development`

### ENABLE_DATABASE_STORAGE
Use Supabase database or localStorage  
**Values**: `true` (database), `false` (localStorage only)  
**Default**: `true`  
**Note**: Set to `false` to develop without database

### ENABLE_FILE_UPLOADS
Allow importing tests from files  
**Values**: `true`, `false`  
**Default**: `true`

### MAX_FILE_UPLOAD_SIZE
Maximum file size in MB  
**Default**: `10`  
**Range**: Recommended 10-50 MB

### ALLOWED_FILE_TYPES
File types allowed for import  
**Default**: `json,docx,pdf`  
**Options**: `json`, `docx`, `pdf`

### LOG_LEVEL
Logging verbosity  
**Values**: `debug`, `info`, `warn`, `error`  
**Development**: `debug`  
**Production**: `warn`

---

## Step-by-Step Setup

### 1. Create Supabase Account
- Go to https://supabase.com
- Sign up with email or GitHub

### 2. Create Project
- Click "New Project"
- Choose:
  - Name: `cil-mt-prep-arena` (or your choice)
  - Database Password: (strong password)
  - Region: (closest to you)
- Click "Create new project"
- Wait 2-3 minutes

### 3. Get Credentials
- Dashboard > Settings > API
- Copy three values:
  1. Project URL
  2. Anon Key
  3. Service Role Key

### 4. Create .env.local
```bash
# In project root:
cp .env.example .env.local

# Edit .env.local with your credentials:
NEXT_PUBLIC_SUPABASE_URL=https://abc123.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...
```

### 5. Setup Database
1. Supabase Dashboard > SQL Editor
2. New Query
3. Copy `supabase/migrations/init.sql`
4. Paste into editor
5. Run

### 6. Test
```bash
pnpm dev
# Go to http://localhost:3000
# Try importing a test
# Check Supabase dashboard for saved data
```

---

## Verification Checklist

- [ ] Created Supabase account
- [ ] Created Supabase project
- [ ] Copied API credentials
- [ ] Created .env.local file
- [ ] Filled in all Supabase variables
- [ ] Ran database migration SQL
- [ ] Started dev server (`pnpm dev`)
- [ ] Verified dark theme displays correctly
- [ ] Tested file import works
- [ ] Checked data in Supabase dashboard

---

## Common Issues & Solutions

### "SUPABASE_SERVICE_ROLE_KEY is not defined"
**Solution**: 
- Check `.env.local` exists in project root
- Verify exact variable name (case-sensitive)
- Restart dev server after saving .env.local

### "Database connection failed"
**Solution**:
- Verify all three URLs and keys are copied correctly
- Check Supabase project is active
- Test connection in Supabase dashboard

### "File upload not working"
**Solution**:
- Check `ENABLE_FILE_UPLOADS=true`
- Verify file size < `MAX_FILE_UPLOAD_SIZE`
- Check browser console for errors

### "No tests showing in database"
**Solution**:
- Run database migration SQL from `supabase/migrations/init.sql`
- Verify tables exist in Supabase > Table Editor
- Check that `ENABLE_DATABASE_STORAGE=true`

---

## Deployment to Vercel

1. Push code to GitHub
2. Connect repo to Vercel
3. In Vercel Settings > Environment Variables, add:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (under "Sensitive")
   - Other variables as needed
4. Deploy!

---

## Security Reminders

✅ **DO:**
- Use `.env.local` for development secrets
- Store production secrets in Vercel Dashboard
- Rotate credentials periodically
- Keep backups of important data

❌ **DON'T:**
- Commit `.env.local` to git
- Share `SUPABASE_SERVICE_ROLE_KEY`
- Expose secrets in client-side code
- Use same credentials across projects

---

## Quick Commands

```bash
# Check if env vars are loaded
grep -r "SUPABASE" .env.local

# List all env vars used in code
grep -r "process.env" app/ lib/ components/ | grep -v node_modules

# Test Supabase connection
npm run build  # Will fail if env vars missing
```

---

## Need Help?

1. **Setup Questions?** → See `DATABASE_SETUP.md`
2. **Variable Details?** → See `ENV_VARIABLES.md`
3. **Implementation?** → See `IMPLEMENTATION_SUMMARY.md`
4. **Supabase Help?** → https://supabase.com/docs

---

**Ready?** Copy the template above and follow the steps. You'll be running in production within 10 minutes!
