import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Phone, 
  Search, 
  MapPin, 
  DollarSign,
  CheckCircle,
  X,
  Loader2,
  Globe,
  Filter,
  RefreshCw,
  Download,
  Plus
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { authService } from "@/context/services/authService";

interface PhoneNumber {
  phone_number: string;
  friendly_name?: string;
  locality: string;
  region: string;
  country: string;
  capabilities: {
    voice: boolean;
    SMS: boolean;
    MMS: boolean;
  };
  monthly_rate?: string;
  setup_fee?: string;
}

interface ExistingPhoneNumber {
  phone_number: string;
  friendly_name?: string;
  locality?: string;
  region?: string;
  country?: string;
  capabilities?: {
    voice: boolean;
    SMS: boolean;
    MMS: boolean;
  };
  date_created?: string;
  status?: string;
}

interface PurchaseNumberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPurchase: (phoneNumber: any) => void;
}

const PurchaseNumberModal = ({ isOpen, onClose, onPurchase }: PurchaseNumberModalProps) => {
  const [activeTab, setActiveTab] = useState("purchase");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCountry, setSelectedCountry] = useState("US");
  const [loading, setLoading] = useState(false);
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [importing, setImporting] = useState<string | null>(null);
  const [availableNumbers, setAvailableNumbers] = useState<PhoneNumber[]>([]);
  const [existingNumbers, setExistingNumbers] = useState<ExistingPhoneNumber[]>([]);

  // Load data when modal opens
  useEffect(() => {
    if (isOpen) {
      if (activeTab === "purchase") {
        loadAvailableNumbers();
      } else {
        loadExistingNumbers();
      }
    }
  }, [isOpen, activeTab, selectedCountry]);

  const loadAvailableNumbers = async () => {
    try {
      setLoading(true);
      const numbers = await authService.getAvailablePhones(selectedCountry);
      setAvailableNumbers(numbers);
    } catch (error) {
      console.error('Failed to load available numbers:', error);
      toast({
        title: "Error",
        description: "Failed to load available phone numbers. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadExistingNumbers = async () => {
    try {
      setLoading(true);
      const numbers = await authService.getExistingPhones();
      setExistingNumbers(numbers);
    } catch (error) {
      console.error('Failed to load existing numbers:', error);
      toast({
        title: "Error",
        description: "Failed to load existing phone numbers. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setLoading(true);
    // Filter the already loaded numbers
    setTimeout(() => {
      if (activeTab === "purchase") {
        const filtered = availableNumbers.filter(num => 
          num.phone_number.includes(searchQuery) ||
          num.locality.toLowerCase().includes(searchQuery.toLowerCase()) ||
          num.region.toLowerCase().includes(searchQuery.toLowerCase())
        );
        setAvailableNumbers(filtered);
      } else {
        const filtered = existingNumbers.filter(num => 
          num.phone_number.includes(searchQuery) ||
          (num.friendly_name && num.friendly_name.toLowerCase().includes(searchQuery.toLowerCase()))
        );
        setExistingNumbers(filtered);
      }
      setLoading(false);
    }, 500);
  };

  const handlePurchase = async (phoneNumber: PhoneNumber) => {
    try {
      setPurchasing(phoneNumber.phone_number);
      
      // Purchase the number through our API
      const result = await authService.purchasePhone(phoneNumber.phone_number);
      
      onPurchase({ number: phoneNumber.phone_number, ...result });
      toast({
        title: "Number Purchased!",
        description: `${phoneNumber.phone_number} has been successfully purchased and configured.`,
      });
      onClose();
    } catch (error) {
      console.error('Purchase failed:', error);
      let errorMessage = "Failed to purchase phone number. Please try again.";
      
      // Provide more specific error messages
      if (error.response?.data?.error) {
        if (error.response.data.error.includes('Twilio')) {
          errorMessage = "Failed to provision phone number. Please try again.";
        } else if (error.response.data.error.includes('VAPI')) {
          errorMessage = "Phone number was provisioned but failed to complete setup. Please try again.";
        }
      }
      
      toast({
        title: "Purchase Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setPurchasing(null);
    }
  };

  const handleImport = async (phoneNumber: ExistingPhoneNumber) => {
    try {
      setImporting(phoneNumber.phone_number);
      
      // Import the existing number through our API
      const result = await authService.importExistingPhone(phoneNumber.phone_number);
      
      onPurchase({ number: phoneNumber.phone_number, ...result });
      toast({
        title: "Number Imported!",
        description: `${phoneNumber.phone_number} has been successfully imported and configured.`,
      });
      onClose();
    } catch (error) {
      console.error('Import failed:', error);
      let errorMessage = "Failed to import phone number. Please try again.";
      
      if (error.response?.data?.error) {
        if (error.response.data.error.includes('VAPI')) {
          errorMessage = "Failed to import phone number. Please try again.";
        }
      }
      
      toast({
        title: "Import Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setImporting(null);
    }
  };

  const getCapabilityBadges = (capabilities: PhoneNumber['capabilities'] | ExistingPhoneNumber['capabilities']) => {
    if (!capabilities) return [];
    const badges = [];
    if (capabilities.voice) badges.push(<Badge key="voice" variant="secondary" className="bg-blue-100 text-blue-800">Voice</Badge>);
    if (capabilities.SMS) badges.push(<Badge key="sms" variant="secondary" className="bg-green-100 text-green-800">SMS</Badge>);
    if (capabilities.MMS) badges.push(<Badge key="mms" variant="secondary" className="bg-purple-100 text-purple-800">MMS</Badge>);
    return badges;
  };

  const countries = [
    { code: "US", name: "United States", flag: "🇺🇸" },
    { code: "CA", name: "Canada", flag: "🇨🇦" },
    { code: "GB", name: "United Kingdom", flag: "🇬🇧" },
    { code: "AU", name: "Australia", flag: "🇦🇺" }
  ];

  const filteredAvailableNumbers = availableNumbers.filter(num => 
    num.phone_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
    num.locality.toLowerCase().includes(searchQuery.toLowerCase()) ||
    num.region.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredExistingNumbers = existingNumbers.filter(num => 
    num.phone_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (num.friendly_name && num.friendly_name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Phone Numbers</DialogTitle>
          <DialogDescription>
            Purchase new phone numbers or import existing Twilio numbers
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="purchase" className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Purchase New
            </TabsTrigger>
            <TabsTrigger value="import" className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Import Existing
            </TabsTrigger>
          </TabsList>

          <TabsContent value="purchase" className="space-y-6">
            {/* Purchase New Numbers */}
            <div className="space-y-6">
              {/* Filters */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="country">Country</Label>
                  <Select value={selectedCountry} onValueChange={setSelectedCountry}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select country" />
                    </SelectTrigger>
                    <SelectContent>
                      {countries.map((country) => (
                        <SelectItem key={country.code} value={country.code}>
                          <span className="flex items-center gap-2">
                            <span>{country.flag}</span>
                            <span>{country.name}</span>
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="search">Search Numbers</Label>
                  <div className="flex gap-2">
                    <Input
                      id="search"
                      placeholder="Search by number, city, or state..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="flex-1"
                    />
                    <Button onClick={handleSearch} disabled={loading}>
                      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Available Numbers */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Available Numbers</h3>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={loadAvailableNumbers}
                    disabled={loading}
                  >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                    Refresh
                  </Button>
                </div>

                {loading && availableNumbers.length === 0 ? (
                  <div className="text-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                    <p>Loading available numbers...</p>
                  </div>
                ) : filteredAvailableNumbers.length === 0 ? (
                  <div className="text-center py-8">
                    <Phone className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Numbers Found</h3>
                    <p className="text-gray-600">
                      Try adjusting your search criteria or selecting a different country.
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {filteredAvailableNumbers.map((phoneNumber) => (
                      <Card key={phoneNumber.phone_number} className="border border-gray-200">
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                              <div className="flex-shrink-0">
                                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                                  <Phone className="h-6 w-6 text-blue-600" />
                                </div>
                              </div>
                              <div>
                                <div className="flex items-center space-x-2">
                                  <h3 className="text-lg font-semibold text-gray-900">
                                    {phoneNumber.phone_number}
                                  </h3>
                                  <div className="flex gap-1">
                                    {getCapabilityBadges(phoneNumber.capabilities)}
                                  </div>
                                </div>
                                <div className="flex items-center text-sm text-gray-500 mt-1">
                                  <MapPin className="h-4 w-4 mr-1" />
                                  {phoneNumber.locality}, {phoneNumber.region}
                                </div>
                                <div className="flex items-center text-sm text-gray-500 mt-1">
                                  <DollarSign className="h-4 w-4 mr-1" />
                                  $1.00/month
                                </div>
                              </div>
                            </div>
                            <Button
                              onClick={() => handlePurchase(phoneNumber)}
                              disabled={purchasing === phoneNumber.phone_number}
                              className="bg-green-600 hover:bg-green-700 text-white"
                            >
                              {purchasing === phoneNumber.phone_number ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                "Purchase"
                              )}
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="import" className="space-y-6">
            {/* Import Existing Numbers */}
            <div className="space-y-6">
              {/* Search */}
              <div>
                <Label htmlFor="search-existing">Search Existing Numbers</Label>
                <div className="flex gap-2 mt-2">
                  <Input
                    id="search-existing"
                    placeholder="Search by number or friendly name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1"
                  />
                  <Button onClick={handleSearch} disabled={loading}>
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              {/* Existing Numbers */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Your Twilio Numbers</h3>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={loadExistingNumbers}
                    disabled={loading}
                  >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                    Refresh
                  </Button>
                </div>

                {loading && existingNumbers.length === 0 ? (
                  <div className="text-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                    <p>Loading existing numbers...</p>
                  </div>
                ) : filteredExistingNumbers.length === 0 ? (
                  <div className="text-center py-8">
                    <Phone className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Existing Numbers Found</h3>
                    <p className="text-gray-600">
                      You don't have any existing Twilio numbers to import.
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {filteredExistingNumbers.map((phoneNumber) => (
                      <Card key={phoneNumber.phone_number} className="border border-gray-200">
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                              <div className="flex-shrink-0">
                                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                                  <Phone className="h-6 w-6 text-orange-600" />
                                </div>
                              </div>
                              <div>
                                <div className="flex items-center space-x-2">
                                  <h3 className="text-lg font-semibold text-gray-900">
                                    {phoneNumber.phone_number}
                                  </h3>
                                  {phoneNumber.capabilities && (
                                    <div className="flex gap-1">
                                      {getCapabilityBadges(phoneNumber.capabilities)}
                                    </div>
                                  )}
                                </div>
                                {phoneNumber.friendly_name && (
                                  <div className="text-sm text-gray-500 mt-1">
                                    {phoneNumber.friendly_name}
                                  </div>
                                )}
                                {phoneNumber.locality && phoneNumber.region && (
                                  <div className="flex items-center text-sm text-gray-500 mt-1">
                                    <MapPin className="h-4 w-4 mr-1" />
                                    {phoneNumber.locality}, {phoneNumber.region}
                                  </div>
                                )}
                                {phoneNumber.status && (
                                  <div className="flex items-center text-sm text-gray-500 mt-1">
                                    <Badge variant="outline" className="text-xs">
                                      {phoneNumber.status}
                                    </Badge>
                                  </div>
                                )}
                              </div>
                            </div>
                            <Button
                              onClick={() => handleImport(phoneNumber)}
                              disabled={importing === phoneNumber.phone_number}
                              className="bg-orange-600 hover:bg-orange-700 text-white"
                            >
                              {importing === phoneNumber.phone_number ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                "Import"
                              )}
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Pricing Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span>Purchase new numbers for $1.00/month</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span>Import existing Twilio numbers for free</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span>Full integration included</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
};

export default PurchaseNumberModal;
