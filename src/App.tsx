import { useEffect, useState, useRef, useCallback } from "react";
import UserInput from "./components/UserInput";
import useChatStore, { selectChatHistory } from "./hooks/useChatStore";
import ResetChatButton from "./components/ResetChatButton";
import ClearChatButton from "./components/ClearChatButton";
import DebugUI from "./components/DebugUI";
import ModelsDropdown from "./components/ModelsDropdown";
import MessageList from "./components/MessageList";
import { ModeToggle } from "./components/ModeToggle";
import ProjectInfo from "./components/ProjectInfo";
import Sidebar from "./components/Sidebar";
import { InfoCircledIcon, HamburgerMenuIcon } from "@radix-ui/react-icons";
import { Button } from "./components/ui/button";

const OLLAMA_URL = import.meta.env.VITE_OLLAMA_URL || "http://localhost:11434";

// Context window: only last N messages sent to Ollama for faster responses
const MAX_CONTEXT_MESSAGES = 20;

function App() {
  const [progress, setProgress] = useState("Not connected to Ollama");
  const [showInfo, setShowInfo] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Batched streaming state
  const streamBufferRef = useRef<string>("");
  const rafRef = useRef<number | null>(null);

  // Store
  const userInput = useChatStore((state) => state.userInput);
  const setUserInput = useChatStore((state) => state.setUserInput);
  const selectedModel = useChatStore((state) => state.selectedModel);
  const setIsGenerating = useChatStore((state) => state.setIsGenerating);
  const chatHistory = useChatStore(selectChatHistory);
  const setChatHistory = useChatStore((state) => state.setChatHistory);
  const setAvailableModels = useChatStore((state) => state.setAvailableModels);
  const setSelectedModel = useChatStore((state) => state.setSelectedModel);
  const activeSessionId = useChatStore((state) => state.activeSessionId);
  const pendingImages = useChatStore((state) => state.pendingImages);
  const setPendingImages = useChatStore((state) => state.setPendingImages);

  const systemPrompt = "You are a very helpful assistant.";

  async function fetchModels() {
    try {
      const response = await fetch(`${OLLAMA_URL}/api/tags`);
      if (!response.ok) throw new Error("Network response was not ok");
      const data = await response.json();
      setAvailableModels(data.models || []);
      if (data.models && data.models.length > 0 && !selectedModel) {
        const preferredModel = (data.models as { name: string }[]).find((m) =>
          m.name.includes("llama3.1")
        );
        setSelectedModel(
          preferredModel ? preferredModel.name : data.models[0].name
        );
      }
      setProgress("Connected to Ollama");
    } catch (error) {
      console.error("Failed to fetch Ollama models:", error);
      setProgress(
        "Error: Could not connect to Ollama. Make sure it is running on localhost:11434."
      );
    }
  }

  useEffect(() => {
    fetchModels();
  }, []);

  // Flush streamed buffer to state on each animation frame
  const flushBuffer = useCallback(() => {
    setChatHistory((history) => [
      ...history.slice(0, -1),
      { role: "assistant" as const, content: streamBufferRef.current },
    ]);
    rafRef.current = null;
  }, [setChatHistory]);

  async function onSend() {
    if (!selectedModel) {
      alert("Please select a model first.");
      return;
    }
    if (!userInput.trim() && pendingImages.length === 0) return;

    setIsGenerating(true);

    const userMessage = {
      role: "user" as const,
      content: userInput,
      ...(pendingImages.length > 0 ? { images: pendingImages } : {}),
    };

    // Auto-name session from first user message
    const { sessions, activeSessionId: sid, renameSession } = useChatStore.getState();
    const session = sessions.find((s) => s.id === sid);
    if (session && session.chatHistory.length === 0 && userInput.trim()) {
      renameSession(sid, userInput.slice(0, 40) + (userInput.length > 40 ? "…" : ""));
    }

    setChatHistory((history) => [
      ...history,
      userMessage,
      { role: "assistant" as const, content: "" },
    ]);
    setUserInput("");
    setPendingImages([]);

    abortControllerRef.current = new AbortController();
    streamBufferRef.current = "";

    try {
      // Trim context: only send last MAX_CONTEXT_MESSAGES for faster responses
      const contextHistory = chatHistory.slice(-MAX_CONTEXT_MESSAGES);

      const body: Record<string, unknown> = {
        model: selectedModel,
        messages: [
          { role: "system", content: systemPrompt },
          ...contextHistory,
          // Include images in the last user message for Ollama API
          pendingImages.length > 0
            ? { role: "user", content: userMessage.content, images: pendingImages }
            : { role: "user", content: userMessage.content },
        ],
        stream: true,
      };

      const response = await fetch(`${OLLAMA_URL}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) throw new Error("Failed to send message to Ollama");
      if (!response.body) throw new Error("No response body");

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n").filter((line) => line.trim());

        for (const line of lines) {
          try {
            const data = JSON.parse(line);
            if (data.message?.content) {
              streamBufferRef.current += data.message.content;
              // Batch React state updates via rAF — avoids re-render per token
              if (!rafRef.current) {
                rafRef.current = requestAnimationFrame(flushBuffer);
              }
            }
          } catch (e) {
            console.error("Error parsing JSON chunk:", e, line);
          }
        }
      }

      // Final flush after stream ends
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      flushBuffer();
    } catch (e: unknown) {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      const err = e as { name?: string; message?: string };
      if (err.name === "AbortError") {
        console.log("Generation interrupted");
        // Flush whatever we have
        flushBuffer();
      } else {
        console.error("EXCEPTION", e);
        setChatHistory((history) => [
          ...history.slice(0, -1),
          {
            role: "assistant" as const,
            content: `Error: ${err.message}. Is Ollama running?`,
          },
        ]);
      }
    } finally {
      setIsGenerating(false);
      abortControllerRef.current = null;
    }
  }

  async function resetChat() {
    setUserInput("");
    setChatHistory(() => []);
  }

  function onStop() {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsGenerating(false);
    }
  }

  // Re-run fetch when coming back online
  useEffect(() => {
    window.addEventListener("online", fetchModels);
    return () => window.removeEventListener("online", fetchModels);
  }, []);

  // Abort generation when user switches sessions
  useEffect(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsGenerating(false);
      abortControllerRef.current = null;
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    }
  }, [activeSessionId]);

  // Key: re-mount MessageList when session changes for clean scroll
  const sessionKey = activeSessionId;

  return (
    <div className="px-4 w-full">
      {/* Sidebar */}
      <Sidebar isOpen={showSidebar} onClose={() => setShowSidebar(false)} />

      <div className="absolute top-0 left-0 p-4 flex items-center gap-2 z-10">
        {/* Hamburger for sidebar */}
        <Button
          variant="outline"
          size="icon"
          className="p-2"
          onClick={() => setShowSidebar(true)}
          title="Chat Sessions"
        >
          <HamburgerMenuIcon className="h-[1.2rem] w-[1.2rem]" />
        </Button>

        <div className="flex gap-2">
          <ResetChatButton resetChat={resetChat} />
          <ClearChatButton clearChat={resetChat} />
        </div>
        <DebugUI progress={progress} />
        <ModelsDropdown />
        <ModeToggle />
        <Button
          variant="outline"
          size="icon"
          className="p-2"
          onClick={() => setShowInfo(true)}
          title="Project Info"
        >
          <InfoCircledIcon className="h-[1.2rem] w-[1.2rem]" />
        </Button>
      </div>

      {showInfo ? (
        <ProjectInfo onClose={() => setShowInfo(false)} />
      ) : (
        <div className="max-w-3xl mx-auto flex flex-col h-screen">
          {chatHistory.length === 0 ? (
            <div className="flex justify-center items-center h-full flex-col overflow-y-auto">
              <img
                src="favicon.png"
                alt="Local AI Assistant"
                className="mx-auto w-32 rounded-full mb-4 mt-2"
              />
              <div className="max-w-2xl flex flex-col justify-center">
                <h1 className="text-3xl font-medium mb-8 leading-relaxed text-center">
                  Welcome to Local AI Assistant
                </h1>
                <h2 className="text-base mb-4 prose">
                  <p>
                    This project demonstrates a fully private AI chatbot that
                    runs locally on your computer using Ollama.
                  </p>
                  <p className="font-semibold mt-4">Features:</p>
                  <ul>
                    <li>Runs AI models locally</li>
                    <li>Conversation data stays private</li>
                    <li>Works offline after initial download</li>
                    <li>No data sent to external servers</li>
                    <li>Multiple chat sessions</li>
                    <li>Image input for vision models</li>
                  </ul>
                </h2>
              </div>
            </div>
          ) : (
            <MessageList key={sessionKey} />
          )}
          <UserInput onSend={onSend} onStop={onStop} />
        </div>
      )}
    </div>
  );
}

export default App;