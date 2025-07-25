import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Play, 
  Pause, 
  Square, 
  Phone, 
  Activity
} from "lucide-react";

interface AgentStatus {
  isActive: boolean;
  mode: 'auto' | 'manual' | 'paused';
  currentCall: boolean;
  callsToday: number;
  uptime: string;
}

interface AgentStatusControlProps {
  status: AgentStatus;
  onStatusChange: (status: Partial<AgentStatus>) => void;
}

const AgentStatusControl = ({ status, onStatusChange }: AgentStatusControlProps) => {
  const handleStart = () => {
    onStatusChange({ isActive: true, mode: 'auto' });
  };

  const handlePause = () => {
    onStatusChange({ mode: 'paused' });
  };

  const handleStop = () => {
    onStatusChange({ isActive: false, mode: 'paused' });
  };

  const handleManual = () => {
    onStatusChange({ isActive: true, mode: 'manual' });
  };

  const getStatusColor = () => {
    if (!status.isActive) return "bg-gray-500";
    if (status.currentCall) return "bg-green-500";
    if (status.mode === 'paused') return "bg-yellow-500";
    return "bg-blue-500";
  };

  const getStatusText = () => {
    if (!status.isActive) return "Offline";
    if (status.currentCall) return "On Call";
    if (status.mode === 'paused') return "Paused";
    return status.mode === 'manual' ? "Manual Mode" : "Auto Mode";
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Main Status Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${getStatusColor()}`} />
            Agent Status
          </CardTitle>
          <CardDescription>Control your AI calling agent</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">{getStatusText()}</h3>
              <p className="text-sm text-gray-600">
                {status.isActive ? "Agent is online and ready" : "Agent is offline"}
              </p>
            </div>
            <Badge variant={status.isActive ? "default" : "secondary"}>
              {status.isActive ? "ONLINE" : "OFFLINE"}
            </Badge>
          </div>

          <div className="grid grid-cols-4 gap-2">
            <Button
              variant={status.isActive && status.mode === 'auto' ? "default" : "outline"}
              onClick={handleStart}
              className="flex items-center gap-1"
              size="sm"
            >
              <Play className="h-3 w-3" />
              Start
            </Button>
            <Button
              variant={status.mode === 'paused' ? "default" : "outline"}
              onClick={handlePause}
              className="flex items-center gap-1"
              size="sm"
              disabled={!status.isActive}
            >
              <Pause className="h-3 w-3" />
              Pause
            </Button>
            <Button
              variant={!status.isActive ? "destructive" : "outline"}
              onClick={handleStop}
              className="flex items-center gap-1"
              size="sm"
            >
              <Square className="h-3 w-3" />
              Stop
            </Button>
            <Button
              variant={status.isActive && status.mode === 'manual' ? "default" : "outline"}
              onClick={handleManual}
              className="flex items-center gap-1"
              size="sm"
            >
              <Phone className="h-3 w-3" />
              Manual
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Today's Activity
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{status.callsToday}</div>
              <div className="text-sm text-gray-600">Calls Made</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{status.uptime}</div>
              <div className="text-sm text-gray-600">Uptime</div>
            </div>
          </div>

          {status.currentCall && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-2 text-green-800">
                <Phone className="h-4 w-4" />
                <span className="font-medium">Currently on call</span>
              </div>
              <p className="text-sm text-green-700 mt-1">
                Call in progress with lead #1234
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AgentStatusControl;
