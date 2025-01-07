import express from 'express';
import cors from 'cors';
import { WmsLayer } from '../src/services/WmsLayer';

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// WMS Feature Info endpoint
app.post('/wms/handle', async (req, res) => {
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

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
}); 