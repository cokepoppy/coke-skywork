import React from 'react';
import { ImageElement as ImageElementType } from '../../../types';

interface ImageElementProps {
  element: ImageElementType;
}

const ImageElement: React.FC<ImageElementProps> = ({ element }) => {
  return (
    <img
      src={element.src}
      alt="PPT Image"
      className="image-element"
      style={{
        opacity: element.opacity !== undefined ? element.opacity : 1
      }}
      draggable={false}
    />
  );
};

export default ImageElement;
