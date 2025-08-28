import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Phone, 
  Settings, 
  Flag, 
  AlertTriangle,
  CheckCircle,
  Clock,
  ChevronDown,
  Loader2,
  Upload,
  FileText,
  Table
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { authService } from "@/context/services/authService";
import { Calendar } from "@/components/ui/calendar";

interface PhoneNumberConfig {
  id: string;
  number: string;
  displayNumber: string;
  isActive: boolean;
  assistant?: string;
  squad?: string;
  workflow?: string;
  fallbackNumber?: string;
  outboundNumber?: string;
  outboundAssistant?: string;
  outboundSquad?: string;
  outboundWorkflow?: string;
  callOption?: 'single' | 'multiple';
}

interface PhoneNumberConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  phoneNumber: PhoneNumberConfig | null;
  onSave: (config: PhoneNumberConfig) => void;
}

const PhoneNumberConfigModal = ({ isOpen, onClose, phoneNumber, onSave }: PhoneNumberConfigModalProps) => {
  const [config, setConfig] = useState<PhoneNumberConfig | null>(null);
  const [saving, setSaving] = useState(false);
  const [assistants, setAssistants] = useState<any[]>([]);
  const [loadingAssistants, setLoadingAssistants] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [googleSheetsUrl, setGoogleSheetsUrl] = useState("");
  const [dataSource, setDataSource] = useState<'csv' | 'sheets'>('csv');
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [scheduleDate, setScheduleDate] = useState<Date | undefined>(new Date());
  const [scheduleHour, setScheduleHour] = useState<string>("01");
  const [scheduleMinute, setScheduleMinute] = useState<string>("00");
  const [scheduleAmPm, setScheduleAmPm] = useState<'AM' | 'PM'>("AM");

  useEffect(() => {
    if (phoneNumber) {
      setConfig({ ...phoneNumber });
    }
  }, [phoneNumber]);

  // Load assistants when modal opens
  useEffect(() => {
    if (isOpen) {
      loadAssistants();
    }
  }, [isOpen]);

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

  const handleConfigChange = (field: keyof PhoneNumberConfig, value: string) => {
    if (config) {
      setConfig({ ...config, [field]: value });
    }
  };

  const handleFileUpload = (file: File) => {
    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      toast({
        title: "File Too Large",
        description: "Maximum file size is 5MB. Please choose a smaller file.",
        variant: "destructive",
      });
      return;
    }
    
    if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
      toast({
        title: "Invalid File Type",
        description: "Please upload a CSV file.",
        variant: "destructive",
      });
      return;
    }
    
    setUploadedFile(file);
    toast({
      title: "File Uploaded",
      description: `${file.name} has been uploaded successfully.`,
    });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleGoogleSheetsUrlChange = (url: string) => {
    setGoogleSheetsUrl(url);
    // Validate Google Sheets URL format
    const sheetsRegex = /^https:\/\/docs\.google\.com\/spreadsheets\/d\/[a-zA-Z0-9-_]+/;
    if (url && !sheetsRegex.test(url)) {
      toast({
        title: "Invalid URL",
        description: "Please enter a valid Google Sheets URL.",
        variant: "destructive",
      });
    }
  };

  const handleSave = async () => {
    if (!config) return;
    
    try {
      setSaving(true);
      // Simulate save process
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      onSave(config);
      toast({
        title: "Configuration Saved",
        description: "Phone number settings have been updated successfully.",
      });
      onClose();
    } catch (error) {
      toast({
        title: "Save Failed",
        description: "Failed to save configuration. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (!config) return null;

  const workflows = [
    { id: "1", name: "Lead Qualification" },
    { id: "2", name: "Appointment Booking" },
    { id: "3", name: "Customer Support" }
  ];

  return (
    <>
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Configure {config.displayNumber}
          </DialogTitle>
          <DialogDescription>
            Set up inbound and outbound call handling for this phone number.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Inbound Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Inbound Settings</CardTitle>
              <CardDescription>
                Configure how incoming calls to this number are handled
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Inbound Phone Number */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Inbound Phone Number</Label>
                <div className="flex items-center gap-2">
                  <Input 
                    value={config.number} 
                    readOnly 
                    className="bg-gray-50"
                  />
                  <CheckCircle className="h-5 w-5 text-green-500" />
                </div>
              </div>

              {/* Assistant */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Assistant</Label>
                <Select 
                  value={config.assistant || ""} 
                  onValueChange={(value) => handleConfigChange('assistant', value)}
                  disabled={loadingAssistants}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={loadingAssistants ? "Loading assistants..." : "Select Assistant..."} />
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
                      <SelectItem key={assistant.id} value={assistant.id}>
                        {assistant.name}
                      </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* Fallback Destination */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Fallback Destination</Label>
                <p className="text-sm text-gray-600">
                  Set a fallback destination for inbound calls when the assistant or squad is not available.
                </p>
                <div className="flex gap-2">
                  <Select defaultValue="us">
                    <SelectTrigger className="w-32">
                      <div className="flex items-center gap-2">
                        <Flag className="h-4 w-4" />
                        <span>US</span>
                        <ChevronDown className="h-4 w-4" />
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="us">US</SelectItem>
                      <SelectItem value="ca">CA</SelectItem>
                      <SelectItem value="uk">UK</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input 
                    placeholder="Enter a phone number"
                    value={config.fallbackNumber || ""}
                    onChange={(e) => handleConfigChange('fallbackNumber', e.target.value)}
                    className="flex-1"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Outbound Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Outbound Settings</CardTitle>
              <CardDescription>
                Configure outbound calling settings and fallback options
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Call Options */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Call Options</Label>
                <div className="flex gap-6">
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="single-call"
                      name="callOption"
                      value="single"
                      checked={config.callOption === "single"}
                      onChange={(e) => handleConfigChange('callOption', e.target.value)}
                      className="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 focus:ring-green-500"
                    />
                    <Label htmlFor="single-call" className="text-sm font-medium text-gray-700">
                      Call One Number
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="multiple-call"
                      name="callOption"
                      value="multiple"
                      checked={config.callOption === "multiple"}
                      onChange={(e) => handleConfigChange('callOption', e.target.value)}
                      className="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 focus:ring-green-500"
                    />
                    <Label htmlFor="multiple-call" className="text-sm font-medium text-gray-700">
                       Call Many Numbers
                     </Label>
                   </div>
                 </div>
               </div>

               {/* Multiple Numbers Upload Section */}
               {config.callOption === "multiple" && (
                 <div className="space-y-4">
                   <div className="text-sm text-gray-600">
                     You can assign an outbound phone number, set up a fallback and set up a squad to be called if the assistant is not available.
                   </div>
                   
                   {/* Data Source Selection */}
                   <div className="space-y-2">
                     <Label className="text-sm font-medium text-gray-700">Data Source</Label>
                     <div className="flex gap-4">
                       <div className="flex items-center space-x-2">
                         <input
                           type="radio"
                           id="csv-source"
                           name="dataSource"
                           value="csv"
                           checked={dataSource === "csv"}
                           onChange={(e) => setDataSource(e.target.value as 'csv')}
                           className="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 focus:ring-green-500"
                         />
                         <Label htmlFor="csv-source" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                           <FileText className="h-4 w-4" />
                           Upload CSV File
                         </Label>
                       </div>
                       <div className="flex items-center space-x-2">
                         <input
                           type="radio"
                           id="sheets-source"
                           name="dataSource"
                           value="sheets"
                           checked={dataSource === "sheets"}
                           onChange={(e) => setDataSource(e.target.value as 'sheets')}
                           className="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 focus:ring-green-500"
                         />
                         <Label htmlFor="sheets-source" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                           <Table className="h-4 w-4" />
                           Google Sheets
                    </Label>
                  </div>
                </div>
              </div>

                   {/* CSV Upload */}
                   {dataSource === "csv" && (
                     <div className="space-y-2">
                       <Label className="text-sm font-medium text-gray-700">Upload CSV File</Label>
                       <div
                         className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                           isDragOver 
                             ? 'border-green-500 bg-green-50' 
                             : uploadedFile 
                               ? 'border-green-500 bg-green-50' 
                               : 'border-gray-300 bg-gray-50 hover:border-gray-400'
                         }`}
                         onDragOver={handleDragOver}
                         onDragLeave={handleDragLeave}
                         onDrop={handleDrop}
                       >
                         {uploadedFile ? (
                           <div className="space-y-2">
                             <CheckCircle className="h-8 w-8 text-green-500 mx-auto" />
                             <p className="text-sm font-medium text-gray-900">{uploadedFile.name}</p>
                             <p className="text-xs text-gray-500">
                               {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                             </p>
                             <Button
                               variant="outline"
                               size="sm"
                               onClick={() => setUploadedFile(null)}
                               className="mt-2"
                             >
                               Remove File
                             </Button>
                           </div>
                         ) : (
                           <div className="space-y-2">
                             <Upload className="h-8 w-8 text-gray-400 mx-auto" />
                             <p className="text-sm font-medium text-gray-900">
                               Drag and drop a CSV file here or click to select file locally
                             </p>
                             <p className="text-xs text-gray-500">Maximum file size: 5MB</p>
                             <input
                               type="file"
                               accept=".csv"
                               onChange={handleFileInputChange}
                               className="hidden"
                               id="csv-upload"
                             />
                             <label htmlFor="csv-upload">
                               <Button variant="outline" size="sm" className="mt-2">
                                 Choose File
                               </Button>
                             </label>
                           </div>
                         )}
                       </div>
                     </div>
                   )}

                   {/* Google Sheets URL */}
                   {dataSource === "sheets" && (
                     <div className="space-y-2">
                       <Label className="text-sm font-medium text-gray-700">Google Sheets URL</Label>
                       <Input
                         type="url"
                         placeholder="https://docs.google.com/spreadsheets/d/..."
                         value={googleSheetsUrl}
                         onChange={(e) => handleGoogleSheetsUrlChange(e.target.value)}
                         className="w-full"
                       />
                       <p className="text-xs text-gray-500">
                         Make sure the Google Sheets is publicly accessible or shared with the appropriate permissions.
                       </p>
                     </div>
                   )}

                   {/* CSV Requirements Info */}
                   <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                     <p className="text-sm text-blue-800">
                       <strong>Requirements:</strong> CSV requires a <code className="bg-blue-100 px-1 rounded">number</code> column (the numbers to call), 
                       an optional <code className="bg-blue-100 px-1 rounded">name</code> column and any other column from assistantOverrides.
                     </p>
                   </div>
                 </div>
               )}

                             {/* Outbound Phone Number - Only show for single call */}
               {config.callOption === "single" && (
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Outbound Phone Number</Label>
                <div className="flex gap-2">
                  <Select defaultValue="us">
                    <SelectTrigger className="w-32">
                      <div className="flex items-center gap-2">
                        <Flag className="h-4 w-4" />
                        <span>US</span>
                        <ChevronDown className="h-4 w-4" />
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="us">US</SelectItem>
                      <SelectItem value="ca">CA</SelectItem>
                      <SelectItem value="uk">UK</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input 
                    placeholder="Enter a phone number"
                    value={config.outboundNumber || ""}
                    onChange={(e) => handleConfigChange('outboundNumber', e.target.value)}
                    className="flex-1"
                  />
                </div>
              </div>
               )}

              {/* Outbound Assistant */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Assistant</Label>
                <Select 
                  value={config.outboundAssistant || ""} 
                  onValueChange={(value) => handleConfigChange('outboundAssistant', value)}
                  disabled={loadingAssistants}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={loadingAssistants ? "Loading assistants..." : "Select Assistant..."} />
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
                      <SelectItem key={assistant.id} value={assistant.id}>
                        {assistant.name}
                      </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <Button 
                  className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2"
                  disabled={!config.outboundAssistant || !(config.callOption === 'single' ? config.outboundNumber : (uploadedFile || googleSheetsUrl))}
                >
                  <Phone className="h-4 w-4" />
                  Make a Call
                </Button>
                <Button 
                  variant="outline" 
                  className="flex items-center gap-2"
                  disabled={!config.outboundAssistant || !(config.callOption === 'single' ? config.outboundNumber : (uploadedFile || googleSheetsUrl))}
                  onClick={() => setIsScheduleOpen(true)}
                >
                  <Clock className="h-4 w-4" />
                  Schedule Call
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end pt-6 border-t border-gray-200">
            <Button 
              className="bg-blue-600 hover:bg-blue-700 text-white"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>

    {/* Schedule Modal */}
    <Dialog open={isScheduleOpen} onOpenChange={setIsScheduleOpen}>
      <DialogContent className="sm:max-w-[720px]">
        <DialogHeader>
          <DialogTitle>Schedule Call</DialogTitle>
          <DialogDescription>Select date and time for the outbound call.</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Calendar */}
          <div className="border rounded-md p-2">
            <Calendar
              mode="single"
              selected={scheduleDate}
              onSelect={setScheduleDate}
              fromDate={new Date()}
            />
          </div>
          {/* Time Picker */}
          <div className="border rounded-md p-4">
            <div className="text-sm font-semibold mb-3">Select Time</div>
            <div className="grid grid-cols-3 gap-3 items-start">
              {/* Hour */}
              <div className="space-y-2">
                <div className="text-xs text-muted-foreground">Hour</div>
                <div className="max-h-56 overflow-y-auto pr-1">
                  {Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, '0')).map(h => (
                    <button
                      key={h}
                      className={`w-full text-left px-3 py-2 rounded ${scheduleHour === h ? 'bg-emerald-600 text-white' : 'hover:bg-muted'}`}
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
                      className={`w-full text-left px-3 py-2 rounded ${scheduleMinute === m ? 'bg-emerald-600 text-white' : 'hover:bg-muted'}`}
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
                      className={`px-3 py-2 rounded ${scheduleAmPm === ap ? 'bg-emerald-600 text-white' : 'hover:bg-muted'}`}
                      onClick={() => setScheduleAmPm(ap)}
                    >
                      {ap}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsScheduleOpen(false)}>Cancel</Button>
              <Button
                onClick={() => {
                  setIsScheduleOpen(false);
                  toast({ title: 'Scheduled', description: 'Your call has been scheduled.' });
                }}
                disabled={!scheduleDate}
              >
                Confirm Schedule
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
    </>
  );
};

export default PhoneNumberConfigModal;


