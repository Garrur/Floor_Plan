import React from 'react';
import { Group, Rect, Circle } from 'react-konva';
import { FurnitureItem } from '@/types/api';

interface FurnitureProps {
  item: FurnitureItem;
  inverseScale: number;
}

export function Furniture({ item, inverseScale }: FurnitureProps) {
  const { type, x, y, width, length, rotation } = item;
  
  // base styling for architectural blueprints
  const stroke = "rgba(255, 255, 255, 0.55)";
  const strokeWidth = 1.5 * inverseScale;

  const renderItem = () => {
    switch(type) {
      case 'bed':
        return (
          <Group>
            {/* frame */}
            <Rect width={width} height={length} fill="rgba(255,255,255,0.05)" stroke={stroke} strokeWidth={strokeWidth} cornerRadius={2 * inverseScale} />
            {/* pillows */}
            <Rect x={width * 0.1} y={length * 0.05} width={width * 0.35} height={length * 0.15} stroke={stroke} strokeWidth={strokeWidth} cornerRadius={2 * inverseScale} />
            <Rect x={width * 0.55} y={length * 0.05} width={width * 0.35} height={length * 0.15} stroke={stroke} strokeWidth={strokeWidth} cornerRadius={2 * inverseScale} />
            {/* blanket */}
            <Rect x={0} y={length * 0.3} width={width} height={length * 0.7} fill="rgba(255,255,255,0.1)" stroke={stroke} strokeWidth={strokeWidth} cornerRadius={1 * inverseScale} />
          </Group>
        );
      case 'nightstand':
        return (
          <Rect width={width} height={length} fill="rgba(255,255,255,0.05)" stroke={stroke} strokeWidth={strokeWidth} />
        );
      case 'sofa':
        return (
          <Group>
            {/* base */ }
            <Rect width={width} height={length} fill="rgba(255,255,255,0.05)" stroke={stroke} strokeWidth={strokeWidth} cornerRadius={4 * inverseScale} />
            {/* backrest */}
            <Rect width={width} height={length * 0.3} fill="rgba(255,255,255,0.1)" stroke={stroke} strokeWidth={strokeWidth} cornerRadius={2 * inverseScale} />
            {/* armrests */}
            <Rect width={width * 0.15} height={length} fill="rgba(255,255,255,0.1)" stroke={stroke} strokeWidth={strokeWidth} cornerRadius={2 * inverseScale} />
            <Rect x={width * 0.85} width={width * 0.15} height={length} fill="rgba(255,255,255,0.1)" stroke={stroke} strokeWidth={strokeWidth} cornerRadius={2 * inverseScale} />
          </Group>
        );
      case 'rug':
        return (
          <Rect width={width} height={length} fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.2)" strokeWidth={1 * inverseScale} dash={[5 * inverseScale, 5 * inverseScale]} />
        );
      case 'tv_stand':
        return (
           <Group>
             <Rect width={width} height={length} fill="rgba(255,255,255,0.05)" stroke={stroke} strokeWidth={strokeWidth} />
             {/* TV on top */}
             <Rect x={width * 0.1} y={length * 0.4} width={width * 0.8} height={length * 0.2} fill="rgba(255,255,255,0.3)" stroke={stroke} strokeWidth={strokeWidth} />
           </Group>
        );
      case 'toilet':
        return (
          <Group>
            <Rect x={width*0.2} y={0} width={width*0.6} height={length*0.4} stroke={stroke} strokeWidth={strokeWidth} cornerRadius={2 * inverseScale} />
            <Circle x={width/2} y={length*0.7} radius={width*0.35} stroke={stroke} strokeWidth={strokeWidth} />
          </Group>
        );
      case 'tub':
        return (
           <Group>
             <Rect width={width} height={length} stroke={stroke} strokeWidth={strokeWidth} fill="rgba(255,255,255,0.05)" cornerRadius={4 * inverseScale} />
             <Rect x={width*0.1} y={length*0.1} width={width*0.8} height={length*0.8} stroke={stroke} strokeWidth={strokeWidth} cornerRadius={10 * inverseScale} />
           </Group>
        );
      case 'dining_table':
        return (
           <Group>
             <Rect width={width} height={length} fill="rgba(255,255,255,0.05)" stroke={stroke} strokeWidth={strokeWidth} cornerRadius={width * 0.2} />
             {/* Simple chairs top */}
             <Rect x={width * 0.2} y={-length * 0.2} width={width * 0.2} height={length * 0.2} stroke={stroke} strokeWidth={strokeWidth} />
             <Rect x={width * 0.6} y={-length * 0.2} width={width * 0.2} height={length * 0.2} stroke={stroke} strokeWidth={strokeWidth} />
             {/* Simple chairs bottom */}
             <Rect x={width * 0.2} y={length} width={width * 0.2} height={length * 0.2} stroke={stroke} strokeWidth={strokeWidth} />
             <Rect x={width * 0.6} y={length} width={width * 0.2} height={length * 0.2} stroke={stroke} strokeWidth={strokeWidth} />
           </Group>
        );
      case 'island':
         return (
             <Rect width={width} height={length} fill="rgba(255,255,255,0.1)" stroke={stroke} strokeWidth={strokeWidth} />
         )
      default:
        return <Rect width={width} height={length} stroke={stroke} strokeWidth={strokeWidth} fill="rgba(255,255,255,0.05)" />;
    }
  };

  return (
    <Group 
      x={x} 
      y={y} 
      rotation={rotation}
      offsetX={width / 2}
      offsetY={length / 2}
      listening={false} // Let clicks fall through to the room layer
    >
      {renderItem()}
    </Group>
  );
}
