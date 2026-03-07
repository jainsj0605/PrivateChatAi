import { create } from "zustand";
import { persist } from "zustand/middleware";
import { OllamaModel } from "../models";

export type ChatMessage = {
  role: "user" | "assistant" | "system";
  content: string;
};

interface State {
  // Model
  selectedModel: string;
  setSelectedModel: (model: string) => void;
  availableModels: OllamaModel[];
  setAvailableModels: (models: OllamaModel[]) => void;

  // User input
  userInput: string;
  setUserInput: (input: string) => void;

  // Inference state
  isGenerating: boolean;
  setIsGenerating: (isGenerating: boolean) => void;

  // Chat history
  chatHistory: ChatMessage[];
  setChatHistory: (fn: (chatHistory: ChatMessage[]) => ChatMessage[]) => void;
}

const useChatStore = create<State>()(
  persist(
    (set) => ({
      // Model
      selectedModel: "",
      setSelectedModel: (model: string) => set({ selectedModel: model }),
      availableModels: [],
      setAvailableModels: (models: OllamaModel[]) => set({ availableModels: models }),

      // User input
      userInput: "",
      setUserInput: (input: string) => set({ userInput: input }),

      // Inference state
      isGenerating: false,
      setIsGenerating: (isGenerating: boolean) => set({ isGenerating }),

      // Chat history
      chatHistory: [],
      setChatHistory: (fn) =>
        set((state) => ({
          chatHistory: fn(state.chatHistory),
        })),
    }),
    {
      name: "secret-llama-chat-store",
      partialize: (state) => ({
        chatHistory: state.chatHistory,
        selectedModel: state.selectedModel,
      }),
    }
  )
);

export default useChatStore;