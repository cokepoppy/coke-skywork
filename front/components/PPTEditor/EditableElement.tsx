import React from 'react';
import { Rnd } from 'react-rnd';
import { PPTElement, isTextElement, isShapeElement, isImageElement, isChartElement } from '../../types';
import TextElement from './elements/TextElement';
import ShapeElement from './elements/ShapeElement';
import ImageElement from './elements/ImageElement';
import ChartElement from './elements/ChartElement';

interface EditableElementProps {
  element: PPTElement;
  isSelected: boolean;
  onSelect: () => void;
  onChange: (updated: Partial<PPTElement>) => void;
  scale: number;
  originalImage?: string;
}

const EditableElement: React.FC<EditableElementProps> = ({
  element,
  isSelected,
  onSelect,
  onChange,
  scale,
  originalImage
}) => {
  const renderElement = () => {
    if (isTextElement(element)) {
      return (
        <TextElement
          element={element}
          onChange={(content) => onChange({ content })}
        />
      );
    } else if (isShapeElement(element)) {
      return <ShapeElement element={element} />;
    } else if (isImageElement(element)) {
      return <ImageElement element={element} originalImage={originalImage} />;
    } else if (isChartElement(element)) {
      return <ChartElement element={element} />;
    }
    return null;
  };

  // For non-text elements, reduce opacity since they're shown in background layer
  const elementOpacity = isTextElement(element) ? 1 : (isSelected ? 0.3 : 0.05);

  return (
    <Rnd
      position={{ x: element.x, y: element.y }}
      size={{ width: element.width, height: element.height }}
      onDragStop={(e, d) => {
        onChange({ x: d.x, y: d.y });
      }}
      onResizeStop={(e, direction, ref, delta, position) => {
        onChange({
          width: parseInt(ref.style.width),
          height: parseInt(ref.style.height),
          ...position
        });
      }}
      bounds="parent"
      scale={scale}
      enableResizing={isSelected}
      disableDragging={!isSelected}
      className={`editable-element ${isSelected ? 'selected' : ''}`}
      style={{
        zIndex: element.zIndex,
        transform: element.rotation ? `rotate(${element.rotation}deg)` : undefined,
        opacity: elementOpacity
      }}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
    >
      {renderElement()}
    </Rnd>
  );
};

export default EditableElement;
