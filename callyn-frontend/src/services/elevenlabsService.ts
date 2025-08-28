export interface ElevenLabsVoice {
  voice_id: string;
  name: string;
  samples?: any[];
  category: string;
  fine_tuning?: any;
  labels: {
    accent?: string;
    age?: string;
    gender?: string;
    usecase?: string;
    description?: string;
    language?: string;
    native_language?: string;
    [key: string]: string | undefined;
  };
  description?: string;
  preview_url?: string;
  available_for_tiers: string[];
  settings?: any;
  sharing?: any;
  high_quality_base_model_ids: string[];
  safety_control?: any;
  safety_labels?: any;
  voice_verification?: any;
  owner_id?: string;
  permission_on_resource?: any;
  rate_limit?: any;
  rate_limit_remaining?: any;
  notice_period?: any;
  instagram_username?: any;
  twitter_username?: any;
  youtube_username?: any;
  tiktok_username?: any;
}

export interface VoiceWithAccent {
  id: string;
  name: string;
  description?: string;
  gender: string;
  accent?: string;
  category?: string;
  language?: string;
  nativeLanguage?: string;
  usecase?: string;
  age?: string;
  labels: Record<string, string>;
}

class ElevenLabsService {
  private apiKey: string;
  private baseUrl = 'https://api.elevenlabs.io/v1';

  constructor() {
    this.apiKey = import.meta.env.VITE_ELEVENLABS_API_KEY;
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}) {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'xi-api-key': this.apiKey,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`ElevenLabs API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  async getVoices(): Promise<ElevenLabsVoice[]> {
    try {
      const response = await this.makeRequest('/voices');
      console.log('ElevenLabs API response:', response);
      
      // Handle different possible response structures
      if (Array.isArray(response)) {
        return response;
      } else if (response && Array.isArray(response.voices)) {
        return response.voices;
      } else {
        console.warn('Unexpected API response structure:', response);
        // Return empty array and let the fallback handle it
        return [];
      }
    } catch (error) {
      console.error('Failed to fetch voices from ElevenLabs API:', error);
      return [];
    }
  }

  async getVoicesWithAccents(): Promise<VoiceWithAccent[]> {
    const voices = await this.getVoices();
    return voices.map(this.mapVoiceToAccentFormat);
  }

  async getVoicesByLanguage(languageCode: string): Promise<VoiceWithAccent[]> {
    const voices = await this.getVoices();
    const languageName = this.getLanguageName(languageCode);
    
    console.log(`Filtering voices for language: ${languageCode} (${languageName})`);
    console.log('Available voices:', voices.slice(0, 3)); // Show first 3 voices for debugging
    
    // Filter voices that are suitable for the specified language
    const filteredVoices = voices.filter(voice => {
      const labels = voice.labels || {};
      const description = voice.description || '';
      const name = voice.name || '';
      
      // Check if voice has language-specific labels or descriptions
      const hasLanguageLabel = labels.language?.toLowerCase().includes(languageName.toLowerCase()) ||
                              labels.native_language?.toLowerCase().includes(languageName.toLowerCase());
      
      // Check if voice description mentions the language
      const hasLanguageDescription = description.toLowerCase().includes(languageName.toLowerCase()) ||
                                   name.toLowerCase().includes(languageName.toLowerCase());
      
      // Check for common language patterns in voice names/descriptions
      const languagePatterns = this.getLanguagePatterns(languageCode);
      const hasLanguagePattern = languagePatterns.some(pattern => 
        description.toLowerCase().includes(pattern) || 
        name.toLowerCase().includes(pattern)
      );
      
      const matches = hasLanguageLabel || hasLanguageDescription || hasLanguagePattern;
      
      // Debug logging for first few voices
      if (voices.indexOf(voice) < 3) {
        console.log(`Voice "${name}":`, {
          labels,
          description,
          hasLanguageLabel,
          hasLanguageDescription,
          hasLanguagePattern,
          matches
        });
      }
      
      return matches;
    });

    console.log(`Found ${filteredVoices.length} voices for language ${languageCode}`);
    return filteredVoices.map(this.mapVoiceToAccentFormat);
  }

  async searchVoices(query: string): Promise<VoiceWithAccent[]> {
    const voices = await this.getVoices();
    
    const searchTerm = query.toLowerCase();
    const filteredVoices = voices.filter(voice => {
      const labels = voice.labels || {};
      const description = voice.description || '';
      const name = voice.name || '';
      
      // Search in name, description, and labels
      const matchesName = name.toLowerCase().includes(searchTerm);
      const matchesDescription = description.toLowerCase().includes(searchTerm);
      const matchesLabels = Object.values(labels).some(value => 
        value?.toLowerCase().includes(searchTerm)
      );
      
      return matchesName || matchesDescription || matchesLabels;
    });

    return filteredVoices.map(this.mapVoiceToAccentFormat);
  }

  async getVoicesByLanguageAndGender(languageCode: string, gender: string): Promise<VoiceWithAccent[]> {
    const voices = await this.getVoicesByLanguage(languageCode);
    return voices.filter(voice => voice.gender.toLowerCase() === gender.toLowerCase());
  }

  async getAvailableAccents(): Promise<string[]> {
    const voices = await this.getVoices();
    const accents = voices
      .map(voice => voice.labels?.accent)
      .filter((accent): accent is string => !!accent)
      .filter((accent, index, arr) => arr.indexOf(accent) === index)
      .sort();
    
    return accents;
  }

  async getAvailableLanguages(): Promise<string[]> {
    const voices = await this.getVoices();
    const languages = voices
      .map(voice => voice.labels?.language || voice.labels?.native_language)
      .filter((language): language is string => !!language)
      .filter((language, index, arr) => arr.indexOf(language) === index)
      .sort();
    
    return languages;
  }

  private mapVoiceToAccentFormat(voice: ElevenLabsVoice): VoiceWithAccent {
    return {
      id: voice.voice_id,
      name: voice.name,
      description: voice.description,
      gender: voice.labels?.gender || 'unknown',
      accent: voice.labels?.accent,
      category: voice.category,
      language: voice.labels?.language,
      nativeLanguage: voice.labels?.native_language,
      usecase: voice.labels?.usecase,
      age: voice.labels?.age,
      labels: voice.labels || {},
    };
  }

  private getLanguageName(languageCode: string): string {
    const languageMap: Record<string, string> = {
      'en': 'English',
      'es': 'Spanish',
      'fr': 'French',
      'de': 'German',
      'it': 'Italian',
      'pt': 'Portuguese',
      'nl': 'Dutch',
      'pl': 'Polish',
      'hi': 'Hindi',
      'da': 'Danish',
      'no': 'Norwegian',
      'sv': 'Swedish',
      'ar': 'Arabic',
      'tr': 'Turkish',
      'ru': 'Russian',
    };
    
    return languageMap[languageCode] || languageCode;
  }

  private getLanguagePatterns(languageCode: string): string[] {
    const patterns: Record<string, string[]> = {
      'no': ['norwegian', 'norsk', 'norsk/norwegian'],
      'sv': ['swedish', 'svenska'],
      'da': ['danish', 'dansk'],
      'de': ['german', 'deutsch'],
      'fr': ['french', 'français'],
      'es': ['spanish', 'español'],
      'it': ['italian', 'italiano'],
      'pt': ['portuguese', 'português'],
      'nl': ['dutch', 'nederlands'],
      'pl': ['polish', 'polski'],
      'ru': ['russian', 'русский'],
      'ar': ['arabic', 'العربية'],
      'tr': ['turkish', 'türkçe'],
      'hi': ['hindi', 'हिन्दी'],
    };
    
    return patterns[languageCode] || [];
  }

  async getVoiceDetails(voiceId: string): Promise<ElevenLabsVoice> {
    return this.makeRequest(`/voices/${voiceId}`);
  }

  async generateSpeech(voiceId: string, text: string, modelId: string = 'eleven_multilingual_v2'): Promise<Blob> {
    const response = await fetch(`${this.baseUrl}/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'xi-api-key': this.apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        model_id: modelId,
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.5,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Speech generation failed: ${response.status} ${response.statusText}`);
    }

    return response.blob();
  }
}

export const elevenlabsService = new ElevenLabsService();
