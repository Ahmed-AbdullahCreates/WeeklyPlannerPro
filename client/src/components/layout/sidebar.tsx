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
  X,
  ChevronRight,
  LogOut,
  CheckSquare
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocation } from "wouter";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { user, isAdmin, logout } = useAuth();
  const [location] = useLocation();

  // Dashboard is always visible to all users
  const dashboardLink = { href: "/", label: "Dashboard", icon: <LayoutDashboard className="h-4 w-4" /> };

  // "My Plans" is only visible to teachers (non-admin users)
  const teacherLinks = [
    { href: "/plans", label: "My Plans", icon: <ClipboardList className="h-4 w-4" /> },
  ];

  const adminLinks = [
    { href: "/admin/teachers", label: "Teachers", icon: <Users className="h-4 w-4" /> },
    { href: "/admin/grades", label: "Grades", icon: <GraduationCap className="h-4 w-4" /> },
    { href: "/admin/subjects", label: "Subjects", icon: <BookOpen className="h-4 w-4" /> },
    { href: "/admin/planning-weeks", label: "Planning Weeks", icon: <Calendar className="h-4 w-4" /> },
  ];

  // Check if current route is active
  const isActive = (href: string) => location === href || (href !== '/' && location.startsWith(href));

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside className={cn(
        "fixed top-0 left-0 bottom-0 z-40",
        "w-64 bg-white border-r border-slate-200/80",
        "flex flex-col",
        "transition-transform duration-300 ease-in-out",
        "lg:translate-x-0",
        !isOpen && "-translate-x-full"
      )}>
        {/* Fixed Header */}
        <div className="shrink-0">
          {/* Logo Section */}
          <div className="h-24 relative border-b border-slate-100">
            {/* Background patterns and effects with refined styling */}
            <div className="absolute inset-0">
              {/* Upgraded gradient background with better color blending */}
              <div className="absolute inset-0 bg-gradient-to-br from-white via-slate-50 to-indigo-50/20"></div>

              {/* Enhanced decorative elements */}
              <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-indigo-100/30 blur-2xl"></div>
              <div className="absolute -bottom-8 -left-8 w-24 h-24 rounded-full bg-indigo-200/10 blur-3xl"></div>
              
              {/* Refined grid pattern with better opacity control */}
              <div 
                className="absolute inset-0 opacity-[0.012]" 
                style={{
                  backgroundImage: `radial-gradient(circle at 1px 1px, indigo 1px, transparent 0)`,
                  backgroundSize: '24px 24px'
                }}
              ></div>
              
              {/* Add subtle animated gradient shimmer */}
              <div className="absolute -top-40 -left-20 w-80 h-80 bg-gradient-to-br from-indigo-100/20 to-transparent rounded-full blur-3xl animate-pulse-subtle"></div>
            </div>

            {/* Logo and Content with enhanced styling */}
            <div className="relative h-full px-5 flex flex-col justify-center">
              {/* Close button with improved interaction */}
              <div className="absolute top-3 right-3">
                <button 
                  onClick={onClose} 
                  className="lg:hidden w-8 h-8 flex items-center justify-center hover:bg-white/90 hover:shadow-sm rounded-full transition-all duration-200 relative z-10"
                >
                  <X className="h-4 w-4 text-slate-500" />
                </button>
              </div>

              {/* Enhanced Logo with improved 3D effect */}
              <div className="flex items-center group">
                <div className="relative w-12 h-12 flex items-center justify-center transform group-hover:scale-[1.03] transition-all duration-300">
                  {/* Enhanced 3D Logo Base with better shadows and transforms */}
                  <div className="absolute inset-1 rounded-xl bg-gradient-to-br from-indigo-600 to-indigo-700 shadow-lg transform-gpu rotate-3 transition-all duration-300"></div>
                  
                  {/* Enhanced Logo Face with better lighting effects */}
                  <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center shadow-md transform-gpu transition-all duration-300">
                    {/* Enhanced inner lighting */}
                    <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-white/30 via-transparent to-black/10 border border-white/20"></div>
                    
                    {/* Icon with gentle hover animation */}
                    <div className="relative transform group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                      <CheckSquare className="h-5 w-5 text-white drop-shadow-sm" />
                    </div>
                  </div>
                  
                  {/* Subtle glow effect on hover */}
                  <div className="absolute inset-0 rounded-lg bg-indigo-400/0 group-hover:bg-indigo-400/20 blur-xl transition-all duration-500 opacity-0 group-hover:opacity-100"></div>
                </div>

                {/* Enhanced App name with better typography and hover effect */}
                <div className="ml-3 transform group-hover:translate-x-0.5 transition-all duration-300">
                  <div className="flex flex-col">
                    <h1 className="text-xl font-bold leading-tight tracking-tight text-slate-800">
                      <span className="inline-block group-hover:text-slate-900 transition-colors duration-300">Weekly</span>
                      <span className="text-indigo-600 group-hover:text-indigo-500 transition-colors duration-300">Planner</span>
                    </h1>
                    <p className="text-[10px] text-slate-500 font-medium tracking-widest mt-0.5">SCHOOL MANAGEMENT SYSTEM</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Scrollable Navigation Area */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <nav className="px-3 py-4 space-y-6">
            <div>
              <p className="text-[11px] uppercase text-slate-400 font-semibold px-3 mb-3 tracking-widest flex items-center">
                <span className="w-5 h-px bg-slate-200 mr-2"></span>
                Dashboard
                <span className="w-5 h-px bg-slate-200 ml-2"></span>
              </p>
              <div className="space-y-0.5">
                {/* Always show Dashboard link */}
                <Link href={dashboardLink.href}>
                  <a 
                    onClick={onClose}
                    className={cn(
                      "flex items-center px-3 py-2.5 text-sm rounded-md transition-all duration-200 group relative overflow-hidden",
                      isActive(dashboardLink.href) 
                        ? "text-indigo-600 font-medium" 
                        : "text-slate-600 hover:bg-slate-50/80"
                    )}
                  >
                    {/* Background highlight for active state with animation */}
                    {isActive(dashboardLink.href) && (
                      <div className="absolute inset-0 bg-indigo-50/70 rounded-md animate-fadeIn"></div>
                    )}

                    {/* Left border indicator */}
                    {isActive(dashboardLink.href) && (
                      <div className="absolute left-0 top-[20%] bottom-[20%] w-1 bg-indigo-500 rounded-full animate-scaleY"></div>
                    )}

                    <div className={cn(
                      "relative z-10 flex items-center justify-center w-8 h-8 mr-3 rounded-md transition-all duration-200",
                      isActive(dashboardLink.href) 
                        ? "text-indigo-600 bg-white shadow-sm" 
                        : "text-slate-500 group-hover:text-indigo-500"
                    )}>
                      {dashboardLink.icon}
                    </div>

                    <span className="relative z-10 flex-1">{dashboardLink.label}</span>

                    {isActive(dashboardLink.href) && (
                      <ChevronRight className="relative z-10 h-3.5 w-3.5 text-indigo-400 animate-fadeIn" />
                    )}
                  </a>
                </Link>

                {/* Only show My Plans link for teachers (non-admin users) */}
                {!isAdmin && teacherLinks.map((link) => (
                  <Link key={link.href} href={link.href}>
                    <a 
                      onClick={onClose}
                      className={cn(
                        "flex items-center px-3 py-2.5 text-sm rounded-md transition-all duration-200 group relative overflow-hidden",
                        isActive(link.href) 
                          ? "text-indigo-600 font-medium" 
                          : "text-slate-600 hover:bg-slate-50/80"
                      )}
                    >
                      {/* Background highlight for active state */}
                      {isActive(link.href) && (
                        <div className="absolute inset-0 bg-indigo-50/70 rounded-md animate-fadeIn"></div>
                      )}

                      {/* Left border indicator */}
                      {isActive(link.href) && (
                        <div className="absolute left-0 top-[20%] bottom-[20%] w-1 bg-indigo-500 rounded-full animate-scaleY"></div>
                      )}

                      <div className={cn(
                        "relative z-10 flex items-center justify-center w-8 h-8 mr-3 rounded-md transition-all duration-200",
                        isActive(link.href) 
                          ? "text-indigo-600 bg-white shadow-sm" 
                          : "text-slate-500 group-hover:text-indigo-500"
                      )}>
                        {link.icon}
                      </div>

                      <span className="relative z-10 flex-1">{link.label}</span>

                      {isActive(link.href) && (
                        <ChevronRight className="relative z-10 h-3.5 w-3.5 text-indigo-400 animate-fadeIn" />
                      )}
                    </a>
                  </Link>
                ))}
              </div>
            </div>

            {/* Admin section with enhanced styling */}
            {isAdmin && (
              <div>
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent"></div>
                  </div>
                  <div className="relative flex justify-center">
                    <p className="text-[11px] uppercase text-slate-400 font-semibold px-3 bg-white tracking-widest">
                      Administration
                    </p>
                  </div>
                </div>

                <div className="space-y-0.5">
                  {adminLinks.map((link) => (
                    <Link key={link.href} href={link.href}>
                      <a 
                        onClick={onClose}
                        className={cn(
                          "flex items-center px-3 py-2.5 text-sm rounded-md transition-all duration-200 group relative overflow-hidden",
                          isActive(link.href) 
                            ? "text-indigo-600 font-medium" 
                            : "text-slate-600 hover:bg-slate-50/80"
                        )}
                      >
                        {/* Background highlight for active state */}
                        {isActive(link.href) && (
                          <div className="absolute inset-0 bg-indigo-50/70 rounded-md animate-fadeIn"></div>
                        )}

                        {/* Left border indicator */}
                        {isActive(link.href) && (
                          <div className="absolute left-0 top-[20%] bottom-[20%] w-1 bg-indigo-500 rounded-full animate-scaleY"></div>
                        )}

                        <div className={cn(
                          "relative z-10 flex items-center justify-center w-8 h-8 mr-3 rounded-md transition-all duration-200",
                          isActive(link.href) 
                            ? "text-indigo-600 bg-white shadow-sm" 
                            : "text-slate-500 group-hover:text-indigo-500"
                        )}>
                          {link.icon}
                        </div>

                        <span className="relative z-10 flex-1">{link.label}</span>

                        {isActive(link.href) && (
                          <ChevronRight className="relative z-10 h-3.5 w-3.5 text-indigo-400 animate-fadeIn" />
                        )}
                      </a>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </nav>
        </div>

        {/* Fixed Footer */}
        <div className="shrink-0 border-t border-slate-100">
          {/* User Profile */}
          <div className="p-3">
            <div className="flex items-center p-2 rounded-lg hover:bg-slate-50/80 transition-all duration-300 group relative overflow-hidden">
              {/* Enhanced hover highlight with better gradient */}
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-50/0 to-indigo-50/0 group-hover:from-indigo-50/40 group-hover:to-indigo-50/5 opacity-0 group-hover:opacity-100 transition-all duration-300 rounded-lg"></div>
              
              {/* User avatar with enhanced lighting effects */}
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center text-white shadow-md relative overflow-hidden group-hover:shadow-lg transition-shadow duration-300">
                {/* Enhanced inner shading for more realism */}
                <div className="absolute inset-0 bg-gradient-to-b from-white/30 to-transparent"></div>
                
                {/* Enhanced initials with subtle animation */}
                <span className="text-sm font-medium relative z-10 group-hover:scale-110 transition-transform duration-300">
                  {user?.fullName?.substring(0, 2).toUpperCase() || "U"}
                </span>
                
                {/* Enhanced hover feedback */}
                <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-10 transition-all duration-300"></div>
              </div>
              
              {/* User info with enhanced typography and spacing */}
              <div className="ml-3 overflow-hidden flex-1 relative z-10">
                <p className="text-sm font-semibold text-slate-800 group-hover:text-slate-900 transition-colors duration-200 truncate">{user?.fullName || "User"}</p>
                <div className="flex items-center justify-between">
                  {user?.isAdmin ? (
                    <span className="text-[10px] px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-full font-medium border border-indigo-100/50 group-hover:bg-indigo-100/50 transition-colors duration-200">
                      Administrator
                    </span>
                  ) : (
                    <span className="text-xs text-slate-500 group-hover:text-slate-600 transition-colors duration-200">Teacher</span>
                  )}
                  
                  {/* Enhanced logout button with better hover transition */}
                  <button 
                    onClick={() => logout()} 
                    className="opacity-0 group-hover:opacity-100 transition-all duration-200 p-1.5 rounded-full hover:bg-indigo-100/50 hover:text-indigo-600"
                    aria-label="Sign out"
                    title="Sign out"
                  >
                    <LogOut className="h-3.5 w-3.5 transform group-hover:rotate-12 transition-transform duration-300" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Version Info */}
          <div className="px-5 py-2 text-[10px] text-slate-400 text-center bg-slate-50/50">
            <span className="opacity-70">WeeklyPlanner</span> 
            <span className="font-medium opacity-90">Pro v1.0</span>
          </div>
        </div>
      </aside>
    </>
  );
}
