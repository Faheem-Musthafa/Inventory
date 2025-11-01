import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { LogIn, Eye, EyeOff, Lock, Mail, Shield, Users, UserCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { validateCredentials, saveCurrentUser } from '@/lib/auth';
import type { User } from '@/lib/firebase';

const formSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

type FormData = z.infer<typeof formSchema>;

interface LoginProps {
  onLogin: () => void;
}

export function Login({ onLogin }: LoginProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showNameDialog, setShowNameDialog] = useState(false);
  const [pendingUser, setPendingUser] = useState<User | null>(null);
  const [staffName, setStaffName] = useState('');
  const { toast } = useToast();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);

    try {
      // Validate credentials and get user info
      const user = validateCredentials(data.email, data.password);

      if (user) {
        // If user is staff, show name dialog
        if (user.role === 'staff') {
          setPendingUser(user);
          setShowNameDialog(true);
          setIsLoading(false);
        } else {
          // Manager - proceed directly
          saveCurrentUser(user);
          
          toast({
            title: 'Login successful!',
            description: `Welcome Manager, ${user.name}`,
          });

          // Call onLogin callback
          setTimeout(() => {
            onLogin();
          }, 500);
          setIsLoading(false);
        }
      } else {
        toast({
          title: 'Invalid credentials',
          description: 'Please check your email and password',
          variant: 'destructive',
        });
        setIsLoading(false);
      }
    } catch (error) {
      toast({
        title: 'Login failed',
        description: 'An error occurred. Please try again.',
        variant: 'destructive',
      });
      setIsLoading(false);
    }
  };

  const handleStaffNameSubmit = () => {
    if (!staffName.trim()) {
      toast({
        title: 'Name required',
        description: 'Please enter your name to continue',
        variant: 'destructive',
      });
      return;
    }

    if (pendingUser) {
      // Update user with custom name
      const updatedUser = {
        ...pendingUser,
        name: staffName.trim(),
      };

      saveCurrentUser(updatedUser);
      
      toast({
        title: 'Login successful!',
        description: `Welcome ${staffName.trim()}!`,
      });

      // Call onLogin callback
      setTimeout(() => {
        onLogin();
      }, 500);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#ccb88b] via-white to-purple-50 p-4">
      <div className="w-full max-w-md">
        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-[#d1b77c] to-[#cfb579] rounded-2xl shadow-lg mb-4">
              <Lock className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Welcome Back</h1>
            <p className="text-gray-500">Sign in to access FUDE Studio Dubai Inventory</p>
            
            {/* Role Badges */}
            <div className="flex items-center justify-center gap-2 pt-2">
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">
                <Shield className="w-3.5 h-3.5" />
                <span>Manager</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 rounded-full text-xs font-medium">
                <Users className="w-3.5 h-3.5" />
                <span>Staff</span>
              </div>
            </div>
          </div>

          {/* Login Form */}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700 font-medium">Email Address</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <Input
                          type="email"
                          placeholder="admin@fudestudio.com"
                          className="pl-11 h-12 bg-gray-50 border-gray-200 focus:border-[#cfb579] focus:ring-2 focus:ring-[#e8d9a3] transition-all"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700 font-medium">Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <Input
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Enter your password"
                          className="pl-11 pr-11 h-12 bg-gray-50 border-gray-200 focus:border-[#cfb579] focus:ring-2 focus:ring-[#e8d9a3] transition-all"
                          {...field}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                        >
                          {showPassword ? (
                            <EyeOff className="w-5 h-5" />
                          ) : (
                            <Eye className="w-5 h-5" />
                          )}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 bg-gradient-to-r from-[#cfb579] to-[#cfb579] hover:from-[#cfb579] hover:to-[#cfb579] text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Signing in...
                  </>
                ) : (
                  <>
                    <LogIn className="w-5 h-5 mr-2" />
                    Sign In
                  </>
                )}
              </Button>
            </form>
          </Form>

          {/* Footer */}
          <div className="text-center pt-4 border-t border-gray-100">
            <p className="text-sm text-gray-500">
              FUDE Studio Dubai Inventory Management System
            </p>
            <p className="text-xs text-gray-400 mt-1">
              © 2025 FUDE Studio Dubai. All rights reserved.
            </p>
          </div>
        </div>

        {/* Additional Info */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            Need help? Contact support
          </p>
        </div>
      </div>

      {/* Staff Name Dialog */}
      <Dialog open={showNameDialog} onOpenChange={setShowNameDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserCircle className="w-6 h-6 text-[#cfb579]" />
              Welcome, Staff Member!
            </DialogTitle>
            <DialogDescription>
              Please enter your name to continue
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <label htmlFor="staffName" className="text-sm font-medium text-gray-700">
                Your Name
              </label>
              <Input
                id="staffName"
                type="text"
                placeholder="Enter your name"
                value={staffName}
                onChange={(e) => setStaffName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleStaffNameSubmit();
                  }
                }}
                className="h-12 bg-gray-50 border-gray-200 focus:border-[#cfb579] focus:ring-2 focus:ring-[#e8d9a3]"
                autoFocus
              />
            </div>
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowNameDialog(false);
                  setStaffName('');
                  setPendingUser(null);
                }}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleStaffNameSubmit}
                className="flex-1 bg-gradient-to-r from-[#cfb579] to-[#cfb579] hover:from-[#bc994e] hover:to-[#bc994e] text-white"
              >
                Continue
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
