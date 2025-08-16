
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { 
  Upload, 
  Download, 
  Info, 
  Phone, 
  Bot, 
  Rocket
} from "lucide-react";
import { useAuth } from "@/context";
import ApiService from "@/context/services/apiService";

const AICampaignBuilder = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { userAgent } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    campaignName: "",
    phoneNumber: "",
    csvFile: null as File | null,
    assistant: "",
    sendOption: "send-now"
  });

  // Mock data - in real app, these would come from API
  const [phoneNumbers] = useState([
    { id: "1", number: "+1 (555) 123-4567", location: "New York" },
    { id: "2", number: "+1 (555) 987-6543", location: "Los Angeles" },
    { id: "3", number: "+1 (555) 456-7890", location: "Chicago" }
  ]);

  const [assistants] = useState([
    { id: "1", name: "Riley - Appointment Scheduler", description: "Healthcare appointment scheduling" },
    { id: "2", name: "Elliot - Customer Support", description: "Technical support and inquiries" },
    { id: "3", name: "Sarah - Sales Agent", description: "Product sales and lead qualification" }
  ]);

  const handleInputChange = (field: string, value: string | File) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast({
          title: "File too large",
          description: "Please select a file smaller than 5MB",
          variant: "destructive"
        });
        return;
      }
      
      if (!file.name.endsWith('.csv')) {
        toast({
          title: "Invalid file type",
          description: "Please select a CSV file",
          variant: "destructive"
        });
        return;
      }

      handleInputChange('csvFile', file);
    }
  };

  const handleDownloadTemplate = () => {
    // Create and download CSV template
    const csvContent = "Name,Email,Phone,Company\nJohn Doe,john@example.com,+1234567890,Example Corp\nJane Smith,jane@example.com,+1234567891,Test Inc";
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'campaign_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleLaunchCampaign = async () => {
    if (!formData.campaignName || !formData.phoneNumber || !formData.assistant || !formData.csvFile) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields and upload a CSV file",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      // Create FormData for file upload
      const campaignData = new FormData();
      campaignData.append('campaignName', formData.campaignName);
      campaignData.append('phoneNumber', formData.phoneNumber);
      campaignData.append('assistant', formData.assistant);
      campaignData.append('sendOption', formData.sendOption);
      if (formData.csvFile) {
        campaignData.append('csvFile', formData.csvFile);
      }

      // In a real implementation, you would send this to your API
      // await ApiService.post('/campaign', campaignData);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));

      toast({
        title: "Campaign launched successfully!",
        description: "Your AI campaign is now active and making calls.",
      });

      navigate('/dashboard', { state: { activeTab: 'campaigns' } });
    } catch (error) {
      toast({
        title: "Error launching campaign",
        description: "Please try again or contact support if the issue persists.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Create AI Campaign</h1>
        <p className="text-gray-600">Set up your AI-powered calling campaign in minutes</p>
      </div>

      <Card className="border border-gray-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-gray-900">Campaign Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Campaign Name */}
          <div className="space-y-2">
            <Label htmlFor="campaignName" className="text-sm font-medium text-gray-700">
              Campaign Name
            </Label>
            <Input
              id="campaignName"
              placeholder="Campaign Name"
              value={formData.campaignName}
              onChange={(e) => handleInputChange('campaignName', e.target.value)}
              className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          {/* Phone Number */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="phoneNumber" className="text-sm font-medium text-gray-700">
                Phone Number
              </Label>
              <Info className="h-4 w-4 text-gray-400" />
            </div>
            <Select 
              value={formData.phoneNumber} 
              onValueChange={(value) => handleInputChange('phoneNumber', value)}
            >
              <SelectTrigger className="border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                {phoneNumbers.map((phone) => (
                  <SelectItem key={phone.id} value={phone.id}>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      <span>{phone.number}</span>
                      <span className="text-gray-500">({phone.location})</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {/* Best Practices Info Box */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <Info className="h-4 w-4 text-gray-500 mt-0.5" />
                <div className="text-sm text-gray-700">
                  <p className="font-medium mb-1">Best Practices</p>
                  <p>
                    Learn how to avoid spam flagging and optimize your calling strategy for better success rates.{" "}
                    <a 
                      href="#" 
                      className="text-blue-600 hover:text-blue-800 underline"
                      onClick={(e) => {
                        e.preventDefault();
                        toast({
                          title: "Best Practices",
                          description: "Coming soon: Detailed guide on avoiding spam flagging and optimizing call success rates.",
                        });
                      }}
                    >
                      Spam flagging best practices
                    </a>
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Upload CSV */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium text-gray-700">Upload CSV</Label>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadTemplate}
                className="border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                <Download className="h-4 w-4 mr-2" />
                Download template
              </Button>
            </div>
            
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
              <input
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="hidden"
                id="csv-upload"
              />
              <label htmlFor="csv-upload" className="cursor-pointer">
                <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-600 mb-2">
                  Drag and drop a CSV file here or click to select file locally
                </p>
                <p className="text-sm text-gray-500">Maximum file size: 5MB</p>
                {formData.csvFile && (
                  <p className="text-sm text-green-600 mt-2">
                    ✓ {formData.csvFile.name} selected
                  </p>
                )}
              </label>
            </div>
          </div>

          {/* Assistant */}
          <div className="space-y-2">
            <Label htmlFor="assistant" className="text-sm font-medium text-gray-700">
              Assistant
            </Label>
            <Select 
              value={formData.assistant} 
              onValueChange={(value) => handleInputChange('assistant', value)}
            >
              <SelectTrigger className="border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                {assistants.map((assistant) => (
                  <SelectItem key={assistant.id} value={assistant.id}>
                    <div className="flex items-center gap-2">
                      <Bot className="h-4 w-4" />
                      <div>
                        <div className="font-medium">{assistant.name}</div>
                        <div className="text-sm text-gray-500">{assistant.description}</div>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Choose when to send */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">Choose when to send</Label>
            <RadioGroup 
              value={formData.sendOption} 
              onValueChange={(value) => handleInputChange('sendOption', value)}
              className="flex gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="send-now" id="send-now" />
                <Label htmlFor="send-now" className="text-sm text-gray-700">Send Now</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="schedule-later" id="schedule-later" />
                <Label htmlFor="schedule-later" className="text-sm text-gray-700">Schedule for later</Label>
              </div>
            </RadioGroup>
          </div>
        </CardContent>
      </Card>

      {/* Launch Campaign Button */}
      <div className="flex justify-center">
        <Button
          onClick={handleLaunchCampaign}
          disabled={loading || !formData.campaignName || !formData.phoneNumber || !formData.assistant || !formData.csvFile}
          className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 text-lg font-medium shadow-sm"
        >
          {loading ? (
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              Launching...
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Rocket className="h-5 w-5" />
              Launch campaign
            </div>
          )}
        </Button>
      </div>
    </div>
  );
};

export default AICampaignBuilder;
