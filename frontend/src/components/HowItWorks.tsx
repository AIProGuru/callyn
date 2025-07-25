
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const HowItWorks = () => {
  const steps = [
    {
      number: "1",
      title: "Connect Your Google Business Profile",
      description: "Paste your website from Google. Callyn will scan for opening hours, services, FAQs, and contact info.",
      image: "/lovable-uploads/b982e5a3-f2a8-4454-ba90-a92fe4242873.png"
    },
    {
      number: "2",
      title: "Callyn uses your business script",
      description: "Callyn learns your business fast. Add key info, choose what questions to ask callers, and customize how Callyn responds — all in minutes.",
      image: "/lovable-uploads/62ea189c-696d-4629-a154-b6c91f973291.png"
    },
    {
      number: "3",
      title: "Forward Calls to Callyn",
      description: "No need to change your number. Just forward your calls, and Callyn will handle them 24/7 with your script and booking link.",
      image: "/lovable-uploads/3bd3d4c6-823e-4f57-b317-2611f91689af.png"
    },
    {
      number: "4",
      title: "Every Call Answered, Every Lead Logged.",
      description: "Callyn speaks for you — takes calls, qualifies leads, and captures everything in one clean summary. You'll know exactly who called, what they wanted, and what to do next.",
      image: "/lovable-uploads/c1bf6c33-6c5c-4279-a6b1-53004666eb3c.png"
    }
  ];

  return (
    <section className="bg-white py-16 md:py-24 px-4">
      <div className="container mx-auto">
        <h2 className="text-3xl md:text-5xl font-bold text-callyn-darkBlue text-center mb-4">
          Callyn Learns Your Business Within Minutes
        </h2>
        <p className="text-xl text-gray-600 text-center mb-16 max-w-3xl mx-auto">
          Powerful, yet super easy to set up and get started in minutes.
        </p>

        <div className="space-y-24">
          {steps.map((step, index) => (
            <div 
              key={index} 
              className={`flex flex-col ${index % 2 !== 0 ? 'md:flex-row-reverse' : 'md:flex-row'} items-center gap-8 md:gap-16`}
            >
              <div className="w-full md:w-1/2">
                <div className="bg-callyn-lightBlue text-callyn-blue py-2 px-6 rounded-full inline-block mb-6 font-medium">
                  STEP {step.number}
                </div>
                <h3 className="text-2xl md:text-4xl font-bold text-callyn-darkBlue mb-6">
                  {step.title}
                </h3>
                <p className="text-lg text-gray-600 max-w-lg">
                  {step.description}
                </p>
              </div>
              <div className="w-full md:w-1/2">
                <img
                  src={step.image}
                  alt={`Step ${step.number}`}
                  className="w-full h-auto rounded-lg shadow-lg"
                />
              </div>
            </div>
          ))}
        </div>

        {/* Get Started For Free button at the end */}
        <div className="mt-20 text-center">
          <div className="flex flex-col items-center">
            <Button className="rounded-full bg-callyn-blue hover:bg-callyn-darkBlue text-white px-10 py-6 text-lg font-medium" asChild>
              <Link to="/onboarding">Get Started for Free</Link>
            </Button>
            <p className="mt-4 text-gray-500">
              First 45 minutes completely free. No credit card required.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
