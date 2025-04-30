import { scrypt, timingSafeEqual } from 'crypto';
import { promisify } from 'util';

const scryptAsync = promisify(scrypt);

async function comparePasswords(supplied, stored) {
  console.log(`Comparing passwords: supplied=${supplied}, stored=${stored}`);
  
  // Handle plaintext passwords for demo/development
  if (!stored.includes('.')) {
    console.log(`Using plaintext comparison: ${supplied === stored}`);
    return supplied === stored;
  }
  
  // Handle hashed passwords
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = await scryptAsync(supplied, salt, 64);
  const result = timingSafeEqual(hashedBuf, suppliedBuf);
  console.log(`Using hash comparison: ${result}`);
  return result;
}

// Test with the stored hash from the database
async function testLogin() {
  const storedPassword = 'fc78e95a7366038bc4ddac35f5ffb704952eb3f0da917bf169e41bb95dbee0dab2d6e7fe6c888093e4f15708e6b0f14a9708c44b352eb2ec31b02639b97e62ff.eca431f7ec8b09deea6334403d42ee45';
  const suppliedPassword = 'admin123';
  
  try {
    const result = await comparePasswords(suppliedPassword, storedPassword);
    console.log(`Authentication result: ${result}`);
  } catch (error) {
    console.error('Error testing authentication:', error);
  }
}

testLogin();