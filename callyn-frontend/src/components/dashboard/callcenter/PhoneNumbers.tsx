import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Phone, Check, ChevronDown, Flag, Plus } from "lucide-react";

interface PhoneNumber {
  id: string;
  number: string;
  displayNumber: string;
  isActive: boolean;
  assistant?: string;
  squad?: string;
  workflow?: string;
  fallbackNumber?: string;
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
      fallbackNumber: ""
    },
    {
      id: "2", 
      number: "+15409978409",
      displayNumber: "+1 (540) 997 8409",
      isActive: false,
      assistant: "",
      squad: "",
      workflow: "",
      fallbackNumber: ""
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
                  Configure settings for outbound calls from this phone number.
                </p>
              </div>
              
              {/* Placeholder for outbound settings */}
              <div className="text-center py-8 text-gray-500">
                <Phone className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>Outbound settings configuration coming soon</p>
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
