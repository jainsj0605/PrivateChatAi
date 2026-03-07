# Local AI Assistant (Private Chat)

A fully private, offline-capable AI chat interface built with React, Vite, and Tailwind CSS. This application connects to a local **Ollama** instance to run Large Language Models (LLMs) securely on your hardware.

## Features

- **Privacy First:** 100% of your conversation data stays on your local machine. No data is sent to external cloud servers like OpenAI or Anthropic.
- **Local AI execution:** Leverages Ollama to run models like Llama 3 locally.
- **Offline Mode:** Once the AI models are downloaded via Ollama, the entire chat application works completely without an internet connection.
- **Real-time Streaming:** Streams responses as they are generated, providing a ChatGPT-like experience.
- **Dynamic Model Selection:** Automatically detects and lets you switch between the available AI models installed in your local Ollama instance.
- **Dark/Light Mode:** Includes a theme toggle for a better user experience.
- **Markdown Support:** Renders AI responses with proper formatting, including syntax highlighting for code blocks.

## Tech Stack

- **Frontend:** React 18, TypeScript, Vite
- **Styling:** Tailwind CSS, Radix UI, `tailwindcss-animate`, `@tailwindcss/typography`
- **State Management:** Zustand
- **Backend/AI Engine:** Ollama (must be installed separately)

## Prerequisites

Before running this application, you must have **Ollama** installed and running on your machine.

1. Download and install Ollama from [ollama.ai](https://ollama.ai).
2. Start the Ollama application. By default, it runs on `http://localhost:11434`.
3. Pull an AI model to use (e.g., Llama 3.1):
   ```bash
   ollama run llama3.1
   ```

## Getting Started

1. **Clone the repository:**
   ```bash
   git clone <your-repository-url>
   cd local_ai_assistant
   ```

2. **Install dependencies:**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   # or
   yarn dev
   ```

4. **Open the app:**
   Open your browser and navigate to `http://localhost:5173`. Make sure Ollama is running in the background!

## License

Personal Project - All Rights Reserved.
