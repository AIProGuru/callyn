
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import LoginForm from "@/components/auth/LoginForm";
// import GoogleSignupButton from "@/components/auth/GoogleSignupButton";
import { Separator } from "@/components/ui/separator";

const Login = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <main className="flex-grow py-16 px-4 bg-muted/30">
        <div className="container mx-auto max-w-md">
          <div className="bg-card rounded-lg p-8 shadow-sm border">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-foreground mb-2">
                Log In to Your Account
              </h1>
              <p className="text-muted-foreground">
                Welcome back to Callyn, your AI sales agent
              </p>
            </div>

            <div className="space-y-6">
              {/* <GoogleSignupButton /> */}

              <div className="flex items-center gap-4 my-6">
                <Separator className="grow w-auto" />
                <span className="text-muted-foreground text-sm">or</span>
                <Separator className="grow w-auto" />
              </div>

              <LoginForm />
            </div>

            <div className="mt-6 text-center border-t border-border pt-6">
              <p className="text-muted-foreground">
                Don't have an account?{" "}
                <Link to="/signup" className="text-primary hover:underline font-medium">
                  Sign up
                </Link>
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Login;
