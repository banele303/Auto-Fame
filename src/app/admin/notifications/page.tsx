"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { TableSkeleton } from "@/components/ui/skeletons";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  Bell, 
  Search, 
  Filter, 
  Eye, 
  Trash2, 
  CheckCircle, 
  AlertCircle, 
  Info, 
  Users, 
  Car, 
  MessageSquare, 
  Calendar,
  Star,
  DollarSign,
  RefreshCw
} from "lucide-react";
import { useGetAuthUserQuery } from "@/state/api";
import AdminNavigation from "@/components/AdminNavigation";
import { toast } from "sonner";

interface Notification {
  id: number;
  type: "info" | "warning" | "success" | "error";
  category: "system" | "customers" | "sales" | "reviews" | "inquiries" | "maintenance";
  title: string;
  message: string;
  isRead: boolean;
  createdAt: Date | string;
  actionUrl?: string;
  metadata?: {
    userId?: string;
    carId?: number;
    amount?: number;
    [key: string]: any;
  };
}


const mockNotifications: Notification[] = [
  {
    id: 1,
    type: "info",
    category: "customers",
    title: "New Customer Registration",
    message: "John Doe has registered as a new customer",
    isRead: false,
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), 
    actionUrl: "/admin/customers",
    metadata: { userId: "user123" }
  },
  {
    id: 2,
    type: "success",
    category: "sales",
    title: "Sale Completed",
    message: "Vehicle sale completed for $45,000 - 2023 BMW X5",
    isRead: true,
    createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000), 
    actionUrl: "/admin/sales",
    metadata: { carId: 123, amount: 45000 }
  },
  {
    id: 3,
    type: "warning",
    category: "reviews",
    title: "Low Rating Alert",
    message: "New 2-star review received for 2022 Honda Civic",
    isRead: false,
    createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000), 
    actionUrl: "/admin/reviews",
    metadata: { carId: 456, rating: 2 }
  },
  {
    id: 4,
    type: "info",
    category: "inquiries",
    title: "New Inquiry",
    message: "Customer inquiry about financing options for Mercedes C-Class",
    isRead: true,
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), 
    actionUrl: "/admin/inquiries",
    metadata: { carId: 789 }
  },
  {
    id: 5,
    type: "error",
    category: "system",
    title: "System Alert",
    message: "Database backup failed - manual intervention required",
    isRead: false,
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), 
    actionUrl: "/admin/settings"
  },
  {
    id: 6,
    type: "success",
    category: "maintenance",
    title: "Maintenance Complete",
    message: "Scheduled system maintenance completed successfully",
    isRead: true,
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), 
  }
];

export default function AdminNotificationsPage() {
  const { data: authUser, isLoading: authLoading } = useGetAuthUserQuery();
  
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);

  
  const filteredNotifications = useMemo(() => {
    const filtered = notifications.filter((notification) => {
      const matchesSearch = 
        notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        notification.message.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCategory = categoryFilter === "all" || notification.category === categoryFilter;
      const matchesType = typeFilter === "all" || notification.type === typeFilter;
      const matchesStatus = statusFilter === "all" || 
        (statusFilter === "read" && notification.isRead) ||
        (statusFilter === "unread" && !notification.isRead);

      return matchesSearch && matchesCategory && matchesType && matchesStatus;
    });

    
    filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return filtered;
  }, [notifications, searchTerm, categoryFilter, typeFilter, statusFilter]);

  
  const stats = useMemo(() => {
    const total = notifications.length;
    const unread = notifications.filter(n => !n.isRead).length;
    const byType = {
      info: notifications.filter(n => n.type === "info").length,
      warning: notifications.filter(n => n.type === "warning").length,
      success: notifications.filter(n => n.type === "success").length,
      error: notifications.filter(n => n.type === "error").length,
    };

    return { total, unread, byType };
  }, [notifications]);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "success": return <CheckCircle className="w-4 h-4" />;
      case "warning": return <AlertCircle className="w-4 h-4" />;
      case "error": return <AlertCircle className="w-4 h-4" />;
      default: return <Info className="w-4 h-4" />;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "customers": return <Users className="w-4 h-4" />;
      case "sales": return <DollarSign className="w-4 h-4" />;
      case "reviews": return <Star className="w-4 h-4" />;
      case "inquiries": return <MessageSquare className="w-4 h-4" />;
      case "maintenance": return <RefreshCw className="w-4 h-4" />;
      default: return <Bell className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "success": return "bg-green-100 text-green-800 border-green-200";
      case "warning": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "error": return "bg-red-100 text-red-800 border-red-200";
      default: return "bg-blue-100 text-blue-800 border-blue-200";
    }
  };

  const formatDate = (dateString: Date | string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  };

  const markAsRead = (notificationId: number) => {
    setNotifications(prev => 
      prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n)
    );
    toast.success("Marked as read");
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    toast.success("All notifications marked as read");
  };

  const deleteNotification = (notificationId: number) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
    toast.success("Notification deleted");
  };

  if (authLoading) {
    return (
      <div className="p-8">
        <AdminNavigation />
        <TableSkeleton rows={5} />
      </div>
    );
  }

  if (!authUser || authUser.userRole !== "admin") {
    return (
      <div className="p-8">
        <AdminNavigation />
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
    <div className="p-8 max-w-7xl mx-auto">
      <AdminNavigation />
      
      
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Notifications</h1>
            <p className="text-gray-600">Stay updated with system alerts and important events</p>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              onClick={markAllAsRead}
              variant="outline"
              size="sm"
              disabled={stats.unread === 0}
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Mark All Read
            </Button>
          </div>
        </div>
      </div>

      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <Bell className="w-8 h-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Unread</p>
                <p className="text-2xl font-bold text-orange-600">{stats.unread}</p>
              </div>
              <AlertCircle className="w-8 h-8 text-orange-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Errors</p>
                <p className="text-2xl font-bold text-red-600">{stats.byType.error}</p>
              </div>
              <AlertCircle className="w-8 h-8 text-red-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Success</p>
                <p className="text-2xl font-bold text-green-600">{stats.byType.success}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search notifications..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[140px]">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="system">System</SelectItem>
                  <SelectItem value="customers">Customers</SelectItem>
                  <SelectItem value="sales">Sales</SelectItem>
                  <SelectItem value="reviews">Reviews</SelectItem>
                  <SelectItem value="inquiries">Inquiries</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                </SelectContent>
              </Select>

              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="info">Info</SelectItem>
                  <SelectItem value="success">Success</SelectItem>
                  <SelectItem value="warning">Warning</SelectItem>
                  <SelectItem value="error">Error</SelectItem>
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="unread">Unread</SelectItem>
                  <SelectItem value="read">Read</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      
      <div className="space-y-4">
        {filteredNotifications.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No notifications found</p>
              <p className="text-gray-400">Try adjusting your filters</p>
            </CardContent>
          </Card>
        ) : (
          filteredNotifications.map((notification) => (
            <Card 
              key={notification.id} 
              className={`hover:shadow-lg transition-shadow ${
                !notification.isRead ? "bg-blue-50/50 border-blue-200" : ""
              }`}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    <div className="flex items-center space-x-2">
                      {getCategoryIcon(notification.category)}
                      {getTypeIcon(notification.type)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className={`font-semibold ${!notification.isRead ? "text-gray-900" : "text-gray-700"}`}>
                          {notification.title}
                        </h3>
                        <Badge className={getTypeColor(notification.type)}>
                          {notification.type}
                        </Badge>
                        {!notification.isRead && (
                          <Badge variant="outline" className="text-blue-600 border-blue-600">
                            New
                          </Badge>
                        )}
                      </div>
                      
                      <p className="text-gray-600 mb-2">{notification.message}</p>
                      
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span className="flex items-center">
                          <Calendar className="w-4 h-4 mr-1" />
                          {formatDate(notification.createdAt)}
                        </span>
                        <span className="capitalize">{notification.category}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 ml-4">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedNotification(notification)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>Notification Details</DialogTitle>
                        </DialogHeader>
                        {selectedNotification && (
                          <div className="space-y-4">
                            <div className="flex items-center space-x-2">
                              <Badge className={getTypeColor(selectedNotification.type)}>
                                {selectedNotification.type}
                              </Badge>
                              <span className="text-sm text-gray-500 capitalize">
                                {selectedNotification.category}
                              </span>
                            </div>
                            
                            <div>
                              <h4 className="font-semibold text-lg mb-2">{selectedNotification.title}</h4>
                              <p className="text-gray-700">{selectedNotification.message}</p>
                            </div>

                            <div className="pt-4 border-t">
                              <p className="text-sm text-gray-500">
                                Created: {new Date(selectedNotification.createdAt).toLocaleString()}
                              </p>
                              <p className="text-sm text-gray-500">
                                Status: {selectedNotification.isRead ? "Read" : "Unread"}
                              </p>
                            </div>

                            {selectedNotification.metadata && (
                              <div className="pt-2">
                                <h5 className="font-medium mb-2">Additional Information:</h5>
                                <pre className="text-sm bg-gray-100 p-3 rounded">
                                  {JSON.stringify(selectedNotification.metadata, null, 2)}
                                </pre>
                              </div>
                            )}
                          </div>
                        )}
                      </DialogContent>
                    </Dialog>

                    {!notification.isRead && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => markAsRead(notification.id)}
                        title="Mark as read"
                      >
                        <CheckCircle className="w-4 h-4" />
                      </Button>
                    )}

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteNotification(notification.id)}
                      className="text-red-600 hover:bg-red-50"
                      title="Delete notification"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      
      {filteredNotifications.length > 0 && (
        <div className="mt-8 text-center">
          <p className="text-gray-600">
            Showing {filteredNotifications.length} of {notifications.length} notifications
          </p>
        </div>
      )}
    </div>
  );
}
