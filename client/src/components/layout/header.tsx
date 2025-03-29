import { useAuth } from "@/hooks/use-auth";
import { Link, useLocation } from "wouter";
import { Menu, HelpCircle, LogOut, Plus } from "lucide-react";
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
    <header className="bg-white border-b border-slate-200 flex items-center justify-between p-4">
      <div className="flex items-center">
        <button
          className="lg:hidden p-1 rounded-md hover:bg-slate-100"
          type="button"
          onClick={onMenuClick}
        >
          <Menu className="h-6 w-6" />
        </button>
        {title && (
          <h1 className="ml-4 text-xl font-semibold hidden sm:block">{title}</h1>
        )}
      </div>

      <div className="flex items-center gap-2">
        {isPlansPage && (
          <Link href="/plans/create">
            <Button className="bg-primary text-white" size="sm">
              <Plus className="h-4 w-4 mr-1" /> New Plan
            </Button>
          </Link>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <HelpCircle className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Help</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Documentation</DropdownMenuItem>
            <DropdownMenuItem>Support</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="ml-2">
              {user?.fullName || "User"}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => logout()}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
