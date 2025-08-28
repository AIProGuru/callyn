
interface AgentInstructionsProps {
  agentInstructions: string;
  outcomeGoals: string;
}

const AgentInstructions = ({
  agentInstructions,
  outcomeGoals
}: AgentInstructionsProps) => {
  return (
    <div className="rounded-lg border border-border p-4 bg-blue-50/40 dark:bg-blue-950/40 shadow-inner">
      <h3 className="text-base font-bold mb-1 text-blue-800 dark:text-blue-200">Agent Instructions</h3>
      <p className="text-sm text-muted-foreground mb-4">{agentInstructions}</p>
      <div className="mt-2 border-t border-blue-100 dark:border-blue-800 pt-3">
        <h4 className="text-xs font-semibold text-green-700 dark:text-green-400 uppercase mb-1 tracking-wider">Outcome Goal</h4>
        <p className="text-sm text-green-900 dark:text-green-100">{outcomeGoals}</p>
      </div>
    </div>
  );
};

export default AgentInstructions;
