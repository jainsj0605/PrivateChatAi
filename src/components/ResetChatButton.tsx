import { FaPenToSquare } from "react-icons/fa6";
import { Button } from "./ui/button";

function ResetChatButton({ resetChat }: { resetChat: () => void }) {
  return (
    <Button onClick={resetChat} variant="outline" className="p-2" title="New Chat">
      <FaPenToSquare className="h-5 w-5" />
    </Button>
  );
}

export default ResetChatButton;
