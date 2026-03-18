import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send } from "lucide-react";
import { useT } from "@/i18n/useT";
interface ChatInputProps {
  onSendMessage: (message: string) => void;
  disabled?: boolean;
}
export const ChatInput = ({
  onSendMessage,
  disabled = false
}: ChatInputProps) => {
  const [message, setMessage] = useState("");
  const {
    t
  } = useT();
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !disabled) {
      onSendMessage(message.trim());
      setMessage("");
    }
  };
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };
  return <form onSubmit={handleSubmit} className="flex gap-2 p-4 border-t-2  border-b-0 border-black/60 bg-white">
      <Input value={message} onChange={e => setMessage(e.target.value)} onKeyPress={handleKeyPress} placeholder={t("search.placeholder")} disabled={disabled} className="border-gray-500 " />
      <Button type="submit" disabled={!message.trim() || disabled} className="bg-black hover:bg-gray-800 text-white">
        <Send className="w-4 h-4" />
      </Button>
    </form>;
};