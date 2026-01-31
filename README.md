# AI Receipt Scanner and Categorizer

AI Receipts is an AI‑powered receipt scanning and categorization system. It lets you upload receipt images, extract structured data using a local LLM (via Ollama), review/edit the result in a modern React UI, and persist everything to a SQLite database.

The backend is built with **ASP.NET Core (.NET 10)** and **SQLite**; the frontend is built with **React + TypeScript + TailwindCSS**. The whole stack is containerized with **Docker** and supports **GPU acceleration** via Ollama.

---

## Features

### Receipt ingestion

- **Image upload (Web UI)**  
  - Upload receipt images directly from the React frontend.  
  - Drag‑and‑drop support and preview of the uploaded image.  
  - Supported formats: `JPEG`, `PNG`, `BMP`, `GIF`, `TIFF`, `WebP` (validated on both frontend and backend).
- **File storage**
  - Uploaded images are persisted under `/app/uploads` (volume‑backed in Docker).
  - Stored path is associated with each receipt record.

### OCR and AI extraction

- **Vision‑enabled OCR via Ollama**
  - Uses a local Ollama model (e.g., `ministral-3:14b` with vision capabilities) to:
    - Extract the raw text from receipt images.
    - Populate a structured JSON model (see below).
    - Infer a best‑fit category from predefined categories.
  - Vision call is made via `OllamaApiClient` with streaming enabled.
- **Prompt‑driven extraction**
  - `Prompts/OCRSystemPrompt.txt`  
    - Defines the required JSON shape:
      ```jsonc
      {
        "extractedText": "...",
        "title": "...",
        "description": "...",
        "vendor": "...",
        "state": "...",
        "city": "...",
        "country": "...",
        "tax": 0.0,
        "total": 0.0,
        "purchaseDate": "...",
        "categoryId": 0
      }
      ```
    - Explains how to map receipt content into these fields.
    - Lists the available categories and how they should be used.
  - `Prompts/OCRUserPrompt.txt`  
    - Short user‑level instruction referencing the system prompt.  
    - Keeps the model focused on “apply the rules and return JSON only”.
- **Streaming + logging**
  - Responses from Ollama are streamed and accumulated server‑side.
  - Detailed logging of:
    - Chunk count and sizes.
    - Raw vs “cleaned” output (without ```json``` fences).
    - JSON parsing/validation failures.

### Data model and persistence

- **Receipt model (`Receipt`)**
  - Fields:
    - `ReceiptId`
    - `ExtractedText`
    - `Title`
    - `Description`
    - `Vendor`
    - `State`
    - `City`
    - `Country`
    - `ImageUrl`
    - `Tax`
    - `Total`
    - `PurchaseDate`
    - `CreatedAt`
    - `UpdatedAt`
    - `CategoryId`
  - Validated with **FluentValidation** before updates.
- **Categories**
  - Predefined categories such as:
    - Childcare, Clothing, Debt, Donations, Education, Entertainment,
      Financial, Food, Healthcare, Housing, Insurance, Legal, Petcare,
      Transportation, Utilities.
  - Exposed via `/api/Categories` and consumed by the frontend for a select list.
- **Database**
  - **SQLite** database stored under `/app/db/receipts.db`.
  - EF Core (`AiReceiptsDbContext`) for data access.
  - `docker-compose.yml` maps a host folder for persistent SQLite data.

### Backend APIs

- **Health and diagnostics**
  - `GET /` – Simple health text: “AI Receipts is running…”.

---

## Docker & GPU support

This project is designed to run in Docker with optional GPU acceleration for faster OCR and LLM inference.

### Prerequisites

- Docker (with Compose/`docker compose`).
- NVIDIA GPU drivers and **nvidia-container-toolkit** configured on the host if you want GPU acceleration.

See the Ollama Docker GPU documentation for host/GPU setup details:  
<https://docs.ollama.com/docker>

### Services (docker-compose)

`docker-compose.yml` defines:

- **ai.receipts**
  - ASP.NET Core backend (API + OCR orchestration).
  - Exposes port `9020` (mapped to container port `8081`).
  - Volumes:
    - `./sqlite_data:/app/db/` – SQLite persistence.
    - `ai_receipts_logs:/app/logs/ai_receipts/` – application logs.
    - `ai_receipts_uploads:/app/uploads/` – uploaded receipt images.
- **ollama**
  - Ollama server with GPU access:
    - Ports: `11434:11434`.
    - Volumes: `.ollama` model store.
    - Environment:
      - `OLLAMA_DEBUG=1` for extra diagnostics.
      - Optional `OLLAMA_KEEP_ALIVE`, `OLLAMA_MAX_LOADED_MODELS` for performance tuning.
- **openwebui**
  - Optional: Web UI for interacting directly with Ollama (good for prompt/model tuning).
  - `OLLAMA_BASE_URL=http://ollama:11434`.
- **seq**
  - Centralized logging and telemetry UI.
  - Ports:
    - `5341` (OTLP ingest).
    - `8081` (web UI).

### Running with Docker

From the repository root:

````````bash
docker-compose up -d
````````

Then:

- Backend API: <http://localhost:9020/>
- Seq UI: <http://localhost:8081/>
- Open WebUI (optional): <http://localhost:8080/>
- Ollama API (internal to Docker network): `http://ollama:11434`

To ensure the model is available, exec into the `ollama` container and pull it:

````````bash
docker exec -it <ollama_container_name> ollama pull ministral-3:14b
````````

#### Local development (without Docker)

You can also run the backend and frontend locally:

### Backend (.NET)

````````bash
# Restore/mpn install
dotnet restore
npm install

# Run
dotnet run

# Now visit
http://localhost:5041
````````

### Frontend (React)

````````bash
# Install
npm install

# Run
npm run dev

# Now visit
http://localhost:3000
````````

### Adding/removing Ollama models

To add or remove Ollama models used by the backend:

1. Edit the `docker-compose.yml` file:
   - For **new models**, add a volume under the `ollama` service, e.g.:
     ```yml
     ollama:
       volumes:
         - ./.ollama:/root/.ollama
         - ./path/to/new_model:/path/in/container
     ```
   - For **removing models**, simply delete the corresponding volume line.
2. Restart the `ollama` service:
````````bash
docker-compose restart ollama
````````

---

## Troubleshooting

Common issues and their solutions:

- **OCR errors**:
  - Ensure the receipt image is clear and well‑lit.
  - Check the model logs for details on the failure.
- **API errors**:
  - Use the `/debug/...` endpoints for connectivity and config checks.
  - Review Seq logs for unhandled exceptions or errors.
- **Model loading issues**:
  - Ensure the model is present in the `.ollama` directory.
  - Check permissions on the model files (especially on Linux).

# Default API base URL (in development): <http://localhost:9020/>

Make sure:

- `OllamaSettings:Url` in `appsettings.Development.json` points to your local Ollama instance (e.g. `http://localhost:11434`).
- SQLite connection string points to a valid path.

### Frontend (React + Vite)

Default frontend URL: <http://localhost:5173/>

Configure the frontend to call the backend via either:

- Vite dev server proxy, or  
- `VITE_API_BASE_URL` environment variable.

---

## Technologies

- **Backend**
  - .NET 10 / ASP.NET Core
  - EF Core + SQLite
  - FluentValidation
  - OllamaSharp
  - OpenTelemetry + Seq
- **Frontend**
  - React
  - TypeScript
  - TailwindCSS
- **Infrastructure**
  - Docker & Docker Compose
  - Ollama
  - Seq
  - Open WebUI (optional)

---

## Roadmap / Ideas

- Receipt listing and search UI (by date, vendor, category, amount).
- CSV / PDF export from the web UI.
- Authentication and multi‑tenant support.
- Improved prompt tuning and multi‑model support (e.g., separate OCR and classification models).

Contributions and issues are welcome via the GitHub repository.
