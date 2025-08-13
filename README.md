# 📜 LegalHub LK

**Every Gazette, Act & Bill — in one place.**  
LegalHub LK is a fast, open-access search platform for Sri Lanka’s official records.  
Built to help journalists, researchers, lawyers, students, and the public easily find and explore Gazettes, Acts, and Bills.

---

## 🌐 Live Preview
[https://legalhublk.netlify.app/](https://legalhublk.netlify.app/)

---

## ✨ Features
- **Instant Search** – Powered by client-side Lunr.js for lightning-fast results.
- **Filter & Sort** – Narrow results by type (Gazette, Act, Bill) and date range.
- **Mobile Friendly** – Fully responsive design for desktop and mobile.
- **Always Updated** – New documents are added automatically via scheduled sync.
- **High Performance** – Pre-processed data for fast loading and searching.

---

## 🚀 Getting Started

###Use Your Own IDE**
If you want to work locally:

```bash
# Step 1: Clone the repository
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project folder
cd <YOUR_PROJECT_NAME>

# Step 3: Install dependencies
npm install

# Step 4: Start the development server
npm run dev
```

---

## 🔄 Data Sync

LegalHub LK uses an automated GitHub Actions workflow to keep legal documents up-to-date.

### How It Works
- **Schedule**: Runs hourly via GitHub Actions cron job (`0 * * * *`)
- **Manual Trigger**: Can be triggered manually from GitHub Actions tab
- **Data Sources**: Fetches from `nuuuwan/lk_legal_docs_data` repository
- **Processing**: Python script normalizes and optimizes data for frontend consumption
- **Output**: Generates `public/data/catalog.json` (full dataset) and `public/data/latest.json` (latest 100 docs)

### Environment Variables
The sync workflow uses these environment variables:
```bash
SOURCE_BASE=https://raw.githubusercontent.com/nuuuwan/lk_legal_docs_data/main
SOURCE_ALL=data_1980s_2020s/all.json
SOURCE_LATEST=data_2020s/latest-100.json
OUTPUT_DIR=public/data
```

### Optional External Data Repository
For redundancy, the workflow can push processed data to an external repository if these secrets are configured:
- `LEGALHUB_DATA_REPO`: Target repository (e.g., `username/legalhub-data`)
- `LEGALHUB_DATA_BRANCH`: Target branch (e.g., `main`)
- `GH_PAT`: GitHub Personal Access Token with repo access

### Frontend Integration
The frontend automatically:
1. **Primary**: Loads data from local `/data/catalog.json` and `/data/latest.json` files
2. **Fallback**: Falls back to remote API endpoints if local files are unavailable
3. **Caching**: Implements intelligent caching for optimal performance
4. **Real-time**: Updates immediately when new data is synced

### Data Schema
Documents are normalized to a consistent schema:
```typescript
{
  id: string,
  type: 'Act' | 'Bill' | 'Gazette' | 'Extraordinary Gazette',
  title: string,
  date: string, // ISO format
  languages: string[], // ['en', 'si', 'ta']
  pdf_url: string,
  summary: string,
  source: string
}
```

---
