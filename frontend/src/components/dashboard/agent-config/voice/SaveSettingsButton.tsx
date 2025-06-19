
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { LanguageConfig } from "../../outreach/types";
import { useAuth } from "@/context/AuthContext";

interface SaveSettingsButtonProps {
  selectedVoice: string;
  speakingSpeed: number;
  enthusiasm: number;
  languageConfig: LanguageConfig;
}

const SaveSettingsButton = ({ 
  selectedVoice, 
  speakingSpeed, 
  enthusiasm, 
  languageConfig 
}: SaveSettingsButtonProps) => {

  const { toast } = useToast();
  const {updateUserAgent} = useAuth();

  const handleSaveSettings = () => {
    const updatedData = {
      selectedVoice,
      speakingSpeed,
      enthusiasm,
      languageConfig
    };
    console.log(updatedData)

    updateUserAgent(updatedData);
    
    toast({
      title: "Settings Saved",
      description: "Voice and language settings have been updated successfully.",
    });
  };

  return (
    <div className="flex justify-end">
      <Button onClick={handleSaveSettings} className="bg-blue-600 hover:bg-blue-700">
        Save Voice & Language Settings
      </Button>
    </div>
  );
};

export default SaveSettingsButton;
