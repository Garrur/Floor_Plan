import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text, Grid } from '@react-three/drei';
import { RoomMetadata } from '@/types/api';
import * as THREE from 'three';

const ROOM_COLORS: Record<string, string> = {
  bedroom: '#6b8cae',
  bathroom: '#7aadba',
  kitchen: '#c8956c',
  living: '#a3b18a',
  hall: '#b8a9c9',
  dining: '#d4a574',
  balcony: '#8fb996',
  corridor: '#9e9e9e',
  default: '#888888',
};

function getRoomColor(type: string): string {
  const lower = type.toLowerCase();
  for (const [key, color] of Object.entries(ROOM_COLORS)) {
    if (lower.includes(key)) return color;
  }
  return ROOM_COLORS.default;
}

// Convert room polygon array to THREE.Shape
function createRoomShape(room: RoomMetadata) {
  const shape = new THREE.Shape();
  
  if (room.polygon && room.polygon.length > 2) {
    // We have actual polygon data
    const points = room.polygon.map(p => new THREE.Vector2(p[0] * 0.05, p[1] * 0.05)); // Scale down pixel coords to 3D world units
    shape.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      shape.lineTo(points[i].x, points[i].y);
    }
    shape.lineTo(points[0].x, points[0].y); // Close path
  } else {
    // Fallback: create a rectangle from dimensions or area
    const width = room.dimensions?.width_ft || Math.sqrt(room.area_sqft);
    const length = room.dimensions?.length_ft || room.area_sqft / width;
    shape.moveTo(0, 0);
    shape.lineTo(width, 0);
    shape.lineTo(width, length);
    shape.lineTo(0, length);
    shape.lineTo(0, 0);
  }
  return shape;
}

// Calculate bounding box and centroid of the shape for labeling
function getShapeMetrics(shape: THREE.Shape) {
  const points = shape.getPoints();
  const box = new THREE.Box2().setFromPoints(points);
  const center = new THREE.Vector2();
  box.getCenter(center);
  return { center, size: box.getSize(new THREE.Vector2()) };
}

function Room({ room, offset }: { room: RoomMetadata, offset: THREE.Vector3 }) {
  const color = getRoomColor(room.type);
  const wallHeight = 8;
  
  // Create shape once
  const shape = useMemo(() => createRoomShape(room), [room]);
  const metrics = useMemo(() => getShapeMetrics(shape), [shape]);

  const extrudeSettings = {
    depth: wallHeight,
    bevelEnabled: false,
  };

  return (
    <group position={[offset.x, 0, offset.z]}>
      {/* Floor Base */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <shapeGeometry args={[shape]} />
        <meshStandardMaterial color={color} opacity={0.6} transparent />
      </mesh>

      {/* Extruded Walls */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} castShadow receiveShadow>
        <extrudeGeometry args={[shape, extrudeSettings]} />
        <meshStandardMaterial color={color} opacity={0.3} transparent />
        <lineSegments>
          <edgesGeometry args={[new THREE.ExtrudeGeometry(shape, extrudeSettings)]} />
          <lineBasicMaterial color={color} linewidth={2} opacity={0.8} transparent />
        </lineSegments>
      </mesh>

      {/* Room labels hovering slightly above walls */}
      <Text
        position={[metrics.center.x, wallHeight + 0.5, -metrics.center.y]}
        rotation={[-Math.PI / 2, 0, 0]}
        fontSize={Math.max(1, Math.min(metrics.size.x, metrics.size.y) * 0.15)}
        color="#e8e4de"
        anchorX="center"
        anchorY="middle"
      >
        {room.type}
      </Text>
      
      <Text
        position={[metrics.center.x, wallHeight + 0.5, -metrics.center.y + (Math.max(1, Math.min(metrics.size.x, metrics.size.y) * 0.2))]}
        rotation={[-Math.PI / 2, 0, 0]}
        fontSize={Math.max(0.6, Math.min(metrics.size.x, metrics.size.y) * 0.1)}
        color="#706b63"
        anchorX="center"
        anchorY="middle"
      >
        {room.area_sqft} sq ft
      </Text>
    </group>
  );
}

function RotatingGroup({ children }: { children: React.ReactNode }) {
  const groupRef = useRef<THREE.Group>(null);
  
  useFrame((_, delta) => {
    if (groupRef.current) {
      // Very slow subtle rotation
      groupRef.current.rotation.y += delta * 0.02;
    }
  });
  
  return <group ref={groupRef}>{children}</group>;
}

interface FloorPlan3DProps {
  rooms: RoomMetadata[];
}

export function FloorPlan3D({ rooms }: FloorPlan3DProps) {
  // Calculate center offset for the entire layout
  const offset = useMemo(() => {
    if (!rooms || rooms.length === 0) return new THREE.Vector3(0, 0, 0);
    
    const boundingBox = new THREE.Box2();
    let hasPolygons = false;
    
    rooms.forEach(room => {
      if (room.polygon && room.polygon.length > 0) {
        hasPolygons = true;
        room.polygon.forEach(p => {
          boundingBox.expandByPoint(new THREE.Vector2(p[0] * 0.05, p[1] * 0.05));
        });
      }
    });
    
    if (hasPolygons) {
      const center = new THREE.Vector2();
      boundingBox.getCenter(center);
      // We flip Y to Z because usually 2D Y goes down, 3D Z goes forward/back
      return new THREE.Vector3(-center.x, 0, center.y);
    }
    
    // Grid fallback if no polygons (just for backward compat with old mock logic)
    return new THREE.Vector3(-15, 0, -15); 
  }, [rooms]);

  // Determine overall bounds for the foundation plane
  const maxDimension = useMemo(() => {
    if (!rooms || rooms.length === 0) return 50;
    
    const boundingBox = new THREE.Box2();
    let hasPolygons = false;
    
    rooms.forEach(room => {
      if (room.polygon && room.polygon.length > 0) {
        hasPolygons = true;
        room.polygon.forEach(p => {
          boundingBox.expandByPoint(new THREE.Vector2(p[0] * 0.05, p[1] * 0.05));
        });
      }
    });
    
    if (hasPolygons) {
      const size = new THREE.Vector2();
      boundingBox.getSize(size);
      return Math.max(size.x, size.y) + 10; // Add padding
    }
    return 50;
  }, [rooms]);

  return (
    <div className="h-[500px] bg-[var(--c-bg)] border border-[var(--c-border)] relative">
      <Canvas
        camera={{ position: [0, maxDimension * 0.8, maxDimension], fov: 45 }}
        style={{ background: '#0a0a0a' }}
        shadows
      >
        <ambientLight intensity={0.5} />
        <directionalLight 
          position={[maxDimension, maxDimension, maxDimension]} 
          intensity={1.2} 
          castShadow 
          shadow-mapSize={[1024, 1024]}
        />
        <pointLight position={[-maxDimension/2, maxDimension/2, -maxDimension/2]} intensity={0.4} color="#c8956c" />

        <RotatingGroup>
          {/* Main layout container */}
          <group>
            {/* Foundation / Plot plane */}
            <mesh position={[0, -0.1, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
              <planeGeometry args={[maxDimension * 2, maxDimension * 2]} />
              <meshStandardMaterial color="#111111" />
            </mesh>

            {/* If no polygons, we add artificial spreading to prevent overlap of fallback rectangles */}
            {rooms.map((room, i) => {
               // Fallback spreading if using the width/length fallback
               let roomOffset = new THREE.Vector3(offset.x, offset.y, offset.z);
               if (!room.polygon || room.polygon.length === 0) {
                 const cols = 3;
                 const row = Math.floor(i / cols);
                 const col = i % cols;
                 const width = room.dimensions?.width_ft || Math.sqrt(room.area_sqft);
                 const length = room.dimensions?.length_ft || room.area_sqft / width;
                 const gap = 2;
                 roomOffset = new THREE.Vector3(
                   offset.x + col * (width + gap),
                   0,
                   offset.z + row * (length + gap)
                 );
               }
               // Calculate vertical offset based on floor
               const wallHeight = 8;
               const floorIndex = room.floor ? room.floor - 1 : 0;
               roomOffset.y = floorIndex * wallHeight;

               return <Room key={i} room={room} offset={roomOffset} />;
            })}
          </group>
        </RotatingGroup>

        <Grid
          args={[maxDimension * 2, maxDimension * 2]}
          cellSize={1}
          cellThickness={0.5}
          cellColor="#1c1c1c"
          sectionSize={5}
          sectionThickness={1}
          sectionColor="#2a2a2a"
          fadeDistance={maxDimension * 1.5}
          position={[0, -0.09, 0]}
        />

        <OrbitControls
          enableDamping
          dampingFactor={0.05}
          minDistance={10}
          maxDistance={maxDimension * 2.5}
          maxPolarAngle={Math.PI / 2.05} // Keep camera slightly above ground
        />
      </Canvas>

      {/* HUD overlay */}
      <div className="absolute bottom-4 left-4 flex items-center gap-3 pointer-events-none">
        <span className="label-sm text-[var(--c-text-muted)] tracking-widest bg-[#0a0a0a]/80 px-2 py-1">
          DRAG TO ROTATE · SCROLL TO ZOOM
        </span>
      </div>

      {/* Room legend */}
      <div className="absolute top-4 right-4 flex flex-col gap-1.5 bg-[#0a0a0a]/80 p-3 border border-[var(--c-border)]">
        {rooms.slice(0, 8).map((room, i) => (
          <div key={i} className="flex items-center gap-2">
            <div 
              className="w-2.5 h-2.5 shadow-[0_0_8px_rgba(0,0,0,0.5)]" 
              style={{ backgroundColor: getRoomColor(room.type) }} 
            />
            <span className="text-[9px] text-[var(--c-text-dim)] tracking-wider uppercase">
              {room.type}
            </span>
          </div>
        ))}
        {rooms.length > 8 && (
          <div className="text-[9px] text-[var(--c-text-muted)] tracking-wider pl-4 pt-1">
            + {rooms.length - 8} MORE
          </div>
        )}
      </div>
    </div>
  );
}
