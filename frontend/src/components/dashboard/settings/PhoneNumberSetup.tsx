import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Phone,
  Search,
  MapPin,
  CheckCircle,
  Clock,
  AlertTriangle,
  Copy,
  ExternalLink,
} from "lucide-react";
const SERVER_URL = import.meta.env.VITE_SERVER_URL;

const PhoneNumberSetup = () => {
  const user = JSON.parse(localStorage.getItem("user"));
  if (!user) {
    throw new Error("User not found in localStorage");
  }
  const [selectedCountry, setSelectedCountry] = useState("US");
  const [selectedAreaCode, setSelectedAreaCode] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedNumber, setSelectedNumber] = useState("");
  const [isProvisioning, setIsProvisioning] = useState(false);

  // Mock available numbers
  const [availableNumbers, setAvailableNumbers] = useState([]);
  const [activeNumbers, setActiveNumbers] = useState([]);

  // [
  //   { number: "+1 (555) 123-4567", location: "New York, NY", price: "$1.00/month" },
  //   { number: "+1 (555) 234-5678", location: "New York, NY", price: "$1.00/month" },
  //   { number: "+1 (555) 345-6789", location: "New York, NY", price: "$1.00/month" },
  //   { number: "+1 (555) 456-7890", location: "New York, NY", price: "$1.00/month" },
  // ];

  const countries = [
    { code: "US", name: "United States", flag: "🇺🇸" },
    { code: "CA", name: "Canada", flag: "🇨🇦" },
    { code: "GB", name: "United Kingdom", flag: "🇬🇧" },
    { code: "AU", name: "Australia", flag: "🇦🇺" },
  ];

  const areaCodes = [
    { code: "212", location: "New York, NY" },
    { code: "213", location: "Los Angeles, CA" },
    { code: "312", location: "Chicago, IL" },
    { code: "415", location: "San Francisco, CA" },
    { code: "617", location: "Boston, MA" },
  ];

  const handleProvisionNumber = async () => {
    if (!selectedNumber) {
      alert("Please select a number to provision.");
      return;
    }

    setIsProvisioning(true);

    try {
      const response = await fetch(`${SERVER_URL || ""}/api/provision-number`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phoneNumber: selectedNumber,
          userId: user.email, // Ensure `user` is available from context or props
          country: selectedCountry || "US",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Provisioning failed");
      }

      console.log("Provisioned number:", data.phone_number);
      alert(`Number provisioned: ${data.phone_number}`);

      // ✅ Update UI with refreshed available numbers
      if (data.availableNumbers) {
        setAvailableNumbers(data.availableNumbers);
      }
      if (data.purchasedNumbers) {
        setActiveNumbers(data.purchasedNumbers); // full objects
      }

      // ✅ Clear selected number if needed
      setSelectedNumber(null);
    } catch (error) {
      console.error("Provision error:", error);
      alert("Failed to provision number. See console for details.");
    } finally {
      setIsProvisioning(false);
    }
  };

  const getAvailableNumbers = async (country) => {
    try {
      const response = await fetch(
        `${SERVER_URL || ""}/api/get-available-numbers`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ country }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Failed to fetch numbers:", errorText);
        return [];
      }

      const data = await response.json();
      return data.availableNumbers || [];
    } catch (error) {
      console.error("Twilio fetch error:", error);
      return [];
    }
  };

  const getPurchasedNumbers = async (userId) => {
    try {
      console.log(userId);
      const response = await fetch(
        `${SERVER_URL || ""}/api/purchased-numbers`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ user_id: userId }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Failed to fetch numbers:", errorText);
        return [];
      }

      const data = await response.json();
      return data.purchasedNumbers || [];
    } catch (error) {
      console.error("Twilio fetch error:", error);
      return [];
    }
  };

  useEffect(() => {
    (async () => {
      const numbers = await getAvailableNumbers(selectedCountry);
      console.log("numbers", numbers);
      setAvailableNumbers(numbers);
    })();
  }, [selectedCountry]);

  useEffect(() => {
    (async () => {
      const numbers = await getPurchasedNumbers(user.email);
      console.log("purchasedNumbers", numbers);
      setActiveNumbers(numbers);
    })();
  }, []);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5 text-blue-600" />
            Phone Number Setup
          </CardTitle>
          <CardDescription>
            Get a dedicated phone number for your AI agent to make and receive
            calls
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Search Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Country</Label>
              <Select
                value={selectedCountry}
                onValueChange={setSelectedCountry}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {countries.map((country) => (
                    <SelectItem key={country.code} value={country.code}>
                      <div className="flex items-center gap-2">
                        <span>{country.flag}</span>
                        <span>{country.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Area Code (Optional)</Label>
              <Select
                value={selectedAreaCode}
                onValueChange={setSelectedAreaCode}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Any area code" />
                </SelectTrigger>
                <SelectContent>
                  {areaCodes.map((area) => (
                    <SelectItem key={area.code} value={area.code}>
                      <div className="flex items-center gap-2">
                        <span>{area.code}</span>
                        <span className="text-sm text-gray-500">
                          - {area.location}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Search Numbers</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by pattern..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>

          {/* Available Numbers */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Available Numbers</Label>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {availableNumbers.map((number, index) => (
                <div
                  key={index}
                  className={`p-4 border rounded-lg cursor-pointer transition-all ${
                    selectedNumber === number.phone_number
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                  onClick={() => setSelectedNumber(number.phone_number)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="text-lg font-mono font-medium">
                        {number.phone_number}
                      </div>
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <MapPin className="h-4 w-4" />
                        {number.locality + ", " + number.region}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">$1.00/month</Badge>
                      {selectedNumber === number.phone_number && (
                        <CheckCircle className="h-4 w-4 text-blue-600" />
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Provision Button */}
          {selectedNumber && (
            <div className="space-y-4">
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  You'll be charged $1.00/month for this phone number. You can
                  cancel anytime.
                </AlertDescription>
              </Alert>

              <Button
                onClick={handleProvisionNumber}
                disabled={isProvisioning}
                className="w-full"
                size="lg"
              >
                {isProvisioning ? (
                  <>
                    <Clock className="mr-2 h-4 w-4 animate-spin" />
                    Provisioning Number...
                  </>
                ) : (
                  <>
                    <Phone className="mr-2 h-4 w-4" />
                    Provision {selectedNumber}
                  </>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Current Number (if exists) */}
      <Card className="border-green-200 bg-green-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-800">
            <CheckCircle className="h-5 w-5" />
            Your Phone Number
          </CardTitle>
        </CardHeader>
        <CardContent>
          {activeNumbers.map((activeNumber) => (
            <div key={activeNumber.phone_number} className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-mono font-bold text-green-900">
                  {activeNumber.phone_number}
                </div>
                <div className="text-sm text-green-700">
                  Active since {activeNumber.created_at} • $1.00/month
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Copy className="mr-2 h-4 w-4" />
                  Copy
                </Button>
                <Button variant="outline" size="sm">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Manage
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

export default PhoneNumberSetup;
