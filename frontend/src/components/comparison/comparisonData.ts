
export interface ComparisonItem {
  number: string;
  title: string;
  description: string;
  exampleText?: string;
  image: string;
}

export const comparisonData: ComparisonItem[] = [
  {
    number: "1",
    title: "Upload Your Leads",
    description: "Drag and drop your CSV file or paste in your lead list — names, numbers, and any notes you want Callyn to know.",
    exampleText: "3,000 leads for this month? No problem.",
    image: "/lovable-uploads/9dbbaf8d-f660-4b65-96a4-34691dbb3adf.png"
  },
  {
    number: "2",
    title: "Add Your Script",
    description: "Type or paste your sales pitch — Callyn follows it exactly, or use our AI to build one that converts.",
    exampleText: "Choose tone, objections, and booking logic.",
    image: "/lovable-uploads/e406c4cd-746b-489d-b782-0d0a3e03f8a2.png"
  },
  {
    number: "3",
    title: "Set Your Calendar Link",
    description: "Connect your Calendly or booking tool so hot leads can schedule straight into your calendar.",
    exampleText: "No back and forth. Just booked meetings.",
    image: "/lovable-uploads/7e66c6f0-d34d-4009-9f7a-253cc160f22a.png"
  },
  {
    number: "4",
    title: "Launch the Campaign",
    description: "Hit \"Start Calling.\" Callyn begins dialing, speaking, logging outcomes, and sending you summaries in real-time.",
    exampleText: "It runs while you sleep or close deals.",
    image: "/lovable-uploads/c1bf6c33-6c5c-4279-a6b1-53004666eb3c.png"
  },
  {
    number: "5",
    title: "Review & Follow Up",
    description: "You'll get call logs, summaries, and SMS follow-ups sent to each lead. You can jump in anytime to close.",
    exampleText: "Only talk to people who want to talk to you.",
    image: "/lovable-uploads/7ef44233-156c-4bad-a3b0-c950117e25ba.png"
  }
];
