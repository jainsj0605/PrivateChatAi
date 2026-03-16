import { useState } from "react";
import { FaHorseHead, FaPerson, FaCopy, FaCheck } from "react-icons/fa6";
import Markdown from "react-markdown";
import useChatStore, { ChatMessage } from "../hooks/useChatStore";
import CodeMessage from "./CodeMessage";

function Message({ message }: { message: ChatMessage }) {
  const selectedModel = useChatStore((state) => state.selectedModel);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="p-4 rounded-lg mt-2 group relative">
      <div className="flex items-center gap-x-2">
        <div className="border p-1 rounded-full text-gray-500">
          {message.role === "assistant" ? <FaHorseHead /> : <FaPerson />}
        </div>
        <div className="font-bold">
          {message.role === "assistant"
            ? selectedModel || "Assistant"
            : "You"}
        </div>
        {message.role === "assistant" && (
          <button
            onClick={handleCopy}
            title="Copy response"
            className="ml-1 p-1 rounded text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 opacity-0 group-hover:opacity-100 transition-all duration-150"
          >
            {copied ? (
              <FaCheck className="h-3.5 w-3.5 text-green-500" />
            ) : (
              <FaCopy className="h-3.5 w-3.5" />
            )}
          </button>
        )}
      </div>

      {/* Attached images for user messages */}
      {message.role === "user" && message.images && message.images.length > 0 && (
        <div className="flex flex-wrap gap-2 pl-8 mt-2">
          {message.images.map((img, i) => (
            <img
              key={i}
              src={`data:image/jpeg;base64,${img}`}
              alt={`Attached image ${i + 1}`}
              className="max-h-48 max-w-xs rounded-lg border object-cover shadow-sm"
            />
          ))}
        </div>
      )}

      <Markdown
        components={{
          code({ children, className, ...rest }) {
            return (
              <CodeMessage
                className={className}
                children={children}
                {...rest}
              />
            );
          },
        }}
        className="text-gray-700 dark:text-gray-300 pl-8 mt-2 leading-[1.75] prose dark:prose-invert max-w-none"
      >
        {message.content}
      </Markdown>
    </div>
  );
}

export default Message;
