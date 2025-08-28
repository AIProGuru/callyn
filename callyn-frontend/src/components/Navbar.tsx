import { Button } from "@/components/ui/button";
import { Phone } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/context";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ThemeToggle } from "@/components/ui/theme-toggle";

const Navbar = () => {
  const { logout, user } = useAuth();

  return (
    <nav className="bg-background border-b border-border py-4 px-6 md:px-10 flex justify-between items-center shadow-sm transition-colors duration-200">
      <div className="flex items-center">
        <Link to="/" className="text-3xl font-bold text-primary">CALLYN</Link>
      </div>

      <div className="hidden md:flex items-center space-x-8">
        <Link to="/#features" className="text-foreground hover:text-primary transition-colors">Features</Link>
        <Link to="/#solutions" className="text-foreground hover:text-primary transition-colors">Solutions</Link>
        <Link to="/#pricing" className="text-foreground hover:text-primary transition-colors">Pricing</Link>
        {!!user ? (
          <>
            <Link to="/dashboard" className="text-foreground hover:text-primary transition-colors">Dashboard</Link>
            <button onClick={logout} className="text-foreground hover:text-primary transition-colors">Logout</button>
          </>
        ) : (
          <Link to="/login" className="text-foreground hover:text-primary transition-colors">Login</Link>
        )}
      </div>

      <div className="hidden md:flex items-center gap-4">
        <ThemeToggle />
        <Button variant="outline" className="flex items-center gap-2">
          <Phone size={16} className="mr-2" />
          <span>Contact Sales</span>
        </Button>
        {!!user ? (
          <Button
            asChild
            className="rounded-full bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            <Link to="/dashboard" className="flex items-center gap-2">
              <span>Dashboard</span>
              <Avatar className="h-6 w-6">
                <AvatarImage src={user?.photoURL} alt={user?.name || ""} />
                <AvatarFallback>
                  {user?.name?.charAt(0) || user?.email?.charAt(0)}
                </AvatarFallback>
              </Avatar>
            </Link>
          </Button>
        ) : (
          <Button asChild className="rounded-full bg-primary hover:bg-primary/90 text-primary-foreground">
            <Link to="/onboarding">Get Started</Link>
          </Button>
        )}
      </div>

      <div className="md:hidden flex items-center gap-2">
        <ThemeToggle />
        <button className="text-foreground">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
