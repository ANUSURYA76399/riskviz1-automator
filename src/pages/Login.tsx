
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  // Redirect if already authenticated
  if (isAuthenticated) {
    navigate("/");
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isSignUp) {
        // Sign up flow
        const { error, data } = await supabase.auth.signUp({ 
          email, 
          password,
          options: {
            data: {
              first_name: "",
              last_name: ""
            }
          }
        });

        if (error) {
          console.error("Signup error:", error);
          toast({
            variant: "destructive",
            title: "Signup failed",
            description: error.message
          });
        } else {
          toast({
            title: "Account created",
            description: "Please check your email to verify your account."
          });
          // Switch to login view after signup
          setIsSignUp(false);
        }
      } else {
        // Login flow
        const { error } = await supabase.auth.signInWithPassword({ email, password });

        if (error) {
          console.error("Login error:", error);
          toast({
            variant: "destructive",
            title: "Login failed",
            description: error.message || "Please check your credentials and try again."
          });
        } else {
          navigate("/");
        }
      }
    } catch (error) {
      console.error("Authentication error:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "An unexpected error occurred. Please try again."
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8 space-y-6 bg-white">
        <div className="text-center">
          <h1 className="text-2xl font-bold">{isSignUp ? "Create Account" : "Login"}</h1>
          <p className="text-gray-500 mt-2">Risk Perception Analysis</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Email</label>
            <Input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="bg-white"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Password</label>
            <Input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="bg-white"
            />
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Processing..." : isSignUp ? "Sign Up" : "Login"}
          </Button>
        </form>

        <div className="text-center">
          <button
            type="button"
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-sm text-blue-600 hover:underline"
          >
            {isSignUp ? "Already have an account? Login" : "Need an account? Sign Up"}
          </button>
        </div>
      </Card>
    </div>
  );
};

export default Login;
