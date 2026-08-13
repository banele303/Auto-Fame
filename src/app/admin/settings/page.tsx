"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { FormSkeleton } from "@/components/ui/skeletons";
import { 
  Settings, 
  User, 
  Shield, 
  Bell, 
  Database, 
  Mail, 
  Phone, 
  Save,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Users,
  Car,
  BarChart3
} from "lucide-react";
import { useGetAuthUserQuery, useUpdateAdminSettingsMutation } from "@/state/api";
import AdminNavigation from "@/components/AdminNavigation";
import { toast } from "sonner";

interface AdminSettings {
  name: string;
  email: string;
  phoneNumber: string;
  notificationSettings: {
    emailNotifications: boolean;
    newCustomerAlerts: boolean;
    reviewAlerts: boolean;
    salesReports: boolean;
    systemUpdates: boolean;
  };
  systemSettings: {
    autoApproveReviews: boolean;
    allowGuestInquiries: boolean;
    maintenanceMode: boolean;
    backupFrequency: string;
  };
}

export default function AdminSettingsPage() {
  const { data: authUser, isLoading: authLoading } = useGetAuthUserQuery();
  const [updateAdminSettings, { isLoading: isUpdating }] = useUpdateAdminSettingsMutation();

  const [settings, setSettings] = useState<AdminSettings>({
    name: "",
    email: "",
    phoneNumber: "",
    notificationSettings: {
      emailNotifications: true,
      newCustomerAlerts: true,
      reviewAlerts: true,
      salesReports: false,
      systemUpdates: true,
    },
    systemSettings: {
      autoApproveReviews: false,
      allowGuestInquiries: true,
      maintenanceMode: false,
      backupFrequency: "daily",
    },
  });

  const [hasChanges, setHasChanges] = useState(false);

  
  useEffect(() => {
    if (authUser && authUser.userRole === "admin") {
      setSettings(prev => ({
        ...prev,
        name: authUser.userInfo.name || "",
        email: authUser.userInfo.email || "",
        phoneNumber: (authUser.userInfo as any).phoneNumber || "",
      }));
    }
  }, [authUser]);

  const handleProfileChange = (field: string, value: string) => {
    setSettings(prev => ({
      ...prev,
      [field]: value,
    }));
    setHasChanges(true);
  };

  const handleNotificationChange = (field: string, value: boolean) => {
    setSettings(prev => ({
      ...prev,
      notificationSettings: {
        ...prev.notificationSettings,
        [field]: value,
      },
    }));
    setHasChanges(true);
  };

  const handleSystemChange = (field: string, value: boolean | string) => {
    setSettings(prev => ({
      ...prev,
      systemSettings: {
        ...prev.systemSettings,
        [field]: value,
      },
    }));
    setHasChanges(true);
  };

  const handleSaveSettings = async () => {
    try {
      await updateAdminSettings({
        name: settings.name,
        email: settings.email,
        phoneNumber: settings.phoneNumber,
      }).unwrap();
      
      toast.success("Settings updated successfully!");
      setHasChanges(false);
    } catch (error) {
      toast.error("Failed to update settings");
    }
  };

  const handleResetSettings = () => {
    if (authUser && authUser.userRole === "admin") {
      setSettings(prev => ({
        ...prev,
        name: authUser.userInfo.name || "",
        email: authUser.userInfo.email || "",
        phoneNumber: (authUser.userInfo as any).phoneNumber || "",
      }));
      setHasChanges(false);
    }
  };

  if (authLoading) {
    return (
      <div className="p-8">
        <AdminNavigation />
        <div className="space-y-6">
          <FormSkeleton />
        </div>
      </div>
    );
  }

  if (!authUser || authUser.userRole !== "admin") {
    return (
      <div className="p-8">
       
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
            <p className="text-gray-600">You must be an admin to access this page.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
    
    
      
      
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Settings</h1>
            <p className="text-gray-600">Manage your profile and system settings</p>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="text-green-600 border-green-600">
              <CheckCircle className="w-4 h-4 mr-1" />
              Admin
            </Badge>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="w-5 h-5 mr-2" />
                Profile Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={settings.name}
                    onChange={(e) => handleProfileChange("name", e.target.value)}
                    placeholder="Enter your full name"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={settings.email}
                    onChange={(e) => handleProfileChange("email", e.target.value)}
                    placeholder="Enter your email"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  value={settings.phoneNumber}
                  onChange={(e) => handleProfileChange("phoneNumber", e.target.value)}
                  placeholder="Enter your phone number"
                />
              </div>
            </CardContent>
          </Card>

          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Bell className="w-5 h-5 mr-2" />
                Notification Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Email Notifications</Label>
                  <p className="text-sm text-gray-600">Receive email notifications for important updates</p>
                </div>
                <Switch
                  checked={settings.notificationSettings.emailNotifications}
                  onCheckedChange={(checked) => handleNotificationChange("emailNotifications", checked)}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>New Customer Alerts</Label>
                  <p className="text-sm text-gray-600">Get notified when new customers register</p>
                </div>
                <Switch
                  checked={settings.notificationSettings.newCustomerAlerts}
                  onCheckedChange={(checked) => handleNotificationChange("newCustomerAlerts", checked)}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Review Alerts</Label>
                  <p className="text-sm text-gray-600">Get notified about new customer reviews</p>
                </div>
                <Switch
                  checked={settings.notificationSettings.reviewAlerts}
                  onCheckedChange={(checked) => handleNotificationChange("reviewAlerts", checked)}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Sales Reports</Label>
                  <p className="text-sm text-gray-600">Receive weekly sales reports</p>
                </div>
                <Switch
                  checked={settings.notificationSettings.salesReports}
                  onCheckedChange={(checked) => handleNotificationChange("salesReports", checked)}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>System Updates</Label>
                  <p className="text-sm text-gray-600">Get notified about system updates and maintenance</p>
                </div>
                <Switch
                  checked={settings.notificationSettings.systemUpdates}
                  onCheckedChange={(checked) => handleNotificationChange("systemUpdates", checked)}
                />
              </div>
            </CardContent>
          </Card>

          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Settings className="w-5 h-5 mr-2" />
                System Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Auto-approve Reviews</Label>
                  <p className="text-sm text-gray-600">Automatically approve customer reviews</p>
                </div>
                <Switch
                  checked={settings.systemSettings.autoApproveReviews}
                  onCheckedChange={(checked) => handleSystemChange("autoApproveReviews", checked)}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Allow Guest Inquiries</Label>
                  <p className="text-sm text-gray-600">Allow non-registered users to make inquiries</p>
                </div>
                <Switch
                  checked={settings.systemSettings.allowGuestInquiries}
                  onCheckedChange={(checked) => handleSystemChange("allowGuestInquiries", checked)}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Maintenance Mode</Label>
                  <p className="text-sm text-gray-600">Enable maintenance mode for system updates</p>
                </div>
                <Switch
                  checked={settings.systemSettings.maintenanceMode}
                  onCheckedChange={(checked) => handleSystemChange("maintenanceMode", checked)}
                />
              </div>
            </CardContent>
          </Card>

          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {hasChanges && (
                    <div className="flex items-center text-orange-600">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      <span className="text-sm">Unsaved changes</span>
                    </div>
                  )}
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    onClick={handleResetSettings}
                    disabled={!hasChanges}
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Reset
                  </Button>
                  <Button
                    onClick={handleSaveSettings}
                    disabled={!hasChanges || isUpdating}
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {isUpdating ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="w-5 h-5 mr-2" />
                Account Info
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-gray-600">Role</Label>
                <p className="font-medium">Administrator</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-600">Account ID</Label>
                <p className="font-mono text-sm text-gray-800">{authUser.userInfo.id}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-600">Status</Label>
                <Badge variant="outline" className="text-green-600 border-green-600">
                  Active
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Database className="w-5 h-5 mr-2" />
                System Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Database</span>
                <Badge variant="outline" className="text-green-600 border-green-600">
                  Online
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">API Status</span>
                <Badge variant="outline" className="text-green-600 border-green-600">
                  Healthy
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Last Backup</span>
                <span className="text-sm text-gray-800">Today, 2:00 AM</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="w-5 h-5 mr-2" />
                Quick Stats
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Users className="w-4 h-4 mr-2 text-blue-600" />
                  <span className="text-sm text-gray-600">Active Users</span>
                </div>
                <span className="font-medium">1,234</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Car className="w-4 h-4 mr-2 text-green-600" />
                  <span className="text-sm text-gray-600">Total Cars</span>
                </div>
                <span className="font-medium">456</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Mail className="w-4 h-4 mr-2 text-purple-600" />
                  <span className="text-sm text-gray-600">Inquiries</span>
                </div>
                <span className="font-medium">78</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
