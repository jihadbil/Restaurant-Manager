import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import {
  LayoutDashboard,
  Receipt,
  Package,
  Tags,
  CreditCard,
  Printer,
  Computer,
  Settings,
  LogOut,
  ChefHat
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface SidebarLayoutProps {
  children: ReactNode;
}

export function SidebarLayout({ children }: SidebarLayoutProps) {
  const { user, logout } = useAuth();
  const [location] = useLocation();

  const navItems = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard },
    { href: "/orders", label: "Orders", icon: Receipt },
    { href: "/products", label: "Products", icon: Package },
    { href: "/categories", label: "Categories", icon: Tags },
    { href: "/payment-methods", label: "Payment Methods", icon: CreditCard },
    { href: "/print-stations", label: "Print Stations", icon: Computer },
    { href: "/printers", label: "Printers", icon: Printer },
    { href: "/settings/category-stations", label: "Category Stations", icon: Settings },
  ];

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {/* Sidebar */}
      <aside className="w-64 bg-sidebar border-r border-sidebar-border flex flex-col hidden md:flex">
        <div className="h-16 flex items-center px-6 border-b border-sidebar-border bg-sidebar-primary/5">
          <ChefHat className="h-6 w-6 text-sidebar-primary mr-3" />
          <span className="font-bold text-lg text-sidebar-foreground tracking-tight">Oven&amp;Scale</span>
        </div>
        
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
            return (
              <Link key={item.href} href={item.href}>
                <div
                  className={`flex items-center px-3 py-2.5 rounded-md transition-colors cursor-pointer ${
                    isActive 
                      ? "bg-sidebar-primary/10 text-sidebar-primary font-medium" 
                      : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  }`}
                >
                  <item.icon className={`h-5 w-5 mr-3 ${isActive ? "text-sidebar-primary" : ""}`} />
                  {item.label}
                </div>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-sidebar-border">
          <div className="mb-4 px-3">
            <p className="text-sm font-medium text-sidebar-foreground">{user?.userName}</p>
            <p className="text-xs text-sidebar-foreground/60 truncate">{user?.email}</p>
          </div>
          <Button 
            variant="outline" 
            className="w-full justify-start text-muted-foreground hover:text-foreground bg-transparent border-sidebar-border hover:bg-sidebar-accent"
            onClick={logout}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col max-h-screen overflow-hidden">
        {/* Mobile Header */}
        <header className="h-16 md:hidden flex items-center justify-between px-4 border-b bg-card">
          <div className="flex items-center">
            <ChefHat className="h-6 w-6 text-primary mr-2" />
            <span className="font-bold text-lg">Oven&amp;Scale</span>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
