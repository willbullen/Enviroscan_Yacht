import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest, ApiError } from "@/lib/queryClient";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FiUser, FiFile, FiCalendar, FiAlertTriangle, FiCheck, FiX } from "react-icons/fi";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { DatePicker } from "@/components/ui/date-picker";
import MainLayout from "../components/layout/MainLayout";
import { formatDate, getDaysUntil, isDateInPast } from "@/lib/dateUtils";

// Types
type CrewMember = {
  id: number;
  fullName: string;
  position: string;
  email: string;
  phone: string;
  nationality: string;
  status: string;
  joinDate: string;
  photoUrl: string | null;
  notes: string | null;
  createdAt: string;
};

type CrewDocument = {
  id: number;
  title: string;
  documentType: string;
  documentNumber: string;
  issuingAuthority: string;
  issueDate: string;
  expiryDate: string;
  verificationStatus: string;
  fileUrl: string | null;
  crewMemberId: number;
  notes: string | null;
  createdAt: string;
};

// Form schemas
const crewMemberFormSchema = z.object({
  fullName: z.string().min(2, { message: "Full name must be at least 2 characters." }),
  position: z.string().min(1, { message: "Position is required." }),
  email: z.string().email({ message: "Please enter a valid email address." }),
  phone: z.string().optional(),
  nationality: z.string().min(1, { message: "Nationality is required." }),
  status: z.string().min(1, { message: "Status is required." }),
  joinDate: z.date({ required_error: "Join date is required." }),
  photoUrl: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

const crewDocumentFormSchema = z.object({
  title: z.string().min(2, { message: "Title must be at least 2 characters." }),
  documentType: z.string().min(1, { message: "Document type is required." }),
  documentNumber: z.string().min(1, { message: "Document number is required." }),
  issuingAuthority: z.string().min(1, { message: "Issuing authority is required." }),
  issueDate: z.date({ required_error: "Issue date is required." }),
  expiryDate: z.date({ required_error: "Expiry date is required." }),
  verificationStatus: z.string().min(1, { message: "Verification status is required." }),
  fileUrl: z.string().optional().nullable(),
  crewMemberId: z.number().min(1, { message: "Crew member is required." }),
  notes: z.string().optional().nullable(),
});

// Constants
const CREW_STATUSES = ["Active", "On Leave", "Former"];
const CREW_POSITIONS = ["Captain", "Chief Engineer", "First Officer", "Second Engineer", "Chef", "Steward/ess", "Deckhand"];
const DOCUMENT_TYPES = ["Passport", "Visa", "Certificate of Competency", "Medical Certificate", "Seaman's Book", "Training Certificate"];
const VERIFICATION_STATUSES = ["Verified", "Pending", "Rejected", "Expired"];

// Components
const CrewManagement = () => {
  const [activeTab, setActiveTab] = useState("crew");
  const [isCrewDialogOpen, setIsCrewDialogOpen] = useState(false);
  const [isDocDialogOpen, setIsDocDialogOpen] = useState(false);
  const [selectedCrewMember, setSelectedCrewMember] = useState<CrewMember | null>(null);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Fetch crew members
  const { data: crewMembers, isLoading: isLoadingCrew } = useQuery<CrewMember[]>({
    queryKey: ['/api/crew'],
    refetchOnWindowFocus: false,
    select: (data) => {
      if (!Array.isArray(data)) return [];
      
      // Ensure we're only processing valid crew members
      const validMembers = data.filter(crew => 
        crew && typeof crew === 'object' && 
        'id' in crew && 
        'fullName' in crew && 
        'position' in crew &&
        'email' in crew
      ) as CrewMember[];
      
      // First deduplicate by ID (handles duplicates with the same ID)
      const idMap = new Map<number, CrewMember>();
      validMembers.forEach(crew => {
        idMap.set(crew.id, crew);
      });
      
      // Then deduplicate by more comprehensive criteria
      // Use multiple fields to ensure uniqueness, not just name and position
      const uniqueMap = new Map<string, CrewMember>();
      Array.from(idMap.values()).forEach(crew => {
        // Create a composite key from multiple fields
        const key = [
          crew.fullName.toLowerCase().trim(),
          crew.position.toLowerCase().trim(),
          crew.email.toLowerCase().trim(),
          crew.nationality.toLowerCase().trim()
        ].join('|');
        
        // If there's a conflict, keep the record with the higher ID (likely more recent)
        if (!uniqueMap.has(key) || uniqueMap.get(key)!.id < crew.id) {
          uniqueMap.set(key, crew);
        }
      });
      
      return Array.from(uniqueMap.values()).sort((a, b) => 
        a.fullName.localeCompare(b.fullName) || a.position.localeCompare(b.position)
      );
    }
  });
  
  // Fetch crew documents
  const { data: crewDocuments, isLoading: isLoadingDocs } = useQuery<CrewDocument[]>({
    queryKey: ['/api/crew-documents'],
    refetchOnWindowFocus: false,
    select: (data) => {
      if (!Array.isArray(data)) return [];
      
      // Ensure we're only processing valid documents
      const validDocs = data.filter(doc => 
        doc && typeof doc === 'object' &&
        'id' in doc &&
        'documentNumber' in doc &&
        'documentType' in doc &&
        'crewMemberId' in doc
      ) as CrewDocument[];
      
      // First deduplicate by ID (handles duplicates with the same ID)
      const docMap = new Map<number, CrewDocument>();
      validDocs.forEach(doc => {
        docMap.set(doc.id, doc);
      });
      
      // Then deduplicate based on more comprehensive criteria
      const uniqueDocMap = new Map<string, CrewDocument>();
      Array.from(docMap.values()).forEach(doc => {
        // Create a composite key from document-identifying fields
        const key = [
          doc.documentNumber.trim(),
          doc.documentType.toLowerCase().trim(),
          doc.crewMemberId.toString(),
          doc.issuingAuthority.toLowerCase().trim()
        ].join('|');
        
        // If there's a conflict, keep the record with the higher ID (likely more recent)
        if (!uniqueDocMap.has(key) || uniqueDocMap.get(key)!.id < doc.id) {
          uniqueDocMap.set(key, doc);
        }
      });
      
      return Array.from(uniqueDocMap.values());
    }
  });
  
  // Fetch expiring documents (next 30 days)
  const { data: expiringDocuments, isLoading: isLoadingExpiring } = useQuery<CrewDocument[]>({
    queryKey: ['/api/crew-documents/expiring/30'],
    refetchOnWindowFocus: false,
    select: (data) => {
      if (!Array.isArray(data)) return [];
      
      // Ensure we're only processing valid documents
      const validDocs = data.filter(doc => 
        doc && typeof doc === 'object' &&
        'id' in doc &&
        'documentNumber' in doc &&
        'documentType' in doc &&
        'crewMemberId' in doc
      ) as CrewDocument[];
      
      // First deduplicate by ID (handles duplicates with the same ID)
      const docMap = new Map<number, CrewDocument>();
      validDocs.forEach(doc => {
        docMap.set(doc.id, doc);
      });
      
      // Then deduplicate based on more comprehensive criteria
      const uniqueDocMap = new Map<string, CrewDocument>();
      Array.from(docMap.values()).forEach(doc => {
        // Create a composite key from document-identifying fields
        const key = [
          doc.documentNumber.trim(),
          doc.documentType.toLowerCase().trim(),
          doc.crewMemberId.toString(),
          doc.issuingAuthority.toLowerCase().trim()
        ].join('|');
        
        // If there's a conflict, keep the record with the higher ID (likely more recent)
        if (!uniqueDocMap.has(key) || uniqueDocMap.get(key)!.id < doc.id) {
          uniqueDocMap.set(key, doc);
        }
      });
      
      return Array.from(uniqueDocMap.values());
    }
  });
  
  // Add crew member mutation
  const addCrewMutation = useMutation({
    mutationFn: (data: z.infer<typeof crewMemberFormSchema>) => {
      return apiRequest<CrewMember>('/api/crew', {
        method: 'POST',
        data,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/crew'] });
      setIsCrewDialogOpen(false);
      toast({
        title: "Success",
        description: "Crew member added successfully",
      });
    },
    onError: (error: ApiError) => {
      toast({
        title: "Error",
        description: `Failed to add crew member: ${error.message || 'Please try again.'}`,
        variant: "destructive",
      });
    }
  });
  
  // Add document mutation
  const addDocumentMutation = useMutation({
    mutationFn: (data: z.infer<typeof crewDocumentFormSchema>) => {
      return apiRequest<CrewDocument>('/api/crew-documents', {
        method: 'POST',
        data,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/crew-documents'] });
      setIsDocDialogOpen(false);
      toast({
        title: "Success",
        description: "Document added successfully",
      });
    },
    onError: (error: ApiError) => {
      toast({
        title: "Error",
        description: `Failed to add document: ${error.message || 'Please try again.'}`,
        variant: "destructive",
      });
    }
  });
  
  // Crew member form
  const crewForm = useForm<z.infer<typeof crewMemberFormSchema>>({
    resolver: zodResolver(crewMemberFormSchema),
    defaultValues: {
      fullName: "",
      position: "",
      email: "",
      phone: "",
      nationality: "",
      status: "Active",
      joinDate: new Date(),
      photoUrl: null,
      notes: null,
    },
  });
  
  // Document form
  const documentForm = useForm<z.infer<typeof crewDocumentFormSchema>>({
    resolver: zodResolver(crewDocumentFormSchema),
    defaultValues: {
      title: "",
      documentType: "",
      documentNumber: "",
      issuingAuthority: "",
      issueDate: new Date(),
      expiryDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
      verificationStatus: "Pending",
      fileUrl: null,
      crewMemberId: 0,
      notes: null,
    },
  });
  
  // Submit functions
  const onSubmitCrewForm = (data: z.infer<typeof crewMemberFormSchema>) => {
    addCrewMutation.mutate(data);
  };
  
  const onSubmitDocForm = (data: z.infer<typeof crewDocumentFormSchema>) => {
    addDocumentMutation.mutate(data);
  };
  
  // Calculate document status for visual indicators
  const getDocumentStatus = (expiryDate: string) => {
    const daysUntilExpiry = getDaysUntil(expiryDate);
    
    if (isDateInPast(expiryDate)) {
      return { status: 'expired', label: 'Expired', color: 'destructive' };
    } else if (daysUntilExpiry !== null && daysUntilExpiry <= 30) {
      return { status: 'expiring', label: `Expires in ${daysUntilExpiry} days`, color: 'warning' };
    } else {
      return { status: 'valid', label: 'Valid', color: 'success' };
    }
  };

  const getDocumentsForCrewMember = (crewMemberId: number) => {
    if (!crewDocuments) return [];
    return crewDocuments.filter((doc: CrewDocument) => doc.crewMemberId === crewMemberId);
  };
  
  return (
    <MainLayout title="Crew Management">
      <div className="w-full py-2">
        <div className="flex justify-between items-center mb-3">
          <h1 className="text-2xl font-bold">Crew Management</h1>
          <div className="flex gap-2">
            <Button onClick={() => setIsCrewDialogOpen(true)}>Add Crew Member</Button>
            <Button onClick={() => setIsDocDialogOpen(true)}>Add Document</Button>
          </div>
        </div>
        
        {expiringDocuments && expiringDocuments.length > 0 && (
          <Alert className="mb-6" variant="warning">
            <FiAlertTriangle className="h-5 w-5" />
            <AlertTitle>Attention Required</AlertTitle>
            <AlertDescription>
              There are {expiringDocuments.length} crew documents expiring in the next 30 days.
            </AlertDescription>
          </Alert>
        )}
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-2 bg-transparent h-auto border-b rounded-none">
            <TabsTrigger value="crew" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">Crew Members</TabsTrigger>
            <TabsTrigger value="documents" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">Documents</TabsTrigger>
            <TabsTrigger value="expiring" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">Expiring Documents</TabsTrigger>
          </TabsList>
          
          <TabsContent value="crew" className="space-y-4">
            {isLoadingCrew ? (
              <div className="text-center py-10">Loading crew members...</div>
            ) : crewMembers && crewMembers.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {crewMembers.map((crew: CrewMember) => (
                  <Card key={crew.id} className="overflow-hidden">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle>{crew.fullName}</CardTitle>
                          <CardDescription>{crew.position}</CardDescription>
                        </div>
                        <Badge variant={crew.status === 'Active' ? 'default' : crew.status === 'On Leave' ? 'outline' : 'secondary'}>
                          {crew.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="pb-2">
                      <div className="space-y-2">
                        <div className="text-sm">
                          <span className="font-medium">Email:</span> {crew.email}
                        </div>
                        {crew.phone && (
                          <div className="text-sm">
                            <span className="font-medium">Phone:</span> {crew.phone}
                          </div>
                        )}
                        <div className="text-sm">
                          <span className="font-medium">Nationality:</span> {crew.nationality}
                        </div>
                        <div className="text-sm">
                          <span className="font-medium">Join Date:</span> {formatDate(crew.joinDate)}
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="flex justify-between">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          setSelectedCrewMember(crew);
                          setActiveTab("documents");
                        }}
                      >
                        View Documents
                      </Button>
                      <Button variant="ghost" size="sm">Edit</Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-10">
                <p className="text-muted-foreground">No crew members found.</p>
                <Button variant="outline" className="mt-4" onClick={() => setIsCrewDialogOpen(true)}>Add Crew Member</Button>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="documents" className="space-y-4">
            {isLoadingDocs ? (
              <div className="text-center py-10">Loading documents...</div>
            ) : crewDocuments && crewDocuments.length > 0 ? (
              <>
                {selectedCrewMember ? (
                  <div className="mb-4">
                    <Alert>
                      <div className="flex justify-between items-center">
                        <div>
                          <AlertTitle>Showing documents for {selectedCrewMember.fullName}</AlertTitle>
                          <AlertDescription>
                            Position: {selectedCrewMember.position}
                          </AlertDescription>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => setSelectedCrewMember(null)}>
                          Show All Documents
                        </Button>
                      </div>
                    </Alert>
                  </div>
                ) : null}
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {(selectedCrewMember 
                    ? getDocumentsForCrewMember(selectedCrewMember.id) 
                    : crewDocuments
                  ).map((doc: CrewDocument) => {
                    const docStatus = getDocumentStatus(doc.expiryDate);
                    return (
                      <Card key={doc.id} className="overflow-hidden">
                        <CardHeader className="pb-2">
                          <div className="flex justify-between items-start">
                            <div>
                              <CardTitle>{doc.title}</CardTitle>
                              <CardDescription>{doc.documentType}</CardDescription>
                            </div>
                            <Badge variant={docStatus.color as any}>
                              {docStatus.label}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="pb-2">
                          <div className="space-y-2">
                            <div className="text-sm">
                              <span className="font-medium">Document #:</span> {doc.documentNumber}
                            </div>
                            <div className="text-sm">
                              <span className="font-medium">Issuing Authority:</span> {doc.issuingAuthority}
                            </div>
                            <div className="text-sm">
                              <span className="font-medium">Issue Date:</span> {formatDate(doc.issueDate)}
                            </div>
                            <div className="text-sm">
                              <span className="font-medium">Expiry Date:</span> {formatDate(doc.expiryDate)}
                            </div>
                            <div className="text-sm">
                              <span className="font-medium">Verification:</span> {' '}
                              <Badge variant={
                                doc.verificationStatus === 'Verified' ? 'success' : 
                                doc.verificationStatus === 'Pending' ? 'outline' : 
                                doc.verificationStatus === 'Rejected' ? 'destructive' : 'secondary'
                              }>
                                {doc.verificationStatus}
                              </Badge>
                            </div>
                          </div>
                        </CardContent>
                        <CardFooter className="flex justify-between">
                          {doc.fileUrl && (
                            <Button variant="outline" size="sm">
                              View File
                            </Button>
                          )}
                          <Button variant="ghost" size="sm">Edit</Button>
                        </CardFooter>
                      </Card>
                    );
                  })}
                </div>
              </>
            ) : (
              <div className="text-center py-10">
                <p className="text-muted-foreground">No documents found.</p>
                <Button variant="outline" className="mt-4" onClick={() => setIsDocDialogOpen(true)}>Add Document</Button>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="expiring" className="space-y-4">
            {isLoadingExpiring ? (
              <div className="text-center py-10">Loading expiring documents...</div>
            ) : expiringDocuments && expiringDocuments.length > 0 ? (
              <div className="space-y-4">
                <Alert variant="warning" className="mb-4">
                  <FiAlertTriangle className="h-5 w-5" />
                  <AlertTitle>Documents Expiring Soon</AlertTitle>
                  <AlertDescription>
                    The following documents will expire in the next 30 days and need attention.
                  </AlertDescription>
                </Alert>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {expiringDocuments.map((doc: CrewDocument) => {
                    const docStatus = getDocumentStatus(doc.expiryDate);
                    const crewMember = crewMembers?.find((c: CrewMember) => c.id === doc.crewMemberId);
                    
                    return (
                      <Card key={doc.id} className="overflow-hidden border-warning/50">
                        <CardHeader className="pb-2 bg-warning/10">
                          <div className="flex justify-between items-start">
                            <div>
                              <CardTitle>{doc.title}</CardTitle>
                              <CardDescription>
                                {crewMember ? `${crewMember.fullName} (${crewMember.position})` : "Unknown Crew Member"}
                              </CardDescription>
                            </div>
                            <Badge variant={docStatus.color as any}>
                              {docStatus.label}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="pb-2">
                          <div className="space-y-2">
                            <div className="text-sm">
                              <span className="font-medium">Document Type:</span> {doc.documentType}
                            </div>
                            <div className="text-sm">
                              <span className="font-medium">Document #:</span> {doc.documentNumber}
                            </div>
                            <div className="text-sm">
                              <span className="font-medium">Issuing Authority:</span> {doc.issuingAuthority}
                            </div>
                            <div className="text-sm font-medium text-warning">
                              Expires on: {formatDate(doc.expiryDate)}
                            </div>
                          </div>
                        </CardContent>
                        <CardFooter className="flex justify-between">
                          <Button variant="outline" size="sm">Renew Document</Button>
                          <Button variant="ghost" size="sm">Notify Crew</Button>
                        </CardFooter>
                      </Card>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="text-center py-10">
                <Alert variant="success">
                  <FiCheck className="h-5 w-5" />
                  <AlertTitle>All Clear</AlertTitle>
                  <AlertDescription>
                    No documents are expiring in the next 30 days.
                  </AlertDescription>
                </Alert>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Add Crew Member Dialog */}
      <Dialog open={isCrewDialogOpen} onOpenChange={setIsCrewDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Crew Member</DialogTitle>
            <DialogDescription>
              Enter the details of the crew member below.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...crewForm}>
            <form onSubmit={crewForm.handleSubmit(onSubmitCrewForm)} className="space-y-4">
              <FormField
                control={crewForm.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input placeholder="John Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={crewForm.control}
                name="position"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Position</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select position" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {CREW_POSITIONS.map(position => (
                          <SelectItem key={position} value={position}>{position}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={crewForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input placeholder="john@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={crewForm.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone</FormLabel>
                      <FormControl>
                        <Input placeholder="+1234567890" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={crewForm.control}
                  name="nationality"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nationality</FormLabel>
                      <FormControl>
                        <Input placeholder="American" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={crewForm.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {CREW_STATUSES.map(status => (
                            <SelectItem key={status} value={status}>{status}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={crewForm.control}
                name="joinDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Join Date</FormLabel>
                    <DatePicker
                      date={field.value}
                      setDate={field.onChange}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={crewForm.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Input placeholder="Additional notes" {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button type="submit" disabled={addCrewMutation.isPending}>
                  {addCrewMutation.isPending ? "Adding..." : "Add Crew Member"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Add Document Dialog */}
      <Dialog open={isDocDialogOpen} onOpenChange={setIsDocDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Document</DialogTitle>
            <DialogDescription>
              Enter the document details below.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...documentForm}>
            <form onSubmit={documentForm.handleSubmit(onSubmitDocForm)} className="space-y-4">
              <FormField
                control={documentForm.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Document Title</FormLabel>
                    <FormControl>
                      <Input placeholder="UK Passport" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={documentForm.control}
                name="crewMemberId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Crew Member</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(parseInt(value))}
                      value={field.value ? field.value.toString() : undefined}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select crew member" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {crewMembers?.map((crew: CrewMember) => (
                          <SelectItem key={crew.id} value={crew.id.toString()}>
                            {crew.fullName} ({crew.position})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={documentForm.control}
                name="documentType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Document Type</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select document type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {DOCUMENT_TYPES.map(type => (
                          <SelectItem key={type} value={type}>{type}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={documentForm.control}
                  name="documentNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Document Number</FormLabel>
                      <FormControl>
                        <Input placeholder="123456789" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={documentForm.control}
                  name="issuingAuthority"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Issuing Authority</FormLabel>
                      <FormControl>
                        <Input placeholder="UK Government" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={documentForm.control}
                  name="issueDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Issue Date</FormLabel>
                      <DatePicker
                        date={field.value}
                        setDate={field.onChange}
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={documentForm.control}
                  name="expiryDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Expiry Date</FormLabel>
                      <DatePicker
                        date={field.value}
                        setDate={field.onChange}
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={documentForm.control}
                name="verificationStatus"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Verification Status</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select verification status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {VERIFICATION_STATUSES.map(status => (
                          <SelectItem key={status} value={status}>{status}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={documentForm.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Input placeholder="Additional notes" {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button type="submit" disabled={addDocumentMutation.isPending}>
                  {addDocumentMutation.isPending ? "Adding..." : "Add Document"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
};

export default CrewManagement;