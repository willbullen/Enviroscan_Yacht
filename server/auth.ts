import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser } from "@shared/schema";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  // Handle plaintext passwords for demo/development
  if (!stored.includes('.')) {
    return supplied === stored;
  }
  
  // Handle hashed passwords
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export function setupAuth(app: Express) {
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "eastwind-yacht-management-secret",
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24 * 7, // 1 week
      secure: process.env.NODE_ENV === "production",
    }
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        if (!user || !(await comparePasswords(password, user.password))) {
          return done(null, false, { message: "Invalid username or password" });
        }
        // Note: isActive field doesn't exist in the DB but is added by the storage layer
        // Since we're adding it virtually in the storage layer and defaulting to true,
        // we can just check it directly
        if (user.isActive === false) {
          return done(null, false, { message: "Account is inactive" });
        }
        return done(null, user);
      } catch (err) {
        console.error("Authentication error:", err);
        return done(err);
      }
    }),
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      // If user is deleted, logout
      if (!user) {
        return done(null, false);
      }
      // Note: isActive field is added by storage layer with default true
      if (user.isActive === false) {
        return done(null, false);
      }
      done(null, user);
    } catch (err) {
      console.error(`Error deserializing user ${id}`);
      done(err, null);
    }
  });

  app.post("/api/register", async (req, res, next) => {
    try {
      // Only admins can register new users
      if (req.isAuthenticated() && req.user.role === "admin") {
        const existingUser = await storage.getUserByUsername(req.body.username);
        if (existingUser) {
          return res.status(400).json({ error: "Username already exists" });
        }

        const hashedPassword = await hashPassword(req.body.password);
        const user = await storage.createUser({
          ...req.body,
          password: hashedPassword,
          isActive: true
        });

        res.status(201).json({ 
          id: user.id, 
          username: user.username, 
          fullName: user.fullName,
          email: user.email,
          role: user.role,
          isActive: user.isActive,
          avatarUrl: user.avatarUrl
        });
      } else {
        res.status(403).json({ error: "Only admins can register new users" });
      }
    } catch (err) {
      next(err);
    }
  });

  // Handle both /api/login (old) and /api/auth/login (new) endpoints for backwards compatibility
  const loginHandler = (req: any, res: any, next: any) => {
    passport.authenticate("local", (err: Error | null, user: Express.User | false, info: { message: string } | undefined) => {
      if (err) {
        return next(err);
      }
      if (!user) {
        return res.status(401).json({ error: info?.message || "Invalid username or password" });
      }
      req.login(user, (loginErr) => {
        if (loginErr) {
          return next(loginErr);
        }
        
        // Create response with all fields (including virtual ones)
        const userResponse = {
          id: user.id,
          username: user.username,
          fullName: user.fullName,
          role: user.role,
          email: user.email || null,
          avatarUrl: user.avatarUrl,
          isActive: user.isActive === false ? false : true
        };
        
        return res.status(200).json(userResponse);
      });
    })(req, res, next);
  };
  
  app.post("/api/login", loginHandler);
  app.post("/api/auth/login", loginHandler);

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Authentication required. Please log in." });
    }
    
    // Extract user data and remove sensitive information
    const user = req.user as SelectUser;
    const { password, ...safeUserData } = user;
    
    res.json(safeUserData);
  });

  // Get user's vessel assignments
  app.get("/api/user/vessels", async (req, res, next) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    
    try {
      const assignments = await storage.getUserVesselAssignments(req.user.id);
      res.json(assignments);
    } catch (err) {
      next(err);
    }
  });
}