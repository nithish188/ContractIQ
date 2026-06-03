# ContractIQ – AI-Powered Document Risk Intelligence Platform

ContractIQ is a production-ready web application designed to automatically review and analyze legal agreements, business contracts, and compliance documents. By parsing PDF, DOCX, or TXT documents and extracting key terms, clauses, and metadata using Google's Gemini API, ContractIQ maps risk vectors into an interactive dashboard, identifying obligations, deadlines, and recommending rectifications.

---

## 🚀 Key Features

* **Secure Authentication**: JWT-based User registration and Login with role structures (Admin/User).
* **Document Parser Pipeline**: Direct extraction of plain text from PDF (using PyMuPDF), Word DOCX (using python-docx), and raw text documents.
* **Segmenter & Classifier**: Automated clause breakdown into types (Payment, Liability, Termination, Confidentiality, Jurisdiction, Compliance, etc.).
* **Risk Engine**: Custom ratings (LOW | MEDIUM | HIGH) with numeric risk scores (0-100) and structured legal analysis.
* **Metadata Entities**: Extract crucial milestones (Dates, Money values, Percentages, Obligations, Parties, Contract terms).
* **Executive Summary**: Compiles Overview, Purpose, Key Obligations, Milestones, and actionable Remediation advice.
* **Audit PDF Export**: Downloadable professional PDF reports containing executive summaries, scoring matrices, and clause breakdowns.
* **Glassmorphism Interface**: Obsidian-dark theme with interactive circular risk dials, timeline vectors, and search filters.

---

## 📁 Project Folder Layout

```
contractiq/
├── backend/
│   ├── app/
│   │   ├── api/          # FastAPI routers (auth, documents, etc.)
│   │   ├── models/       # SQLAlchemy relational database tables
│   │   ├── schemas/      # Pydantic input/output serialization types
│   │   ├── services/     # PyMuPDF parser & ReportLab PDF generator
│   │   ├── ai/           # Gemini API integrations & fallback simulator
│   │   ├── auth/         # Passlib bcrypt hashing & JWT token guards
│   │   ├── database/     # DB engine and session generators
│   │   ├── utils/        # Settings & dotenv loaders
│   │   └── main.py       # API entry point & CORS configuration
│   ├── requirements.txt  # Python packages
│   └── .env              # Configuration variables
├── frontend/
│   ├── src/
│   │   ├── pages/        # Login, Register, Dashboard, Details, Upload
│   │   ├── components/   # Headers, Navs, Widgets
│   │   ├── services/     # Axios client & JWT headers interceptor
│   │   ├── App.jsx       # Route guards & Router mounting
│   │   ├── index.css     # Global styles & glass design tokens
│   │   └── main.jsx      # React launcher
│   ├── index.html
│   └── package.json      # NPM packages
├── docker/
│   ├── docker-compose.yml
│   ├── backend.Dockerfile
│   └── frontend.Dockerfile
└── README.md
```

---

## 🛠️ Local Development Setup

### Backend Setup (FastAPI)

1. Navigate to the `backend/` directory:
   ```bash
   cd backend
   ```
2. Create and activate a Python virtual environment:
   ```bash
   python -m venv venv
   # On Windows:
   .\venv\Scripts\activate
   # On macOS/Linux:
   source venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Copy the environment variables:
   Review `backend/.env`. Fill in your `GEMINI_API_KEY`. If left blank, the application will run in a high-fidelity simulator mode allowing testing without active API credits.
5. Start the local development server:
   ```bash
   uvicorn app.main:app --reload
   ```
   * The API will run at `http://127.0.0.1:8000`.
   * **Swagger API Documentation** will be auto-generated and served at `http://127.0.0.1:8000/docs`.

### Frontend Setup (Vite React)

1. Navigate to the `frontend/` directory:
   ```bash
   cd ../frontend
   ```
2. Install npm packages:
   ```bash
   npm install
   ```
3. Run Vite dev server:
   ```bash
   npm run dev
   ```
   * Open your browser and navigate to `http://localhost:5173`.

---

## 🐳 Docker Production Deployment

To package and run the entire application containing PostgreSQL, FastAPI, and Nginx hosted React frontend using Docker Compose:

1. Return to the root directory and start the services:
   ```bash
   cd docker
   docker-compose up --build
   ```
2. Access the React Frontend at `http://localhost:80` (or standard port 80).
3. Access the FastAPI Swagger docs at `http://localhost:8000/docs`.

---

## 🔒 API Endpoints Index

* **POST** `/auth/register` - Create user profile
* **POST** `/auth/login` - Authenticate and return JWT session token
* **GET** `/auth/profile` - Fetch current user account details
* **POST** `/documents/upload` - Upload contract (PDF, DOCX, TXT), extracts text and triggers AI risk pipeline
* **GET** `/documents` - Retrieve uploaded documents history list
* **GET** `/documents/{id}` - Fetch details and meta summary of a document
* **GET** `/documents/{id}/clauses` - List segmented clauses with risk scores and reasoning
* **GET** `/documents/{id}/summary` - Fetch structured executive summary
* **GET** `/documents/{id}/report` - Download compiled PDF audit report
* **DELETE** `/documents/{id}` - Remove file and its records from disk and DB
