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
  type InsertCrewDocument
} from "@shared/schema";
import { IStorage } from "./storage";
import { db } from "./db";
import { and, eq, lte, gte, sql } from "drizzle-orm";

export class DatabaseStorage implements IStorage {
  // =========== User Methods =============
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async getAllUsers(): Promise<User[]> {
    return db.select().from(users);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUser(id: number, updates: Partial<InsertUser>): Promise<User> {
    const [updatedUser] = await db
      .update(users)
      .set(updates)
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
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
          console.log(`Task ${task.id} - Due: ${dueDate.toISOString()} - In range: ${isInRange}`);
          return isInRange;
        });
        
        console.log(`Found ${upcomingTasks.length} upcoming tasks within the next 30 days`);
        console.log("Task list:", JSON.stringify(upcomingTasks, null, 2));
        
        return upcomingTasks;
      } catch (queryError) {
        console.error("Error executing query:", queryError);
        throw queryError; // Re-throw to be caught by outer catch
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
    const [updatedTask] = await db
      .update(maintenanceTasks)
      .set(updates)
      .where(eq(maintenanceTasks.id, id))
      .returning();
    return updatedTask;
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

  async deleteMaintenanceHistory(id: number): Promise<void> {
    await db.delete(maintenanceHistory).where(eq(maintenanceHistory.id, id));
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
    const [record] = await db.insert(predictiveMaintenance).values({
      ...insertPM,
      lastUpdated: new Date(),
      reasoningFactors: insertPM.reasoningFactors || {},
      predictedDate: insertPM.predictedDate || null,
      predictedRuntime: insertPM.predictedRuntime || null,
      confidence: insertPM.confidence || null,
      recommendations: insertPM.recommendations || null,
      historyDataPoints: insertPM.historyDataPoints || null
    }).returning();
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

  async deletePredictiveMaintenance(id: number): Promise<void> {
    await db.delete(predictiveMaintenance).where(eq(predictiveMaintenance.id, id));
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

  async deleteIsmDocument(id: number): Promise<void> {
    await db.delete(ismDocuments).where(eq(ismDocuments.id, id));
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

  async deleteIsmAudit(id: number): Promise<void> {
    await db.delete(ismAudits).where(eq(ismAudits.id, id));
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

  async deleteIsmTraining(id: number): Promise<void> {
    await db.delete(ismTraining).where(eq(ismTraining.id, id));
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

  async deleteIsmIncident(id: number): Promise<void> {
    await db.delete(ismIncidents).where(eq(ismIncidents.id, id));
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

  async deleteCrewMember(id: number): Promise<void> {
    await db.delete(crewMembers).where(eq(crewMembers.id, id));
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

  async deleteCrewDocument(id: number): Promise<void> {
    await db.delete(crewDocuments).where(eq(crewDocuments.id, id));
  }
}