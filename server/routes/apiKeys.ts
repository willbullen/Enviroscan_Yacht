import { Router } from 'express';

export function setupApiKeysRoutes(router: Router) {
  router.get('/config/windy-keys', (req, res) => {
    // For development, we'll allow access to the keys without authentication
    // In production, this should be secured
    console.log('Windy keys endpoint hit, authentication status:', req.isAuthenticated());

    // Check if the WINDY_MAP_FORECAST_KEY is available
    if (!process.env.WINDY_MAP_FORECAST_KEY) {
      console.error('WINDY_MAP_FORECAST_KEY is not set in environment variables');
      return res.status(500).json({
        error: 'API key not configured on server'
      });
    }
    
    // Return the API keys for Windy
    console.log('Returning Windy API keys');
    res.json({
      WINDY_MAP_FORECAST_KEY: process.env.WINDY_MAP_FORECAST_KEY,
      WINDY_PLUGIN_KEY: process.env.WINDY_PLUGIN_KEY
    });
  });
}