
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
  Sparkles
} from "lucide-react";
import { useAuth } from "@/context";
import { shouldHaveAccess, recoverUserState } from "../sidebar/unlockConditions";
import { toast } from "@/hooks/use-toast";

interface Assistant {
  id: string;
  name: string;
  description?: string;
  systemPrompt: string;
  voice: string;
  provider: string;
}

const YourAgentSection = () => {
  const { userAgent, hasCompletedSetup, progressState, updateProgressState } = useAuth();
  const [selectedAssistant, setSelectedAssistant] = useState<string>("1");
  const [searchQuery, setSearchQuery] = useState("");
  const [assistants, setAssistants] = useState<Assistant[]>([
    {
      id: "1",
      name: "Riley",
      description: "Appointment Scheduling Agent",
      systemPrompt: `# Appointment Scheduling Agent Prompt

## Identity & Purpose
You are Riley, an appointment scheduling voice assistant for Wellness Partners, a multi-specialty health clinic. Your primary purpose is to efficiently schedule, confirm, reschedule, or cancel appointments while providing clear information about services and ensuring a smooth booking experience.

## Voice & Persona
### Personality
- Professional yet warm and approachable
- Patient and understanding with callers
- Clear and articulate communication
- Empathetic to patient concerns and needs`,
      voice: "Sarah",
      provider: "11labs"
    },
    {
      id: "2",
      name: "Elliot",
      description: "Customer Support Agent",
      systemPrompt: `# Customer Support Agent Prompt

## Identity & Purpose
You are Elliot, a customer support specialist for TechCorp. Your role is to assist customers with technical issues, product inquiries, and general support needs.

## Voice & Persona
### Personality
- Technical expertise with friendly communication
- Problem-solving oriented
- Patient and thorough in explanations`,
      voice: "Molly",
      provider: "11labs"
    },
    {
      id: "3",
      name: "First agent for aaa",
      description: "9BWtsMINqrJLrRacOk9x",
      systemPrompt: `# Basic Agent Prompt

## Identity & Purpose
You are a general-purpose AI assistant designed to help with various tasks and inquiries.

## Voice & Persona
### Personality
- Helpful and informative
- Professional communication style`,
      voice: "Natasia",
      provider: "11labs"
    },
    {
      id: "4",
      name: "First agent for test",
      description: "FGY2WhTYpPnrIDTdsKH5",
      systemPrompt: `# Test Agent Prompt

## Identity & Purpose
You are a test agent for development and testing purposes.

## Voice & Persona
### Personality
- Basic test functionality
- Simple responses for testing`,
      voice: "Pavel",
      provider: "11labs"
    },
    {
      id: "5",
      name: "Riley",
      description: "rECOLXj3kZIXXXR3SBqN",
      systemPrompt: `# Riley Agent Prompt

## Identity & Purpose
You are Riley, a versatile AI assistant ready to help with various tasks.

## Voice & Persona
### Personality
- Friendly and helpful
- Professional yet approachable`,
      voice: "Sascha",
      provider: "11labs"
    }
  ]);

  const [voices] = useState([
    { id: "molly", name: "Molly", gender: "Female", color: "bg-pink-500" },
    { id: "monika", name: "Monika sogam", gender: "Female", color: "bg-purple-500" },
    { id: "natasia", name: "Natasia - snarky and mature", gender: "Female", color: "bg-red-500" },
    { id: "pavel", name: "Pavel meditation voice", gender: "Male", color: "bg-blue-500" },
    { id: "sascha", name: "Sascha", gender: "Male", color: "bg-green-500" },
    { id: "sarah", name: "Sarah", gender: "Female", color: "bg-indigo-500" }
  ]);

  const [providers] = useState([
    { id: "11labs", name: "11labs" },
  ]);

  const selectedAssistantData = assistants.find(a => a.id === selectedAssistant);
  const selectedVoice = voices.find(v => v.id === selectedAssistantData?.voice);

  const handleAssistantChange = (field: keyof Assistant, value: string) => {
    setAssistants(prev => 
      prev.map(a => 
        a.id === selectedAssistant 
          ? { ...a, [field]: value }
          : a
      )
    );
  };

  const filteredAssistants = assistants.filter(assistant =>
    assistant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    assistant.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex h-full space-x-6 bg-white text-gray-900">
      {/* Left Sidebar */}
      <div className="w-80 bg-gray-50 rounded-lg p-4 border border-gray-200">
                 {/* Top Bar */}
         <div className="mb-4">
           <Button className="w-full bg-green-600 hover:bg-green-700 text-white flex items-center justify-center gap-2 py-3 text-base font-medium shadow-sm">
             <Plus className="h-5 w-5" />
             Create Assistant
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
          {filteredAssistants.map((assistant) => (
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
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 bg-white rounded-lg p-6 border border-gray-200">
        {selectedAssistantData && (
          <div className="space-y-6">
            {/* System Prompt Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold text-gray-900">System Prompt</h2>
                <Info className="h-4 w-4 text-gray-500" />
                
                <Button className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2 ml-auto">
                  <Sparkles className="h-4 w-4" />
                  Generate
                </Button>
              </div>
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
                Select a voice from the list, or sync your voice library if it's missing. If errors occur, please contact support.
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

                {/* Voice */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">Voice</Label>
                  <Select 
                    value={selectedAssistantData.voice} 
                    onValueChange={(value) => handleAssistantChange('voice', value)}
                  >
                    <SelectTrigger className="bg-white border-gray-300 text-gray-900">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-gray-300 max-h-60">
                      <div className="p-2">
                        <Input
                          placeholder="Search voice..."
                          className="bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-500"
                        />
                      </div>
                      {voices.map((voice) => (
                        <SelectItem key={voice.id} value={voice.id} className="text-gray-900 hover:bg-gray-50">
                          <div className="flex items-center gap-3">
                            <div className={`w-6 h-6 rounded-full ${voice.color}`}></div>
                            <div>
                              <div className="font-medium">{voice.name}</div>
                              <div className="text-xs text-gray-500">({voice.gender})</div>
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Selected Voice Preview */}
              {selectedVoice && (
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full ${selectedVoice.color}`}></div>
                    <div>
                      <div className="font-medium text-gray-900">{selectedVoice.name}</div>
                      <div className="text-sm text-gray-600">{selectedVoice.gender}</div>
                    </div>
                    <Button size="sm" variant="outline" className="ml-auto border-gray-300 text-gray-700 hover:bg-gray-100">
                      Test Voice
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Save Button */}
            <div className="flex justify-end pt-6 border-t border-gray-200">
              <Button className="bg-green-600 hover:bg-green-700 text-white">
                Save Changes
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default YourAgentSection;
