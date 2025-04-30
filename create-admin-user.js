// Create a script to add an admin user
import { storage } from "./server/storage.js";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

async function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const buf = await scryptAsync(password, salt, 64);
  return `${buf.toString("hex")}.${salt}`;
}

async function createAdminUser() {
  try {
    const existingUser = await storage.getUserByUsername('admin');
    if (existingUser) {
      console.log('Admin user already exists');
      return;
    }
    
    const hashedPassword = await hashPassword('admin123');
    const user = await storage.createUser({
      username: 'admin',
      password: hashedPassword,
      fullName: 'Administrator',
      role: 'admin',
      isActive: true
    });
    
    console.log('Admin user created successfully:', user);
  } catch (error) {
    console.error('Error creating admin user:', error);
  }
}

createAdminUser();