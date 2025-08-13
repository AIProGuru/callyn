import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Phone, Check, ChevronDown, Flag, Plus, AlertTriangle, Calendar } from "lucide-react";

interface PhoneNumber {
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

const PhoneNumbers = () => {
  const [selectedPhoneNumber, setSelectedPhoneNumber] = useState<string>("1");
  const [phoneNumbers, setPhoneNumbers] = useState<PhoneNumber[]>([
    {
      id: "1",
      number: "+15406991046",
      displayNumber: "+1 (540) 699 1046",
      isActive: true,
      assistant: "",
      squad: "",
      workflow: "",
      fallbackNumber: "",
      outboundNumber: "",
      outboundAssistant: "",
      outboundSquad: "",
      outboundWorkflow: "",
      callOption: "single"
    },
    {
      id: "2", 
      number: "+15409978409",
      displayNumber: "+1 (540) 997 8409",
      isActive: false,
      assistant: "",
      squad: "",
      workflow: "",
      fallbackNumber: "",
      outboundNumber: "",
      outboundAssistant: "",
      outboundSquad: "",
      outboundWorkflow: "",
      callOption: "single"
    }
  ]);

  const [assistants] = useState([
    { id: "1", name: "Sales Assistant" },
    { id: "2", name: "Support Assistant" },
    { id: "3", name: "Appointment Assistant" }
  ]);

  const [workflows] = useState([
    { id: "1", name: "Lead Qualification" },
    { id: "2", name: "Appointment Booking" },
    { id: "3", name: "Customer Support" }
  ]);

  const selectedPhone = phoneNumbers.find(p => p.id === selectedPhoneNumber);

  const handlePhoneNumberChange = (field: keyof PhoneNumber, value: string) => {
    setPhoneNumbers(prev => 
      prev.map(p => 
        p.id === selectedPhoneNumber 
          ? { ...p, [field]: value }
          : p
      )
    );
  };

  return (
    <div className="flex h-full space-x-6">
      {/* Left Sidebar */}
      <div className="w-80 bg-gray-50 rounded-lg p-4 border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Phone className="h-5 w-5 text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-900">Phone Numbers</h2>
          </div>
          <Button size="sm" variant="outline" className="h-8 w-8 p-0">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="space-y-2">
          {phoneNumbers.map((phone) => (
            <div
              key={phone.id}
              onClick={() => setSelectedPhoneNumber(phone.id)}
              className={`p-3 rounded-lg cursor-pointer transition-colors ${
                selectedPhoneNumber === phone.id
                  ? "bg-blue-50 border border-blue-200 shadow-sm"
                  : "bg-white border border-gray-200 hover:bg-gray-50 hover:border-gray-300"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-900">
                  {phone.displayNumber}
                </span>
                {phone.isActive && (
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 bg-white rounded-lg p-6 border border-gray-200">
        {selectedPhone && (
          <div className="space-y-6">
            {/* Phone Number Title */}
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{selectedPhone.displayNumber}</h1>
            </div>

            {/* Inbound Settings */}
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-2">Inbound Settings</h2>
                <p className="text-sm text-gray-600 mb-4">
                  You can assign an assistant to the phone number so that whenever someone calls this phone number, the assistant will automatically be assigned to the call.
                </p>
              </div>

              {/* Inbound Phone Number */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Inbound Phone Number</Label>
                <div className="flex items-center gap-2">
                  <Input 
                    value={selectedPhone.number} 
                    readOnly 
                    className="bg-gray-50"
                  />
                  <Check className="h-5 w-5 text-green-500" />
                </div>
              </div>

              {/* Assistant */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Assistant</Label>
                <Select 
                  value={selectedPhone.assistant} 
                  onValueChange={(value) => handlePhoneNumberChange('assistant', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Assistant..." />
                  </SelectTrigger>
                  <SelectContent>
                    {assistants.map((assistant) => (
                      <SelectItem key={assistant.id} value={assistant.id}>
                        {assistant.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Squad */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Squad</Label>
                <Alert className="border-yellow-200 bg-yellow-50">
                  <AlertDescription className="text-yellow-800">
                    No squads available.{" "}
                    <Button variant="link" className="p-0 h-auto text-yellow-800 underline hover:text-yellow-900">
                      Create a squad
                    </Button>{" "}
                    to enable this feature.
                  </AlertDescription>
                </Alert>
              </div>

              {/* Workflow */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Workflow</Label>
                <Select 
                  value={selectedPhone.workflow} 
                  onValueChange={(value) => handlePhoneNumberChange('workflow', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Workflow..." />
                  </SelectTrigger>
                  <SelectContent>
                    {workflows.map((workflow) => (
                      <SelectItem key={workflow.id} value={workflow.id}>
                        {workflow.name}
                      </SelectItem>
                    ))}
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
                    value={selectedPhone.fallbackNumber}
                    onChange={(e) => handlePhoneNumberChange('fallbackNumber', e.target.value)}
                    className="flex-1"
                  />
                </div>
              </div>
            </div>

            {/* Outbound Settings */}
            <div className="space-y-6 pt-6 border-t border-gray-200">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-2">Outbound Settings</h2>
                <p className="text-sm text-gray-600">
                  You can assign an outbound phone number, set up a fallback and set up a squad to be called if the assistant is not available.
                </p>
              </div>

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
                      checked={selectedPhone.callOption === "single"}
                      onChange={(e) => handlePhoneNumberChange('callOption', e.target.value)}
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
                      checked={selectedPhone.callOption === "multiple"}
                      onChange={(e) => handlePhoneNumberChange('callOption', e.target.value)}
                      className="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 focus:ring-green-500"
                    />
                    <Label htmlFor="multiple-call" className="text-sm font-medium text-gray-700">
                      Call Many Numbers (Upload CSV)
                    </Label>
                  </div>
                </div>
              </div>

              {/* Outbound Phone Number */}
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
                    value={selectedPhone.outboundNumber}
                    onChange={(e) => handlePhoneNumberChange('outboundNumber', e.target.value)}
                    className="flex-1"
                  />
                </div>
              </div>

              {/* Outbound Assistant */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Assistant</Label>
                <Select 
                  value={selectedPhone.outboundAssistant} 
                  onValueChange={(value) => handlePhoneNumberChange('outboundAssistant', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Assistant..." />
                  </SelectTrigger>
                  <SelectContent>
                    {assistants.map((assistant) => (
                      <SelectItem key={assistant.id} value={assistant.id}>
                        {assistant.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Outbound Squad */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Squad</Label>
                <p className="text-sm text-gray-600">
                  If the assistant is not available, the call can be routed to the specified squad.
                </p>
                <Alert className="border-yellow-200 bg-yellow-50">
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  <AlertDescription className="text-yellow-800">
                    No squads available.{" "}
                    <Button variant="link" className="p-0 h-auto text-blue-600 underline hover:text-blue-700">
                      Create a squad
                    </Button>{" "}
                    to enable this feature.
                  </AlertDescription>
                </Alert>
              </div>

              {/* Outbound Workflow */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Workflow</Label>
                <p className="text-sm text-gray-600">
                  Route to the specified workflow.
                </p>
                <Select 
                  value={selectedPhone.outboundWorkflow} 
                  onValueChange={(value) => handlePhoneNumberChange('outboundWorkflow', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Workflow..." />
                  </SelectTrigger>
                  <SelectContent>
                    {workflows.map((workflow) => (
                      <SelectItem key={workflow.id} value={workflow.id}>
                        {workflow.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <Button className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Make a Call
                </Button>
                <Button variant="outline" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Schedule Call
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end pt-6 border-t border-gray-200">
              <Button className="bg-blue-600 hover:bg-blue-700">
                Save Changes
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PhoneNumbers;
