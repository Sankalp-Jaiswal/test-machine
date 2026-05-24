# MongoDB Integration & File Import Features

## ✅ Completed Features

### 1. MongoDB Integration
- **Connection**: All data now syncs with MongoDB via API endpoints
- **Location**: `lib/mongodb.ts` - MongoClient connection management
- **API Routes**:
  - `POST /api/test-banks` - Save test banks
  - `GET /api/test-banks` - Retrieve all test banks
  - `DELETE /api/test-banks/[id]` - Delete test bank
  - `POST /api/test-results` - Save test results
  - `GET /api/test-results` - Retrieve all results
- **Fallback**: Local cache via localStorage if server is unavailable

### 2. Enhanced File Import
Supports multiple file formats for test import:

#### **JSON Format** (Full Control)
```json
{
  "testName": "CIL Mock 1",
  "duration": 30,
  "questions": [
    {
      "id": 1,
      "section": "General",
      "difficulty": "easy",
      "question": "Question text?",
      "options": {
        "A": "Option A",
        "B": "Option B",
        "C": "Option C",
        "D": "Option D"
      },
      "correctAnswer": "C",
      "explanation": "Why C is correct"
    }
  ]
}
```

#### **PDF Format**
- Upload any PDF file with questions
- Auto-extracts text content
- Parser attempts to identify Q/A format

#### **DOCX Format**
- Upload Word documents with test questions
- Extracts all text content
- Supports formatted documents

#### **Text Format** (Auto-Parse)
```
Q1. What is the capital of India?
A) New Delhi
B) Mumbai
C) Bangalore
D) Delhi
Ans: A
Exp: New Delhi is the capital

Q2. Next question...
```

### 3. Time Duration Selection
After importing, users can:
- Select from preset durations: 15, 20, 30, 45, 60, 90, 120 minutes
- Enter custom time duration
- Preview questions before confirming
- All tests are saved to MongoDB with the selected duration

## 📁 New/Modified Files

### New Files
- `lib/mongodb.ts` - MongoDB connection utility
- `lib/fileParser.ts` - PDF/DOCX/text parsing utilities
- `app/api/test-banks/route.ts` - Test banks CRUD API
- `app/api/test-banks/[id]/route.ts` - Delete test bank API
- `app/api/test-results/route.ts` - Test results API
- `.env.local` - Environment configuration

### Modified Files
- `store/useAppStore.ts` - Now uses MongoDB API instead of localStorage
- `components/ImportTest.tsx` - Enhanced with file upload and time selection

## 🚀 Setup Instructions

### 1. Configure Environment
Edit `.env.local` and set your MongoDB connection string:
```
MONGODB_URI=mongodb+srv://username:password@cluster0.mongodb.net/test-machine
```

### 2. Install Dependencies
```bash
npm install mongodb pdfjs-dist mammoth --legacy-peer-deps
```

### 3. Start Development Server
```bash
npm run dev
```

### 4. Test the Features
1. Navigate to `/import` page
2. Try uploading a PDF, DOCX, or JSON file
3. Select test duration from presets or enter custom time
4. Confirm import - data syncs to MongoDB

## 📊 How It Works

### Import Flow
1. User uploads/pastes file content
2. File parser extracts question data
3. Questions preview is shown
4. User selects test duration
5. Test bank is saved to MongoDB
6. Local cache is updated for offline support

### Data Sync
- **On Import**: Questions → MongoDB via POST `/api/test-banks`
- **On Test Complete**: Results → MongoDB via POST `/api/test-results`
- **On Load**: Store fetches from `/api/test-banks` and `/api/test-results`
- **Offline**: Falls back to localStorage if server unavailable

## 🔧 Technologies Used
- **PDF**: `pdfjs-dist` - PDF text extraction
- **DOCX**: `mammoth` - Word document parsing
- **Backend**: MongoDB with Next.js API routes
- **State**: Zustand with async persistence

## 📝 Notes
- PDF parsing extracts all text; structured format detection is best-effort
- DOCX parsing supports standard Word documents
- Text format parser looks for "Q1", "A)", "Ans:" patterns
- All times are in minutes
- Questions are automatically validated before import
