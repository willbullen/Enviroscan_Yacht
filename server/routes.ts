import express, { type Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import fs from "fs";
import path from "path";
import { 
  insertUserSchema, 
  insertEquipmentSchema, 
  insertMaintenanceTaskSchema, 
  insertInventoryItemSchema,
  insertActivityLogSchema
} from "@shared/schema";

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
  apiRouter.get("/equipment", async (_req: Request, res: Response) => {
    try {
      const equipmentList = await storage.getAllEquipment();
      res.json(equipmentList);
    } catch (error) {
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
  apiRouter.get("/tasks", async (_req: Request, res: Response) => {
    try {
      const tasks = await storage.getAllMaintenanceTasks();
      res.json(tasks);
    } catch (error) {
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
      const tasks = await storage.getMaintenanceTasksByStatus(status);
      res.json(tasks);
    } catch (error) {
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
  
  // Get upcoming maintenance tasks
  apiRouter.get("/tasks/upcoming", async (_req: Request, res: Response) => {
    try {
      const tasks = await storage.getUpcomingMaintenanceTasks();
      res.json(tasks);
    } catch (error) {
      res.status(500).json({ message: "Failed to get upcoming maintenance tasks" });
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
      const id = parseInt(req.params.id);
      const existingTask = await storage.getMaintenanceTask(id);
      
      if (!existingTask) {
        return res.status(404).json({ message: "Maintenance task not found" });
      }
      
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
  apiRouter.get("/inventory", async (_req: Request, res: Response) => {
    try {
      const items = await storage.getAllInventoryItems();
      res.json(items);
    } catch (error) {
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
      const logs = await storage.getRecentActivityLogs(limit);
      res.json(logs);
    } catch (error) {
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
  apiRouter.get("/dashboard", async (_req: Request, res: Response) => {
    try {
      const dueTasks = await storage.getDueMaintenanceTasks();
      const upcomingTasks = await storage.getUpcomingMaintenanceTasks();
      const completedTasks = await storage.getMaintenanceTasksByStatus('completed');
      const lowStockItems = await storage.getLowStockInventoryItems();
      const recentActivity = await storage.getRecentActivityLogs(4);
      const allEquipment = await storage.getAllEquipment();
      
      res.json({
        stats: {
          dueTasks: dueTasks.length,
          upcomingTasks: upcomingTasks.length,
          completedTasks: completedTasks.length,
          lowStockItems: lowStockItems.length
        },
        dueTasks,
        upcomingTasks: upcomingTasks.slice(0, 10),
        recentActivity,
        equipmentOverview: allEquipment.slice(0, 3),
        inventoryStatus: lowStockItems.slice(0, 4)
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to get dashboard data" });
    }
  });
  
  // =========== Theme Routes =============
  
  // Update theme settings
  apiRouter.post("/update-theme", async (req: Request, res: Response) => {
    try {
      const themeData = req.body;
      const themeFilePath = path.resolve('./theme.json');
      
      // Validate theme data
      if (!themeData || typeof themeData !== 'object') {
        return res.status(400).json({ message: "Invalid theme data" });
      }
      
      // Validate required fields
      const requiredFields = ['variant', 'primary', 'appearance', 'radius'];
      for (const field of requiredFields) {
        if (!(field in themeData)) {
          return res.status(400).json({ 
            message: `Missing required field: ${field}`,
            requiredFields 
          });
        }
      }
      
      // Write the theme data to theme.json
      fs.writeFileSync(themeFilePath, JSON.stringify(themeData, null, 2));
      
      // Log activity
      await storage.createActivityLog({
        activityType: 'theme_updated',
        description: `Application theme updated`,
        userId: null,
        relatedEntityType: 'system',
        relatedEntityId: 0,
        metadata: { 
          appearance: themeData.appearance,
          variant: themeData.variant
        }
      });
      
      res.json({ 
        message: "Theme updated successfully",
        theme: themeData
      });
    } catch (error) {
      console.error("Failed to update theme:", error);
      res.status(500).json({ message: "Failed to update theme" });
    }
  });
  
  // Register API routes
  app.use("/api", apiRouter);

  const httpServer = createServer(app);

  return httpServer;
}
