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
  Anchor,
  ArrowLeft,
  ArrowUpDown,
  Check,
  CheckCircle,
  Edit, 
  MoreHorizontal, 
  Plus, 
  RefreshCw, 
  Trash2, 
  UserPlus,
  UserX,
  Users, 
  Search,
  Shield,
  Settings,
  Ship,
  FileText,
  UserCog,
  Info,
  X,
  XCircle
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
  pages?: string[]; // Added pages access control
}

// Available system pages for access control
const SYSTEM_PAGES = [
  { id: 'dashboard', name: 'Dashboard', description: 'Main dashboard with overview statistics' },
  { id: 'vessels', name: 'Vessels', description: 'Vessel management and details' },
  { id: 'maintenance', name: 'Maintenance', description: 'Equipment maintenance planning and history' },
  { id: 'inventory', name: 'Inventory', description: 'Inventory management and stock levels' },
  { id: 'forms', name: 'Forms', description: 'Form management and submissions' },
  { id: 'crew', name: 'Crew', description: 'Crew management and scheduling' },
  { id: 'reports', name: 'Reports', description: 'Reports and analytics' },
  { id: 'ism', name: 'ISM', description: 'ISM document management' },
  { id: 'marine-tracker', name: 'Marine Tracker', description: 'Real-time vessel tracking' },
  { id: 'admin', name: 'Administration', description: 'System administration and settings' },
];

// Available system permissions
const SYSTEM_PERMISSIONS = [
  { id: 'all', name: 'All Permissions', description: 'Full access to all system features' },
  { id: 'manage_vessels', name: 'Manage Vessels', description: 'Create, edit and manage vessel information' },
  { id: 'view_reports', name: 'View Reports', description: 'View system reports and analytics' },
  { id: 'assign_tasks', name: 'Assign Tasks', description: 'Assign tasks to crew members' },
  { id: 'manage_inventory', name: 'Manage Inventory', description: 'Manage vessel inventory and supplies' },
  { id: 'operate_vessel', name: 'Operate Vessel', description: 'Primary vessel operation permissions' },
  { id: 'manage_crew', name: 'Manage Crew', description: 'Manage crew assignments and schedules' },
  { id: 'report_incidents', name: 'Report Incidents', description: 'Create and manage incident reports' },
  { id: 'manage_maintenance', name: 'Manage Maintenance', description: 'Schedule and oversee maintenance tasks' },
  { id: 'view_equipment', name: 'View Equipment', description: 'View equipment details and status' },
  { id: 'update_inventory', name: 'Update Inventory', description: 'Update inventory levels and requests' },
  { id: 'view_vessel', name: 'View Vessel', description: 'View assigned vessel information' },
  { id: 'complete_tasks', name: 'Complete Tasks', description: 'View and complete assigned tasks' },
  { id: 'submit_reports', name: 'Submit Reports', description: 'Submit required operational reports' },
  { id: 'edit_forms', name: 'Edit Forms', description: 'Create and edit forms and templates' },
  { id: 'submit_forms', name: 'Submit Forms', description: 'Fill out and submit forms' },
];

// System default roles
const SYSTEM_ROLES: Role[] = [
  {
    id: 'admin',
    name: 'Administrator',
    description: 'Full system access with all permissions',
    permissions: ['all'],
    pages: ['dashboard', 'vessels', 'maintenance', 'inventory', 'forms', 'crew', 'reports', 'ism', 'marine-tracker', 'admin']
  },
  {
    id: 'manager',
    name: 'Fleet Manager',
    description: 'Can manage vessels, view reports, and coordinate operations',
    permissions: ['manage_vessels', 'view_reports', 'assign_tasks', 'manage_inventory'],
    pages: ['dashboard', 'vessels', 'maintenance', 'inventory', 'forms', 'crew', 'reports', 'marine-tracker']
  },
  {
    id: 'captain',
    name: 'Captain',
    description: 'Primarily responsible for vessel operations and safety',
    permissions: ['operate_vessel', 'manage_crew', 'report_incidents', 'manage_maintenance'],
    pages: ['dashboard', 'vessels', 'maintenance', 'forms', 'crew', 'reports', 'marine-tracker']
  },
  {
    id: 'engineer',
    name: 'Chief Engineer',
    description: 'Responsible for technical maintenance and equipment operation',
    permissions: ['manage_maintenance', 'view_equipment', 'update_inventory'],
    pages: ['dashboard', 'maintenance', 'inventory', 'forms']
  },
  {
    id: 'crew',
    name: 'Crew Member',
    description: 'Basic access to assigned vessel information and tasks',
    permissions: ['view_vessel', 'complete_tasks', 'submit_reports', 'submit_forms'],
    pages: ['dashboard', 'maintenance', 'forms']
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
  const [isRoleEditDialogOpen, setIsRoleEditDialogOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [editedRole, setEditedRole] = useState<Role | null>(null); 
  const [editingPermissions, setEditingPermissions] = useState<string[]>([]);
  const [editingPages, setEditingPages] = useState<string[]>([]);
  
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
  
  const handleEditRole = (role: Role) => {
    setEditedRole({...role});
    setEditingPermissions(role.permissions || []);
    setEditingPages(role.pages || []);
    setIsRoleEditDialogOpen(true);
  };
  
  const handleSaveRoleChanges = () => {
    if (!editedRole) return;
    
    // Find the role in the system roles
    const roleIndex = SYSTEM_ROLES.findIndex(r => r.id === editedRole.id);
    if (roleIndex !== -1) {
      // Update the role
      SYSTEM_ROLES[roleIndex] = {
        ...SYSTEM_ROLES[roleIndex],
        permissions: editingPermissions,
        pages: editingPages
      };
      
      toast({
        title: "Role Updated",
        description: `The ${editedRole.name} role has been updated successfully.`,
        variant: "default"
      });
      
      // Close the dialog
      setIsRoleEditDialogOpen(false);
      setEditedRole(null);
    }
  };
  
  const togglePermission = (permissionId: string) => {
    if (editingPermissions.includes(permissionId)) {
      // If permission is 'all', prevent removal for admin roles
      if (permissionId === 'all' && editedRole?.id === 'admin') {
        toast({
          title: "Cannot Remove Permission",
          description: "The Administrator role must have all permissions.",
          variant: "destructive"
        });
        return;
      }
      
      // Remove permission
      setEditingPermissions(editingPermissions.filter(p => p !== permissionId));
    } else {
      // Add permission
      if (permissionId === 'all') {
        // If 'all' is added, remove all other permissions
        setEditingPermissions(['all']);
      } else {
        // If another permission is added, remove 'all'
        const newPermissions = editingPermissions.filter(p => p !== 'all');
        setEditingPermissions([...newPermissions, permissionId]);
      }
    }
  };
  
  const togglePage = (pageId: string) => {
    if (editingPages.includes(pageId)) {
      // If this is the admin role, don't allow removing certain critical pages
      if (editedRole?.id === 'admin' && ['dashboard', 'admin'].includes(pageId)) {
        toast({
          title: "Cannot Remove Page Access",
          description: "The Administrator role must have access to critical system pages.",
          variant: "destructive"
        });
        return;
      }
      
      // Remove page
      setEditingPages(editingPages.filter(p => p !== pageId));
    } else {
      // Add page
      setEditingPages([...editingPages, pageId]);
    }
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
        <div className="flex flex-col space-y-2 md:flex-row md:justify-between md:items-center mb-4">
          <div>
            <h1 className="text-2xl font-bold">User Administration</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Manage system users, their roles, and vessel assignments
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button 
              variant="outline" 
              onClick={() => setSelectedTab("roles")}
              className="gap-1.5"
            >
              <Shield className="h-4 w-4" />
              System Roles
            </Button>
            <Button 
              variant="default" 
              onClick={() => {
                resetUserForm();
                setIsAddingUser(true);
              }}
              className="gap-1.5"
            >
              <UserPlus className="h-4 w-4" /> 
              Add New User
            </Button>
          </div>
        </div>

        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
          <TabsList className="grid w-full md:w-auto grid-cols-3 rounded-full p-1 h-11 mb-2">
            <TabsTrigger value="users" className="flex items-center gap-2 rounded-full">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Manage</span> Users
            </TabsTrigger>
            <TabsTrigger 
              value="vessels" 
              className="flex items-center gap-2 rounded-full"
              disabled={!selectedUser}
            >
              <Ship className="h-4 w-4" />
              <span className="hidden sm:inline">Vessel</span> Assignments
            </TabsTrigger>
            <TabsTrigger value="roles" className="flex items-center gap-2 rounded-full">
              <Shield className="h-4 w-4" />
              <span className="hidden sm:inline">System</span> Roles
            </TabsTrigger>
          </TabsList>
          
          {/* Users Tab */}
          <TabsContent value="users" className="space-y-6">
            <Card className="rounded-lg shadow-sm border-border/40">
              <CardHeader className="pb-3">
                <CardTitle className="text-xl font-bold flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary" />
                    System Users
                  </div>
                  <Button 
                    variant="outline" 
                    onClick={() => refetchUsers()}
                    size="sm"
                    className="gap-1.5 h-9 px-3"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Refresh
                  </Button>
                </CardTitle>
                <CardDescription>
                  View and manage all system users, their roles, and access permissions
                </CardDescription>
              </CardHeader>
              
              <CardContent className="p-0">
                <div className="p-4 border-y bg-muted/30">
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                    <div className="relative md:col-span-6">
                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search users by name, username or email..."
                        value={userFilter}
                        onChange={(e) => setUserFilter(e.target.value)}
                        className="pl-8 h-9"
                      />
                      <p className="text-xs text-muted-foreground mt-1 ml-1">
                        Type to filter users
                      </p>
                    </div>
                    
                    <div className="md:col-span-3">
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
                      <p className="text-xs text-muted-foreground mt-1 ml-1">Filter by role</p>
                    </div>
                    
                    <div className="md:col-span-3">
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
                      <p className="text-xs text-muted-foreground mt-1 ml-1">Filter by status</p>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center mt-4">
                    <div>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => {
                          setUserFilter('');
                          setUserRoleFilter('all');
                          setUserStatusFilter('all');
                        }}
                        className="h-8 gap-1.5"
                      >
                        <X className="h-3.5 w-3.5" />
                        Clear Filters
                      </Button>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">
                        {filteredUsers?.length || 0} Users
                      </Badge>
                      <Button
                        onClick={() => {
                          resetUserForm();
                          setIsAddingUser(true);
                        }}
                        size="sm"
                        className="gap-1.5 h-8"
                      >
                        <UserPlus className="h-3.5 w-3.5" />
                        Add User
                      </Button>
                    </div>
                  </div>
                </div>
                
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
                  <div className="rounded-md overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/50 hover:bg-muted">
                          <TableHead className="font-semibold">Name</TableHead>
                          <TableHead className="font-semibold">Username</TableHead>
                          <TableHead className="font-semibold hidden md:table-cell">Email</TableHead>
                          <TableHead className="font-semibold">Role</TableHead>
                          <TableHead className="font-semibold">Status</TableHead>
                          <TableHead className="text-right font-semibold">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredUsers && filteredUsers.length > 0 ? (
                          filteredUsers.map(user => (
                            <TableRow key={user.id} className="hover:bg-muted/30">
                              <TableCell className="font-medium">{user.fullName}</TableCell>
                              <TableCell>{user.username}</TableCell>
                              <TableCell className="hidden md:table-cell">{user.email || '-'}</TableCell>
                              <TableCell>
                                <Badge variant={user.role === 'admin' ? 'default' : 'outline'} className="font-normal">
                                  {SYSTEM_ROLES.find(r => r.id === user.role)?.name || user.role}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div 
                                  className={`flex items-center px-2 py-1 rounded-full text-xs ${
                                    user.isActive 
                                      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' 
                                      : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400'
                                  }`}
                                >
                                  <div className={`w-2 h-2 rounded-full mr-1.5 ${user.isActive ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                                  {user.isActive ? 'Active' : 'Inactive'}
                                </div>
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-1">
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={() => handleSelectUser(user)}
                                    className="h-8 px-2 text-xs"
                                    title="Manage vessel assignments"
                                  >
                                    <Ship className="h-3.5 w-3.5 mr-1" />
                                    <span>Vessels</span>
                                  </Button>
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={() => handleEditUser(user)}
                                    className="h-8 px-2 text-xs"
                                    title="Edit user details"
                                  >
                                    <Edit className="h-3.5 w-3.5 mr-1" />
                                    <span>Edit</span>
                                  </Button>
                                  {user.id !== currentUser?.id && (
                                    <Button
                                      variant={user.isActive ? "ghost" : "secondary"}
                                      size="sm"
                                      className={`h-8 px-2 text-xs ${user.isActive ? "hover:text-destructive" : "hover:text-green-600"}`}
                                      onClick={() => updateUserMutation.mutate({
                                        id: user.id,
                                        userData: { isActive: !user.isActive }
                                      })}
                                      title={user.isActive ? "Deactivate user account" : "Activate user account"}
                                    >
                                      {user.isActive ? (
                                        <>
                                          <XCircle className="h-3.5 w-3.5 mr-1" />
                                          <span>Deactivate</span>
                                        </>
                                      ) : (
                                        <>
                                          <CheckCircle className="h-3.5 w-3.5 mr-1" />
                                          <span>Activate</span>
                                        </>
                                      )}
                                    </Button>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                              <div className="flex flex-col items-center justify-center">
                                <UserX className="h-10 w-10 text-muted-foreground/60 mb-2" />
                                <p>No users found matching the filter criteria.</p>
                                <Button 
                                  variant="link" 
                                  onClick={() => {
                                    setUserFilter('');
                                    setUserRoleFilter('all');
                                    setUserStatusFilter('all');
                                  }}
                                >
                                  Clear filters
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
              <CardFooter className="py-3 border-t bg-muted/20 flex justify-between items-center">
                <div className="text-xs text-muted-foreground">
                  Showing {filteredUsers?.length || 0} of {users?.length || 0} total users
                </div>
                <div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => refetchUsers()}
                    className="gap-1 h-8"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    Refresh
                  </Button>
                </div>
              </CardFooter>
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
          <TabsContent value="roles" className="space-y-6">
            <Card className="rounded-lg shadow-sm border-border/40">
              <CardHeader className="pb-3">
                <CardTitle className="text-xl font-bold flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                  <div className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-primary" />
                    System Roles
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setSelectedTab("users")}
                      className="gap-1.5 h-9 px-3"
                    >
                      <Users className="h-4 w-4" />
                      View Users
                    </Button>
                  </div>
                </CardTitle>
                <CardDescription>
                  Manage system roles, their permissions, and page access controls. These determine what users can access.
                </CardDescription>
              </CardHeader>
              
              <CardContent className="p-0">
                <div className="p-4 border-y bg-muted/30">
                  <div className="flex justify-between items-center">
                    <div className="text-sm">
                      <p className="font-medium">About System Roles</p>
                      <p className="text-muted-foreground">Each role represents a set of permissions and access controls for users. Assign roles to users to grant them specific abilities.</p>
                    </div>
                    <div>
                      <Badge variant="secondary" className="gap-1">
                        <Shield className="h-3.5 w-3.5" />
                        {SYSTEM_ROLES.length} Roles
                      </Badge>
                    </div>
                  </div>
                </div>
                
                <div className="rounded-md overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50 hover:bg-muted">
                        <TableHead className="font-semibold">Role Name</TableHead>
                        <TableHead className="font-semibold">Description</TableHead>
                        <TableHead className="font-semibold hidden md:table-cell">Permissions</TableHead>
                        <TableHead className="font-semibold hidden md:table-cell">Page Access</TableHead>
                        <TableHead className="text-right font-semibold">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {SYSTEM_ROLES.map(role => (
                        <TableRow key={role.id} className="hover:bg-muted/30">
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              <Shield className={`h-4 w-4 ${role.id === 'admin' ? 'text-primary' : 'text-muted-foreground'}`} />
                              {role.name}
                            </div>
                          </TableCell>
                          <TableCell className="max-w-[200px] truncate">{role.description}</TableCell>
                          <TableCell className="hidden md:table-cell">
                            <div className="flex flex-wrap gap-1">
                              {role.permissions.includes('all') ? (
                                <Badge variant="default" className="font-normal">All permissions</Badge>
                              ) : (
                                role.permissions.slice(0, 3).map(permission => (
                                  <Badge key={permission} variant="outline" className="whitespace-nowrap font-normal">
                                    {permission.replace(/_/g, ' ')}
                                  </Badge>
                                ))
                              )}
                              {role.permissions.length > 3 && !role.permissions.includes('all') && (
                                <Badge variant="outline" className="font-normal">+{role.permissions.length - 3} more</Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            <div className="flex flex-wrap gap-1">
                              {role.pages && role.pages.slice(0, 3).map(pageId => {
                                const page = SYSTEM_PAGES.find(p => p.id === pageId);
                                return (
                                  <Badge key={pageId} variant="secondary" className="whitespace-nowrap font-normal">
                                    {page?.name || pageId}
                                  </Badge>
                                );
                              })}
                              {role.pages && role.pages.length > 3 && (
                                <Badge variant="secondary" className="font-normal">+{role.pages.length - 3} more</Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end space-x-1">
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => handleSelectRole(role)}
                                className="h-8 w-8"
                              >
                                <Info className="h-4 w-4" />
                                <span className="sr-only">View details</span>
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => handleEditRole(role)}
                                className="h-8 w-8"
                              >
                                <Edit className="h-4 w-4" />
                                <span className="sr-only">Edit role</span>
                              </Button>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button 
                                    variant="ghost" 
                                    size="icon"
                                    className="h-8 w-8"
                                    disabled={role.id === 'admin'} // Prevent actions on admin role
                                  >
                                    <MoreHorizontal className="h-4 w-4" />
                                    <span className="sr-only">More options</span>
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-40">
                                  <DropdownMenuLabel>Role Actions</DropdownMenuLabel>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem onClick={() => handleEditRole(role)}>
                                    <Edit className="mr-2 h-4 w-4" />
                                    <span>Edit Role</span>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleSelectRole(role)}>
                                    <Info className="mr-2 h-4 w-4" />
                                    <span>View Details</span>
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
              <CardFooter className="py-3 border-t bg-muted/20 flex justify-between items-center">
                <div className="text-xs text-muted-foreground">
                  System roles can be assigned to users in the Users tab
                </div>
                <div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setSelectedTab("users")}
                    className="gap-1 h-8"
                  >
                    <Users className="h-3.5 w-3.5" />
                    Manage Users
                  </Button>
                </div>
              </CardFooter>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Understanding Roles & Permissions</CardTitle>
                <CardDescription>
                  Learn how roles and permissions work in the system
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="border rounded-lg p-4 space-y-2">
                      <h3 className="text-lg font-medium flex items-center">
                        <Shield className="h-5 w-5 mr-2 text-primary" />
                        Roles
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Roles define what a user can do in the system. Each user is assigned a role that determines their permissions and access to different pages.
                      </p>
                    </div>
                    <div className="border rounded-lg p-4 space-y-2">
                      <h3 className="text-lg font-medium flex items-center">
                        <FileText className="h-5 w-5 mr-2 text-primary" />
                        Permissions
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Permissions control specific actions a user can perform, such as managing vessels, viewing reports, or assigning tasks.
                      </p>
                    </div>
                  </div>
                  
                  <div className="border rounded-lg p-4 space-y-2">
                    <h3 className="text-lg font-medium flex items-center">
                      <UserCog className="h-5 w-5 mr-2 text-primary" />
                      Best Practices
                    </h3>
                    <ul className="text-sm text-muted-foreground space-y-1 list-disc pl-5">
                      <li>Assign users the least privileged role needed for their job</li>
                      <li>The Administrator role should be limited to trusted personnel</li>
                      <li>Regularly review role assignments to ensure appropriate access</li>
                      <li>Page access controls which parts of the application users can see</li>
                    </ul>
                  </div>
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
                      {selectedRole.permissions.map(permission => {
                        const permInfo = SYSTEM_PERMISSIONS.find(p => p.id === permission);
                        return (
                          <div key={permission} className="flex items-center gap-2">
                            <Badge variant="outline">{permInfo?.name || permission.replace(/_/g, ' ')}</Badge>
                            <span className="text-sm text-muted-foreground">
                              {permInfo?.description || ''}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-medium">Page Access</h3>
                <div className="mt-2 border rounded-md p-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    {selectedRole.pages?.map(pageId => {
                      const page = SYSTEM_PAGES.find(p => p.id === pageId);
                      return (
                        <div key={pageId} className="flex items-center gap-2">
                          <Badge variant="secondary">{page?.name || pageId}</Badge>
                        </div>
                      );
                    })}
                  </div>
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
                  <p>
                    <span className="font-medium">Page Access Count:</span> {selectedRole.pages?.length || 0}
                  </p>
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              handleEditRole(selectedRole!);
              setIsRoleDialogOpen(false);
            }}>
              <Edit className="mr-2 h-4 w-4" />
              Edit Role
            </Button>
            <Button onClick={() => setIsRoleDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Role Edit Dialog */}
      <Dialog open={isRoleEditDialogOpen} onOpenChange={setIsRoleEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit {editedRole?.name} Role</DialogTitle>
            <DialogDescription>
              Configure permissions and page access for this role
            </DialogDescription>
          </DialogHeader>
          
          {editedRole && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Permissions Section */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <h3 className="text-base font-medium">Role Permissions</h3>
                    <Badge variant="outline" className="ml-2">
                      {editingPermissions.length} Selected
                    </Badge>
                  </div>
                  
                  <div className="border rounded-md p-4 h-[400px] overflow-y-auto space-y-3">
                    {SYSTEM_PERMISSIONS.map(permission => (
                      <div 
                        key={permission.id} 
                        className={`flex items-start space-x-2 p-2 rounded cursor-pointer transition-colors ${
                          editingPermissions.includes(permission.id) 
                            ? 'bg-primary/10 border border-primary/20' 
                            : 'hover:bg-muted'
                        }`}
                        onClick={() => togglePermission(permission.id)}
                      >
                        <Checkbox 
                          id={`perm-${permission.id}`} 
                          checked={editingPermissions.includes(permission.id)}
                          onCheckedChange={() => togglePermission(permission.id)}
                          className="mt-1"
                        />
                        <div>
                          <Label 
                            htmlFor={`perm-${permission.id}`} 
                            className="font-medium cursor-pointer"
                          >
                            {permission.name}
                          </Label>
                          <p className="text-xs text-muted-foreground mt-1">
                            {permission.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Page Access Section */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <h3 className="text-base font-medium">Page Access</h3>
                    <Badge variant="outline" className="ml-2">
                      {editingPages.length} Selected
                    </Badge>
                  </div>
                  
                  <div className="border rounded-md p-4 h-[400px] overflow-y-auto space-y-3">
                    {SYSTEM_PAGES.map(page => (
                      <div 
                        key={page.id} 
                        className={`flex items-start space-x-2 p-2 rounded cursor-pointer transition-colors ${
                          editingPages.includes(page.id) 
                            ? 'bg-primary/10 border border-primary/20' 
                            : 'hover:bg-muted'
                        }`}
                        onClick={() => togglePage(page.id)}
                      >
                        <Checkbox 
                          id={`page-${page.id}`} 
                          checked={editingPages.includes(page.id)}
                          onCheckedChange={() => togglePage(page.id)}
                          className="mt-1"
                        />
                        <div>
                          <Label 
                            htmlFor={`page-${page.id}`} 
                            className="font-medium cursor-pointer"
                          >
                            {page.name}
                          </Label>
                          <p className="text-xs text-muted-foreground mt-1">
                            {page.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="bg-muted/50 p-4 rounded-md">
                <h4 className="text-sm font-medium flex items-center gap-2 mb-2">
                  <Info className="h-4 w-4" />
                  About Role Changes
                </h4>
                <p className="text-xs text-muted-foreground">
                  Changes to role permissions and page access will affect all users with this role.
                  {editedRole.id === 'admin' && ' Administrator roles must maintain access to all critical system functions.'}
                </p>
              </div>
            </div>
          )}
          
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setIsRoleEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSaveRoleChanges}
              className="gap-1"
            >
              <Shield className="h-4 w-4" />
              Save Role Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
};

export default UserAdmin;