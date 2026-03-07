import { TrashIcon } from "@radix-ui/react-icons";
import { Button } from "./ui/button";

function ClearChatButton({ clearChat }: { clearChat: () => void }) {
    return (
        <Button
            onClick={clearChat}
            variant="outline"
            className="p-2 text-destructive hover:bg-destructive hover:text-destructive-foreground transition-colors"
            title="Clear Chat"
        >
            <TrashIcon className="h-5 w-5" />
        </Button>
    );
}

export default ClearChatButton;
