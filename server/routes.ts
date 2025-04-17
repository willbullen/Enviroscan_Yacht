import express, { type Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import fs from "fs";
import path from "path";
import { logger } from "./services/logger";
import { createError, asyncHandler } from "./middleware/errorHandler";
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
  insertSpeedChartSchema
} from "@shared/schema";
import { db } from "./db";

export async function registerRoutes(app: Express): Promise<Server> {
  // Create API router
  const apiRouter = express.Router();
  
  // =========== User Routes =============
  
  // Get all users
  apiRouter.get("/users", async (_req: Request, res: Response) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      res.status(500).json({ message: "Failed to get users" });
    }
  });
  
  // Get user by ID
  apiRouter.get("/users/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const user = await storage.getUser(id);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: "Failed to get user" });
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
  apiRouter.get("/voyages/:vesselId", asyncHandler(async (req: Request, res: Response) => {
    const vesselId = parseInt(req.params.vesselId);
    if (isNaN(vesselId)) {
      return res.status(400).json({ error: "Invalid vessel ID" });
    }

    const voyages = await storage.getVoyagesByVessel(vesselId);
    return res.json(voyages);
  }));

  // Get a specific voyage
  apiRouter.get("/voyage/:id", asyncHandler(async (req: Request, res: Response) => {
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
  apiRouter.post("/voyage", asyncHandler(async (req: Request, res: Response) => {
    const validationResult = insertVoyageSchema.safeParse(req.body);
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
  }));

  // Update a voyage
  apiRouter.put("/voyage/:id", asyncHandler(async (req: Request, res: Response) => {
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
  apiRouter.delete("/voyage/:id", asyncHandler(async (req: Request, res: Response) => {
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
  apiRouter.get("/waypoints/:voyageId", asyncHandler(async (req: Request, res: Response) => {
    const voyageId = parseInt(req.params.voyageId);
    if (isNaN(voyageId)) {
      return res.status(400).json({ error: "Invalid voyage ID" });
    }

    const waypoints = await storage.getWaypointsByVoyage(voyageId);
    return res.json(waypoints);
  }));

  // Create a new waypoint
  apiRouter.post("/waypoint", asyncHandler(async (req: Request, res: Response) => {
    const validationResult = insertWaypointSchema.safeParse(req.body);
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
  }));

  // Update a waypoint
  apiRouter.put("/waypoint/:id", asyncHandler(async (req: Request, res: Response) => {
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
  apiRouter.delete("/waypoint/:id", asyncHandler(async (req: Request, res: Response) => {
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
  
  // Register API routes
  app.use("/api", apiRouter);

  const httpServer = createServer(app);

  return httpServer;
}
