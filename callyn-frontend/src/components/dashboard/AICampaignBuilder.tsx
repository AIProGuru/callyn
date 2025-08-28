
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  Upload, 
  Download, 
  Info, 
  Phone, 
  Bot,
  Rocket,
  Loader2
} from "lucide-react";
import { useAuth } from "@/context";
import { authService } from "@/context/services/authService";
import ApiService from "@/context/services/apiService";
import { Calendar } from "@/components/ui/calendar";

const AICampaignBuilder = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { userAgent } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    campaignName: "",
    phoneNumber: "",
    assistant: "",
    csvFile: null as File | null,
    sendOption: "send-now"
  });

  // Real data from API
  const [phoneNumbers, setPhoneNumbers] = useState<any[]>([]);
  const [assistants, setAssistants] = useState<any[]>([]);
  const [loadingPhones, setLoadingPhones] = useState(false);
  const [loadingAssistants, setLoadingAssistants] = useState(false);
  
  // Schedule modal state
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [scheduleDate, setScheduleDate] = useState<Date | undefined>(new Date());
  const [scheduleHour, setScheduleHour] = useState<string>("01");
  const [scheduleMinute, setScheduleMinute] = useState<string>("00");
  const [scheduleAmPm, setScheduleAmPm] = useState<'AM' | 'PM'>("AM");
  const [scheduleTimezone, setScheduleTimezone] = useState<string>(Intl.DateTimeFormat().resolvedOptions().timeZone);

  // Load data on component mount
  useEffect(() => {
    loadPhoneNumbers();
    loadAssistants();
  }, []);

  const loadPhoneNumbers = async () => {
    try {
      setLoadingPhones(true);
      const phones = await authService.getPhones();
      setPhoneNumbers(phones);
    } catch (error) {
      console.error('Failed to load phone numbers:', error);
      toast({
        title: "Error",
        description: "Failed to load phone numbers. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoadingPhones(false);
    }
  };

  const loadAssistants = async () => {
    try {
      setLoadingAssistants(true);
      const assistantsData = await authService.getAssistants();
      setAssistants(assistantsData);
    } catch (error) {
      console.error('Failed to load assistants:', error);
      toast({
        title: "Error",
        description: "Failed to load assistants. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoadingAssistants(false);
    }
  };



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
    const csvContent = "Name,Phone\nJohn Doe,+1234567890\nJane Smith,+1234567891";
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'campaign_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const parseCSV = (file: File): Promise<Array<{ name: string; number: string }>> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const text = e.target?.result as string;
          const lines = text.split('\n');
          const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
          
          // Find name and phone columns
          const nameIndex = headers.findIndex(h => h === 'name');
          const phoneIndex = headers.findIndex(h => h === 'phone');
          
          if (nameIndex === -1 || phoneIndex === -1) {
            reject(new Error('CSV must contain "Name" and "Phone" columns'));
            return;
          }

          const customers = lines.slice(1)
            .filter(line => line.trim())
            .map(line => {
              const values = line.split(',').map(v => v.trim());
              return {
                name: values[nameIndex] || 'Unknown',
                number: values[phoneIndex] || ''
              };
            })
            .filter(customer => customer.number); // Only include customers with phone numbers

          if (customers.length === 0) {
            reject(new Error('No valid customers found in CSV'));
            return;
          }

          resolve(customers);
        } catch (error) {
          reject(new Error('Failed to parse CSV file'));
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
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

    // If scheduling for later, open schedule modal
    if (formData.sendOption === "schedule-later") {
      setIsScheduleOpen(true);
      return;
    }

    // Launch campaign immediately
    await launchCampaign();
  };

  const launchCampaign = async (scheduledTime?: string) => {
    setLoading(true);
    try {
      // Parse CSV file
      const customers = await parseCSV(formData.csvFile!);
      
      // Find selected phone number and assistant
      const selectedPhone = phoneNumbers.find(p => p.phone_id === formData.phoneNumber);
      const selectedAssistant = assistants.find(a => a.assistant_id === formData.assistant);

      if (!selectedPhone || !selectedAssistant) {
        throw new Error('Selected phone number or assistant not found');
      }

      // Prepare campaign payload
      const campaignPayload: any = {
        name: formData.campaignName,
        phoneNumberId: selectedPhone.phone_id,
        assistantId: selectedAssistant.assistant_id,
        customers: customers.map(customer => ({
          number: customer.number,
          name: customer.name
        }))
      };

      // Add scheduling if provided
      if (scheduledTime) {
        const scheduledDate = new Date(scheduledTime);
        // VAPI requires latestAt to be within 1 hour of earliestAt
        const latestAt = new Date(scheduledDate.getTime() + 60 * 60 * 1000); // 1 hour later
        
        campaignPayload.schedulePlan = {
          earliestAt: scheduledDate.toISOString(),
          latestAt: latestAt.toISOString()
        };
      }

      // Create campaign using backend API
      const response = await ApiService.post('/campaign', campaignPayload);

      console.log('Campaign created:', response);

      const message = scheduledTime 
        ? "Your AI campaign has been scheduled successfully!"
        : "Your AI campaign is now active and making calls.";

      toast({
        title: "Campaign launched successfully!",
        description: message,
      });

      navigate('/dashboard', { state: { activeTab: 'campaigns' } });
    } catch (error) {
      console.error('Campaign creation error:', error);
      toast({
        title: "Error launching campaign",
        description: error instanceof Error ? error.message : "Please try again or contact support if the issue persists.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleScheduleConfirm = () => {
    if (!scheduleDate) {
      toast({
        title: "Please select a date",
        description: "Please select a date for scheduling",
        variant: "destructive"
      });
      return;
    }

    // Create date in user's timezone
    const scheduledDateTime = new Date(scheduleDate);
    scheduledDateTime.setHours(
      scheduleAmPm === 'PM' ? parseInt(scheduleHour) + 12 : parseInt(scheduleHour),
      parseInt(scheduleMinute),
      0,
      0
    );

    // Convert to UTC for VAPI (which expects UTC timestamps)
    const utcDateTime = new Date(scheduledDateTime.toLocaleString("en-US", {timeZone: scheduleTimezone}));
    const utcOffset = scheduledDateTime.getTime() - utcDateTime.getTime();
    const finalDateTime = new Date(scheduledDateTime.getTime() + utcOffset);

    // Ensure the time is in the future
    const now = new Date();
    if (finalDateTime <= now) {
      toast({
        title: "Invalid time",
        description: "Please select a time in the future",
        variant: "destructive"
      });
      return;
    }

    setIsScheduleOpen(false);
    launchCampaign(finalDateTime.toISOString());
  };

  return (
    <div className="space-y-6">
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
              disabled={loadingPhones}
            >
              <SelectTrigger className="border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                <SelectValue placeholder={loadingPhones ? "Loading phone numbers..." : "Select"} />
              </SelectTrigger>
              <SelectContent>
                {loadingPhones ? (
                  <div className="flex items-center justify-center p-4">
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    <span>Loading phone numbers...</span>
                  </div>
                ) : phoneNumbers.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">
                    No phone numbers available
                  </div>
                ) : (
                                     phoneNumbers.map((phone) => (
                     <SelectItem key={phone.id} value={phone.phone_id}>
                       <div className="flex items-center gap-2">
                         <Phone className="h-4 w-4" />
                         <span>{phone.display_number || phone.number || phone.phone_id}</span>
                         <span className="text-gray-500">
                           ({phone.status || 'Active'})
                         </span>
                       </div>
                     </SelectItem>
                   ))
                )}
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
               disabled={loadingAssistants}
             >
               <SelectTrigger className="border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                 <SelectValue placeholder={loadingAssistants ? "Loading assistants..." : "Select"} />
               </SelectTrigger>
               <SelectContent>
                 {loadingAssistants ? (
                   <div className="flex items-center justify-center p-4">
                     <Loader2 className="h-4 w-4 animate-spin mr-2" />
                     <span>Loading assistants...</span>
                   </div>
                 ) : assistants.length === 0 ? (
                   <div className="p-4 text-center text-gray-500">
                     No assistants available
                   </div>
                 ) : (
                                       assistants.map((assistant) => (
                      <SelectItem key={assistant.id} value={assistant.assistant_id}>
                        <div className="flex items-center gap-2">
                          <Bot className="h-4 w-4" />
                          <div>
                            <div className="font-medium">{assistant.name}</div>
                            <div className="text-sm text-gray-500">
                              {assistant.voice || assistant.model || 'AI Assistant'}
                            </div>
                          </div>
                        </div>
                      </SelectItem>
                    ))
                 )}
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
              {formData.sendOption === "schedule-later" ? "Schedule campaign" : "Launch campaign"}
            </div>
          )}
        </Button>
      </div>

      {/* Schedule Modal */}
      <Dialog open={isScheduleOpen} onOpenChange={setIsScheduleOpen}>
        <DialogContent className="sm:max-w-[720px]">
          <DialogHeader>
            <DialogTitle>Schedule Campaign</DialogTitle>
            <DialogDescription>Select date and time for your AI campaign to start.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Calendar */}
            <div className="border rounded-md p-2">
              <Calendar
                mode="single"
                selected={scheduleDate}
                onSelect={setScheduleDate}
                fromDate={new Date()}
                className="rounded-md border-0"
              />
            </div>
            {/* Time Picker */}
            <div className="border rounded-md p-4">
              <div className="text-sm font-semibold mb-3">Select Time</div>
                             <div className="grid grid-cols-4 gap-3 items-start">
                 {/* Hour */}
                 <div className="space-y-2">
                   <div className="text-xs text-muted-foreground">Hour</div>
                   <div className="max-h-56 overflow-y-auto pr-1">
                     {Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, '0')).map(h => (
                       <button
                         key={h}
                         className={`w-full text-left px-3 py-2 rounded transition-colors ${
                           scheduleHour === h 
                             ? 'bg-purple-600 text-white' 
                             : 'hover:bg-gray-100 text-gray-700'
                         }`}
                         onClick={() => setScheduleHour(h)}
                       >
                         {h}
                       </button>
                     ))}
                   </div>
                 </div>
                 {/* Minute */}
                 <div className="space-y-2">
                   <div className="text-xs text-muted-foreground">Minute</div>
                   <div className="max-h-56 overflow-y-auto pr-1">
                     {Array.from({ length: 60 }, (_, i) => (i).toString().padStart(2, '0')).map(m => (
                       <button
                         key={m}
                         className={`w-full text-left px-3 py-2 rounded transition-colors ${
                           scheduleMinute === m 
                             ? 'bg-purple-600 text-white' 
                             : 'hover:bg-gray-100 text-gray-700'
                         }`}
                         onClick={() => setScheduleMinute(m)}
                       >
                         {m}
                       </button>
                     ))}
                   </div>
                 </div>
                 {/* AM/PM */}
                 <div className="space-y-2">
                   <div className="text-xs text-muted-foreground">AM/PM</div>
                   <div className="grid grid-cols-2 gap-2">
                     {(['AM','PM'] as const).map(ap => (
                       <button
                         key={ap}
                         className={`px-3 py-2 rounded transition-colors ${
                           scheduleAmPm === ap 
                             ? 'bg-purple-600 text-white' 
                             : 'hover:bg-gray-100 text-gray-700'
                         }`}
                         onClick={() => setScheduleAmPm(ap)}
                       >
                         {ap}
                       </button>
                     ))}
                   </div>
                 </div>
                 {/* Timezone */}
                 <div className="space-y-2">
                   <div className="text-xs text-muted-foreground">Timezone</div>
                   <Select value={scheduleTimezone} onValueChange={setScheduleTimezone}>
                     <SelectTrigger className="h-10">
                       <SelectValue />
                     </SelectTrigger>
                     <SelectContent>
                       <SelectItem value="America/New_York">Eastern Time</SelectItem>
                       <SelectItem value="America/Chicago">Central Time</SelectItem>
                       <SelectItem value="America/Denver">Mountain Time</SelectItem>
                       <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                       <SelectItem value="Europe/London">London</SelectItem>
                       <SelectItem value="Europe/Paris">Paris</SelectItem>
                       <SelectItem value="Asia/Tokyo">Tokyo</SelectItem>
                       <SelectItem value="Asia/Shanghai">Shanghai</SelectItem>
                       <SelectItem value="Australia/Sydney">Sydney</SelectItem>
                       <SelectItem value="UTC">UTC</SelectItem>
                     </SelectContent>
                   </Select>
                 </div>
               </div>
              <div className="mt-6 flex justify-end gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => setIsScheduleOpen(false)}
                  className="border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleScheduleConfirm}
                  disabled={!scheduleDate}
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                >
                  Confirm Schedule
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AICampaignBuilder;
