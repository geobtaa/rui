import express from 'express';
import { WmsLayer } from '../services/WmsLayer';

const router = express.Router();

router.post('/handle', async (req, res) => {
  try {
    const wmsLayer = new WmsLayer(req.body);
    const featureInfo = await wmsLayer.getFeatureInfo();
    
    if ('error' in featureInfo) {
      res.status(500).json(featureInfo);
    } else {
      res.json(featureInfo);
    }
  } catch (error) {
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Failed to fetch WMS feature info' 
    });
  }
});

export default router; 