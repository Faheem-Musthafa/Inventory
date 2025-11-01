import { useEffect, useState } from 'react';
import { MailQuestion, Menu, User, TrendingUp, Calendar, LogOut, Shield, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { format } from 'date-fns';
import { getCurrentUser } from '@/lib/auth';

interface HeaderProps {
  onLogout?: () => void;
}

export function Header({ onLogout }: HeaderProps) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const currentUser = getCurrentUser();

  useEffect(() => {
    // Update time every minute
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, []);


  return (
    <header className="bg-gradient-to-r from-white to-gray-50 border-b border-gray-200 sticky top-0 z-20 shadow-sm">
      <div className="px-8 py-4">
        <div className="flex items-center justify-between">
          
          {/* Left Side - Greeting & Date/Time */}
          <div className="flex items-center gap-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 18 ? 'Afternoon' : 'Evening'}! 
              </h1>
              <div className="flex items-center gap-4 mt-1">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Calendar className="w-4 h-4" />
                  <span>{format(currentTime, 'EEEE, MMMM d, yyyy')}</span>
                </div>
                <div className="hidden sm:block w-1 h-1 rounded-full bg-gray-300"></div>
                <div className="hidden sm:flex items-center gap-2 text-sm text-gray-500">
                  <TrendingUp className="w-4 h-4" />
                  <span>Live Dashboard</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Actions & Profile */}
          <div className="flex items-center gap-3">
            
            {/* Notifications */}
            <Button 
              variant="ghost" 
              disabled
              size="icon" 
              className="relative rounded-full hover:bg-[#ccb88b]  transition-colors"
            >
              <MailQuestion className="w-5 h-5 text-gray-600" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
            </Button>

            {/* Divider */}
            <div className="h-8 w-px bg-gray-200"></div>

            {/* User Profile Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <div className="flex items-center gap-3 bg-white rounded-full px-4 py-2 shadow-sm border border-gray-200 hover:border-[#e5d39b] transition-all cursor-pointer">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#cfb579] to-[#bda15e] flex items-center justify-center text-white font-semibold text-sm shadow-md">
                    <User className="w-5 h-5" />
                  </div>
                  <div className="hidden md:block">
                    <p className="text-sm font-semibold text-gray-900">{currentUser?.name || 'User'}</p>
                    <p className="text-xs text-gray-500 capitalize flex items-center gap-1">
                      {currentUser?.role === 'manager' ? (
                        <>
                          <Shield className="w-3 h-3" />
                          <span>Manager</span>
                        </>
                      ) : (
                        <>
                          <Users className="w-3 h-3" />
                          <span>Staff</span>
                        </>
                      )}
                    </p>
                  </div>
                  <Menu className="w-4 h-4 text-gray-400 hidden md:block" />
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium">{currentUser?.name}</p>
                    <p className="text-xs text-gray-500">{currentUser?.email}</p>
                    <div className="flex items-center gap-1 mt-1">
                      {currentUser?.role === 'manager' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                          <Shield className="w-3 h-3" />
                          Manager
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                          <Users className="w-3 h-3" />
                          Staff
                        </span>
                      )}
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-gray-700">
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={onLogout}
                  className="text-red-600 focus:text-red-600 focus:bg-red-50 cursor-pointer"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log Out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
}