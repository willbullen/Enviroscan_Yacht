import { z } from "zod";
import { ValidationError } from "../middleware/errorHandler";

// Common validation schemas
export const commonSchemas = {
  id: z.coerce.number().int().positive("ID must be a positive integer"),
  optionalId: z.coerce.number().int().positive().optional(),
  email: z.string().email("Invalid email format"),
  url: z.string().url("Invalid URL format"),
  phoneNumber: z.string().regex(/^\+?[\d\s\-\(\)]{7,20}$/, "Invalid phone number format"),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/(?=.*[a-z])/, "Password must contain at least one lowercase letter")
    .regex(/(?=.*[A-Z])/, "Password must contain at least one uppercase letter")
    .regex(/(?=.*\d)/, "Password must contain at least one number"),
  
  // Pagination schemas
  pagination: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    offset: z.coerce.number().int().min(0).optional()
  }),

  // Date range validation
  dateRange: z.object({
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional()
  }).refine(
    (data) => !data.startDate || !data.endDate || new Date(data.startDate) <= new Date(data.endDate),
    { message: "Start date must be before end date" }
  ),

  // File validation
  fileMetadata: z.object({
    filename: z.string().min(1, "Filename is required"),
    mimetype: z.string().min(1, "MIME type is required"),
    size: z.number().positive("File size must be positive")
  }),

  // Search and filter
  searchQuery: z.object({
    search: z.string().optional(),
    sortBy: z.string().optional(),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
    status: z.string().optional(),
    category: z.string().optional()
  })
};

// File type validation
export const fileValidation = {
  // Allowed MIME types by category
  allowedMimeTypes: {
    images: [
      'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
      'image/svg+xml', 'image/tiff', 'image/bmp'
    ],
    documents: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'text/plain', 'text/csv'
    ],
    drawings: [
      'application/pdf',
      'image/jpeg', 'image/jpg', 'image/png', 'image/tiff', 'image/svg+xml',
      'application/acad', 'application/dwg', 'image/vnd.dwg'
    ],
    models3d: [
      'model/obj', 'application/octet-stream', // .obj files
      'model/gltf+json', 'model/gltf-binary', // .gltf, .glb files
      'application/x-fbx', // .fbx files
      'model/ply', // .ply files
      'application/x-step', 'application/step' // .step files
    ]
  },

  // File size limits (in bytes)
  sizeLimits: {
    'issue-photos': 10 * 1024 * 1024, // 10MB
    'drawings': 50 * 1024 * 1024, // 50MB
    'documents': 100 * 1024 * 1024, // 100MB
    '3d-models': 200 * 1024 * 1024, // 200MB
    'default': 10 * 1024 * 1024 // 10MB default
  },

  // Validate file type for category
  validateFileType: (mimetype: string, category: string): boolean => {
    const allowedTypes = fileValidation.allowedMimeTypes[category as keyof typeof fileValidation.allowedMimeTypes];
    if (!allowedTypes) return false;
    return allowedTypes.includes(mimetype);
  },

  // Validate file size for category
  validateFileSize: (size: number, category: string): boolean => {
    const limit = fileValidation.sizeLimits[category as keyof typeof fileValidation.sizeLimits] 
                 || fileValidation.sizeLimits.default;
    return size <= limit;
  },

  // Get human-readable file size
  getHumanFileSize: (bytes: number): string => {
    const sizes = ['B', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 B';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  }
};

// Data sanitization utilities
export const sanitization = {
  // Remove HTML tags and potentially dangerous characters
  sanitizeText: (text: string): string => {
    return text
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/[<>'"&]/g, '') // Remove potentially dangerous characters
      .trim();
  },

  // Sanitize filename for file system safety
  sanitizeFilename: (filename: string): string => {
    return filename
      .replace(/[^a-zA-Z0-9\.\-_]/g, '_') // Replace invalid characters with underscore
      .replace(/_{2,}/g, '_') // Replace multiple underscores with single
      .replace(/^_+|_+$/g, '') // Remove leading/trailing underscores
      .substring(0, 255); // Limit length
  },

  // Normalize coordinates (ensure they're between 0 and 1)
  normalizeCoordinate: (coord: number): number => {
    return Math.max(0, Math.min(1, coord));
  },

  // Clean and validate JSON data
  sanitizeJson: (data: any): any => {
    if (typeof data === 'string') {
      try {
        return JSON.parse(data);
      } catch {
        throw new ValidationError("Invalid JSON format");
      }
    }
    return data;
  }
};

// Build management specific validation schemas
export const buildManagementSchemas = {
  // Project validation
  createProject: z.object({
    vesselId: commonSchemas.id,
    name: z.string().min(1, "Project name is required").max(200),
    description: z.string().optional(),
    projectManagerId: commonSchemas.optionalId,
    startDate: z.string().datetime().optional(),
    plannedEndDate: z.string().datetime().optional(),
    budget: z.number().positive().optional(),
    priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
    status: z.enum(['planning', 'active', 'on_hold', 'completed', 'cancelled']).default('planning')
  }),

  // Drawing validation
  createDrawing: z.object({
    projectId: commonSchemas.id,
    drawingNumber: z.string().min(1, "Drawing number is required").max(50),
    title: z.string().min(1, "Title is required").max(200),
    description: z.string().optional(),
    buildGroup: z.enum([
      'general_arrangement', 'structural', 'mechanical', 'electrical', 
      'interior', 'exterior', 'systems', 'details'
    ]),
    discipline: z.enum([
      'naval_architecture', 'engineering', 'interior_design', 'systems'
    ]),
    drawingType: z.enum(['plan', 'section', 'elevation', 'detail', 'schematic']),
    scale: z.string().optional(),
    revisionNumber: z.string().max(10).default('A'),
    approvalRequired: z.boolean().default(false)
  }),

  // Issue validation
  createIssue: z.object({
    projectId: commonSchemas.id,
    title: z.string().min(1, "Title is required").max(200),
    description: z.string().min(1, "Description is required"),
    issueType: z.enum([
      'defect', 'rework', 'design_change', 'procurement', 'quality', 'safety', 'schedule'
    ]),
    category: z.enum([
      'structural', 'mechanical', 'electrical', 'interior', 'systems', 'exterior'
    ]),
    severity: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
    priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
    locationReference: z.string().optional(),
    coordinateX: z.number().min(0).max(1).optional(),
    coordinateY: z.number().min(0).max(1).optional(),
    coordinateZ: z.number().min(0).max(1).optional(),
    assignedToId: commonSchemas.optionalId,
    relatedDrawingId: commonSchemas.optionalId,
    dueDate: z.string().datetime().optional()
  }),

  // Document validation
  createDocument: z.object({
    projectId: commonSchemas.id,
    title: z.string().min(1, "Title is required").max(200),
    description: z.string().optional(),
    documentType: z.enum([
      'specification', 'report', 'certificate', 'manual', 'contract', 
      'correspondence', 'photo', 'video'
    ]),
    category: z.enum([
      'technical', 'commercial', 'regulatory', 'quality', 'safety', 'progress'
    ]),
    documentNumber: z.string().optional(),
    version: z.string().default('1.0'),
    confidentialityLevel: z.enum([
      'public', 'internal', 'confidential', 'restricted'
    ]).default('internal'),
    tags: z.array(z.string()).optional(),
    reviewRequired: z.boolean().default(false)
  }),

  // 3D Model validation
  create3DModel: z.object({
    projectId: commonSchemas.id,
    modelName: z.string().min(1, "Model name is required").max(200),
    description: z.string().optional(),
    modelType: z.enum(['matterport', 'photogrammetry', 'cad_model', 'point_cloud']),
    provider: z.string().optional(),
    modelUrl: z.string().url("Invalid model URL"),
    embeddedViewerUrl: z.string().url().optional(),
    modelId: z.string().optional(),
    scanDate: z.string().datetime().optional(),
    scanLocation: z.string().optional(),
    resolution: z.string().optional(),
    measurementUnits: z.string().default('meters'),
    tags: z.array(z.string()).optional()
  }),

  // Milestone validation
  createMilestone: z.object({
    projectId: commonSchemas.id,
    name: z.string().min(1, "Milestone name is required").max(200),
    description: z.string().optional(),
    milestoneType: z.enum(['start', 'completion', 'review', 'delivery', 'inspection']),
    category: z.enum([
      'design', 'structural', 'mechanical', 'electrical', 'interior', 'commissioning'
    ]),
    plannedDate: z.string().datetime(),
    budget: z.number().positive().optional(),
    responsibleParty: z.string().optional(),
    dependencies: z.array(commonSchemas.id).optional()
  })
};

// Validation helper functions
export const validationHelpers = {
  // Validate coordinate is within bounds
  validateCoordinates: (x?: number, y?: number, z?: number) => {
    if (x !== undefined && (x < 0 || x > 1)) {
      throw new ValidationError("X coordinate must be between 0 and 1");
    }
    if (y !== undefined && (y < 0 || y > 1)) {
      throw new ValidationError("Y coordinate must be between 0 and 1");
    }
    if (z !== undefined && (z < 0 || z > 1)) {
      throw new ValidationError("Z coordinate must be between 0 and 1");
    }
  },

  // Validate date ranges
  validateDateRange: (startDate?: string, endDate?: string) => {
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      if (start >= end) {
        throw new ValidationError("Start date must be before end date");
      }
    }
  },

  // Validate file upload
  validateFileUpload: (file: any, category: string) => {
    if (!file) {
      throw new ValidationError("No file provided");
    }

    // Validate file type
    if (!fileValidation.validateFileType(file.mimetype, category)) {
      const allowedTypes = fileValidation.allowedMimeTypes[category as keyof typeof fileValidation.allowedMimeTypes];
      throw new ValidationError(
        `Invalid file type for ${category}. Allowed types: ${allowedTypes?.join(', ')}`,
        { category, mimetype: file.mimetype, allowedTypes }
      );
    }

    // Validate file size
    if (!fileValidation.validateFileSize(file.size, category)) {
      const limit = fileValidation.sizeLimits[category as keyof typeof fileValidation.sizeLimits] 
                   || fileValidation.sizeLimits.default;
      throw new ValidationError(
        `File too large for ${category}. Maximum size: ${fileValidation.getHumanFileSize(limit)}`,
        { 
          category, 
          fileSize: file.size, 
          maxSize: limit,
          humanFileSize: fileValidation.getHumanFileSize(file.size),
          humanMaxSize: fileValidation.getHumanFileSize(limit)
        }
      );
    }

    return true;
  }
};

// Export everything for easy access
export default {
  commonSchemas,
  fileValidation,
  sanitization,
  buildManagementSchemas,
  validationHelpers
}; 