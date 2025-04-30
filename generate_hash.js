import crypto from 'crypto';

async function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  return new Promise((resolve, reject) => {
    crypto.scrypt(password, salt, 64, (err, derivedKey) => {
      if (err) reject(err);
      resolve(`${derivedKey.toString('hex')}.${salt}`);
    });
  });
}

// Generate a hash for 'admin123'
hashPassword('admin123').then(hash => {
  console.log(`Hashed password: ${hash}`);
}).catch(err => {
  console.error(`Error: ${err}`);
});