import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { 
  LayoutDashboard, 
  ClipboardList, 
  Users, 
  GraduationCap,
  BookOpen,
  Calendar,
  Menu,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { user, isAdmin } = useAuth();

  const links = [
    { href: "/", label: "Dashboard", icon: <LayoutDashboard className="h-5 w-5 mr-2" /> },
    { href: "/plans", label: "My Plans", icon: <ClipboardList className="h-5 w-5 mr-2" /> },
  ];

  const adminLinks = [
    { href: "/admin/teachers", label: "Teachers", icon: <Users className="h-5 w-5 mr-2" /> },
    { href: "/admin/grades", label: "Grades", icon: <GraduationCap className="h-5 w-5 mr-2" /> },
    { href: "/admin/subjects", label: "Subjects", icon: <BookOpen className="h-5 w-5 mr-2" /> },
    { href: "/admin/planning-weeks", label: "Planning Weeks", icon: <Calendar className="h-5 w-5 mr-2" /> },
  ];

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}  
        />
      )}

      {/* Sidebar */}
      <div className={cn(
        "fixed top-0 left-0 h-full w-64 bg-slate-900 text-white z-50 transition-transform duration-300 ease-in-out lg:static lg:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="p-4 flex items-center justify-between mb-8">
          <div className="flex items-center">
            <div className="h-8 w-8 bg-white rounded flex items-center justify-center text-primary">
              <ClipboardList className="h-5 w-5" />
            </div>
            <span className="ml-2 text-xl font-semibold">WeeklyScheduler</span>
          </div>
          <button onClick={onClose} className="lg:hidden p-1 hover:bg-slate-800 rounded">
            <X className="h-6 w-6" />
          </button>
        </div>
        
        <div className="px-4 space-y-1">
          <p className="text-xs uppercase text-slate-500 mb-2 mt-4">Dashboard</p>
          {links.map((link) => (
            <NavLink key={link.href} {...link} onClick={onClose} />
          ))}
          
          {isAdmin && (
            <>
              <p className="text-xs uppercase text-slate-500 mb-2 mt-4">Admin</p>
              {adminLinks.map((link) => (
                <NavLink key={link.href} {...link} onClick={onClose} />
              ))}
            </>
          )}
        </div>
        
        <div className="mt-auto p-4 border-t border-slate-700">
          <div className="flex items-center">
            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center">
              <span className="text-sm font-medium">
                {user?.fullName?.substring(0, 2).toUpperCase() || "U"}
              </span>
            </div>
            <div className="ml-2">
              <p className="text-sm font-medium">{user?.fullName || "User"}</p>
              <p className="text-xs text-slate-400">{user?.isAdmin ? "Administrator" : "Teacher"}</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

interface NavLinkProps {
  href: string;
  label: string;
  icon: React.ReactNode;
  onClick?: () => void;
}

function NavLink({ href, label, icon, onClick }: NavLinkProps) {
  const [currentPath] = window.location.pathname.split('?');
  const isActive = currentPath === href || (href !== '/' && currentPath.startsWith(href));

  return (
    <Link href={href}>
      <a 
        onClick={onClick}
        className={cn(
          "flex items-center px-3 py-2 text-sm rounded-md",
          isActive 
            ? "bg-slate-800" 
            : "text-slate-300 hover:bg-slate-800"
        )}
      >
        {icon}
        {label}
      </a>
    </Link>
  );
}
