import React from 'react';
import { ShapeElement as ShapeElementType } from '../../../types';

interface ShapeElementProps {
  element: ShapeElementType;
}

const ShapeElement: React.FC<ShapeElementProps> = ({ element }) => {
  const getShapeClass = () => {
    switch (element.shapeType) {
      case 'circle':
        return 'circle';
      case 'ellipse':
        return 'ellipse';
      default:
        return '';
    }
  };

  return (
    <div
      className={`shape-element ${getShapeClass()}`}
      style={{
        backgroundColor: element.backgroundColor,
        borderColor: element.borderColor,
        borderWidth: element.borderWidth ? `${element.borderWidth}px` : undefined,
        borderStyle: element.borderWidth ? 'solid' : undefined,
        borderRadius: element.borderRadius ? `${element.borderRadius}px` : undefined,
        opacity: element.opacity !== undefined ? element.opacity : 1
      }}
    />
  );
};

export default ShapeElement;
