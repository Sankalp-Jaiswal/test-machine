# MongoDB Setup & Troubleshooting Guide

## Issues Fixed

### 1. ✅ Duration Mismatch
- **Problem**: Selected test duration wasn't being saved
- **Fix**: Now applies `selectedDuration` to the test before confirming import

### 2. ✅ Endless Loading
- **Problem**: App would hang if MongoDB wasn't accessible
- **Fix**: Added 5-second timeout to all API calls + proper async/await handling

## MongoDB Setup

### Option 1: Local MongoDB (Recommended for Development)

**Install MongoDB Community Edition:**
- **Windows**: Download from https://www.mongodb.com/try/download/community
- **Mac**: `brew install mongodb-community`
- **Linux**: `sudo apt install mongodb` or `sudo yum install mongodb-server`

**Start MongoDB:**
```powershell
# Windows (if installed via installer)
# MongoDB runs as a service automatically

# Or manually start it:
mongod --dbpath "C:\data\db"
```

**Verify it's running:**
```powershell
mongosh  # or mongo in older versions
# Should show MongoDB shell prompt
```

### Option 2: MongoDB Atlas (Cloud)

1. Go to https://www.mongodb.com/cloud/atlas
2. Create a free account and cluster
3. In `.env.local`, replace `MONGODB_URI` with your connection string:
```
MONGODB_URI=mongodb+srv://username:password@cluster0.mongodb.net/test-machine?retryWrites=true&w=majority
```

### Option 3: Docker (Quick Setup)

```bash
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

## Update .env.local

Your current `.env.local` has:
```
MONGODB_URI=mongodb://localhost:27017/testarena
```

**If using MongoDB Atlas**, change it to your connection string (keep `mongodb://localhost:27017/testarena` for local).

## Testing the Setup

1. **Start dev server:**
```bash
npm run dev
```

2. **Open browser console** and test:
```javascript
fetch('/api/test-banks').then(r => r.json()).then(console.log)
```

3. Should return `[]` (empty array) if MongoDB is empty, or your imported tests

## Troubleshooting

### "Module not found: Can't resolve 'mongodb'"
```bash
npm install mongodb
```

### "Connection refused" errors
- Make sure MongoDB is running
- Check `MONGODB_URI` in `.env.local` is correct
- Try: `telnet localhost 27017` to verify port is open

### Tests still not loading after setup
1. Clear browser cache: `Ctrl+Shift+Delete`
2. Restart dev server: Stop and run `npm run dev` again
3. Check browser console for specific errors

### Admin can't delete tests
- Tests are now stored in MongoDB - deletion syncs to DB
- Make sure MongoDB connection is working (see Testing section above)
- Check browser console for network errors

## Data Persistence

- **MongoDB**: Primary storage (survives between sessions)
- **localStorage**: Fallback cache when MongoDB unavailable
- **Demo data**: Loads automatically if MongoDB is empty or unreachable

## Key Changes Made

| Issue | Fix |
|-------|-----|
| Duration mismatch | Now applies selected time before saving |
| Endless loading | Added 5-second fetch timeout |
| Type errors | Fixed async/await in loadFromStorage |
| Hanging requests | All API calls now have timeouts |
| Stale data | Proper async initialization in AuthProvider |
