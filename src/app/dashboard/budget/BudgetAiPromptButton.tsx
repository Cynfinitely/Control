import AiPromptDialog from "@/components/AiPromptDialog";

type Props = {
  monthLabel: string;
  prompt: string;
  uncategorizedCount: number;
};

export default function BudgetAiPromptButton({ monthLabel, prompt, uncategorizedCount }: Props) {
  return (
    <AiPromptDialog
      subject={monthLabel}
      prompt={prompt}
      description="Paste this into ChatGPT or Cursor to analyze the month and suggest budget improvements."
      warning={
        uncategorizedCount > 0
          ? `${uncategorizedCount} transaction${uncategorizedCount === 1 ? " is" : "s are"} still uncategorized. Categorize them first for a more accurate analysis.`
          : undefined
      }
    />
  );
}
