import { useState, useEffect, useCallback } from "react";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Volume2, Play, Search, Filter, X, Globe } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { elevenlabsService, VoiceWithAccent } from "@/services/elevenlabsService";

interface EnhancedVoiceSelectorProps {
  primaryLanguage: string;
  selectedVoiceId?: string;
  onVoiceChange: (voiceId: string) => void;
}

const EnhancedVoiceSelector = ({ 
  primaryLanguage, 
  selectedVoiceId, 
  onVoiceChange 
}: EnhancedVoiceSelectorProps) => {
  const [voices, setVoices] = useState<VoiceWithAccent[]>([]);
  const [allVoices, setAllVoices] = useState<VoiceWithAccent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [selectedGender, setSelectedGender] = useState<string>("all");
  const [playingVoice, setPlayingVoice] = useState<string | null>(null);
  const [showAllVoices, setShowAllVoices] = useState(false);
  const [searchMode, setSearchMode] = useState<'language' | 'search'>('language');

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300); // 300ms delay

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Load all voices once when component mounts
  useEffect(() => {
    const loadAllVoices = async () => {
      try {
        setLoading(true);
        const voicesData = await elevenlabsService.getVoicesWithAccents();
        setAllVoices(voicesData);
      } catch (error) {
        console.error('Failed to load all voices:', error);
        toast({
          title: "Error",
          description: "Failed to load voices. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadAllVoices();
  }, []);

  // Filter voices based on current state
  useEffect(() => {
    const filterVoices = async () => {
      if (allVoices.length === 0) return;

      let filteredVoices: VoiceWithAccent[] = [];

      if (searchMode === 'search' && debouncedSearchQuery.trim()) {
        // Use local search when user types in search box
        const searchTerm = debouncedSearchQuery.toLowerCase();
        filteredVoices = allVoices.filter(voice => {
          const labels = voice.labels || {};
          const description = voice.description || '';
          const name = voice.name || '';
          
          const matchesName = name.toLowerCase().includes(searchTerm);
          const matchesDescription = description.toLowerCase().includes(searchTerm);
          const matchesLabels = Object.values(labels).some(value => 
            value?.toLowerCase().includes(searchTerm)
          );
          
          return matchesName || matchesDescription || matchesLabels;
        });
      } else if (showAllVoices) {
        // Show all voices when toggle is on
        filteredVoices = allVoices;
      } else {
        // Show language-specific voices
        const languageName = getLanguageName(primaryLanguage);
        const languagePatterns = getLanguagePatterns(primaryLanguage);
        
        filteredVoices = allVoices.filter(voice => {
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
          const hasLanguagePattern = languagePatterns.some(pattern => 
            description.toLowerCase().includes(pattern) || 
            name.toLowerCase().includes(pattern)
          );
          
          return hasLanguageLabel || hasLanguageDescription || hasLanguagePattern;
        });

        // If no language-specific voices found, show all voices instead
        if (filteredVoices.length === 0) {
          console.log(`No language-specific voices found for ${primaryLanguage}, showing all voices`);
          filteredVoices = allVoices;
        }
      }

      setVoices(filteredVoices);
    };

    filterVoices();
  }, [allVoices, primaryLanguage, showAllVoices, debouncedSearchQuery, searchMode]);

  // Helper functions for language filtering
  const getLanguageName = (languageCode: string): string => {
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
  };

  const getLanguagePatterns = (languageCode: string): string[] => {
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
  };

  // Filter voices based on gender
  const filteredVoices = voices.filter(voice => {
    const matchesGender = selectedGender === "all" || voice.gender.toLowerCase() === selectedGender.toLowerCase();
    return matchesGender;
  });

  const handlePlayPreview = async (voiceId: string) => {
    if (playingVoice === voiceId) {
      setPlayingVoice(null);
      return;
    }

    setPlayingVoice(voiceId);
    try {
      const audioBlob = await elevenlabsService.generateSpeech(
        voiceId,
        "Hello! I'm calling from our company to discuss how we can help your business grow."
      );
      
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      
      audio.onended = () => {
        setPlayingVoice(null);
      };
      
      audio.play();
    } catch (error) {
      console.error("Error playing voice preview:", error);
      setPlayingVoice(null);
      toast({
        title: "Error",
        description: "Failed to play voice preview. Please try again.",
        variant: "destructive",
      });
    }
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedGender("all");
    setSearchMode('language');
  };

  const hasActiveFilters = searchQuery || (selectedGender && selectedGender !== "all");

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    if (value.trim()) {
      setSearchMode('search');
    } else {
      setSearchMode('language');
    }
  };

  if (loading) {
    return (
      <div className="space-y-2">
        <Label>Voice Selection</Label>
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-sm text-gray-600">Loading voices...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-base font-medium">Voice Selection</Label>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowAllVoices(!showAllVoices)}
        >
          {showAllVoices ? "Show Language-Specific" : "Show All Voices"}
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search voices by name, description, or language (e.g., 'norwegian', 'spanish')..."
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex gap-2 flex-wrap items-center">
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-gray-500" />
            <span className="text-sm text-gray-600">
              {searchMode === 'search' && searchQuery ? 
                `Searching for "${searchQuery}"` : 
                showAllVoices ? 
                  'Showing all available voices' :
                  `Showing voices for ${primaryLanguage} (or all voices if none found)`
              }
            </span>
          </div>

          <Select value={selectedGender} onValueChange={setSelectedGender}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Gender" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="male">Male</SelectItem>
              <SelectItem value="female">Female</SelectItem>
            </SelectContent>
          </Select>

          {hasActiveFilters && (
            <Button variant="outline" size="sm" onClick={clearFilters}>
              <X className="h-4 w-4 mr-1" />
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Voice Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-96 overflow-y-auto">
        {filteredVoices.length === 0 ? (
          <div className="col-span-full text-center py-8 text-gray-500">
            <Volume2 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p className="text-sm">No voices found</p>
            <p className="text-xs text-gray-400 mt-1">
              {searchQuery ? `Try a different search term` : `Try adjusting your filters`}
            </p>
          </div>
        ) : (
          filteredVoices.map((voice) => (
            <Card
              key={voice.id}
              className={`cursor-pointer transition-all hover:shadow-md ${
                selectedVoiceId === voice.id
                  ? "ring-2 ring-blue-500 bg-blue-50"
                  : "hover:bg-gray-50"
              }`}
              onClick={() => onVoiceChange(voice.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{voice.name}</h4>
                    {voice.description && (
                      <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                        {voice.description}
                      </p>
                    )}
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePlayPreview(voice.id);
                    }}
                    disabled={playingVoice === voice.id}
                  >
                    {playingVoice === voice.id ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    ) : (
                      <Play className="h-4 w-4" />
                    )}
                  </Button>
                </div>

                <div className="flex gap-1 flex-wrap">
                  <Badge variant="outline" className="text-xs capitalize">
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
                  {voice.category && (
                    <Badge variant="outline" className="text-xs">
                      {voice.category}
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Results Summary */}
      {filteredVoices.length > 0 && (
        <div className="text-sm text-gray-500 text-center">
          Showing {filteredVoices.length} of {voices.length} voices
          {hasActiveFilters && " (filtered)"}
          {searchMode === 'search' && searchQuery && ` for "${searchQuery}"`}
        </div>
      )}
    </div>
  );
};

export default EnhancedVoiceSelector;
