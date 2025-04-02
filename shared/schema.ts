import { pgTable, text, serial, integer, boolean, timestamp, real, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User model for authentication
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  fullName: text("full_name").notNull(),
  role: text("role").notNull(),
  avatarUrl: text("avatar_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Equipment model for yacht components
export const equipment = pgTable("equipment", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category").notNull(), // mechanical, electrical, navigation, safety
  model: text("model").notNull(),
  manufacturer: text("manufacturer").notNull(),
  serialNumber: text("serial_number"),
  installationDate: timestamp("installation_date"),
  runtime: real("runtime").default(0), // in hours
  lastServiceDate: timestamp("last_service_date"),
  nextServiceDate: timestamp("next_service_date"),
  nextServiceHours: real("next_service_hours"),
  notes: text("notes"),
  status: text("status").notNull(), // operational, maintenance_required, non_operational
  location: text("location"), // where on the yacht
  specifications: json("specifications"),
  manualUrl: text("manual_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertEquipmentSchema = createInsertSchema(equipment).omit({ id: true, createdAt: true });
export type InsertEquipment = z.infer<typeof insertEquipmentSchema>;
export type Equipment = typeof equipment.$inferSelect;

// Maintenance tasks model
export const maintenanceTasks = pgTable("maintenance_tasks", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  equipmentId: integer("equipment_id").references(() => equipment.id),
  priority: text("priority").notNull(), // high, medium, low
  status: text("status").notNull(), // due, upcoming, completed, in_progress
  dueDate: timestamp("due_date").notNull(),
  assignedToId: integer("assigned_to_id").references(() => users.id),
  completedById: integer("completed_by_id").references(() => users.id),
  completedAt: timestamp("completed_at"),
  procedure: json("procedure"), // step by step instructions
  estimatedDuration: integer("estimated_duration"), // in minutes
  actualDuration: integer("actual_duration"), // in minutes
  notes: text("notes"),
  createdById: integer("created_by_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertMaintenanceTaskSchema = createInsertSchema(maintenanceTasks).omit({ 
  id: true, 
  completedAt: true, 
  createdAt: true 
});
export type InsertMaintenanceTask = z.infer<typeof insertMaintenanceTaskSchema>;
export type MaintenanceTask = typeof maintenanceTasks.$inferSelect;

// Inventory items model
export const inventoryItems = pgTable("inventory_items", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  description: text("description"),
  quantity: integer("quantity").notNull().default(0),
  unit: text("unit").notNull(), // liters, units, pcs, etc.
  minQuantity: integer("min_quantity").notNull(), // reorder point
  location: text("location"),
  partNumber: text("part_number"),
  supplier: text("supplier"),
  cost: real("cost"),
  lastRestockDate: timestamp("last_restock_date"),
  compatibleEquipmentIds: json("compatible_equipment_ids"), // array of equipment IDs
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertInventoryItemSchema = createInsertSchema(inventoryItems).omit({ id: true, createdAt: true });
export type InsertInventoryItem = z.infer<typeof insertInventoryItemSchema>;
export type InventoryItem = typeof inventoryItems.$inferSelect;

// Activity log model
export const activityLogs = pgTable("activity_logs", {
  id: serial("id").primaryKey(),
  activityType: text("activity_type").notNull(), // task_completed, inventory_updated, etc.
  description: text("description").notNull(),
  userId: integer("user_id").references(() => users.id),
  relatedEntityType: text("related_entity_type"), // equipment, task, inventory
  relatedEntityId: integer("related_entity_id"),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  metadata: json("metadata"),
});

export const insertActivityLogSchema = createInsertSchema(activityLogs).omit({ id: true, timestamp: true });
export type InsertActivityLog = z.infer<typeof insertActivityLogSchema>;
export type ActivityLog = typeof activityLogs.$inferSelect;
