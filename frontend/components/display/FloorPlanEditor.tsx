import { useState, useEffect, useRef } from 'react';
import { Stage, Layer, Line, Circle, Text, Group } from 'react-konva';
import { FloorPlanMetadata, RoomMetadata } from '@/types/api';
import { Furniture } from './Furniture';

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

// Calculate area of a polygon using the Shoelace formula
function calculatePolygonArea(points: number[]): number {
  let area = 0;
  let j = points.length - 2;
  
  for (let i = 0; i < points.length; i += 2) {
    area += (points[j] + points[i]) * (points[j + 1] - points[i + 1]);
    j = i;
  }
  return Math.abs(area / 2);
}

// Convert flattened array [x1, y1, x2, y2] to nested array [[x1, y1], [x2, y2]]
function unflattenPoints(points: number[]): number[][] {
  const result: number[][] = [];
  for (let i = 0; i < points.length; i += 2) {
    result.push([points[i], points[i+1]]);
  }
  return result;
}

interface FloorPlanEditorProps {
  metadata: FloorPlanMetadata;
  onMetadataChange: (newMetadata: FloorPlanMetadata) => void;
  showFurniture?: boolean;
}

export function FloorPlanEditor({ metadata, onMetadataChange, showFurniture = true }: FloorPlanEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [selectedRoomId, setSelectedRoomId] = useState<number | null>(null);
  
  // Local state for all rooms being edited
  const [rooms, setRooms] = useState<RoomMetadata[]>([]);

  const [stageConfig, setStageConfig] = useState({ scale: 1, x: 0, y: 0 });

  useEffect(() => {
    if (metadata?.rooms) {
      const clonedRooms = JSON.parse(JSON.stringify(metadata.rooms));
      
      // Give fallback polygons to any rooms missing data
      let currentOffset = 0;
      clonedRooms.forEach((room: any) => {
        if (!room.polygon || room.polygon.length < 3) {
           const safeArea = typeof room.area_sqft === 'number' && room.area_sqft > 0 ? room.area_sqft : 100;
           
           let w = room.dimensions?.width_ft ? room.dimensions.width_ft * 15 : Math.sqrt(safeArea) * 15;
           let l = room.dimensions?.length_ft ? room.dimensions.length_ft * 15 : (safeArea / (w/15)) * 15;
           
           if (isNaN(w) || w <= 0) w = 150;
           if (isNaN(l) || l <= 0) l = 150;
           
           room.polygon = [
             [currentOffset, 0], 
             [currentOffset + w, 0], 
             [currentOffset + w, l], 
             [currentOffset, l]
           ];
           currentOffset += w + 20;
        }
      });
      setRooms(clonedRooms);
    }
    
    if (containerRef.current) {
      setDimensions({
        width: containerRef.current.offsetWidth,
        height: 500,
      });
    }
    
    const handleResize = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.offsetWidth,
          height: 500,
        });
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [metadata]);

  // Handle stage auto-scaling so large or small polygons always fit the canvas
  useEffect(() => {
    if (!dimensions.width || !rooms.length) return;
    
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    rooms.forEach(room => {
      if (room.polygon) {
        room.polygon.forEach((p: number[]) => {
          if (p[0] < minX) minX = p[0];
          if (p[0] > maxX) maxX = p[0];
          if (p[1] < minY) minY = p[1];
          if (p[1] > maxY) maxY = p[1];
        });
      }
    });

    if (minX !== Infinity) {
      const contentWidth = maxX - minX;
      const contentHeight = maxY - minY;
      const padding = 40;
      
      // Calculate max possible scale to fit content
      const scaleX = (dimensions.width - padding * 2) / (contentWidth || 1);
      const scaleY = (dimensions.height - padding * 2) / (contentHeight || 1);
      const scale = Math.min(scaleX, scaleY, 2); // Max scale 2x if tiny

      const x = (dimensions.width - contentWidth * scale) / 2 - minX * scale;
      const y = (dimensions.height - contentHeight * scale) / 2 - minY * scale;

      setStageConfig({ scale, x, y });
    }
  }, [rooms, dimensions]);

  // Handle dragging a specific vertex of a room
  const handleDragVertex = (roomId: number, vertexIndex: number, e: any) => {
    const newPos = e.target.position();
    
    setRooms(prevRooms => {
      const updatedRooms = [...prevRooms];
      const roomIndex = updatedRooms.findIndex(r => (r as any).id === roomId || updatedRooms.indexOf(r) === roomId);
      
      if (roomIndex === -1) return prevRooms;
      
      const newRoom = { ...updatedRooms[roomIndex] };
      const newPolygon = [...newRoom.polygon];
      
      // Update the modified point
      newPolygon[vertexIndex] = [newPos.x, newPos.y];
      newRoom.polygon = newPolygon;
      
      // Recalculate area using shoelace (flatten points first)
      const flatPoints = newPolygon.reduce((acc, point) => [...acc, point[0], point[1]], []);
      const areaPixels = calculatePolygonArea(flatPoints);
      
      // We need original ratio to convert pixels accurately to sqft.
      // Easiest approximation: compare new pixel area against old pixel area vs old sqft
      // Alternatively, use original scale_factor if frontend passed it (mocked here as simple proportion)
      const oldFlat = updatedRooms[roomIndex].polygon.reduce((acc: number[], point: number[]) => [...acc, point[0], point[1]], []);
      const oldAreaPixels = calculatePolygonArea(oldFlat) || 1;
      const ratio = newRoom.area_sqft / oldAreaPixels;
      
      newRoom.area_sqft = Math.round(Math.max(10, areaPixels * ratio)); // Prevent zero area
      
      updatedRooms[roomIndex] = newRoom;
      
      // Propagate changes up to parent (for CostEstimator, etc.)
      const newTotalSqft = updatedRooms.reduce((sum, r) => sum + r.area_sqft, 0);
      onMetadataChange({
        ...metadata,
        rooms: updatedRooms,
        total_area_sqft: newTotalSqft
      });
      
      return updatedRooms;
    });
  };

  if (!dimensions.width) return <div ref={containerRef} className="h-[500px]" />;

  return (
    <div ref={containerRef} className="bg-[var(--c-bg)] border border-[var(--c-border)] relative overflow-hidden h-[500px] w-full">
      <Stage 
        width={dimensions.width} 
        height={dimensions.height}
        scaleX={stageConfig.scale}
        scaleY={stageConfig.scale}
        x={stageConfig.x}
        y={stageConfig.y}
        onMouseDown={(e) => {
          // Deselect if clicking empty space
          if (e.target === e.target.getStage()) {
            setSelectedRoomId(null);
          }
        }}
      >
        <Layer>
          {rooms.map((room, i) => {
            const roomId = (room as any).id || i;
            const isSelected = selectedRoomId === roomId;
            const color = getRoomColor(room.type);
            
            // For rooms without polygon data, we skip them in the editor (or could draw a box fallback)
            if (!room.polygon || room.polygon.length < 3) return null;
            
            const flatPoints = room.polygon.reduce((acc: number[], point: number[]) => [...acc, point[0], point[1]], []);
            
            // Calculate label position (rough centroid)
            let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
            room.polygon.forEach((p: number[]) => {
              if (p[0] < minX) minX = p[0];
              if (p[0] > maxX) maxX = p[0];
              if (p[1] < minY) minY = p[1];
              if (p[1] > maxY) maxY = p[1];
            });
            const centerX = minX + (maxX - minX) / 2;
            const centerY = minY + (maxY - minY) / 2;

            // Reverse scale for elements that shouldn't shrink when zooming out
            const inverseScale = 1 / Math.max(stageConfig.scale, 0.01);

            return (
              <Group key={roomId}>
                {/* Room Shape */}
                <Line
                  points={flatPoints}
                  fill={color}
                  opacity={isSelected ? 0.7 : 0.4}
                  stroke={isSelected ? '#ffffff' : color}
                  strokeWidth={isSelected ? 3 * inverseScale : 1 * inverseScale}
                  closed
                  onClick={() => setSelectedRoomId(roomId)}
                  onTap={() => setSelectedRoomId(roomId)}
                  onMouseEnter={(e) => {
                    const stage = e.target.getStage();
                    if (stage) stage.container().style.cursor = 'pointer';
                  }}
                  onMouseLeave={(e) => {
                    const stage = e.target.getStage();
                    if (stage) stage.container().style.cursor = 'default';
                  }}
                />
                
                {/* Room Label */}
                <Text
                  x={centerX - (50 * inverseScale)}
                  y={centerY - (10 * inverseScale)}
                  text={`${room.type}\n${room.area_sqft} sq ft`}
                  fontSize={14 * inverseScale}
                  fill={isSelected ? '#ffffff' : '#e8e4de'}
                  align="center"
                  width={100 * inverseScale}
                  listening={false}
                />
                
                {/* Furniture Auto-Layout */}
                {showFurniture && room.furniture && room.furniture.map((furnitureItem) => (
                  <Furniture 
                    key={furnitureItem.id} 
                    item={furnitureItem} 
                    inverseScale={inverseScale} 
                  />
                ))}

                {/* Resizing Anchors */}
                {isSelected && room.polygon.map((point: number[], pIndex: number) => (
                  <Circle
                    key={`${roomId}-p${pIndex}`}
                    x={point[0]}
                    y={point[1]}
                    radius={6 * inverseScale}
                    fill="#ffffff"
                    stroke="#000000"
                    strokeWidth={2 * inverseScale}
                    draggable
                    onDragMove={(e) => handleDragVertex(roomId, pIndex, e)}
                    onMouseEnter={(e) => {
                      const stage = e.target.getStage();
                      if (stage) stage.container().style.cursor = 'move';
                    }}
                    onMouseLeave={(e) => {
                      const stage = e.target.getStage();
                      if (stage) stage.container().style.cursor = 'pointer';
                    }}
                  />
                ))}
              </Group>
            );
          })}
        </Layer>
      </Stage>
      
      {/* Editor Instructions HUD */}
      <div className="absolute top-4 left-4 flex flex-col gap-2 pointer-events-none">
        <span className="label-sm text-[var(--c-bg)] tracking-widest bg-[var(--c-accent)] px-3 py-1.5 shadow-md">
          INTERACTIVE EDITOR
        </span>
        <span className="text-xs text-[#ffffff] bg-black/60 px-3 py-1 shadow-md w-fit">
          Click a room to select · Drag corners to resize
        </span>
      </div>
    </div>
  );
}
