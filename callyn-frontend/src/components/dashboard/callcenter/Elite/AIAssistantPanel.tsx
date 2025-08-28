
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Bot, Send } from "lucide-react";

/**
 * AI Assistant Panel for real-time prompting/instructions.
 * Stores conversation locally for now.
 */
const EXAMPLE_RESPONSES = [
  "Got it! I'll keep your instructions in mind for this call.",
  "Here are ways you can approach the next objection.",
  "Here's a sample phrasing for your pitch.",
];

interface Message {
  role: "user" | "assistant";
  text: string;
}

const AIAssistantPanel = () => {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage = { role: "user" as const, text: input };
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    // Simulate AI response
    setTimeout(() => {
      const aiResponse = {
        role: "assistant" as const,
        text: "I understand you're asking about " + input + ". Let me help you with that..."
      };
      setMessages(prev => [...prev, aiResponse]);
      setLoading(false);
    }, 1000);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="bg-card border border-border rounded-lg shadow px-4 py-6 min-h-[340px] flex flex-col h-full">
      <div className="flex items-center gap-2 mb-3">
        <Bot className="h-5 w-5 text-blue-700 dark:text-blue-400" />
        <h3 className="font-semibold text-blue-900 dark:text-blue-100 text-base">AI Assistant</h3>
      </div>
      <div className="text-xs text-blue-700 dark:text-blue-300 mb-3">
        Ask the AI for help, feedback, or instructions in real time.
      </div>
      <div className="flex-1 overflow-y-auto pr-1 mb-2 space-y-3 max-h-60">
        {messages.length === 0 && (
          <div className="text-muted-foreground mt-6 text-center text-xs">
            Send your first message! Example: "Suggest an opener for a Solar call."
          </div>
        )}
        {messages.map((m, i) => (
          <div
            key={i}
            className={`flex flex-col items-${m.role === "user" ? "end" : "start"}`}
          >
            <div
              className={`rounded-lg px-3 py-2 text-sm whitespace-pre-line max-w-[90%] ${
                m.role === "user"
                  ? "bg-blue-50 dark:bg-blue-950 text-blue-900 dark:text-blue-100 shadow mr-1"
                  : "bg-muted text-muted-foreground shadow-sm ml-1"
              }`}
            >
              {m.text}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex flex-col items-start">
            <div className="rounded-lg px-3 py-2 bg-muted text-muted-foreground text-sm shadow-sm animate-pulse w-[70%]">
              AI is thinking…
            </div>
          </div>
        )}
      </div>
      <div className="mt-auto flex flex-col gap-2">
        <Textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask the AI for help..."
          className="min-h-[80px] resize-none"
        />
        <Button
          onClick={handleSend}
          disabled={!input.trim() || loading}
          className="self-end"
          size="sm"
        >
          <Send className="h-4 w-4 mr-1" />
          Send
        </Button>
      </div>
    </div>
  );
};

export default AIAssistantPanel;
