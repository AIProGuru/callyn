
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
import EnhancedVoiceSelector from "../language/EnhancedVoiceSelector";
import { SUPPORTED_LANGUAGES, getLanguageByCode } from "../language/languageConfig";
import { authService } from "@/context/services/authService";
import { mapApiAgentToAssistant, Assistant } from "@/utils/agent";
import Vapi from "@vapi-ai/web";

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
  const [saving, setSaving] = useState(false);
  const [originalAssistant, setOriginalAssistant] = useState<Assistant | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

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

  // Track changes when selected assistant changes
  useEffect(() => {
    if (selectedAssistant) {
      const current = assistants.find(a => a.id === selectedAssistant);
      if (current) {
        setOriginalAssistant({ ...current });
        setHasChanges(false);
      }
    }
  }, [selectedAssistant]);

  // Check for changes
  useEffect(() => {
    if (!originalAssistant || !selectedAssistant) {
      setHasChanges(false);
      return;
    }

    const current = assistants.find(a => a.id === selectedAssistant);
    if (!current) {
      setHasChanges(false);
      return;
    }

    const changed = 
      current.name !== originalAssistant.name ||
      current.voice !== originalAssistant.voice ||
      current.provider !== originalAssistant.provider ||
      current.primaryLanguage !== originalAssistant.primaryLanguage ||
      current.systemPrompt !== originalAssistant.systemPrompt;

    setHasChanges(changed);
  }, [assistants, originalAssistant, selectedAssistant]);

  const handleCreateAssistant = async () => {
    try {
      setCreating(true);
      // Ask for a name first, with default
      const name = window.prompt('Name your assistant', 'New Assistant');
      
      // If user cancels (name is null), don't create the assistant
      if (name === null) {
        return;
      }
      
      // If user provides empty string, use default name
      const finalName = name.trim() || 'New Assistant';
      const apiAssistant = await authService.createAssistant(finalName);
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

  const handleSaveChanges = async () => {
    if (!selectedAssistantData || !hasChanges) return;
    
    try {
      setSaving(true);
      const updates = {
        name: selectedAssistantData.name,
        voice: selectedAssistantData.voice,
        model: 'chatgpt-4o-latest', // Default model
        instructions: selectedAssistantData.systemPrompt,
      };
      
      const updatedAssistant = await authService.updateAssistant(selectedAssistantData.id, updates);
      const mappedAssistant = mapApiAgentToAssistant(updatedAssistant);
      
      // Update the assistant in the list
      setAssistants(prev => prev.map(a => a.id === selectedAssistantData.id ? mappedAssistant : a));
      
      // Update original to reflect saved state
      setOriginalAssistant({ ...mappedAssistant });
      setHasChanges(false);
      
      toast({
        title: "Changes Saved",
        description: "Your assistant has been updated successfully.",
      });
    } catch (error) {
      console.error('Failed to save changes:', error);
      toast({
        title: "Save Failed",
        description: "Failed to save changes. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleTestAssistant = async () => {
    try {
      if (!selectedAssistant) return toast({ title: 'No assistant selected', variant: 'destructive' });
      const publicKey = import.meta.env.VITE_VAPI_PUBLIC_KEY as string;
      if (!publicKey) return toast({ title: 'Missing Vapi public key', description: 'Set VITE_VAPI_PUBLIC_KEY in your env.', variant: 'destructive' });
      const vapi = new Vapi(publicKey);
      vapi.on('call-start', () => console.log('Web call started'));
      vapi.on('call-end', () => console.log('Web call ended'));
      vapi.on('message', (message: any) => {
        if (message.type === 'transcript') {
          console.log(`${message.role}: ${message.transcript}`);
        }
      });
      await vapi.start(selectedAssistant);
      toast({ title: 'Starting web call', description: 'Microphone permission may be requested.' });
    } catch (err) {
      console.error('Web call error:', err);
      toast({ title: 'Failed to start web call', variant: 'destructive' });
    }
  };

  const filteredAssistants = assistants.filter(assistant =>
    assistant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    assistant.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading assistants...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full space-x-6 bg-background text-foreground">
      {/* Left Sidebar */}
      <div className="w-80 bg-muted/30 rounded-lg p-4 border border-border">
        {/* Top Bar */}
        <div className="mb-4">
          <Button onClick={handleCreateAssistant} disabled={creating} className="w-full bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600 text-white flex items-center justify-center gap-2 py-3 text-base font-medium shadow-sm">
            <Plus className="h-5 w-5" />
            {creating ? 'Creating...' : 'Create Assistant'}
          </Button>
          <Button onClick={handleTestAssistant} className="w-full mt-2 bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center gap-2 py-3 text-base font-medium shadow-sm">
            <Globe className="h-5 w-5" />
            Test Assistant (Web Call)
          </Button>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search Assistants"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Assistant List */}
        <div className="space-y-2">
          {filteredAssistants.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Bot className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-sm">No assistants found</p>
              <p className="text-xs text-muted-foreground mt-1">Create your first assistant to get started</p>
            </div>
          ) : (
            filteredAssistants.map((assistant) => (
              <div
                key={assistant.id}
                onClick={() => setSelectedAssistant(assistant.id)}
                className={`p-3 rounded-lg cursor-pointer transition-colors ${
                  selectedAssistant === assistant.id
                    ? "bg-primary/10 border border-primary/20"
                    : "bg-card border border-border hover:bg-accent"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-foreground">{assistant.name}</div>
                    {assistant.description && (
                      <div className="text-sm text-muted-foreground">{assistant.description}</div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 bg-card rounded-lg p-6 border border-border">
        {selectedAssistantData ? (
          <div className="space-y-6">
            {/* System Prompt Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold text-foreground">System Prompt</h2>
                <Info className="h-4 w-4 text-muted-foreground" />
                
                <Button onClick={() => setShowGenerator((s) => !s)} className="bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600 text-white flex items-center gap-2 ml-auto">
                  <Sparkles className="h-4 w-4" />
                  Generate
                </Button>
              </div>
              
              {showGenerator && (
                <div className="rounded-md border border-border p-3 bg-muted/30">
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
                className="min-h-[300px] font-mono text-sm"
                placeholder="Enter your system prompt here..."
              />
            </div>

            {/* Voice Configuration Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Volume2 className="h-5 w-5 text-muted-foreground" />
                <h2 className="text-lg font-semibold text-foreground">Voice Configuration</h2>
              </div>
              
              <p className="text-sm text-muted-foreground">
                Select a language and voice for your AI agent. The available voices will be filtered based on the selected language.
              </p>

              <div className="grid grid-cols-2 gap-4">
                {/* Provider */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-foreground">Provider</Label>
                  <Select 
                    value={selectedAssistantData.provider} 
                    onValueChange={(value) => handleAssistantChange('provider', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {providers.map((provider) => (
                        <SelectItem key={provider.id} value={provider.id}>
                          {provider.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Language */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-foreground">Primary Language</Label>
                  <Select 
                    value={selectedAssistantData.primaryLanguage} 
                    onValueChange={(value) => handleAssistantChange('primaryLanguage', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SUPPORTED_LANGUAGES.map((language) => (
                        <SelectItem key={language.code} value={language.code}>
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
                <EnhancedVoiceSelector
                  primaryLanguage={selectedAssistantData.primaryLanguage}
                  selectedVoiceId={selectedAssistantData.voice}
                  onVoiceChange={handleVoiceChange}
                />
              </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end pt-6 border-t border-border">
              <Button 
                className="bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600 text-white" 
                onClick={handleSaveChanges}
                disabled={!hasChanges || saving}
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <Bot className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium text-foreground mb-2">No Assistant Selected</h3>
            <p className="text-muted-foreground">Select an assistant from the sidebar to view and edit its configuration.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default YourAgentSection;
