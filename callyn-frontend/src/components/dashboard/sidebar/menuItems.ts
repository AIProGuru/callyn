
import { 
  LayoutDashboard, 
  Bot, 
  Target, 
  BarChart,
  Users,
  Calendar,
  Eye,
  PhoneCall,
  Settings,
  Phone,
  User,
  Rocket,
  Database,
  HeadphonesIcon,
  CreditCard,
  Network,
  Hash
} from "lucide-react";
import { UnlockCondition } from './unlockConditions';

export interface MenuItem {
  name: string;
  icon: any;
  id: string;
  unlockConditions?: UnlockCondition[];
  isLocked?: boolean;
  lockedMessage?: string;
}

// Legacy functions for backward compatibility (can be removed later)
export const getMainMenuItems = (): MenuItem[] => [
  {
    name: "Overview",
    icon: LayoutDashboard,
    id: "overview",
    unlockConditions: []
  }
];

// Organized menu items with better categorization
export const getAgentBuilderItems = (): MenuItem[] => [
  {
    name: "Assistants",
    icon: Eye,
    id: "your-agent",
    unlockConditions: []
  },
  {
    name: "Phone Numbers",
    icon: Hash,
    id: "phone-numbers",
    unlockConditions: [
      { type: 'agent', description: 'Create your AI agent first' }
    ]
  },
  {
    name: "AI Campaign Builder",
    icon: Rocket,
    id: "ai-campaign-builder",
    unlockConditions: [
      { type: 'agent', description: 'Create your AI agent first' }
    ]
  }
];

export const getCampaignItems = (): MenuItem[] => [
  {
    name: "Campaign Manager",
    icon: Target,
    id: "campaigns",
    unlockConditions: [
      { type: 'agent', description: 'Create your AI agent first' }
    ]
  }
];

export const getCallCenterItems = (): MenuItem[] => [
  {
    name: "Call Center",
    icon: Phone,
    id: "live-call-center",
    isLocked: true,
    lockedMessage: "Coming Soon - This feature is under development",
    unlockConditions: [
      { type: 'agent', description: 'Create your AI agent first' }
    ]
  },
  {
    name: "Call Analytics",
    icon: BarChart,
    id: "call-analytics",
    unlockConditions: [
      { type: 'agent', description: 'Create your AI agent first' }
    ]
  }
];

export const getSettingsItems = (): MenuItem[] => [
  {
    name: "Settings & Integrations",
    icon: Settings,
    id: "settings-integrations",
    unlockConditions: [
      { type: 'agent', description: 'Create your AI agent first' }
    ]
  },
  {
    name: "Price Plan",
    icon: CreditCard,
    id: "price-plan",
    unlockConditions: []
  },
  {
    name: "Support",
    icon: HeadphonesIcon,
    id: "support",
    unlockConditions: []
  }
];

// Single flat list of menu items in the requested order (for backward compatibility)
export const getAllMenuItems = (): MenuItem[] => [
  {
    name: "Assistants",
    icon: Eye,
    id: "your-agent",
    unlockConditions: []
  },
  {
    name: "Phone Numbers",
    icon: Hash,
    id: "phone-numbers",
    unlockConditions: [
      { type: 'agent', description: 'Create your AI agent first' }
    ]
  },
  {
    name: "AI Campaign Builder",
    icon: Rocket,
    id: "ai-campaign-builder",
    unlockConditions: [
      { type: 'agent', description: 'Create your AI agent first' }
    ]
  },
  {
    name: "Campaign Manager",
    icon: Target,
    id: "campaigns",
    unlockConditions: [
      { type: 'agent', description: 'Create your AI agent first' }
    ]
  },
  {
    name: "Call Center",
    icon: Phone,
    id: "live-call-center",
    isLocked: true,
    lockedMessage: "Coming Soon - This feature is under development",
    unlockConditions: [
      { type: 'agent', description: 'Create your AI agent first' }
    ]
  },
  {
    name: "Call Analytics",
    icon: BarChart,
    id: "call-analytics",
    unlockConditions: [
      { type: 'agent', description: 'Create your AI agent first' }
    ]
  },
  {
    name: "Settings & Integrations",
    icon: Settings,
    id: "settings-integrations",
    unlockConditions: [
      { type: 'agent', description: 'Create your AI agent first' }
    ]
  },
  {
    name: "Price Plan",
    icon: CreditCard,
    id: "price-plan",
    unlockConditions: []
  },
  {
    name: "Support",
    icon: HeadphonesIcon,
    id: "support",
    unlockConditions: []
  }
];