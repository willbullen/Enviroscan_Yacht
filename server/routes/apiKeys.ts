import { Router } from 'express';

export function setupApiKeysRoutes(router: Router) {
  router.get('/config/windy-keys', (req, res) => {
    // Only return the keys to authenticated users
    if (!req.isAuthenticated()) {
      return res.status(401).json({
        error: 'Authentication required. Please log in.'
      });
    }
    
    // Return the API keys for Windy
    res.json({
      WINDY_MAP_FORECAST_KEY: process.env.WINDY_MAP_FORECAST_KEY,
      WINDY_PLUGIN_KEY: process.env.WINDY_PLUGIN_KEY
    });
  });
}