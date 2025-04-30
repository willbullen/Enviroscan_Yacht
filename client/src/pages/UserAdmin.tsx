import React, { useState, useMemo } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { 
  AlertCircle, 
  Edit, 
  MoreHorizontal, 
  Plus, 
  RefreshCw, 
  Trash2, 
  UserPlus, 
  Users, 
  Search,
  Filter,
  Shield,
  Settings,
  Ship,
  FileText,
  UserCog,
  Info
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/hooks/use-auth';

// Type definitions
interface User {
  id: number;
  username: string;
  fullName: string;
  email: string | null;
  role: string;
  isActive: boolean;
  avatarUrl: string | null;
}

interface Vessel {
  id: number;
  name: string;
  vesselType: string;
  isActive: boolean;
}

interface UserVesselAssignment {
  id: number;
  userId: number;
  vesselId: number;
  role: string;
  assignmentDate: string;
  vessel?: Vessel;
  user?: User;
}

interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[];
}

// System default roles
const SYSTEM_ROLES: Role[] = [
  {
    id: 'admin',
    name: 'Administrator',
    description: 'Full system access with all permissions',
    permissions: ['all']
  },
  {
    id: 'manager',
    name: 'Fleet Manager',
    description: 'Can manage vessels, view reports, and coordinate operations',
    permissions: ['manage_vessels', 'view_reports', 'assign_tasks', 'manage_inventory']
  },
  {
    id: 'captain',
    name: 'Captain',
    description: 'Primarily responsible for vessel operations and safety',
    permissions: ['operate_vessel', 'manage_crew', 'report_incidents', 'manage_maintenance']
  },
  {
    id: 'engineer',
    name: 'Chief Engineer',
    description: 'Responsible for technical maintenance and equipment operation',
    permissions: ['manage_maintenance', 'view_equipment', 'update_inventory']
  },
  {
    id: 'crew',
    name: 'Crew Member',
    description: 'Basic access to assigned vessel information and tasks',
    permissions: ['view_vessel', 'complete_tasks', 'submit_reports']
  }
];

const UserAdmin: React.FC = () => {
  const { toast } = useToast();
  const { user: currentUser } = useAuth();
  
  // Tab state
  const [selectedTab, setSelectedTab] = useState('users');
  
  // User state
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [isEditingUser, setIsEditingUser] = useState(false);
  
  // Vessel assignment state
  const [isAddingAssignment, setIsAddingAssignment] = useState(false);
  const [selectedVesselId, setSelectedVesselId] = useState<number | null>(null);
  const [assignmentRole, setAssignmentRole] = useState('crew');
  
  // Role state
  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  
  // Filter state
  const [userFilter, setUserFilter] = useState('');
  const [userStatusFilter, setUserStatusFilter] = useState('all');
  const [userRoleFilter, setUserRoleFilter] = useState('all');

  // User form state
  const [userForm, setUserForm] = useState({
    username: '',
    fullName: '',
    email: '',
    password: '',
    role: 'crew',
    isActive: true
  });

  // Queries
  const { 
    data: users, 
    isLoading: usersLoading, 
    error: usersError,
    refetch: refetchUsers 
  } = useQuery<User[]>({
    queryKey: ['/api/users'],
    queryFn: async () => {
      return await apiRequest('GET', '/api/users');
    }
  });

  const { 
    data: vessels, 
    isLoading: vesselsLoading, 
    error: vesselsError,
    refetch: refetchVessels
  } = useQuery<Vessel[]>({
    queryKey: ['/api/vessels-management'],
    queryFn: async () => {
      return await apiRequest('GET', '/api/vessels-management');
    }
  });

  const {
    data: userVesselAssignments,
    isLoading: assignmentsLoading,
    error: assignmentsError,
    refetch: refetchAssignments
  } = useQuery<UserVesselAssignment[]>({
    queryKey: ['/api/user-vessel-assignments', selectedUser?.id],
    queryFn: async () => {
      if (!selectedUser) return [];
      return await apiRequest('GET', `/api/user-vessel-assignments?userId=${selectedUser.id}`);
    },
    enabled: !!selectedUser
  });

  // Mutations
  const createUserMutation = useMutation({
    mutationFn: async (userData: Omit<User, 'id' | 'avatarUrl'> & { password: string }) => {
      return await apiRequest('POST', '/api/register', userData);
    },
    onSuccess: () => {
      toast({
        title: 'User Created',
        description: 'The user has been created successfully.',
        variant: 'default',
      });
      setIsAddingUser(false);
      resetUserForm();
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error Creating User',
        description: error.message,
        variant: 'destructive',
      });
    }
  });

  const updateUserMutation = useMutation({
    mutationFn: async (data: { id: number, userData: Partial<User> & { password?: string } }) => {
      const { id, userData } = data;
      return await apiRequest('PATCH', `/api/users/${id}`, userData);
    },
    onSuccess: (data) => {
      toast({
        title: 'User Updated',
        description: 'The user has been updated successfully.',
        variant: 'default',
      });
      setIsEditingUser(false);
      setSelectedUser(data);
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error Updating User',
        description: error.message,
        variant: 'destructive',
      });
    }
  });

  const createAssignmentMutation = useMutation({
    mutationFn: async (assignment: { userId: number, vesselId: number, role: string }) => {
      return await apiRequest('POST', '/api/user-vessel-assignments', assignment);
    },
    onSuccess: () => {
      toast({
        title: 'Assignment Created',
        description: 'The vessel assignment has been created successfully.',
        variant: 'default',
      });
      setIsAddingAssignment(false);
      setSelectedVesselId(null);
      setAssignmentRole('crew');
      if (selectedUser) {
        queryClient.invalidateQueries({ queryKey: ['/api/user-vessel-assignments', selectedUser.id] });
      }
    },
    onError: (error: Error) => {
      toast({
        title: 'Error Creating Assignment',
        description: error.message,
        variant: 'destructive',
      });
    }
  });

  const deleteAssignmentMutation = useMutation({
    mutationFn: async (assignmentId: number) => {
      await apiRequest('DELETE', `/api/user-vessel-assignments/${assignmentId}`);
      return true;
    },
    onSuccess: () => {
      toast({
        title: 'Assignment Deleted',
        description: 'The vessel assignment has been removed successfully.',
        variant: 'default',
      });
      if (selectedUser) {
        queryClient.invalidateQueries({ queryKey: ['/api/user-vessel-assignments', selectedUser.id] });
      }
    },
    onError: (error: Error) => {
      toast({
        title: 'Error Deleting Assignment',
        description: error.message,
        variant: 'destructive',
      });
    }
  });

  // Helper functions
  const resetUserForm = () => {
    setUserForm({
      username: '',
      fullName: '',
      email: '',
      password: '',
      role: 'crew',
      isActive: true
    });
  };

  const handleSelectUser = (user: User) => {
    setSelectedUser(user);
    setSelectedTab('vessels');
  };

  const handleEditUser = (user: User) => {
    setUserForm({
      username: user.username,
      fullName: user.fullName,
      email: user.email || '',
      password: '', // Don't set password when editing
      role: user.role,
      isActive: user.isActive
    });
    setSelectedUser(user);
    setIsEditingUser(true);
  };

  const handleUserFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isEditingUser && selectedUser) {
      // Update existing user
      const userData: Partial<User> & { password?: string } = {
        fullName: userForm.fullName,
        email: userForm.email || null,
        role: userForm.role,
        isActive: userForm.isActive
      };
      
      // Only include password if it's provided
      if (userForm.password) {
        userData.password = userForm.password;
      }
      
      updateUserMutation.mutate({ 
        id: selectedUser.id, 
        userData 
      });
    } else {
      // Create new user
      createUserMutation.mutate({
        username: userForm.username,
        fullName: userForm.fullName,
        email: userForm.email || null,
        password: userForm.password,
        role: userForm.role,
        isActive: userForm.isActive
      });
    }
  };

  const handleCreateAssignment = () => {
    if (!selectedUser || !selectedVesselId) return;
    
    createAssignmentMutation.mutate({
      userId: selectedUser.id,
      vesselId: selectedVesselId,
      role: assignmentRole
    });
  };

  const handleDeleteAssignment = (assignmentId: number) => {
    if (window.confirm('Are you sure you want to remove this vessel assignment?')) {
      deleteAssignmentMutation.mutate(assignmentId);
    }
  };

  const getVesselName = (vesselId: number): string => {
    const vessel = vessels?.find(v => v.id === vesselId);
    return vessel ? vessel.name : `Vessel #${vesselId}`;
  };

  const getAssignedVesselIds = (): number[] => {
    if (!userVesselAssignments) return [];
    return userVesselAssignments.map(assignment => assignment.vesselId);
  };

  const getAvailableVessels = (): Vessel[] => {
    if (!vessels || !selectedUser) return [];
    const assignedIds = getAssignedVesselIds();
    return vessels.filter(vessel => !assignedIds.includes(vessel.id));
  };

  const getRoleDetails = (roleId: string): Role | undefined => {
    return SYSTEM_ROLES.find(role => role.id === roleId);
  };

  const handleSelectRole = (role: Role) => {
    setSelectedRole(role);
    setIsRoleDialogOpen(true);
  };

  // Filter users based on search criteria
  const filteredUsers = useMemo(() => {
    if (!users) return [];
    
    return users.filter(user => {
      // Filter by search term
      const searchMatch = 
        userFilter === '' || 
        user.fullName.toLowerCase().includes(userFilter.toLowerCase()) ||
        user.username.toLowerCase().includes(userFilter.toLowerCase()) ||
        (user.email && user.email.toLowerCase().includes(userFilter.toLowerCase()));
      
      // Filter by status
      const statusMatch = 
        userStatusFilter === 'all' || 
        (userStatusFilter === 'active' && user.isActive) ||
        (userStatusFilter === 'inactive' && !user.isActive);
      
      // Filter by role
      const roleMatch = 
        userRoleFilter === 'all' || 
        user.role === userRoleFilter;
      
      return searchMatch && statusMatch && roleMatch;
    });
  }, [users, userFilter, userStatusFilter, userRoleFilter]);

  return (
    <MainLayout title="User Administration">
      <div className="container mx-auto py-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">User Administration</h1>
          <div className="space-x-2">
            <Button 
              variant="outline" 
              onClick={() => setSelectedTab("roles")}
            >
              <Shield className="mr-2 h-4 w-4" />
              View Roles
            </Button>
            <Button onClick={() => {
              resetUserForm();
              setIsAddingUser(true);
            }}>
              <UserPlus className="mr-2 h-4 w-4" /> 
              Add User
            </Button>
          </div>
        </div>

        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-4">
          <TabsList className="grid w-full md:w-auto grid-cols-3">
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Users
            </TabsTrigger>
            <TabsTrigger 
              value="vessels" 
              className="flex items-center gap-2"
              disabled={!selectedUser}
            >
              <Ship className="h-4 w-4" />
              Vessel Assignments
            </TabsTrigger>
            <TabsTrigger value="roles" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Roles
            </TabsTrigger>
          </TabsList>
          
          {/* Users Tab */}
          <TabsContent value="users" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex justify-between items-center">
                  <span>User Management</span>
                  <Button variant="default" onClick={() => refetchUsers()}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                  </Button>
                </CardTitle>
                <CardDescription>
                  View, add, and edit users for the fleet management system.
                </CardDescription>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search users..."
                      value={userFilter}
                      onChange={(e) => setUserFilter(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                  
                  <div className="flex gap-2 items-center">
                    <Label htmlFor="role-filter" className="whitespace-nowrap text-xs">Role:</Label>
                    <Select
                      value={userRoleFilter}
                      onValueChange={setUserRoleFilter}
                    >
                      <SelectTrigger id="role-filter" className="h-9">
                        <SelectValue placeholder="Filter by role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Roles</SelectItem>
                        {SYSTEM_ROLES.map(role => (
                          <SelectItem key={role.id} value={role.id}>{role.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex gap-2 items-center">
                    <Label htmlFor="status-filter" className="whitespace-nowrap text-xs">Status:</Label>
                    <Select
                      value={userStatusFilter}
                      onValueChange={setUserStatusFilter}
                    >
                      <SelectTrigger id="status-filter" className="h-9">
                        <SelectValue placeholder="Filter by status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                {usersLoading ? (
                  <div className="flex justify-center items-center h-40">
                    <RefreshCw className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : usersError ? (
                  <div className="flex justify-center items-center h-40 text-destructive">
                    <AlertCircle className="h-6 w-6 mr-2" />
                    <p>Error loading users. Please try again.</p>
                  </div>
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Username</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Role</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredUsers && filteredUsers.length > 0 ? (
                          filteredUsers.map(user => (
                            <TableRow key={user.id}>
                              <TableCell className="font-medium">{user.fullName}</TableCell>
                              <TableCell>{user.username}</TableCell>
                              <TableCell>{user.email || '-'}</TableCell>
                              <TableCell>
                                <Badge variant={user.role === 'admin' ? 'default' : 'outline'}>
                                  {SYSTEM_ROLES.find(r => r.id === user.role)?.name || user.role}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Badge variant={user.isActive ? 'success' : 'destructive'}>
                                  {user.isActive ? 'Active' : 'Inactive'}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon">
                                      <MoreHorizontal className="h-4 w-4" />
                                      <span className="sr-only">Open menu</span>
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                    <DropdownMenuItem onClick={() => handleSelectUser(user)}>
                                      <Ship className="mr-2 h-4 w-4" />
                                      <span>Manage Vessels</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={() => handleEditUser(user)}>
                                      <Edit className="mr-2 h-4 w-4" />
                                      <span>Edit User</span>
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center py-4">
                              No users found matching your filters
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Vessel Assignments Tab */}
          <TabsContent value="vessels" className="space-y-4">
            {selectedUser ? (
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle>Vessel Assignments for {selectedUser.fullName}</CardTitle>
                      <CardDescription>
                        Manage vessel assignments for this user.
                      </CardDescription>
                    </div>
                    <Button disabled={getAvailableVessels().length === 0} onClick={() => setIsAddingAssignment(true)}>
                      <Plus className="mr-2 h-4 w-4" />
                      Assign Vessel
                    </Button>
                  </div>
                </CardHeader>
                
                <CardContent>
                  {assignmentsLoading ? (
                    <div className="flex justify-center items-center h-40">
                      <RefreshCw className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : assignmentsError ? (
                    <div className="flex justify-center items-center h-40 text-destructive">
                      <AlertCircle className="h-6 w-6 mr-2" />
                      <p>Error loading assignments. Please try again.</p>
                    </div>
                  ) : (
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Vessel Name</TableHead>
                            <TableHead>Vessel Type</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Assignment Date</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {userVesselAssignments && userVesselAssignments.length > 0 ? (
                            userVesselAssignments.map(assignment => {
                              const vesselName = getVesselName(assignment.vesselId);
                              const vessel = vessels?.find(v => v.id === assignment.vesselId);
                              return (
                                <TableRow key={assignment.id}>
                                  <TableCell className="font-medium">{vesselName}</TableCell>
                                  <TableCell>{vessel?.vesselType || '-'}</TableCell>
                                  <TableCell>
                                    <Badge variant="outline">{assignment.role}</Badge>
                                  </TableCell>
                                  <TableCell>
                                    {new Date(assignment.assignmentDate).toLocaleDateString()}
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <Button 
                                      variant="ghost" 
                                      size="icon"
                                      onClick={() => handleDeleteAssignment(assignment.id)}
                                    >
                                      <Trash2 className="h-4 w-4 text-destructive" />
                                      <span className="sr-only">Delete</span>
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              );
                            })
                          ) : (
                            <TableRow>
                              <TableCell colSpan={5} className="text-center py-4">
                                No vessel assignments found
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="py-10 text-center">
                  <p className="text-muted-foreground">
                    Please select a user to manage their vessel assignments.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Roles Tab */}
          <TabsContent value="roles" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Role Management</CardTitle>
                <CardDescription>
                  View system roles and their permissions. These roles determine what users can access.
                </CardDescription>
              </CardHeader>
              
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Role</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Permissions</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {SYSTEM_ROLES.map(role => (
                        <TableRow key={role.id}>
                          <TableCell className="font-medium">{role.name}</TableCell>
                          <TableCell>{role.description}</TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {role.permissions.includes('all') ? (
                                <Badge>All permissions</Badge>
                              ) : (
                                role.permissions.map(permission => (
                                  <Badge key={permission} variant="outline">
                                    {permission.replace('_', ' ')}
                                  </Badge>
                                ))
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleSelectRole(role)}
                            >
                              <Info className="h-4 w-4 mr-2" />
                              View Details
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Add User Dialog */}
      <Dialog open={isAddingUser} onOpenChange={setIsAddingUser}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
            <DialogDescription>
              Create a new user account in the system.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleUserFormSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="username">Username</Label>
                <Input 
                  id="username" 
                  value={userForm.username} 
                  onChange={(e) => setUserForm({ ...userForm, username: e.target.value })}
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input 
                  id="fullName" 
                  value={userForm.fullName} 
                  onChange={(e) => setUserForm({ ...userForm, fullName: e.target.value })}
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="email">Email (optional)</Label>
                <Input 
                  id="email" 
                  type="email" 
                  value={userForm.email} 
                  onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="password">Password</Label>
                <Input 
                  id="password" 
                  type="password" 
                  value={userForm.password} 
                  onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="role">Role</Label>
                <Select 
                  value={userForm.role} 
                  onValueChange={(value) => setUserForm({ ...userForm, role: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    {SYSTEM_ROLES.map(role => (
                      <SelectItem key={role.id} value={role.id}>
                        {role.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="isActive" 
                  checked={userForm.isActive} 
                  onCheckedChange={(checked) => setUserForm({ ...userForm, isActive: checked as boolean })}
                />
                <Label htmlFor="isActive">User is active</Label>
              </div>
            </div>
            
            <DialogFooter>
              <Button 
                type="submit" 
                disabled={createUserMutation.isPending}
              >
                {createUserMutation.isPending && (
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                )}
                Create User
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={isEditingUser} onOpenChange={setIsEditingUser}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update user account information.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleUserFormSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-username">Username</Label>
                <Input 
                  id="edit-username" 
                  value={userForm.username} 
                  disabled // Username cannot be changed
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="edit-fullName">Full Name</Label>
                <Input 
                  id="edit-fullName" 
                  value={userForm.fullName} 
                  onChange={(e) => setUserForm({ ...userForm, fullName: e.target.value })}
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="edit-email">Email (optional)</Label>
                <Input 
                  id="edit-email" 
                  type="email" 
                  value={userForm.email} 
                  onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="edit-password">Password (leave blank to keep current)</Label>
                <Input 
                  id="edit-password" 
                  type="password" 
                  value={userForm.password} 
                  onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="edit-role">Role</Label>
                <Select 
                  value={userForm.role} 
                  onValueChange={(value) => setUserForm({ ...userForm, role: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    {SYSTEM_ROLES.map(role => (
                      <SelectItem key={role.id} value={role.id}>
                        {role.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="edit-isActive" 
                  checked={userForm.isActive} 
                  onCheckedChange={(checked) => setUserForm({ ...userForm, isActive: checked as boolean })}
                />
                <Label htmlFor="edit-isActive">User is active</Label>
              </div>
            </div>
            
            <DialogFooter>
              <Button 
                type="submit" 
                disabled={updateUserMutation.isPending}
              >
                {updateUserMutation.isPending && (
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                )}
                Update User
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Vessel Assignment Dialog */}
      <Dialog open={isAddingAssignment} onOpenChange={setIsAddingAssignment}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Vessel</DialogTitle>
            <DialogDescription>
              Assign {selectedUser?.fullName} to a vessel.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="vessel">Vessel</Label>
              <Select 
                value={selectedVesselId?.toString() || ''} 
                onValueChange={(value) => setSelectedVesselId(parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select vessel" />
                </SelectTrigger>
                <SelectContent>
                  {getAvailableVessels().map(vessel => (
                    <SelectItem key={vessel.id} value={vessel.id.toString()}>
                      {vessel.name} ({vessel.vesselType})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="role">Role on Vessel</Label>
              <Select 
                value={assignmentRole} 
                onValueChange={setAssignmentRole}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="captain">Captain</SelectItem>
                  <SelectItem value="engineer">Engineer</SelectItem>
                  <SelectItem value="officer">Officer</SelectItem>
                  <SelectItem value="crew">Crew</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              type="button" 
              onClick={handleCreateAssignment} 
              disabled={!selectedVesselId || createAssignmentMutation.isPending}
            >
              {createAssignmentMutation.isPending && (
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              )}
              Assign Vessel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Role Details Dialog */}
      <Dialog open={isRoleDialogOpen} onOpenChange={setIsRoleDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedRole?.name} Role</DialogTitle>
            <DialogDescription>
              Details and permissions for this role
            </DialogDescription>
          </DialogHeader>
          
          {selectedRole && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium">Description</h3>
                <p className="text-sm text-muted-foreground mt-1">{selectedRole.description}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium">Permissions</h3>
                <div className="mt-2 border rounded-md p-4">
                  {selectedRole.permissions.includes('all') ? (
                    <div className="flex items-center gap-2">
                      <Badge variant="default">All Permissions</Badge>
                      <span className="text-sm text-muted-foreground">This role has full access to all system features</span>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {selectedRole.permissions.map(permission => (
                        <div key={permission} className="flex items-center gap-2">
                          <Badge variant="outline">{permission.replace('_', ' ')}</Badge>
                          <span className="text-sm text-muted-foreground">
                            {permission === 'manage_vessels' && 'Create, edit and manage vessel information'}
                            {permission === 'view_reports' && 'View system reports and analytics'}
                            {permission === 'assign_tasks' && 'Assign tasks to crew members'}
                            {permission === 'manage_inventory' && 'Manage vessel inventory and supplies'}
                            {permission === 'operate_vessel' && 'Primary vessel operation permissions'}
                            {permission === 'manage_crew' && 'Manage crew assignments and schedules'}
                            {permission === 'report_incidents' && 'Create and manage incident reports'}
                            {permission === 'manage_maintenance' && 'Schedule and oversee maintenance tasks'}
                            {permission === 'view_equipment' && 'View equipment details and status'}
                            {permission === 'update_inventory' && 'Update inventory levels and requests'}
                            {permission === 'view_vessel' && 'View assigned vessel information'}
                            {permission === 'complete_tasks' && 'View and complete assigned tasks'}
                            {permission === 'submit_reports' && 'Submit required operational reports'}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-medium">System Information</h3>
                <div className="mt-1 text-sm text-muted-foreground space-y-1">
                  <p>
                    <span className="font-medium">Role ID:</span> {selectedRole.id}
                  </p>
                  <p>
                    <span className="font-medium">Permission Count:</span> {
                      selectedRole.permissions.includes('all') 
                        ? 'Unlimited (All)' 
                        : selectedRole.permissions.length
                    }
                  </p>
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button onClick={() => setIsRoleDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
};

export default UserAdmin;