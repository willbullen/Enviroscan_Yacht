import { 
  users,
  equipment,
  maintenanceTasks,
  inventoryItems,
  activityLogs,
  maintenanceHistory,
  predictiveMaintenance,
  ismDocuments,
  ismAudits,
  ismTraining,
  ismIncidents,
  crewMembers,
  crewDocuments,
  voyages,
  waypoints,
  fuelConsumptionChart,
  speedChart,
  vessels,
  userVesselAssignments,
  formCategories,
  formTemplates,
  formTemplateVersions,
  ismTasks,
  formSubmissions,
  taskComments,
  financialAccounts,
  budgets,
  budgetAllocations,
  expenses,
  transactions, // Legacy transactions table
  bankingTransactions, // New banking transactions table
  transactionLines,
  deposits,
  bankAccounts,
  bankingApiProviders,
  bankApiConnections,
  bankApiTransactions,
  bankSyncLogs,
  bankingProviders,
  bankConnections,
  transactionReconciliations,
  type User,
  type InsertUser,
  type Equipment,
  type InsertEquipment,
  type MaintenanceTask,
  type InsertMaintenanceTask,
  type InventoryItem,
  type InsertInventoryItem,
  type ActivityLog,
  type InsertActivityLog,
  type MaintenanceHistory,
  type InsertMaintenanceHistory,
  type PredictiveMaintenance,
  type InsertPredictiveMaintenance,
  type IsmDocument,
  type InsertIsmDocument,
  type IsmAudit,
  type InsertIsmAudit,
  type IsmTraining,
  type InsertIsmTraining,
  type IsmIncident,
  type InsertIsmIncident,
  type CrewMember,
  type InsertCrewMember,
  type CrewDocument,
  type InsertCrewDocument,
  type Voyage,
  type InsertVoyage,
  type Waypoint,
  type InsertWaypoint,
  type FuelConsumptionChart,
  type InsertFuelConsumptionChart,
  type SpeedChart,
  type InsertSpeedChart,
  type FormCategory,
  type InsertFormCategory,
  type FormTemplate,
  type InsertFormTemplate,
  type FormTemplateVersion,
  type InsertFormTemplateVersion,
  type IsmTask,
  type InsertIsmTask,
  type FormSubmission,
  type InsertFormSubmission,
  type TaskComment,
  type InsertTaskComment,
  type FinancialAccount,
  type InsertFinancialAccount,
  type Budget,
  type InsertBudget,
  type BudgetAllocation,
  type InsertBudgetAllocation,
  type Expense,
  type InsertExpense,
  type Transaction,
  type InsertTransaction,
  type TransactionLine,
  type InsertTransactionLine,
  type Deposit,
  type InsertDeposit,
  type BankAccount,
  type InsertBankAccount,
  type BankingApiProvider,
  type InsertBankingApiProvider,
  type BankApiConnection,
  type InsertBankApiConnection,
  type BankApiTransaction,
  type InsertBankApiTransaction,
  type BankSyncLog,
  type InsertBankSyncLog,
  type BankingProvider,
  type InsertBankingProvider,
  type BankConnection,
  type InsertBankConnection,
  type TransactionReconciliation,
  type InsertTransactionReconciliation,
  type BankingTransaction,
  type InsertBankingTransaction
} from "@shared/schema";
import { IStorage } from "./storage";
import { db, executeWithRetry } from "./db";
import { and, eq, lte, gte, sql, between, desc, asc } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

// PostgreSQL session store for auth
const PostgresSessionStore = connectPg(session);

export class DatabaseStorage implements IStorage {
  // Session store for authentication
  sessionStore: session.SessionStore;
  
  constructor() {
    this.sessionStore = new PostgresSessionStore({
      pool,
      createTableIfMissing: true
    });
  }
  
  // =========== Active users (isActive = true) =============
  async getActiveUsers(): Promise<User[]> {
    return db.select().from(users).where(eq(users.isActive, true));
  }
  // =========== User Methods =============
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    if (!user) return undefined;
    
    // Add missing fields for code compatibility
    return {
      ...user,
      isActive: true, // Default to active since the column doesn't exist
      email: null // Default to null since the column doesn't exist
    } as User;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    if (!user) return undefined;
    
    // Add missing fields for code compatibility
    return {
      ...user,
      isActive: true, // Default to active since the column doesn't exist
      email: null // Default to null since the column doesn't exist
    } as User;
  }
  
  async getActiveUsers(): Promise<User[]> {
    // Since there's no isActive column, just return all users as "active"
    const allUsers = await db.select().from(users);
    return allUsers.map(user => ({
      ...user,
      isActive: true,
      email: null
    })) as User[];
  }

  async getAllUsers(): Promise<User[]> {
    const allUsers = await db.select().from(users);
    // Add virtual fields to all users
    return allUsers.map(user => ({
      ...user,
      isActive: true, // Default to active since the column doesn't exist
      email: null // Default to null since the column doesn't exist
    })) as User[];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    // Only include fields that exist in the actual database table
    const { 
      username, 
      password, 
      fullName, 
      role, 
      avatarUrl
    } = insertUser;
    
    // Create database-compatible insert object
    const dbUser = {
      username,
      password,
      fullName,
      role,
      avatarUrl: avatarUrl || null
    };
    
    const [user] = await db.insert(users).values(dbUser).returning();
    
    // Simulate presence of isActive and email for code compatibility
    // This won't be persisted to the database but helps with API compatibility
    return {
      ...user,
      isActive: insertUser.isActive !== undefined ? insertUser.isActive : true,
      email: insertUser.email || null
    } as User;
  }

  async updateUser(id: number, updates: Partial<InsertUser>): Promise<User> {
    // Filter out fields that don't exist in the database
    const { 
      username, 
      password, 
      fullName, 
      role, 
      avatarUrl,
      // Excluded: email, isActive, updatedAt 
    } = updates;
    
    // Create database-compatible update object with only valid fields
    const dbUpdates: Record<string, any> = {};
    if (username !== undefined) dbUpdates.username = username;
    if (password !== undefined) dbUpdates.password = password;
    if (fullName !== undefined) dbUpdates.fullName = fullName;
    if (role !== undefined) dbUpdates.role = role;
    if (avatarUrl !== undefined) dbUpdates.avatarUrl = avatarUrl;
    
    // Only perform update if there are valid fields to update
    if (Object.keys(dbUpdates).length === 0) {
      // No valid fields to update, get current user and append virtual fields
      const user = await this.getUser(id);
      if (!user) throw new Error(`User with id ${id} not found`);
      
      // Add the virtual fields that may have been in the updates
      if (updates.isActive !== undefined) user.isActive = updates.isActive;
      if (updates.email !== undefined) user.email = updates.email;
      
      return user;
    }
    
    // Update the database with fields that exist in the table
    const [updatedUser] = await db
      .update(users)
      .set(dbUpdates)
      .where(eq(users.id, id))
      .returning();
    
    // Add virtual fields to the response
    return {
      ...updatedUser,
      isActive: updates.isActive !== undefined ? updates.isActive : true,
      email: updates.email || null
    } as User;
  }

  async deleteUser(id: number): Promise<void> {
    await db.delete(users).where(eq(users.id, id));
  }

  // =========== Equipment Methods =============
  async getEquipment(id: number): Promise<Equipment | undefined> {
    const [item] = await db.select().from(equipment).where(eq(equipment.id, id));
    return item || undefined;
  }

  async getAllEquipment(): Promise<Equipment[]> {
    return db.select().from(equipment);
  }

  async getEquipmentByCategory(category: string): Promise<Equipment[]> {
    return db.select().from(equipment).where(eq(equipment.category, category));
  }

  async createEquipment(insertEquipment: InsertEquipment): Promise<Equipment> {
    const [item] = await db.insert(equipment).values(insertEquipment).returning();
    return item;
  }

  async updateEquipment(id: number, updates: Partial<InsertEquipment>): Promise<Equipment> {
    const [updatedItem] = await db
      .update(equipment)
      .set(updates)
      .where(eq(equipment.id, id))
      .returning();
    return updatedItem;
  }

  async deleteEquipment(id: number): Promise<boolean> {
    try {
      const result = await db.delete(equipment).where(eq(equipment.id, id));
      return result.rowCount ? result.rowCount > 0 : false;
    } catch (error) {
      console.error("Error deleting equipment:", error);
      return false;
    }
  }

  // =========== Maintenance Task Methods =============
  async getMaintenanceTask(id: number): Promise<MaintenanceTask | undefined> {
    const [task] = await db.select().from(maintenanceTasks).where(eq(maintenanceTasks.id, id));
    return task || undefined;
  }

  async getAllMaintenanceTasks(): Promise<MaintenanceTask[]> {
    return db.select().from(maintenanceTasks);
  }

  async getMaintenanceTasksByStatus(status: string): Promise<MaintenanceTask[]> {
    return db.select().from(maintenanceTasks).where(eq(maintenanceTasks.status, status));
  }

  async getMaintenanceTasksByEquipment(equipmentId: number): Promise<MaintenanceTask[]> {
    return db.select().from(maintenanceTasks).where(eq(maintenanceTasks.equipmentId, equipmentId));
  }

  async getMaintenanceTasksByAssignee(userId: number): Promise<MaintenanceTask[]> {
    return db.select().from(maintenanceTasks).where(eq(maintenanceTasks.assignedToId, userId));
  }

  async getDueMaintenanceTasks(): Promise<MaintenanceTask[]> {
    const today = new Date();
    return db
      .select()
      .from(maintenanceTasks)
      .where(
        and(
          eq(maintenanceTasks.status, "pending"),
          lte(maintenanceTasks.dueDate, today)
        )
      );
  }

  async getUpcomingMaintenanceTasks(): Promise<MaintenanceTask[]> {
    try {
      console.log("Starting getUpcomingMaintenanceTasks...");
      
      // Get current date and date 30 days from now
      const today = new Date();
      const thirtyDaysLater = new Date();
      thirtyDaysLater.setDate(today.getDate() + 30);
      
      console.log(`Date range: ${today.toISOString()} to ${thirtyDaysLater.toISOString()}`);
      
      // Use raw SQL for troubleshooting
      try {
        console.log("Executing query to get upcoming tasks...");
        // Get all upcoming tasks without date filter first for debugging
        const allUpcomingTasks = await db
          .select()
          .from(maintenanceTasks)
          .where(
            eq(maintenanceTasks.status, "upcoming")
          );
        
        console.log(`Found ${allUpcomingTasks.length} tasks with upcoming status`);
        
        // Now filter by date
        const upcomingTasks = allUpcomingTasks.filter(task => {
          const dueDate = new Date(task.dueDate);
          const isInRange = dueDate >= today && dueDate <= thirtyDaysLater;
          return isInRange;
        });
        
        console.log(`Found ${upcomingTasks.length} upcoming tasks within the next 30 days`);
        return upcomingTasks;
      } catch (queryError) {
        console.error("Error executing query:", queryError);
        
        // Return predefined fallback tasks if the database query fails
        // Converting the task objects to match the MaintenanceTask type
        const now = new Date();
        const fallbackTasks: MaintenanceTask[] = [
          {
            id: 2,
            title: "Generator 1 Fuel Filter Replacement",
            description: "Replace primary and secondary fuel filters on Generator 1",
            equipmentId: 3,
            priority: "medium",
            status: "upcoming",
            dueDate: now,
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
            createdAt: now
          },
          {
            id: 5,
            title: "Liferaft Annual Inspection",
            description: "Send liferaft to certified facility for annual inspection",
            equipmentId: 6,
            priority: "high",
            status: "upcoming",
            dueDate: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
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
            createdAt: now
          }
        ];
        
        console.log("Returning fallback tasks due to database error");
        return fallbackTasks;
      }
    } catch (error) {
      console.error("Error in getUpcomingMaintenanceTasks:", error);
      console.error(error instanceof Error ? error.stack : String(error));
      
      // Print database connection details (without exposing sensitive info)
      console.error("Database connection issue? Checking...");
      
      // Try a simple query to check connection
      try {
        console.log("Trying simple query to check database connection");
        const [result] = await db.select({ count: sql`count(*)` }).from(maintenanceTasks);
        console.log("Database connection working, tasks count:", result);
        return []; // Return empty array instead of throwing
      } catch (dbError) {
        console.error("Database connection test failed:", dbError);
        return []; // Return empty array
      }
    }
  }

  async createMaintenanceTask(insertTask: InsertMaintenanceTask): Promise<MaintenanceTask> {
    const [task] = await db.insert(maintenanceTasks).values(insertTask).returning();
    return task;
  }

  async updateMaintenanceTask(id: number, updates: Partial<InsertMaintenanceTask>): Promise<MaintenanceTask> {
    console.log("DatabaseStorage: updating task", id, "with data:", updates);
    
    // Create a copy of updates to avoid mutating the original object
    const processedUpdates = { ...updates };
    
    // Ensure procedure is handled correctly (might be a string in the input)
    if (processedUpdates.procedure && typeof processedUpdates.procedure === 'string') {
      try {
        processedUpdates.procedure = JSON.parse(processedUpdates.procedure as unknown as string);
      } catch (error) {
        console.error("Failed to parse procedure as JSON:", error);
        // If it can't be parsed as JSON, treat it as a single item array
        processedUpdates.procedure = [processedUpdates.procedure];
      }
    }
    
    // Handle date fields - convert string dates to Date objects
    if (processedUpdates.dueDate && typeof processedUpdates.dueDate === 'string') {
      processedUpdates.dueDate = new Date(processedUpdates.dueDate);
    }
    
    if (processedUpdates.completedAt && typeof processedUpdates.completedAt === 'string') {
      processedUpdates.completedAt = new Date(processedUpdates.completedAt);
    }
    
    try {
      const [updatedTask] = await db
        .update(maintenanceTasks)
        .set(processedUpdates)
        .where(eq(maintenanceTasks.id, id))
        .returning();
        
      console.log("DatabaseStorage: task updated successfully:", updatedTask);
      return updatedTask;
    } catch (error) {
      console.error("Error in updateMaintenanceTask:", error);
      throw error;
    }
  }

  async deleteMaintenanceTask(id: number): Promise<boolean> {
    try {
      const result = await db.delete(maintenanceTasks).where(eq(maintenanceTasks.id, id));
      return result.rowCount > 0;
    } catch (error) {
      console.error("Error deleting maintenance task:", error);
      return false;
    }
  }

  // =========== Inventory Methods =============
  async getInventoryItem(id: number): Promise<InventoryItem | undefined> {
    const [item] = await db.select().from(inventoryItems).where(eq(inventoryItems.id, id));
    return item || undefined;
  }

  async getAllInventoryItems(): Promise<InventoryItem[]> {
    return db.select().from(inventoryItems);
  }

  async getLowStockInventoryItems(): Promise<InventoryItem[]> {
    return db
      .select()
      .from(inventoryItems)
      .where(lte(inventoryItems.quantity, inventoryItems.minQuantity));
  }

  async createInventoryItem(insertItem: InsertInventoryItem): Promise<InventoryItem> {
    const [item] = await db.insert(inventoryItems).values(insertItem).returning();
    return item;
  }

  async updateInventoryItem(id: number, updates: Partial<InsertInventoryItem>): Promise<InventoryItem> {
    const [updatedItem] = await db
      .update(inventoryItems)
      .set(updates)
      .where(eq(inventoryItems.id, id))
      .returning();
    return updatedItem;
  }

  async deleteInventoryItem(id: number): Promise<boolean> {
    try {
      const result = await db.delete(inventoryItems).where(eq(inventoryItems.id, id));
      return result.rowCount ? result.rowCount > 0 : false;
    } catch (error) {
      console.error("Error deleting inventory item:", error);
      return false;
    }
  }
  
  // =========== Vessel Methods =============
  async getVessel(id: number): Promise<Vessel | undefined> {
    const [vessel] = await db.select().from(vessels).where(eq(vessels.id, id));
    return vessel || undefined;
  }
  
  async getAllVessels(): Promise<Vessel[]> {
    return db.select().from(vessels);
  }
  
  async getActiveVessels(): Promise<Vessel[]> {
    return db.select().from(vessels).where(eq(vessels.isActive, true));
  }
  
  async createVessel(vessel: InsertVessel): Promise<Vessel> {
    const [newVessel] = await db.insert(vessels).values(vessel).returning();
    return newVessel;
  }
  
  async updateVessel(id: number, updates: Partial<InsertVessel>): Promise<Vessel | undefined> {
    const [updatedVessel] = await db
      .update(vessels)
      .set(updates)
      .where(eq(vessels.id, id))
      .returning();
    return updatedVessel;
  }
  
  async deleteVessel(id: number): Promise<boolean> {
    try {
      // First, delete related records in user_vessel_assignments
      await db.delete(userVesselAssignments).where(eq(userVesselAssignments.vesselId, id));
      
      // Then delete the vessel
      const result = await db.delete(vessels).where(eq(vessels.id, id));
      return result.rowCount ? result.rowCount > 0 : false;
    } catch (error) {
      console.error("Error deleting vessel:", error);
      return false;
    }
  }
  
  // =========== User-Vessel Assignment Methods =============
  async getUserVesselAssignment(id: number): Promise<UserVesselAssignment | undefined> {
    const [assignment] = await db.select().from(userVesselAssignments).where(eq(userVesselAssignments.id, id));
    return assignment || undefined;
  }
  
  async getUserVesselAssignments(userId: number): Promise<UserVesselAssignment[]> {
    try {
      console.log(`Fetching vessel assignments for user: ${userId}`);
      const assignments = await db.select().from(userVesselAssignments).where(eq(userVesselAssignments.userId, userId));
      console.log(`Found ${assignments.length} vessel assignments for user ${userId}`);
      return assignments;
    } catch (error) {
      console.error(`Error fetching vessel assignments for user ${userId}:`, error);
      throw error;
    }
  }
  
  async getVesselUserAssignments(vesselId: number): Promise<UserVesselAssignment[]> {
    try {
      console.log(`Fetching user assignments for vessel: ${vesselId}`);
      const assignments = await db.select().from(userVesselAssignments).where(eq(userVesselAssignments.vesselId, vesselId));
      console.log(`Found ${assignments.length} user assignments for vessel ${vesselId}`);
      return assignments;
    } catch (error) {
      console.error(`Error fetching user assignments for vessel ${vesselId}:`, error);
      throw error;
    }
  }
  
  async createUserVesselAssignment(assignment: InsertUserVesselAssignment): Promise<UserVesselAssignment> {
    const [newAssignment] = await db.insert(userVesselAssignments).values(assignment).returning();
    return newAssignment;
  }
  
  async updateUserVesselAssignment(id: number, updates: Partial<InsertUserVesselAssignment>): Promise<UserVesselAssignment | undefined> {
    const [updatedAssignment] = await db
      .update(userVesselAssignments)
      .set(updates)
      .where(eq(userVesselAssignments.id, id))
      .returning();
    return updatedAssignment;
  }
  
  async deleteUserVesselAssignment(id: number): Promise<boolean> {
    try {
      const result = await db.delete(userVesselAssignments).where(eq(userVesselAssignments.id, id));
      return result.rowCount ? result.rowCount > 0 : false;
    } catch (error) {
      console.error("Error deleting user-vessel assignment:", error);
      return false;
    }
  }

  // =========== Activity Log Methods =============
  async getActivityLog(id: number): Promise<ActivityLog | undefined> {
    const [log] = await db.select().from(activityLogs).where(eq(activityLogs.id, id));
    return log || undefined;
  }

  async getAllActivityLogs(): Promise<ActivityLog[]> {
    return db.select().from(activityLogs).orderBy(activityLogs.timestamp);
  }

  async getRecentActivityLogs(limit: number = 10): Promise<ActivityLog[]> {
    return db
      .select()
      .from(activityLogs)
      .orderBy(activityLogs.timestamp)
      .limit(limit);
  }

  async getActivityLogsByType(type: string): Promise<ActivityLog[]> {
    return db
      .select()
      .from(activityLogs)
      .where(eq(activityLogs.activityType, type))
      .orderBy(activityLogs.timestamp);
  }

  async getActivityLogsByUser(userId: number): Promise<ActivityLog[]> {
    return db
      .select()
      .from(activityLogs)
      .where(eq(activityLogs.userId, userId))
      .orderBy(activityLogs.timestamp);
  }

  async getActivityLogsByEntity(entityType: string, entityId: number): Promise<ActivityLog[]> {
    return db
      .select()
      .from(activityLogs)
      .where(
        and(
          eq(activityLogs.relatedEntityType, entityType),
          eq(activityLogs.relatedEntityId, entityId)
        )
      )
      .orderBy(activityLogs.timestamp);
  }

  async createActivityLog(insertLog: InsertActivityLog): Promise<ActivityLog> {
    const logToInsert = {
      ...insertLog,
      timestamp: new Date(),
      userId: insertLog.userId ?? null,
      relatedEntityType: insertLog.relatedEntityType ?? null,
      relatedEntityId: insertLog.relatedEntityId ?? null,
      metadata: insertLog.metadata ?? {}
    };
    
    const [log] = await db.insert(activityLogs).values(logToInsert).returning();
    return log;
  }

  // =========== Maintenance History Methods =============
  async getMaintenanceHistory(id: number): Promise<MaintenanceHistory | undefined> {
    const [record] = await db.select().from(maintenanceHistory).where(eq(maintenanceHistory.id, id));
    return record || undefined;
  }

  async getAllMaintenanceHistory(): Promise<MaintenanceHistory[]> {
    return db.select().from(maintenanceHistory).orderBy(maintenanceHistory.serviceDate);
  }

  async getMaintenanceHistoryByEquipment(equipmentId: number): Promise<MaintenanceHistory[]> {
    return db
      .select()
      .from(maintenanceHistory)
      .where(eq(maintenanceHistory.equipmentId, equipmentId))
      .orderBy(maintenanceHistory.serviceDate);
  }

  async createMaintenanceHistory(insertHistory: InsertMaintenanceHistory): Promise<MaintenanceHistory> {
    const [record] = await db.insert(maintenanceHistory).values(insertHistory).returning();
    return record;
  }

  async updateMaintenanceHistory(id: number, updates: Partial<InsertMaintenanceHistory>): Promise<MaintenanceHistory> {
    const [updatedRecord] = await db
      .update(maintenanceHistory)
      .set(updates)
      .where(eq(maintenanceHistory.id, id))
      .returning();
    return updatedRecord;
  }

  async deleteMaintenanceHistory(id: number): Promise<boolean> {
    try {
      const result = await db.delete(maintenanceHistory).where(eq(maintenanceHistory.id, id));
      return result.rowCount ? result.rowCount > 0 : false;
    } catch (error) {
      console.error("Error deleting maintenance history:", error);
      return false;
    }
  }

  // =========== Predictive Maintenance Methods =============
  async getPredictiveMaintenance(id: number): Promise<PredictiveMaintenance | undefined> {
    const [record] = await db.select().from(predictiveMaintenance).where(eq(predictiveMaintenance.id, id));
    return record || undefined;
  }

  async getAllPredictiveMaintenance(): Promise<PredictiveMaintenance[]> {
    return db.select().from(predictiveMaintenance);
  }

  async getPredictiveMaintenanceByEquipment(equipmentId: number): Promise<PredictiveMaintenance[]> {
    return db
      .select()
      .from(predictiveMaintenance)
      .where(eq(predictiveMaintenance.equipmentId, equipmentId));
  }

  async createPredictiveMaintenance(insertPM: InsertPredictiveMaintenance): Promise<PredictiveMaintenance> {
    const now = new Date();
    const pmToInsert = {
      equipmentId: insertPM.equipmentId,
      maintenanceType: insertPM.maintenanceType,
      predictedDate: insertPM.predictedDate || null,
      predictedRuntime: insertPM.predictedRuntime || null,
      confidence: insertPM.confidence || null,
      reasoningFactors: insertPM.reasoningFactors || {},
      recommendedAction: insertPM.recommendedAction,
      warningThreshold: insertPM.warningThreshold,
      alertThreshold: insertPM.alertThreshold,
      historyDataPoints: insertPM.historyDataPoints || null,
      lastUpdated: now,
      createdAt: now
    };
    
    const [record] = await db.insert(predictiveMaintenance).values(pmToInsert).returning();
    return record;
  }

  async updatePredictiveMaintenance(id: number, updates: Partial<InsertPredictiveMaintenance>): Promise<PredictiveMaintenance> {
    const updatesWithTimestamp = {
      ...updates,
      lastUpdated: new Date()
    };
    
    const [updatedRecord] = await db
      .update(predictiveMaintenance)
      .set(updatesWithTimestamp)
      .where(eq(predictiveMaintenance.id, id))
      .returning();
    return updatedRecord;
  }

  async deletePredictiveMaintenance(id: number): Promise<boolean> {
    try {
      const result = await db.delete(predictiveMaintenance).where(eq(predictiveMaintenance.id, id));
      return result.rowCount ? result.rowCount > 0 : false;
    } catch (error) {
      console.error("Error deleting predictive maintenance:", error);
      return false;
    }
  }

  // =========== ISM Document Methods =============
  async getIsmDocument(id: number): Promise<IsmDocument | undefined> {
    const [document] = await db.select().from(ismDocuments).where(eq(ismDocuments.id, id));
    return document || undefined;
  }

  async getAllIsmDocuments(): Promise<IsmDocument[]> {
    return db.select().from(ismDocuments);
  }

  async getIsmDocumentsByType(documentType: string): Promise<IsmDocument[]> {
    return db
      .select()
      .from(ismDocuments)
      .where(eq(ismDocuments.documentType, documentType));
  }

  async getIsmDocumentsByStatus(status: string): Promise<IsmDocument[]> {
    return db
      .select()
      .from(ismDocuments)
      .where(eq(ismDocuments.status, status));
  }

  async createIsmDocument(insertDocument: InsertIsmDocument): Promise<IsmDocument> {
    const now = new Date();
    const documentToInsert = {
      ...insertDocument,
      createdAt: now,
      updatedAt: now,
      approvedBy: insertDocument.approvedBy || null,
      approvalDate: insertDocument.approvalDate || null,
      reviewDate: insertDocument.reviewDate || null,
      content: insertDocument.content || null,
      fileUrl: insertDocument.fileUrl || null,
      createdBy: insertDocument.createdBy || null
    };
    
    const [document] = await db.insert(ismDocuments).values(documentToInsert).returning();
    return document;
  }

  async updateIsmDocument(id: number, updates: Partial<InsertIsmDocument>): Promise<IsmDocument> {
    const updatesWithTimestamp = {
      ...updates,
      updatedAt: new Date()
    };
    
    const [updatedDocument] = await db
      .update(ismDocuments)
      .set(updatesWithTimestamp)
      .where(eq(ismDocuments.id, id))
      .returning();
    return updatedDocument;
  }

  async deleteIsmDocument(id: number): Promise<boolean> {
    try {
      const result = await db.delete(ismDocuments).where(eq(ismDocuments.id, id));
      return result.rowCount ? result.rowCount > 0 : false;
    } catch (error) {
      console.error("Error deleting ISM document:", error);
      return false;
    }
  }

  // =========== ISM Audit Methods =============
  async getIsmAudit(id: number): Promise<IsmAudit | undefined> {
    const [audit] = await db.select().from(ismAudits).where(eq(ismAudits.id, id));
    return audit || undefined;
  }

  async getAllIsmAudits(): Promise<IsmAudit[]> {
    return db.select().from(ismAudits);
  }

  async getIsmAuditsByType(auditType: string): Promise<IsmAudit[]> {
    return db
      .select()
      .from(ismAudits)
      .where(eq(ismAudits.auditType, auditType));
  }

  async getIsmAuditsByStatus(status: string): Promise<IsmAudit[]> {
    return db
      .select()
      .from(ismAudits)
      .where(eq(ismAudits.status, status));
  }

  async createIsmAudit(insertAudit: InsertIsmAudit): Promise<IsmAudit> {
    const now = new Date();
    const auditToInsert = {
      ...insertAudit,
      createdAt: now,
      updatedAt: now,
      findings: insertAudit.findings || {},
      location: insertAudit.location || null,
      startDate: insertAudit.startDate || null,
      endDate: insertAudit.endDate || null,
      auditorName: insertAudit.auditorName || null,
      correctiveActions: insertAudit.correctiveActions || {},
      reportAttachment: insertAudit.reportAttachment || null,
      createdBy: insertAudit.createdBy || null
    };
    
    const [audit] = await db.insert(ismAudits).values(auditToInsert).returning();
    return audit;
  }

  async updateIsmAudit(id: number, updates: Partial<InsertIsmAudit>): Promise<IsmAudit> {
    const updatesWithTimestamp = {
      ...updates,
      updatedAt: new Date()
    };
    
    const [updatedAudit] = await db
      .update(ismAudits)
      .set(updatesWithTimestamp)
      .where(eq(ismAudits.id, id))
      .returning();
    return updatedAudit;
  }

  async deleteIsmAudit(id: number): Promise<boolean> {
    try {
      const result = await db.delete(ismAudits).where(eq(ismAudits.id, id));
      return result.rowCount ? result.rowCount > 0 : false;
    } catch (error) {
      console.error("Error deleting ISM audit:", error);
      return false;
    }
  }

  // =========== ISM Training Methods =============
  async getIsmTraining(id: number): Promise<IsmTraining | undefined> {
    const [training] = await db.select().from(ismTraining).where(eq(ismTraining.id, id));
    return training || undefined;
  }

  async getAllIsmTraining(): Promise<IsmTraining[]> {
    return db.select().from(ismTraining);
  }

  async getIsmTrainingByType(trainingType: string): Promise<IsmTraining[]> {
    return db
      .select()
      .from(ismTraining)
      .where(eq(ismTraining.trainingType, trainingType));
  }

  async getIsmTrainingByStatus(status: string): Promise<IsmTraining[]> {
    return db
      .select()
      .from(ismTraining)
      .where(eq(ismTraining.status, status));
  }

  async createIsmTraining(insertTraining: InsertIsmTraining): Promise<IsmTraining> {
    const now = new Date();
    const trainingToInsert = {
      ...insertTraining,
      createdAt: now,
      updatedAt: now,
      notes: insertTraining.notes || null,
      description: insertTraining.description || null,
      duration: insertTraining.duration || null,
      completionDate: insertTraining.completionDate || null,
      participants: insertTraining.participants || [],
      instructor: insertTraining.instructor || null,
      location: insertTraining.location || null,
      attachments: insertTraining.attachments || {},
      createdBy: insertTraining.createdBy || null
    };
    
    const [training] = await db.insert(ismTraining).values(trainingToInsert).returning();
    return training;
  }

  async updateIsmTraining(id: number, updates: Partial<InsertIsmTraining>): Promise<IsmTraining> {
    const updatesWithTimestamp = {
      ...updates,
      updatedAt: new Date()
    };
    
    const [updatedTraining] = await db
      .update(ismTraining)
      .set(updatesWithTimestamp)
      .where(eq(ismTraining.id, id))
      .returning();
    return updatedTraining;
  }

  async deleteIsmTraining(id: number): Promise<boolean> {
    try {
      const result = await db.delete(ismTraining).where(eq(ismTraining.id, id));
      return result.rowCount ? result.rowCount > 0 : false;
    } catch (error) {
      console.error("Error deleting ISM training:", error);
      return false;
    }
  }

  // =========== ISM Incident Methods =============
  async getIsmIncident(id: number): Promise<IsmIncident | undefined> {
    const [incident] = await db.select().from(ismIncidents).where(eq(ismIncidents.id, id));
    return incident || undefined;
  }

  async getAllIsmIncidents(): Promise<IsmIncident[]> {
    return db.select().from(ismIncidents);
  }

  async getIsmIncidentsByType(incidentType: string): Promise<IsmIncident[]> {
    return db
      .select()
      .from(ismIncidents)
      .where(eq(ismIncidents.incidentType, incidentType));
  }

  async getIsmIncidentsByStatus(status: string): Promise<IsmIncident[]> {
    return db
      .select()
      .from(ismIncidents)
      .where(eq(ismIncidents.status, status));
  }

  async createIsmIncident(insertIncident: InsertIsmIncident): Promise<IsmIncident> {
    const now = new Date();
    const incidentToInsert = {
      ...insertIncident,
      createdAt: now,
      updatedAt: now,
      location: insertIncident.location || null,
      rootCause: insertIncident.rootCause || null,
      witnesses: insertIncident.witnesses || [],
      correctiveActions: insertIncident.correctiveActions || {},
      attachments: insertIncident.attachments || {},
      reportedBy: insertIncident.reportedBy || null,
      investigatedBy: insertIncident.investigatedBy || null,
      verifiedBy: insertIncident.verifiedBy || null,
      verificationDate: insertIncident.verificationDate || null
    };
    
    const [incident] = await db.insert(ismIncidents).values(incidentToInsert).returning();
    return incident;
  }

  async updateIsmIncident(id: number, updates: Partial<InsertIsmIncident>): Promise<IsmIncident> {
    const updatesWithTimestamp = {
      ...updates,
      updatedAt: new Date()
    };
    
    const [updatedIncident] = await db
      .update(ismIncidents)
      .set(updatesWithTimestamp)
      .where(eq(ismIncidents.id, id))
      .returning();
    return updatedIncident;
  }

  async deleteIsmIncident(id: number): Promise<boolean> {
    try {
      const result = await db.delete(ismIncidents).where(eq(ismIncidents.id, id));
      return result.rowCount ? result.rowCount > 0 : false;
    } catch (error) {
      console.error("Error deleting ISM incident:", error);
      return false;
    }
  }

  // =========== Crew Member Methods =============
  async getCrewMember(id: number): Promise<CrewMember | undefined> {
    const [crewMember] = await db.select().from(crewMembers).where(eq(crewMembers.id, id));
    return crewMember || undefined;
  }

  async getAllCrewMembers(): Promise<CrewMember[]> {
    return db.select().from(crewMembers);
  }

  async getCrewMembersByStatus(status: string): Promise<CrewMember[]> {
    return db
      .select()
      .from(crewMembers)
      .where(eq(crewMembers.status, status));
  }

  async getCrewMembersByPosition(position: string): Promise<CrewMember[]> {
    return db
      .select()
      .from(crewMembers)
      .where(eq(crewMembers.position, position));
  }

  async createCrewMember(insertCrewMember: InsertCrewMember): Promise<CrewMember> {
    const now = new Date();
    const crewMemberToInsert = {
      ...insertCrewMember,
      createdAt: now,
      photoUrl: insertCrewMember.photoUrl || null,
      notes: insertCrewMember.notes || null
    };
    
    const [crewMember] = await db.insert(crewMembers).values(crewMemberToInsert).returning();
    return crewMember;
  }

  async updateCrewMember(id: number, updates: Partial<InsertCrewMember>): Promise<CrewMember> {
    const [updatedCrewMember] = await db
      .update(crewMembers)
      .set(updates)
      .where(eq(crewMembers.id, id))
      .returning();
    return updatedCrewMember;
  }

  async deleteCrewMember(id: number): Promise<boolean> {
    try {
      const result = await db.delete(crewMembers).where(eq(crewMembers.id, id));
      return result.rowCount ? result.rowCount > 0 : false;
    } catch (error) {
      console.error("Error deleting crew member:", error);
      return false;
    }
  }

  // =========== Crew Document Methods =============
  async getCrewDocument(id: number): Promise<CrewDocument | undefined> {
    const [document] = await db.select().from(crewDocuments).where(eq(crewDocuments.id, id));
    return document || undefined;
  }

  async getAllCrewDocuments(): Promise<CrewDocument[]> {
    return db.select().from(crewDocuments);
  }

  async getCrewDocumentsByCrewMember(crewMemberId: number): Promise<CrewDocument[]> {
    return db
      .select()
      .from(crewDocuments)
      .where(eq(crewDocuments.crewMemberId, crewMemberId));
  }

  async getCrewDocumentsByType(documentType: string): Promise<CrewDocument[]> {
    return db
      .select()
      .from(crewDocuments)
      .where(eq(crewDocuments.documentType, documentType));
  }

  async getCrewDocumentsByVerificationStatus(status: string): Promise<CrewDocument[]> {
    return db
      .select()
      .from(crewDocuments)
      .where(eq(crewDocuments.verificationStatus, status));
  }

  async getExpiringCrewDocuments(daysUntilExpiry: number): Promise<CrewDocument[]> {
    const today = new Date();
    const expiryDate = new Date();
    expiryDate.setDate(today.getDate() + daysUntilExpiry);
    
    return db
      .select()
      .from(crewDocuments)
      .where(
        and(
          gte(crewDocuments.expiryDate, today),
          lte(crewDocuments.expiryDate, expiryDate)
        )
      );
  }

  async createCrewDocument(insertDocument: InsertCrewDocument): Promise<CrewDocument> {
    const now = new Date();
    const documentToInsert = {
      ...insertDocument,
      createdAt: now,
      fileUrl: insertDocument.fileUrl || null,
      notes: insertDocument.notes || null
    };
    
    const [document] = await db.insert(crewDocuments).values(documentToInsert).returning();
    return document;
  }

  async updateCrewDocument(id: number, updates: Partial<InsertCrewDocument>): Promise<CrewDocument> {
    const [updatedDocument] = await db
      .update(crewDocuments)
      .set(updates)
      .where(eq(crewDocuments.id, id))
      .returning();
    return updatedDocument;
  }

  async deleteCrewDocument(id: number): Promise<boolean> {
    try {
      const result = await db.delete(crewDocuments).where(eq(crewDocuments.id, id));
      return result.rowCount ? result.rowCount > 0 : false;
    } catch (error) {
      console.error("Error deleting crew document:", error);
      return false;
    }
  }

  // =========== Voyage Planning Methods =============
  async getVoyage(id: number): Promise<Voyage | null> {
    try {
      const [voyage] = await db.select().from(voyages).where(eq(voyages.id, id));
      return voyage || null;
    } catch (error) {
      console.error("Error fetching voyage:", error);
      return null;
    }
  }

  async getVoyagesByVessel(vesselId: number): Promise<Voyage[]> {
    try {
      return await db.select().from(voyages).where(eq(voyages.vesselId, vesselId));
    } catch (error) {
      console.error("Error fetching voyages by vessel:", error);
      return [];
    }
  }

  async getVoyagesByStatus(status: string): Promise<Voyage[]> {
    try {
      return await db.select().from(voyages).where(eq(voyages.status, status));
    } catch (error) {
      console.error("Error fetching voyages by status:", error);
      return [];
    }
  }

  async createVoyage(voyage: InsertVoyage): Promise<Voyage> {
    try {
      const [newVoyage] = await db.insert(voyages).values({
        ...voyage,
        createdAt: new Date(),
        updatedAt: new Date()
      }).returning();
      return newVoyage;
    } catch (error) {
      console.error("Error creating voyage:", error);
      throw error;
    }
  }

  async updateVoyage(id: number, voyageUpdate: Partial<Voyage>): Promise<Voyage | null> {
    try {
      const [updatedVoyage] = await db
        .update(voyages)
        .set({
          ...voyageUpdate,
          updatedAt: new Date()
        })
        .where(eq(voyages.id, id))
        .returning();
      return updatedVoyage || null;
    } catch (error) {
      console.error("Error updating voyage:", error);
      return null;
    }
  }

  async deleteVoyage(id: number): Promise<boolean> {
    try {
      // First delete all waypoints associated with this voyage
      await db.delete(waypoints).where(eq(waypoints.voyageId, id));
      
      // Then delete the voyage
      const result = await db.delete(voyages).where(eq(voyages.id, id));
      return result.rowCount ? result.rowCount > 0 : false;
    } catch (error) {
      console.error("Error deleting voyage:", error);
      return false;
    }
  }

  // =========== Waypoint Methods =============
  async getWaypoint(id: number): Promise<Waypoint | null> {
    try {
      const [waypoint] = await db.select().from(waypoints).where(eq(waypoints.id, id));
      return waypoint || null;
    } catch (error) {
      console.error("Error fetching waypoint:", error);
      return null;
    }
  }

  async getWaypointsByVoyage(voyageId: number): Promise<Waypoint[]> {
    try {
      return await db
        .select()
        .from(waypoints)
        .where(eq(waypoints.voyageId, voyageId))
        .orderBy(waypoints.orderIndex);
    } catch (error) {
      console.error("Error fetching waypoints by voyage:", error);
      return [];
    }
  }

  async createWaypoint(waypoint: InsertWaypoint): Promise<Waypoint> {
    try {
      const [newWaypoint] = await db.insert(waypoints).values(waypoint).returning();
      return newWaypoint;
    } catch (error) {
      console.error("Error creating waypoint:", error);
      throw error;
    }
  }

  async updateWaypoint(id: number, waypointUpdate: Partial<Waypoint>): Promise<Waypoint | null> {
    try {
      const [updatedWaypoint] = await db
        .update(waypoints)
        .set(waypointUpdate)
        .where(eq(waypoints.id, id))
        .returning();
      return updatedWaypoint || null;
    } catch (error) {
      console.error("Error updating waypoint:", error);
      return null;
    }
  }

  async deleteWaypoint(id: number): Promise<boolean> {
    try {
      const result = await db.delete(waypoints).where(eq(waypoints.id, id));
      return result.rowCount ? result.rowCount > 0 : false;
    } catch (error) {
      console.error("Error deleting waypoint:", error);
      return false;
    }
  }

  // =========== Fuel Consumption Chart Methods =============
  async getFuelConsumptionData(vesselId: number): Promise<FuelConsumptionChart[]> {
    try {
      return await db
        .select()
        .from(fuelConsumptionChart)
        .where(eq(fuelConsumptionChart.vesselId, vesselId))
        .orderBy(fuelConsumptionChart.engineRpm);
    } catch (error) {
      console.error("Error fetching fuel consumption data:", error);
      return [];
    }
  }

  async addFuelConsumptionDataPoint(dataPoint: InsertFuelConsumptionChart): Promise<FuelConsumptionChart> {
    try {
      const [newDataPoint] = await db.insert(fuelConsumptionChart).values({
        ...dataPoint,
        createdAt: new Date(),
        updatedAt: new Date()
      }).returning();
      return newDataPoint;
    } catch (error) {
      console.error("Error adding fuel consumption data point:", error);
      throw error;
    }
  }

  async updateFuelConsumptionDataPoint(id: number, dataPointUpdate: Partial<FuelConsumptionChart>): Promise<FuelConsumptionChart | null> {
    try {
      const [updatedDataPoint] = await db
        .update(fuelConsumptionChart)
        .set({
          ...dataPointUpdate,
          updatedAt: new Date()
        })
        .where(eq(fuelConsumptionChart.id, id))
        .returning();
      return updatedDataPoint || null;
    } catch (error) {
      console.error("Error updating fuel consumption data point:", error);
      return null;
    }
  }

  async deleteFuelConsumptionDataPoint(id: number): Promise<boolean> {
    try {
      const result = await db.delete(fuelConsumptionChart).where(eq(fuelConsumptionChart.id, id));
      return result.rowCount ? result.rowCount > 0 : false;
    } catch (error) {
      console.error("Error deleting fuel consumption data point:", error);
      return false;
    }
  }

  // =========== Speed Chart Methods =============
  async getSpeedData(vesselId: number): Promise<SpeedChart[]> {
    try {
      return await db
        .select()
        .from(speedChart)
        .where(eq(speedChart.vesselId, vesselId))
        .orderBy(speedChart.engineRpm);
    } catch (error) {
      console.error("Error fetching speed data:", error);
      return [];
    }
  }

  async addSpeedDataPoint(dataPoint: InsertSpeedChart): Promise<SpeedChart> {
    try {
      const [newDataPoint] = await db.insert(speedChart).values({
        ...dataPoint,
        createdAt: new Date(),
        updatedAt: new Date()
      }).returning();
      return newDataPoint;
    } catch (error) {
      console.error("Error adding speed data point:", error);
      throw error;
    }
  }

  async updateSpeedDataPoint(id: number, dataPointUpdate: Partial<SpeedChart>): Promise<SpeedChart | null> {
    try {
      const [updatedDataPoint] = await db
        .update(speedChart)
        .set({
          ...dataPointUpdate,
          updatedAt: new Date()
        })
        .where(eq(speedChart.id, id))
        .returning();
      return updatedDataPoint || null;
    } catch (error) {
      console.error("Error updating speed data point:", error);
      return null;
    }
  }

  async deleteSpeedDataPoint(id: number): Promise<boolean> {
    try {
      const result = await db.delete(speedChart).where(eq(speedChart.id, id));
      return result.rowCount ? result.rowCount > 0 : false;
    } catch (error) {
      console.error("Error deleting speed data point:", error);
      return false;
    }
  }

  // This is a placeholder for a method that is currently only implemented in MemStorage
  async generatePredictiveMaintenanceForEquipment(equipmentId: number): Promise<PredictiveMaintenance[]> {
    // In the future, this would implement the actual algorithm for generating predictions
    // based on past maintenance records
    console.log(`Would generate predictions for equipment ${equipmentId} in database storage`);
    return [];
  }

  // These methods are placeholders for methods that are currently only implemented in MemStorage
  async getIsmDocumentsForReview(): Promise<IsmDocument[]> { return []; }
  async getUpcomingIsmAudits(): Promise<IsmAudit[]> { return []; }
  async getIsmTrainingByParticipant(userId: number): Promise<IsmTraining[]> { return []; }
  async getUpcomingIsmTraining(): Promise<IsmTraining[]> { return []; }
  async getIsmIncidentsByReporter(userId: number): Promise<IsmIncident[]> { return []; }
  async getOpenIsmIncidents(): Promise<IsmIncident[]> { return []; }
  
  // Voyage Planning Calculations
  async calculateVoyageFuelConsumption(voyageId: number): Promise<{ 
    totalFuelConsumption: number, 
    totalDistance: number,
    durationHours: number,
    waypoints: (Waypoint & { 
      estimatedFuelConsumption: number,
      estimatedDuration: number 
    })[]
  }> {
    try {
      console.log(`Calculating voyage fuel consumption for voyage ID: ${voyageId}`);
      
      // Get all waypoints for the voyage
      const waypoints = await this.getWaypointsByVoyage(voyageId);
      if (!waypoints.length) {
        console.log(`No waypoints found for voyage ID: ${voyageId}`);
        return { 
          totalFuelConsumption: 0, 
          totalDistance: 0, 
          durationHours: 0,
          waypoints: []
        };
      }
      
      console.log(`Found ${waypoints.length} waypoints for voyage ID: ${voyageId}`);
      
      // Get the vessel ID from the voyage
      const voyage = await this.getVoyage(voyageId);
      if (!voyage) {
        throw new Error('Voyage not found');
      }
      
      // Get fuel consumption data for this vessel
      const fuelData = await this.getFuelConsumptionData(voyage.vesselId);
      console.log(`Found ${fuelData.length} fuel consumption data points for vessel ID: ${voyage.vesselId}`);
      
      // Get speed data for this vessel
      const speedData = await this.getSpeedData(voyage.vesselId);
      console.log(`Found ${speedData.length} speed data points for vessel ID: ${voyage.vesselId}`);
      
      // Sort waypoints by order index
      waypoints.sort((a, b) => a.orderIndex - b.orderIndex);
      
      let totalFuelConsumption = 0;
      let totalDistance = 0;
      let totalDuration = 0;
      
      // Helper function to calculate distance between two coordinates in nautical miles
      const calculateDistanceNM = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
        const R = 6371; // Radius of the earth in km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = 
          Math.sin(dLat/2) * Math.sin(dLat/2) +
          Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
          Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        const distanceKm = R * c; // Distance in km
        return distanceKm * 0.539957; // Convert to nautical miles
      };
      
      // Default RPM when not provided (use middle value from fuel data if available)
      const defaultRPM = fuelData.length > 0 
        ? fuelData[Math.floor(fuelData.length / 2)].engineRpm 
        : 1600; // Fallback default
      
      // Calculate for each waypoint leg
      const enrichedWaypoints = waypoints.map((waypoint, index) => {
        // Skip the first waypoint when calculating legs (it's the starting point)
        if (index === 0) {
          return { 
            ...waypoint, 
            estimatedFuelConsumption: 0,
            estimatedDuration: 0
          };
        }
        
        // Get the previous waypoint to calculate distance
        const prevWaypoint = waypoints[index - 1];
        
        // Calculate distance in nautical miles if not provided
        let distance = 0;
        if (waypoint.distance) {
          distance = parseFloat(waypoint.distance);
        } else {
          const lat1 = parseFloat(prevWaypoint.latitude);
          const lon1 = parseFloat(prevWaypoint.longitude);
          const lat2 = parseFloat(waypoint.latitude);
          const lon2 = parseFloat(waypoint.longitude);
          
          distance = calculateDistanceNM(lat1, lon1, lat2, lon2);
          // Update the waypoint with the calculated distance
          this.updateWaypoint(waypoint.id, { 
            ...waypoint, 
            distance: distance.toFixed(1)
          }).catch(err => console.error(`Failed to update waypoint distance: ${err}`));
        }
        
        console.log(`Waypoint ${index} distance: ${distance} NM`);
        totalDistance += distance;
        
        // Determine engine RPM - use provided value or default
        let engineRpm = waypoint.engineRpm || defaultRPM;
        
        // If the waypoint doesn't have an engine RPM, update it with the default
        if (!waypoint.engineRpm) {
          this.updateWaypoint(waypoint.id, { 
            ...waypoint, 
            engineRpm
          }).catch(err => console.error(`Failed to update waypoint engine RPM: ${err}`));
        }
        
        console.log(`Waypoint ${index} engine RPM: ${engineRpm}`);
        
        // Find the speed based on the engine RPM
        let speed = 0;
        
        if (speedData.length > 0) {
          // Find the closest RPM in the speed data
          const closestSpeedData = speedData
            .sort((a, b) => Math.abs(a.engineRpm - engineRpm) - Math.abs(b.engineRpm - engineRpm))
            [0];
          
          if (closestSpeedData) {
            speed = parseFloat(closestSpeedData.speed);
            console.log(`Found speed ${speed} knots for engine RPM ${engineRpm}`);
          }
        }
        
        // If speed couldn't be determined from RPM but planned speed is available
        if (speed === 0 && waypoint.plannedSpeed) {
          speed = parseFloat(waypoint.plannedSpeed);
        }
        
        // If still no speed, use a reasonable default based on the RPM
        if (speed === 0) {
          // Simple linear approximation if no speed data available
          speed = engineRpm / 100; // Very rough estimate
          console.log(`Using estimated speed ${speed} knots for RPM ${engineRpm}`);
        }
        
        // Update the waypoint with planned speed if it's not set
        if (!waypoint.plannedSpeed) {
          this.updateWaypoint(waypoint.id, { 
            ...waypoint, 
            plannedSpeed: speed.toFixed(1)
          }).catch(err => console.error(`Failed to update waypoint planned speed: ${err}`));
        }
        
        // Calculate duration in hours (distance / speed)
        const duration = speed > 0 ? distance / speed : 0;
        totalDuration += duration;
        
        console.log(`Waypoint ${index} estimated duration: ${duration.toFixed(2)} hours`);
        
        // Calculate fuel consumption based on engine RPM and duration
        let fuelConsumption = 0;
        
        if (fuelData.length > 0) {
          // Find the closest RPM in the fuel consumption data
          const closestFuelData = fuelData
            .sort((a, b) => Math.abs(a.engineRpm - engineRpm) - Math.abs(b.engineRpm - engineRpm))
            [0];
          
          if (closestFuelData) {
            const hourlyRate = parseFloat(closestFuelData.fuelConsumptionRate);
            fuelConsumption = hourlyRate * duration;
            console.log(`Fuel consumption rate: ${hourlyRate} L/h, estimated consumption: ${fuelConsumption.toFixed(2)} L`);
          }
        } else if (waypoint.fuelConsumption) {
          // If provided directly
          fuelConsumption = parseFloat(waypoint.fuelConsumption);
        } else {
          // Rough estimate if no fuel data: 0.08 * RPM * duration
          fuelConsumption = 0.08 * engineRpm * duration;
          console.log(`Using estimated fuel consumption: ${fuelConsumption.toFixed(2)} L`);
        }
        
        // Update the waypoint with fuel consumption if it's not set
        if (!waypoint.fuelConsumption) {
          this.updateWaypoint(waypoint.id, { 
            ...waypoint, 
            fuelConsumption: fuelConsumption.toFixed(1)
          }).catch(err => console.error(`Failed to update waypoint fuel consumption: ${err}`));
        }
        
        totalFuelConsumption += fuelConsumption;
        
        return {
          ...waypoint,
          estimatedFuelConsumption: fuelConsumption,
          estimatedDuration: duration
        };
      });
      
      // Update the voyage with totals
      if (voyage) {
        this.updateVoyage(voyageId, {
          ...voyage,
          distance: totalDistance.toFixed(1),
          fuelConsumption: totalFuelConsumption.toFixed(1)
        }).catch(err => console.error(`Failed to update voyage with calculations: ${err}`));
      }
      
      console.log(`Voyage ${voyageId} calculation results:
        Total distance: ${totalDistance.toFixed(1)} NM
        Total duration: ${totalDuration.toFixed(2)} hours
        Total fuel consumption: ${totalFuelConsumption.toFixed(1)} L
      `);
      
      return {
        totalFuelConsumption,
        totalDistance,
        durationHours: totalDuration,
        waypoints: enrichedWaypoints
      };
    } catch (error) {
      console.error("Error calculating voyage fuel consumption:", error);
      throw error;
    }
  }
  
  // =========== ISM Task Management - Form Categories =============
  async getFormCategory(id: number): Promise<FormCategory | undefined> {
    const [category] = await db.select().from(formCategories).where(eq(formCategories.id, id));
    return category || undefined;
  }
  
  async getAllFormCategories(): Promise<FormCategory[]> {
    return db.select().from(formCategories);
  }
  
  async createFormCategory(category: InsertFormCategory): Promise<FormCategory> {
    const [newCategory] = await db.insert(formCategories).values(category).returning();
    return newCategory;
  }
  
  async updateFormCategory(id: number, updates: Partial<FormCategory>): Promise<FormCategory | undefined> {
    const [updated] = await db
      .update(formCategories)
      .set(updates)
      .where(eq(formCategories.id, id))
      .returning();
    return updated;
  }
  
  async deleteFormCategory(id: number): Promise<boolean> {
    const result = await db.delete(formCategories).where(eq(formCategories.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }
  
  // =========== ISM Task Management - Form Templates =============
  async getFormTemplate(id: number): Promise<FormTemplate | undefined> {
    const [template] = await db.select().from(formTemplates).where(eq(formTemplates.id, id));
    return template || undefined;
  }
  
  async getAllFormTemplates(): Promise<FormTemplate[]> {
    return db.select().from(formTemplates);
  }
  
  async getFormTemplatesByCategory(categoryId: number): Promise<FormTemplate[]> {
    return db.select().from(formTemplates).where(eq(formTemplates.categoryId, categoryId));
  }
  
  async createFormTemplate(template: InsertFormTemplate): Promise<FormTemplate> {
    const [newTemplate] = await db.insert(formTemplates).values(template).returning();
    return newTemplate;
  }
  
  async updateFormTemplate(id: number, updates: Partial<FormTemplate>): Promise<FormTemplate | undefined> {
    const [updated] = await db
      .update(formTemplates)
      .set(updates)
      .where(eq(formTemplates.id, id))
      .returning();
    return updated;
  }
  
  async deleteFormTemplate(id: number): Promise<boolean> {
    const result = await db.delete(formTemplates).where(eq(formTemplates.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }
  
  // =========== ISM Task Management - Form Template Versions =============
  async getFormTemplateVersion(id: number): Promise<FormTemplateVersion | undefined> {
    const [version] = await db.select().from(formTemplateVersions).where(eq(formTemplateVersions.id, id));
    return version || undefined;
  }
  
  async getFormTemplateVersionsByTemplate(templateId: number): Promise<FormTemplateVersion[]> {
    return db.select().from(formTemplateVersions).where(eq(formTemplateVersions.templateId, templateId));
  }
  
  async getActiveFormTemplateVersion(templateId: number): Promise<FormTemplateVersion | undefined> {
    const [version] = await db
      .select()
      .from(formTemplateVersions)
      .where(
        and(
          eq(formTemplateVersions.templateId, templateId),
          eq(formTemplateVersions.isActive, true)
        )
      );
    return version || undefined;
  }
  
  async createFormTemplateVersion(version: InsertFormTemplateVersion): Promise<FormTemplateVersion> {
    // If this version is active, deactivate all other versions of this template
    if (version.isActive) {
      await db
        .update(formTemplateVersions)
        .set({ isActive: false })
        .where(eq(formTemplateVersions.templateId, version.templateId));
    }
    
    const [newVersion] = await db.insert(formTemplateVersions).values(version).returning();
    return newVersion;
  }
  
  async activateFormTemplateVersion(id: number): Promise<FormTemplateVersion | undefined> {
    const version = await this.getFormTemplateVersion(id);
    if (!version) return undefined;
    
    // Deactivate all versions of this template
    await db
      .update(formTemplateVersions)
      .set({ isActive: false })
      .where(eq(formTemplateVersions.templateId, version.templateId));
    
    // Activate the requested version
    const [updatedVersion] = await db
      .update(formTemplateVersions)
      .set({ isActive: true })
      .where(eq(formTemplateVersions.id, id))
      .returning();
    
    return updatedVersion;
  }
  
  async updateFormTemplateVersion(id: number, updates: Partial<FormTemplateVersion>): Promise<FormTemplateVersion | undefined> {
    const version = await this.getFormTemplateVersion(id);
    if (!version) return undefined;
    
    // If activating this version, deactivate all others
    if (updates.isActive && !version.isActive) {
      await db
        .update(formTemplateVersions)
        .set({ isActive: false })
        .where(eq(formTemplateVersions.templateId, version.templateId));
    }
    
    const [updatedVersion] = await db
      .update(formTemplateVersions)
      .set(updates)
      .where(eq(formTemplateVersions.id, id))
      .returning();
    
    return updatedVersion;
  }
  
  async deleteFormTemplateVersion(id: number): Promise<boolean> {
    const result = await db.delete(formTemplateVersions).where(eq(formTemplateVersions.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }
  
  // =========== ISM Task Management - ISM Tasks =============
  async getIsmTask(id: number): Promise<IsmTask | undefined> {
    const [task] = await db.select().from(ismTasks).where(eq(ismTasks.id, id));
    return task || undefined;
  }
  
  async getAllIsmTasks(): Promise<IsmTask[]> {
    try {
      console.log("Running getAllIsmTasks...");
      
      // Check if table exists 
      const checkTableResult = await db.execute(
        sql`SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = 'ism_tasks'
        )`
      );
      
      console.log("Table check result:", checkTableResult.rows);
      
      if (checkTableResult.rows && checkTableResult.rows[0] && !checkTableResult.rows[0].exists) {
        console.error("The ism_tasks table does not exist!");
        return [];
      }
      
      // Check table structure
      const columnCheckResult = await db.execute(
        sql`SELECT column_name FROM information_schema.columns 
            WHERE table_name = 'ism_tasks'`
      );
      
      console.log("Table columns:", columnCheckResult.rows);
      
      const tasks = await db.select().from(ismTasks);
      console.log(`Found ${tasks.length} ISM tasks`);
      return tasks;
    } catch (error) {
      console.error("Error in getAllIsmTasks:", error);
      console.error(error instanceof Error ? error.stack : String(error));
      return [];
    }
  }
  
  async getIsmTasksByVessel(vesselId: number): Promise<IsmTask[]> {
    try {
      // Temporary solution until we fully implement vessel_id in our schema
      // This returns all tasks for now, since we don't have vessel_id properly implemented
      // In a real implementation, we would filter by vessel_id
      console.log(`Getting ISM tasks for vessel ID: ${vesselId}`);
      return db.select().from(ismTasks);
    } catch (error) {
      console.error("Error in getIsmTasksByVessel:", error);
      return [];
    }
  }
  
  async getIsmTasksByStatus(status: string): Promise<IsmTask[]> {
    return db.select().from(ismTasks).where(eq(ismTasks.status, status));
  }
  
  async getIsmTasksByAssignee(userId: number): Promise<IsmTask[]> {
    return db.select().from(ismTasks).where(eq(ismTasks.assignedToId, userId));
  }
  
  async getDueIsmTasks(): Promise<IsmTask[]> {
    const today = new Date();
    return db
      .select()
      .from(ismTasks)
      .where(
        and(
          eq(ismTasks.status, "pending"),
          lte(ismTasks.dueDate, today)
        )
      );
  }
  
  async getIsmTasksByTemplateVersion(versionId: number): Promise<IsmTask[]> {
    return db
      .select()
      .from(ismTasks)
      .where(eq(ismTasks.formTemplateVersionId, versionId));
  }
  
  async createIsmTask(task: InsertIsmTask): Promise<IsmTask> {
    const [newTask] = await db.insert(ismTasks).values(task).returning();
    return newTask;
  }
  
  async updateIsmTask(id: number, updates: Partial<IsmTask>): Promise<IsmTask | undefined> {
    const [updatedTask] = await db
      .update(ismTasks)
      .set(updates)
      .where(eq(ismTasks.id, id))
      .returning();
    
    return updatedTask;
  }
  
  async deleteIsmTask(id: number): Promise<boolean> {
    const result = await db.delete(ismTasks).where(eq(ismTasks.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }
  
  // =========== ISM Task Management - Form Submissions =============
  async getFormSubmission(id: number): Promise<FormSubmission | undefined> {
    const [submission] = await db.select().from(formSubmissions).where(eq(formSubmissions.id, id));
    return submission || undefined;
  }
  
  async getFormSubmissionsByTask(taskId: number): Promise<FormSubmission[]> {
    return db
      .select()
      .from(formSubmissions)
      .where(eq(formSubmissions.taskId, taskId));
  }
  
  async getRecentFormSubmissions(limit: number = 10): Promise<FormSubmission[]> {
    return db
      .select()
      .from(formSubmissions)
      .orderBy(formSubmissions.submittedAt)
      .limit(limit);
  }
  
  async createFormSubmission(submission: InsertFormSubmission): Promise<FormSubmission> {
    const [newSubmission] = await db.insert(formSubmissions).values(submission).returning();
    
    // If submission is final, update task status to completed
    if (submission.reviewStatus === 'approved') {
      await this.updateIsmTask(submission.taskId, { status: 'completed' });
    }
    
    return newSubmission;
  }
  
  async updateFormSubmission(id: number, updates: Partial<FormSubmission>): Promise<FormSubmission | undefined> {
    const submission = await this.getFormSubmission(id);
    if (!submission) return undefined;
    
    const [updatedSubmission] = await db
      .update(formSubmissions)
      .set(updates)
      .where(eq(formSubmissions.id, id))
      .returning();
    
    // If the status is changed to approved, update task status to completed
    if (updates.reviewStatus === 'approved' && submission.reviewStatus !== 'approved') {
      await this.updateIsmTask(submission.taskId, { status: 'completed' });
    }
    // If the status is changed to rejected, update task status to in-progress
    else if (updates.reviewStatus === 'rejected' && submission.reviewStatus !== 'rejected') {
      await this.updateIsmTask(submission.taskId, { status: 'in-progress' });
    }
    
    return updatedSubmission;
  }
  
  async deleteFormSubmission(id: number): Promise<boolean> {
    const result = await db.delete(formSubmissions).where(eq(formSubmissions.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }
  
  // =========== ISM Task Management - Task Comments =============
  async getTaskComment(id: number): Promise<TaskComment | undefined> {
    const [comment] = await db.select().from(taskComments).where(eq(taskComments.id, id));
    return comment || undefined;
  }
  
  async getTaskCommentsByTask(taskId: number): Promise<TaskComment[]> {
    return db
      .select()
      .from(taskComments)
      .where(eq(taskComments.taskId, taskId))
      .orderBy(taskComments.createdAt);
  }
  
  async createTaskComment(comment: InsertTaskComment): Promise<TaskComment> {
    const [newComment] = await db.insert(taskComments).values(comment).returning();
    return newComment;
  }
  
  async updateTaskComment(id: number, updates: Partial<TaskComment>): Promise<TaskComment | undefined> {
    const [updatedComment] = await db
      .update(taskComments)
      .set(updates)
      .where(eq(taskComments.id, id))
      .returning();
    
    return updatedComment;
  }
  
  async deleteTaskComment(id: number): Promise<boolean> {
    const result = await db.delete(taskComments).where(eq(taskComments.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // =========== Financial Management - Financial Accounts operations =============
  
  async getFinancialAccount(id: number): Promise<FinancialAccount | undefined> {
    const [account] = await db.select().from(financialAccounts).where(eq(financialAccounts.id, id));
    return account || undefined;
  }
  
  async getFinancialAccountsByVessel(vesselId: number): Promise<FinancialAccount[]> {
    try {
      console.log(`Fetching financial accounts for vessel ID: ${vesselId}`);
      const accounts = await db
        .select()
        .from(financialAccounts)
        .where(eq(financialAccounts.vesselId, vesselId));
      
      console.log(`Found ${accounts.length} financial accounts for vessel ID: ${vesselId}`);
      
      // If no accounts are found, return an empty array
      if (accounts.length === 0) {
        console.log(`No financial accounts found for vessel ID: ${vesselId}`);
        return [];
      }
      
      return accounts;
    } catch (error) {
      console.error(`Error fetching financial accounts for vessel ${vesselId}:`, error);
      // Return empty array rather than throwing
      return [];
    }
  }
  
  async getAllFinancialAccounts(): Promise<FinancialAccount[]> {
    return db.select().from(financialAccounts);
  }
  
  async getFinancialAccountByCategory(category: string): Promise<FinancialAccount[]> {
    return db
      .select()
      .from(financialAccounts)
      .where(eq(financialAccounts.category, category));
  }
  
  // =========== Deposit Methods =============
  async getDeposit(id: number): Promise<Deposit | undefined> {
    const [deposit] = await db.select().from(deposits).where(eq(deposits.id, id));
    return deposit || undefined;
  }

  async getAllDeposits(): Promise<Deposit[]> {
    return db.select().from(deposits);
  }

  async getDepositsByVessel(vesselId: number): Promise<Deposit[]> {
    return db.select().from(deposits).where(eq(deposits.vesselId, vesselId));
  }

  async getDepositsByAccount(accountId: number): Promise<Deposit[]> {
    return db.select().from(deposits).where(eq(deposits.accountId, accountId));
  }

  async createDeposit(deposit: InsertDeposit): Promise<Deposit> {
    const [newDeposit] = await db.insert(deposits).values(deposit).returning();
    return newDeposit;
  }

  async updateDeposit(id: number, depositUpdate: Partial<InsertDeposit>): Promise<Deposit> {
    const [updatedDeposit] = await db
      .update(deposits)
      .set(depositUpdate)
      .where(eq(deposits.id, id))
      .returning();
    return updatedDeposit;
  }

  async deleteDeposit(id: number): Promise<boolean> {
    try {
      const result = await db.delete(deposits).where(eq(deposits.id, id));
      return result.rowCount > 0;
    } catch (error) {
      console.error("Error deleting deposit:", error);
      return false;
    }
  }

  // =========== Financial Account Methods =============
  async createFinancialAccount(account: InsertFinancialAccount): Promise<FinancialAccount> {
    const [newAccount] = await db.insert(financialAccounts).values(account).returning();
    return newAccount;
  }
  
  async updateFinancialAccount(id: number, account: Partial<FinancialAccount>): Promise<FinancialAccount | undefined> {
    const [updatedAccount] = await db
      .update(financialAccounts)
      .set(account)
      .where(eq(financialAccounts.id, id))
      .returning();
    return updatedAccount;
  }
  
  async deleteFinancialAccount(id: number): Promise<boolean> {
    try {
      const result = await db.delete(financialAccounts).where(eq(financialAccounts.id, id));
      return result.rowCount ? result.rowCount > 0 : false;
    } catch (error) {
      console.error(`Error deleting financial account ${id}:`, error);
      return false;
    }
  }
  
  // =========== Financial Management - Budget operations =============
  
  async getBudget(id: number): Promise<Budget | undefined> {
    const [budget] = await db.select().from(budgets).where(eq(budgets.id, id));
    return budget || undefined;
  }
  
  async getBudgetsByVessel(vesselId: number): Promise<Budget[]> {
    return db
      .select()
      .from(budgets)
      .where(eq(budgets.vesselId, vesselId));
  }
  
  async getActiveBudgets(): Promise<Budget[]> {
    return db
      .select()
      .from(budgets)
      .where(eq(budgets.status, "active"));
  }
  
  async createBudget(budget: InsertBudget): Promise<Budget> {
    const [newBudget] = await db.insert(budgets).values(budget).returning();
    return newBudget;
  }
  
  async updateBudget(id: number, budget: Partial<Budget>): Promise<Budget | undefined> {
    const [updatedBudget] = await db
      .update(budgets)
      .set(budget)
      .where(eq(budgets.id, id))
      .returning();
    return updatedBudget;
  }
  
  async deleteBudget(id: number): Promise<boolean> {
    try {
      const result = await db.delete(budgets).where(eq(budgets.id, id));
      return result.rowCount ? result.rowCount > 0 : false;
    } catch (error) {
      console.error(`Error deleting budget ${id}:`, error);
      return false;
    }
  }
  
  // =========== Financial Management - Budget Allocation operations =============
  
  async getBudgetAllocation(id: number): Promise<BudgetAllocation | undefined> {
    const [allocation] = await db.select().from(budgetAllocations).where(eq(budgetAllocations.id, id));
    return allocation || undefined;
  }
  
  async getBudgetAllocationsByBudget(budgetId: number): Promise<BudgetAllocation[]> {
    return db
      .select()
      .from(budgetAllocations)
      .where(eq(budgetAllocations.budgetId, budgetId));
  }
  
  async getBudgetAllocationsByAccount(accountId: number): Promise<BudgetAllocation[]> {
    return db
      .select()
      .from(budgetAllocations)
      .where(eq(budgetAllocations.accountId, accountId));
  }
  
  async createBudgetAllocation(allocation: InsertBudgetAllocation): Promise<BudgetAllocation> {
    const [newAllocation] = await db.insert(budgetAllocations).values(allocation).returning();
    return newAllocation;
  }
  
  async updateBudgetAllocation(id: number, allocation: Partial<BudgetAllocation>): Promise<BudgetAllocation | undefined> {
    const [updatedAllocation] = await db
      .update(budgetAllocations)
      .set(allocation)
      .where(eq(budgetAllocations.id, id))
      .returning();
    return updatedAllocation;
  }
  
  async deleteBudgetAllocation(id: number): Promise<boolean> {
    try {
      const result = await db.delete(budgetAllocations).where(eq(budgetAllocations.id, id));
      return result.rowCount ? result.rowCount > 0 : false;
    } catch (error) {
      console.error(`Error deleting budget allocation ${id}:`, error);
      return false;
    }
  }
  
  // =========== Financial Management - Expense operations =============
  
  async getExpense(id: number): Promise<Expense | undefined> {
    const [expense] = await db.select().from(expenses).where(eq(expenses.id, id));
    return expense || undefined;
  }
  
  async getExpensesByVessel(vesselId: number): Promise<Expense[]> {
    return db
      .select()
      .from(expenses)
      .where(eq(expenses.vesselId, vesselId));
  }
  
  async getExpensesByBudget(budgetId: number): Promise<Expense[]> {
    return db
      .select()
      .from(expenses)
      .where(eq(expenses.budgetId, budgetId));
  }
  
  async getExpensesByAccount(accountId: number): Promise<Expense[]> {
    return db
      .select()
      .from(expenses)
      .where(eq(expenses.accountId, accountId));
  }
  
  async getExpensesByCategory(category: string): Promise<Expense[]> {
    return db
      .select()
      .from(expenses)
      .where(eq(expenses.category, category));
  }
  
  async createExpense(expense: InsertExpense): Promise<Expense> {
    // Create a safe copy of the expense data
    const safeExpense = { ...expense };
    
    // Remove transactionId if it exists and is 0 (to prevent foreign key constraint errors)
    if (safeExpense.transactionId === 0 || safeExpense.transactionId === undefined) {
      delete safeExpense.transactionId;
    }
    
    console.log(`Creating expense: ${JSON.stringify(safeExpense)}`);
    
    // Use our retry helper to handle connection issues
    const newExpense = await executeWithRetry(async () => {
      const [result] = await db.insert(expenses).values(safeExpense).returning();
      return result;
    }, 3, 500); // Retry up to 3 times with 500ms base delay
    
    console.log(`Successfully created expense ID ${newExpense.id}`);
    return newExpense;
  }
  
  async createBulkExpenses(expensesData: InsertExpense[]): Promise<Expense[]> {
    console.log(`Starting bulk expense creation for ${expensesData.length} expenses`);
    const createdExpenses: Expense[] = [];
    
    // Process each expense individually to ensure proper error handling
    for (const expense of expensesData) {
      try {
        // Ensure transactionId is not being set to an invalid value
        const safeExpense = { ...expense };
        
        // Remove transactionId if it exists and is 0 (to prevent foreign key constraint errors)
        if (safeExpense.transactionId === 0 || safeExpense.transactionId === undefined) {
          delete safeExpense.transactionId;
        }
        
        // Log the current expense being processed
        console.log(`Processing expense for vesselId: ${safeExpense.vesselId}, amount: ${safeExpense.total}`);
        
        // Use our retry helper through the createExpense method
        const newExpense = await this.createExpense(safeExpense);
        createdExpenses.push(newExpense);
        console.log(`Added expense ID ${newExpense.id} to created expenses list`);
      } catch (error) {
        console.error("Error creating expense in bulk operation:", error);
        // Continue with the next expense even if one fails
      }
    }
    
    console.log(`Completed bulk expense creation. Created ${createdExpenses.length} expenses`);
    return createdExpenses;
  }
  
  async updateExpense(id: number, expense: Partial<Expense>): Promise<Expense | undefined> {
    const [updatedExpense] = await db
      .update(expenses)
      .set(expense)
      .where(eq(expenses.id, id))
      .returning();
    return updatedExpense;
  }
  
  async deleteExpense(id: number): Promise<boolean> {
    try {
      const result = await db.delete(expenses).where(eq(expenses.id, id));
      return result.rowCount ? result.rowCount > 0 : false;
    } catch (error) {
      console.error(`Error deleting expense ${id}:`, error);
      return false;
    }
  }

  // Receipt reconciliation methods
  async getUnreconciledExpenses(vesselId?: number): Promise<Expense[]> {
    try {
      let query = db.select().from(expenses).where(eq(expenses.receiptUrl, null));
      
      if (vesselId) {
        query = query.where(eq(expenses.vesselId, vesselId));
      }
      
      return await query;
    } catch (error) {
      console.error('Error getting unreconciled expenses:', error);
      return [];
    }
  }

  async updateExpenseReceipt(id: number, receiptUrl: string): Promise<Expense | undefined> {
    try {
      const result = await db.update(expenses)
        .set({ 
          receiptUrl,
          updatedAt: new Date()
        })
        .where(eq(expenses.id, id))
        .returning();
      
      return result[0];
    } catch (error) {
      console.error(`Error updating receipt for expense ${id}:`, error);
      return undefined;
    }
  }
  
  // =========== Financial Management - Transaction operations =============
  
  // Legacy Transaction methods (to be phased out)
  async getTransaction(id: number): Promise<any | undefined> {
    const [transaction] = await db.select().from(transactions).where(eq(transactions.id, id));
    return transaction || undefined;
  }
  
  async getTransactionsByVessel(vesselId: number): Promise<any[]> {
    return db
      .select()
      .from(transactions)
      .where(eq(transactions.vesselId, vesselId));
  }
  
  async getAllTransactions(): Promise<any[]> {
    return db
      .select()
      .from(transactions);
  }
  
  async createTransaction(transaction: any): Promise<any> {
    // Legacy method - redirect to new banking transactions
    console.log("Legacy createTransaction called - redirecting to createBankingTransaction");
    return this.createBankingTransaction(transaction as InsertBankingTransaction);
  }
  
  async updateTransaction(id: number, transaction: any): Promise<any | undefined> {
    const [updatedTransaction] = await db
      .update(transactions)
      .set(transaction)
      .where(eq(transactions.id, id))
      .returning();
    return updatedTransaction;
  }
  
  async deleteTransaction(id: number): Promise<boolean> {
    try {
      const result = await db.delete(transactions).where(eq(transactions.id, id));
      return result.rowCount ? result.rowCount > 0 : false;
    } catch (error) {
      console.error(`Error deleting transaction ${id}:`, error);
      return false;
    }
  }
  
  // New Banking Transaction methods
  async getBankingTransaction(id: number): Promise<BankingTransaction | undefined> {
    const [transaction] = await db.select().from(bankingTransactions).where(eq(bankingTransactions.id, id));
    return transaction || undefined;
  }
  
  async getBankingTransactionsByVessel(vesselId: number): Promise<BankingTransaction[]> {
    return db
      .select()
      .from(bankingTransactions)
      .where(eq(bankingTransactions.vesselId, vesselId));
  }
  
  async getAllBankingTransactions(): Promise<BankingTransaction[]> {
    return db
      .select()
      .from(bankingTransactions);
  }
  
  async createBankingTransaction(transaction: InsertBankingTransaction): Promise<BankingTransaction> {
    const [newTransaction] = await db.insert(bankingTransactions).values(transaction).returning();
    return newTransaction;
  }
  
  async updateBankingTransaction(id: number, transaction: Partial<BankingTransaction>): Promise<BankingTransaction | undefined> {
    const [updatedTransaction] = await db
      .update(bankingTransactions)
      .set(transaction)
      .where(eq(bankingTransactions.id, id))
      .returning();
    return updatedTransaction;
  }
  
  async deleteBankingTransaction(id: number): Promise<boolean> {
    try {
      const result = await db.delete(bankingTransactions).where(eq(bankingTransactions.id, id));
      return result.rowCount ? result.rowCount > 0 : false;
    } catch (error) {
      console.error(`Error deleting banking transaction ${id}:`, error);
      return false;
    }
  }
  
  // =========== Financial Management - Transaction Line operations =============
  
  async getTransactionLines(transactionId: number): Promise<TransactionLine[]> {
    return db
      .select()
      .from(transactionLines)
      .where(eq(transactionLines.transactionId, transactionId));
  }
  
  async getTransactionLinesByTransactionIds(transactionIds: number[]): Promise<TransactionLine[]> {
    if (!transactionIds || transactionIds.length === 0) {
      return [];
    }
    
    return db
      .select()
      .from(transactionLines)
      .where(sql`${transactionLines.transactionId} IN (${transactionIds.join(',')})`);
  }
  
  async createTransactionLine(line: InsertTransactionLine): Promise<TransactionLine> {
    const [newLine] = await db.insert(transactionLines).values(line).returning();
    return newLine;
  }
  
  async updateTransactionLine(id: number, line: Partial<TransactionLine>): Promise<TransactionLine | undefined> {
    const [updatedLine] = await db
      .update(transactionLines)
      .set(line)
      .where(eq(transactionLines.id, id))
      .returning();
    return updatedLine;
  }
  
  async deleteTransactionLine(id: number): Promise<boolean> {
    try {
      const result = await db.delete(transactionLines).where(eq(transactionLines.id, id));
      return result.rowCount ? result.rowCount > 0 : false;
    } catch (error) {
      console.error(`Error deleting transaction line ${id}:`, error);
      return false;
    }
  }

  // Vendor operations
  async getVendor(id: number): Promise<Vendor | undefined> {
    const result = await db.select().from(vendors).where(eq(vendors.id, id)).limit(1);
    return result[0];
  }
  
  async getAllVendors(): Promise<Vendor[]> {
    return await db.select().from(vendors).orderBy(vendors.name);
  }
  
  async getActiveVendors(): Promise<Vendor[]> {
    return await db.select().from(vendors).where(eq(vendors.isActive, true)).orderBy(vendors.name);
  }
  
  async createVendor(vendor: InsertVendor): Promise<Vendor> {
    const result = await db.insert(vendors).values(vendor).returning();
    return result[0];
  }
  
  async updateVendor(id: number, vendor: Partial<Vendor>): Promise<Vendor | undefined> {
    const result = await db.update(vendors).set(vendor).where(eq(vendors.id, id)).returning();
    return result[0];
  }
  
  async deleteVendor(id: number): Promise<boolean> {
    const result = await db.delete(vendors).where(eq(vendors.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }
  
  // ============= Banking Integration methods =============
  
  // Bank Account operations
  async getBankAccount(id: number): Promise<BankAccount | undefined> {
    const [account] = await db.select().from(bankAccounts).where(eq(bankAccounts.id, id));
    return account;
  }
  
  async getAllBankAccounts(): Promise<BankAccount[]> {
    return db.select().from(bankAccounts).orderBy(bankAccounts.accountName);
  }
  
  async getActiveBankAccounts(): Promise<BankAccount[]> {
    return db.select().from(bankAccounts).where(eq(bankAccounts.isActive, true)).orderBy(bankAccounts.accountName);
  }
  
  async createBankAccount(account: InsertBankAccount): Promise<BankAccount> {
    const [newAccount] = await db.insert(bankAccounts).values(account).returning();
    return newAccount;
  }
  
  async updateBankAccount(id: number, account: Partial<BankAccount>): Promise<BankAccount | undefined> {
    const [updatedAccount] = await db
      .update(bankAccounts)
      .set({
        ...account,
        updatedAt: new Date()
      })
      .where(eq(bankAccounts.id, id))
      .returning();
    return updatedAccount;
  }
  
  async deleteBankAccount(id: number): Promise<boolean> {
    try {
      const result = await db.delete(bankAccounts).where(eq(bankAccounts.id, id));
      return result.rowCount ? result.rowCount > 0 : false;
    } catch (error) {
      console.error(`Error deleting bank account ${id}:`, error);
      return false;
    }
  }
  
  async getBankAccountsByVessel(vesselId: number): Promise<BankAccount[]> {
    return db
      .select()
      .from(bankAccounts)
      .where(eq(bankAccounts.vesselId, vesselId))
      .orderBy(bankAccounts.accountName);
  }
  
  async reconcileBankAccount(id: number, newBalance: string, reconciliationDate: Date): Promise<BankAccount | undefined> {
    const [reconciled] = await db
      .update(bankAccounts)
      .set({
        currentBalance: newBalance,
        lastReconciledDate: reconciliationDate,
        updatedAt: new Date()
      })
      .where(eq(bankAccounts.id, id))
      .returning();
    
    return reconciled;
  }
  
  // Banking Provider operations
  async getBankingApiProvider(id: number): Promise<BankingApiProvider | undefined> {
    const [provider] = await db.select().from(bankingApiProviders).where(eq(bankingApiProviders.id, id));
    return provider;
  }
  
  async getBankingApiProviderByType(apiType: string): Promise<BankingApiProvider | undefined> {
    const [provider] = await db.select().from(bankingApiProviders).where(eq(bankingApiProviders.apiType, apiType));
    return provider;
  }
  
  async getAllBankingApiProviders(): Promise<BankingApiProvider[]> {
    return db.select().from(bankingApiProviders).orderBy(bankingApiProviders.name);
  }
  
  async getActiveBankingApiProviders(): Promise<BankingApiProvider[]> {
    return db.select().from(bankingApiProviders).where(eq(bankingApiProviders.isActive, true)).orderBy(bankingApiProviders.name);
  }
  
  // Banking API Connection operations
  async getBankApiConnection(id: number): Promise<BankApiConnection | undefined> {
    const [connection] = await db.select().from(bankApiConnections).where(eq(bankApiConnections.id, id));
    return connection;
  }
  
  async getBankApiConnections(): Promise<BankApiConnection[]> {
    return db
      .select()
      .from(bankApiConnections)
      .orderBy(bankApiConnections.name);
  }
  
  async getBankApiConnectionsByBankAccount(bankAccountId: number): Promise<BankApiConnection[]> {
    return db
      .select()
      .from(bankApiConnections)
      .where(eq(bankApiConnections.bankAccountId, bankAccountId))
      .orderBy(bankApiConnections.name);
  }
  
  async getActiveBankApiConnections(): Promise<BankApiConnection[]> {
    return db
      .select()
      .from(bankApiConnections)
      .where(eq(bankApiConnections.isActive, true))
      .orderBy(bankApiConnections.name);
  }
  
  async createBankApiConnection(connection: InsertBankApiConnection): Promise<BankApiConnection> {
    const [newConnection] = await db.insert(bankApiConnections).values(connection).returning();
    return newConnection;
  }
  
  async updateBankApiConnection(id: number, connection: Partial<BankApiConnection>): Promise<BankApiConnection | undefined> {
    const [updatedConnection] = await db
      .update(bankApiConnections)
      .set({
        ...connection,
        updatedAt: new Date()
      })
      .where(eq(bankApiConnections.id, id))
      .returning();
    return updatedConnection;
  }
  
  async deleteBankApiConnection(id: number): Promise<boolean> {
    try {
      const result = await db.delete(bankApiConnections).where(eq(bankApiConnections.id, id));
      return result.rowCount ? result.rowCount > 0 : false;
    } catch (error) {
      console.error(`Error deleting bank API connection ${id}:`, error);
      return false;
    }
  }
  
  // Banking API Transaction operations
  async getBankApiTransaction(id: number): Promise<BankApiTransaction | undefined> {
    const [transaction] = await db.select().from(bankApiTransactions).where(eq(bankApiTransactions.id, id));
    return transaction;
  }
  
  async getBankApiTransactions(connectionId: number, startDate?: Date, endDate?: Date): Promise<BankApiTransaction[]> {
    let query = db
      .select()
      .from(bankApiTransactions)
      .where(eq(bankApiTransactions.connectionId, connectionId));
      
    if (startDate && endDate) {
      query = query.where(
        between(bankApiTransactions.transactionDate, startDate, endDate)
      );
    } else if (startDate) {
      query = query.where(gte(bankApiTransactions.transactionDate, startDate));
    } else if (endDate) {
      query = query.where(lte(bankApiTransactions.transactionDate, endDate));
    }
    
    return query.orderBy(desc(bankApiTransactions.transactionDate));
  }
  
  async getBankApiTransactionsByConnection(connectionId: number): Promise<BankApiTransaction[]> {
    return db
      .select()
      .from(bankApiTransactions)
      .where(eq(bankApiTransactions.connectionId, connectionId))
      .orderBy(desc(bankApiTransactions.transactionDate));
  }
  
  async getBankApiTransactionsByBankAccount(bankAccountId: number): Promise<BankApiTransaction[]> {
    return db
      .select()
      .from(bankApiTransactions)
      .where(eq(bankApiTransactions.bankAccountId, bankAccountId))
      .orderBy(desc(bankApiTransactions.transactionDate));
  }
  
  async getBankApiTransactionsByDateRange(bankAccountId: number, startDate: Date, endDate: Date): Promise<BankApiTransaction[]> {
    return db
      .select()
      .from(bankApiTransactions)
      .where(
        and(
          eq(bankApiTransactions.bankAccountId, bankAccountId),
          between(bankApiTransactions.transactionDate, startDate, endDate)
        )
      )
      .orderBy(desc(bankApiTransactions.transactionDate));
  }
  
  async getUnreconciledBankApiTransactions(bankAccountId: number): Promise<BankApiTransaction[]> {
    return db
      .select()
      .from(bankApiTransactions)
      .where(
        and(
          eq(bankApiTransactions.bankAccountId, bankAccountId),
          eq(bankApiTransactions.isReconciled, false)
        )
      )
      .orderBy(desc(bankApiTransactions.transactionDate));
  }
  
  async createBankApiTransaction(transaction: InsertBankApiTransaction): Promise<BankApiTransaction> {
    const [newTransaction] = await db.insert(bankApiTransactions).values(transaction).returning();
    return newTransaction;
  }
  
  async createBulkBankApiTransactions(transactions: InsertBankApiTransaction[]): Promise<BankApiTransaction[]> {
    if (!transactions.length) return [];
    const insertedTransactions = await db.insert(bankApiTransactions).values(transactions).returning();
    return insertedTransactions;
  }
  
  async updateBankApiTransaction(id: number, transaction: Partial<BankApiTransaction>): Promise<BankApiTransaction | undefined> {
    const [updatedTransaction] = await db
      .update(bankApiTransactions)
      .set({
        ...transaction,
        updatedAt: new Date()
      })
      .where(eq(bankApiTransactions.id, id))
      .returning();
    return updatedTransaction;
  }
  
  // Bank Sync Log operations
  async getBankSyncLog(id: number): Promise<BankSyncLog | undefined> {
    const [log] = await db.select().from(bankSyncLogs).where(eq(bankSyncLogs.id, id));
    return log;
  }
  
  async getBankSyncLogsByConnection(connectionId: number): Promise<BankSyncLog[]> {
    return db
      .select()
      .from(bankSyncLogs)
      .where(eq(bankSyncLogs.connectionId, connectionId))
      .orderBy(desc(bankSyncLogs.startDate));
  }
  
  async getBankSyncLogs(connectionId: number): Promise<BankSyncLog[]> {
    return this.getBankSyncLogsByConnection(connectionId);
  }
  
  async getRecentBankSyncLogs(limit: number = 10): Promise<BankSyncLog[]> {
    return db
      .select()
      .from(bankSyncLogs)
      .orderBy(desc(bankSyncLogs.startDate))
      .limit(limit);
  }
  
  async createBankSyncLog(log: InsertBankSyncLog): Promise<BankSyncLog> {
    const [newLog] = await db.insert(bankSyncLogs).values(log).returning();
    return newLog;
  }
  
  async updateBankSyncLog(id: number, log: Partial<BankSyncLog>): Promise<BankSyncLog | undefined> {
    const [updatedLog] = await db
      .update(bankSyncLogs)
      .set(log)
      .where(eq(bankSyncLogs.id, id))
      .returning();
    return updatedLog;
  }

  // Banking Provider Operations
  async getBankingProvider(id: number): Promise<BankingProvider | undefined> {
    const [provider] = await db.select().from(bankingProviders).where(eq(bankingProviders.id, id));
    return provider || undefined;
  }

  async getBankingProvidersByVessel(vesselId: number): Promise<BankingProvider[]> {
    return db.select().from(bankingProviders).where(eq(bankingProviders.vesselId, vesselId));
  }

  async getAllBankingProviders(): Promise<BankingProvider[]> {
    return db.select().from(bankingProviders);
  }

  async getActiveBankingProviders(): Promise<BankingProvider[]> {
    return db.select().from(bankingProviders).where(eq(bankingProviders.isActive, true));
  }

  async createBankingProvider(provider: InsertBankingProvider): Promise<BankingProvider> {
    const [newProvider] = await db.insert(bankingProviders).values(provider).returning();
    return newProvider;
  }

  async updateBankingProvider(id: number, updates: Partial<BankingProvider>): Promise<BankingProvider | undefined> {
    const [updatedProvider] = await db
      .update(bankingProviders)
      .set(updates)
      .where(eq(bankingProviders.id, id))
      .returning();
    return updatedProvider || undefined;
  }

  async deleteBankingProvider(id: number): Promise<boolean> {
    try {
      const result = await db.delete(bankingProviders).where(eq(bankingProviders.id, id));
      return result.rowCount ? result.rowCount > 0 : false;
    } catch (error) {
      console.error("Error deleting banking provider:", error);
      return false;
    }
  }

  // Bank Connection Operations
  async getBankConnection(id: number): Promise<BankConnection | undefined> {
    const [connection] = await db.select().from(bankConnections).where(eq(bankConnections.id, id));
    return connection || undefined;
  }

  async getBankConnectionsByVessel(vesselId: number): Promise<BankConnection[]> {
    return db.select().from(bankConnections).where(eq(bankConnections.vesselId, vesselId));
  }

  async getBankConnectionsByProvider(providerId: number): Promise<BankConnection[]> {
    return db.select().from(bankConnections).where(eq(bankConnections.providerId, providerId));
  }

  async getActiveBankConnections(vesselId: number): Promise<BankConnection[]> {
    return db
      .select()
      .from(bankConnections)
      .where(
        and(
          eq(bankConnections.vesselId, vesselId),
          eq(bankConnections.status, "active")
        )
      );
  }

  async createBankConnection(connection: InsertBankConnection): Promise<BankConnection> {
    const [newConnection] = await db.insert(bankConnections).values(connection).returning();
    return newConnection;
  }

  async updateBankConnection(id: number, updates: Partial<BankConnection>): Promise<BankConnection | undefined> {
    const [updatedConnection] = await db
      .update(bankConnections)
      .set(updates)
      .where(eq(bankConnections.id, id))
      .returning();
    return updatedConnection || undefined;
  }

  async deleteBankConnection(id: number): Promise<boolean> {
    try {
      const result = await db.delete(bankConnections).where(eq(bankConnections.id, id));
      return result.rowCount ? result.rowCount > 0 : false;
    } catch (error) {
      console.error("Error deleting bank connection:", error);
      return false;
    }
  }

  // Transaction Reconciliation Operations
  async getTransactionReconciliation(id: number): Promise<TransactionReconciliation | undefined> {
    const [reconciliation] = await db.select().from(transactionReconciliations).where(eq(transactionReconciliations.id, id));
    return reconciliation || undefined;
  }

  async getTransactionReconciliationByTransaction(transactionId: number): Promise<TransactionReconciliation | undefined> {
    const [reconciliation] = await db
      .select()
      .from(transactionReconciliations)
      .where(eq(transactionReconciliations.transactionId, transactionId));
    return reconciliation || undefined;
  }

  async getTransactionReconciliationByExpense(expenseId: number): Promise<TransactionReconciliation | undefined> {
    const [reconciliation] = await db
      .select()
      .from(transactionReconciliations)
      .where(eq(transactionReconciliations.expenseId, expenseId));
    return reconciliation || undefined;
  }

  async getUnmatchedTransactions(vesselId: number): Promise<Transaction[]> {
    // Get all transactions for the vessel
    const allTransactions = await db
      .select()
      .from(transactions)
      .where(eq(transactions.vesselId, vesselId));

    // Get all reconciled transaction IDs
    const reconciledTransactionIds = await db
      .select({ id: transactionReconciliations.transactionId })
      .from(transactionReconciliations);
    
    const reconciledIds = new Set(reconciledTransactionIds.map(r => r.id));
    
    // Filter transactions that are not in the reconciled set
    return allTransactions.filter(t => !reconciledIds.has(t.id));
  }

  async getMatchedTransactions(vesselId: number): Promise<Transaction[]> {
    // Join transactions with reconciliations to get matched transactions
    const result = await db
      .select({
        transaction: transactions,
      })
      .from(transactions)
      .innerJoin(
        transactionReconciliations,
        eq(transactions.id, transactionReconciliations.transactionId)
      )
      .where(eq(transactions.vesselId, vesselId));
    
    return result.map(r => r.transaction);
  }

  async createTransactionReconciliation(reconciliation: InsertTransactionReconciliation): Promise<TransactionReconciliation> {
    const [newReconciliation] = await db.insert(transactionReconciliations).values(reconciliation).returning();
    return newReconciliation;
  }

  async updateTransactionReconciliation(id: number, updates: Partial<TransactionReconciliation>): Promise<TransactionReconciliation | undefined> {
    const [updatedReconciliation] = await db
      .update(transactionReconciliations)
      .set(updates)
      .where(eq(transactionReconciliations.id, id))
      .returning();
    return updatedReconciliation || undefined;
  }

  async deleteTransactionReconciliation(id: number): Promise<boolean> {
    try {
      const result = await db.delete(transactionReconciliations).where(eq(transactionReconciliations.id, id));
      return result.rowCount ? result.rowCount > 0 : false;
    } catch (error) {
      console.error("Error deleting transaction reconciliation:", error);
      return false;
    }
  }
}