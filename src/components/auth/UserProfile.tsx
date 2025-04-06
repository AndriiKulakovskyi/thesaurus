import React from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Button } from "../ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Badge } from "../ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import {
  ArrowLeft,
  Shield,
  Database,
  LayoutDashboard,
  Settings,
  Key,
  Bell,
  User as UserIcon,
} from "lucide-react";
import BreadcrumbNav from "../BreadcrumbNav";
import AppLayout from "../AppLayout";

const UserProfile: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (!user) {
    // Redirect to home if not logged in
    navigate("/");
    return null;
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-red-100 text-red-800 border-red-200";
      case "manager":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "researcher":
        return "bg-blue-100 text-blue-800 border-blue-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "admin":
        return <Shield className="h-5 w-5" />;
      case "manager":
        return <LayoutDashboard className="h-5 w-5" />;
      case "researcher":
        return <Database className="h-5 w-5" />;
      default:
        return <UserIcon className="h-5 w-5" />;
    }
  };

  const getRoleDescription = (role: string) => {
    switch (role) {
      case "admin":
        return "Full access to all system features, user management, and configuration settings.";
      case "manager":
        return "Access to project management, data approval, and team coordination features.";
      case "researcher":
        return "Access to data exploration, extraction, and analysis tools.";
      default:
        return "Basic access to the system.";
    }
  };

  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto p-4 sm:p-6">
        <BreadcrumbNav
          items={[{ label: "Home", href: "/" }, { label: "Profile" }]}
        />

        <div className="flex flex-col md:flex-row gap-6 mt-4">
          <div className="md:w-1/3">
            <Card>
              <CardHeader className="pb-4">
                <CardTitle>User Profile</CardTitle>
                <CardDescription>Manage your account settings</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center text-center pb-6">
                <Avatar className="h-24 w-24 mb-4">
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback className="text-2xl">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <h2 className="text-xl font-bold">{user.name}</h2>
                <p className="text-gray-500 mb-2">{user.email}</p>
                <Badge
                  variant="outline"
                  className={`${getRoleBadgeColor(user.role)} flex items-center gap-1 px-3 py-1`}
                >
                  {getRoleIcon(user.role)}
                  <span className="capitalize">{user.role}</span>
                </Badge>

                <div className="mt-6 text-sm text-gray-600 bg-gray-50 p-4 rounded-lg">
                  <p className="font-medium mb-1">Role Permissions:</p>
                  <p>{getRoleDescription(user.role)}</p>
                </div>
              </CardContent>
              <CardFooter className="flex justify-center border-t pt-6">
                <Button variant="outline" className="w-full" onClick={logout}>
                  Sign Out
                </Button>
              </CardFooter>
            </Card>
          </div>

          <div className="md:w-2/3">
            <Tabs defaultValue="account" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="account">Account</TabsTrigger>
                <TabsTrigger value="security">Security</TabsTrigger>
                <TabsTrigger value="preferences">Preferences</TabsTrigger>
              </TabsList>

              <TabsContent value="account" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <UserIcon className="h-5 w-5" />
                      Account Information
                    </CardTitle>
                    <CardDescription>
                      Manage your personal information and account details
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-gray-500">
                            Full Name
                          </p>
                          <p>{user.name}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-gray-500">
                            Email Address
                          </p>
                          <p>{user.email}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-gray-500">
                            User ID
                          </p>
                          <p className="font-mono text-sm">{user.id}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-gray-500">
                            Account Type
                          </p>
                          <p className="capitalize">{user.role}</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="border-t pt-6">
                    <Button disabled className="mr-2">
                      Edit Profile
                    </Button>
                    <Button variant="outline" disabled>
                      Request Role Change
                    </Button>
                  </CardFooter>
                </Card>
              </TabsContent>

              <TabsContent value="security" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Key className="h-5 w-5" />
                      Security Settings
                    </CardTitle>
                    <CardDescription>
                      Manage your password and security preferences
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="p-4 border rounded-lg bg-gray-50">
                        <h3 className="font-medium mb-2">Password</h3>
                        <p className="text-sm text-gray-600 mb-4">
                          Last changed: Never
                        </p>
                        <Button disabled>Change Password</Button>
                      </div>

                      <div className="p-4 border rounded-lg bg-gray-50">
                        <h3 className="font-medium mb-2">
                          Two-Factor Authentication
                        </h3>
                        <p className="text-sm text-gray-600 mb-4">
                          Status: Not Enabled
                        </p>
                        <Button disabled>Enable 2FA</Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="preferences" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Settings className="h-5 w-5" />
                      Preferences
                    </CardTitle>
                    <CardDescription>
                      Customize your application experience
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="p-4 border rounded-lg bg-gray-50">
                        <h3 className="font-medium mb-2">Notifications</h3>
                        <p className="text-sm text-gray-600 mb-4">
                          Manage how you receive notifications
                        </p>
                        <Button disabled className="flex items-center gap-2">
                          <Bell className="h-4 w-4" />
                          Notification Settings
                        </Button>
                      </div>

                      <div className="p-4 border rounded-lg bg-gray-50">
                        <h3 className="font-medium mb-2">Display Settings</h3>
                        <p className="text-sm text-gray-600 mb-4">
                          Customize the application appearance
                        </p>
                        <Button disabled>Display Settings</Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default UserProfile;
