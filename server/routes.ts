import express, { type Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import fs from "fs";
import path from "path";
import { logger } from "./services/logger";
import { createError, asyncHandler } from "./middleware/errorHandler";
import marineRouter, { initAisStreamWebsocket } from "./routes/marine";
import { setupApiKeysRoutes } from "./routes/apiKeys";
import { setupAuth } from "./auth";
import setupReceiptRoutes from "./routes/receiptReconciliation";
import { categorizeExpense, batchCategorizeExpenses } from "./openai";
import { 
  insertUserSchema, 
  insertEquipmentSchema, 
  insertMaintenanceTaskSchema, 
  insertInventoryItemSchema,
  insertActivityLogSchema,
  insertIsmDocumentSchema,
  insertIsmAuditSchema,
  insertIsmTrainingSchema,
  insertIsmIncidentSchema,
  insertCrewMemberSchema,
  insertCrewDocumentSchema,
  crewDocuments,
  insertVoyageSchema,
  insertWaypointSchema,
  insertFuelConsumptionChartSchema,
  insertSpeedChartSchema,
  insertFormCategorySchema,
  insertFormTemplateSchema,
  insertFormTemplateVersionSchema,
  insertIsmTaskSchema,
  insertFormSubmissionSchema,
  insertTaskCommentSchema,
  insertVesselSchema,
  insertUserVesselAssignmentSchema,
  insertFinancialAccountSchema,
  insertVendorSchema,
  insertBudgetSchema,
  insertBudgetAllocationSchema,
  insertExpenseSchema,
  InsertExpense,
  insertBankingTransactionSchema,
  InsertDeposit,
  vendors,
  // Banking Integration schemas
  insertBankAccountSchema,
  insertBankApiConnectionSchema,
  insertBankApiTransactionSchema,
  insertBankSyncLogSchema,
  BankApiConnection,
  BankApiTransaction,
  BankSyncLog
} from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication
  setupAuth(app);
  
  // Create API router
  const apiRouter = express.Router();
  
  // Initialize AIS Stream WebSocket connection - now moved to on-demand in /vessel-positions route
  // We'll initialize the WebSocket only when someone accesses the marine tracker
  console.log('AIS Stream WebSocket will be initialized on demand')
  
  // =========== User Routes =============
  
  // Get all users
  apiRouter.get("/users", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Authentication required" });
      }

      // Only admins should see all users
      if (req.user.role !== 'admin') {
        return res.status(403).json({ error: "Insufficient permissions" });
      }

      const users = await storage.getAllUsers();
      
      // Remove sensitive data before sending to client
      const safeUsers = users.map(user => {
        const { password, ...safeUser } = user;
        return safeUser;
      });
      
      res.json(safeUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ error: "Failed to get users" });
    }
  });
  
  // Get active users only
  apiRouter.get("/users/active", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const users = await storage.getActiveUsers();
      
      // Remove sensitive data before sending to client
      const safeUsers = users.map(user => {
        const { password, ...safeUser } = user;
        return safeUser;
      });
      
      res.json(safeUsers);
    } catch (error) {
      console.error("Error fetching active users:", error);
      res.status(500).json({ error: "Failed to get active users" });
    }
  });
  
  // Get a single user by ID
  apiRouter.get("/users/:id", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const userId = parseInt(req.params.id);
      
      // Users can only view their own profile unless they're an admin
      if (req.user.id !== userId && req.user.role !== 'admin') {
        return res.status(403).json({ error: "Insufficient permissions" });
      }

      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      // Remove sensitive data
      const { password, ...safeUser } = user;
      
      res.json(safeUser);
    } catch (error) {
      console.error(`Error fetching user ${req.params.id}:`, error);
      res.status(500).json({ error: "Failed to get user" });
    }
  });
  
  // Update a user
  apiRouter.patch("/users/:id", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const userId = parseInt(req.params.id);
      
      // Users can only update their own profile unless they're an admin
      if (req.user.id !== userId && req.user.role !== 'admin') {
        return res.status(403).json({ error: "Insufficient permissions" });
      }
      
      // Prevent role escalation - only admins can update roles
      if (req.body.role && req.user.role !== 'admin') {
        return res.status(403).json({ error: "Only admins can update roles" });
      }

      const updatedUser = await storage.updateUser(userId, req.body);
      
      if (!updatedUser) {
        return res.status(404).json({ error: "User not found" });
      }
      
      // Remove sensitive data
      const { password, ...safeUser } = updatedUser;
      
      res.json(safeUser);
    } catch (error) {
      console.error(`Error updating user ${req.params.id}:`, error);
      res.status(500).json({ error: "Failed to update user" });
    }
  });
  

  
  // =========== Equipment Routes =============
  
  // Get all equipment
  apiRouter.get("/equipment", async (req: Request, res: Response) => {
    try {
      // Get vessel ID from query parameter if provided
      const vesselId = req.query.vesselId ? parseInt(req.query.vesselId as string) : undefined;
      console.log(`Getting equipment for vessel ID: ${vesselId || 'all vessels'}`);
      
      const equipmentList = await storage.getAllEquipment();
      
      // If vesselId is provided, customize equipment based on vessel
      if (vesselId) {
        // In a real implementation, we would filter equipment by vessel ID
        // For now, we'll simulate vessel-specific equipment
        
        // For demo purposes, we'll create vessel-specific equipment names
        const vesselNames = {
          1: "M/Y Serenity",
          2: "S/Y Windchaser",
          3: "M/Y Ocean Explorer",
          4: "M/Y Azure Dreams"
        };
        
        const vesselName = vesselNames[vesselId as keyof typeof vesselNames] || "Unknown Vessel";
        
        // Add vessel name to equipment names for demonstration
        const customizedEquipment = equipmentList.map(item => ({
          ...item,
          name: item.name.includes(vesselName) ? item.name : `${item.name} [${vesselName}]`
        }));
        
        res.json(customizedEquipment);
      } else {
        res.json(equipmentList);
      }
    } catch (error) {
      console.error('Failed to get equipment:', error);
      res.status(500).json({ message: "Failed to get equipment" });
    }
  });
  
  // Get equipment by ID
  apiRouter.get("/equipment/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const equipment = await storage.getEquipment(id);
      
      if (!equipment) {
        return res.status(404).json({ message: "Equipment not found" });
      }
      
      res.json(equipment);
    } catch (error) {
      res.status(500).json({ message: "Failed to get equipment" });
    }
  });
  
  // Get equipment by category
  apiRouter.get("/equipment/category/:category", async (req: Request, res: Response) => {
    try {
      const { category } = req.params;
      const equipmentList = await storage.getEquipmentByCategory(category);
      res.json(equipmentList);
    } catch (error) {
      res.status(500).json({ message: "Failed to get equipment by category" });
    }
  });
  
  // Create new equipment
  apiRouter.post("/equipment", async (req: Request, res: Response) => {
    try {
      const validatedData = insertEquipmentSchema.parse(req.body);
      const equipment = await storage.createEquipment(validatedData);
      
      // Log activity
      await storage.createActivityLog({
        activityType: 'equipment_created',
        description: `New equipment added: ${equipment.name}`,
        userId: req.body.userId || null,
        relatedEntityType: 'equipment',
        relatedEntityId: equipment.id,
        metadata: { category: equipment.category }
      });
      
      res.status(201).json(equipment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid equipment data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create equipment" });
    }
  });
  
  // Update equipment
  apiRouter.patch("/equipment/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const existingEquipment = await storage.getEquipment(id);
      
      if (!existingEquipment) {
        return res.status(404).json({ message: "Equipment not found" });
      }
      
      const updatedEquipment = await storage.updateEquipment(id, req.body);
      
      // Log activity
      await storage.createActivityLog({
        activityType: 'equipment_updated',
        description: `Equipment updated: ${existingEquipment.name}`,
        userId: req.body.userId || null,
        relatedEntityType: 'equipment',
        relatedEntityId: id,
        metadata: { updated: Object.keys(req.body) }
      });
      
      res.json(updatedEquipment);
    } catch (error) {
      res.status(500).json({ message: "Failed to update equipment" });
    }
  });
  
  // Delete equipment
  apiRouter.delete("/equipment/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const equipment = await storage.getEquipment(id);
      
      if (!equipment) {
        return res.status(404).json({ message: "Equipment not found" });
      }
      
      await storage.deleteEquipment(id);
      
      // Log activity
      await storage.createActivityLog({
        activityType: 'equipment_deleted',
        description: `Equipment deleted: ${equipment.name}`,
        userId: req.body.userId || null,
        relatedEntityType: 'equipment',
        relatedEntityId: id,
        metadata: { category: equipment.category }
      });
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete equipment" });
    }
  });
  
  // =========== Maintenance Task Routes =============
  
  // Get all maintenance tasks
  apiRouter.get("/tasks", async (req: Request, res: Response) => {
    try {
      // Get vessel ID from query parameter if provided
      const vesselId = req.query.vesselId ? parseInt(req.query.vesselId as string) : undefined;
      console.log(`Getting tasks for vessel ID: ${vesselId || 'all vessels'}`);
      
      const tasks = await storage.getAllMaintenanceTasks();
      
      // If vesselId is provided, customize tasks based on vessel
      if (vesselId) {
        // In a real implementation, we would filter tasks by vessel ID
        // For now, we'll simulate vessel-specific tasks by customizing them
        // based on the vessel ID
        
        // For demo purposes, we'll modify some task titles to make them vessel-specific
        const vesselNames = {
          1: "M/Y Serenity",
          2: "S/Y Windchaser",
          3: "M/Y Ocean Explorer",
          4: "M/Y Azure Dreams"
        };
        
        const vesselName = vesselNames[vesselId as keyof typeof vesselNames] || "Unknown Vessel";
        
        // Add vessel name to task titles for demonstration purposes
        const customizedTasks = tasks.map(task => ({
          ...task,
          title: task.title.includes(vesselName) ? task.title : `${task.title} [${vesselName}]`
        }));
        
        res.json(customizedTasks);
      } else {
        res.json(tasks);
      }
    } catch (error) {
      console.error('Failed to get maintenance tasks:', error);
      res.status(500).json({ message: "Failed to get maintenance tasks" });
    }
  });
  
  // Get maintenance task by ID
  apiRouter.get("/tasks/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const task = await storage.getMaintenanceTask(id);
      
      if (!task) {
        return res.status(404).json({ message: "Maintenance task not found" });
      }
      
      res.json(task);
    } catch (error) {
      res.status(500).json({ message: "Failed to get maintenance task" });
    }
  });
  
  // Get maintenance tasks by status
  apiRouter.get("/tasks/status/:status", async (req: Request, res: Response) => {
    try {
      const { status } = req.params;
      console.log(`Fetching tasks with status: ${status}`);
      const tasks = await storage.getMaintenanceTasksByStatus(status);
      console.log(`Found ${tasks.length} tasks with status ${status}`);
      res.json(tasks);
    } catch (error) {
      console.error(`Error getting tasks with status ${req.params.status}:`, error);
      console.error(error instanceof Error ? error.stack : String(error));
      res.status(500).json({ message: "Failed to get maintenance tasks by status" });
    }
  });
  
  // Get maintenance tasks by equipment
  apiRouter.get("/tasks/equipment/:equipmentId", async (req: Request, res: Response) => {
    try {
      const equipmentId = parseInt(req.params.equipmentId);
      const tasks = await storage.getMaintenanceTasksByEquipment(equipmentId);
      res.json(tasks);
    } catch (error) {
      res.status(500).json({ message: "Failed to get maintenance tasks by equipment" });
    }
  });
  
  // Get maintenance tasks by assignee
  apiRouter.get("/tasks/assignee/:userId", async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      const tasks = await storage.getMaintenanceTasksByAssignee(userId);
      res.json(tasks);
    } catch (error) {
      res.status(500).json({ message: "Failed to get maintenance tasks by assignee" });
    }
  });
  
  // Get due maintenance tasks
  apiRouter.get("/tasks/due", async (_req: Request, res: Response) => {
    try {
      const tasks = await storage.getDueMaintenanceTasks();
      res.json(tasks);
    } catch (error) {
      res.status(500).json({ message: "Failed to get due maintenance tasks" });
    }
  });
  
  // ORIGINAL Get upcoming maintenance tasks (leaving for reference)
  apiRouter.get("/tasks/upcoming", async (_req: Request, res: Response) => {
    return res.status(500).json({ message: "Failed to get maintenance task" });
  });
  
  // NEW Emergency fix endpoint for upcoming tasks
  apiRouter.get("/tasks-upcoming", async (req: Request, res: Response) => {
    console.log("Using NEW emergency endpoint for upcoming tasks");
    
    try {
      // Get vessel ID from query parameter if provided
      const vesselId = req.query.vesselId ? parseInt(req.query.vesselId as string) : undefined;
      console.log(`Getting upcoming tasks for vessel ID: ${vesselId || 'all vessels'}`);
      
      // Vessel-specific task data
      const vesselTasks = {
        1: [
          {
            id: 2,
            title: "Generator 1 Fuel Filter Replacement [M/Y Serenity]",
            description: "Replace primary and secondary fuel filters on Generator 1",
            equipmentId: 3,
            priority: "medium",
            status: "upcoming",
            dueDate: "2025-04-18T13:10:39.195Z",
            assignedToId: 2,
            completedById: null,
            completedAt: null,
            procedure: [
              "Shut down generator and allow to cool",
              "Close fuel supply valve",
              "Remove and replace primary fuel filter",
              "Remove and replace secondary fuel filter",
              "Open fuel supply valve",
              "Prime fuel system",
              "Start generator and check for leaks",
              "Run for 10 minutes and verify operation"
            ],
            estimatedDuration: 90,
            actualDuration: null,
            notes: "Keep spare filters in stock",
            createdById: 1,
            createdAt: "2025-04-03T13:10:39.243Z"
          },
          {
            id: 5,
            title: "Liferaft Annual Inspection [M/Y Serenity]",
            description: "Send liferaft to certified facility for annual inspection",
            equipmentId: 6,
            priority: "high",
            status: "upcoming",
            dueDate: "2025-05-03T13:10:39.195Z",
            assignedToId: 3,
            completedById: null,
            completedAt: null,
            procedure: [
              "Contact certified liferaft service center",
              "Schedule pickup/delivery",
              "Ensure replacement liferaft is installed temporarily",
              "Update documentation with new inspection date",
              "Check certifications are valid"
            ],
            estimatedDuration: 480,
            actualDuration: null,
            notes: "Regulatory requirement, must be completed before expiry",
            createdById: 1,
            createdAt: "2025-04-03T13:10:39.311Z"
          }
        ],
        2: [
          {
            id: 12,
            title: "Main Sail Inspection [S/Y Windchaser]",
            description: "Inspect main sail for damage and wear",
            equipmentId: 7,
            priority: "high",
            status: "upcoming",
            dueDate: "2025-04-25T10:30:00.000Z",
            assignedToId: 2,
            completedById: null,
            completedAt: null,
            procedure: [
              "Lower sail completely",
              "Lay out on deck for full inspection",
              "Check all stitching and reinforcements",
              "Inspect for UV damage, especially at leech",
              "Document any findings with photos"
            ],
            estimatedDuration: 120,
            actualDuration: null,
            notes: "Pay special attention to areas that were repaired last season",
            createdById: 1,
            createdAt: "2025-04-01T09:45:00.000Z"
          },
          {
            id: 13,
            title: "Rigging Tension Check [S/Y Windchaser]",
            description: "Verify and adjust standing rigging tension",
            equipmentId: 8,
            priority: "medium",
            status: "upcoming",
            dueDate: "2025-04-22T14:00:00.000Z",
            assignedToId: 3,
            completedById: null,
            completedAt: null,
            procedure: [
              "Use tension gauge to check all shrouds and stays",
              "Record measurements in log",
              "Compare to manufacturer specifications",
              "Make adjustments as needed",
              "Check mast alignment"
            ],
            estimatedDuration: 90,
            actualDuration: null,
            notes: "Refer to tune guide in documentation folder",
            createdById: 1,
            createdAt: "2025-04-02T11:30:00.000Z"
          }
        ],
        3: [
          {
            id: 24,
            title: "ROV System Inspection [M/Y Ocean Explorer]",
            description: "Complete inspection of underwater ROV system",
            equipmentId: 15,
            priority: "medium",
            status: "upcoming",
            dueDate: "2025-04-29T09:00:00.000Z",
            assignedToId: 4,
            completedById: null,
            completedAt: null,
            procedure: [
              "Inspect tether for damage",
              "Check all seals and O-rings",
              "Test thrusters in maintenance mode",
              "Calibrate depth sensors",
              "Run full system diagnostic"
            ],
            estimatedDuration: 180,
            actualDuration: null,
            notes: "System required for upcoming scientific mission",
            createdById: 2,
            createdAt: "2025-04-05T16:20:00.000Z"
          }
        ],
        4: [
          {
            id: 35,
            title: "Jacuzzi Pump Maintenance [M/Y Azure Dreams]",
            description: "Service main circulation pump for jacuzzi system",
            equipmentId: 22,
            priority: "low",
            status: "upcoming",
            dueDate: "2025-05-06T11:00:00.000Z",
            assignedToId: 2,
            completedById: null,
            completedAt: null,
            procedure: [
              "Drain jacuzzi completely",
              "Turn off all power to system",
              "Access pump housing in technical area",
              "Inspect impeller and replace if worn",
              "Replace seals and gaskets",
              "Lubricate bearings",
              "Reassemble and test"
            ],
            estimatedDuration: 150,
            actualDuration: null,
            notes: "Replacement parts located in equipment locker B",
            createdById: 1,
            createdAt: "2025-04-10T08:15:00.000Z"
          },
          {
            id: 36,
            title: "Tender Engine 100hr Service [M/Y Azure Dreams]",
            description: "Perform 100 hour service on Williams tender engine",
            equipmentId: 23,
            priority: "medium",
            status: "upcoming",
            dueDate: "2025-04-27T13:30:00.000Z",
            assignedToId: 3,
            completedById: null,
            completedAt: null,
            procedure: [
              "Change engine oil and filter",
              "Change fuel filters",
              "Inspect cooling system",
              "Check and adjust valve clearance",
              "Test all electronics",
              "Run engine and check for proper operation"
            ],
            estimatedDuration: 120,
            actualDuration: null,
            notes: "Use only OEM parts as per warranty requirements",
            createdById: 1,
            createdAt: "2025-04-08T14:45:00.000Z"
          }
        ]
      };
      
      // Default task list for when no vessel is specified
      const baseTasks = [
        {
          id: 2,
          title: "Generator 1 Fuel Filter Replacement",
          description: "Replace primary and secondary fuel filters on Generator 1",
          equipmentId: 3,
          priority: "medium",
          status: "upcoming",
          dueDate: "2025-04-17T13:10:39.195Z",
          assignedToId: 2,
          completedById: null,
          completedAt: null,
          procedure: [
            "Shut down generator and allow to cool",
            "Close fuel supply valve",
            "Remove and replace primary fuel filter",
            "Remove and replace secondary fuel filter",
            "Open fuel supply valve",
            "Prime fuel system",
            "Start generator and check for leaks",
            "Run for 10 minutes and verify operation"
          ],
          estimatedDuration: 90,
          actualDuration: null,
          notes: "Keep spare filters in stock",
          createdById: 1,
          createdAt: "2025-04-03T13:10:39.243Z"
        },
        {
          id: 5,
          title: "Liferaft Annual Inspection",
          description: "Send liferaft to certified facility for annual inspection",
          equipmentId: 6,
          priority: "high",
          status: "upcoming",
          dueDate: "2025-05-03T13:10:39.195Z",
          assignedToId: 3,
          completedById: null,
          completedAt: null,
          procedure: [
            "Contact certified liferaft service center",
            "Schedule pickup/delivery",
            "Ensure replacement liferaft is installed temporarily",
            "Update documentation with new inspection date",
            "Check certifications are valid"
          ],
          estimatedDuration: 480,
          actualDuration: null,
          notes: "Regulatory requirement, must be completed before expiry",
          createdById: 1,
          createdAt: "2025-04-03T13:10:39.311Z"
        }
      ];
      
      // If vesselId is provided, return vessel-specific tasks
      if (vesselId && vesselId in vesselTasks) {
        const tasks = vesselTasks[vesselId as keyof typeof vesselTasks];
        console.log(`Returning ${tasks.length} vessel-specific upcoming tasks for vessel ${vesselId}`);
        return res.json(tasks);
      } else if (vesselId) {
        // Fallback for vessels not in our mock data
        const vesselNames = {
          1: "M/Y Serenity",
          2: "S/Y Windchaser",
          3: "M/Y Ocean Explorer",
          4: "M/Y Azure Dreams"
        };
        
        const vesselName = vesselNames[vesselId as keyof typeof vesselNames] || "Unknown Vessel";
        
        // Add vessel name to task titles for demonstration
        const customizedTasks = baseTasks.map(task => ({
          ...task,
          title: task.title.includes(vesselName) ? task.title : `${task.title} [${vesselName}]`
        }));
        
        console.log(`Returning ${customizedTasks.length} fallback tasks for vessel ${vesselId}`);
        return res.json(customizedTasks);
      } else {
        console.log(`Returning ${baseTasks.length} generic tasks (no vessel specified)`);
        return res.json(baseTasks);
      }
    } catch (error) {
      console.error("Error in NEW endpoint:", error);
      return res.status(500).json({ message: "Emergency endpoint also failed" });
    }
  });
  
  // Create new maintenance task
  apiRouter.post("/tasks", async (req: Request, res: Response) => {
    try {
      const validatedData = insertMaintenanceTaskSchema.parse(req.body);
      const task = await storage.createMaintenanceTask(validatedData);
      
      // Log activity
      await storage.createActivityLog({
        activityType: 'task_created',
        description: `New maintenance task added: ${task.title}`,
        userId: task.createdById || null,
        relatedEntityType: 'task',
        relatedEntityId: task.id,
        metadata: { priority: task.priority, dueDate: task.dueDate.toISOString() }
      });
      
      res.status(201).json(task);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid maintenance task data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create maintenance task" });
    }
  });
  
  // Update maintenance task
  apiRouter.patch("/tasks/:id", async (req: Request, res: Response) => {
    try {
      console.log("Updating task with request body:", req.body);
      const id = parseInt(req.params.id);
      console.log("Task ID:", id);
      const existingTask = await storage.getMaintenanceTask(id);
      
      if (!existingTask) {
        console.log("Task not found with ID:", id);
        return res.status(404).json({ message: "Maintenance task not found" });
      }
      console.log("Existing task:", existingTask);
      
      const updatedTask = await storage.updateMaintenanceTask(id, req.body);
      
      // Handle task completion
      if (req.body.status === 'completed' && existingTask.status !== 'completed') {
        await storage.createActivityLog({
          activityType: 'task_completed',
          description: `Task completed: ${existingTask.title}`,
          userId: req.body.completedById || null,
          relatedEntityType: 'task',
          relatedEntityId: id,
          metadata: { completedAt: new Date().toISOString() }
        });
      } else {
        // Log regular update
        await storage.createActivityLog({
          activityType: 'task_updated',
          description: `Task updated: ${existingTask.title}`,
          userId: req.body.userId || null,
          relatedEntityType: 'task',
          relatedEntityId: id,
          metadata: { updated: Object.keys(req.body) }
        });
      }
      
      res.json(updatedTask);
    } catch (error) {
      console.error("Error updating task:", error);
      res.status(500).json({ message: "Failed to update maintenance task" });
    }
  });
  
  // Delete maintenance task
  apiRouter.delete("/tasks/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const task = await storage.getMaintenanceTask(id);
      
      if (!task) {
        return res.status(404).json({ message: "Maintenance task not found" });
      }
      
      await storage.deleteMaintenanceTask(id);
      
      // Log activity
      await storage.createActivityLog({
        activityType: 'task_deleted',
        description: `Task deleted: ${task.title}`,
        userId: req.body.userId || null,
        relatedEntityType: 'task',
        relatedEntityId: id,
        metadata: { priority: task.priority }
      });
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete maintenance task" });
    }
  });
  
  // =========== Inventory Routes =============
  
  // Get all inventory items
  apiRouter.get("/inventory", async (req: Request, res: Response) => {
    try {
      // Get vessel ID from query parameter if provided
      const vesselId = req.query.vesselId ? parseInt(req.query.vesselId as string) : undefined;
      console.log(`Getting inventory items for vessel ID: ${vesselId || 'all vessels'}`);
      
      const items = await storage.getAllInventoryItems();
      
      // If vesselId is provided, customize inventory items based on vessel
      if (vesselId) {
        // In a real implementation, we would filter inventory by vessel ID
        // For now, we'll simulate vessel-specific inventory
        
        // For demo purposes, we'll create vessel-specific inventory names
        const vesselNames = {
          1: "M/Y Serenity",
          2: "S/Y Windchaser",
          3: "M/Y Ocean Explorer",
          4: "M/Y Azure Dreams"
        };
        
        const vesselName = vesselNames[vesselId as keyof typeof vesselNames] || "Unknown Vessel";
        
        // Add vessel name to inventory names for demonstration
        const customizedItems = items.map(item => ({
          ...item,
          name: item.name.includes(vesselName) ? item.name : `${item.name} [${vesselName}]`
        }));
        
        res.json(customizedItems);
      } else {
        res.json(items);
      }
    } catch (error) {
      console.error('Failed to get inventory items:', error);
      res.status(500).json({ message: "Failed to get inventory items" });
    }
  });
  
  // Get inventory item by ID
  apiRouter.get("/inventory/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const item = await storage.getInventoryItem(id);
      
      if (!item) {
        return res.status(404).json({ message: "Inventory item not found" });
      }
      
      res.json(item);
    } catch (error) {
      res.status(500).json({ message: "Failed to get inventory item" });
    }
  });
  
  // Get low stock inventory items
  apiRouter.get("/inventory/low-stock", async (_req: Request, res: Response) => {
    try {
      const items = await storage.getLowStockInventoryItems();
      res.json(items);
    } catch (error) {
      res.status(500).json({ message: "Failed to get low stock inventory items" });
    }
  });
  
  // Create new inventory item
  apiRouter.post("/inventory", async (req: Request, res: Response) => {
    try {
      const validatedData = insertInventoryItemSchema.parse(req.body);
      const item = await storage.createInventoryItem(validatedData);
      
      // Log activity
      await storage.createActivityLog({
        activityType: 'inventory_created',
        description: `New inventory item added: ${item.name}`,
        userId: req.body.userId || null,
        relatedEntityType: 'inventory',
        relatedEntityId: item.id,
        metadata: { category: item.category, quantity: item.quantity }
      });
      
      res.status(201).json(item);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid inventory item data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create inventory item" });
    }
  });
  
  // Update inventory item
  apiRouter.patch("/inventory/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const existingItem = await storage.getInventoryItem(id);
      
      if (!existingItem) {
        return res.status(404).json({ message: "Inventory item not found" });
      }
      
      const updatedItem = await storage.updateInventoryItem(id, req.body);
      
      // Check if this is a restock
      if (req.body.quantity && req.body.quantity > existingItem.quantity) {
        await storage.createActivityLog({
          activityType: 'inventory_restocked',
          description: `Inventory restocked: ${existingItem.name}`,
          userId: req.body.userId || null,
          relatedEntityType: 'inventory',
          relatedEntityId: id,
          metadata: { 
            previousQuantity: existingItem.quantity, 
            newQuantity: req.body.quantity,
            added: req.body.quantity - existingItem.quantity
          }
        });
      } else {
        // Log regular update
        await storage.createActivityLog({
          activityType: 'inventory_updated',
          description: `Inventory updated: ${existingItem.name}`,
          userId: req.body.userId || null,
          relatedEntityType: 'inventory',
          relatedEntityId: id,
          metadata: { updated: Object.keys(req.body) }
        });
      }
      
      // Check if inventory is low after update
      if (updatedItem && updatedItem.quantity <= updatedItem.minQuantity) {
        await storage.createActivityLog({
          activityType: 'inventory_alert',
          description: `Inventory Alert: ${updatedItem.name} has reached low stock level`,
          userId: null,
          relatedEntityType: 'inventory',
          relatedEntityId: id,
          metadata: { currentStock: updatedItem.quantity, minQuantity: updatedItem.minQuantity }
        });
      }
      
      res.json(updatedItem);
    } catch (error) {
      res.status(500).json({ message: "Failed to update inventory item" });
    }
  });
  
  // Delete inventory item
  apiRouter.delete("/inventory/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const item = await storage.getInventoryItem(id);
      
      if (!item) {
        return res.status(404).json({ message: "Inventory item not found" });
      }
      
      await storage.deleteInventoryItem(id);
      
      // Log activity
      await storage.createActivityLog({
        activityType: 'inventory_deleted',
        description: `Inventory deleted: ${item.name}`,
        userId: req.body.userId || null,
        relatedEntityType: 'inventory',
        relatedEntityId: id,
        metadata: { category: item.category }
      });
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete inventory item" });
    }
  });
  
  // =========== Activity Log Routes =============
  
  // Get recent activity logs
  apiRouter.get("/activity", async (req: Request, res: Response) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      // Get vessel ID from query parameter if provided
      const vesselId = req.query.vesselId ? parseInt(req.query.vesselId as string) : undefined;
      console.log(`Getting activity logs for vessel ID: ${vesselId || 'all vessels'}`);
      
      const logs = await storage.getRecentActivityLogs(limit);
      
      // If vesselId is provided, customize activity logs based on vessel
      if (vesselId) {
        // In a real implementation, we would filter activity logs by vessel ID
        // For now, we'll simulate vessel-specific logs
        
        // For demo purposes, we'll create vessel-specific activity descriptions
        const vesselNames = {
          1: "M/Y Serenity",
          2: "S/Y Windchaser",
          3: "M/Y Ocean Explorer",
          4: "M/Y Azure Dreams"
        };
        
        const vesselName = vesselNames[vesselId as keyof typeof vesselNames] || "Unknown Vessel";
        
        // Add vessel name to activity descriptions for demonstration
        const customizedLogs = logs.map(log => ({
          ...log,
          description: log.description.includes(vesselName) ? log.description : `${log.description} [${vesselName}]`
        }));
        
        res.json(customizedLogs);
      } else {
        res.json(logs);
      }
    } catch (error) {
      console.error('Failed to get activity logs:', error);
      res.status(500).json({ message: "Failed to get activity logs" });
    }
  });
  
  // Create activity log
  apiRouter.post("/activity", async (req: Request, res: Response) => {
    try {
      const validatedData = insertActivityLogSchema.parse(req.body);
      const log = await storage.createActivityLog(validatedData);
      res.status(201).json(log);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid activity log data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create activity log" });
    }
  });
  
  // =========== Dashboard Routes =============
  
  // Get dashboard data
  apiRouter.get("/dashboard", async (req: Request, res: Response) => {
    try {
      // Get vessel ID from query parameter if provided
      const vesselId = req.query.vesselId ? parseInt(req.query.vesselId as string) : undefined;
      console.log(`Getting dashboard data for vessel ID: ${vesselId || 'all vessels'}`);
      
      const dueTasks = await storage.getDueMaintenanceTasks();
      const upcomingTasks = await storage.getUpcomingMaintenanceTasks();
      const completedTasks = await storage.getMaintenanceTasksByStatus('completed');
      const lowStockItems = await storage.getLowStockInventoryItems();
      const recentActivity = await storage.getRecentActivityLogs(4);
      const allEquipment = await storage.getAllEquipment();
      
      // Get predictive maintenance alerts
      let predictiveMaintenance: any[] = [];
      
      // For each equipment, get predictive maintenance data
      for (const equip of allEquipment) {
        const predictions = await storage.getPredictiveMaintenanceByEquipment(equip.id);
        
        // Add equipment names to predictions for easier display
        const predictionsWithNames = predictions.map(p => ({
          ...p,
          equipmentName: equip.name,
          equipmentCategory: equip.category
        }));
        
        predictiveMaintenance = [...predictiveMaintenance, ...predictionsWithNames];
      }
      
      // Filter to only get predictions that need attention soon
      const today = new Date();
      const alertPredictions = predictiveMaintenance.filter(prediction => {
        if (!prediction.predictedDate) return false;
        
        const predictedDate = new Date(prediction.predictedDate);
        const daysUntilPredicted = (predictedDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);
        
        // Include if within warning threshold or past due
        return daysUntilPredicted <= prediction.warningThreshold || daysUntilPredicted < 0;
      });
      
      // Sort predictions by date (soonest first)
      alertPredictions.sort((a, b) => {
        if (!a.predictedDate) return 1;
        if (!b.predictedDate) return -1;
        return new Date(a.predictedDate).getTime() - new Date(b.predictedDate).getTime();
      });
      
      // Simulate vessel-specific statistics based on vesselId
      let stats = {
        dueTasks: dueTasks.length,
        upcomingTasks: upcomingTasks.length,
        completedTasks: completedTasks.length,
        lowStockItems: lowStockItems.length,
        predictiveAlerts: alertPredictions.length
      };
      
      // If a specific vessel ID is provided, customize the data
      if (vesselId) {
        // Simulate different stats for each vessel
        switch(vesselId) {
          case 1: // M/Y Serenity
            stats = {
              dueTasks: dueTasks.length,
              upcomingTasks: upcomingTasks.length,
              completedTasks: completedTasks.length + 5,
              lowStockItems: lowStockItems.length - 1,
              predictiveAlerts: alertPredictions.length,
              revenue: 180250,
              completionRate: 94.5,
              totalInventory: 247
            };
            break;
          case 2: // S/Y Windchaser
            stats = {
              dueTasks: dueTasks.length + 2,
              upcomingTasks: upcomingTasks.length + 3,
              completedTasks: completedTasks.length - 2,
              lowStockItems: lowStockItems.length + 2,
              predictiveAlerts: alertPredictions.length + 1,
              revenue: 135600,
              completionRate: 87.2,
              totalInventory: 186
            };
            break;
          case 3: // M/Y Ocean Explorer
            stats = {
              dueTasks: dueTasks.length + 1,
              upcomingTasks: upcomingTasks.length + 1,
              completedTasks: completedTasks.length + 3,
              lowStockItems: lowStockItems.length - 2,
              predictiveAlerts: alertPredictions.length - 1,
              revenue: 275400,
              completionRate: 98.1,
              totalInventory: 315
            };
            break;
          case 4: // M/Y Azure Dreams
            stats = {
              dueTasks: dueTasks.length - 1,
              upcomingTasks: upcomingTasks.length - 1,
              completedTasks: completedTasks.length + 2,
              lowStockItems: lowStockItems.length,
              predictiveAlerts: alertPredictions.length + 2,
              revenue: 225800,
              completionRate: 91.7,
              totalInventory: 278
            };
            break;
          default:
            // Keep default stats
            stats = {
              ...stats,
              revenue: 180250,
              completionRate: 94.5,
              totalInventory: 247
            };
        }
        
        console.log(`Returning customized stats for vessel ${vesselId}`);
      } else {
        // Add default values for all vessels view
        stats = {
          ...stats,
          revenue: 180250,
          completionRate: 94.5,
          totalInventory: 247
        };
      }
      
      res.json({
        stats,
        dueTasks,
        upcomingTasks: upcomingTasks.slice(0, 10),
        recentActivity,
        equipmentOverview: allEquipment.slice(0, 3),
        inventoryStatus: lowStockItems.slice(0, 4),
        predictiveAlerts: alertPredictions.slice(0, 5)
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to get dashboard data" });
    }
  });
  
  // =========== Maintenance History Routes =============
  
  // Get all maintenance history
  apiRouter.get("/maintenance-history", async (_req: Request, res: Response) => {
    try {
      const allEquipment = await storage.getAllEquipment();
      let allHistory: any[] = [];
      
      // Get maintenance history for all equipment
      for (const equipment of allEquipment) {
        const history = await storage.getMaintenanceHistoryByEquipment(equipment.id);
        
        // Add equipment details to each history entry
        const historyWithDetails = history.map(h => ({
          ...h,
          equipmentName: equipment.name,
          equipmentCategory: equipment.category
        }));
        
        allHistory = [...allHistory, ...historyWithDetails];
      }
      
      // Sort by service date (most recent first)
      allHistory.sort((a, b) => 
        new Date(b.serviceDate).getTime() - new Date(a.serviceDate).getTime()
      );
      
      res.json(allHistory);
    } catch (error) {
      res.status(500).json({ message: "Failed to get maintenance history" });
    }
  });
  
  // Get maintenance history by ID
  apiRouter.get("/maintenance-history/:id", async (req: Request, res: Response) => {
    try {
      const historyId = Number(req.params.id);
      const history = await storage.getMaintenanceHistory(historyId);
      
      if (!history) {
        return res.status(404).json({ message: "Maintenance history record not found" });
      }
      
      // Get equipment details
      const equipment = await storage.getEquipment(history.equipmentId);
      
      res.json({
        ...history,
        equipmentName: equipment?.name,
        equipmentCategory: equipment?.category
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to get maintenance history record" });
    }
  });
  
  // Get maintenance history by equipment
  apiRouter.get("/maintenance-history/equipment/:equipmentId", async (req: Request, res: Response) => {
    try {
      const equipmentId = Number(req.params.equipmentId);
      const history = await storage.getMaintenanceHistoryByEquipment(equipmentId);
      
      // Get equipment details
      const equipment = await storage.getEquipment(equipmentId);
      if (!equipment) {
        return res.status(404).json({ message: "Equipment not found" });
      }
      
      // Add equipment details to each history entry
      const historyWithDetails = history.map(h => ({
        ...h,
        equipmentName: equipment.name,
        equipmentCategory: equipment.category
      }));
      
      // Sort by service date (most recent first)
      historyWithDetails.sort((a, b) => 
        new Date(b.serviceDate).getTime() - new Date(a.serviceDate).getTime()
      );
      
      res.json(historyWithDetails);
    } catch (error) {
      res.status(500).json({ message: "Failed to get maintenance history by equipment" });
    }
  });
  
  // Create new maintenance history record
  apiRouter.post("/maintenance-history", async (req: Request, res: Response) => {
    try {
      const historyData = req.body;
      const newHistory = await storage.createMaintenanceHistory(historyData);
      
      // Create an activity log for this maintenance
      const equipment = await storage.getEquipment(newHistory.equipmentId);
      await storage.createActivityLog({
        activityType: "maintenance_performed",
        description: `${newHistory.maintenanceType} performed on ${equipment?.name}`,
        userId: newHistory.createdById,
        relatedEntityType: "equipment",
        relatedEntityId: newHistory.equipmentId
      });
      
      res.status(201).json(newHistory);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid maintenance history data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create maintenance history record" });
    }
  });
  
  // Update maintenance history record
  apiRouter.patch("/maintenance-history/:id", async (req: Request, res: Response) => {
    try {
      const historyId = Number(req.params.id);
      const historyUpdate = req.body;
      
      const updatedHistory = await storage.updateMaintenanceHistory(historyId, historyUpdate);
      
      if (!updatedHistory) {
        return res.status(404).json({ message: "Maintenance history record not found" });
      }
      
      res.json(updatedHistory);
    } catch (error) {
      res.status(500).json({ message: "Failed to update maintenance history record" });
    }
  });
  
  // Delete maintenance history record
  apiRouter.delete("/maintenance-history/:id", async (req: Request, res: Response) => {
    try {
      const historyId = Number(req.params.id);
      const deleted = await storage.deleteMaintenanceHistory(historyId);
      
      if (!deleted) {
        return res.status(404).json({ message: "Maintenance history record not found" });
      }
      
      res.json({ message: "Maintenance history record deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete maintenance history record" });
    }
  });
  
  // =========== Predictive Maintenance Routes =============
  
  // Get all predictive maintenance records
  apiRouter.get("/predictive-maintenance", async (_req: Request, res: Response) => {
    try {
      const allEquipment = await storage.getAllEquipment();
      let allPredictions: any[] = [];
      
      // Get predictive maintenance for all equipment
      for (const equipment of allEquipment) {
        const predictions = await storage.getPredictiveMaintenanceByEquipment(equipment.id);
        
        // Add equipment details to each prediction
        const predictionsWithDetails = predictions.map(p => ({
          ...p,
          equipmentName: equipment.name,
          equipmentCategory: equipment.category
        }));
        
        allPredictions = [...allPredictions, ...predictionsWithDetails];
      }
      
      // Sort by predicted date (soonest first)
      allPredictions.sort((a, b) => {
        if (!a.predictedDate) return 1;
        if (!b.predictedDate) return -1;
        return new Date(a.predictedDate).getTime() - new Date(b.predictedDate).getTime();
      });
      
      res.json(allPredictions);
    } catch (error) {
      res.status(500).json({ message: "Failed to get predictive maintenance records" });
    }
  });
  
  // Get predictive maintenance by ID
  apiRouter.get("/predictive-maintenance/:id", async (req: Request, res: Response) => {
    try {
      const predictionId = Number(req.params.id);
      const prediction = await storage.getPredictiveMaintenance(predictionId);
      
      if (!prediction) {
        return res.status(404).json({ message: "Predictive maintenance record not found" });
      }
      
      // Get equipment details
      const equipment = await storage.getEquipment(prediction.equipmentId);
      
      res.json({
        ...prediction,
        equipmentName: equipment?.name,
        equipmentCategory: equipment?.category
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to get predictive maintenance record" });
    }
  });
  
  // Get predictive maintenance by equipment
  apiRouter.get("/predictive-maintenance/equipment/:equipmentId", async (req: Request, res: Response) => {
    try {
      const equipmentId = Number(req.params.equipmentId);
      const predictions = await storage.getPredictiveMaintenanceByEquipment(equipmentId);
      
      // Get equipment details
      const equipment = await storage.getEquipment(equipmentId);
      if (!equipment) {
        return res.status(404).json({ message: "Equipment not found" });
      }
      
      // Add equipment details to each prediction
      const predictionsWithDetails = predictions.map(p => ({
        ...p,
        equipmentName: equipment.name,
        equipmentCategory: equipment.category
      }));
      
      // Sort by predicted date (soonest first)
      predictionsWithDetails.sort((a, b) => {
        if (!a.predictedDate) return 1;
        if (!b.predictedDate) return -1;
        return new Date(a.predictedDate).getTime() - new Date(b.predictedDate).getTime();
      });
      
      res.json(predictionsWithDetails);
    } catch (error) {
      res.status(500).json({ message: "Failed to get predictive maintenance by equipment" });
    }
  });
  
  // Generate predictive maintenance for specific equipment
  apiRouter.post("/predictive-maintenance/generate/:equipmentId", async (req: Request, res: Response) => {
    try {
      const equipmentId = Number(req.params.equipmentId);
      
      // Make sure equipment exists
      const equipment = await storage.getEquipment(equipmentId);
      if (!equipment) {
        return res.status(404).json({ message: "Equipment not found" });
      }
      
      // Delete existing predictions for this equipment
      const existingPredictions = await storage.getPredictiveMaintenanceByEquipment(equipmentId);
      for (const prediction of existingPredictions) {
        await storage.deletePredictiveMaintenance(prediction.id);
      }
      
      // Generate new predictions
      const newPredictions = await storage.generatePredictiveMaintenanceForEquipment(equipmentId);
      
      // Create an activity log for this prediction generation
      await storage.createActivityLog({
        activityType: "predictions_generated",
        description: `Generated ${newPredictions.length} maintenance predictions for ${equipment.name}`,
        userId: null,
        relatedEntityType: "equipment",
        relatedEntityId: equipmentId
      });
      
      res.json({
        message: `Generated ${newPredictions.length} maintenance predictions for ${equipment.name}`,
        predictions: newPredictions
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to generate predictive maintenance" });
    }
  });
  
  // =========== ISM Document Routes =============
  
  // Get all ISM documents
  apiRouter.get("/ism/documents", async (_req: Request, res: Response) => {
    try {
      const documents = await storage.getAllIsmDocuments();
      res.json(documents);
    } catch (error) {
      res.status(500).json({ message: "Failed to get ISM documents" });
    }
  });
  
  // Get ISM document by ID
  apiRouter.get("/ism/documents/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const document = await storage.getIsmDocument(id);
      
      if (!document) {
        return res.status(404).json({ message: "ISM document not found" });
      }
      
      res.json(document);
    } catch (error) {
      res.status(500).json({ message: "Failed to get ISM document" });
    }
  });
  
  // Get ISM documents by type
  apiRouter.get("/ism/documents/type/:documentType", async (req: Request, res: Response) => {
    try {
      const { documentType } = req.params;
      const documents = await storage.getIsmDocumentsByType(documentType);
      res.json(documents);
    } catch (error) {
      res.status(500).json({ message: "Failed to get ISM documents by type" });
    }
  });
  
  // Get ISM documents by status
  apiRouter.get("/ism/documents/status/:status", async (req: Request, res: Response) => {
    try {
      const { status } = req.params;
      const documents = await storage.getIsmDocumentsByStatus(status);
      res.json(documents);
    } catch (error) {
      res.status(500).json({ message: "Failed to get ISM documents by status" });
    }
  });
  
  // Get ISM documents for review
  apiRouter.get("/ism/documents/review", async (_req: Request, res: Response) => {
    try {
      const documents = await storage.getIsmDocumentsForReview();
      res.json(documents);
    } catch (error) {
      res.status(500).json({ message: "Failed to get ISM documents for review" });
    }
  });
  
  // Create new ISM document
  apiRouter.post("/ism/documents", async (req: Request, res: Response) => {
    try {
      const validatedData = insertIsmDocumentSchema.parse(req.body);
      const document = await storage.createIsmDocument(validatedData);
      
      // Log activity
      await storage.createActivityLog({
        activityType: 'ism_document_created',
        description: `New ISM document added: ${document.title}`,
        userId: document.createdBy || null,
        relatedEntityType: 'ism_document',
        relatedEntityId: document.id,
        metadata: { documentType: document.documentType, documentNumber: document.documentNumber }
      });
      
      res.status(201).json(document);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid ISM document data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create ISM document" });
    }
  });
  
  // Update ISM document
  apiRouter.patch("/ism/documents/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const existingDocument = await storage.getIsmDocument(id);
      
      if (!existingDocument) {
        return res.status(404).json({ message: "ISM document not found" });
      }
      
      const updatedDocument = await storage.updateIsmDocument(id, req.body);
      
      // Log approval if status changed to approved
      if (req.body.status === 'approved' && existingDocument.status !== 'approved') {
        await storage.createActivityLog({
          activityType: 'ism_document_approved',
          description: `ISM document approved: ${existingDocument.title}`,
          userId: req.body.approvedBy || null,
          relatedEntityType: 'ism_document',
          relatedEntityId: id,
          metadata: { approvalDate: new Date().toISOString() }
        });
      } else {
        // Log regular update
        await storage.createActivityLog({
          activityType: 'ism_document_updated',
          description: `ISM document updated: ${existingDocument.title}`,
          userId: req.body.userId || null,
          relatedEntityType: 'ism_document',
          relatedEntityId: id,
          metadata: { updated: Object.keys(req.body) }
        });
      }
      
      res.json(updatedDocument);
    } catch (error) {
      res.status(500).json({ message: "Failed to update ISM document" });
    }
  });
  
  // Delete ISM document
  apiRouter.delete("/ism/documents/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const document = await storage.getIsmDocument(id);
      
      if (!document) {
        return res.status(404).json({ message: "ISM document not found" });
      }
      
      await storage.deleteIsmDocument(id);
      
      // Log activity
      await storage.createActivityLog({
        activityType: 'ism_document_deleted',
        description: `ISM document deleted: ${document.title}`,
        userId: req.body.userId || null,
        relatedEntityType: 'ism_document',
        relatedEntityId: id,
        metadata: { documentType: document.documentType, documentNumber: document.documentNumber }
      });
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete ISM document" });
    }
  });
  
  // =========== ISM Audit Routes =============
  
  // Get all ISM audits
  apiRouter.get("/ism/audits", async (_req: Request, res: Response) => {
    try {
      const audits = await storage.getAllIsmAudits();
      res.json(audits);
    } catch (error) {
      res.status(500).json({ message: "Failed to get ISM audits" });
    }
  });
  
  // Get ISM audit by ID
  apiRouter.get("/ism/audits/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const audit = await storage.getIsmAudit(id);
      
      if (!audit) {
        return res.status(404).json({ message: "ISM audit not found" });
      }
      
      res.json(audit);
    } catch (error) {
      res.status(500).json({ message: "Failed to get ISM audit" });
    }
  });
  
  // Get ISM audits by type
  apiRouter.get("/ism/audits/type/:auditType", async (req: Request, res: Response) => {
    try {
      const { auditType } = req.params;
      const audits = await storage.getIsmAuditsByType(auditType);
      res.json(audits);
    } catch (error) {
      res.status(500).json({ message: "Failed to get ISM audits by type" });
    }
  });
  
  // Get ISM audits by status
  apiRouter.get("/ism/audits/status/:status", async (req: Request, res: Response) => {
    try {
      const { status } = req.params;
      const audits = await storage.getIsmAuditsByStatus(status);
      res.json(audits);
    } catch (error) {
      res.status(500).json({ message: "Failed to get ISM audits by status" });
    }
  });
  
  // Get upcoming ISM audits
  apiRouter.get("/ism/audits/upcoming", async (_req: Request, res: Response) => {
    try {
      const audits = await storage.getUpcomingIsmAudits();
      res.json(audits);
    } catch (error) {
      res.status(500).json({ message: "Failed to get upcoming ISM audits" });
    }
  });
  
  // Create new ISM audit
  apiRouter.post("/ism/audits", async (req: Request, res: Response) => {
    try {
      const validatedData = insertIsmAuditSchema.parse(req.body);
      const audit = await storage.createIsmAudit(validatedData);
      
      // Log activity
      await storage.createActivityLog({
        activityType: 'ism_audit_created',
        description: `New ISM audit planned: ${audit.title}`,
        userId: audit.createdBy || null,
        relatedEntityType: 'ism_audit',
        relatedEntityId: audit.id,
        metadata: { auditType: audit.auditType, startDate: audit.startDate?.toISOString() }
      });
      
      res.status(201).json(audit);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid ISM audit data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create ISM audit" });
    }
  });
  
  // Update ISM audit
  apiRouter.patch("/ism/audits/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const existingAudit = await storage.getIsmAudit(id);
      
      if (!existingAudit) {
        return res.status(404).json({ message: "ISM audit not found" });
      }
      
      const updatedAudit = await storage.updateIsmAudit(id, req.body);
      
      // Log completion if status changed to completed
      if (req.body.status === 'completed' && existingAudit.status !== 'completed') {
        await storage.createActivityLog({
          activityType: 'ism_audit_completed',
          description: `ISM audit completed: ${existingAudit.title}`,
          userId: req.body.userId || null,
          relatedEntityType: 'ism_audit',
          relatedEntityId: id,
          metadata: { 
            completionDate: new Date().toISOString(),
            findingsCount: existingAudit.findings ? 
              (Array.isArray(existingAudit.findings) ? existingAudit.findings.length : 0) : 0
          }
        });
      } else {
        // Log regular update
        await storage.createActivityLog({
          activityType: 'ism_audit_updated',
          description: `ISM audit updated: ${existingAudit.title}`,
          userId: req.body.userId || null,
          relatedEntityType: 'ism_audit',
          relatedEntityId: id,
          metadata: { updated: Object.keys(req.body) }
        });
      }
      
      res.json(updatedAudit);
    } catch (error) {
      res.status(500).json({ message: "Failed to update ISM audit" });
    }
  });
  
  // Delete ISM audit
  apiRouter.delete("/ism/audits/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const audit = await storage.getIsmAudit(id);
      
      if (!audit) {
        return res.status(404).json({ message: "ISM audit not found" });
      }
      
      await storage.deleteIsmAudit(id);
      
      // Log activity
      await storage.createActivityLog({
        activityType: 'ism_audit_deleted',
        description: `ISM audit deleted: ${audit.title}`,
        userId: req.body.userId || null,
        relatedEntityType: 'ism_audit',
        relatedEntityId: id,
        metadata: { auditType: audit.auditType }
      });
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete ISM audit" });
    }
  });
  
  // =========== ISM Training Routes =============
  
  // Get all ISM training
  apiRouter.get("/ism/training", async (_req: Request, res: Response) => {
    try {
      const training = await storage.getAllIsmTraining();
      res.json(training);
    } catch (error) {
      res.status(500).json({ message: "Failed to get ISM training" });
    }
  });
  
  // Get ISM training by ID
  apiRouter.get("/ism/training/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const training = await storage.getIsmTraining(id);
      
      if (!training) {
        return res.status(404).json({ message: "ISM training not found" });
      }
      
      res.json(training);
    } catch (error) {
      res.status(500).json({ message: "Failed to get ISM training" });
    }
  });
  
  // Get ISM training by type
  apiRouter.get("/ism/training/type/:trainingType", async (req: Request, res: Response) => {
    try {
      const { trainingType } = req.params;
      const training = await storage.getIsmTrainingByType(trainingType);
      res.json(training);
    } catch (error) {
      res.status(500).json({ message: "Failed to get ISM training by type" });
    }
  });
  
  // Get ISM training by status
  apiRouter.get("/ism/training/status/:status", async (req: Request, res: Response) => {
    try {
      const { status } = req.params;
      const training = await storage.getIsmTrainingByStatus(status);
      res.json(training);
    } catch (error) {
      res.status(500).json({ message: "Failed to get ISM training by status" });
    }
  });
  
  // Get ISM training by participant
  apiRouter.get("/ism/training/participant/:userId", async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      const training = await storage.getIsmTrainingByParticipant(userId);
      res.json(training);
    } catch (error) {
      res.status(500).json({ message: "Failed to get ISM training by participant" });
    }
  });
  
  // Get upcoming ISM training
  apiRouter.get("/ism/training/upcoming", async (_req: Request, res: Response) => {
    try {
      const training = await storage.getUpcomingIsmTraining();
      res.json(training);
    } catch (error) {
      res.status(500).json({ message: "Failed to get upcoming ISM training" });
    }
  });
  
  // Create new ISM training
  apiRouter.post("/ism/training", async (req: Request, res: Response) => {
    try {
      const validatedData = insertIsmTrainingSchema.parse(req.body);
      const training = await storage.createIsmTraining(validatedData);
      
      // Log activity
      await storage.createActivityLog({
        activityType: 'ism_training_created',
        description: `New ISM training planned: ${training.title}`,
        userId: training.createdBy || null,
        relatedEntityType: 'ism_training',
        relatedEntityId: training.id,
        metadata: { 
          trainingType: training.trainingType,
          scheduledDate: training.scheduledDate?.toISOString(),
          participantCount: training.requiredParticipants ? 
            (Array.isArray(training.requiredParticipants) ? training.requiredParticipants.length : 0) : 0
        }
      });
      
      res.status(201).json(training);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid ISM training data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create ISM training" });
    }
  });
  
  // Update ISM training
  apiRouter.patch("/ism/training/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const existingTraining = await storage.getIsmTraining(id);
      
      if (!existingTraining) {
        return res.status(404).json({ message: "ISM training not found" });
      }
      
      const updatedTraining = await storage.updateIsmTraining(id, req.body);
      
      // Log completion if status changed to completed
      if (req.body.status === 'completed' && existingTraining.status !== 'completed') {
        await storage.createActivityLog({
          activityType: 'ism_training_completed',
          description: `ISM training completed: ${existingTraining.title}`,
          userId: req.body.userId || null,
          relatedEntityType: 'ism_training',
          relatedEntityId: id,
          metadata: { 
            completionDate: req.body.completionDate || new Date().toISOString(),
            participantCount: existingTraining.actualParticipants ? 
              (Array.isArray(existingTraining.actualParticipants) ? existingTraining.actualParticipants.length : 0) : 0
          }
        });
      } else {
        // Log regular update
        await storage.createActivityLog({
          activityType: 'ism_training_updated',
          description: `ISM training updated: ${existingTraining.title}`,
          userId: req.body.userId || null,
          relatedEntityType: 'ism_training',
          relatedEntityId: id,
          metadata: { updated: Object.keys(req.body) }
        });
      }
      
      res.json(updatedTraining);
    } catch (error) {
      res.status(500).json({ message: "Failed to update ISM training" });
    }
  });
  
  // Delete ISM training
  apiRouter.delete("/ism/training/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const training = await storage.getIsmTraining(id);
      
      if (!training) {
        return res.status(404).json({ message: "ISM training not found" });
      }
      
      await storage.deleteIsmTraining(id);
      
      // Log activity
      await storage.createActivityLog({
        activityType: 'ism_training_deleted',
        description: `ISM training deleted: ${training.title}`,
        userId: req.body.userId || null,
        relatedEntityType: 'ism_training',
        relatedEntityId: id,
        metadata: { trainingType: training.trainingType }
      });
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete ISM training" });
    }
  });
  
  // =========== ISM Incident Routes =============
  
  // Get all ISM incidents
  apiRouter.get("/ism/incidents", async (_req: Request, res: Response) => {
    try {
      const incidents = await storage.getAllIsmIncidents();
      res.json(incidents);
    } catch (error) {
      res.status(500).json({ message: "Failed to get ISM incidents" });
    }
  });
  
  // Get ISM incident by ID
  apiRouter.get("/ism/incidents/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const incident = await storage.getIsmIncident(id);
      
      if (!incident) {
        return res.status(404).json({ message: "ISM incident not found" });
      }
      
      res.json(incident);
    } catch (error) {
      res.status(500).json({ message: "Failed to get ISM incident" });
    }
  });
  
  // Get ISM incidents by type
  apiRouter.get("/ism/incidents/type/:incidentType", async (req: Request, res: Response) => {
    try {
      const { incidentType } = req.params;
      const incidents = await storage.getIsmIncidentsByType(incidentType);
      res.json(incidents);
    } catch (error) {
      res.status(500).json({ message: "Failed to get ISM incidents by type" });
    }
  });
  
  // Get ISM incidents by status
  apiRouter.get("/ism/incidents/status/:status", async (req: Request, res: Response) => {
    try {
      const { status } = req.params;
      const incidents = await storage.getIsmIncidentsByStatus(status);
      res.json(incidents);
    } catch (error) {
      res.status(500).json({ message: "Failed to get ISM incidents by status" });
    }
  });
  
  // Get ISM incidents by reporter
  apiRouter.get("/ism/incidents/reporter/:userId", async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      const incidents = await storage.getIsmIncidentsByReporter(userId);
      res.json(incidents);
    } catch (error) {
      res.status(500).json({ message: "Failed to get ISM incidents by reporter" });
    }
  });
  
  // Get open ISM incidents
  apiRouter.get("/ism/incidents/open", async (_req: Request, res: Response) => {
    try {
      const incidents = await storage.getOpenIsmIncidents();
      res.json(incidents);
    } catch (error) {
      res.status(500).json({ message: "Failed to get open ISM incidents" });
    }
  });
  
  // Create new ISM incident
  apiRouter.post("/ism/incidents", async (req: Request, res: Response) => {
    try {
      const validatedData = insertIsmIncidentSchema.parse(req.body);
      const incident = await storage.createIsmIncident(validatedData);
      
      // Log activity
      await storage.createActivityLog({
        activityType: 'ism_incident_reported',
        description: `New ISM incident reported: ${incident.title}`,
        userId: incident.reportedBy || null,
        relatedEntityType: 'ism_incident',
        relatedEntityId: incident.id,
        metadata: { 
          incidentType: incident.incidentType,
          severity: incident.severity,
          dateOccurred: incident.dateOccurred.toISOString()
        }
      });
      
      res.status(201).json(incident);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid ISM incident data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create ISM incident" });
    }
  });
  
  // Update ISM incident
  apiRouter.patch("/ism/incidents/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const existingIncident = await storage.getIsmIncident(id);
      
      if (!existingIncident) {
        return res.status(404).json({ message: "ISM incident not found" });
      }
      
      const updatedIncident = await storage.updateIsmIncident(id, req.body);
      
      // Log closure if status changed to closed
      if (req.body.status === 'closed' && existingIncident.status !== 'closed') {
        await storage.createActivityLog({
          activityType: 'ism_incident_closed',
          description: `ISM incident closed: ${existingIncident.title}`,
          userId: req.body.verifiedBy || null,
          relatedEntityType: 'ism_incident',
          relatedEntityId: id,
          metadata: { 
            verificationDate: req.body.verificationDate || new Date().toISOString()
          }
        });
      } else {
        // Log regular update
        await storage.createActivityLog({
          activityType: 'ism_incident_updated',
          description: `ISM incident updated: ${existingIncident.title}`,
          userId: req.body.userId || null,
          relatedEntityType: 'ism_incident',
          relatedEntityId: id,
          metadata: { updated: Object.keys(req.body) }
        });
      }
      
      res.json(updatedIncident);
    } catch (error) {
      res.status(500).json({ message: "Failed to update ISM incident" });
    }
  });
  
  // Delete ISM incident
  apiRouter.delete("/ism/incidents/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const incident = await storage.getIsmIncident(id);
      
      if (!incident) {
        return res.status(404).json({ message: "ISM incident not found" });
      }
      
      const deleted = await storage.deleteIsmIncident(id);
      
      if (!deleted) {
        return res.status(500).json({ message: "Failed to delete ISM incident" });
      }
      
      // Log activity
      await storage.createActivityLog({
        activityType: 'ism_incident_deleted',
        description: `ISM incident deleted: ${incident.title}`,
        userId: req.body.userId || null,
        relatedEntityType: 'ism_incident',
        relatedEntityId: id,
        metadata: { incidentType: incident.incidentType, severity: incident.severity }
      });
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete ISM incident" });
    }
  });
  
  // =========== ISM Task Management Routes =============
  
  // --------- Form Category Routes ---------
  
  // Get all form categories
  apiRouter.get("/ism/form-categories", async (_req: Request, res: Response) => {
    try {
      const categories = await storage.getAllFormCategories();
      res.json(categories);
    } catch (error) {
      res.status(500).json({ message: "Failed to get form categories" });
    }
  });
  
  // Get form category by ID
  apiRouter.get("/ism/form-categories/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const category = await storage.getFormCategory(id);
      
      if (!category) {
        return res.status(404).json({ message: "Form category not found" });
      }
      
      res.json(category);
    } catch (error) {
      res.status(500).json({ message: "Failed to get form category" });
    }
  });
  
  // Create form category
  apiRouter.post("/ism/form-categories", async (req: Request, res: Response) => {
    try {
      const validatedData = insertFormCategorySchema.parse(req.body);
      const category = await storage.createFormCategory(validatedData);
      
      // Log activity
      await storage.createActivityLog({
        activityType: 'form_category_created',
        description: `New form category created: ${category.name}`,
        userId: category.createdBy || null,
        relatedEntityType: 'form_category',
        relatedEntityId: category.id
      });
      
      res.status(201).json(category);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid form category data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create form category" });
    }
  });
  
  // Update form category
  apiRouter.patch("/ism/form-categories/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const existingCategory = await storage.getFormCategory(id);
      
      if (!existingCategory) {
        return res.status(404).json({ message: "Form category not found" });
      }
      
      const updatedCategory = await storage.updateFormCategory(id, req.body);
      
      // Log activity
      await storage.createActivityLog({
        activityType: 'form_category_updated',
        description: `Form category updated: ${existingCategory.name}`,
        userId: req.body.userId || null,
        relatedEntityType: 'form_category',
        relatedEntityId: id,
        metadata: { updated: Object.keys(req.body) }
      });
      
      res.json(updatedCategory);
    } catch (error) {
      res.status(500).json({ message: "Failed to update form category" });
    }
  });
  
  // Delete form category
  apiRouter.delete("/ism/form-categories/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const category = await storage.getFormCategory(id);
      
      if (!category) {
        return res.status(404).json({ message: "Form category not found" });
      }
      
      // Check if there are any templates using this category
      const templates = await storage.getFormTemplatesByCategory(id);
      if (templates.length > 0) {
        return res.status(400).json({ 
          message: "Cannot delete category with associated templates",
          count: templates.length
        });
      }
      
      await storage.deleteFormCategory(id);
      
      // Log activity
      await storage.createActivityLog({
        activityType: 'form_category_deleted',
        description: `Form category deleted: ${category.name}`,
        userId: req.body.userId || null,
        relatedEntityType: 'form_category',
        relatedEntityId: id
      });
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete form category" });
    }
  });
  
  // --------- Form Template Routes ---------
  
  // Get all form templates
  apiRouter.get("/ism/form-templates", async (_req: Request, res: Response) => {
    try {
      const templates = await storage.getAllFormTemplates();
      res.json(templates);
    } catch (error) {
      res.status(500).json({ message: "Failed to get form templates" });
    }
  });
  
  // Get form templates by category
  apiRouter.get("/ism/form-templates/category/:categoryId", async (req: Request, res: Response) => {
    try {
      const categoryId = parseInt(req.params.categoryId);
      const templates = await storage.getFormTemplatesByCategory(categoryId);
      res.json(templates);
    } catch (error) {
      res.status(500).json({ message: "Failed to get form templates by category" });
    }
  });
  
  // Get form template by ID
  apiRouter.get("/ism/form-templates/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const template = await storage.getFormTemplate(id);
      
      if (!template) {
        return res.status(404).json({ message: "Form template not found" });
      }
      
      res.json(template);
    } catch (error) {
      res.status(500).json({ message: "Failed to get form template" });
    }
  });
  
  // Create form template
  apiRouter.post("/ism/form-templates", async (req: Request, res: Response) => {
    try {
      const validatedData = insertFormTemplateSchema.parse(req.body);
      const template = await storage.createFormTemplate(validatedData);
      
      // Log activity
      await storage.createActivityLog({
        activityType: 'form_template_created',
        description: `New form template created: ${template.title}`,
        userId: template.createdById || null,
        relatedEntityType: 'form_template',
        relatedEntityId: template.id
      });
      
      res.status(201).json(template);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid form template data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create form template" });
    }
  });
  
  // Update form template
  apiRouter.patch("/ism/form-templates/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const existingTemplate = await storage.getFormTemplate(id);
      
      if (!existingTemplate) {
        return res.status(404).json({ message: "Form template not found" });
      }
      
      const updatedTemplate = await storage.updateFormTemplate(id, req.body);
      
      // Log activity
      await storage.createActivityLog({
        activityType: 'form_template_updated',
        description: `Form template updated: ${existingTemplate.title}`,
        userId: req.body.userId || null,
        relatedEntityType: 'form_template',
        relatedEntityId: id,
        metadata: { updated: Object.keys(req.body) }
      });
      
      res.json(updatedTemplate);
    } catch (error) {
      res.status(500).json({ message: "Failed to update form template" });
    }
  });
  
  // Delete form template
  apiRouter.delete("/ism/form-templates/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const template = await storage.getFormTemplate(id);
      
      if (!template) {
        return res.status(404).json({ message: "Form template not found" });
      }
      
      // Check if there are any template versions using this template
      const versions = await storage.getFormTemplateVersionsByTemplate(id);
      if (versions.length > 0) {
        return res.status(400).json({ 
          message: "Cannot delete template with associated versions",
          count: versions.length
        });
      }
      
      await storage.deleteFormTemplate(id);
      
      // Log activity
      await storage.createActivityLog({
        activityType: 'form_template_deleted',
        description: `Form template deleted: ${template.title}`,
        userId: req.body.userId || null,
        relatedEntityType: 'form_template',
        relatedEntityId: id
      });
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete form template" });
    }
  });
  
  // --------- Form Template Version Routes ---------
  
  // Get all form template versions
  apiRouter.get("/ism/form-template-versions", async (req: Request, res: Response) => {
    try {
      // If templateId is provided as a query parameter, filter by that
      if (req.query.templateId) {
        const templateId = parseInt(req.query.templateId as string);
        const versions = await storage.getFormTemplateVersionsByTemplate(templateId);
        return res.json(versions);
      }
      
      // Otherwise get all versions
      const templateVersions = [];
      const templates = await storage.getAllFormTemplates();
      
      for (const template of templates) {
        const versions = await storage.getFormTemplateVersionsByTemplate(template.id);
        templateVersions.push(...versions);
      }
      
      res.json(templateVersions);
    } catch (error) {
      console.error("Error fetching form template versions:", error);
      res.status(500).json({ message: "Failed to get form template versions" });
    }
  });
  
  // Get all versions of a template
  apiRouter.get("/ism/form-template-versions/template/:templateId", async (req: Request, res: Response) => {
    try {
      const templateId = parseInt(req.params.templateId);
      const versions = await storage.getFormTemplateVersionsByTemplate(templateId);
      res.json(versions);
    } catch (error) {
      res.status(500).json({ message: "Failed to get form template versions" });
    }
  });
  
  // Get form template version by ID
  apiRouter.get("/ism/form-template-versions/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const version = await storage.getFormTemplateVersion(id);
      
      if (!version) {
        return res.status(404).json({ message: "Form template version not found" });
      }
      
      res.json(version);
    } catch (error) {
      res.status(500).json({ message: "Failed to get form template version" });
    }
  });
  
  // Create form template version
  apiRouter.post("/ism/form-template-versions", async (req: Request, res: Response) => {
    try {
      const validatedData = insertFormTemplateVersionSchema.parse(req.body);
      const version = await storage.createFormTemplateVersion(validatedData);
      
      // Get the associated template for logging
      const template = await storage.getFormTemplate(version.templateId);
      
      // Log activity
      await storage.createActivityLog({
        activityType: 'form_template_version_created',
        description: `New version (${version.versionNumber}) created for template: ${template?.title || 'Unknown Template'}`,
        userId: version.createdById || null,
        relatedEntityType: 'form_template_version',
        relatedEntityId: version.id,
        metadata: { templateId: version.templateId }
      });
      
      res.status(201).json(version);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid form template version data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create form template version" });
    }
  });
  
  // --------- ISM Task Routes ---------
  
  // Get all ISM tasks
  apiRouter.get("/ism/tasks", async (req: Request, res: Response) => {
    try {
      // Get vessel ID from query parameter if provided
      const vesselId = req.query.vesselId ? parseInt(req.query.vesselId as string) : undefined;
      console.log(`Getting ISM tasks, vessel ID: ${vesselId || 'all'}`);
      
      if (vesselId) {
        console.log("Calling getIsmTasksByVessel...");
        const tasks = await storage.getIsmTasksByVessel(vesselId);
        console.log(`Found ${tasks.length} ISM tasks for vessel ${vesselId}`);
        res.json(tasks);
      } else {
        console.log("Calling getAllIsmTasks...");
        const tasks = await storage.getAllIsmTasks();
        console.log(`Found ${tasks.length} ISM tasks total`);
        res.json(tasks);
      }
    } catch (error) {
      console.error("Error in /api/ism/tasks:", error);
      console.error(error instanceof Error ? error.stack : String(error));
      res.status(500).json({ message: "Failed to get ISM tasks" });
    }
  });
  
  // Get ISM tasks by status
  apiRouter.get("/ism/tasks/status/:status", async (req: Request, res: Response) => {
    try {
      const { status } = req.params;
      const tasks = await storage.getIsmTasksByStatus(status);
      res.json(tasks);
    } catch (error) {
      res.status(500).json({ message: "Failed to get ISM tasks by status" });
    }
  });
  
  // Get ISM tasks by assignee
  apiRouter.get("/ism/tasks/assignee/:userId", async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      const tasks = await storage.getIsmTasksByAssignee(userId);
      res.json(tasks);
    } catch (error) {
      res.status(500).json({ message: "Failed to get ISM tasks by assignee" });
    }
  });
  
  // Get ISM task by ID
  apiRouter.get("/ism/tasks/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const task = await storage.getIsmTask(id);
      
      if (!task) {
        return res.status(404).json({ message: "ISM task not found" });
      }
      
      res.json(task);
    } catch (error) {
      res.status(500).json({ message: "Failed to get ISM task" });
    }
  });
  
  // Create ISM task
  apiRouter.post("/ism/tasks", async (req: Request, res: Response) => {
    try {
      console.log("Received ISM task create request with body:", req.body);
      
      // If dueDate is a string but looks like a date, convert it to a Date object
      if (req.body.dueDate && typeof req.body.dueDate === 'string') {
        try {
          req.body.dueDate = new Date(req.body.dueDate);
          console.log("Converted dueDate string to Date object:", req.body.dueDate);
        } catch (error) {
          console.error("Failed to parse dueDate string:", error);
        }
      }
      
      const validatedData = insertIsmTaskSchema.parse(req.body);
      console.log("Validated ISM task data:", validatedData);
      const task = await storage.createIsmTask(validatedData);
      
      // Log activity
      await storage.createActivityLog({
        activityType: 'ism_task_created',
        description: `New ISM task created: ${task.title}`,
        userId: task.createdById || null,
        relatedEntityType: 'ism_task',
        relatedEntityId: task.id
      });
      
      res.status(201).json(task);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid ISM task data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create ISM task" });
    }
  });
  
  // Update ISM task
  apiRouter.patch("/ism/tasks/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const existingTask = await storage.getIsmTask(id);
      
      if (!existingTask) {
        return res.status(404).json({ message: "ISM task not found" });
      }
      
      const updatedTask = await storage.updateIsmTask(id, req.body);
      
      // Log status changes
      if (req.body.status && req.body.status !== existingTask.status) {
        await storage.createActivityLog({
          activityType: 'ism_task_status_changed',
          description: `ISM task status changed from ${existingTask.status} to ${req.body.status}: ${existingTask.title}`,
          userId: req.body.userId || null,
          relatedEntityType: 'ism_task',
          relatedEntityId: id
        });
      } else {
        // Log general updates
        await storage.createActivityLog({
          activityType: 'ism_task_updated',
          description: `ISM task updated: ${existingTask.title}`,
          userId: req.body.userId || null,
          relatedEntityType: 'ism_task',
          relatedEntityId: id,
          metadata: { updated: Object.keys(req.body) }
        });
      }
      
      res.json(updatedTask);
    } catch (error) {
      res.status(500).json({ message: "Failed to update ISM task" });
    }
  });
  
  // Delete ISM task
  apiRouter.delete("/ism/tasks/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const task = await storage.getIsmTask(id);
      
      if (!task) {
        return res.status(404).json({ message: "ISM task not found" });
      }
      
      // Check if there are any form submissions for this task
      const submissions = await storage.getFormSubmissionsByTask(id);
      if (submissions.length > 0) {
        return res.status(400).json({ 
          message: "Cannot delete task with associated form submissions",
          count: submissions.length
        });
      }
      
      await storage.deleteIsmTask(id);
      
      // Log activity
      await storage.createActivityLog({
        activityType: 'ism_task_deleted',
        description: `ISM task deleted: ${task.title}`,
        userId: req.body.userId || null,
        relatedEntityType: 'ism_task',
        relatedEntityId: id
      });
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete ISM task" });
    }
  });
  
  // --------- Form Submission Routes ---------
  
  // Get form submissions by task
  apiRouter.get("/ism/form-submissions/task/:taskId", async (req: Request, res: Response) => {
    try {
      const taskId = parseInt(req.params.taskId);
      const submissions = await storage.getFormSubmissionsByTask(taskId);
      res.json(submissions);
    } catch (error) {
      res.status(500).json({ message: "Failed to get form submissions" });
    }
  });
  
  // Get form submission by ID
  apiRouter.get("/ism/form-submissions/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const submission = await storage.getFormSubmission(id);
      
      if (!submission) {
        return res.status(404).json({ message: "Form submission not found" });
      }
      
      res.json(submission);
    } catch (error) {
      res.status(500).json({ message: "Failed to get form submission" });
    }
  });
  
  // Create form submission
  apiRouter.post("/ism/form-submissions", async (req: Request, res: Response) => {
    try {
      const validatedData = insertFormSubmissionSchema.parse(req.body);
      const submission = await storage.createFormSubmission(validatedData);
      
      // Get the associated task for logging
      const task = await storage.getIsmTask(submission.taskId);
      
      // Log activity
      await storage.createActivityLog({
        activityType: 'form_submission_created',
        description: `New form submission created for task: ${task?.title || 'Unknown Task'}`,
        userId: submission.submittedBy,
        relatedEntityType: 'form_submission',
        relatedEntityId: submission.id,
        metadata: { taskId: submission.taskId, status: submission.status }
      });
      
      // Update task status if submission is final
      if (submission.status === 'submitted') {
        await storage.updateIsmTask(submission.taskId, { status: 'completed' });
      }
      
      res.status(201).json(submission);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid form submission data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create form submission" });
    }
  });
  
  // Update form submission (for reviews and draft updates)
  apiRouter.patch("/ism/form-submissions/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const existingSubmission = await storage.getFormSubmission(id);
      
      if (!existingSubmission) {
        return res.status(404).json({ message: "Form submission not found" });
      }
      
      const updatedSubmission = await storage.updateFormSubmission(id, req.body);
      
      // Get the associated task for logging
      const task = await storage.getIsmTask(existingSubmission.taskId);
      
      // Log activity
      if (req.body.status && req.body.status !== existingSubmission.status) {
        // Status change log
        await storage.createActivityLog({
          activityType: 'form_submission_status_changed',
          description: `Form submission status changed from ${existingSubmission.status} to ${req.body.status} for task: ${task?.title || 'Unknown Task'}`,
          userId: req.body.userId || null,
          relatedEntityType: 'form_submission',
          relatedEntityId: id,
          metadata: { taskId: existingSubmission.taskId }
        });
        
        // If the submission is being approved, update the task status
        if (req.body.status === 'approved') {
          await storage.updateIsmTask(existingSubmission.taskId, { status: 'completed' });
        }
        // If the submission is rejected, update the task status back to in-progress
        else if (req.body.status === 'rejected') {
          await storage.updateIsmTask(existingSubmission.taskId, { status: 'in-progress' });
        }
      } else {
        // General update log
        await storage.createActivityLog({
          activityType: 'form_submission_updated',
          description: `Form submission updated for task: ${task?.title || 'Unknown Task'}`,
          userId: req.body.userId || null,
          relatedEntityType: 'form_submission',
          relatedEntityId: id,
          metadata: { updated: Object.keys(req.body) }
        });
      }
      
      res.json(updatedSubmission);
    } catch (error) {
      res.status(500).json({ message: "Failed to update form submission" });
    }
  });
  
  // --------- Task Comment Routes ---------
  
  // Get comments by task
  apiRouter.get("/ism/task-comments/task/:taskId", async (req: Request, res: Response) => {
    try {
      const taskId = parseInt(req.params.taskId);
      const comments = await storage.getTaskCommentsByTask(taskId);
      res.json(comments);
    } catch (error) {
      res.status(500).json({ message: "Failed to get task comments" });
    }
  });
  
  // Get comment by ID
  apiRouter.get("/ism/task-comments/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const comment = await storage.getTaskComment(id);
      
      if (!comment) {
        return res.status(404).json({ message: "Task comment not found" });
      }
      
      res.json(comment);
    } catch (error) {
      res.status(500).json({ message: "Failed to get task comment" });
    }
  });
  
  // Create task comment
  apiRouter.post("/ism/task-comments", async (req: Request, res: Response) => {
    try {
      const validatedData = insertTaskCommentSchema.parse(req.body);
      const comment = await storage.createTaskComment(validatedData);
      
      // Get the associated task for logging
      const task = await storage.getIsmTask(comment.taskId);
      
      // Log activity
      await storage.createActivityLog({
        activityType: 'task_comment_created',
        description: `New comment added to task: ${task?.title || 'Unknown Task'}`,
        userId: comment.userId,
        relatedEntityType: 'task_comment',
        relatedEntityId: comment.id,
        metadata: { taskId: comment.taskId }
      });
      
      res.status(201).json(comment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid task comment data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create task comment" });
    }
  });
  
  // Delete task comment
  apiRouter.delete("/ism/task-comments/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const comment = await storage.getTaskComment(id);
      
      if (!comment) {
        return res.status(404).json({ message: "Task comment not found" });
      }
      
      // Only allow deletion by the comment author or admin
      if (comment.userId !== req.body.userId && req.body.role !== 'admin') {
        return res.status(403).json({ message: "Not authorized to delete this comment" });
      }
      
      await storage.deleteTaskComment(id);
      
      // Log activity
      await storage.createActivityLog({
        activityType: 'task_comment_deleted',
        description: `Comment deleted from task: ${comment.taskId}`,
        userId: req.body.userId || null,
        relatedEntityType: 'task_comment',
        relatedEntityId: id,
        metadata: { taskId: comment.taskId }
      });
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete task comment" });
    }
  });

  // =========== Theme Routes =============
  
  // =========== Crew Management Routes =============
  
  // Get all crew members
  apiRouter.get("/crew", async (_req: Request, res: Response) => {
    try {
      const crewMembers = await storage.getAllCrewMembers();
      res.json(crewMembers);
    } catch (error) {
      res.status(500).json({ message: "Failed to get crew members" });
    }
  });
  
  // Get crew member by ID
  apiRouter.get("/crew/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const crewMember = await storage.getCrewMember(id);
      
      if (!crewMember) {
        return res.status(404).json({ message: "Crew member not found" });
      }
      
      res.json(crewMember);
    } catch (error) {
      res.status(500).json({ message: "Failed to get crew member" });
    }
  });
  
  // Get crew members by status
  apiRouter.get("/crew/status/:status", async (req: Request, res: Response) => {
    try {
      const { status } = req.params;
      const crewMembers = await storage.getCrewMembersByStatus(status);
      res.json(crewMembers);
    } catch (error) {
      res.status(500).json({ message: "Failed to get crew members by status" });
    }
  });
  
  // Get crew members by position
  apiRouter.get("/crew/position/:position", async (req: Request, res: Response) => {
    try {
      const { position } = req.params;
      const crewMembers = await storage.getCrewMembersByPosition(position);
      res.json(crewMembers);
    } catch (error) {
      res.status(500).json({ message: "Failed to get crew members by position" });
    }
  });
  
  // Create new crew member
  apiRouter.post("/crew", async (req: Request, res: Response) => {
    try {
      const validatedData = insertCrewMemberSchema.parse(req.body);
      const crewMember = await storage.createCrewMember(validatedData);
      
      // Log activity
      await storage.createActivityLog({
        activityType: 'crew_member_added',
        description: `New crew member added: ${crewMember.fullName}`,
        userId: req.body.userId || null,
        relatedEntityType: 'crew',
        relatedEntityId: crewMember.id,
        metadata: { position: crewMember.position }
      });
      
      res.status(201).json(crewMember);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid crew member data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create crew member" });
    }
  });
  
  // Update crew member
  apiRouter.patch("/crew/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const existingCrewMember = await storage.getCrewMember(id);
      
      if (!existingCrewMember) {
        return res.status(404).json({ message: "Crew member not found" });
      }
      
      const updatedCrewMember = await storage.updateCrewMember(id, req.body);
      
      // Log activity
      await storage.createActivityLog({
        activityType: 'crew_member_updated',
        description: `Crew member updated: ${existingCrewMember.fullName}`,
        userId: req.body.userId || null,
        relatedEntityType: 'crew',
        relatedEntityId: id,
        metadata: { updated: Object.keys(req.body) }
      });
      
      res.json(updatedCrewMember);
    } catch (error) {
      res.status(500).json({ message: "Failed to update crew member" });
    }
  });
  
  // Delete crew member
  apiRouter.delete("/crew/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const crewMember = await storage.getCrewMember(id);
      
      if (!crewMember) {
        return res.status(404).json({ message: "Crew member not found" });
      }
      
      const deleted = await storage.deleteCrewMember(id);
      
      if (!deleted) {
        return res.status(500).json({ message: "Failed to delete crew member" });
      }
      
      // Log activity
      await storage.createActivityLog({
        activityType: 'crew_member_deleted',
        description: `Crew member deleted: ${crewMember.fullName}`,
        userId: req.body.userId || null,
        relatedEntityType: 'crew',
        relatedEntityId: id,
        metadata: { position: crewMember.position }
      });
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete crew member" });
    }
  });
  
  // Get all documents for a crew member
  apiRouter.get("/crew/:crewMemberId/documents", async (req: Request, res: Response) => {
    try {
      const crewMemberId = parseInt(req.params.crewMemberId);
      const documents = await storage.getCrewDocumentsByCrewMember(crewMemberId);
      res.json(documents);
    } catch (error) {
      res.status(500).json({ message: "Failed to get crew member documents" });
    }
  });
  
  // Get all crew documents 
  apiRouter.get("/crew-documents", async (_req: Request, res: Response) => {
    try {
      // This would need to be added to the DatabaseStorage class
      const docs = await db.select().from(crewDocuments);
      res.json(docs);
    } catch (error) {
      res.status(500).json({ message: "Failed to get crew documents" });
    }
  });
  
  // Get crew document by ID
  apiRouter.get("/crew-documents/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const document = await storage.getCrewDocument(id);
      
      if (!document) {
        return res.status(404).json({ message: "Crew document not found" });
      }
      
      res.json(document);
    } catch (error) {
      res.status(500).json({ message: "Failed to get crew document" });
    }
  });
  
  // Get crew documents by type
  apiRouter.get("/crew-documents/type/:documentType", async (req: Request, res: Response) => {
    try {
      const { documentType } = req.params;
      const documents = await storage.getCrewDocumentsByType(documentType);
      res.json(documents);
    } catch (error) {
      res.status(500).json({ message: "Failed to get crew documents by type" });
    }
  });
  
  // Get crew documents by verification status
  apiRouter.get("/crew-documents/status/:status", async (req: Request, res: Response) => {
    try {
      const { status } = req.params;
      const documents = await storage.getCrewDocumentsByVerificationStatus(status);
      res.json(documents);
    } catch (error) {
      res.status(500).json({ message: "Failed to get crew documents by status" });
    }
  });
  
  // Get expiring crew documents
  apiRouter.get("/crew-documents/expiring/:days", async (req: Request, res: Response) => {
    try {
      const days = parseInt(req.params.days);
      if (isNaN(days) || days <= 0) {
        return res.status(400).json({ message: "Invalid days parameter" });
      }
      
      const documents = await storage.getExpiringCrewDocuments(days);
      res.json(documents);
    } catch (error) {
      res.status(500).json({ message: "Failed to get expiring crew documents" });
    }
  });
  
  // Create new crew document
  apiRouter.post("/crew-documents", async (req: Request, res: Response) => {
    try {
      const validatedData = insertCrewDocumentSchema.parse(req.body);
      const document = await storage.createCrewDocument(validatedData);
      
      // Get crew member for activity log
      const crewMember = await storage.getCrewMember(document.crewMemberId);
      const crewName = crewMember ? crewMember.fullName : `Crew ID ${document.crewMemberId}`;
      
      // Log activity
      await storage.createActivityLog({
        activityType: 'crew_document_added',
        description: `New document added for ${crewName}: ${document.title}`,
        userId: req.body.userId || null,
        relatedEntityType: 'crew_document',
        relatedEntityId: document.id,
        metadata: { 
          documentType: document.documentType,
          expiryDate: document.expiryDate.toISOString() 
        }
      });
      
      res.status(201).json(document);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid crew document data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create crew document" });
    }
  });
  
  // Update crew document
  apiRouter.patch("/crew-documents/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const existingDocument = await storage.getCrewDocument(id);
      
      if (!existingDocument) {
        return res.status(404).json({ message: "Crew document not found" });
      }
      
      const updatedDocument = await storage.updateCrewDocument(id, req.body);
      
      // Log activity
      await storage.createActivityLog({
        activityType: 'crew_document_updated',
        description: `Crew document updated: ${existingDocument.title}`,
        userId: req.body.userId || null,
        relatedEntityType: 'crew_document',
        relatedEntityId: id,
        metadata: { 
          documentType: existingDocument.documentType,
          updated: Object.keys(req.body)
        }
      });
      
      res.json(updatedDocument);
    } catch (error) {
      res.status(500).json({ message: "Failed to update crew document" });
    }
  });
  
  // Delete crew document
  apiRouter.delete("/crew-documents/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const document = await storage.getCrewDocument(id);
      
      if (!document) {
        return res.status(404).json({ message: "Crew document not found" });
      }
      
      const deleted = await storage.deleteCrewDocument(id);
      
      if (!deleted) {
        return res.status(500).json({ message: "Failed to delete crew document" });
      }
      
      // Log activity
      await storage.createActivityLog({
        activityType: 'crew_document_deleted',
        description: `Crew document deleted: ${document.title}`,
        userId: req.body.userId || null,
        relatedEntityType: 'crew_document',
        relatedEntityId: id,
        metadata: { documentType: document.documentType }
      });
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete crew document" });
    }
  });

  apiRouter.post("/api/update-theme", async (req: Request, res: Response) => {
    try {
      const themeData = req.body;
      const themeFilePath = path.resolve('./theme.json');
      
      // Validate theme data
      if (!themeData || typeof themeData !== 'object') {
        return res.status(400).json({ message: "Invalid theme data" });
      }
      
      // Read current theme data
      let currentTheme = {};
      try {
        const themeContent = fs.readFileSync(themeFilePath, 'utf8');
        currentTheme = JSON.parse(themeContent);
      } catch (error) {
        console.warn("Could not read current theme, using defaults", error);
        currentTheme = {
          primary: "blue",
          variant: "tint",
          appearance: "light",
          radius: 0.5
        };
      }
      
      // Merge current theme with updates
      const updatedTheme = {
        ...currentTheme,
        ...themeData
      };
      
      // Write the theme data to theme.json
      fs.writeFileSync(themeFilePath, JSON.stringify(updatedTheme, null, 2));
      
      // Log activity
      await storage.createActivityLog({
        activityType: 'theme_updated',
        description: `Application theme updated`,
        userId: null,
        relatedEntityType: 'system',
        relatedEntityId: 0,
        metadata: { 
          appearance: updatedTheme.appearance,
          variant: updatedTheme.variant || 'tint'
        }
      });
      
      res.json({ 
        message: "Theme updated successfully",
        theme: updatedTheme
      });
    } catch (error) {
      console.error("Failed to update theme:", error);
      res.status(500).json({ message: "Failed to update theme" });
    }
  });
  
  // =========== Monitoring Routes =============
  // These endpoints are for admin dashboard and monitoring systems
  
  // Get error logs
  apiRouter.get("/monitoring/errors", asyncHandler(async (req: Request, res: Response) => {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
    
    // Check if the user has admin privileges (should integrate with auth system later)
    // For now, we're allowing access for debugging
    const errorLogs = logger.getRecentErrors(limit);
    res.json(errorLogs);
  }));
  
  // Get performance metrics
  apiRouter.get("/monitoring/performance", asyncHandler(async (req: Request, res: Response) => {
    // Check if the user has admin privileges (should integrate with auth system later)
    // For now, we're allowing access for debugging
    const metrics = logger.getPerformanceMetrics();
    res.json(metrics);
  }));
  
  // Get system health status
  apiRouter.get("/monitoring/health", asyncHandler(async (_req: Request, res: Response) => {
    try {
      // Check database connection
      const dbStatus = { operational: true };
      
      // Check file system access
      const fsStatus = { operational: fs.existsSync(path.join(process.cwd(), 'logs')) };
      
      // Check memory usage
      const memoryUsage = process.memoryUsage();
      const memoryStatus = {
        operational: true,
        rss: Math.round(memoryUsage.rss / 1024 / 1024),
        heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024),
        heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024),
        external: Math.round(memoryUsage.external / 1024 / 1024),
        units: "MB"
      };
      
      // Respond with health status
      res.json({
        status: "up",
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        database: dbStatus,
        fileSystem: fsStatus,
        memory: memoryStatus
      });
    } catch (error) {
      logger.error(error as Error, { context: "health-check" });
      
      // Even in case of error, return a valid response with error details
      res.status(500).json({
        status: "degraded",
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString()
      });
    }
  }));
  
  // =========== Voyage Planner Routes =============
  
  // Get all voyages for a vessel
  apiRouter.get("/voyages", asyncHandler(async (req: Request, res: Response) => {
    const vesselId = parseInt(req.query.vesselId as string);
    if (isNaN(vesselId)) {
      return res.status(400).json({ error: "Invalid vessel ID" });
    }

    const voyages = await storage.getVoyagesByVessel(vesselId);
    return res.json(voyages);
  }));

  // Get a specific voyage
  apiRouter.get("/voyages/:id", asyncHandler(async (req: Request, res: Response) => {
    const voyageId = parseInt(req.params.id);
    if (isNaN(voyageId)) {
      return res.status(400).json({ error: "Invalid voyage ID" });
    }

    const voyage = await storage.getVoyage(voyageId);
    if (!voyage) {
      return res.status(404).json({ error: "Voyage not found" });
    }

    return res.json(voyage);
  }));

  // Create a new voyage
  apiRouter.post("/voyages", asyncHandler(async (req: Request, res: Response) => {
    try {
      // Parse dates before validation
      const data = {
        ...req.body,
        startDate: req.body.startDate ? new Date(req.body.startDate) : null,
        endDate: req.body.endDate ? new Date(req.body.endDate) : null
      };
      
      const validationResult = insertVoyageSchema.safeParse(data);
      if (!validationResult.success) {
        return res.status(400).json({ 
          error: "Invalid voyage data", 
          details: validationResult.error.format() 
        });
      }

      const voyage = await storage.createVoyage(validationResult.data);
      
      // Log activity
      await storage.createActivityLog({
        activityType: 'voyage_created',
        description: `New voyage created: ${voyage.name}`,
        userId: req.body.createdById || null,
        relatedEntityType: 'voyage',
        relatedEntityId: voyage.id,
        metadata: { vesselId: voyage.vesselId }
      });
      
      return res.status(201).json(voyage);
    } catch (error) {
      console.error("Error creating voyage:", error);
      return res.status(500).json({ error: "Failed to create voyage" });
    }
  }));

  // Update a voyage
  apiRouter.put("/voyages/:id", asyncHandler(async (req: Request, res: Response) => {
    const voyageId = parseInt(req.params.id);
    if (isNaN(voyageId)) {
      return res.status(400).json({ error: "Invalid voyage ID" });
    }

    const voyageUpdate = req.body;
    
    const updatedVoyage = await storage.updateVoyage(voyageId, voyageUpdate);
    if (!updatedVoyage) {
      return res.status(404).json({ error: "Voyage not found" });
    }

    // Log activity
    await storage.createActivityLog({
      activityType: 'voyage_updated',
      description: `Voyage updated: ${updatedVoyage.name}`,
      userId: req.body.userId || null,
      relatedEntityType: 'voyage',
      relatedEntityId: voyageId,
      metadata: { updated: Object.keys(voyageUpdate) }
    });

    return res.json(updatedVoyage);
  }));

  // Delete a voyage
  apiRouter.delete("/voyages/:id", asyncHandler(async (req: Request, res: Response) => {
    const voyageId = parseInt(req.params.id);
    if (isNaN(voyageId)) {
      return res.status(400).json({ error: "Invalid voyage ID" });
    }

    const voyage = await storage.getVoyage(voyageId);
    if (!voyage) {
      return res.status(404).json({ error: "Voyage not found" });
    }

    const success = await storage.deleteVoyage(voyageId);
    
    // Log activity
    await storage.createActivityLog({
      activityType: 'voyage_deleted',
      description: `Voyage deleted: ${voyage.name}`,
      userId: req.body.userId || null,
      relatedEntityType: 'voyage',
      relatedEntityId: voyageId,
      metadata: { vesselId: voyage.vesselId }
    });

    return res.json({ success });
  }));

  // Get waypoints for a specific voyage
  apiRouter.get("/waypoints", asyncHandler(async (req: Request, res: Response) => {
    const voyageId = parseInt(req.query.voyageId as string);
    if (isNaN(voyageId)) {
      return res.status(400).json({ error: "Invalid voyage ID" });
    }

    const waypoints = await storage.getWaypointsByVoyage(voyageId);
    return res.json(waypoints);
  }));

  // Get a specific waypoint
  apiRouter.get("/waypoints/:id", asyncHandler(async (req: Request, res: Response) => {
    const waypointId = parseInt(req.params.id);
    if (isNaN(waypointId)) {
      return res.status(400).json({ error: "Invalid waypoint ID" });
    }

    const waypoint = await storage.getWaypoint(waypointId);
    if (!waypoint) {
      return res.status(404).json({ error: "Waypoint not found" });
    }

    return res.json(waypoint);
  }));

  // Create a new waypoint
  apiRouter.post("/waypoints", asyncHandler(async (req: Request, res: Response) => {
    try {
      // Parse dates before validation
      const data = {
        ...req.body,
        estimatedArrival: req.body.estimatedArrival ? new Date(req.body.estimatedArrival) : null,
        estimatedDeparture: req.body.estimatedDeparture ? new Date(req.body.estimatedDeparture) : null
      };
      
      const validationResult = insertWaypointSchema.safeParse(data);
      if (!validationResult.success) {
        return res.status(400).json({ 
          error: "Invalid waypoint data", 
          details: validationResult.error.format() 
        });
      }

      const waypoint = await storage.createWaypoint(validationResult.data);
      
      // Log activity
      await storage.createActivityLog({
        activityType: 'waypoint_created',
        description: `New waypoint created${waypoint.name ? ': ' + waypoint.name : ''}`,
        userId: req.body.userId || null,
        relatedEntityType: 'waypoint',
        relatedEntityId: waypoint.id,
        metadata: { 
          voyageId: waypoint.voyageId,
          position: `${waypoint.latitude}, ${waypoint.longitude}`,
          orderIndex: waypoint.orderIndex
        }
      });
      
      return res.status(201).json(waypoint);
    } catch (error) {
      console.error("Error creating waypoint:", error);
      return res.status(500).json({ error: "Failed to create waypoint" });
    }
  }));

  // Update a waypoint
  apiRouter.put("/waypoints/:id", asyncHandler(async (req: Request, res: Response) => {
    const waypointId = parseInt(req.params.id);
    if (isNaN(waypointId)) {
      return res.status(400).json({ error: "Invalid waypoint ID" });
    }

    const waypointUpdate = req.body;
    
    const updatedWaypoint = await storage.updateWaypoint(waypointId, waypointUpdate);
    if (!updatedWaypoint) {
      return res.status(404).json({ error: "Waypoint not found" });
    }

    // Log activity
    await storage.createActivityLog({
      activityType: 'waypoint_updated',
      description: `Waypoint updated${updatedWaypoint.name ? ': ' + updatedWaypoint.name : ''}`,
      userId: req.body.userId || null,
      relatedEntityType: 'waypoint',
      relatedEntityId: waypointId,
      metadata: { 
        voyageId: updatedWaypoint.voyageId,
        updated: Object.keys(waypointUpdate)
      }
    });

    return res.json(updatedWaypoint);
  }));

  // Delete a waypoint
  apiRouter.delete("/waypoints/:id", asyncHandler(async (req: Request, res: Response) => {
    const waypointId = parseInt(req.params.id);
    if (isNaN(waypointId)) {
      return res.status(400).json({ error: "Invalid waypoint ID" });
    }

    const waypoint = await storage.getWaypoint(waypointId);
    if (!waypoint) {
      return res.status(404).json({ error: "Waypoint not found" });
    }

    const success = await storage.deleteWaypoint(waypointId);
    
    // Log activity
    await storage.createActivityLog({
      activityType: 'waypoint_deleted',
      description: `Waypoint deleted${waypoint.name ? ': ' + waypoint.name : ''}`,
      userId: req.body.userId || null,
      relatedEntityType: 'waypoint',
      relatedEntityId: waypointId,
      metadata: { voyageId: waypoint.voyageId }
    });

    return res.json({ success });
  }));

  // Get fuel consumption data for a vessel
  apiRouter.get("/fuel-consumption/:vesselId", asyncHandler(async (req: Request, res: Response) => {
    const vesselId = parseInt(req.params.vesselId);
    if (isNaN(vesselId)) {
      return res.status(400).json({ error: "Invalid vessel ID" });
    }

    const data = await storage.getFuelConsumptionData(vesselId);
    return res.json(data);
  }));

  // Add a fuel consumption data point
  apiRouter.post("/fuel-consumption", asyncHandler(async (req: Request, res: Response) => {
    const validationResult = insertFuelConsumptionChartSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({ 
        error: "Invalid fuel consumption data", 
        details: validationResult.error.format() 
      });
    }

    const dataPoint = await storage.addFuelConsumptionDataPoint(validationResult.data);
    return res.status(201).json(dataPoint);
  }));

  // Get speed data for a vessel
  apiRouter.get("/speed-data/:vesselId", asyncHandler(async (req: Request, res: Response) => {
    const vesselId = parseInt(req.params.vesselId);
    if (isNaN(vesselId)) {
      return res.status(400).json({ error: "Invalid vessel ID" });
    }

    const data = await storage.getSpeedData(vesselId);
    return res.json(data);
  }));

  // Add a speed data point
  apiRouter.post("/speed-data", asyncHandler(async (req: Request, res: Response) => {
    const validationResult = insertSpeedChartSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({ 
        error: "Invalid speed data", 
        details: validationResult.error.format() 
      });
    }

    const dataPoint = await storage.addSpeedDataPoint(validationResult.data);
    return res.status(201).json(dataPoint);
  }));
  
  // Calculate voyage fuel consumption and duration
  apiRouter.get("/voyages/:id/calculate", asyncHandler(async (req: Request, res: Response) => {
    const voyageId = parseInt(req.params.id);
    if (isNaN(voyageId)) {
      return res.status(400).json({ error: "Invalid voyage ID" });
    }
    
    try {
      const calculations = await storage.calculateVoyageFuelConsumption(voyageId);
      return res.json(calculations);
    } catch (error) {
      console.error("Error calculating voyage metrics:", error);
      return res.status(500).json({ 
        error: "Failed to calculate voyage metrics", 
        details: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  }));
  
  // Calculate and update waypoint arrival and departure times
  apiRouter.post("/voyages/:id/calculate-times", asyncHandler(async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Authentication required. Please log in." });
    }
    
    const voyageId = parseInt(req.params.id);
    if (isNaN(voyageId)) {
      return res.status(400).json({ error: "Invalid voyage ID" });
    }
    
    try {
      // Import the calculation function
      const { calculateWaypointTimes } = await import('./calcWaypointTimes');
      
      // Calculate and update the waypoint times
      await calculateWaypointTimes(voyageId);
      
      // Get the updated waypoints
      const updatedWaypoints = await storage.getWaypointsByVoyage(voyageId);
      
      return res.json({
        success: true,
        message: `Successfully calculated arrival and departure times for voyage ${voyageId}`,
        waypoints: updatedWaypoints
      });
    } catch (error) {
      console.error("Error calculating waypoint times:", error);
      return res.status(500).json({ 
        error: "Failed to calculate waypoint times", 
        details: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  }));
  
  // Get vessel fuel consumption data
  apiRouter.get("/vessels/:vesselId/fuel-consumption-data", asyncHandler(async (req: Request, res: Response) => {
    const vesselId = parseInt(req.params.vesselId);
    if (isNaN(vesselId)) {
      return res.status(400).json({ error: "Invalid vessel ID" });
    }
    
    try {
      const fuelData = await storage.getFuelConsumptionData(vesselId);
      return res.json(fuelData);
    } catch (error) {
      console.error("Error fetching fuel consumption data:", error);
      return res.status(500).json({ 
        error: "Failed to fetch fuel consumption data", 
        details: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  }));
  
  // Get vessel speed data
  apiRouter.get("/vessels/:vesselId/speed-data", asyncHandler(async (req: Request, res: Response) => {
    const vesselId = parseInt(req.params.vesselId);
    if (isNaN(vesselId)) {
      return res.status(400).json({ error: "Invalid vessel ID" });
    }
    
    try {
      const speedData = await storage.getSpeedData(vesselId);
      return res.json(speedData);
    } catch (error) {
      console.error("Error fetching speed data:", error);
      return res.status(500).json({ 
        error: "Failed to fetch speed data", 
        details: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  }));

  // =========== Vessel Management Routes =============
  
  // Get all vessels
  apiRouter.get("/vessels-management", async (_req: Request, res: Response) => {
    try {
      const vessels = await storage.getAllVessels();
      res.json(vessels);
    } catch (error) {
      res.status(500).json({ message: "Failed to get vessels" });
    }
  });
  
  // Get active vessels
  apiRouter.get("/vessels-management/active", async (_req: Request, res: Response) => {
    try {
      const vessels = await storage.getActiveVessels();
      res.json(vessels);
    } catch (error) {
      res.status(500).json({ message: "Failed to get active vessels" });
    }
  });

  // Get vessel by ID
  apiRouter.get("/vessels-management/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const vessel = await storage.getVessel(id);
      
      if (!vessel) {
        return res.status(404).json({ message: "Vessel not found" });
      }
      
      res.json(vessel);
    } catch (error) {
      res.status(500).json({ message: "Failed to get vessel" });
    }
  });

  // Create new vessel (admin only)
  apiRouter.post("/vessels-management", async (req: Request, res: Response) => {
    try {
      // Only admins can create vessels
      if (req.isAuthenticated() && req.user.role === "admin") {
        const validatedData = insertVesselSchema.parse(req.body);
        const vessel = await storage.createVessel(validatedData);
        
        // Log activity
        await storage.createActivityLog({
          activityType: 'vessel_created',
          description: `New vessel added: ${vessel.name}`,
          userId: req.user.id,
          relatedEntityType: 'vessel',
          relatedEntityId: vessel.id,
          metadata: { vesselType: vessel.vesselType }
        });
        
        res.status(201).json(vessel);
      } else {
        res.status(403).json({ error: "Only admins can create vessels" });
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid vessel data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create vessel" });
    }
  });

  // Update vessel (admin only)
  apiRouter.patch("/vessels-management/:id", async (req: Request, res: Response) => {
    try {
      // Only admins can update vessels
      if (req.isAuthenticated() && req.user.role === "admin") {
        const id = parseInt(req.params.id);
        const existingVessel = await storage.getVessel(id);
        
        if (!existingVessel) {
          return res.status(404).json({ message: "Vessel not found" });
        }
        
        const updatedVessel = await storage.updateVessel(id, req.body);
        
        // Log activity
        await storage.createActivityLog({
          activityType: 'vessel_updated',
          description: `Vessel updated: ${existingVessel.name}`,
          userId: req.user.id,
          relatedEntityType: 'vessel',
          relatedEntityId: id,
          metadata: { updated: Object.keys(req.body) }
        });
        
        res.json(updatedVessel);
      } else {
        res.status(403).json({ error: "Only admins can update vessels" });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to update vessel" });
    }
  });

  // Delete vessel (admin only)
  apiRouter.delete("/vessels-management/:id", async (req: Request, res: Response) => {
    try {
      // Only admins can delete vessels
      if (req.isAuthenticated() && req.user.role === "admin") {
        const id = parseInt(req.params.id);
        const vessel = await storage.getVessel(id);
        
        if (!vessel) {
          return res.status(404).json({ message: "Vessel not found" });
        }
        
        const deleted = await storage.deleteVessel(id);
        
        if (!deleted) {
          return res.status(500).json({ message: "Failed to delete vessel" });
        }
        
        // Log activity
        await storage.createActivityLog({
          activityType: 'vessel_deleted',
          description: `Vessel deleted: ${vessel.name}`,
          userId: req.user.id,
          relatedEntityType: 'vessel',
          relatedEntityId: id,
          metadata: { vesselType: vessel.vesselType }
        });
        
        res.status(204).send();
      } else {
        res.status(403).json({ error: "Only admins can delete vessels" });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to delete vessel" });
    }
  });

  // =========== User-Vessel Assignment Routes =============
  
  // Get all user-vessel assignments
  apiRouter.get("/user-vessel-assignments", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const userId = req.query.userId ? parseInt(req.query.userId as string) : undefined;
      const vesselId = req.query.vesselId ? parseInt(req.query.vesselId as string) : undefined;
      
      // Regular users can only view their own assignments
      if (req.user.role !== "admin" && (!userId || userId !== req.user.id)) {
        return res.status(403).json({ error: "You are only authorized to view your own assignments" });
      }
      
      console.log(`Processing vessel assignment request for ${userId ? `userId ${userId}` : vesselId ? `vesselId ${vesselId}` : 'all assignments'}`);
      
      try {
        let assignments = [];
        
        if (userId) {
          assignments = await storage.getUserVesselAssignments(userId);
        } else if (vesselId) {
          assignments = await storage.getVesselUserAssignments(vesselId);
        } else {
          // Admin requesting all assignments
          // For now, return a message suggesting to filter
          return res.status(400).json({ 
            message: "Please provide either userId or vesselId query parameter to filter assignments" 
          });
        }
        
        // Get vessel details for each assignment
        const vessels = await storage.getAllVessels();
        
        // Join vessel data with assignments for better context
        if (vessels && vessels.length > 0) {
          assignments = assignments.map(assignment => {
            const vessel = vessels.find(v => v.id === assignment.vesselId);
            return {
              ...assignment,
              vessel: vessel || undefined
            };
          });
        }
        
        console.log(`Returning ${assignments.length} vessel assignments`);
        res.json(assignments);
        
      } catch (error) {
        console.error("Error retrieving vessel assignments:", error);
        throw error;
      }
    } catch (error) {
      console.error("Failed to get user-vessel assignments:", error);
      res.status(500).json({ message: "Failed to get user-vessel assignments" });
    }
  });

  // Get user-vessel assignment by ID
  apiRouter.get("/user-vessel-assignments/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const assignment = await storage.getUserVesselAssignment(id);
      
      if (!assignment) {
        return res.status(404).json({ message: "User-vessel assignment not found" });
      }
      
      // Check if the requester is an admin or the user in the assignment
      if (req.isAuthenticated() && (req.user.role === "admin" || req.user.id === assignment.userId)) {
        res.json(assignment);
      } else {
        res.status(403).json({ error: "Not authorized to view this assignment" });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to get user-vessel assignment" });
    }
  });

  // Create new user-vessel assignment (admin only)
  apiRouter.post("/user-vessel-assignments", async (req: Request, res: Response) => {
    try {
      // Only admins can create assignments
      if (req.isAuthenticated() && req.user.role === "admin") {
        const validatedData = insertUserVesselAssignmentSchema.parse(req.body);
        
        // Verify that both user and vessel exist
        const user = await storage.getUser(validatedData.userId);
        const vessel = await storage.getVessel(validatedData.vesselId);
        
        if (!user) {
          return res.status(404).json({ message: "User not found" });
        }
        
        if (!vessel) {
          return res.status(404).json({ message: "Vessel not found" });
        }
        
        // Check if assignment already exists
        const existingAssignments = await storage.getUserVesselAssignments(validatedData.userId);
        const alreadyAssigned = existingAssignments.some(a => a.vesselId === validatedData.vesselId);
        
        if (alreadyAssigned) {
          return res.status(400).json({ message: "User is already assigned to this vessel" });
        }
        
        const assignment = await storage.createUserVesselAssignment(validatedData);
        
        // Log activity
        await storage.createActivityLog({
          activityType: 'user_vessel_assignment_created',
          description: `User ${user.username} assigned to vessel ${vessel.name} as ${assignment.role}`,
          userId: req.user.id,
          relatedEntityType: 'user_vessel_assignment',
          relatedEntityId: assignment.id,
          metadata: { 
            userId: user.id,
            vesselId: vessel.id,
            role: assignment.role
          }
        });
        
        res.status(201).json(assignment);
      } else {
        res.status(403).json({ error: "Only admins can create user-vessel assignments" });
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid assignment data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create user-vessel assignment" });
    }
  });

  // Update user-vessel assignment (admin only)
  apiRouter.patch("/user-vessel-assignments/:id", async (req: Request, res: Response) => {
    try {
      // Only admins can update assignments
      if (req.isAuthenticated() && req.user.role === "admin") {
        const id = parseInt(req.params.id);
        const existingAssignment = await storage.getUserVesselAssignment(id);
        
        if (!existingAssignment) {
          return res.status(404).json({ message: "User-vessel assignment not found" });
        }
        
        const updatedAssignment = await storage.updateUserVesselAssignment(id, req.body);
        
        // Get user and vessel info for logging
        const user = await storage.getUser(existingAssignment.userId);
        const vessel = await storage.getVessel(existingAssignment.vesselId);
        
        // Log activity
        await storage.createActivityLog({
          activityType: 'user_vessel_assignment_updated',
          description: `Updated assignment of user ${user?.username || 'Unknown'} to vessel ${vessel?.name || 'Unknown'}`,
          userId: req.user.id,
          relatedEntityType: 'user_vessel_assignment',
          relatedEntityId: id,
          metadata: { 
            updated: Object.keys(req.body),
            userId: existingAssignment.userId,
            vesselId: existingAssignment.vesselId
          }
        });
        
        res.json(updatedAssignment);
      } else {
        res.status(403).json({ error: "Only admins can update user-vessel assignments" });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to update user-vessel assignment" });
    }
  });

  // Delete user-vessel assignment (admin only)
  apiRouter.delete("/user-vessel-assignments/:id", async (req: Request, res: Response) => {
    try {
      // Only admins can delete assignments
      if (req.isAuthenticated() && req.user.role === "admin") {
        const id = parseInt(req.params.id);
        const assignment = await storage.getUserVesselAssignment(id);
        
        if (!assignment) {
          return res.status(404).json({ message: "User-vessel assignment not found" });
        }
        
        // Get user and vessel info for logging before deletion
        const user = await storage.getUser(assignment.userId);
        const vessel = await storage.getVessel(assignment.vesselId);
        
        const deleted = await storage.deleteUserVesselAssignment(id);
        
        if (!deleted) {
          return res.status(500).json({ message: "Failed to delete user-vessel assignment" });
        }
        
        // Log activity
        await storage.createActivityLog({
          activityType: 'user_vessel_assignment_deleted',
          description: `Removed assignment of user ${user?.username || 'Unknown'} from vessel ${vessel?.name || 'Unknown'}`,
          userId: req.user.id,
          relatedEntityType: 'user_vessel_assignment',
          relatedEntityId: id,
          metadata: { 
            userId: assignment.userId,
            vesselId: assignment.vesselId,
            role: assignment.role
          }
        });
        
        res.status(204).send();
      } else {
        res.status(403).json({ error: "Only admins can delete user-vessel assignments" });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to delete user-vessel assignment" });
    }
  });
  
  // =========== Financial Management - Vendors Routes =============
  
  // Get all vendors
  apiRouter.get("/vendors", asyncHandler(async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Authentication required. Please log in." });
      }
      
      // Directly query the vendors table
      const vendorsList = await db.query.vendors.findMany();
      res.json(vendorsList);
    } catch (error) {
      console.error("Error fetching vendors:", error);
      res.status(500).json({ error: "Failed to get vendors" });
    }
  }));
  
  // Get active vendors only
  apiRouter.get("/vendors/active", asyncHandler(async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Authentication required. Please log in." });
      }
      
      const activeVendors = await db.query.vendors.findMany({
        where: (vendors, { eq }) => eq(vendors.isActive, true)
      });
      res.json(activeVendors);
    } catch (error) {
      console.error("Error fetching active vendors:", error);
      res.status(500).json({ error: "Failed to get active vendors" });
    }
  }));
  
  // Get a vendor by ID
  apiRouter.get("/vendors/:id", asyncHandler(async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Authentication required. Please log in." });
      }
      
      const vendorId = parseInt(req.params.id);
      const vendor = await db.query.vendors.findFirst({
        where: (vendors, { eq }) => eq(vendors.id, vendorId)
      });
      
      if (!vendor) {
        return res.status(404).json({ error: "Vendor not found" });
      }
      
      res.json(vendor);
    } catch (error) {
      console.error(`Error fetching vendor ${req.params.id}:`, error);
      res.status(500).json({ error: "Failed to get vendor" });
    }
  }));
  
  // Create a vendor
  apiRouter.post("/vendors", asyncHandler(async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Authentication required. Please log in." });
      }
      
      const validatedData = insertVendorSchema.parse(req.body);
      const newVendor = await db.insert(vendors).values(validatedData).returning();
      
      res.status(201).json(newVendor[0]);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "Invalid vendor data", 
          details: error.errors 
        });
      }
      console.error("Error creating vendor:", error);
      res.status(500).json({ error: "Failed to create vendor" });
    }
  }));
  
  // Update a vendor
  apiRouter.patch("/vendors/:id", asyncHandler(async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Authentication required. Please log in." });
      }
      
      const vendorId = parseInt(req.params.id);
      const existingVendor = await db.query.vendors.findFirst({
        where: (vendors, { eq }) => eq(vendors.id, vendorId)
      });
      
      if (!existingVendor) {
        return res.status(404).json({ error: "Vendor not found" });
      }
      
      const updatedVendorArray = await db
        .update(vendors)
        .set(req.body)
        .where(eq(vendors.id, vendorId))
        .returning();
      
      const updatedVendor = updatedVendorArray[0];
      res.json(updatedVendor);
    } catch (error) {
      console.error(`Error updating vendor ${req.params.id}:`, error);
      res.status(500).json({ error: "Failed to update vendor" });
    }
  }));
  
  // Delete a vendor (soft delete by setting isActive = false)
  apiRouter.delete("/vendors/:id", asyncHandler(async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Authentication required. Please log in." });
      }
      
      const vendorId = parseInt(req.params.id);
      const existingVendor = await db.query.vendors.findFirst({
        where: (vendors, { eq }) => eq(vendors.id, vendorId)
      });
      
      if (!existingVendor) {
        return res.status(404).json({ error: "Vendor not found" });
      }
      
      // Soft delete - set isActive to false
      await db
        .update(vendors)
        .set({ isActive: false })
        .where(eq(vendors.id, vendorId));
      
      res.status(204).send();
    } catch (error) {
      console.error(`Error deleting vendor ${req.params.id}:`, error);
      res.status(500).json({ error: "Failed to delete vendor" });
    }
  }));
  
  // =========== Financial Management - Financial Accounts Routes =============
  
  // Get all financial accounts
  apiRouter.get("/financial-accounts", asyncHandler(async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Authentication required. Please log in." });
    }
    
    const accounts = await storage.getAllFinancialAccounts();
    return res.json(accounts);
  }));
  
  // Get financial accounts by vessel
  apiRouter.get("/financial-accounts/vessel/:vesselId", asyncHandler(async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Authentication required. Please log in." });
    }
    
    const vesselId = parseInt(req.params.vesselId);
    if (isNaN(vesselId)) {
      return res.status(400).json({ error: "Invalid vessel ID" });
    }
    
    const accounts = await storage.getFinancialAccountsByVessel(vesselId);
    return res.json(accounts);
  }));
  
  // Get financial accounts by category
  apiRouter.get("/financial-accounts/category/:category", asyncHandler(async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Authentication required. Please log in." });
    }
    
    const { category } = req.params;
    const accounts = await storage.getFinancialAccountByCategory(category);
    return res.json(accounts);
  }));
  
  // Get a financial account by ID
  apiRouter.get("/financial-accounts/:id", asyncHandler(async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Authentication required. Please log in." });
    }
    
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid account ID" });
    }
    
    const account = await storage.getFinancialAccount(id);
    if (!account) {
      return res.status(404).json({ error: "Account not found" });
    }
    
    return res.json(account);
  }));
  
  // Create a financial account
  apiRouter.post("/financial-accounts", asyncHandler(async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Authentication required. Please log in." });
    }
    
    const validationResult = insertFinancialAccountSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({ 
        error: "Invalid account data", 
        details: validationResult.error.format() 
      });
    }
    
    // Add the created_by_id to the data
    const accountData = {
      ...validationResult.data,
      createdById: req.user.id
    };
    
    const account = await storage.createFinancialAccount(accountData);
    return res.status(201).json(account);
  }));
  
  // Update a financial account
  apiRouter.patch("/financial-accounts/:id", asyncHandler(async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Authentication required. Please log in." });
    }
    
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid account ID" });
    }
    
    const account = await storage.getFinancialAccount(id);
    if (!account) {
      return res.status(404).json({ error: "Account not found" });
    }
    
    const updatedAccount = await storage.updateFinancialAccount(id, req.body);
    return res.json(updatedAccount);
  }));
  
  // Delete a financial account
  apiRouter.delete("/financial-accounts/:id", asyncHandler(async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Authentication required. Please log in." });
    }
    
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid account ID" });
    }
    
    const account = await storage.getFinancialAccount(id);
    if (!account) {
      return res.status(404).json({ error: "Account not found" });
    }
    
    const success = await storage.deleteFinancialAccount(id);
    if (success) {
      return res.status(204).send();
    } else {
      return res.status(500).json({ error: "Failed to delete account" });
    }
  }));
  
  // =========== Financial Management - Budgets Routes =============
  
  // Get all budgets
  apiRouter.get("/budgets", asyncHandler(async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Authentication required. Please log in." });
    }
    
    const budgets = await storage.getActiveBudgets();
    return res.json(budgets);
  }));
  
  // Get budgets by vessel
  apiRouter.get("/budgets/vessel/:vesselId", asyncHandler(async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Authentication required. Please log in." });
    }
    
    const vesselId = parseInt(req.params.vesselId);
    if (isNaN(vesselId)) {
      return res.status(400).json({ error: "Invalid vessel ID" });
    }
    
    const budgets = await storage.getBudgetsByVessel(vesselId);
    return res.json(budgets);
  }));
  
  // Get a budget by ID
  apiRouter.get("/budgets/:id", asyncHandler(async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Authentication required. Please log in." });
    }
    
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid budget ID" });
    }
    
    const budget = await storage.getBudget(id);
    if (!budget) {
      return res.status(404).json({ error: "Budget not found" });
    }
    
    return res.json(budget);
  }));
  
  // Create a budget
  apiRouter.post("/budgets", asyncHandler(async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Authentication required. Please log in." });
    }
    
    const validationResult = insertBudgetSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({ 
        error: "Invalid budget data", 
        details: validationResult.error.format() 
      });
    }
    
    // Add the created_by_id to the data
    const budgetData = {
      ...validationResult.data,
      createdById: req.user.id
    };
    
    const budget = await storage.createBudget(budgetData);
    return res.status(201).json(budget);
  }));
  
  // Update a budget
  apiRouter.patch("/budgets/:id", asyncHandler(async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Authentication required. Please log in." });
    }
    
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid budget ID" });
    }
    
    const budget = await storage.getBudget(id);
    if (!budget) {
      return res.status(404).json({ error: "Budget not found" });
    }
    
    const updatedBudget = await storage.updateBudget(id, req.body);
    return res.json(updatedBudget);
  }));
  
  // Delete a budget
  apiRouter.delete("/budgets/:id", asyncHandler(async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Authentication required. Please log in." });
    }
    
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid budget ID" });
    }
    
    const budget = await storage.getBudget(id);
    if (!budget) {
      return res.status(404).json({ error: "Budget not found" });
    }
    
    const success = await storage.deleteBudget(id);
    if (success) {
      return res.status(204).send();
    } else {
      return res.status(500).json({ error: "Failed to delete budget" });
    }
  }));
  
  // =========== Financial Management - Budget Allocations Routes =============
  
  // Get budget allocations by budget
  apiRouter.get("/budget-allocations/budget/:budgetId", asyncHandler(async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Authentication required. Please log in." });
    }
    
    const budgetId = parseInt(req.params.budgetId);
    if (isNaN(budgetId)) {
      return res.status(400).json({ error: "Invalid budget ID" });
    }
    
    const allocations = await storage.getBudgetAllocationsByBudget(budgetId);
    return res.json(allocations);
  }));
  
  // Get budget allocations by account
  apiRouter.get("/budget-allocations/account/:accountId", asyncHandler(async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Authentication required. Please log in." });
    }
    
    const accountId = parseInt(req.params.accountId);
    if (isNaN(accountId)) {
      return res.status(400).json({ error: "Invalid account ID" });
    }
    
    const allocations = await storage.getBudgetAllocationsByAccount(accountId);
    return res.json(allocations);
  }));
  
  // Create a budget allocation
  apiRouter.post("/budget-allocations", asyncHandler(async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Authentication required. Please log in." });
    }
    
    const validationResult = insertBudgetAllocationSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({ 
        error: "Invalid budget allocation data", 
        details: validationResult.error.format() 
      });
    }
    
    // Add the created_by_id to the data
    const allocationData = {
      ...validationResult.data,
      createdById: req.user.id
    };
    
    const allocation = await storage.createBudgetAllocation(allocationData);
    return res.status(201).json(allocation);
  }));
  
  // Update a budget allocation
  apiRouter.patch("/budget-allocations/:id", asyncHandler(async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Authentication required. Please log in." });
    }
    
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid allocation ID" });
    }
    
    const allocation = await storage.getBudgetAllocation(id);
    if (!allocation) {
      return res.status(404).json({ error: "Budget allocation not found" });
    }
    
    const updatedAllocation = await storage.updateBudgetAllocation(id, req.body);
    return res.json(updatedAllocation);
  }));
  
  // =========== Financial Management - Expenses Routes =============
  
  // Get expenses by vessel
  apiRouter.get("/expenses/vessel/:vesselId", asyncHandler(async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Authentication required. Please log in." });
    }
    
    const vesselId = parseInt(req.params.vesselId);
    if (isNaN(vesselId)) {
      return res.status(400).json({ error: "Invalid vessel ID" });
    }
    
    const expenses = await storage.getExpensesByVessel(vesselId);
    return res.json(expenses);
  }));
  
  // Get expenses by budget
  apiRouter.get("/expenses/budget/:budgetId", asyncHandler(async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Authentication required. Please log in." });
    }
    
    const budgetId = parseInt(req.params.budgetId);
    if (isNaN(budgetId)) {
      return res.status(400).json({ error: "Invalid budget ID" });
    }
    
    const expenses = await storage.getExpensesByBudget(budgetId);
    return res.json(expenses);
  }));
  
  // Get expenses by account
  apiRouter.get("/expenses/account/:accountId", asyncHandler(async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Authentication required. Please log in." });
    }
    
    const accountId = parseInt(req.params.accountId);
    if (isNaN(accountId)) {
      return res.status(400).json({ error: "Invalid account ID" });
    }
    
    const expenses = await storage.getExpensesByAccount(accountId);
    return res.json(expenses);
  }));
  
  // Get expenses by category
  apiRouter.get("/expenses/category/:category", asyncHandler(async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Authentication required. Please log in." });
    }
    
    const { category } = req.params;
    const expenses = await storage.getExpensesByCategory(category);
    return res.json(expenses);
  }));
  
  // Create an expense
  apiRouter.post("/expenses", asyncHandler(async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Authentication required. Please log in." });
    }
    
    const validationResult = insertExpenseSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({ 
        error: "Invalid expense data", 
        details: validationResult.error.format() 
      });
    }
    
    // Add the created_by_id to the data
    const expenseData = {
      ...validationResult.data,
      createdById: req.user.id
    };
    
    const expense = await storage.createExpense(expenseData);
    return res.status(201).json(expense);
  }));
  
  // Bulk create expenses
  apiRouter.post("/expenses/bulk", asyncHandler(async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Authentication required. Please log in." });
    }
    
    try {
      console.log("DEBUG: Received bulk expenses request with body:", JSON.stringify(req.body));
      
      const expensesData = req.body as any[];
      if (!Array.isArray(expensesData)) {
        console.log("DEBUG: Invalid data format, not an array:", typeof req.body);
        return res.status(400).json({ error: "Invalid data format. Expected an array of expenses." });
      }
      
      console.log(`DEBUG: Processing ${expensesData.length} expenses for bulk import`);
      
      // Validate each expense in the array
      const validatedExpenses: InsertExpense[] = [];
      const errors: { index: number; errors: any }[] = [];
      
      // Process each expense
      expensesData.forEach((expense, index) => {
        console.log(`DEBUG: Validating expense at index ${index}:`, JSON.stringify(expense));
        
        // Remove transactionId if it exists to prevent foreign key constraint errors
        if (expense.transactionId === 0 || expense.transactionId === undefined) {
          delete expense.transactionId;
        }
        
        const validationResult = insertExpenseSchema.safeParse(expense);
        if (validationResult.success) {
          // Add the user ID to the expense data
          console.log(`DEBUG: Expense ${index} is valid, adding to validated list`);
          validatedExpenses.push({
            ...validationResult.data,
            createdById: req.user.id
          });
        } else {
          console.log(`DEBUG: Expense ${index} failed validation:`, JSON.stringify(validationResult.error.format()));
          errors.push({
            index,
            errors: validationResult.error.format()
          });
        }
      });
      
      // If there are validation errors, return them
      if (errors.length > 0) {
        console.log(`DEBUG: ${errors.length} expenses failed validation`);
        return res.status(400).json({
          error: "Some expenses failed validation",
          details: errors,
          validCount: validatedExpenses.length,
          errorCount: errors.length
        });
      }
      
      // Create all expenses
      console.log(`DEBUG: Sending ${validatedExpenses.length} validated expenses to storage:`, JSON.stringify(validatedExpenses));
      const createdExpenses = await storage.createBulkExpenses(validatedExpenses);
      console.log(`DEBUG: Successfully created ${createdExpenses.length} expenses`);
      
      return res.status(201).json({
        message: "Expenses imported successfully",
        count: createdExpenses.length,
        expenses: createdExpenses
      });
    } catch (error) {
      console.error("Error bulk creating expenses:", error);
      return res.status(500).json({ error: "Failed to create expenses" });
    }
  }));
  
  // Categorize a single expense using AI
  apiRouter.post("/expenses/categorize", asyncHandler(async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Authentication required. Please log in." });
    }
    
    try {
      const { expenseDescription, amount } = req.body;
      
      if (!expenseDescription) {
        return res.status(400).json({ error: "Expense description is required" });
      }
      
      // Call OpenAI to categorize the expense
      const result = await categorizeExpense(expenseDescription, amount);
      
      res.json(result);
    } catch (error) {
      console.error("Error categorizing expense:", error);
      res.status(500).json({ error: "Failed to categorize expense", message: error.message });
    }
  }));
  
  // Batch categorize multiple expenses using AI
  apiRouter.post("/expenses/categorize-batch", asyncHandler(async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Authentication required. Please log in." });
    }
    
    try {
      const { expenses } = req.body;
      
      if (!Array.isArray(expenses) || expenses.length === 0) {
        return res.status(400).json({ error: "Invalid data format. Expected an array of expenses." });
      }
      
      // Validate that each expense has a description
      for (const expense of expenses) {
        if (!expense.description) {
          return res.status(400).json({ 
            error: "All expenses must have a description",
            invalidExpense: expense
          });
        }
      }
      
      // Call OpenAI to categorize all expenses
      const results = await batchCategorizeExpenses(expenses);
      
      res.json(results);
    } catch (error) {
      console.error("Error batch categorizing expenses:", error);
      res.status(500).json({ error: "Failed to categorize expenses", message: error.message });
    }
  }));
  
  // Update an expense
  apiRouter.patch("/expenses/:id", asyncHandler(async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Authentication required. Please log in." });
    }
    
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid expense ID" });
    }
    
    const expense = await storage.getExpense(id);
    if (!expense) {
      return res.status(404).json({ error: "Expense not found" });
    }
    
    const updatedExpense = await storage.updateExpense(id, req.body);
    return res.json(updatedExpense);
  }));
  
  // Put endpoint for backward compatibility with existing client code
  apiRouter.put("/expenses/:id", asyncHandler(async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Authentication required. Please log in." });
    }
    
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid expense ID" });
    }
    
    const expense = await storage.getExpense(id);
    if (!expense) {
      return res.status(404).json({ error: "Expense not found" });
    }
    
    const validationResult = insertExpenseSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({ 
        error: "Invalid expense data", 
        details: validationResult.error.format() 
      });
    }
    
    const updatedExpense = await storage.updateExpense(id, validationResult.data);
    return res.json(updatedExpense);
  }));
  
  // Get expense stats by vessel (for dashboard widgets)
  apiRouter.get("/expenses/vessel/:id/stats", asyncHandler(async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Authentication required. Please log in." });
    }

    const vesselId = parseInt(req.params.id);
    if (isNaN(vesselId)) {
      return res.status(400).json({ error: "Valid vessel ID is required" });
    }

    // Get all expenses for the vessel
    const expenses = await storage.getExpensesByVessel(vesselId);
    
    // For backwards compatibility with the UI that may expect transactions
    const deposits = []; // We'll implement deposits separately

    res.json({ 
      expenses,
      deposits
    });
  }));

  // Get financial summary for the dashboard using expenses
  apiRouter.get("/expenses/vessel/:id/summary", asyncHandler(async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Authentication required. Please log in." });
    }

    const vesselId = parseInt(req.params.id);
    if (isNaN(vesselId)) {
      return res.status(400).json({ error: "Valid vessel ID is required" });
    }

    // Get all expenses for the vessel
    const expenses = await storage.getExpensesByVessel(vesselId);

    // Get accounts for this vessel to calculate available funds
    const accounts = await storage.getFinancialAccountsByVessel(vesselId);
    
    // Calculate total available funds across all accounts
    const availableFunds = accounts.reduce((sum, account) => 
      sum + parseFloat(account.balance.toString() || '0'), 0);

    // Get current date info for filtering
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

    // Calculate total expenses
    let totalExpenses = 0;
    let lastMonthExpenses = 0;

    expenses.forEach(e => {
      const amount = parseFloat(e.total.toString());
      const expenseDate = new Date(e.expenseDate);
      const isCurrentMonth = 
        expenseDate.getMonth() === currentMonth && 
        expenseDate.getFullYear() === currentYear;
      const isLastMonth = 
        expenseDate.getMonth() === lastMonth && 
        expenseDate.getFullYear() === lastMonthYear;

      totalExpenses += amount;
      if (isLastMonth) lastMonthExpenses += amount;
    });

    // Placeholder values for income until income module is refactored
    const totalIncome = 0;
    const lastMonthIncome = 0;
    const netBalance = totalIncome - totalExpenses;

    res.json({
      totalExpenses,
      totalIncome,
      netBalance,
      availableFunds,
      lastMonthExpenses,
      lastMonthIncome
    });
  }));
  
  // =========== Financial Management - Transactions Routes =============
  
  // Get all transactions
  apiRouter.get("/transactions", asyncHandler(async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Authentication required. Please log in." });
    }
    
    // Get optional filters from query params
    const vesselId = req.query.vesselId ? parseInt(req.query.vesselId as string) : undefined;
    const transactionType = req.query.type as string | undefined;
    
    try {
      // Get all transactions (or filtered by vessel if vesselId provided)
      let transactions;
      if (vesselId) {
        transactions = await storage.getTransactionsByVessel(vesselId);
      } else {
        transactions = await storage.getAllTransactions();
      }
      
      // Apply type filter if provided
      if (transactionType && transactions) {
        transactions = transactions.filter(t => t.transactionType === transactionType);
      }
      
      return res.json(transactions || []);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      return res.status(500).json({ error: "Failed to fetch transactions" });
    }
  }));

  // This endpoint was consolidated with the main /transactions endpoint above

  apiRouter.get("/transactions/vessel/:vesselId", asyncHandler(async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Authentication required. Please log in." });
    }
    
    const vesselId = parseInt(req.params.vesselId);
    if (isNaN(vesselId)) {
      return res.status(400).json({ error: "Invalid vessel ID" });
    }
    
    // Get the transaction type from query parameters if provided
    const transactionType = req.query.type as string | undefined;
    
    // Get transactions for this vessel
    let transactions = await storage.getTransactionsByVessel(vesselId);
    
    // If transaction type is specified, filter the results
    if (transactionType && transactions) {
      transactions = transactions.filter(t => t.transactionType === transactionType);
    }
    
    // Get transaction lines for journal entries
    if (transactionType === 'journal' && transactions && transactions.length > 0) {
      // Get all transaction IDs
      const transactionIds = transactions.map(t => t.id);
      
      // Get all transaction lines for these transactions
      const transactionLines = await storage.getTransactionLinesByTransactionIds(transactionIds);
      
      // Attach transaction lines to their respective transactions
      transactions = transactions.map(transaction => {
        const lines = transactionLines.filter(line => line.transactionId === transaction.id);
        return {
          ...transaction,
          lines
        };
      });
    }
    
    return res.json(transactions);
  }));
  
  // Create a transaction (legacy endpoint - being migrated)
  apiRouter.post("/transactions", asyncHandler(async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Authentication required. Please log in." });
    }
    
    // Temporary compatibility layer while migrating
    const validationResult = insertBankingTransactionSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({ 
        error: "Invalid transaction data", 
        details: validationResult.error.format() 
      });
    }
    
    // Add the created_by_id to the data
    const transactionData = {
      ...validationResult.data,
      createdById: req.user.id
    };
    
    const transaction = await storage.createBankingTransaction(transactionData);
    return res.status(201).json(transaction);
  }));
  
  // Create a banking transaction (new endpoint)
  apiRouter.post("/banking-transactions", asyncHandler(async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Authentication required. Please log in." });
    }
    
    const validationResult = insertBankingTransactionSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({ 
        error: "Invalid transaction data", 
        details: validationResult.error.format() 
      });
    }
    
    // Add the created_by_id to the data
    const transactionData = {
      ...validationResult.data,
      createdById: req.user.id
    };
    
    const transaction = await storage.createBankingTransaction(transactionData);
    return res.status(201).json(transaction);
  }));
  
  // Update a transaction
  apiRouter.put("/transactions/:id", asyncHandler(async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Authentication required. Please log in." });
    }
    
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid transaction ID" });
    }
    
    const transaction = await storage.getTransaction(id);
    if (!transaction) {
      return res.status(404).json({ error: "Transaction not found" });
    }
    
    const validationResult = insertBankingTransactionSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({ 
        error: "Invalid transaction data", 
        details: validationResult.error.format() 
      });
    }
    
    const updatedTransaction = await storage.updateTransaction(id, validationResult.data);
    return res.json(updatedTransaction);
  }));
  
  // =========== Financial Management - Deposits Routes =============
  
  // Get all deposits
  apiRouter.get("/deposits", asyncHandler(async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Authentication required. Please log in." });
    }
    
    const deposits = await storage.getAllDeposits();
    return res.json(deposits);
  }));
  
  // Get deposits by vessel
  apiRouter.get("/deposits/vessel/:vesselId", asyncHandler(async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Authentication required. Please log in." });
    }
    
    const vesselId = parseInt(req.params.vesselId);
    if (isNaN(vesselId)) {
      return res.status(400).json({ error: "Invalid vessel ID" });
    }
    
    console.log(`Fetching deposits for vessel ID: ${vesselId}`);
    const deposits = await storage.getDepositsByVessel(vesselId);
    console.log(`Found ${deposits.length} deposits for vessel ID: ${vesselId}`);
    return res.json(deposits);
  }));
  
  // Get deposits by account
  apiRouter.get("/deposits/account/:accountId", asyncHandler(async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Authentication required. Please log in." });
    }
    
    const accountId = parseInt(req.params.accountId);
    if (isNaN(accountId)) {
      return res.status(400).json({ error: "Invalid account ID" });
    }
    
    console.log(`Fetching deposits for account ID: ${accountId}`);
    const deposits = await storage.getDepositsByAccount(accountId);
    console.log(`Found ${deposits.length} deposits for account ID: ${accountId}`);
    return res.json(deposits);
  }));
  
  // Create a new deposit
  apiRouter.post("/deposits", asyncHandler(async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Authentication required. Please log in." });
    }
    
    try {
      const depositData = req.body as InsertDeposit;
      const newDeposit = await storage.createDeposit(depositData);
      return res.status(201).json(newDeposit);
    } catch (error) {
      console.error("Error creating deposit:", error);
      return res.status(500).json({ error: "Failed to create deposit" });
    }
  }));
  
  // Bulk create deposits
  apiRouter.post("/deposits/bulk", asyncHandler(async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Authentication required. Please log in." });
    }
    
    try {
      const depositsData = req.body as InsertDeposit[];
      if (!Array.isArray(depositsData)) {
        return res.status(400).json({ error: "Invalid data format. Expected an array of deposits." });
      }
      
      const newDeposits = [];
      for (const depositData of depositsData) {
        const newDeposit = await storage.createDeposit(depositData);
        newDeposits.push(newDeposit);
      }
      
      return res.status(201).json(newDeposits);
    } catch (error) {
      console.error("Error bulk creating deposits:", error);
      return res.status(500).json({ error: "Failed to create deposits" });
    }
  }));
  
  // Update a deposit
  apiRouter.put("/deposits/:id", asyncHandler(async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Authentication required. Please log in." });
    }
    
    const depositId = parseInt(req.params.id);
    if (isNaN(depositId)) {
      return res.status(400).json({ error: "Invalid deposit ID" });
    }
    
    try {
      const depositData = req.body as Partial<InsertDeposit>;
      const updatedDeposit = await storage.updateDeposit(depositId, depositData);
      if (!updatedDeposit) {
        return res.status(404).json({ error: "Deposit not found" });
      }
      return res.json(updatedDeposit);
    } catch (error) {
      console.error(`Error updating deposit ${depositId}:`, error);
      return res.status(500).json({ error: "Failed to update deposit" });
    }
  }));
  
  // Delete a deposit
  apiRouter.delete("/deposits/:id", asyncHandler(async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Authentication required. Please log in." });
    }
    
    const depositId = parseInt(req.params.id);
    if (isNaN(depositId)) {
      return res.status(400).json({ error: "Invalid deposit ID" });
    }
    
    try {
      const success = await storage.deleteDeposit(depositId);
      if (!success) {
        return res.status(404).json({ error: "Deposit not found or could not be deleted" });
      }
      return res.json({ message: "Deposit deleted successfully" });
    } catch (error) {
      console.error(`Error deleting deposit ${depositId}:`, error);
      return res.status(500).json({ error: "Failed to delete deposit" });
    }
  }));
  
  // =========== Financial Dashboard API endpoints =============
  
  // Get transaction statistics for financial dashboard
  apiRouter.get("/transactions/vessel/:id/stats", asyncHandler(async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Authentication required. Please log in." });
    }

    const vesselId = parseInt(req.params.id);
    if (isNaN(vesselId)) {
      return res.status(400).json({ error: "Valid vessel ID is required" });
    }

    // Get all transactions for the vessel
    const transactions = await storage.getTransactionsByVessel(vesselId);

    // Get current date info for filtering
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    // Filter expenses for the current month
    const expenses = transactions.filter(t => 
      t.transactionType === 'expense'
    );
    
    // Filter deposits for the current month
    const deposits = transactions.filter(t => 
      t.transactionType === 'deposit'
    );

    res.json({ 
      expenses,
      deposits
    });
  }));

  // Get financial summary for the dashboard
  apiRouter.get("/transactions/vessel/:id/summary", asyncHandler(async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Authentication required. Please log in." });
    }

    const vesselId = parseInt(req.params.id);
    if (isNaN(vesselId)) {
      return res.status(400).json({ error: "Valid vessel ID is required" });
    }

    // Get all transactions for the vessel
    const transactions = await storage.getTransactionsByVessel(vesselId);

    // Get accounts for this vessel to calculate available funds
    const accounts = await storage.getFinancialAccountsByVessel(vesselId);

    // Get current date info for filtering
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
    
    // Calculate totals
    const totalExpenses = transactions
      .filter(t => t.transactionType === 'expense')
      .reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0);
    
    const totalIncome = transactions
      .filter(t => t.transactionType === 'deposit')
      .reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0);
    
    // Calculate expenses for the current month
    const currentMonthExpenses = transactions
      .filter(t => {
        const date = new Date(t.transactionDate);
        return t.transactionType === 'expense' && 
               date.getMonth() === currentMonth && 
               date.getFullYear() === currentYear;
      })
      .reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0);
    
    // Calculate income for the current month
    const currentMonthIncome = transactions
      .filter(t => {
        const date = new Date(t.transactionDate);
        return t.transactionType === 'deposit' && 
               date.getMonth() === currentMonth && 
               date.getFullYear() === currentYear;
      })
      .reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0);
    
    // Calculate expenses for last month
    const lastMonthExpenses = transactions
      .filter(t => {
        const date = new Date(t.transactionDate);
        return t.transactionType === 'expense' && 
               date.getMonth() === lastMonth && 
               date.getFullYear() === lastMonthYear;
      })
      .reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0);
    
    // Calculate income for last month
    const lastMonthIncome = transactions
      .filter(t => {
        const date = new Date(t.transactionDate);
        return t.transactionType === 'deposit' && 
               date.getMonth() === lastMonth && 
               date.getFullYear() === lastMonthYear;
      })
      .reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0);
    
    // Calculate available funds from all accounts
    const availableFunds = accounts.reduce((sum, account) => 
      sum + parseFloat(account.balance.toString()), 0);
    
    res.json({
      totalExpenses,
      totalIncome,
      netBalance: totalIncome - totalExpenses,
      availableFunds,
      currentMonthExpenses,
      currentMonthIncome,
      lastMonthExpenses,
      lastMonthIncome,
      accountCount: accounts.length
    });
  }));

  // Get transaction stats by vessel (for dashboard widgets)
  apiRouter.get("/transactions/vessel/:id/stats", asyncHandler(async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Authentication required. Please log in." });
    }

    const vesselId = parseInt(req.params.id);
    if (isNaN(vesselId)) {
      return res.status(400).json({ error: "Valid vessel ID is required" });
    }

    // Get all transactions for the vessel
    const transactions = await storage.getTransactionsByVessel(vesselId);
    
    // Get current date info for category analysis
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    // Filter expenses and calculate by category
    const expenses = transactions.filter(t => t.transactionType === 'expense');
    
    // Process data by categories
    const expensesByCategory: Record<string, number> = {};
    expenses.forEach(expense => {
      const category = expense.category || 'Uncategorized';
      if (!expensesByCategory[category]) {
        expensesByCategory[category] = 0;
      }
      expensesByCategory[category] += parseFloat(expense.total || expense.amount || '0');
    });
    
    // Get recent transactions (last 10)
    const recentTransactions = [...transactions]
      .sort((a, b) => new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime())
      .slice(0, 10);
    
    res.json({
      expenses,
      expensesByCategory,
      recentTransactions,
      totalTransactions: transactions.length
    });
  }));

  // Get cash flow data for the dashboard
  apiRouter.get("/transactions/vessel/:id/cash-flow", asyncHandler(async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Authentication required. Please log in." });
    }

    const vesselId = parseInt(req.params.id);
    if (isNaN(vesselId)) {
      return res.status(400).json({ error: "Valid vessel ID is required" });
    }

    // Get all transactions for the vessel
    const transactions = await storage.getTransactionsByVessel(vesselId);

    // Get date range (last 6 months)
    const now = new Date();
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(now.getMonth() - 6);
    
    // Group by month
    const monthlyData: Record<string, { date: string; income: number; expenses: number; balance: number }> = {};
    
    for (let i = 0; i < 6; i++) {
      const date = new Date();
      date.setMonth(now.getMonth() - i);
      const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      monthlyData[monthYear] = {
        date: monthYear,
        income: 0,
        expenses: 0,
        balance: 0
      };
    }
    
    // Process transactions
    transactions.forEach(transaction => {
      const date = new Date(transaction.transactionDate);
      // Only include transactions from the last 6 months
      if (date >= sixMonthsAgo) {
        const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        if (monthlyData[monthYear]) {
          const amount = parseFloat(transaction.amount.toString());
          if (transaction.transactionType === 'deposit') {
            monthlyData[monthYear].income += amount;
          } else {
            monthlyData[monthYear].expenses += amount;
          }
        }
      }
    });
    
    // Calculate balance
    Object.keys(monthlyData).forEach(monthYear => {
      monthlyData[monthYear].balance = 
        monthlyData[monthYear].income - monthlyData[monthYear].expenses;
    });
    
    // Convert to array and sort by date
    const result = Object.values(monthlyData).sort((a, b) => 
      a.date.localeCompare(b.date)
    );
    
    res.json(result);
  }));

  // =========== Financial Management - Banking Integration Routes =============
  
  // Get all bank accounts
  apiRouter.get("/banking/accounts", asyncHandler(async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Authentication required. Please log in." });
    }
    
    // Check if vesselId is provided as a query parameter
    const vesselId = req.query.vesselId ? parseInt(req.query.vesselId as string) : null;
    
    // If vesselId is provided, get accounts for that vessel
    if (vesselId && !isNaN(vesselId)) {
      const accounts = await storage.getBankAccountsByVessel(vesselId);
      return res.json(accounts);
    }
    
    // Otherwise return all accounts
    const accounts = await storage.getAllBankAccounts();
    res.json(accounts);
  }));
  
  // Get a specific bank account
  apiRouter.get("/banking/accounts/:id", asyncHandler(async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Authentication required. Please log in." });
    }
    
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid account ID" });
    }
    
    const account = await storage.getBankAccount(id);
    if (!account) {
      return res.status(404).json({ error: "Bank account not found" });
    }
    
    res.json(account);
  }));
  
  // Create a new bank account
  apiRouter.post("/banking/accounts", asyncHandler(async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Authentication required. Please log in." });
    }
    
    try {
      const validatedData = insertBankAccountSchema.parse(req.body);
      
      // Create new bank account
      const account = await storage.createBankAccount(validatedData);
      
      // Log activity
      await storage.createActivityLog({
        activityType: 'bank_account_created',
        description: `New bank account created: ${account.accountName}`,
        userId: req.user.id,
        relatedEntityType: 'bank_account',
        relatedEntityId: account.id,
        metadata: { 
          accountType: account.accountType,
          bankName: account.bankName
        }
      });
      
      res.status(201).json(account);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid bank account data", errors: error.errors });
      }
      console.error("Failed to create bank account:", error);
      res.status(500).json({ message: "Failed to create bank account" });
    }
  }));
  
  // Update a bank account
  apiRouter.patch("/banking/accounts/:id", asyncHandler(async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Authentication required. Please log in." });
    }
    
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid account ID" });
    }
    
    try {
      const existingAccount = await storage.getBankAccount(id);
      if (!existingAccount) {
        return res.status(404).json({ error: "Bank account not found" });
      }
      
      // Update account
      const updatedAccount = await storage.updateBankAccount(id, req.body);
      
      // Log activity
      await storage.createActivityLog({
        activityType: 'bank_account_updated',
        description: `Bank account updated: ${existingAccount.accountName}`,
        userId: req.user.id,
        relatedEntityType: 'bank_account',
        relatedEntityId: id,
        metadata: { updated: Object.keys(req.body) }
      });
      
      res.json(updatedAccount);
    } catch (error) {
      console.error(`Failed to update bank account ${id}:`, error);
      res.status(500).json({ message: "Failed to update bank account" });
    }
  }));
  
  // Delete a bank account
  apiRouter.delete("/banking/accounts/:id", asyncHandler(async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Authentication required. Please log in." });
    }
    
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid account ID" });
    }
    
    try {
      const account = await storage.getBankAccount(id);
      if (!account) {
        return res.status(404).json({ error: "Bank account not found" });
      }
      
      // Check if there are any active connections to this account
      const connections = await storage.getBankApiConnectionsByBankAccount(id);
      if (connections.length > 0) {
        return res.status(400).json({ 
          error: "Cannot delete bank account with active connections",
          connections: connections.length
        });
      }
      
      await storage.deleteBankAccount(id);
      
      // Log activity
      await storage.createActivityLog({
        activityType: 'bank_account_deleted',
        description: `Bank account deleted: ${account.accountName}`,
        userId: req.user.id,
        relatedEntityType: 'bank_account',
        relatedEntityId: id,
        metadata: { 
          accountName: account.accountName,
          bankName: account.bankName
        }
      });
      
      res.status(204).send();
    } catch (error) {
      console.error(`Failed to delete bank account ${id}:`, error);
      res.status(500).json({ message: "Failed to delete bank account" });
    }
  }));
  
  // Get all banking API providers
  apiRouter.get("/banking/providers", asyncHandler(async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Authentication required. Please log in." });
    }
    
    const providers = await storage.getAllBankingApiProviders();
    res.json(providers);
  }));
  
  // Get banking providers for a specific vessel
  apiRouter.get("/banking/providers/vessel/:vesselId", asyncHandler(async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Authentication required. Please log in." });
    }
    
    const vesselId = parseInt(req.params.vesselId);
    if (isNaN(vesselId)) {
      return res.status(400).json({ error: "Invalid vessel ID" });
    }
    
    const providers = await storage.getBankingProvidersByVessel(vesselId);
    res.json(providers);
  }));
  
  // Get bank connections for a specific vessel
  apiRouter.get("/banking/connections/vessel/:vesselId", asyncHandler(async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Authentication required. Please log in." });
    }
    
    const vesselId = parseInt(req.params.vesselId);
    if (isNaN(vesselId)) {
      return res.status(400).json({ error: "Invalid vessel ID" });
    }
    
    const connections = await storage.getBankConnectionsByVessel(vesselId);
    res.json(connections);
  }));
  
  // Get transaction reconciliations for a specific vessel
  apiRouter.get("/banking/reconciliations/vessel/:vesselId", asyncHandler(async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Authentication required. Please log in." });
    }
    
    const vesselId = parseInt(req.params.vesselId);
    if (isNaN(vesselId)) {
      return res.status(400).json({ error: "Invalid vessel ID" });
    }
    
    // Get transactions for this vessel that have reconciliations
    const matchedTransactions = await storage.getMatchedTransactions(vesselId);
    
    // Get unmatched transactions for this vessel
    const unmatchedTransactions = await storage.getUnmatchedTransactions(vesselId);
    
    res.json({
      matched: matchedTransactions,
      unmatched: unmatchedTransactions
    });
  }));
  
  // Get banking transactions for a specific vessel
  apiRouter.get("/banking/transactions/vessel/:vesselId", asyncHandler(async (req: Request, res: Response) => {
    // First log the authentication state for debugging
    console.log('Authentication state for /banking/transactions/vessel/:vesselId:', {
      isAuthenticated: req.isAuthenticated(),
      hasUser: !!req.user,
      userId: req.user?.id
    });
    
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Authentication required. Please log in." });
    }
    
    const vesselId = parseInt(req.params.vesselId);
    if (isNaN(vesselId)) {
      return res.status(400).json({ error: "Invalid vessel ID" });
    }
    
    try {
      // Get banking transactions for this vessel
      const transactions = await storage.getBankingTransactionsByVessel(vesselId);
      
      // Log for debugging
      console.log(`Retrieved ${transactions.length} banking transactions for vessel ${vesselId}`);
      
      res.json(transactions);
    } catch (error) {
      logger.error(`Error fetching banking transactions for vessel ${vesselId}:`, error instanceof Error ? error : new Error(String(error)));
      res.status(500).json({ error: "Failed to fetch banking transactions" });
    }
  }));
  
  // Get all banking transactions for a specific vessel
  apiRouter.get("/banking/transactions/vessel/:vesselId", asyncHandler(async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Authentication required. Please log in." });
    }
    
    const vesselId = parseInt(req.params.vesselId);
    if (isNaN(vesselId)) {
      return res.status(400).json({ error: "Invalid vessel ID" });
    }
    
    try {
      const transactions = await storage.getBankingTransactionsByVessel(vesselId);
      res.json(transactions);
    } catch (error) {
      console.error(`Error fetching banking transactions for vessel ${vesselId}:`, error);
      res.status(500).json({ error: "Failed to fetch banking transactions" });
    }
  }));
  
  // Get unmatched/pending transactions for reconciliation
  apiRouter.get("/banking/transactions/unmatched/:vesselId", asyncHandler(async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Authentication required. Please log in." });
    }
    
    const vesselId = parseInt(req.params.vesselId);
    if (isNaN(vesselId)) {
      return res.status(400).json({ error: "Invalid vessel ID" });
    }
    
    try {
      // Get time period from query params (thisWeek, previousWeeks, thisMonth, all)
      const period = req.query.period as string || 'all';
      
      const currentDate = new Date();
      let startDate = new Date();
      
      // Calculate date ranges based on the requested period
      if (period === 'thisWeek') {
        // Get start of this week (Sunday)
        const day = currentDate.getDay();
        startDate.setDate(currentDate.getDate() - day);
        startDate.setHours(0, 0, 0, 0);
      } else if (period === 'previousWeeks') {
        // Get start of this week, then go back to start of previous week
        const day = currentDate.getDay();
        startDate.setDate(currentDate.getDate() - day - 7);
        startDate.setHours(0, 0, 0, 0);
      } else if (period === 'thisMonth') {
        // Start of current month
        startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      }
      
      // Get unmatched banking transactions for this vessel within the specified period
      const transactions = await storage.getUnmatchedBankingTransactions(vesselId);
      
      // Filter by date if needed
      const filteredTransactions = period === 'all'
        ? transactions
        : transactions.filter(t => {
            const txDate = new Date(t.transactionDate);
            return txDate >= startDate && txDate <= currentDate;
          });
      
      // Count transactions by period
      const thisWeekCount = transactions.filter(t => {
        const txDate = new Date(t.transactionDate);
        const startOfWeek = new Date(currentDate);
        const day = startOfWeek.getDay();
        startOfWeek.setDate(currentDate.getDate() - day);
        startOfWeek.setHours(0, 0, 0, 0);
        return txDate >= startOfWeek;
      }).length;
      
      const previousWeeksCount = transactions.filter(t => {
        const txDate = new Date(t.transactionDate);
        const startOfWeek = new Date(currentDate);
        const day = startOfWeek.getDay();
        startOfWeek.setDate(currentDate.getDate() - day);
        startOfWeek.setHours(0, 0, 0, 0);
        
        const startOfPreviousWeek = new Date(startOfWeek);
        startOfPreviousWeek.setDate(startOfWeek.getDate() - 7);
        
        return txDate < startOfWeek && txDate >= startOfPreviousWeek;
      }).length;
      
      // Return both the transactions and the counts
      res.json({
        transactions: filteredTransactions,
        counts: {
          total: transactions.length,
          thisWeek: thisWeekCount,
          previousWeeks: previousWeeksCount,
        }
      });
    } catch (error) {
      logger.error(`Error fetching unmatched transactions for vessel ${vesselId}:`, error instanceof Error ? error : new Error(String(error)));
      res.status(500).json({ error: "Failed to fetch unmatched transactions" });
    }
  }));
  
  // Get unmatched receipts for a vessel
  apiRouter.get("/receipts/unmatched/:vesselId", asyncHandler(async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Authentication required. Please log in." });
    }
    
    const vesselId = parseInt(req.params.vesselId);
    if (isNaN(vesselId)) {
      return res.status(400).json({ error: "Invalid vessel ID" });
    }
    
    try {
      // Get expenses with receipts that haven't been matched yet
      const expenses = await storage.getExpensesByVessel(vesselId);
      
      // Filter expenses that have receipts but no associated transactions
      const receipts = expenses
        .filter(e => e.receiptUrl && !(e as any).reconciled)
        .map(e => ({
          id: e.id,
          receiptUrl: e.receiptUrl,
          amount: e.total,
          date: e.expenseDate,
          description: e.description,
          status: e.status === 'pending' ? 'processing' : 'processed',
          vendorId: e.vendorId,
          expenseId: e.id
        }));
      
      // Count receipts by processing status
      const processingCount = receipts.filter(r => r.status === 'processing').length;
      const processedCount = receipts.filter(r => r.status === 'processed').length;
      
      res.json({
        receipts,
        counts: {
          total: receipts.length,
          processing: processingCount,
          processed: processedCount
        }
      });
    } catch (error) {
      logger.error(`Error fetching unmatched receipts for vessel ${vesselId}:`, error instanceof Error ? error : new Error(String(error)));
      res.status(500).json({ error: "Failed to fetch unmatched receipts" });
    }
  }));
  
  // Create a new banking provider
  apiRouter.post("/banking/providers", asyncHandler(async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Authentication required. Please log in." });
    }
    
    const providerData = req.body;
    const newProvider = await storage.createBankingProvider(providerData);
    res.status(201).json(newProvider);
  }));
  
  // Get all bank API connections
  apiRouter.get("/banking/connections", asyncHandler(async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Authentication required. Please log in." });
    }
    
    // Check if bankAccountId is provided as a query parameter
    const bankAccountId = req.query.bankAccountId ? parseInt(req.query.bankAccountId as string) : null;
    
    // Check if vesselId is provided as a query parameter
    const vesselId = req.query.vesselId ? parseInt(req.query.vesselId as string) : null;
    
    // If bankAccountId is provided, get connections for that bank account
    if (bankAccountId && !isNaN(bankAccountId)) {
      const connections = await storage.getBankApiConnectionsByBankAccount(bankAccountId);
      return res.json(connections);
    }
    
    // If vesselId is provided, we need to find all bank accounts for that vessel,
    // then find connections for those accounts
    if (vesselId && !isNaN(vesselId)) {
      try {
        // Get all bank accounts for this vessel
        const accounts = await storage.getBankAccountsByVessel(vesselId);
        
        // If no accounts, return empty array
        if (!accounts || accounts.length === 0) {
          return res.json([]);
        }
        
        // Get connections for each bank account
        const accountIds = accounts.map(account => account.id);
        let allConnections: BankApiConnection[] = [];
        
        // For each account, get its connections and add to our array
        for (const accountId of accountIds) {
          const connections = await storage.getBankApiConnectionsByBankAccount(accountId);
          allConnections = [...allConnections, ...connections];
        }
        
        return res.json(allConnections);
      } catch (error) {
        console.error(`Failed to get banking connections for vessel ${vesselId}:`, error);
        return res.status(500).json({ message: "Failed to get banking connections for vessel" });
      }
    }
    
    // Otherwise return all connections
    const connections = await storage.getBankApiConnections();
    res.json(connections);
  }));
  
  // Get all bank API connections for a specific vessel
  apiRouter.get("/banking/connections/vessel/:vesselId", asyncHandler(async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Authentication required. Please log in." });
    }
    
    const vesselId = parseInt(req.params.vesselId);
    if (isNaN(vesselId)) {
      return res.status(400).json({ error: "Invalid vessel ID" });
    }
    
    try {
      // Get all bank accounts for this vessel
      const accounts = await storage.getBankAccountsByVessel(vesselId);
      
      // If no accounts, return empty array
      if (!accounts || accounts.length === 0) {
        return res.json([]);
      }
      
      // Get connections for each bank account
      const accountIds = accounts.map(account => account.id);
      let allConnections: BankApiConnection[] = [];
      
      // For each account, get its connections and add to our array
      for (const accountId of accountIds) {
        const connections = await storage.getBankApiConnectionsByBankAccount(accountId);
        allConnections = [...allConnections, ...connections];
      }
      
      return res.json(allConnections);
    } catch (error) {
      console.error(`Failed to get banking connections for vessel ${vesselId}:`, error);
      return res.status(500).json({ message: "Failed to get banking connections for vessel" });
    }
  }));
  
  // Get a specific bank API connection
  apiRouter.get("/banking/connections/:id", asyncHandler(async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Authentication required. Please log in." });
    }
    
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid connection ID" });
    }
    
    const connection = await storage.getBankApiConnection(id);
    if (!connection) {
      return res.status(404).json({ error: "Bank API connection not found" });
    }
    
    res.json(connection);
  }));
  
  // Create a new bank API connection
  apiRouter.post("/banking/connections", asyncHandler(async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Authentication required. Please log in." });
    }
    
    try {
      const validatedData = insertBankApiConnectionSchema.parse(req.body);
      
      // Check if provider exists
      const provider = await storage.getBankingApiProvider(validatedData.providerId);
      if (!provider) {
        return res.status(400).json({ error: "Invalid provider ID" });
      }
      
      // Create new connection
      const connection = await storage.createBankApiConnection(validatedData);
      
      // Log activity
      await storage.createActivityLog({
        activityType: 'bank_connection_created',
        description: `New banking API connection added for provider: ${provider.name}`,
        userId: req.user.id,
        relatedEntityType: 'bank_api_connection',
        relatedEntityId: connection.id,
        metadata: { provider: provider.name }
      });
      
      res.status(201).json(connection);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid bank connection data", errors: error.errors });
      }
      console.error("Failed to create bank API connection:", error);
      res.status(500).json({ message: "Failed to create bank API connection" });
    }
  }));
  
  // Update a bank API connection
  apiRouter.patch("/banking/connections/:id", asyncHandler(async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Authentication required. Please log in." });
    }
    
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid connection ID" });
    }
    
    try {
      const existingConnection = await storage.getBankApiConnection(id);
      if (!existingConnection) {
        return res.status(404).json({ error: "Bank API connection not found" });
      }
      
      // Update connection
      const updatedConnection = await storage.updateBankApiConnection(id, req.body);
      
      // Log activity
      await storage.createActivityLog({
        activityType: 'bank_connection_updated',
        description: `Banking API connection updated: ID ${id}`,
        userId: req.user.id,
        relatedEntityType: 'bank_api_connection',
        relatedEntityId: id,
        metadata: { updated: Object.keys(req.body) }
      });
      
      res.json(updatedConnection);
    } catch (error) {
      console.error(`Failed to update bank API connection ${id}:`, error);
      res.status(500).json({ message: "Failed to update bank API connection" });
    }
  }));
  
  // Delete a bank API connection
  apiRouter.delete("/banking/connections/:id", asyncHandler(async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Authentication required. Please log in." });
    }
    
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid connection ID" });
    }
    
    try {
      const connection = await storage.getBankApiConnection(id);
      if (!connection) {
        return res.status(404).json({ error: "Bank API connection not found" });
      }
      
      await storage.deleteBankApiConnection(id);
      
      // Log activity
      await storage.createActivityLog({
        activityType: 'bank_connection_deleted',
        description: `Banking API connection deleted: ID ${id}`,
        userId: req.user.id,
        relatedEntityType: 'bank_api_connection',
        relatedEntityId: id,
        metadata: { provider: connection.providerId }
      });
      
      res.status(204).send();
    } catch (error) {
      console.error(`Failed to delete bank API connection ${id}:`, error);
      res.status(500).json({ message: "Failed to delete bank API connection" });
    }
  }));
  
  // Get bank transactions for a specific connection
  apiRouter.get("/banking/connections/:id/transactions", asyncHandler(async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Authentication required. Please log in." });
    }
    
    const connectionId = parseInt(req.params.id);
    if (isNaN(connectionId)) {
      return res.status(400).json({ error: "Invalid connection ID" });
    }
    
    // Optional date range filtering
    const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;
    
    try {
      // Verify connection exists
      const connection = await storage.getBankApiConnection(connectionId);
      if (!connection) {
        return res.status(404).json({ error: "Bank API connection not found" });
      }
      
      const transactions = await storage.getBankApiTransactions(connectionId, startDate, endDate);
      res.json(transactions);
    } catch (error) {
      console.error(`Failed to get bank transactions for connection ${connectionId}:`, error);
      res.status(500).json({ message: "Failed to get bank transactions" });
    }
  }));
  
  // Initiate bank sync for a connection
  apiRouter.post("/banking/connections/:id/sync", asyncHandler(async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Authentication required. Please log in." });
    }
    
    const connectionId = parseInt(req.params.id);
    if (isNaN(connectionId)) {
      return res.status(400).json({ error: "Invalid connection ID" });
    }
    
    try {
      // Verify connection exists
      const connection = await storage.getBankApiConnection(connectionId);
      if (!connection) {
        return res.status(404).json({ error: "Bank API connection not found" });
      }
      
      // Get provider details
      const provider = await storage.getBankingApiProvider(connection.providerId);
      if (!provider) {
        return res.status(404).json({ error: "Banking provider not found" });
      }
      
      // Create a sync log entry to track the process
      const syncLog = await storage.createBankSyncLog({
        connectionId: connectionId,
        startDate: new Date(),
        status: 'in_progress',
        recordsFetched: 0,
        recordsProcessed: 0,
        errorDetails: null
      });
      
      // In a real implementation, we would call the bank API here
      // For now, we'll simulate a successful sync with mock data
      
      // Different handling based on provider type
      let syncResult;
      if (provider.name === 'Centtrip') {
        // Simulate Centtrip API call which uses API key authentication
        syncResult = await simulateCenttripSync(connection, syncLog.id);
      } else if (provider.name === 'Revolut') {
        // Simulate Revolut API call which uses OAuth authentication
        syncResult = await simulateRevolutSync(connection, syncLog.id);
      } else {
        // Generic handling for other providers
        return res.status(400).json({ error: `Unsupported provider: ${provider.name}` });
      }
      
      // Update sync log with results
      const updatedSyncLog = await storage.updateBankSyncLog(syncLog.id, {
        endDate: new Date(),
        status: syncResult.success ? 'completed' : 'failed',
        recordsFetched: syncResult.transactionsRetrieved,
        recordsProcessed: syncResult.transactionsImported,
        errorDetails: syncResult.errors ? JSON.stringify(syncResult.errors) : null,
        responseDetails: syncResult.success ? JSON.stringify({
          transactionCount: syncResult.transactionsRetrieved
        }) : null
      });
      
      // Log activity
      await storage.createActivityLog({
        activityType: 'bank_sync_completed',
        description: `Bank sync ${syncResult.success ? 'completed' : 'failed'} for ${provider.name}`,
        userId: req.user.id,
        relatedEntityType: 'bank_api_connection',
        relatedEntityId: connectionId,
        metadata: { 
          provider: provider.name,
          transactionsRetrieved: syncResult.transactionsRetrieved,
          transactionsImported: syncResult.transactionsImported
        }
      });
      
      res.json({
        syncLog: updatedSyncLog,
        transactions: syncResult.transactions
      });
    } catch (error) {
      console.error(`Failed to sync bank connection ${connectionId}:`, error);
      res.status(500).json({ message: "Failed to sync bank connection", error: error.message });
    }
  }));
  
  // Get sync history for a connection
  apiRouter.get("/banking/connections/:id/sync-history", asyncHandler(async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Authentication required. Please log in." });
    }
    
    const connectionId = parseInt(req.params.id);
    if (isNaN(connectionId)) {
      return res.status(400).json({ error: "Invalid connection ID" });
    }
    
    try {
      // Verify connection exists
      const connection = await storage.getBankApiConnection(connectionId);
      if (!connection) {
        return res.status(404).json({ error: "Bank API connection not found" });
      }
      
      const syncLogs = await storage.getBankSyncLogs(connectionId);
      res.json(syncLogs);
    } catch (error) {
      console.error(`Failed to get sync history for connection ${connectionId}:`, error);
      res.status(500).json({ message: "Failed to get sync history" });
    }
  }));
  
  // Helper function to simulate Centtrip API sync
  async function simulateCenttripSync(connection: BankApiConnection, syncLogId: number) {
    console.log(`Simulating Centtrip API sync for connection ID ${connection.id}`);
    
    // In a real implementation, this would call the actual Centtrip API
    // using the stored API credentials
    
    // Check if we have API credentials
    const credentials = connection.credentials as { apiKey?: string };
    if (!credentials || !credentials.apiKey) {
      return {
        success: false,
        transactionsRetrieved: 0,
        transactionsImported: 0,
        transactions: [],
        errors: "Missing API key in credentials"
      };
    }
    
    // In a real implementation, we would fetch transactions from the API
    // For now, we'll create some sample transactions
    const transactions = [];
    const count = Math.floor(Math.random() * 10) + 5; // Random number between 5-15 transactions
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30); // Last 30 days
    
    for (let i = 0; i < count; i++) {
      const transactionDate = new Date(startDate);
      transactionDate.setDate(transactionDate.getDate() + Math.floor(Math.random() * 30));
      
      const amount = (Math.random() * 10000).toFixed(2);
      const isExpense = Math.random() > 0.3; // 70% chance of being an expense
      
      const transaction = {
        connectionId: connection.id,
        bankAccountId: connection.bankAccountId,
        externalId: `CENTTRIP-${Date.now()}-${i}`,
        transactionDate: transactionDate,
        type: isExpense ? 'expense' : 'income',
        description: isExpense ? 
          `Payment to ${['Chandlery', 'Fuel Supplier', 'Port Fees', 'Maintenance'][Math.floor(Math.random() * 4)]}` : 
          `Deposit from ${['Charter Client', 'Owner', 'Insurance'][Math.floor(Math.random() * 3)]}`,
        amount: isExpense ? `-${amount}` : amount,
        currency: 'USD',
        category: isExpense ? 
          ['Fuel', 'Maintenance', 'Port Fees', 'Supplies'][Math.floor(Math.random() * 4)] : 
          ['Charter Revenue', 'Owner Contribution', 'Insurance Claim'][Math.floor(Math.random() * 3)],
        status: ['settled', 'pending'][Math.floor(Math.random() * 2)],
        metadata: {
          source: 'centtrip',
          syncLogId: syncLogId,
          originalData: {
            // This would contain the raw data from the API
            transactionId: `CENTTRIP-${Date.now()}-${i}`,
            accountNumber: 'XXXXXXXXXX' + Math.floor(Math.random() * 1000)
          }
        }
      };
      
      // Store the transaction
      const savedTransaction = await storage.createBankApiTransaction(transaction);
      transactions.push(savedTransaction);
    }
    
    console.log(`Simulated Centtrip API sync completed: retrieved ${transactions.length} transactions`);
    
    return {
      success: true,
      transactionsRetrieved: transactions.length,
      transactionsImported: transactions.length,
      transactions: transactions,
      errors: null
    };
  }
  
  // Helper function to simulate Revolut API sync
  async function simulateRevolutSync(connection: BankApiConnection, syncLogId: number) {
    console.log(`Simulating Revolut API sync for connection ID ${connection.id}`);
    
    // In a real implementation, this would call the actual Revolut API
    // using OAuth token authentication
    
    // Check if we have OAuth credentials
    const credentials = connection.credentials as { accessToken?: string };
    if (!credentials || !credentials.accessToken) {
      return {
        success: false,
        transactionsRetrieved: 0,
        transactionsImported: 0,
        transactions: [],
        errors: "Missing OAuth access token in credentials"
      };
    }
    
    // In a real implementation, we would fetch transactions from the API
    // For now, we'll create some sample transactions similar to the Centtrip function
    const transactions = [];
    const count = Math.floor(Math.random() * 10) + 5; // Random number between 5-15 transactions
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30); // Last 30 days
    
    for (let i = 0; i < count; i++) {
      const transactionDate = new Date(startDate);
      transactionDate.setDate(transactionDate.getDate() + Math.floor(Math.random() * 30));
      
      const amount = (Math.random() * 8000).toFixed(2);
      const isExpense = Math.random() > 0.4; // 60% chance of being an expense
      
      const transaction = {
        connectionId: connection.id,
        bankAccountId: connection.bankAccountId,
        externalId: `REVOLUT-${Date.now()}-${i}`,
        transactionDate: transactionDate,
        type: isExpense ? 'expense' : 'income',
        description: isExpense ? 
          `Payment to ${['Marine Services', 'Crew Salaries', 'Insurance', 'Provisions'][Math.floor(Math.random() * 4)]}` : 
          `Deposit from ${['Charter Fee', 'Transfer', 'Refund'][Math.floor(Math.random() * 3)]}`,
        amount: isExpense ? `-${amount}` : amount,
        currency: 'EUR',
        category: isExpense ? 
          ['Crew', 'Insurance', 'Provisions', 'Services'][Math.floor(Math.random() * 4)] : 
          ['Charter', 'Transfer', 'Refund'][Math.floor(Math.random() * 3)],
        status: ['completed', 'pending'][Math.floor(Math.random() * 2)],
        metadata: {
          source: 'revolut',
          syncLogId: syncLogId,
          originalData: {
            // This would contain the raw data from the API
            transactionId: `REVOLUT-${Date.now()}-${i}`,
            accountId: 'REV-' + Math.floor(Math.random() * 100000)
          }
        }
      };
      
      // Store the transaction
      const savedTransaction = await storage.createBankApiTransaction(transaction);
      transactions.push(savedTransaction);
    }
    
    console.log(`Simulated Revolut API sync completed: retrieved ${transactions.length} transactions`);
    
    return {
      success: true,
      transactionsRetrieved: transactions.length,
      transactionsImported: transactions.length,
      transactions: transactions,
      errors: null
    };
  }

  // Register API routes
  // Setup API Keys routes
  setupApiKeysRoutes(apiRouter);
  
  // Register receipt reconciliation routes
  const receiptRoutes = setupReceiptRoutes(storage);
  apiRouter.use("/receipts", receiptRoutes);
  
  app.use("/api", apiRouter);
  
  // Register marine tracking router
  app.use("/api/marine", marineRouter);
  
  // Serve uploaded files
  app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

  const httpServer = createServer(app);

  return httpServer;
}
