import React, { useState } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
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
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
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
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Edit, MoreHorizontal, Plus, RefreshCw, Trash2, UserPlus, Users } from 'lucide-react';
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

const UserAdmin: React.FC = () => {
  const { toast } = useToast();
  const { user: currentUser } = useAuth();
  const [selectedTab, setSelectedTab] = useState('users');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [isEditingUser, setIsEditingUser] = useState(false);
  const [isAddingAssignment, setIsAddingAssignment] = useState(false);
  const [selectedVesselId, setSelectedVesselId] = useState<number | null>(null);
  const [assignmentRole, setAssignmentRole] = useState('crew');

  // User form state
  const [userForm, setUserForm] = useState({
    username: '',
    fullName: '',
    email: '',
    password: '',
    role: 'crew',
    isActive: true
  });

  // Get all users with improved error handling
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

  // Get all vessels
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

  // Get user-vessel assignments (if user is selected)
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

  // Create user mutation
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

  // Update user mutation
  const updateUserMutation = useMutation({
    mutationFn: async (data: { id: number, userData: Partial<User> }) => {
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

  // Create user-vessel assignment mutation
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

  // Delete user-vessel assignment mutation
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

  // Reset user form
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

  // Handle user selection
  const handleSelectUser = (user: User) => {
    setSelectedUser(user);
    setSelectedTab('vessels');
  };

  // Handle edit user
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

  // Handle user form submission
  const handleUserFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isEditingUser && selectedUser) {
      // Update existing user
      const userData: Partial<User> = {
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

  // Handle assignment creation
  const handleCreateAssignment = () => {
    if (!selectedUser || !selectedVesselId) return;
    
    createAssignmentMutation.mutate({
      userId: selectedUser.id,
      vesselId: selectedVesselId,
      role: assignmentRole
    });
  };

  // Handle assignment deletion
  const handleDeleteAssignment = (assignmentId: number) => {
    if (window.confirm('Are you sure you want to remove this vessel assignment?')) {
      deleteAssignmentMutation.mutate(assignmentId);
    }
  };

  // Format vessel assignments for display
  const getVesselName = (vesselId: number): string => {
    const vessel = vessels?.find(v => v.id === vesselId);
    return vessel ? vessel.name : `Vessel #${vesselId}`;
  };

  // Get assigned vessels IDs for filtering available vessels
  const getAssignedVesselIds = (): number[] => {
    if (!userVesselAssignments) return [];
    return userVesselAssignments.map(assignment => assignment.vesselId);
  };

  // Filter vessels that are not yet assigned to the user
  const getAvailableVessels = (): Vessel[] => {
    if (!vessels || !selectedUser) return [];
    const assignedIds = getAssignedVesselIds();
    return vessels.filter(vessel => !assignedIds.includes(vessel.id));
  };

  return (
    <MainLayout title="User Administration">
      <div className="container mx-auto py-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">User Administration</h1>
          <Button onClick={() => {
            resetUserForm();
            setIsAddingUser(true);
          }}>
            <UserPlus className="mr-2 h-4 w-4" /> 
            Add User
          </Button>
        </div>

        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-4">
          <TabsList className="grid w-full md:w-auto grid-cols-2">
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Users
            </TabsTrigger>
            <TabsTrigger 
              value="vessels" 
              className="flex items-center gap-2"
              disabled={!selectedUser}
            >
              <Users className="h-4 w-4" />
              Vessel Assignments
            </TabsTrigger>
          </TabsList>
          
          {/* Users Tab */}
          <TabsContent value="users" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
                <CardDescription>
                  View, add, and edit users for the yacht management system.
                </CardDescription>
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
                        {users && users.length > 0 ? (
                          users.map(user => (
                            <TableRow key={user.id}>
                              <TableCell className="font-medium">{user.fullName}</TableCell>
                              <TableCell>{user.username}</TableCell>
                              <TableCell>{user.email || '-'}</TableCell>
                              <TableCell>
                                <Badge variant={user.role === 'admin' ? 'default' : 'outline'}>
                                  {user.role}
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
                                      <Users className="mr-2 h-4 w-4" />
                                      <span>Manage Vessels</span>
                                    </DropdownMenuItem>
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
                              No users found
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
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              );
                            })
                          ) : (
                            <TableRow>
                              <TableCell colSpan={5} className="text-center py-4">
                                No vessel assignments found for this user
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
                <CardContent className="flex flex-col items-center justify-center h-40">
                  <p className="text-muted-foreground mb-4">Please select a user to manage vessel assignments</p>
                  <Button variant="outline" onClick={() => setSelectedTab('users')}>
                    Go to Users
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Add/Edit User Dialog */}
      <Dialog 
        open={isAddingUser || isEditingUser} 
        onOpenChange={(open) => {
          if (!open) {
            setIsAddingUser(false);
            setIsEditingUser(false);
          }
        }}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {isEditingUser ? 'Edit User' : 'Add New User'}
            </DialogTitle>
            <DialogDescription>
              {isEditingUser 
                ? 'Update the user information below' 
                : 'Fill in the details to create a new user'}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleUserFormSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  value={userForm.username}
                  onChange={(e) => setUserForm({...userForm, username: e.target.value})}
                  disabled={isEditingUser} // Can't change username when editing
                  required={!isEditingUser}
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  value={userForm.fullName}
                  onChange={(e) => setUserForm({...userForm, fullName: e.target.value})}
                  required
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={userForm.email}
                  onChange={(e) => setUserForm({...userForm, email: e.target.value})}
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="password">
                  {isEditingUser ? 'New Password (leave blank to keep current)' : 'Password'}
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={userForm.password}
                  onChange={(e) => setUserForm({...userForm, password: e.target.value})}
                  required={!isEditingUser}
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="role">Role</Label>
                <Select 
                  value={userForm.role} 
                  onValueChange={(value) => setUserForm({...userForm, role: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Administrator</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="captain">Captain</SelectItem>
                    <SelectItem value="engineer">Engineer</SelectItem>
                    <SelectItem value="crew">Crew</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="isActive" 
                  checked={userForm.isActive}
                  onCheckedChange={(checked) => 
                    setUserForm({...userForm, isActive: checked as boolean})
                  } 
                />
                <Label htmlFor="isActive">Active account</Label>
              </div>
            </div>
            
            <DialogFooter>
              <Button type="submit" disabled={createUserMutation.isPending || updateUserMutation.isPending}>
                {(createUserMutation.isPending || updateUserMutation.isPending) && (
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                )}
                {isEditingUser ? 'Update User' : 'Create User'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Vessel Assignment Dialog */}
      <Dialog 
        open={isAddingAssignment} 
        onOpenChange={(open) => {
          if (!open) {
            setIsAddingAssignment(false);
            setSelectedVesselId(null);
            setAssignmentRole('crew');
          }
        }}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Assign Vessel</DialogTitle>
            <DialogDescription>
              {selectedUser && (
                <span>Assign a vessel to {selectedUser.fullName}</span>
              )}
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
    </MainLayout>
  );
};

export default UserAdmin;