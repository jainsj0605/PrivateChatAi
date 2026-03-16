import { useState, useRef, useEffect } from "react";
import { FaPlus, FaTrash, FaPen, FaCheck, FaXmark, FaComments } from "react-icons/fa6";
import useChatStore from "../hooks/useChatStore";

function Sidebar({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const sessions = useChatStore((state) => state.sessions);
  const activeSessionId = useChatStore((state) => state.activeSessionId);
  const selectedModel = useChatStore((state) => state.selectedModel);
  const createSession = useChatStore((state) => state.createSession);
  const deleteSession = useChatStore((state) => state.deleteSession);
  const renameSession = useChatStore((state) => state.renameSession);
  const switchSession = useChatStore((state) => state.switchSession);

  // Only show sessions for the currently active model
  const modelSessions = sessions.filter(
    (s) => s.model === selectedModel || !s.model
  );

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingId && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingId]);

  function startRename(id: string, currentName: string) {
    setEditingId(id);
    setEditName(currentName);
  }

  function confirmRename(id: string) {
    const trimmed = editName.trim();
    if (trimmed) renameSession(id, trimmed);
    setEditingId(null);
  }

  function handleSwitch(id: string) {
    if (id === activeSessionId) {
      onClose();
      return;
    }
    switchSession(id);
    onClose();
  }

  function handleNew() {
    createSession(selectedModel);
    onClose();
  }

  function formatDate(ts: number) {
    const d = new Date(ts);
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  }

  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 z-30 bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      {/* Sidebar panel */}
      <aside
        className={`fixed top-0 left-0 z-40 h-full w-72 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 shadow-xl flex flex-col transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex flex-col">
            <div className="flex items-center gap-2 font-semibold text-gray-800 dark:text-gray-100">
              <FaComments className="text-indigo-500" />
              Chat Sessions
            </div>
            {selectedModel && (
              <div className="text-xs text-indigo-500 dark:text-indigo-400 mt-0.5 pl-5 truncate max-w-[180px]" title={selectedModel}>
                🦙 {selectedModel}
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 transition-colors"
          >
            <FaXmark />
          </button>
        </div>

        {/* New Chat Button */}
        <div className="p-3">
          <button
            onClick={handleNew}
            className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl py-2.5 text-sm font-medium transition-colors shadow-sm"
          >
            <FaPlus className="h-3.5 w-3.5" />
            New Chat
          </button>
        </div>

        {/* Session List */}
        <div className="flex-1 overflow-y-auto px-2 pb-4 space-y-1">
          {modelSessions.length === 0 ? (
            <div className="text-center text-sm text-gray-400 dark:text-gray-600 py-8">
              No chats yet for this model.
              <br />
              <button
                onClick={handleNew}
                className="mt-2 text-indigo-500 hover:underline text-xs"
              >
                Start one
              </button>
            </div>
          ) : (
            modelSessions.map((session) => {
            const isActive = session.id === activeSessionId;
            const isEditing = editingId === session.id;

            return (
              <div
                key={session.id}
                className={`group flex items-center gap-2 rounded-xl px-3 py-2.5 cursor-pointer transition-colors ${
                  isActive
                    ? "bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300"
                    : "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
                }`}
                onClick={() => !isEditing && handleSwitch(session.id)}
              >
                {/* Session icon */}
                <FaComments
                  className={`flex-shrink-0 h-3.5 w-3.5 ${
                    isActive ? "text-indigo-500" : "text-gray-400"
                  }`}
                />

                {/* Name / Edit field */}
                <div className="flex-1 min-w-0">
                  {isEditing ? (
                    <input
                      ref={inputRef}
                      className="w-full text-sm bg-transparent border-b border-indigo-400 outline-none text-gray-800 dark:text-gray-100"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") confirmRename(session.id);
                        if (e.key === "Escape") setEditingId(null);
                      }}
                      onClick={(e) => e.stopPropagation()}
                    />
                  ) : (
                    <>
                      <div className="text-sm font-medium truncate">
                        {session.name}
                      </div>
                      <div className="text-xs text-gray-400 dark:text-gray-500">
                        {formatDate(session.createdAt)} · {session.chatHistory.length} msg
                        {session.chatHistory.length !== 1 ? "s" : ""}
                      </div>
                    </>
                  )}
                </div>

                {/* Actions */}
                <div
                  className={`flex items-center gap-1 flex-shrink-0 ${
                    isEditing ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                  } transition-opacity`}
                  onClick={(e) => e.stopPropagation()}
                >
                  {isEditing ? (
                    <>
                      <button
                        onClick={() => confirmRename(session.id)}
                        className="p-1 rounded hover:bg-green-100 dark:hover:bg-green-900/40 text-green-600"
                      >
                        <FaCheck className="h-3 w-3" />
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500"
                      >
                        <FaXmark className="h-3 w-3" />
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => startRename(session.id, session.name)}
                        className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400"
                        title="Rename"
                      >
                        <FaPen className="h-3 w-3" />
                      </button>
                      <button
                        onClick={() => deleteSession(session.id)}
                        className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/40 text-red-500"
                        title="Delete"
                      >
                        <FaTrash className="h-3 w-3" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-gray-200 dark:border-gray-700 text-xs text-center text-gray-400 dark:text-gray-600">
          {modelSessions.length} chat{modelSessions.length !== 1 ? "s" : ""} · All data stays local
        </div>
      </aside>
    </>
  );
}

export default Sidebar;
