import AiPromptDialog from "@/components/AiPromptDialog";

export default function FoodAiPromptButton({ label, prompt }: { label: string; prompt: string }) {
  return (
    <AiPromptDialog
      subject={label}
      prompt={prompt}
      description="Paste this into ChatGPT or Cursor to analyze these food logs."
    />
  );
}
