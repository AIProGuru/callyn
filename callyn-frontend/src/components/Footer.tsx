
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-secondary text-secondary-foreground py-12 px-4">
      <div className="container mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <div className="h-10 w-10 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-bold">
                <span className="text-xl">c</span>
              </div>
              <span className="text-2xl font-bold">callyn</span>
            </div>
            <p className="text-muted-foreground">
              AI-powered answering service for small businesses.
            </p>
          </div>
          
          <div>
            <h4 className="text-lg font-bold mb-4">Product</h4>
            <ul className="space-y-2">
              <li><Link to="#" className="text-muted-foreground hover:text-foreground transition-colors">Features</Link></li>
              <li><Link to="#" className="text-muted-foreground hover:text-foreground transition-colors">Pricing</Link></li>
              <li><Link to="#" className="text-muted-foreground hover:text-foreground transition-colors">Use Cases</Link></li>
              <li><Link to="#" className="text-muted-foreground hover:text-foreground transition-colors">FAQ</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-lg font-bold mb-4">Resources</h4>
            <ul className="space-y-2">
              <li><Link to="#" className="text-muted-foreground hover:text-foreground transition-colors">Blog</Link></li>
              <li><Link to="#" className="text-muted-foreground hover:text-foreground transition-colors">Getting Started Guide</Link></li>
              <li><Link to="#" className="text-muted-foreground hover:text-foreground transition-colors">Support</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-lg font-bold mb-4">Company</h4>
            <ul className="space-y-2">
              <li><Link to="#" className="text-muted-foreground hover:text-foreground transition-colors">About</Link></li>
              <li><Link to="#" className="text-muted-foreground hover:text-foreground transition-colors">Careers</Link></li>
              <li><Link to="#" className="text-muted-foreground hover:text-foreground transition-colors">Contact</Link></li>
              <li><Link to="#" className="text-muted-foreground hover:text-foreground transition-colors">Privacy Policy</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-border mt-8 pt-8 text-center">
          <p className="text-muted-foreground">
            © 2024 Callyn. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
