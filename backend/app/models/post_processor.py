"""Post-processing using SAM, OpenCV, and Shapely."""
import cv2
import numpy as np
from PIL import Image
from typing import List, Dict, Any, Optional, Tuple
from shapely.geometry import Polygon, Point
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
    
    def process(self, floor_plan_image: Image.Image, num_floors: int = 1) -> Dict[str, Any]:
        """
        Complete post-processing pipeline.
        
        Args:
            floor_plan_image: Generated floor plan (PIL Image)
            num_floors: Number of floors to generate logic for
        
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
            walls,
            num_floors=num_floors
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

    def _generate_furniture_for_room(self, room_type: str, shapely_poly: Polygon, scale_factor: float) -> List[Dict[str, Any]]:
        import uuid
        furniture = []
        bounds = shapely_poly.bounds  # minx, miny, maxx, maxy
        minx, miny, maxx, maxy = bounds
        width_px = maxx - minx
        length_px = maxy - miny
        
        # Center of the bounding box
        cx = minx + width_px / 2
        cy = miny + length_px / 2

        rtype = room_type.lower()
        
        def add_item(ftype, w_ft, l_ft, x_px, y_px, rot):
            if shapely_poly.contains(Point(x_px, y_px)):
                furniture.append({
                    "id": str(uuid.uuid4()),
                    "type": ftype,
                    "width": w_ft / scale_factor,
                    "length": l_ft / scale_factor,
                    "x": x_px,
                    "y": y_px,
                    "rotation": rot
                })
        
        if "bed" in rtype:
            # Bed (approx 5x6.5 ft)
            bw, bl = 5.0, 6.5
            bed_x = cx
            bed_y = miny + (bl / scale_factor) / 2 + 2
            add_item("bed", bw, bl, bed_x, bed_y, 0)
            
            # Nightstand (1.5x1.5 ft)
            nw, nl = 1.5, 1.5
            add_item("nightstand", nw, nl, bed_x - (bw / scale_factor)/2 - (nw / scale_factor)/2 - 1, bed_y - (bl/scale_factor)/2 + (nl/scale_factor)/2, 0)
            add_item("nightstand", nw, nl, bed_x + (bw / scale_factor)/2 + (nw / scale_factor)/2 + 1, bed_y - (bl/scale_factor)/2 + (nl/scale_factor)/2, 0)

        elif "living" in rtype:
            # Sofa (7x3 ft)
            sw, sl = 7.0, 3.0
            sofa_x = cx
            sofa_y = maxy - (sl / scale_factor) / 2 - 5
            add_item("sofa", sw, sl, sofa_x, sofa_y, 180)
            
            # Rug (8x10 ft)
            rw, rl = 8.0, 10.0
            add_item("rug", rw, rl, cx, sofa_y - (sl/scale_factor)/2 - (rl/scale_factor)/2 + 2, 0)
            
            # TV Stand (4x1.5 ft)
            tw, tl = 4.0, 1.5
            add_item("tv_stand", tw, tl, cx, miny + (tl / scale_factor) / 2 + 2, 0)

        elif "bath" in rtype:
            # Toilet (1.5x2 ft)
            tw, tl = 1.5, 2.0
            add_item("toilet", tw, tl, minx + (tw/scale_factor)/2 + 3, miny + (tl/scale_factor)/2 + 3, 0)
            
            # Tub (2.5x5 ft)
            tubw, tubl = 2.5, 5.0
            add_item("tub", tubw, tubl, maxx - (tubw/scale_factor)/2 - 2, maxy - (tubl/scale_factor)/2 - 2, 0)

        elif "kitchen" in rtype or "dining" in rtype:
            if "dining" in rtype or shapely_poly.area * (scale_factor**2) > 200:
                add_item("dining_table", 6.0, 3.0, cx, cy, 0)
            else:
                add_item("island", 4.0, 2.5, cx, cy, 0)

        return furniture
    
    def _generate_metadata(
        self,
        image: np.ndarray,
        room_polygons: List[np.ndarray],
        walls: List[Dict[str, Any]],
        scale_factor: float = 2.0,
        num_floors: int = 1
    ) -> Dict[str, Any]:
        """
        Generate structured metadata.
        
        Args:
            image: RGB image
            room_polygons: List of room polygons
            walls: List of walls
            scale_factor: Pixels to feet conversion
            num_floors: Number of floors to duplicate and stack
        
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
        
        # Process rooms across floors
        global_room_id = 1
        for floor_idx in range(1, num_floors + 1):
            for i, poly in enumerate(room_polygons):
                shapely_poly = Polygon(poly)
                
                room_type = "room" # TODO: Classify room type
                
                # Temporary mock room type classification based on size for demo purposes
                if shapely_poly.area * (scale_factor ** 2) > 400:
                    room_type = "Living Room"
                elif shapely_poly.area * (scale_factor ** 2) > 150:
                    room_type = "Bedroom"
                else:
                    room_type = "Bathroom"

                room = {
                    "id": global_room_id,
                    "floor": floor_idx,
                    "type": room_type,
                    "polygon": poly.tolist(),
                    "centroid": list(shapely_poly.centroid.coords[0]),
                    "area_pixels": int(shapely_poly.area),
                    "area_sqft": int(shapely_poly.area * (scale_factor ** 2)),
                    "perimeter_pixels": int(shapely_poly.length),
                    "bounding_box": list(shapely_poly.bounds),
                    "convexity": round(shapely_poly.area / shapely_poly.convex_hull.area, 2),
                    "insights": [],
                    "furniture": self._generate_furniture_for_room(room_type, shapely_poly, scale_factor)
                }

                # Generate Insights
                sqft = room["area_sqft"]
                rtype = room["type"].lower()

                if "living" in rtype:
                    if sqft > 300:
                        room["insights"].append("Large space: Consider floating your furniture away from the walls to create a more intimate seating area.")
                        room["insights"].append("Add a large central rug (at least 8x10) to anchor the open room.")
                    else:
                        room["insights"].append("Use a sectional sofa against the longest wall to maximize floor space.")
                elif "bed" in rtype:
                    if sqft > 200:
                        room["insights"].append("Spacious primary suite: You have room for a king-size bed and a dedicated seating or reading nook by the window.")
                    else:
                        room["insights"].append("Opt for a queen-size bed centered on the main wall with two slim nightstands.")
                        room["insights"].append("Consider wall-sconces instead of table lamps to save surface space.")
                elif "bath" in rtype:
                    room["insights"].append("Consider a large, unframed mirror to bounce light and make the space feel larger.")
                    if sqft > 80:
                        room["insights"].append("You have sufficient space for a double vanity or a freestanding soaking tub.")
                    else:
                        room["insights"].append("Use a glass walk-in shower enclosure to keep sightlines open.")
                
                # Universal insight based on geometric convexity
                if room["convexity"] < 0.75:
                    room["insights"].append("This room has a unique, non-rectangular shape. Use custom built-in shelving or a corner desk in the alcove.")

                metadata["rooms"].append(room)
                metadata["total_area_sqft"] += room["area_sqft"]
                global_room_id += 1
        
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
