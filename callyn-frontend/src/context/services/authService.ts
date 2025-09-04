
import { mapApiAgentToUserAgent } from '@/utils/agent';
import { ApiAgent } from '../types/apiTypes';
import { User, UserAgent, OnboardingData } from '../types/authTypes';
import ApiService from './apiService';

export const authService = {
  login: async (email: string, password: string): Promise<User | null> => {
    return new Promise(async (resolve, reject) => {
      try {
        const { status, token } = await ApiService.post('/auth/login', { email, password });
        if (status === 200) {
          const user = { email }
          localStorage.setItem('token', token)
          ApiService.setToken(token)
          resolve(user);
        }
      } catch (err) {
        reject(err)
      }
    })
  },

  googleLogin: async (): Promise<User> => {
    const mockGoogleUser = {
      email: 'demo@gmail.com',
      name: 'Demo User',
      photoURL: 'https://ui-avatars.com/api/?name=Demo+User&background=random'
    };
    // localStorage.setItem('user', JSON.stringify(mockGoogleUser));
    return mockGoogleUser;
  },

  signup: async (email: string, password: string, name: string): Promise<User> => {
    return new Promise(async (resolve, reject) => {
      try {
        const { user } = await ApiService.post('/auth/register', { name, email, password });
        resolve(user);
      } catch (err) {
        reject(err);
      }
    })
  },

  createUserAgent: async (data: OnboardingData): Promise<UserAgent | null> => {
    const payload: any = {
      custom_script: data.customScript,
      enthusiasm: data.enthusiasm,
      formality: data.languageConfig?.formality,
      tone: data.languageConfig?.tone,
      handle_objections: data.handleObjections,
      business_name: data.businessName,
      industry: data.industry,
      main_goal: data.mainGoal,
      model: data.languageConfig?.model,
      scriptMethod: data.scriptMethod,
      speaking_speed: data.speakingSpeed,
      target_audience: data.targetAudience,
      use_small_talk: data.useSmallTalk,
      voice: data.selectedVoice,
      websiteUrl: data.websiteUrl,
      uploadedFile: null,
    };

    const { assistant } = await ApiService.post('/assistant/first-agent', payload);
    return mapApiAgentToUserAgent(assistant);
  },

  updateUserAgent: async (data: OnboardingData): Promise<UserAgent | null> => {
    // Send minimal fields the backend uses to regenerate and persist
    const payload: any = {
      name: data.businessName,
      voice: data.selectedVoice,
      model: data.languageConfig?.model,
      // Include optional fields for instruction generation on server side
      custom_script: data.customScript,
      tone: data.languageConfig?.tone,
      formality: data.languageConfig?.formality,
      enthusiasm: data.enthusiasm,
      speaking_speed: data.speakingSpeed,
      handle_objections: data.handleObjections,
      use_small_talk: data.useSmallTalk,
      industry: data.industry,
      target_audience: data.targetAudience,
      main_goal: data.mainGoal,
    };

    const { data: assistant } = await ApiService.put('/assistant', payload);
    return mapApiAgentToUserAgent(assistant);
  },

  updateUserAgentWithAgent: async (data: UserAgent): Promise<UserAgent | null> => {
    const payload: any = {
      name: data.configuration.businessInfo.name,
      voice: data.configuration.voice,
      model: data.configuration.model,
      // Optional fields to help regenerate instructions server-side
      custom_script: data.configuration.script,
      tone: data.configuration.personality,
      formality: data.configuration.formality,
      enthusiasm: data.configuration.enthusiasm,
      speaking_speed: data.configuration.speakingSpeed,
      handle_objections: data.configuration.handleObjections,
      use_small_talk: data.configuration.useSmallTalk,
      industry: data.configuration.businessInfo.industry,
      target_audience: data.configuration.businessInfo.targetAudience,
      main_goal: data.configuration.businessInfo.mainGoal,
    };

    const { data: assistant } = await ApiService.put('/assistant', payload);
    return mapApiAgentToUserAgent(assistant);
  },

  getAssistants: async (): Promise<ApiAgent[]> => {
    try {
      const { assistants } = await ApiService.get('/assistant');
      return assistants || [];
    } catch (error) {
      console.error('Failed to fetch assistants:', error);
      return [];
    }
  },

  createAssistant: async (name?: string): Promise<ApiAgent> => {
    const { assistant } = await ApiService.post('/assistant', {
      name: name || 'New Assistant',
      // server applies default voice/model/instructions
    });
    return assistant as ApiAgent;
  },

  updateAssistant: async (id: string, updates: { name?: string; voice?: string; model?: string; instructions?: string }): Promise<ApiAgent> => {
    const { assistant } = await ApiService.put(`/assistant/${id}`, updates);
    return assistant as ApiAgent;
  },

  deleteAssistant: async (id: string): Promise<void> => {
    try {
      await ApiService.delete(`/assistant/${id}`);
    } catch (error) {
      console.error('Failed to delete assistant:', error);
      throw error;
    }
  },

  // Phone number functions
  getPhones: async (): Promise<any[]> => {
    try {
      const { phones } = await ApiService.get('/phone');
      return phones || [];
    } catch (error) {
      console.error('Failed to fetch phones:', error);
      return [];
    }
  },

  getAvailablePhones: async (country: string = "US"): Promise<any[]> => {
    try {
      const { availableNumbers } = await ApiService.get(`/phone/available?country=${country}`);
      return availableNumbers || [];
    } catch (error) {
      console.error('Failed to fetch available phones:', error);
      return [];
    }
  },

  getExistingPhones: async (): Promise<any[]> => {
    try {
      const { existingNumbers } = await ApiService.get('/phone/existing');
      return existingNumbers || [];
    } catch (error) {
      console.error('Failed to fetch existing phones:', error);
      return [];
    }
  },

  addPhone: async (phone_id: string): Promise<any> => {
    const { phone } = await ApiService.post('/phone', { phone_id });
    return phone;
  },

  purchasePhone: async (phoneNumber: string): Promise<any> => {
    const { phone, provisionedNumber, vapiPhone } = await ApiService.post('/phone/purchase', { phoneNumber });
    return { phone, provisionedNumber, vapiPhone };
  },

  importExistingPhone: async (phoneNumber: string): Promise<any> => {
    console.log('Importing phone number:', phoneNumber);
    const { phone, vapiPhone } = await ApiService.post('/phone/import', { phoneNumber });
    return { phone, vapiPhone };
  },

  deletePhone: async (phone_id: string): Promise<void> => {
    await ApiService.delete(`/phone/${phone_id}`);
  },

  updateInboundSettings: async (phoneId: string, assistantId?: string, fallbackNumber?: string): Promise<void> => {
    await ApiService.patch(`/phone/${phoneId}/inbound`, {
      assistantId: assistantId || undefined,
      fallbackNumber: fallbackNumber || undefined,
    });
  },

  createOutboundCall: async (payload: {
    assistantId: string;
    phoneNumberId: string;
    customer?: { number: string; name?: string; email?: string };
    customers?: Array<{ number: string; name?: string; extension?: string }>;
    schedulePlan?: { earliestAt: string };
  }): Promise<any> => {
    const data = await ApiService.post('/call', payload);
    return data?.call;
  },

  streamGeneratedPrompt: async (
    requirements: string,
    business?: Record<string, any>,
    onToken?: (token: string) => void
  ): Promise<string> => {
    return new Promise(async (resolve, reject) => {
      try {
        const url = `${import.meta.env.VITE_SERVER_URL}/assistant/generate-prompt`;
        const token = localStorage.getItem('token');
        const res = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ requirements, business }),
        });

        if (!res.ok) {
          return reject(new Error(`Failed to start stream: ${res.status}`));
        }

        const reader = res.body!.getReader();
        const decoder = new TextDecoder('utf-8');
        let full = '';
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n\n');
          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith('data:')) continue;
            const json = trimmed.replace(/^data:\s*/, '');
            try {
              const evt = JSON.parse(json);
              if (evt.token) {
                full += evt.token;
                onToken?.(evt.token);
              } else if (evt.done) {
                resolve(full);
              } else if (evt.error) {
                reject(new Error(evt.error));
              }
            } catch (_) {}
          }
        }
      } catch (err) {
        reject(err);
      }
    });
  },

  logout: () => {
    ApiService.setToken(null)
    localStorage.removeItem('token');
  }
};
