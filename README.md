# Learning Langchain with Next.js & MongoDB: HR Chatbot

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

This project documents my learning journey exploring Langchain, MongoDB Atlas Vector Search, and Next.js by building a simple HR assistant chatbot. The goal was to understand Retrieval-Augmented Generation (RAG), agent creation, state management with LangGraph, and integrating various AI models and databases within a modern web framework.

## ✨ Features

*   **Chat Interface:** A simple UI built with Next.js and Tailwind CSS to interact with the HR agent.
*   **HR Agent:** A Langchain agent capable of answering questions based on employee data.
*   **Employee Data Lookup:** Uses MongoDB Atlas Vector Search to find relevant employee information based on natural language queries.
*   **Database Seeding:** A script (`seed-database.ts`) to generate synthetic employee data and populate the vector database using an LLM.
*   **Model Flexibility:** Designed to potentially swap between different LLMs (OpenAI, HuggingFace, Mistral, Ollama) and embedding models.
*   **State Management:** Uses LangGraph with MongoDB persistence to manage conversation history.

## 📚 Tech Stack

*   **Framework:** [Next.js](https://nextjs.org/) (App Router)
*   **Language:** [TypeScript](https://www.typescriptlang.org/)
*   **AI/LLM Orchestration:** [Langchain](https://js.langchain.com/) & [LangGraph](https://js.langchain.com/docs/langgraph)
*   **Database:** [MongoDB Atlas](https://www.mongodb.com/atlas) (with Vector Search)
*   **Styling:** [Tailwind CSS](https://tailwindcss.com/)
*   **LLM (Primary):** [OpenAI](https://openai.com/) (Configurable for others like Mistral, HuggingFace, Ollama)
*   **Embeddings (Primary):** [OpenAI](https://openai.com/) (Configurable for others like HuggingFace)
*   **Package Manager:** [pnpm](https://pnpm.io/)

## 🚀 Getting Started

Follow these steps to set up and run the project locally.

### Prerequisites

*   [Node.js](https://nodejs.org/) (LTS version recommended)
*   [pnpm](https://pnpm.io/installation)
*   A [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register) account with a running cluster.
*   API Keys:
    *   OpenAI API Key
    *   (Optional: Mistral API Key, HuggingFace API Key if configuring different models)

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

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
