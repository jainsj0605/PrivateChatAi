import { useRef, useCallback } from "react";
import { FaArrowUp, FaImage, FaXmark } from "react-icons/fa6";
import { Button } from "./ui/button";
import useChatStore from "../hooks/useChatStore";

// Vision model detection — only actual multimodal models
function isVisionModel(modelName: string) {
  const lower = modelName.toLowerCase();
  return (
    lower.includes("llava") ||
    lower.includes("bakllava") ||
    lower.includes("minicpm-v") ||
    lower.includes("moondream") ||
    lower.includes("cogvlm") ||
    lower.includes("vision") ||
    lower.includes("qwen-vl")
  );
}

function UserInput({
  onSend,
  onStop,
}: {
  onSend: () => Promise<void>;
  onStop: () => void;
}) {
  const userInput = useChatStore((state) => state.userInput);
  const setUserInput = useChatStore((state) => state.setUserInput);
  const selectedModel = useChatStore((state) => state.selectedModel);
  const isGenerating = useChatStore((state) => state.isGenerating);
  const pendingImages = useChatStore((state) => state.pendingImages);
  const setPendingImages = useChatStore((state) => state.setPendingImages);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const canAttachImages = isVisionModel(selectedModel);

  // Convert file to base64
  function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // Strip the data URL prefix, keep only base64 data
        resolve(result.split(",")[1]);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const base64s = await Promise.all(files.map(fileToBase64));
    setPendingImages([...pendingImages, ...base64s]);
    // Reset input so same file can be selected again
    e.target.value = "";
  }

  const handlePaste = useCallback(
    async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
      if (!canAttachImages) return;
      const items = Array.from(e.clipboardData.items);
      const imageItems = items.filter((item) => item.type.startsWith("image/"));
      if (imageItems.length === 0) return;

      e.preventDefault();
      const files = imageItems
        .map((item) => item.getAsFile())
        .filter(Boolean) as File[];
      const base64s = await Promise.all(files.map(fileToBase64));
      setPendingImages([...pendingImages, ...base64s]);
    },
    [canAttachImages, pendingImages, setPendingImages]
  );

  function removeImage(index: number) {
    setPendingImages(pendingImages.filter((_, i) => i !== index));
  }

  // Auto-resize textarea
  function handleTextareaChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setUserInput(e.target.value);
    const ta = e.target;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 200) + "px";
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSend();
      // Reset height
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    }
  }

  return (
    <div className="p-4 py-2">
      {/* Image previews */}
      {pendingImages.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2 px-1">
          {pendingImages.map((img, i) => (
            <div key={i} className="relative group">
              <img
                src={`data:image/jpeg;base64,${img}`}
                alt={`Pending image ${i + 1}`}
                className="h-20 w-20 object-cover rounded-xl border shadow-sm"
              />
              <button
                onClick={() => removeImage(i)}
                className="absolute -top-1.5 -right-1.5 bg-red-500 hover:bg-red-600 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity shadow"
              >
                <FaXmark className="h-2.5 w-2.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-end gap-1 p-2 border rounded-xl shadow-sm bg-white dark:bg-gray-900">
        {/* Image attach button (only for vision models) */}
        {canAttachImages && (
          <>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleFileSelect}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="p-2 flex-shrink-0 text-gray-400 hover:text-indigo-500 self-end mb-0.5"
              onClick={() => fileInputRef.current?.click()}
              title="Attach image"
            >
              <FaImage className="h-4 w-4" />
            </Button>
          </>
        )}

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          className="flex-1 resize-none bg-transparent border-none outline-none text-base py-1 min-h-[36px] max-h-[200px] text-gray-800 dark:text-gray-100 placeholder-gray-400 leading-6"
          placeholder={
            canAttachImages
              ? `Message ${selectedModel || "Assistant"} (supports images)`
              : `Message ${selectedModel || "Assistant"}`
          }
          onChange={handleTextareaChange}
          value={userInput}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          rows={1}
        />

        {/* Send / Stop */}
        {!isGenerating && (
          <Button
            className="p-2 flex-shrink-0 self-end mb-0.5"
            variant="ghost"
            onClick={onSend}
          >
            <FaArrowUp className="h-5 w-5 text-gray-500" />
          </Button>
        )}
        {isGenerating && (
          <Button
            className="flex-shrink-0 self-end mb-0.5"
            onClick={onStop}
          >
            Stop
          </Button>
        )}
      </div>

      <a
        href="#"
        onClick={() =>
          alert(
            "WhimsyWorks, Inc. provides this open source software and website as-is and makes no representations or warranties of any kind concerning its accuracy, safety, or suitability. The user assumes full responsibility for any consequences resulting from its use. WhimsyWorks, Inc. expressly disclaims all liability for any direct, indirect, or consequential harm that may result."
          )
        }
        className="text-xs text-gray-400 hover:underline mt-2 text-right flex justify-end w-full"
      >
        Disclaimer
      </a>
    </div>
  );
}

export default UserInput;
