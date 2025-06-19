import React, {
  createContext,
  useState,
  useContext,
  ReactNode,
  useEffect,
} from "react";
import { useNavigate } from "react-router-dom";
import { ScenarioProps } from "@/components/onboarding/types";
import {
  OutreachData,
  LanguageConfig,
} from "@/components/dashboard/outreach/types";
import axios from "axios";
import { CloudCog } from "lucide-react";
const SERVER_URL = import.meta.env.VITE_SERVER_URL;

interface User {
  id?: string;
  email: string;
  name?: string;
  photoURL?: string;
}

interface OnboardingData {
  // Step 1 data
  timeframe?: string;

  // Step 2 data
  businessName?: string;
  industry?: string;
  targetAudience?: string;
  mainGoal?: string;

  // Step 3 data
  scriptMethod?: string;
  websiteUrl?: string;
  uploadedFile?: File | null;
  customScript?: string;

  // Step 4 data
  selectedVoice?: string;
  personality?: string;
  speakingSpeed?: number;
  enthusiasm?: number;
  useSmallTalk?: boolean;
  handleObjections?: boolean;

  // Language configuration
  languageConfig?: LanguageConfig;

  // Legacy data for backward compatibility
  selectedScenario?: ScenarioProps | null;
  trainingMethod?: string | null;
  voicePreview?: {
    greeting: string;
    message: string;
  };
}

interface UserAgent {
  id: string;
  name: string;
  status: "active" | "inactive" | "training";
  createdAt: string;
  configuration: {
    voice: string;
    personality: string;
    script: string;
    businessInfo: {
      name: string;
      industry: string;
      targetAudience: string;
      mainGoal: string;
    };
  };
  scriptMethod: string;
  websiteUrl: string;
  uploadedFile: string;
}

interface AuthContextType {
  user: User | null;
  onboardingData: OnboardingData | null;
  userAgent: UserAgent | null;
  outreachData: OutreachData | null;
  setupCompleted: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  googleLogin: () => Promise<void>;
  signup: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
  setOnboardingData: (data: OnboardingData) => void;
  setOutreachData: (data: OutreachData) => void;
  createUserAgent: (onboardingData: OnboardingData) => Promise<UserAgent>;
  updateUserAgent: (onboardingData: OnboardingData) => Promise<UserAgent>;
  hasCompletedSetup: () => boolean;
  markSetupCompleted: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [onboardingData, setOnboardingData] = useState<OnboardingData | null>(
    null
  );
  const [userAgent, setUserAgent] = useState<UserAgent | null>(null);
  const [outreachData, setOutreachData] = useState<OutreachData | null>(null);
  const [setupCompleted, setSetupCompleted] = useState(false);

  const isAuthenticated = !!user;

  const login = async (email: string, password: string) => {
    setUser({ email });
    localStorage.setItem("user", JSON.stringify({ email }));
  };

  const googleLogin = async () => {
    const mockGoogleUser = {
      email: "demo@gmail.com",
      name: "Demo User",
      photoURL: "https://ui-avatars.com/api/?name=Demo+User&background=random",
    };
    setUser(mockGoogleUser);
    localStorage.setItem("user", JSON.stringify(mockGoogleUser));
    console.log("localStorage user set")
  };

  const signup = async (email: string, password: string, name: string) => {
    const newUser = {
      email,
      name,
      photoURL: `https://ui-avatars.com/api/?name=${encodeURIComponent(
        name
      )}&background=random`,
    };
    setUser(newUser);
    localStorage.setItem("user", JSON.stringify(newUser));
  };

  const logout = () => {
    setUser(null);
    setUserAgent(null);
    setOnboardingData(null);
    setOutreachData(null);
    setSetupCompleted(false);
    localStorage.removeItem("user");
    localStorage.removeItem("user_agent");
    localStorage.removeItem("onboarding_data");
    localStorage.removeItem("outreach_data");
    localStorage.removeItem("setup_completed");
  };

  const createUserAgent = async (data: OnboardingData): Promise<UserAgent> => {
    const user = JSON.parse(localStorage.getItem("user"));

    if (!user) {
      navigate("/login");
      return;
    }

    const agentName = data.businessName || "My AI Agent";

    const payload = {
      user_id: user.email,
      name: agentName,
      customScript: data.customScript || null,
      model_provider: "openai",
      model_id: "chatgpt-4o-latest",
      voice_provider: "11labs",
      voice_id: data.selectedVoice || "IKne3meq5aSn9XLyUdCD",
      industry: data.industry || null,
      targetAudience: data.targetAudience || null,
      mainGoal: data.mainGoal || null,
      scriptMethod: data.scriptMethod || null,
      websiteUrl: data.websiteUrl || null,
      uploadedFile: data.uploadedFile || null,
      speakingSpeed: data.speakingSpeed || 1.0,
      enthusiasm: data.enthusiasm || 5.0,
      useSmallTalk: data.useSmallTalk || true,
      handleObjections: data.handleObjections || true,
      languageConfig: data.languageConfig || null,
      selectedScenario: data.selectedScenario || null,
      trainingMethod: data.trainingMethod || null,
      voicePreview: data.voicePreview || null,
    };

    try {
      const response = await fetch(`${SERVER_URL || ""}/api/create-assistant`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Failed to create assistant");
      }

      const responseData = await response.json();
      const assistant = responseData.assistant;

      console.log("assistant", assistant);

      const newAgent: UserAgent = {
        id: assistant.assistant_id || `agent_${Date.now()}`,
        name: agentName,
        status: "active",
        createdAt: new Date().toISOString(),
        configuration: {
          voice: data.selectedVoice || "9BWtsMINqrJLrRacOk9x",
          personality: data.personality || "professional",
          script: data.customScript || "Default sales script",
          businessInfo: {
            name: data.businessName || "",
            industry: data.industry || "",
            targetAudience: data.targetAudience || "",
            mainGoal: data.mainGoal || "",
          },
        },
        scriptMethod: assistant.sciptMethod,
        websiteUrl: assistant.websiteUrl,
        uploadedFile: assistant.uploadedFile,
      };

      setUserAgent(newAgent);
      localStorage.setItem("user_agent", JSON.stringify(newAgent));
      setSetupCompleted(true);
      localStorage.setItem("setup_completed", "true");

      console.log("Agent created successfully:", newAgent);
      return newAgent;
    } catch (error) {
      console.error("Error creating agent:", error);
      throw error;
    }
  };

  const updateUserAgent = async (data: OnboardingData) => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user) {
      throw new Error("User not found in localStorage");
    }

    console.log("asdfasdf", data)
  
    try {
      const response = await fetch(`${SERVER_URL}/api/update-agent`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId: user.email, data }),
      });
  
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Failed to update assistant");
      }
  
      const responseData = await response.json();
      const updatedAgent: UserAgent = {
        id: responseData.assistant_id,
        name: responseData.name,
        status: "active",
        createdAt: responseData.createdAt,
        configuration: {
          voice: responseData.voice,
          personality: responseData.personality,
          script: responseData.script,
          businessInfo: responseData.businessInfo,
        },
        scriptMethod: responseData.sciptMethod,
        websiteUrl: responseData.websiteUrl,
        uploadedFile: responseData.uploadedFile,
      };

      setUserAgent(updatedAgent);
      localStorage.setItem("user_agent", JSON.stringify(updatedAgent));
  
      console.log("Agent updated successfully:", updatedAgent);
      return updatedAgent;
    } catch (error) {
      console.error("Error updating agent:", error);
      throw error;
    }
  };

  const hasCompletedSetup = (): boolean => {
    return setupCompleted && !!userAgent;
  };

  const markSetupCompleted = () => {
    setSetupCompleted(true);
    localStorage.setItem("setup_completed", "true");
  };

  useEffect(() => {
    const storedOnboardingData = localStorage.getItem("onboarding_data");
    const storedOutreachData = localStorage.getItem("outreach_data");
    const storedSetupCompleted = localStorage.getItem("setup_completed");

    // if (storedUser) {
    //   try {
    //     setUser(JSON.parse(storedUser));
    //   } catch (error) {
    //     console.error("Error parsing stored user:", error);
    //     localStorage.removeItem("user");
    //   }
    // }

    if (storedOnboardingData) {
      try {
        setOnboardingData(JSON.parse(storedOnboardingData));
      } catch (error) {
        console.error("Error parsing stored onboarding data:", error);
        localStorage.removeItem("onboarding_data");
      }
    }

    if (storedOutreachData) {
      try {
        setOutreachData(JSON.parse(storedOutreachData));
      } catch (error) {
        console.error("Error parsing stored outreach data:", error);
        localStorage.removeItem("outreach_data");
      }
    }

    if (storedSetupCompleted === "true") {
      setSetupCompleted(true);
    }

    // Fetch agent data from backend
    const fetchAgent = async () => {
      try {
        const response = await fetch(
          `${SERVER_URL}/api/assistants?user_id=${user.email}`
        );
        if (!response.ok) throw new Error("Failed to fetch agent data");

        const assistants = await response.json();
        const assistant = assistants[0];

        const userAgent: UserAgent = {
          id: assistant.assistant_id || `agent_${Date.now()}`,
          name: assistant.name,
          status: "active",
          createdAt: new Date().toISOString(),
          configuration: {
            voice: assistant.voice || "9BWtsMINqrJLrRacOk9x",
            personality: assistant.tone || "professional",
            script: assistant.custom_script,
            businessInfo: {
              name: assistant.name,
              industry: assistant.industry,
              targetAudience: assistant.target_audience,
              mainGoal: assistant.main_goal,
            },
          },
          scriptMethod: assistant.sciptMethod,
          websiteUrl: assistant.websiteUrl,
          uploadedFile: assistant.uploadedFile,
        };

        setUserAgent(userAgent);

        localStorage.setItem("user_agent", JSON.stringify(userAgent)); // optional
      } catch (error) {
        console.error("Error fetching user agent:", error);
      }
    };

    fetchAgent();
  }, [user]);

  const handleSetOnboardingData = (data: OnboardingData) => {
    setOnboardingData(data);
    localStorage.setItem("onboarding_data", JSON.stringify(data));
  };

  const handleSetOutreachData = (data: OutreachData) => {
    setOutreachData(data);
    localStorage.setItem("outreach_data", JSON.stringify(data));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        onboardingData,
        userAgent,
        outreachData,
        setupCompleted,
        isAuthenticated,
        login,
        googleLogin,
        signup,
        logout,
        setOnboardingData: handleSetOnboardingData,
        setOutreachData: handleSetOutreachData,
        createUserAgent,
        updateUserAgent,
        hasCompletedSetup,
        markSetupCompleted,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export default AuthProvider;
