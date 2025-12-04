# Quest Canada Web Application - Demo Script (3-5 min)

## Quick Setup
- **URL**: http://cpsc405.joeyfishertech.com
- **Login**: admin@questcanada.org / test123
- **PDF**: `client-communications/Draft-Benchmark Assessment Final Report .pdf`

---

## Demo Flow

### 1. Login & Quick Context (30 sec)

1. Open http://cpsc405.joeyfishertech.com
2. Login with admin credentials
3. Quick intro:

> "This is the Quest Canada Benchmark Analytics Platform. It helps municipalities track climate action progress across 10 indicators - from Governance to Buildings."

---

### 2. AI-Powered PDF Upload (2 min) - THE MAIN EVENT

1. **Navigate to Import Assessment** (sidebar)
2. **Upload the PDF** - drag and drop `Draft-Benchmark Assessment Final Report .pdf`
3. **Wait for AI extraction** (~30-60 sec)

> "This is the core feature - we're using Claude AI to automatically extract structured data from 70+ page assessment reports. What used to take hours of manual data entry now takes seconds."

4. **Review extracted data** - show:
   - Community: Corner Brook, NL
   - Overall Score: 66%
   - Indicator scores
5. **Click "Import Assessment"**

> "Staff can review and edit before importing - keeping humans in the loop for quality control."

---

### 3. View Results & Analytics (1-2 min)

1. **Show the imported assessment** - Overview tab with score
2. **Quick look at Dashboard tab** - radar/bar charts
3. **Navigate to Analytics** (sidebar)
4. **Select multiple communities** to compare
5. **Show the comparison charts**

> "Municipalities can now compare their performance against others and identify where to focus their efforts."

---

### 4. Wrap Up (30 sec)

Quick mentions:
- Dark mode toggle (accessibility)
- Mobile responsive
- PDF export for offline reports

> "The platform transforms complex benchmark reports into actionable insights for municipal decision-makers."

---

## Key Talking Points

| Feature | Benefit |
|---------|---------|
| AI PDF extraction | 70+ page reports → structured data in seconds |
| Visual dashboards | Quick insights at a glance |
| Community comparison | Learn from top performers |
| Recommendations | Prioritized with lead parties & timeframes |

---

## If Asked About Tech Stack

- Wasp framework (React + Node.js + PostgreSQL)
- Claude Haiku 4.5 for AI extraction
- Self-hosted on Proxmox

---

## Backup

If upload takes too long, show an existing assessment (Greenfield Valley) and explain the upload process verbally.
