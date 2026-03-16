import { create } from "zustand";
import { persist } from "zustand/middleware";
import { OllamaModel } from "../models";

export type ChatMessage = {
  role: "user" | "assistant" | "system";
  content: string;
  images?: string[]; // base64 encoded images
};

export type ChatSession = {
  id: string;
  name: string;
  createdAt: number;
  model: string; // which model this session belongs to
  chatHistory: ChatMessage[];
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

  // Pending images (base64)
  pendingImages: string[];
  setPendingImages: (images: string[]) => void;

  // Inference state
  isGenerating: boolean;
  setIsGenerating: (isGenerating: boolean) => void;

  // Sessions
  sessions: ChatSession[];
  activeSessionId: string;
  createSession: (model: string) => void;
  deleteSession: (id: string) => void;
  renameSession: (id: string, name: string) => void;
  switchSession: (id: string) => void;

  // Chat history — use selectChatHistory selector instead of this directly
  setChatHistory: (fn: (chatHistory: ChatMessage[]) => ChatMessage[]) => void;
}

function generateId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function makeSession(name: string, model: string): ChatSession {
  return {
    id: generateId(),
    name,
    createdAt: Date.now(),
    model,
    chatHistory: [],
  };
}

const defaultSession = makeSession("New Chat", "");

const useChatStore = create<State>()(
  persist(
    (set) => ({
      // Model — switching model also switches to that model's sessions
      selectedModel: "",
      setSelectedModel: (model: string) =>
        set((state) => {
          // Find sessions belonging to this model (legacy sessions with no model are shared)
          const modelSessions = state.sessions.filter(
            (s) => s.model === model || !s.model
          );

          if (modelSessions.length === 0) {
            // No sessions for this model yet — create a fresh one
            const newSession = makeSession("New Chat", model);
            return {
              selectedModel: model,
              sessions: [newSession, ...state.sessions],
              activeSessionId: newSession.id,
            };
          }

          // Switch to the most recently created session for this model
          const mostRecent = modelSessions.reduce((a, b) =>
            a.createdAt > b.createdAt ? a : b
          );
          return {
            selectedModel: model,
            activeSessionId: mostRecent.id,
          };
        }),

      availableModels: [],
      setAvailableModels: (models: OllamaModel[]) =>
        set({ availableModels: models }),

      // User input
      userInput: "",
      setUserInput: (input: string) => set({ userInput: input }),

      // Pending images
      pendingImages: [],
      setPendingImages: (images: string[]) => set({ pendingImages: images }),

      // Inference state
      isGenerating: false,
      setIsGenerating: (isGenerating: boolean) => set({ isGenerating }),

      // Sessions
      sessions: [defaultSession],
      activeSessionId: defaultSession.id,

      createSession: (model: string) => {
        const newSession = makeSession("New Chat", model);
        set((state) => ({
          sessions: [newSession, ...state.sessions],
          activeSessionId: newSession.id,
        }));
      },

      deleteSession: (id: string) => {
        set((state) => {
          const remaining = state.sessions.filter((s) => s.id !== id);
          if (remaining.length === 0) {
            // Recreate a fresh session for the current model
            const fresh = makeSession("New Chat", state.selectedModel);
            return { sessions: [fresh], activeSessionId: fresh.id };
          }
          // If deleting the active session, switch to the first sibling
          const newActiveId =
            state.activeSessionId === id
              ? remaining[0].id
              : state.activeSessionId;
          return { sessions: remaining, activeSessionId: newActiveId };
        });
      },

      renameSession: (id: string, name: string) => {
        set((state) => ({
          sessions: state.sessions.map((s) =>
            s.id === id ? { ...s, name } : s
          ),
        }));
      },

      switchSession: (id: string) => {
        set({ activeSessionId: id });
      },

      setChatHistory: (fn) => {
        set((state) => ({
          sessions: state.sessions.map((s) =>
            s.id === state.activeSessionId
              ? { ...s, chatHistory: fn(s.chatHistory) }
              : s
          ),
        }));
      },
    }),
    {
      name: "local-ai-chat-store",
      partialize: (state) => ({
        sessions: state.sessions,
        activeSessionId: state.activeSessionId,
        selectedModel: state.selectedModel,
      }),
    }
  )
);

export default useChatStore;

// Selector: derive chatHistory from the active session.
// Use this instead of state.chatHistory directly, because Zustand
// loses JS getters when it spreads state during set().
export const selectChatHistory = (state: State): ChatMessage[] =>
  state.sessions.find((s) => s.id === state.activeSessionId)?.chatHistory ?? [];