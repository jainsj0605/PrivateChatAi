import { useEffect, useState, useRef } from "react";
import UserInput from "./components/UserInput";
import useChatStore from "./hooks/useChatStore";
import ResetChatButton from "./components/ResetChatButton";
import ClearChatButton from "./components/ClearChatButton";
import DebugUI from "./components/DebugUI";
import ModelsDropdown from "./components/ModelsDropdown";
import MessageList from "./components/MessageList";
import { ModeToggle } from "./components/ModeToggle";
import ProjectInfo from "./components/ProjectInfo";
import { InfoCircledIcon } from "@radix-ui/react-icons";
import { Button } from "./components/ui/button";

const OLLAMA_URL = "http://localhost:11434";

function App() {
  const [progress, setProgress] = useState("Not connected to Ollama");
  const [showInfo, setShowInfo] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Store
  const userInput = useChatStore((state) => state.userInput);
  const setUserInput = useChatStore((state) => state.setUserInput);
  const selectedModel = useChatStore((state) => state.selectedModel);
  const setIsGenerating = useChatStore((state) => state.setIsGenerating);
  const chatHistory = useChatStore((state) => state.chatHistory);
  const setChatHistory = useChatStore((state) => state.setChatHistory);
  const setAvailableModels = useChatStore((state) => state.setAvailableModels);
  const setSelectedModel = useChatStore((state) => state.setSelectedModel);

  const systemPrompt = "You are a very helpful assistant.";

  async function fetchModels() {
    try {
      const response = await fetch(`${OLLAMA_URL}/api/tags`);
      if (!response.ok) throw new Error("Network response was not ok");
      const data = await response.json();
      setAvailableModels(data.models || []);

      if (data.models && data.models.length > 0 && !selectedModel) {
        const preferredModel = data.models.find((m: any) => m.name.includes("llama3.1"));
        setSelectedModel(preferredModel ? preferredModel.name : data.models[0].name);
      }
      setProgress("Connected to Ollama");
    } catch (error) {
      console.error("Failed to fetch Ollama models:", error);
      setProgress("Error: Could not connect to Ollama. Make sure the app is running on localhost:11434.");
    }
  }

  useEffect(() => {
    fetchModels();
  }, []);

  async function onSend() {
    if (!selectedModel) {
      alert("Please select a model first.");
      return;
    }

    if (!userInput.trim()) return;

    setIsGenerating(true);

    // Add the user message to the chat history
    const userMessage = { role: "user" as const, content: userInput };
    setChatHistory((history) => [
      ...history,
      userMessage,
      { role: "assistant" as const, content: "" },
    ]);
    setUserInput("");

    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch(`${OLLAMA_URL}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: selectedModel,
          messages: [
            { role: "system", content: systemPrompt },
            ...chatHistory,
            userMessage,
          ],
          stream: true,
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        throw new Error("Failed to send message to Ollama");
      }

      if (!response.body) throw new Error("No response body");
      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");

      let assistantMessage = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n").filter((line) => line.trim());

        for (const line of lines) {
          try {
            const data = JSON.parse(line);
            if (data.message && data.message.content) {
              assistantMessage += data.message.content;
              setChatHistory((history) => [
                ...history.slice(0, -1),
                { role: "assistant" as const, content: assistantMessage },
              ]);
            }
          } catch (e) {
            console.error("Error parsing JSON chunk:", e, line);
          }
        }
      }
    } catch (e: any) {
      if (e.name === "AbortError") {
        console.log("Generation interrupted");
      } else {
        console.error("EXCEPTION", e);
        setChatHistory((history) => [
          ...history.slice(0, -1),
          { role: "assistant" as const, content: `Error: ${e.message}. Is Ollama running?` },
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

  async function resetEngineAndChatHistory() {
    setUserInput("");
    setChatHistory(() => []);
  }

  function onStop() {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsGenerating(false);
    }
  }

  return (
    <div className="px-4 w-full">
      <div className="absolute top-0 left-0 p-4 flex items-center gap-2">
        <div className="flex gap-2">
          <ResetChatButton resetChat={resetChat} />
          <ClearChatButton clearChat={resetChat} />
        </div>
        <DebugUI progress={progress} />
        <ModelsDropdown resetEngineAndChatHistory={resetEngineAndChatHistory} />
        <ModeToggle />
        <Button variant="outline" size="icon" className="p-2" onClick={() => setShowInfo(true)} title="Project Info">
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
                alt="Secret Llama"
                className="mx-auto w-32 rounded-full mb-4 mt-2"
              />
              <div className="max-w-2xl flex flex-col justify-center ">
                <h1 className="text-3xl font-medium  mb-8 leading-relaxed text-center">
                  Welcome to Local AI Assistant
                </h1>
                <h2 className="text-base mb-4 prose">
                  <p>
                    This project demonstrates a fully private AI chatbot
                    that runs locally on your computer using Ollama.
                  </p>
                  <p className="font-semibold mt-4">Features:</p>
                  <ul>
                    <li>Runs AI models locally</li>
                    <li>Conversation data stays private</li>
                    <li>Works offline after initial download</li>
                    <li>No data sent to external servers</li>
                  </ul>
                </h2>
              </div>
            </div>
          ) : (
            <MessageList />
          )}
          <UserInput onSend={onSend} onStop={onStop} />
        </div>
      )}
    </div>
  );
}

export default App;