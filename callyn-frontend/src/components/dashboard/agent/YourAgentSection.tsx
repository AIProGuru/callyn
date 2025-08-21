
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Bot, 
  Settings, 
  Plus, 
  Search, 
  Info, 
  Volume2, 
  ChevronDown,
  Folder,
  Sparkles,
  Globe
} from "lucide-react";
import { useAuth } from "@/context";
import { shouldHaveAccess, recoverUserState } from "../sidebar/unlockConditions";
import { toast } from "@/hooks/use-toast";
import VoiceSelector from "../language/VoiceSelector";
import { SUPPORTED_LANGUAGES, getLanguageByCode } from "../language/languageConfig";
import { authService } from "@/context/services/authService";
import { mapApiAgentToAssistant, Assistant } from "@/utils/agent";

const YourAgentSection = () => {
  const { userAgent, hasCompletedSetup, progressState, updateProgressState } = useAuth();
  const [selectedAssistant, setSelectedAssistant] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [assistants, setAssistants] = useState<Assistant[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showGenerator, setShowGenerator] = useState(false);
  const [generatorInput, setGeneratorInput] = useState('');
  const [generating, setGenerating] = useState(false);

  // Fetch assistants from API
  useEffect(() => {
    const fetchAssistants = async () => {
      try {
        setLoading(true);
        const apiAssistants = await authService.getAssistants();
        const mappedAssistants = apiAssistants.map(mapApiAgentToAssistant);
        setAssistants(mappedAssistants);
        
        // Set the first assistant as selected if available
        if (mappedAssistants.length > 0 && !selectedAssistant) {
          setSelectedAssistant(mappedAssistants[0].id);
        }
      } catch (error) {
        console.error('Failed to fetch assistants:', error);
        toast({
          title: "Error",
          description: "Failed to load assistants. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchAssistants();
  }, []);
  const handleCreateAssistant = async () => {
    try {
      setCreating(true);
      // Ask for a name first, with default
      const name = window.prompt('Name your assistant', 'New Assistant') || 'New Assistant';
      const apiAssistant = await authService.createAssistant(name);
      const newAssistant = mapApiAgentToAssistant(apiAssistant);
      setAssistants(prev => [newAssistant, ...prev]);
      setSelectedAssistant(newAssistant.id);
      toast({ title: 'Assistant created', description: `${newAssistant.name} is ready to configure.` });
    } catch (err) {
      console.error('Failed to create assistant:', err);
      toast({ title: 'Failed to create assistant', description: 'Please try again.', variant: 'destructive' });
    } finally {
      setCreating(false);
    }
  }

  const [providers] = useState([
    { id: "11labs", name: "11labs" },
  ]);

  const selectedAssistantData = assistants.find(a => a.id === selectedAssistant);

  const handleAssistantChange = (field: keyof Assistant, value: string) => {
    setAssistants(prev => 
      prev.map(a => 
        a.id === selectedAssistant 
          ? { ...a, [field]: value }
          : a
      )
    );
  };

  const handleVoiceChange = (voiceId: string) => {
    handleAssistantChange('voice', voiceId);
  };

  const filteredAssistants = assistants.filter(assistant =>
    assistant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    assistant.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading assistants...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full space-x-6 bg-white text-gray-900">
      {/* Left Sidebar */}
      <div className="w-80 bg-gray-50 rounded-lg p-4 border border-gray-200">
                 {/* Top Bar */}
         <div className="mb-4">
           <Button onClick={handleCreateAssistant} disabled={creating} className="w-full bg-green-600 hover:bg-green-700 text-white flex items-center justify-center gap-2 py-3 text-base font-medium shadow-sm">
             <Plus className="h-5 w-5" />
             {creating ? 'Creating...' : 'Create Assistant'}
           </Button>
         </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search Assistants"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-white border-gray-300 text-gray-900 placeholder-gray-500"
          />
        </div>

        {/* Assistant List */}
        <div className="space-y-2">
          {filteredAssistants.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Bot className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p className="text-sm">No assistants found</p>
              <p className="text-xs text-gray-400 mt-1">Create your first assistant to get started</p>
            </div>
          ) : (
            filteredAssistants.map((assistant) => (
              <div
                key={assistant.id}
                onClick={() => setSelectedAssistant(assistant.id)}
                className={`p-3 rounded-lg cursor-pointer transition-colors ${
                  selectedAssistant === assistant.id
                    ? "bg-blue-50 border border-blue-200"
                    : "bg-white border border-gray-200 hover:bg-gray-50"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900">{assistant.name}</div>
                    {assistant.description && (
                      <div className="text-sm text-gray-600">{assistant.description}</div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 bg-white rounded-lg p-6 border border-gray-200">
        {selectedAssistantData ? (
          <div className="space-y-6">
            {/* System Prompt Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold text-gray-900">System Prompt</h2>
                <Info className="h-4 w-4 text-gray-500" />
                
                <Button onClick={() => setShowGenerator((s) => !s)} className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2 ml-auto">
                  <Sparkles className="h-4 w-4" />
                  Generate
                </Button>
              </div>
              {showGenerator && (
                <div className="rounded-md border border-gray-200 p-3 bg-white">
                  <Input
                    placeholder="Describe your business or requirements..."
                    value={generatorInput}
                    onChange={(e) => setGeneratorInput(e.target.value)}
                    className="mb-3"
                  />
                  <div className="flex gap-2 justify-end">
                    <Button variant="outline" onClick={() => setShowGenerator(false)} disabled={generating}>Cancel</Button>
                    <Button
                      onClick={async () => {
                        if (!selectedAssistantData) return;
                        try {
                          setGenerating(true);
                          // Start streaming; append tokens directly into the textarea value
                          // so user sees it build in real-time
                          await authService.streamGeneratedPrompt(generatorInput || 'Create a great system prompt.', {}, (token) => {
                            setAssistants((prev) => prev.map((a) => a.id === selectedAssistant ? { ...a, systemPrompt: (a.systemPrompt || '') + token } : a));
                          });
                          toast({ title: 'Prompt generated' });
                          setShowGenerator(false);
                        } catch (err) {
                          console.error(err);
                          toast({ title: 'Failed to generate', variant: 'destructive' });
                        } finally {
                          setGenerating(false);
                        }
                      }}
                      disabled={generating}
                    >{generating ? 'Generating…' : 'Submit Edit'}</Button>
                  </div>
                </div>
              )}
              <Textarea
                value={selectedAssistantData.systemPrompt}
                onChange={(e) => handleAssistantChange('systemPrompt', e.target.value)}
                className="min-h-[300px] bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-500 font-mono text-sm"
                placeholder="Enter your system prompt here..."
              />
            </div>

            {/* Voice Configuration Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Volume2 className="h-5 w-5 text-gray-500" />
                <h2 className="text-lg font-semibold text-gray-900">Voice Configuration</h2>
              </div>
              
              <p className="text-sm text-gray-600">
                Select a language and voice for your AI agent. The available voices will be filtered based on the selected language.
              </p>

              <div className="grid grid-cols-2 gap-4">
                {/* Provider */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">Provider</Label>
                  <Select 
                    value={selectedAssistantData.provider} 
                    onValueChange={(value) => handleAssistantChange('provider', value)}
                  >
                    <SelectTrigger className="bg-white border-gray-300 text-gray-900">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-gray-300">
                      {providers.map((provider) => (
                        <SelectItem key={provider.id} value={provider.id} className="text-gray-900 hover:bg-gray-50">
                          {provider.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Language */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">Primary Language</Label>
                  <Select 
                    value={selectedAssistantData.primaryLanguage} 
                    onValueChange={(value) => handleAssistantChange('primaryLanguage', value)}
                  >
                    <SelectTrigger className="bg-white border-gray-300 text-gray-900">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-gray-300">
                      {SUPPORTED_LANGUAGES.map((language) => (
                        <SelectItem key={language.code} value={language.code} className="text-gray-900 hover:bg-gray-50">
                          <div className="flex items-center gap-2">
                            <span>{language.flag}</span>
                            <span>{language.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Voice Selector */}
              <div className="mt-4">
                <VoiceSelector
                  primaryLanguage={selectedAssistantData.primaryLanguage}
                  selectedVoiceId={selectedAssistantData.voice}
                  onVoiceChange={handleVoiceChange}
                />
              </div>

              {/* Selected Voice Preview */}
              {/* {selectedAssistantData.voice && (
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="flex items-center gap-3">
                    <Volume2 className="h-5 w-5 text-gray-500" />
                    <div>
                      <div className="font-medium text-gray-900">Selected Voice</div>
                      <div className="text-sm text-gray-600">Voice ID: {selectedAssistantData.voice}</div>
                    </div>
                    <Button size="sm" variant="outline" className="ml-auto border-gray-300 text-gray-700 hover:bg-gray-100">
                      Test Voice
                    </Button>
                  </div>
                </div>
              )} */}
            </div>

            {/* Save Button */}
            <div className="flex justify-end pt-6 border-t border-gray-200">
              <Button className="bg-green-600 hover:bg-green-700 text-white">
                Save Changes
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <Bot className="h-16 w-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Assistant Selected</h3>
            <p className="text-gray-600">Select an assistant from the sidebar to view and edit its configuration.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default YourAgentSection;
