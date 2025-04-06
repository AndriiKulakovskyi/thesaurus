import React, { useState } from "react";
import { Separator } from "./ui/separator";
import { Link } from "react-router-dom";
import {
  Database,
  User as UserIcon,
  Settings,
  HelpCircle,
  LogIn,
} from "lucide-react";
import { Button } from "./ui/button";
import { useAuth } from "../contexts/AuthContext";
import UserMenu from "./auth/UserMenu";
import LoginModal from "./auth/LoginModal";

interface HeaderProps {
  title?: string;
  subtitle?: string;
}

const Header = ({
  title = "Clinical Data Extraction Tool",
  subtitle = "For Psychiatric Research",
}: HeaderProps) => {
  const { user } = useAuth();
  const [loginModalOpen, setLoginModalOpen] = useState(false);

  return (
    <header className="w-full bg-white border-b border-gray-200 shadow-sm py-2 px-4 sm:px-6 sticky top-0 z-10">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
              {title}
            </h1>
            <div className="flex items-center mt-1">
              <p className="text-sm text-gray-500">{subtitle}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="text-gray-600 hover:text-gray-900"
            >
              <HelpCircle className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-gray-600 hover:text-gray-900"
            >
              <Settings className="h-4 w-4" />
            </Button>

            {user ? (
              <UserMenu />
            ) : (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={() => setLoginModalOpen(true)}
                >
                  <LogIn className="h-4 w-4" />
                  <span className="hidden sm:inline">Sign In</span>
                </Button>
                <LoginModal
                  open={loginModalOpen}
                  onOpenChange={setLoginModalOpen}
                />
              </>
            )}
          </div>
        </div>
      </div>
      <Separator className="mt-2" />
    </header>
  );
};

export default Header;
