import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Phone, 
  Plus, 
  Search, 
  Trash2,
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
  RefreshCw
} from "lucide-react";
import { useAuth } from "@/context";
import { toast } from "@/hooks/use-toast";
import { authService } from "@/context/services/authService";
import PurchaseNumberModal from "./PurchaseNumberModal";
import PhoneNumberConfigModal from "./PhoneNumberConfigModal";

interface PhoneNumber {
  id: number;
  user_id: string;
  phone_id: string;
  created_at: string;
  // Enhanced phone details
  number?: string;
  display_number?: string;
  status?: string;
  assistant_id?: string | null;
  created_at_vapi?: string | null;
  updated_at_vapi?: string | null;
}

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

const PhoneNumbersSection = () => {
  const { userAgent, hasCompletedSetup } = useAuth();
  const [phones, setPhones] = useState<PhoneNumber[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [selectedPhoneForConfig, setSelectedPhoneForConfig] = useState<PhoneNumberConfig | null>(null);
  const [assistants, setAssistants] = useState<any[]>([]);

  // Fetch phones from API
  useEffect(() => {
    const fetchPhones = async () => {
      try {
        setLoading(true);
        const phoneData = await authService.getPhones();
        setPhones(phoneData);
      } catch (error) {
        console.error('Failed to fetch phones:', error);
        toast({
          title: "Error",
          description: "Failed to load phone numbers. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchPhones();
  }, []);

  // Fetch assistants for name mapping
  useEffect(() => {
    const loadAssistants = async () => {
      try {
        const list = await authService.getAssistants();
        setAssistants(list || []);
      } catch (_) {}
    };
    loadAssistants();
  }, []);

  const getAssistantName = (assistantId?: string | null): string => {
    if (!assistantId) return 'Unassigned';
    const a = assistants.find(a => (a.assistant_id || a.id) === assistantId);
    return a?.name || assistantId;
  };

  const handleDeletePhone = async (phone_id: string) => {
    if (!confirm('Are you sure you want to delete this phone number? This action cannot be undone.')) {
      return;
    }

    try {
      setDeleting(phone_id);
      await authService.deletePhone(phone_id);
      setPhones(prev => prev.filter(phone => phone.phone_id !== phone_id));
      toast({
        title: "Phone Deleted",
        description: "Phone number has been removed successfully.",
      });
    } catch (error) {
      console.error('Failed to delete phone:', error);
      toast({
        title: "Delete Failed",
        description: "Failed to delete phone number. Please try again.",
        variant: "destructive",
      });
    } finally {
      setDeleting(null);
    }
  };

  const handlePurchaseNumber = async (purchasedNumber: any) => {
    try {
      // The purchase is already handled by the modal, just refresh the list
      const phoneData = await authService.getPhones();
      setPhones(phoneData);
      
      toast({
        title: "Success!",
        description: `${purchasedNumber.number} has been purchased and added to your account.`,
      });
    } catch (error) {
      console.error('Failed to refresh phones after purchase:', error);
      toast({
        title: "Warning",
        description: "Phone number was purchased but failed to refresh the list. Please refresh manually.",
        variant: "destructive",
      });
    }
  };

  const handleRefreshPhones = async () => {
    try {
      setRefreshing(true);
      const phoneData = await authService.getPhones();
      setPhones(phoneData);
      toast({
        title: "Refreshed",
        description: "Phone numbers have been refreshed with latest data.",
      });
    } catch (error) {
      console.error('Failed to refresh phones:', error);
      toast({
        title: "Refresh Failed",
        description: "Failed to refresh phone numbers. Please try again.",
        variant: "destructive",
      });
    } finally {
      setRefreshing(false);
    }
  };

  const handleConfigurePhone = (phone: PhoneNumber) => {
    // Convert database phone to config format
    const phoneConfig: PhoneNumberConfig = {
      id: phone.id.toString(),
      // Use phone_id (VAPI id) for API calls; keep number for display
      number: phone.phone_id,
      displayNumber: phone.display_number || phone.phone_id,
      isActive: phone.status === 'active',
      assistant: phone.assistant_id || "",
      squad: "",
      workflow: "",
      fallbackNumber: phone as any && (phone as any).fallback_number ? (phone as any).fallback_number : "",
      outboundNumber: "",
      outboundAssistant: "",
      outboundSquad: "",
      outboundWorkflow: "",
      callOption: "single"
    };
    
    setSelectedPhoneForConfig(phoneConfig);
    setShowConfigModal(true);
  };

  const handleSaveConfig = async (config: PhoneNumberConfig) => {
    try {
      // Optimistically update local list so reopening Configure shows latest values
      setPhones(prev => prev.map(p =>
        p.phone_id === config.number
          ? { ...p, assistant_id: config.assistant || null, ...(config.fallbackNumber !== undefined ? { fallback_number: config.fallbackNumber } : {}) }
          : p
      ));

      // Soft refresh from backend to sync with VAPI (non-blocking)
      try {
        const fresh = await authService.getPhones();
        setPhones(fresh);
      } catch (_) {}

      toast({
        title: "Configuration Saved",
        description: "Phone number settings have been updated successfully.",
      });
    } catch (error) {
      console.error('Failed to save config:', error);
      toast({
        title: "Save Failed",
        description: "Failed to save configuration. Please try again.",
        variant: "destructive",
      });
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status: string | undefined) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return (
          <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 flex items-center gap-1">
            <CheckCircle className="h-3 w-3" />
            Active
          </Badge>
        );
      case 'inactive':
        return (
          <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 flex items-center gap-1">
            <XCircle className="h-3 w-3" />
            Inactive
          </Badge>
        );
      case 'pending':
        return (
          <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            Pending
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary" className="flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            Unknown
          </Badge>
        );
    }
  };

  const filteredPhones = phones.filter(phone =>
    phone.phone_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (phone.display_number && phone.display_number.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (phone.number && phone.number.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (phone.assistant_id && phone.assistant_id.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading phone numbers...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Phone Numbers</h1>
            <p className="text-muted-foreground mt-1">
              Manage your purchased phone numbers for AI calling campaigns
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline"
              onClick={handleRefreshPhones}
              disabled={refreshing}
            >
              {refreshing ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Refresh
            </Button>
            <Button 
              className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2"
              onClick={() => setShowPurchaseModal(true)}
            >
              <Plus className="h-4 w-4" />
              Purchase Number
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search phone numbers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Phone Numbers List */}
        <div className="grid gap-4">
          {filteredPhones.length === 0 ? (
            <Card className="border-dashed border-2 border-border">
              <CardContent className="text-center py-12">
                <Phone className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium text-foreground mb-2">No Phone Numbers</h3>
                <p className="text-muted-foreground mb-4">
                  You haven't purchased any phone numbers yet.
                </p>
                <Button 
                  className="bg-green-600 hover:bg-green-700 text-white"
                  onClick={() => setShowPurchaseModal(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Purchase Your First Number
                </Button>
              </CardContent>
            </Card>
          ) : (
            filteredPhones.map((phone) => (
              <Card key={phone.id}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                          <Phone className="h-6 w-6 text-green-600 dark:text-green-400" />
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h3 className="text-lg font-semibold text-foreground">
                            {phone.display_number || phone.phone_id}
                          </h3>
                          {getStatusBadge(phone.status)}
                        </div>
                        <div className="flex items-center text-sm text-muted-foreground mt-1">
                          <Calendar className="h-4 w-4 mr-1" />
                          Purchased on {formatDate(phone.created_at)}
                          {phone.assistant_id && (
                            <>
                              <span className="mx-2">•</span>
                              <span>Assistant: {getAssistantName(phone.assistant_id)}</span>
                            </>
                          )}
                        </div>
                        {phone.updated_at_vapi && (
                          <div className="flex items-center text-sm text-muted-foreground mt-1">
                            <Clock className="h-4 w-4 mr-1" />
                            Last Updated: {formatDate(phone.updated_at_vapi)}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleConfigurePhone(phone)}
                      >
                        Configure
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-red-300 text-red-700 hover:bg-red-50 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-950"
                        onClick={() => handleDeletePhone(phone.phone_id)}
                        disabled={deleting === phone.phone_id}
                      >
                        {deleting === phone.phone_id ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Stats */}
        {phones.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Phone Numbers Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-foreground">{phones.length}</div>
                  <div className="text-sm text-muted-foreground">Total Numbers</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {phones.filter(phone => phone.status === 'active').length}
                  </div>
                  <div className="text-sm text-muted-foreground">Active</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                    {phones.filter(phone => phone.status === 'inactive').length}
                  </div>
                  <div className="text-sm text-muted-foreground">Inactive</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                    {phones.filter(phone => phone.status === 'pending').length}
                  </div>
                  <div className="text-sm text-muted-foreground">Pending</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Purchase Number Modal */}
      <PurchaseNumberModal
        isOpen={showPurchaseModal}
        onClose={() => setShowPurchaseModal(false)}
        onPurchase={handlePurchaseNumber}
      />

      {/* Phone Number Configuration Modal */}
      <PhoneNumberConfigModal
        isOpen={showConfigModal}
        onClose={() => {
          setShowConfigModal(false);
          setSelectedPhoneForConfig(null);
        }}
        phoneNumber={selectedPhoneForConfig}
        onSave={handleSaveConfig}
      />
    </>
  );
};

export default PhoneNumbersSection;
