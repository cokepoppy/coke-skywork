import React from 'react';
import { ImageElement as ImageElementType } from '../../../types';

interface ImageElementProps {
  element: ImageElementType;
  originalImage?: string;
}

const ImageElement: React.FC<ImageElementProps> = ({ element, originalImage }) => {
  // Check if element has a valid image source
  const hasValidSrc = element.src && element.src.trim() !== '' && !element.src.includes('placeholder');

  console.log('[ImageElement] Rendering:', {
    id: element.id,
    hasValidSrc,
    srcLength: element.src?.length || 0,
    hasOriginalImage: !!originalImage,
    originalImageLength: originalImage?.length || 0,
    position: { x: element.x, y: element.y },
    size: { width: element.width, height: element.height }
  });

  if (hasValidSrc) {
    // Use the element's own image
    console.log('[ImageElement] Using element own image');
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
  }

  // If no valid src but we have originalImage, show cropped region from original PPT
  if (originalImage) {
    console.log('[ImageElement] Using cropped region from original PPT');
    return (
      <div
        className="image-element"
        style={{
          width: '100%',
          height: '100%',
          backgroundImage: `url(${originalImage})`,
          backgroundPosition: `-${element.x}px -${element.y}px`,
          backgroundSize: '1920px 1080px',
          backgroundRepeat: 'no-repeat',
          opacity: element.opacity !== undefined ? element.opacity : 1
        }}
      />
    );
  }

  // Fallback: show placeholder
  console.log('[ImageElement] Using placeholder');
  return (
    <div
      className="image-element"
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f0f0f0',
        border: '2px dashed #ccc',
        fontSize: '12px',
        color: '#999',
        opacity: element.opacity !== undefined ? element.opacity : 1
      }}
    >
      Image
    </div>
  );
};

export default ImageElement;
