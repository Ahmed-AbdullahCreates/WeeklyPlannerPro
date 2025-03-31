import { useAuth } from "@/hooks/use-auth";
import { Link, useLocation } from "wouter";
import { Menu, HelpCircle, LogOut, Plus, BookOpen, LifeBuoy, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface HeaderProps {
  title?: string;
  onMenuClick: () => void;
}

export function Header({ title, onMenuClick }: HeaderProps) {
  const { user, logout } = useAuth();
  const [location] = useLocation();

  const isPlansPage = location === "/plans";

  return (
    <header className="bg-white border-b border-slate-200/80 shadow-sm backdrop-blur-[2px] sticky top-0 z-30">
      <div className="px-4 h-16 flex items-center justify-between relative">
        {/* Simplified background with blue accent */}
        <div className="absolute inset-0 bg-gradient-to-r from-slate-50/50 via-white to-slate-50/50">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(59,130,246,0.05),transparent)]"></div>
        </div>

        {/* Left section */}
        <div className="flex items-center space-x-4 relative z-10">
          <button
            className="lg:hidden relative group"
            type="button"
            onClick={onMenuClick}
          >
            <div className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-slate-100 transition-colors duration-200">
              <Menu className="h-5 w-5 text-slate-600 group-hover:text-blue-600 transition-colors duration-200" />
            </div>
          </button>

          {title && (
            <div className="hidden sm:block group cursor-default">
              <h1 className="text-lg font-semibold text-slate-800">
                {title}
              </h1>
              <div className="h-0.5 w-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transform origin-left scale-x-100 group-hover:scale-x-110 transition-transform duration-200"></div>
            </div>
          )}
        </div>

        {/* Right section */}
        <div className="flex items-center space-x-3 relative z-10">
          {isPlansPage && (
            <Link href="/plans/create">
              <Button className="bg-blue-600 hover:bg-blue-500 text-white shadow-sm relative overflow-hidden group transition-all duration-200">
                <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
                <Plus className="h-4 w-4 mr-1.5 group-hover:rotate-90 transition-transform duration-200" />
                <span>New Plan</span>
              </Button>
            </Link>
          )}

          {/* Help dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                className="relative group w-9 h-9 rounded-full hover:bg-slate-100 transition-colors duration-200"
              >
                <HelpCircle className="h-5 w-5 text-slate-600 group-hover:text-blue-600 transition-colors duration-200" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent 
              align="end"
              className="w-52 shadow-lg border-slate-200"
            >
              <DropdownMenuLabel className="text-blue-600 font-medium">Help Center</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="hover:bg-slate-50 focus:bg-slate-50 cursor-pointer">
                <div className="flex items-center">
                  <div className="p-1 rounded bg-blue-50 mr-2">
                    <BookOpen className="h-4 w-4 text-blue-500" />
                  </div>
                  Documentation
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem className="hover:bg-slate-50 focus:bg-slate-50 cursor-pointer">
                <div className="flex items-center">
                  <div className="p-1 rounded bg-blue-50 mr-2">
                    <LifeBuoy className="h-4 w-4 text-blue-500" />
                  </div>
                  Support
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* User dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                className="group hover:bg-slate-100 px-3 h-9 transition-all duration-200"
              >
                <div className="flex items-center space-x-2">
                  <div className="relative">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white shadow-sm transform group-hover:scale-110 transition-transform duration-200">
                      <span className="text-sm font-medium">
                        {user?.fullName?.substring(0, 1).toUpperCase() || "U"}
                      </span>
                    </div>
                  </div>
                  <span className="text-sm font-medium text-slate-700">{user?.fullName || "User"}</span>
                  <ChevronDown className="h-4 w-4 text-slate-500 group-hover:rotate-180 transition-transform duration-200" />
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent 
              align="end" 
              className="w-52 shadow-lg border-slate-200"
            >
              <div className="px-2 py-2.5 border-b border-slate-100">
                <div className="text-sm font-medium text-slate-900">{user?.fullName}</div>
                <div className="text-xs text-slate-500 mt-0.5">
                  {user?.isAdmin ? "Administrator" : "Teacher"}
                </div>
              </div>
              <DropdownMenuItem 
                className="hover:bg-rose-50 focus:bg-rose-50 text-rose-600 cursor-pointer mt-1"
                onClick={() => logout()}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
