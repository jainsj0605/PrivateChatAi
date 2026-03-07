import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import useChatStore from "../hooks/useChatStore";

function ModelsDropdown({
  resetEngineAndChatHistory,
}: {
  resetEngineAndChatHistory: () => void;
}) {
  const selectedModel = useChatStore((state) => state.selectedModel);
  const setSelectedModel = useChatStore((state) => state.setSelectedModel);
  const availableModels = useChatStore((state) => state.availableModels);

  return (
    <div className="p-2 text-xs text-center font-bold">
      <Select
        value={selectedModel}
        onValueChange={(selectedModel) => {
          setSelectedModel(selectedModel);
          resetEngineAndChatHistory();
        }}
      >
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="Select a model" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {availableModels.length > 0 ? (
              availableModels.map((model) => (
                <SelectItem key={model.name} value={model.name}>
                  🦙 {model.name}
                </SelectItem>
              ))
            ) : (
              <SelectItem value="none" disabled>
                No models found
              </SelectItem>
            )}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  );
}

export default ModelsDropdown;
