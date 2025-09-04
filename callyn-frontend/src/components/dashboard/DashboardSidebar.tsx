
import { useNavigate } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarRail
} from "@/components/ui/sidebar";
import { useAuth } from "@/context";
import SidebarUserHeader from "./sidebar/SidebarUserHeader";
import SidebarMenuSection from "./sidebar/SidebarMenuSection";
import SidebarLogoutFooter from "./sidebar/SidebarLogoutFooter";
import {
  getAgentBuilderItems,
  getCampaignItems,
  getCallCenterItems,
  getSettingsItems
} from "./sidebar/menuItems";

interface DashboardSidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const DashboardSidebar = ({ activeTab, setActiveTab }: DashboardSidebarProps) => {
  const { user, logout, userAgent, progressState } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const agentBuilderItems = getAgentBuilderItems();
  const campaignItems = getCampaignItems();
  const callCenterItems = getCallCenterItems();
  const settingsItems = getSettingsItems();

  return (
    <Sidebar>
      <SidebarRail />

      <SidebarUserHeader user={user} />

      <SidebarContent className="space-y-6">
        <SidebarMenuSection
          title="Agent Builder"
          items={agentBuilderItems}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          userAgent={userAgent}
          progressState={progressState}
        />

        <SidebarMenuSection
          title="Campaigns"
          items={campaignItems}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          userAgent={userAgent}
          progressState={progressState}
        />

        <SidebarMenuSection
          title="Call Center"
          items={callCenterItems}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          userAgent={userAgent}
          progressState={progressState}
        />

        <SidebarMenuSection
          title="Settings"
          items={settingsItems}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          userAgent={userAgent}
          progressState={progressState}
        />
      </SidebarContent>

      <SidebarLogoutFooter onLogout={handleLogout} />
    </Sidebar>
  );
};

export default DashboardSidebar;
