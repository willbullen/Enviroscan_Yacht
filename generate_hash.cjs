// Script to generate a password hash for testing
const { scrypt, randomBytes } = require("crypto");
const { promisify } = require("util");

const scryptAsync = promisify(scrypt);

async function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const buf = await scryptAsync(password, salt, 64);
  return `${buf.toString("hex")}.${salt}`;
}

async function generateHash() {
  const password = "admin123";
  const hashedPassword = await hashPassword(password);
  console.log(`Password: ${password}`);
  console.log(`Hashed password: ${hashedPassword}`);
}

generateHash();