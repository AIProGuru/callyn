import { OnboardingData, UserAgent } from "@/context";
import { ApiAgent } from "@/context/types/apiTypes";

export interface Assistant {
  id: string;
  name: string;
  description?: string;
  systemPrompt: string;
  voice: string;
  provider: string;
  primaryLanguage: string;
}

// export const getAgentFromOnboardingData = (data: OnboardingData): UserAgent => ({
//     id: `agent_${Date.now()}`,
//     name: data.businessName || 'My AI Agent',
//     status: 'active',
//     createdAt: new Date().toISOString(),
//     configuration: {
//         voice: data.selectedVoice || 'Aria',
//         personality: data.personality || 'professional',
//         script: data.customScript || 'Default sales script',
//         businessInfo: {
//             name: data.businessName || '',
//             industry: data.industry || '',
//             targetAudience: data.targetAudience || '',
//             mainGoal: data.mainGoal || ''
//         }
//     }
// })

export const mapApiAgentToOnboardingData = (data: ApiAgent): OnboardingData => ({
    businessName: data.name,
    industry: '',
    targetAudience: '',
    mainGoal: '',
    scriptMethod: '',
    websiteUrl: null,
    uploadedFile: null,
    customScript: data.instructions || '',

    selectedVoice: data.voice,
    personality: 'professional',
    speakingSpeed: 1,
    enthusiasm: 5,
    useSmallTalk: false,
    handleObjections: true,
    languageConfig: {
        formality: 'balanced',
        tone: 'professional',
        primaryLanguage: 'en',
        secondaryLanguages: [],
        model: data.model || 'chatgpt-4o-latest',
        voiceId: data.voice,
        culturalAdaptation: false,
        localExpressions: false
    }
})

export function mapApiAgentToUserAgent(agent: ApiAgent): UserAgent {
  return {
    id: agent.id,
    name: agent.name,
    other: {
      userId: agent.user_id || '',
      assistantId: agent.assistant_id || ''
    },
    configuration: {
      businessInfo: {
        name: agent.name,
        industry: '',
        targetAudience: '',
        mainGoal: '',
      },
      voice: agent.voice,
      model: agent.model,
      script: agent.instructions || '',
      instructions: agent.instructions || '',
      enthusiasm: 5,
      formality: 'balanced',
      personality: 'professional',
      handleObjections: true,
      useSmallTalk: false,
      speakingSpeed: 1,
      scriptMethod: '',
      websiteUrl: null,
      uploadedFile: null,
    },
    createdAt: agent.timestamp || new Date().toISOString(),
    status: 'active'
  };
}

export function mapApiAgentToAssistant(agent: ApiAgent): Assistant {
  return {
    // Prefer backend assistant_id (stable across DB recreations). Fallback to row id as string.
    id: (agent.assistant_id || String(agent.id)) as string,
    name: agent.name,
    description: '',
    systemPrompt: agent.instructions || `# ${agent.name} Agent Prompt

## Identity & Purpose
You are ${agent.name}, an AI assistant.

## Voice & Persona
### Personality
- Professional and helpful
- Clear communication style`,
    voice: agent.voice,
    provider: '11labs', // Default provider
    primaryLanguage: 'en' // Default language
  };
}

export const mapUserAgentToApiAgent = (data: UserAgent): any => ({
    id: data.id,
    user_id: data.other.userId,
    assistant_id: data.other.assistantId,
    name: data.name,
    voice: data.configuration.voice,
    model: data.configuration.model,
    instructions: data.configuration.instructions,
    timestamp: data.createdAt
})