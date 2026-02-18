"""Post-processing using SAM, OpenCV, and Shapely."""
import cv2
import numpy as np
from PIL import Image
from typing import List, Dict, Any, Optional, Tuple
from shapely.geometry import Polygon
from shapely.ops import unary_union
import torch

from app.config import settings


class PostProcessor:
    """
    Post-processor for floor plan refinement.
    
    Performs:
    - Room boundary detection (SAM + watershed)
    - Wall extraction
    - Spatial validation
    - Metadata generation
    """
    
    def __init__(self, sam_model_path: Optional[str] = None):
        """
        Initialize post-processor.
        
        Args:
            sam_model_path: Path to SAM model weights
        """
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        
        # SAM initialization (optional, load on demand)
        self.sam = None
        self.sam_path = sam_model_path or settings.SAM_MODEL_PATH
        
        print(f"✅ Post-processor initialized (SAM will load on demand)")
    
    def _load_sam(self):
        """Load SAM model lazily."""
        if self.sam is not None:
            return
        
        try:
            from segment_anything import sam_model_registry, SamAutomaticMaskGenerator
            
            print(f"📦 Loading SAM from {self.sam_path}...")
            
            sam = sam_model_registry["vit_b"](checkpoint=self.sam_path)
            sam.to(self.device)
            
            self.sam = SamAutomaticMaskGenerator(
                model=sam,
                points_per_side=16,
                pred_iou_thresh=0.88,
                stability_score_thresh=0.92,
                min_mask_region_area=500
            )
            
            print(f"✅ SAM loaded on {self.device}")
        except Exception as e:
            print(f"⚠️  Could not load SAM: {e}")
            self.sam = None
    
    def process(self, floor_plan_image: Image.Image) -> Dict[str, Any]:
        """
        Complete post-processing pipeline.
        
        Args:
            floor_plan_image: Generated floor plan (PIL Image)
        
        Returns:
            Metadata dict with rooms, walls, validation scores
        """
        # Convert to numpy array
        image_np = np.array(floor_plan_image.convert("RGB"))
        
        # Step 1: Detect room boundaries
        room_polygons = self._detect_room_boundaries(image_np)
        
        # Step 2: Extract walls
        walls = self._extract_walls(image_np)
        
        # Step 3: Validate and clean
        room_polygons = self._validate_rooms(room_polygons)
        
        # Step 4: Generate metadata
        metadata = self._generate_metadata(
            image_np,
            room_polygons,
            walls
        )
        
        return metadata
    
    def _detect_room_boundaries(self, image: np.ndarray) -> List[np.ndarray]:
        """
        Detect room boundaries using watershed + optional SAM.
        
        Args:
            image: RGB image array
        
        Returns:
            List of room polygons (Nx2 arrays)
        """
        # Try watershed first (fast)
        polygons = self._watershed_segmentation(image)
        
        # If quality is poor, try SAM (slower but better)
        if len(polygons) < 2:  # Too few rooms detected
            self._load_sam()
            if self.sam:
                polygons = self._sam_segmentation(image)
        
        return polygons
    
    def _watershed_segmentation(self, image: np.ndarray) -> List[np.ndarray]:
        """Watershed-based room detection."""
        gray = cv2.cvtColor(image, cv2.COLOR_RGB2GRAY)
        _, binary = cv2.threshold(gray, 127, 255, cv2.THRESH_BINARY)
        
        # Morphological operations
        kernel = np.ones((3, 3), np.uint8)
        opening = cv2.morphologyEx(binary, cv2.MORPH_OPEN, kernel, iterations=2)
        
        # Distance transform
        dist_transform = cv2.distanceTransform(opening, cv2.DIST_L2, 5)
        _, sure_fg = cv2.threshold(dist_transform, 0.5 * dist_transform.max(), 255, 0)
        sure_fg = np.uint8(sure_fg)
        
        # Find unknown region
        sure_bg = cv2.dilate(opening, kernel, iterations=3)
        unknown = cv2.subtract(sure_bg, sure_fg)
        
        # Marker labelling
        _, markers = cv2.connectedComponents(sure_fg)
        markers = markers + 1
        markers[unknown == 255] = 0
        
        # Apply watershed
        markers = cv2.watershed(cv2.cvtColor(image, cv2.COLOR_RGB2BGR), markers)
        
        # Extract polygons
        polygons = []
        for label in range(2, markers.max() + 1):
            mask = np.uint8(markers == label) * 255
            contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
            
            if contours:
                contour = max(contours, key=cv2.contourArea)
                epsilon = 0.01 * cv2.arcLength(contour, True)
                approx = cv2.approxPolyDP(contour, epsilon, True)
                polygons.append(approx.reshape(-1, 2))
        
        return polygons
    
    def _sam_segmentation(self, image: np.ndarray) -> List[np.ndarray]:
        """SAM-based room detection."""
        if not self.sam:
            return []
        
        masks = self.sam.generate(image)
        masks = sorted(masks, key=lambda x: x['area'], reverse=True)
        
        polygons = []
        for mask_data in masks:
            mask = (mask_data['segmentation'] * 255).astype(np.uint8)
            contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
            
            if contours:
                contour = max(contours, key=cv2.contourArea)
                epsilon = 0.01 * cv2.arcLength(contour, True)
                approx = cv2.approxPolyDP(contour, epsilon, True)
                polygons.append(approx.reshape(-1, 2))
        
        return polygons
    
    def _extract_walls(self, image: np.ndarray) -> List[Dict[str, Any]]:
        """
        Extract wall segments using Hough transform.
        
        Args:
            image: RGB image array
        
        Returns:
            List of wall dicts with start, end, thickness
        """
        gray = cv2.cvtColor(image, cv2.COLOR_RGB2GRAY)
        _, binary = cv2.threshold(gray, 127, 255, cv2.THRESH_BINARY_INV)
        
        # Detect lines
        lines = cv2.HoughLinesP(
            binary,
            rho=1,
            theta=np.pi / 180,
            threshold=30,
            minLineLength=20,
            maxLineGap=10
        )
        
        walls = []
        if lines is not None:
            for line in lines:
                x1, y1, x2, y2 = line[0]
                walls.append({
                    'start': (int(x1), int(y1)),
                    'end': (int(x2), int(y2)),
                    'thickness': 5  # Default
                })
        
        return walls
    
    def _validate_rooms(self, polygons: List[np.ndarray]) -> List[np.ndarray]:
        """
        Validate and filter room polygons.
        
        Args:
            polygons: List of room polygons
        
        Returns:
            Filtered valid polygons
        """
        valid = []
        min_area = 500  # Minimum area in pixels
        
        for poly in polygons:
            shapely_poly = Polygon(poly)
            
            # Check minimum area
            if shapely_poly.area < min_area:
                continue
            
            # Check validity
            if not shapely_poly.is_valid:
                continue
            
            valid.append(poly)
        
        return valid
    
    def _generate_metadata(
        self,
        image: np.ndarray,
        room_polygons: List[np.ndarray],
        walls: List[Dict[str, Any]],
        scale_factor: float = 2.0
    ) -> Dict[str, Any]:
        """
        Generate structured metadata.
        
        Args:
            image: RGB image
            room_polygons: List of room polygons
            walls: List of walls
            scale_factor: Pixels to feet conversion
        
        Returns:
            Complete metadata dict
        """
        import uuid
        
        metadata = {
            "floor_plan_id": str(uuid.uuid4()),
            "image_size": list(image.shape[:2]),
            "scale_factor": scale_factor,
            "total_area_sqft": 0,
            "rooms": [],
            "walls": [],
            "validation": {}
        }
        
        # Process rooms
        for i, poly in enumerate(room_polygons):
            shapely_poly = Polygon(poly)
            
            room = {
                "id": i + 1,
                "type": "room",  # TODO: Classify room type
                "polygon": poly.tolist(),
                "centroid": list(shapely_poly.centroid.coords[0]),
                "area_pixels": int(shapely_poly.area),
                "area_sqft": int(shapely_poly.area * (scale_factor ** 2)),
                "perimeter_pixels": int(shapely_poly.length),
                "bounding_box": list(shapely_poly.bounds),
                "convexity": round(shapely_poly.area / shapely_poly.convex_hull.area, 2)
            }
            
            metadata["rooms"].append(room)
            metadata["total_area_sqft"] += room["area_sqft"]
        
        # Process walls
        for i, wall in enumerate(walls):
            length_pixels = np.linalg.norm(
                np.array(wall['end']) - np.array(wall['start'])
            )
            
            metadata["walls"].append({
                "id": i + 1,
                "start": wall['start'],
                "end": wall['end'],
                "length_pixels": int(length_pixels),
                "length_feet": int(length_pixels * scale_factor),
                "thickness_pixels": wall['thickness']
            })
        
        # Validation scores
        metadata["validation"] = {
            "spatial_consistency_score": 0.85,  # TODO: Calculate
            "structural_validity_score": 0.90,  # TODO: Calculate
            "issues": []
        }
        
        return metadata
