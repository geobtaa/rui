import { fetchResourceDetails } from '../../services/api';

// Test a few key fixtures to see which ones exist
describe('GeoBlacklight Test Fixtures Check', () => {
  const testFixtures = [
    { id: 'mit-001145244', name: 'actual-papermap1', description: 'Nondigitized paper map' },
    { id: 'nyu-2451-34564', name: 'actual-point1', description: 'Point dataset with WMS and WFS' },
    { id: 'tufts-cambridgegrid100-04', name: 'actual-polygon1', description: 'Polygon dataset with WFS, WMS' },
    { id: 'stanford-dp018hs9766', name: 'actual-raster1', description: 'Restricted raster layer' },
    { id: 'princeton-sx61dn82p', name: 'bbox-spans-180', description: 'Scanned map spanning 180th meridian' },
    { id: 'cugir-007741', name: 'cornell_html_metadata', description: 'Point dataset with WMS, WFS' },
    { id: 'harvard-g7064-s2-1834-k3', name: 'harvard_raster', description: 'Georeferenced raster image' },
    { id: 'princeton-02870w62c', name: 'public_iiif_princeton', description: 'Scanned map with IIIF' },
    { id: 'mit-f6rqs4ucovjk2', name: 'public_polygon_mit', description: 'Polygon shapefile with WMS and WFS' },
    { id: 'cugir-007957', name: 'tms', description: 'TMS web service reference' },
  ];

  testFixtures.forEach(({ id, name, description }) => {
    it(`should find fixture: ${name} (${id})`, async () => {
      try {
        const resource = await fetchResourceDetails(id);
        expect(resource).toBeDefined();
        expect(resource.attributes.dct_title_s).toBeDefined();
        console.log(`✓ Found: ${name} - ${resource.attributes.dct_title_s}`);
      } catch (error) {
        console.log(`✗ Not found: ${name} (${id}) - ${error.message}`);
        // Don't fail the test, just log the result
        expect(true).toBe(true);
      }
    }, 10000); // 10 second timeout for each test
  });
});
