"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { formatCurrency } from "@/lib/utils/formatting";
import { formatDateTime } from "@/lib/utils/date";
import { UserPlus, Settings, Shield, History } from "lucide-react";

export default function SettingsPage() {
  const { data: session } = useSession();
  const [createUserOpen, setCreateUserOpen] = useState(false);
  const [newUserName, setNewUserName] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [newUserRole, setNewUserRole] = useState<"admin" | "volunteer">("volunteer");

  const { data: event } = trpc.dashboard.getActiveEvent.useQuery();
  const { data: users, isLoading: usersLoading } = trpc.admin.getUsers.useQuery();
  const { data: auditLogs } = trpc.admin.getAuditLog.useQuery({ limit: 20 });

  const utils = trpc.useUtils();

  const createUser = trpc.admin.createUser.useMutation({
    onSuccess: () => {
      utils.admin.getUsers.invalidate();
      setCreateUserOpen(false);
      setNewUserName("");
      setNewUserEmail("");
      setNewUserPassword("");
    },
  });

  const updateEvent = trpc.dashboard.updateEvent.useMutation({
    onSuccess: () => {
      utils.dashboard.getActiveEvent.invalidate();
    },
  });

  const deactivateUser = trpc.admin.deactivateUser.useMutation({
    onSuccess: () => utils.admin.getUsers.invalidate(),
  });

  const activateUser = trpc.admin.activateUser.useMutation({
    onSuccess: () => utils.admin.getUsers.invalidate(),
  });

  // Event settings state
  const [eventName, setEventName] = useState("");
  const [goalAmount, setGoalAmount] = useState("");
  const [ticketSales, setTicketSales] = useState("");
  const [sponsorships, setSponsorships] = useState("");
  const [prePledges, setPrePledges] = useState("");

  // Populate on first load
  if (event && !eventName) {
    setEventName(event.name);
    setGoalAmount(event.goalAmount || "0");
    setTicketSales(event.initialTicketSales || "0");
    setSponsorships(event.initialSponsorships || "0");
    setPrePledges(event.initialPrePledges || "0");
  }

  if (session?.user?.role !== "admin") {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Shield className="h-12 w-12 text-muted-foreground mb-4" />
        <h2 className="text-lg font-semibold">Access Denied</h2>
        <p className="text-muted-foreground">Admin access required.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Manage event settings, users, and system configuration
        </p>
      </div>

      <Tabs defaultValue="event" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="event" className="gap-2">
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">Event</span>
          </TabsTrigger>
          <TabsTrigger value="users" className="gap-2">
            <UserPlus className="h-4 w-4" />
            <span className="hidden sm:inline">Users</span>
          </TabsTrigger>
          <TabsTrigger value="audit" className="gap-2">
            <History className="h-4 w-4" />
            <span className="hidden sm:inline">Audit Log</span>
          </TabsTrigger>
        </TabsList>

        {/* Event Settings Tab */}
        <TabsContent value="event">
          <Card>
            <CardHeader>
              <CardTitle>Event Configuration</CardTitle>
              <CardDescription>
                Update event details and initial financial data
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Event Name</Label>
                <Input
                  value={eventName}
                  onChange={(e) => setEventName(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Goal Amount ($)</Label>
                  <Input
                    type="number"
                    value={goalAmount}
                    onChange={(e) => setGoalAmount(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Initial Ticket Sales ($)</Label>
                  <Input
                    type="number"
                    value={ticketSales}
                    onChange={(e) => setTicketSales(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Initial Sponsorships ($)</Label>
                  <Input
                    type="number"
                    value={sponsorships}
                    onChange={(e) => setSponsorships(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Initial Pre-Pledges ($)</Label>
                  <Input
                    type="number"
                    value={prePledges}
                    onChange={(e) => setPrePledges(e.target.value)}
                  />
                </div>
              </div>
              <Button
                onClick={() => {
                  if (!event) return;
                  updateEvent.mutate({
                    id: event.id,
                    name: eventName,
                    goalAmount: parseFloat(goalAmount),
                    initialTicketSales: parseFloat(ticketSales),
                    initialSponsorships: parseFloat(sponsorships),
                    initialPrePledges: parseFloat(prePledges),
                  });
                }}
                disabled={updateEvent.isPending}
              >
                {updateEvent.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>User Management</CardTitle>
                <CardDescription>
                  Manage users and their roles
                </CardDescription>
              </div>
              <Button
                size="sm"
                className="gap-2"
                onClick={() => setCreateUserOpen(true)}
              >
                <UserPlus className="h-4 w-4" />
                Add User
              </Button>
            </CardHeader>
            <CardContent>
              {usersLoading ? (
                <LoadingSpinner size="sm" />
              ) : (
                <div className="space-y-2">
                  {users?.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between rounded-lg border p-3"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">
                            {user.name}
                          </span>
                          <Badge
                            variant={
                              user.role === "admin" ? "default" : "secondary"
                            }
                          >
                            {user.role}
                          </Badge>
                          {!user.isActive && (
                            <Badge variant="destructive">Inactive</Badge>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {user.email}
                        </div>
                      </div>
                      {user.id !== session?.user?.id && (
                        <Button
                          size="sm"
                          variant={user.isActive ? "destructive" : "default"}
                          onClick={() =>
                            user.isActive
                              ? deactivateUser.mutate({ userId: user.id })
                              : activateUser.mutate({ userId: user.id })
                          }
                        >
                          {user.isActive ? "Deactivate" : "Activate"}
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Audit Log Tab */}
        <TabsContent value="audit">
          <Card>
            <CardHeader>
              <CardTitle>Audit Log</CardTitle>
              <CardDescription>
                Recent system activity and data modifications
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {auditLogs?.map((log) => (
                  <div
                    key={log.id}
                    className="flex items-start justify-between rounded-lg border p-3 text-sm"
                  >
                    <div>
                      <span className="font-medium">{log.action}</span>
                      <div className="text-xs text-muted-foreground">
                        {log.user?.name || "System"} | {log.entityType}
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatDateTime(log.createdAt)}
                    </span>
                  </div>
                ))}
                {(!auditLogs || auditLogs.length === 0) && (
                  <p className="text-center text-muted-foreground py-4">
                    No audit log entries yet
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create User Dialog */}
      <Dialog open={createUserOpen} onOpenChange={setCreateUserOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create User</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                value={newUserName}
                onChange={(e) => setNewUserName(e.target.value)}
                placeholder="Full name"
              />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={newUserEmail}
                onChange={(e) => setNewUserEmail(e.target.value)}
                placeholder="user@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label>Password</Label>
              <Input
                type="password"
                value={newUserPassword}
                onChange={(e) => setNewUserPassword(e.target.value)}
                placeholder="Minimum 8 characters"
              />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={newUserRole} onValueChange={(v) => setNewUserRole(v as "admin" | "volunteer")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="volunteer">Volunteer</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateUserOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() =>
                createUser.mutate({
                  name: newUserName,
                  email: newUserEmail,
                  password: newUserPassword,
                  role: newUserRole,
                })
              }
              disabled={
                createUser.isPending ||
                !newUserName ||
                !newUserEmail ||
                !newUserPassword
              }
            >
              {createUser.isPending ? "Creating..." : "Create User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
