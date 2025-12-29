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
  console.log('[PPTCanvas] Rendering with:', {
    elementsCount: pptData.elements.length,
    hasOriginalImage: !!pptData.originalImage,
    originalImageLength: pptData.originalImage?.length || 0,
    scale
  });

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
          backgroundPosition: 'center',
          position: 'relative'
        }}
        onClick={handleCanvasClick}
      >
        {/* Text-free background image - shows all icons, charts, decorations without text */}
        {pptData.backgroundImage && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: 1920,
              height: 1080,
              backgroundImage: `url(${pptData.backgroundImage})`,
              backgroundSize: '1920px 1080px',
              backgroundPosition: '0 0',
              backgroundRepeat: 'no-repeat',
              pointerEvents: 'none', // Allow clicking through to elements below
              zIndex: 0
            }}
          />
        )}

        {/* Editable elements layer */}
        {pptData.elements.map((element) => (
          <EditableElement
            key={element.id}
            element={element}
            isSelected={element.id === selectedElementId}
            onSelect={() => onSelectElement(element.id)}
            onChange={(updates) => onUpdateElement(element.id, updates)}
            scale={scale}
            originalImage={pptData.originalImage}
          />
        ))}
      </div>
    </div>
  );
};

export default PPTCanvas;
