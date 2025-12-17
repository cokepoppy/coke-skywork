import React from 'react';
import { PPTPage } from '../../types';
import EditableElement from './EditableElement';

interface PPTCanvasProps {
  pptData: PPTPage;
  selectedElementId: string | null;
  onSelectElement: (id: string | null) => void;
  onUpdateElement: (id: string, updates: any) => void;
  scale: number;
}

const PPTCanvas: React.FC<PPTCanvasProps> = ({
  pptData,
  selectedElementId,
  onSelectElement,
  onUpdateElement,
  scale
}) => {
  const handleCanvasClick = (e: React.MouseEvent) => {
    // Deselect when clicking on canvas background
    if (e.target === e.currentTarget) {
      onSelectElement(null);
    }
  };

  return (
    <div
      style={{
        width: 1920 * scale,
        height: 1080 * scale,
        position: 'relative'
      }}
    >
      <div
        className="ppt-canvas"
        style={{
          width: 1920,
          height: 1080,
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
          backgroundColor: pptData.backgroundColor || '#FFFFFF',
          backgroundImage: pptData.backgroundImage ? `url(${pptData.backgroundImage})` : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
        onClick={handleCanvasClick}
      >
        {pptData.elements.map((element) => (
          <EditableElement
            key={element.id}
            element={element}
            isSelected={element.id === selectedElementId}
            onSelect={() => onSelectElement(element.id)}
            onChange={(updates) => onUpdateElement(element.id, updates)}
            scale={scale}
          />
        ))}
      </div>
    </div>
  );
};

export default PPTCanvas;
