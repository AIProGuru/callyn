
import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Volume2 } from "lucide-react";
import { getVoicesForLanguage } from "./languageConfig";
import { elevenlabsService, VoiceWithAccent } from "@/services/elevenlabsService";

interface VoiceSelectorProps {
  primaryLanguage: string;
  selectedVoiceId?: string;
  onVoiceChange: (voiceId: string) => void;
}

const VoiceSelector = ({ 
  primaryLanguage, 
  selectedVoiceId, 
  onVoiceChange 
}: VoiceSelectorProps) => {
  const [voices, setVoices] = useState<VoiceWithAccent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadVoices = async () => {
      try {
        setLoading(true);
        // Use the new intelligent voice search service
        const voicesData = await elevenlabsService.getVoicesByLanguage(primaryLanguage);
        
        // If no voices found from API, fallback to static voices
        if (voicesData.length === 0) {
          console.log('No voices found from API, using fallback voices');
          const fallbackVoices = getVoicesForLanguage(primaryLanguage);
          setVoices(fallbackVoices.map(voice => ({
            id: voice.id,
            name: voice.name,
            gender: voice.gender,
            accent: voice.accent,
            description: '',
            category: '',
            labels: {}
          })));
        } else {
          setVoices(voicesData);
        }
      } catch (error) {
        console.error('Failed to load voices:', error);
        // Fallback to static voices if API fails
        const fallbackVoices = getVoicesForLanguage(primaryLanguage);
        setVoices(fallbackVoices.map(voice => ({
          id: voice.id,
          name: voice.name,
          gender: voice.gender,
          accent: voice.accent,
          description: '',
          category: '',
          labels: {}
        })));
      } finally {
        setLoading(false);
      }
    };

    loadVoices();
  }, [primaryLanguage]);

  if (loading) {
    return (
      <div className="space-y-2">
        <Label>Voice Selection</Label>
        <div className="flex items-center justify-center p-4">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-sm text-gray-600">Loading voices...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Label>Voice Selection</Label>
      <Select value={selectedVoiceId} onValueChange={onVoiceChange}>
        <SelectTrigger>
          <SelectValue placeholder="Select a voice" />
        </SelectTrigger>
        <SelectContent>
          {voices.map((voice) => (
            <SelectItem key={voice.id} value={voice.id}>
              <div className="flex items-center gap-2">
                <Volume2 className="h-4 w-4" />
                <span>{voice.name}</span>
                <Badge variant="outline" className="capitalize">
                  {voice.gender}
                </Badge>
                {voice.accent && (
                  <Badge variant="secondary" className="text-xs">
                    {voice.accent}
                  </Badge>
                )}
                {voice.language && (
                  <Badge variant="outline" className="text-xs">
                    {voice.language}
                  </Badge>
                )}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default VoiceSelector;
