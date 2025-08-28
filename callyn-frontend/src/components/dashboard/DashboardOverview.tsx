import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Phone,
  Users,
  CheckCircle,
  Clock,
  TrendingUp,
  Bot,
  Calendar,
  ArrowRight,
  Plus,
  Play,
  Settings
} from "lucide-react";


import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useAuth } from "@/context";
import DashboardUploadLeadDialog from "./DashboardUploadLeadDialog";

interface DashboardOverviewProps {
  onCampaignToggle: (active: boolean) => void;
  campaignActive: boolean;
}

const DashboardOverview = ({ onCampaignToggle, campaignActive }: DashboardOverviewProps) => {
  const { userAgent, hasCompletedSetup } = useAuth();
  const [hasLeads, setHasLeads] = useState(false);

  const [isLeadDialogOpen, setIsLeadDialogOpen] = useState(false);

  const hasAgent = !!userAgent;
  const setupComplete = hasCompletedSetup();

  const handleStartCampaign = () => {
    onCampaignToggle(!campaignActive);
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-foreground">Dashboard Overview</h2>
        <p className="text-muted-foreground">
          Monitor your AI calling campaigns and agent performance
        </p>
      </div>

      {/* Agent Status Banner */}
      {hasAgent && (
        <Alert className="bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800">
          <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
          <AlertTitle className="text-green-800 dark:text-green-200">
            🎉 {userAgent.name} is Active and Ready!
          </AlertTitle>
          <AlertDescription className="text-green-700 dark:text-green-300">
            Your AI agent was created on {new Date(userAgent.createdAt).toLocaleDateString()} and is ready to handle calls.
          </AlertDescription>
        </Alert>
      )}

      {/* Quick Setup Cards - Only show if setup not complete */}
      {!setupComplete && (
        <div className="grid gap-6 md:grid-cols-2">
          {!hasAgent && (
            <Card className="border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-950/50">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Bot className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  <CardTitle className="text-blue-900 dark:text-blue-100">Setup Your AI Agent</CardTitle>
                </div>
                <CardDescription className="text-blue-700 dark:text-blue-300">
                  Create and configure your personal AI calling agent
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="text-sm text-blue-800 dark:text-blue-200">
                    Complete the onboarding process to create your AI agent
                  </div>
                  <Button className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600" asChild>
                    <Link to="/onboarding">
                      <Bot className="mr-2 h-4 w-4" />
                      Complete Setup
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {!hasLeads && (
            <Card className="border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-950/50">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-green-600 dark:text-green-400" />
                  <CardTitle className="text-green-900 dark:text-green-100">Upload Lead List</CardTitle>
                </div>
                <CardDescription className="text-green-700 dark:text-green-300">
                  Import your leads to start calling campaigns
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="text-sm text-green-800 dark:text-green-200">
                    Upload a CSV file with your lead information
                  </div>
                  <Button 
                    className="w-full bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600"
                    onClick={() => setIsLeadDialogOpen(true)}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Upload Leads
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-foreground">Calls Today</CardTitle>
            <Phone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">0</div>
            <p className="text-xs text-muted-foreground">
              {hasAgent ? "Ready to start calling" : "Agent setup required"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-foreground">Success Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">-</div>
            <p className="text-xs text-muted-foreground">
              No data available
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-foreground">Total Leads</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">0</div>
            <p className="text-xs text-muted-foreground">
              Upload leads to get started
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-foreground">Agent Status</CardTitle>
            <Bot className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {hasAgent ? "Active" : "Setup"}
            </div>
            <p className="text-xs text-muted-foreground">
              {hasAgent ? "Ready for calls" : "Configuration needed"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      {hasAgent && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <Play className="h-5 w-5 text-green-600 dark:text-green-400" />
                Start Campaign
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                Begin calling your leads with AI
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                className={`w-full ${campaignActive ? 'bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600' : 'bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600'}`}
                onClick={handleStartCampaign}
              >
                {campaignActive ? (
                  <>
                    <Clock className="mr-2 h-4 w-4" />
                    Stop Campaign
                  </>
                ) : (
                  <>
                    <Play className="mr-2 h-4 w-4" />
                    Start Campaign
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <Settings className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                Agent Settings
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                Configure your AI agent
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full" asChild>
                <Link to="/dashboard?tab=your-agent">
                  <Settings className="mr-2 h-4 w-4" />
                  Configure Agent
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <Calendar className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                View Analytics
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                Check your call performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full" asChild>
                <Link to="/dashboard?tab=call-log">
                  <TrendingUp className="mr-2 h-4 w-4" />
                  View Analytics
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="text-foreground">Recent Activity</CardTitle>
          <CardDescription className="text-muted-foreground">
            Latest calls and system updates
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border border-border rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                  <Bot className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Agent Created</p>
                  <p className="text-xs text-muted-foreground">
                    {hasAgent ? `Your AI agent "${userAgent.name}" was created` : "No agent created yet"}
                  </p>
                </div>
              </div>
              <div className="text-xs text-muted-foreground">
                {hasAgent ? new Date(userAgent.createdAt).toLocaleDateString() : "Pending"}
              </div>
            </div>

            <div className="flex items-center justify-between p-4 border border-border rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                  <Phone className="h-4 w-4 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">First Call</p>
                  <p className="text-xs text-muted-foreground">
                    Start your first AI-powered call
                  </p>
                </div>
              </div>
              <Button size="sm" variant="outline" asChild>
                <Link to="/dashboard?tab=live-call-center">
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Upload Lead Dialog */}
      <DashboardUploadLeadDialog
        isOpen={isLeadDialogOpen}
        onClose={() => setIsLeadDialogOpen(false)}
        onUpload={(leads) => {
          setHasLeads(true);
          setIsLeadDialogOpen(false);
        }}
      />
    </div>
  );
};

export default DashboardOverview;
