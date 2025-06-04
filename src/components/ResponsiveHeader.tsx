
import React from 'react';
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { navItems } from "@/nav-items";
import { useLocation, Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import AuthHeader from "./AuthHeader";

const ResponsiveHeader = () => {
  const location = useLocation();
  
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center justify-between px-4">
        <div className="flex items-center space-x-4">
          <Link to="/" className="font-bold text-xl">
            Riksdag Explorer
          </Link>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
            {navItems.map(({ to, title, icon }) => (
              <Link
                key={to}
                to={to}
                className={cn(
                  "transition-colors hover:text-foreground/80 flex items-center space-x-2",
                  location.pathname === to ? "text-foreground" : "text-foreground/60"
                )}
              >
                {icon}
                <span>{title}</span>
              </Link>
            ))}
          </nav>
        </div>

        {/* Auth Header and Mobile Menu */}
        <div className="flex items-center space-x-4">
          <AuthHeader />
          
          {/* Mobile Navigation */}
          <Sheet>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="outline" size="sm">
                <Menu className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <nav className="flex flex-col space-y-4 mt-8">
                {navItems.map(({ to, title, icon }) => (
                  <Link
                    key={to}
                    to={to}
                    className={cn(
                      "flex items-center space-x-3 text-sm font-medium transition-colors hover:text-foreground/80 p-2 rounded-md",
                      location.pathname === to ? "text-foreground bg-muted" : "text-foreground/60"
                    )}
                  >
                    {icon}
                    <span>{title}</span>
                  </Link>
                ))}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
};

export default ResponsiveHeader;
