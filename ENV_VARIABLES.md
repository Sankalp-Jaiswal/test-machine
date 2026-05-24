# Environment Variables Reference

Complete guide to all environment variables used in CIL MT Prep Arena.

## Table of Contents
1. [Supabase Configuration](#supabase-configuration)
2. [Application Configuration](#application-configuration)
3. [Database Configuration](#database-configuration)
4. [Feature Flags](#feature-flags)
5. [Deployment](#deployment)

---

## Supabase Configuration

### NEXT_PUBLIC_SUPABASE_URL
**Type**: String (URL)  
**Required**: Yes  
**Scope**: Client + Server  
**Description**: The base URL of your Supabase project

**Example**:
```
NEXT_PUBLIC_SUPABASE_URL=https://abc123def456.supabase.co
```

**How to find**:
1. Go to Supabase Dashboard
2. Click your project
3. Settings > API
4. Copy "Project URL"

---

### NEXT_PUBLIC_SUPABASE_ANON_KEY
**Type**: String (JWT Token)  
**Required**: Yes  
**Scope**: Client (safe to expose)  
**Description**: Public API key for Supabase. This is safe to expose in client-side code

**Example**:
```
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**How to find**:
1. Go to Supabase Dashboard > Settings > API
2. Copy "Anon key (public)"

---

### SUPABASE_SERVICE_ROLE_KEY
**Type**: String (JWT Token)  
**Required**: Yes (for API routes)  
**Scope**: Server-side ONLY  
**Description**: Admin API key with full database access. KEEP THIS SECRET!

**Example**:
```
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**How to find**:
1. Go to Supabase Dashboard > Settings > API
2. Copy "Service role key (secret)"

**Security**: 
- ⚠️ NEVER share this key
- ⚠️ NEVER commit to version control
- ⚠️ NEVER expose in client-side code
- Store in `.env.local` or Vercel Secrets only

---

## Application Configuration

### NEXT_PUBLIC_APP_URL
**Type**: String (URL)  
**Required**: No  
**Default**: `http://localhost:3000`  
**Scope**: Client + Server  
**Description**: The public URL of your application

**Examples**:
```
# Development
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Production
NEXT_PUBLIC_APP_URL=https://cil-prep-arena.vercel.app
```

**Used for**:
- Authentication redirects
- Email confirmation links
- Social sharing

---

### NODE_ENV
**Type**: String (enum)  
**Required**: No  
**Default**: `development`  
**Scope**: Server  
**Valid Values**: `development`, `production`, `test`  
**Description**: Environment indicator for the application

**Examples**:
```
NODE_ENV=development   # Local development
NODE_ENV=production    # Production deployment
NODE_ENV=test         # Testing environment
```

**Effects**:
- Production: Enables optimizations, hides debug info
- Development: Enables source maps, detailed error messages
- Test: Mocks external services, speeds up tests

---

### APP_NAME
**Type**: String  
**Required**: No  
**Default**: `CIL MT Prep Arena`  
**Scope**: Client + Server  
**Description**: Application name (used in metadata, emails, etc.)

**Example**:
```
APP_NAME=CIL MT Prep Arena
```

---

## Database Configuration

### DB_HOST
**Type**: String (hostname)  
**Required**: No  
**Default**: (from Supabase)  
**Description**: Database host URL

**Example**:
```
DB_HOST=db.abc123def456.supabase.co
```

---

### DB_PORT
**Type**: Integer  
**Required**: No  
**Default**: `5432`  
**Description**: Database port (PostgreSQL default)

**Example**:
```
DB_PORT=5432
```

---

### DB_NAME
**Type**: String  
**Required**: No  
**Default**: `postgres`  
**Description**: Database name

**Example**:
```
DB_NAME=postgres
```

---

### DB_USER
**Type**: String  
**Required**: No  
**Default**: (from Supabase)  
**Description**: Database user

**Example**:
```
DB_USER=postgres
```

---

### DB_PASSWORD
**Type**: String  
**Required**: No  
**Description**: Database password (set during project creation)

**Security**:
- ⚠️ NEVER commit to version control
- Store in `.env.local` or Vercel Secrets only

---

## Storage & File Upload Configuration

### MAX_FILE_UPLOAD_SIZE
**Type**: Integer  
**Required**: No  
**Default**: `10`  
**Unit**: Megabytes (MB)  
**Description**: Maximum file size allowed for test imports

**Example**:
```
MAX_FILE_UPLOAD_SIZE=10    # Allow up to 10MB
MAX_FILE_UPLOAD_SIZE=50    # Allow up to 50MB
```

---

### ALLOWED_FILE_TYPES
**Type**: String (comma-separated)  
**Required**: No  
**Default**: `json,docx,pdf`  
**Description**: File types allowed for test imports

**Supported Types**:
- `json` - Raw JSON files
- `docx` - Microsoft Word documents
- `pdf` - PDF documents

**Example**:
```
ALLOWED_FILE_TYPES=json,docx,pdf
ALLOWED_FILE_TYPES=json                    # JSON only
ALLOWED_FILE_TYPES=json,docx              # JSON and DOCX
```

---

## Feature Flags

### ENABLE_DATABASE_STORAGE
**Type**: Boolean (`true`/`false`)  
**Required**: No  
**Default**: `true`  
**Description**: Enable/disable Supabase database storage

**Examples**:
```
ENABLE_DATABASE_STORAGE=true   # Use database
ENABLE_DATABASE_STORAGE=false  # Use localStorage only (development)
```

**Impact**:
- `true`: Tests and results saved to Supabase
- `false`: Tests and results saved to localStorage only

---

### ENABLE_FILE_UPLOADS
**Type**: Boolean (`true`/`false`)  
**Required**: No  
**Default**: `true`  
**Description**: Enable/disable file upload functionality

**Examples**:
```
ENABLE_FILE_UPLOADS=true   # Allow DOCX/PDF imports
ENABLE_FILE_UPLOADS=false  # JSON import only
```

---

### ENABLE_AUTH
**Type**: Boolean (`true`/`false`)  
**Required**: No  
**Default**: `true`  
**Description**: Enable/disable user authentication

**Examples**:
```
ENABLE_AUTH=true   # Require login
ENABLE_AUTH=false  # Anonymous access
```

---

### ENABLE_TEST_SHARING
**Type**: Boolean (`true`/`false`)  
**Required**: No  
**Default**: `true`  
**Description**: Enable/disable public test sharing

**Examples**:
```
ENABLE_TEST_SHARING=true   # Users can share tests
ENABLE_TEST_SHARING=false  # Tests are private only
```

---

## Logging & Monitoring

### LOG_LEVEL
**Type**: String (enum)  
**Required**: No  
**Default**: `info`  
**Valid Values**: `debug`, `info`, `warn`, `error`  
**Description**: Logging level

**Examples**:
```
LOG_LEVEL=debug   # Verbose logging
LOG_LEVEL=info    # Standard logging
LOG_LEVEL=warn    # Warnings and errors only
LOG_LEVEL=error   # Errors only
```

---

### ENABLE_API_LOGGING
**Type**: Boolean (`true`/`false`)  
**Required**: No  
**Default**: `true`  
**Description**: Enable/disable API request logging

**Examples**:
```
ENABLE_API_LOGGING=true   # Log all API calls
ENABLE_API_LOGGING=false  # Disable API logging
```

---

## Analytics (Optional)

### NEXT_PUBLIC_VERCEL_ANALYTICS_ID
**Type**: String  
**Required**: No  
**Scope**: Client  
**Description**: Vercel Analytics token for performance monitoring

**Example**:
```
NEXT_PUBLIC_VERCEL_ANALYTICS_ID=abc123def456
```

**How to find**:
1. Go to Vercel Dashboard
2. Project Settings > Analytics
3. Copy your Analytics ID

---

### NEXT_PUBLIC_GA_ID
**Type**: String  
**Required**: No  
**Scope**: Client  
**Description**: Google Analytics ID

**Example**:
```
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
```

---

## Deployment

### VERCEL_PROJECT_ID
**Type**: String  
**Required**: No  
**Description**: Vercel project identifier

**Example**:
```
VERCEL_PROJECT_ID=prj_abc123def456
```

---

### VERCEL_TEAM_ID
**Type**: String  
**Required**: No  
**Description**: Vercel team identifier (if in a team)

**Example**:
```
VERCEL_TEAM_ID=team_abc123def456
```

---

## Environment-Specific Examples

### Development (.env.local)
```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://abc123.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...

# App Config
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000
APP_NAME=CIL MT Prep Arena

# Features
ENABLE_DATABASE_STORAGE=true
ENABLE_FILE_UPLOADS=true
ENABLE_AUTH=true

# Logging
LOG_LEVEL=debug
ENABLE_API_LOGGING=true
```

### Production (Vercel)
```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://abc123.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi... (in Vercel Secrets)

# App Config
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://cil-prep-arena.vercel.app
APP_NAME=CIL MT Prep Arena

# Features
ENABLE_DATABASE_STORAGE=true
ENABLE_FILE_UPLOADS=true
ENABLE_AUTH=true

# Logging
LOG_LEVEL=warn
ENABLE_API_LOGGING=false

# Analytics
NEXT_PUBLIC_VERCEL_ANALYTICS_ID=abc123def456
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX

# Deployment
VERCEL_PROJECT_ID=prj_abc123
```

---

## Tips & Best Practices

### Security
- ✅ Use `.env.local` for local development
- ✅ Use Vercel Secrets for production variables
- ✅ Rotate keys periodically
- ❌ Never commit `.env.local` to git
- ❌ Never share service role keys
- ❌ Never expose secrets in client-side code

### Organization
- Group related variables together
- Use consistent naming conventions
- Document all custom variables
- Keep `.env.example` up to date

### Validation
- Validate environment variables on app startup
- Provide helpful error messages if vars are missing
- Use TypeScript for type safety
- Test environment variable loading

### Deployment
- Double-check all variables in production
- Use environment-specific configurations
- Update Vercel Secrets when rotating keys
- Monitor for configuration issues

---

## Troubleshooting

### "SUPABASE_SERVICE_ROLE_KEY is not defined"
- Check `.env.local` exists in project root
- Verify variable name is exactly correct
- Restart dev server after adding variables

### "Database connection failed"
- Verify all Supabase variables are correct
- Check Supabase project is active and running
- Test connection in Supabase dashboard

### "File upload not working"
- Check `ENABLE_FILE_UPLOADS=true`
- Check file size vs `MAX_FILE_UPLOAD_SIZE`
- Check `ALLOWED_FILE_TYPES` includes file extension

### "Tests not saving to database"
- Check `ENABLE_DATABASE_STORAGE=true`
- Verify Supabase connection works
- Check database schema is set up (run init.sql)
- Look for errors in browser console or server logs

---

## Questions?

See `DATABASE_SETUP.md` for detailed setup instructions.
