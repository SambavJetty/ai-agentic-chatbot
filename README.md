## 🚀 Getting Started

Follow these steps to set up and run the project locally.

### Installation

1.  **Clone the repository:**
    ```bash
    git clone <your-repo-url>
    cd <repo-name>
    ```

2.  **Install dependencies:**
    ```bash
    pnpm install
    ```

### Environment Variables

1.  Copy the sample environment file:
    ```bash
    cp .env.sample .env
    ```

2.  Populate the `.env` file with your credentials:
    ```env
    # MongoDB Atlas connection string (make sure IP access is configured)
    MONGODB_URI=mongodb+srv://...

    # OpenAI API Key
    OPENAI_API_KEY=sk-...

    # Optional: Set to true to clear the database before seeding
    RESET_DB=false

    # Optional: Add other keys if using different models
    # MISTRAL_API_KEY=...
    # HUGGINGFACE_API_KEY=hf_...
    ```

### Database Setup & Seeding

1.  **Configure MongoDB Atlas:**
    *   Ensure you have created a database and collection (names specified in `src/app/utils/config.ts`).
    *   Create a Vector Search Index on your collection (details in `src/app/utils/config.ts` for index name and fields).

2.  **Seed the database:** This script uses the configured LLM (currently OpenAI) to generate synthetic employee data and creates embeddings.
    ```bash
    pnpm seed-db
    ```
    *   *Note:* If you want to clear existing data before seeding, set `RESET_DB=true` in your `.env` file.

### Running the Application

1.  **Start the development server:**
    ```bash
    pnpm dev
    ```

2.  Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🛠️ Project Structure (Key Directories)

## 💡 Key Learnings & Concepts Explored

*   **Retrieval-Augmented Generation (RAG):** Combining LLM capabilities with external knowledge retrieval from a vector database.
*   **Langchain Agents:** Building autonomous agents that can use tools (like database lookups) to answer questions.
*   **LangGraph:** Managing multi-step agent interactions and conversation state.
*   **MongoDB Atlas Vector Search:** Setting up and querying a vector database for semantic similarity search.
*   **Next.js App Router:** Building API routes and server/client components.
*   **Environment Management:** Handling API keys and configuration securely.
*   **Database Seeding:** Programmatically generating and populating database records.
*   **Model Integration:** Swapping between different LLM providers and embedding models within Langchain.
