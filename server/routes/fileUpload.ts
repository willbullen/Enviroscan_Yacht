import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import sharp from "sharp";
import { z } from "zod";
import { promisify } from "util";
import crypto from "crypto";

const router = Router();

// Ensure upload directories exist
const uploadDirs = [
  'uploads/drawings',
  'uploads/documents', 
  'uploads/issue-photos',
  'uploads/3d-models',
  'uploads/temp',
  'uploads/thumbnails'
];

uploadDirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// File type configurations
const fileTypeConfig = {
  drawings: {
    maxSize: 50 * 1024 * 1024, // 50MB
    allowedTypes: ['.dwg', '.pdf', '.jpg', '.jpeg', '.png', '.tiff', '.svg'],
    mimeTypes: [
      'application/pdf',
      'image/jpeg',
      'image/png', 
      'image/tiff',
      'image/svg+xml',
      'application/acad',
      'application/dwg'
    ]
  },
  documents: {
    maxSize: 100 * 1024 * 1024, // 100MB
    allowedTypes: ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.txt'],
    mimeTypes: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'text/plain'
    ]
  },
  'issue-photos': {
    maxSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: ['.jpg', '.jpeg', '.png', '.webp'],
    mimeTypes: ['image/jpeg', 'image/png', 'image/webp']
  },
  '3d-models': {
    maxSize: 200 * 1024 * 1024, // 200MB  
    allowedTypes: ['.obj', '.fbx', '.dae', '.gltf', '.glb', '.3ds', '.ply'],
    mimeTypes: [
      'application/octet-stream',
      'model/obj',
      'model/gltf+json',
      'model/gltf-binary'
    ]
  }
};

// Generate unique filename
const generateUniqueFilename = (originalName: string): string => {
  const ext = path.extname(originalName);
  const timestamp = Date.now();
  const random = crypto.randomBytes(8).toString('hex');
  return `${timestamp}-${random}${ext}`;
};

// File validation function
const validateFile = (file: Express.Multer.File, category: string): { valid: boolean; error?: string } => {
  const config = fileTypeConfig[category as keyof typeof fileTypeConfig];
  
  if (!config) {
    return { valid: false, error: 'Invalid file category' };
  }
  
  if (file.size > config.maxSize) {
    return { valid: false, error: `File size exceeds limit of ${config.maxSize / 1024 / 1024}MB` };
  }
  
  const ext = path.extname(file.originalname).toLowerCase();
  if (!config.allowedTypes.includes(ext)) {
    return { valid: false, error: `File type ${ext} not allowed for ${category}` };
  }
  
  if (!config.mimeTypes.includes(file.mimetype)) {
    return { valid: false, error: `MIME type ${file.mimetype} not allowed` };
  }
  
  return { valid: true };
};

// Generate thumbnail for images
const generateThumbnail = async (inputPath: string, outputPath: string): Promise<void> => {
  try {
    await sharp(inputPath)
      .resize(300, 300, { 
        fit: 'inside',
        withoutEnlargement: true 
      })
      .jpeg({ quality: 80 })
      .toFile(outputPath);
  } catch (error) {
    console.error('Failed to generate thumbnail:', error);
    throw error;
  }
};

// Configure multer for file uploads
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const category = req.params.category || 'temp';
      const uploadDir = `uploads/${category}`;
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const uniqueName = generateUniqueFilename(file.originalname);
      cb(null, uniqueName);
    }
  }),
  limits: {
    fileSize: 200 * 1024 * 1024 // Max 200MB (will be checked per category)
  }
});

// Upload validation schema
const uploadSchema = z.object({
  category: z.enum(['drawings', 'documents', 'issue-photos', '3d-models']),
  projectId: z.string().optional(),
  issueId: z.string().optional(),
  metadata: z.string().optional() // JSON string
});

// Single file upload endpoint
router.post('/upload/:category', upload.single('file'), async (req, res) => {
  try {
    const { category } = uploadSchema.parse(req.params);
    const file = req.file;
    
    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    // Validate file
    const validation = validateFile(file, category);
    if (!validation.valid) {
      // Clean up uploaded file
      fs.unlinkSync(file.path);
      return res.status(400).json({ error: validation.error });
    }
    
    // Parse metadata if provided
    let metadata = {};
    if (req.body.metadata) {
      try {
        metadata = JSON.parse(req.body.metadata);
      } catch (error) {
        console.error('Invalid metadata JSON:', error);
      }
    }
    
    // Generate thumbnail for images
    let thumbnailPath = null;
    if (category === 'issue-photos' || (category === 'drawings' && file.mimetype.startsWith('image/'))) {
      const thumbnailName = `thumb_${file.filename}`;
      thumbnailPath = path.join('uploads/thumbnails', thumbnailName);
      
      try {
        await generateThumbnail(file.path, thumbnailPath);
      } catch (error) {
        console.error('Thumbnail generation failed:', error);
        // Continue without thumbnail
      }
    }
    
    // File upload response
    const response = {
      id: crypto.randomBytes(16).toString('hex'),
      originalName: file.originalname,
      fileName: file.filename,
      filePath: file.path,
      fileSize: file.size,
      mimeType: file.mimetype,
      category,
      thumbnailPath,
      uploadedAt: new Date().toISOString(),
      metadata,
      url: `/api/files/${category}/${file.filename}`
    };
    
    res.json(response);
    
  } catch (error) {
    console.error('Upload error:', error);
    
    // Clean up file if it exists
    if (req.file) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (cleanupError) {
        console.error('Failed to cleanup file:', cleanupError);
      }
    }
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid upload parameters', details: error.errors });
    }
    
    res.status(500).json({ error: 'Upload failed' });
  }
});

// Multiple file upload endpoint
router.post('/upload-multiple/:category', upload.array('files', 20), async (req, res) => {
  try {
    const { category } = uploadSchema.parse(req.params);
    const files = req.files as Express.Multer.File[];
    
    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }
    
    const results = [];
    const errors = [];
    
    for (const file of files) {
      try {
        // Validate each file
        const validation = validateFile(file, category);
        if (!validation.valid) {
          fs.unlinkSync(file.path);
          errors.push({
            fileName: file.originalname,
            error: validation.error
          });
          continue;
        }
        
        // Generate thumbnail for images
        let thumbnailPath = null;
        if (category === 'issue-photos' || (category === 'drawings' && file.mimetype.startsWith('image/'))) {
          const thumbnailName = `thumb_${file.filename}`;
          thumbnailPath = path.join('uploads/thumbnails', thumbnailName);
          
          try {
            await generateThumbnail(file.path, thumbnailPath);
          } catch (error) {
            console.error('Thumbnail generation failed:', error);
          }
        }
        
        results.push({
          id: crypto.randomBytes(16).toString('hex'),
          originalName: file.originalname,
          fileName: file.filename,
          filePath: file.path,
          fileSize: file.size,
          mimeType: file.mimetype,
          category,
          thumbnailPath,
          uploadedAt: new Date().toISOString(),
          url: `/api/files/${category}/${file.filename}`
        });
        
      } catch (error) {
        console.error(`Error processing file ${file.originalname}:`, error);
        fs.unlinkSync(file.path);
        errors.push({
          fileName: file.originalname,
          error: 'Processing failed'
        });
      }
    }
    
    res.json({
      uploaded: results,
      errors: errors,
      totalUploaded: results.length,
      totalErrors: errors.length
    });
    
  } catch (error) {
    console.error('Multiple upload error:', error);
    
    // Clean up all uploaded files
    if (req.files) {
      (req.files as Express.Multer.File[]).forEach(file => {
        try {
          fs.unlinkSync(file.path);
        } catch (cleanupError) {
          console.error('Failed to cleanup file:', cleanupError);
        }
      });
    }
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid upload parameters', details: error.errors });
    }
    
    res.status(500).json({ error: 'Multiple upload failed' });
  }
});

// File download/serve endpoint
router.get('/files/:category/:filename', (req, res) => {
  try {
    const { category, filename } = req.params;
    const filePath = path.join('uploads', category, filename);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    // Set appropriate headers
    const ext = path.extname(filename).toLowerCase();
    const stat = fs.statSync(filePath);
    
    res.setHeader('Content-Length', stat.size);
    res.setHeader('Last-Modified', stat.mtime.toUTCString());
    
    // Set content type based on extension
    if (['.jpg', '.jpeg'].includes(ext)) res.setHeader('Content-Type', 'image/jpeg');
    else if (ext === '.png') res.setHeader('Content-Type', 'image/png');
    else if (ext === '.pdf') res.setHeader('Content-Type', 'application/pdf');
    else if (ext === '.dwg') res.setHeader('Content-Type', 'application/dwg');
    
    // Stream the file
    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
    
  } catch (error) {
    console.error('File serve error:', error);
    res.status(500).json({ error: 'Failed to serve file' });
  }
});

// Thumbnail endpoint
router.get('/thumbnails/:filename', (req, res) => {
  try {
    const { filename } = req.params;
    const thumbnailPath = path.join('uploads/thumbnails', filename);
    
    if (!fs.existsSync(thumbnailPath)) {
      return res.status(404).json({ error: 'Thumbnail not found' });
    }
    
    res.setHeader('Content-Type', 'image/jpeg');
    const stream = fs.createReadStream(thumbnailPath);
    stream.pipe(res);
    
  } catch (error) {
    console.error('Thumbnail serve error:', error);
    res.status(500).json({ error: 'Failed to serve thumbnail' });
  }
});

// Delete file endpoint
router.delete('/files/:category/:filename', async (req, res) => {
  try {
    const { category, filename } = req.params;
    const filePath = path.join('uploads', category, filename);
    const thumbnailPath = path.join('uploads/thumbnails', `thumb_${filename}`);
    
    // Delete main file
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    
    // Delete thumbnail if exists
    if (fs.existsSync(thumbnailPath)) {
      fs.unlinkSync(thumbnailPath);
    }
    
    res.json({ message: 'File deleted successfully' });
    
  } catch (error) {
    console.error('File deletion error:', error);
    res.status(500).json({ error: 'Failed to delete file' });
  }
});

// Get file info endpoint
router.get('/info/:category/:filename', (req, res) => {
  try {
    const { category, filename } = req.params;
    const filePath = path.join('uploads', category, filename);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    const stat = fs.statSync(filePath);
    const thumbnailPath = path.join('uploads/thumbnails', `thumb_${filename}`);
    
    res.json({
      fileName: filename,
      fileSize: stat.size,
      uploadedAt: stat.birthtime.toISOString(),
      modifiedAt: stat.mtime.toISOString(),
      category,
      hasThumbnail: fs.existsSync(thumbnailPath),
      url: `/api/files/${category}/${filename}`,
      thumbnailUrl: fs.existsSync(thumbnailPath) ? `/api/thumbnails/thumb_${filename}` : null
    });
    
  } catch (error) {
    console.error('File info error:', error);
    res.status(500).json({ error: 'Failed to get file info' });
  }
});

export default router; 