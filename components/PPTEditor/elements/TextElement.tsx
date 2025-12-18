import React, { useState, useRef, useEffect } from 'react';
import { TextElement as TextElementType } from '../../../types';

interface TextElementProps {
  element: TextElementType;
  onChange?: (content: string) => void;
}

const TextElement: React.FC<TextElementProps> = ({ element, onChange }) => {
  const [isEditing, setIsEditing] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  const handleDoubleClick = () => {
    setIsEditing(true);
  };

  const handleBlur = () => {
    setIsEditing(false);
    if (contentRef.current && onChange) {
      onChange(contentRef.current.innerText);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsEditing(false);
      if (contentRef.current) {
        contentRef.current.blur();
      }
    }
  };

  useEffect(() => {
    if (isEditing && contentRef.current) {
      contentRef.current.focus();
      // Select all text
      const range = document.createRange();
      range.selectNodeContents(contentRef.current);
      const selection = window.getSelection();
      selection?.removeAllRanges();
      selection?.addRange(range);
    }
  }, [isEditing]);

  return (
    <div
      ref={contentRef}
      className={`text-element ${isEditing ? 'editing' : ''}`}
      contentEditable={isEditing}
      suppressContentEditableWarning
      onDoubleClick={handleDoubleClick}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      style={{
        fontSize: element.fontSize,
        fontFamily: element.fontFamily,
        fontWeight: element.fontWeight,
        color: element.color,
        textAlign: element.textAlign,
        lineHeight: element.lineHeight || 1.4,
        letterSpacing: element.letterSpacing ? `${element.letterSpacing}px` : undefined,
        outline: 'none',
        cursor: isEditing ? 'text' : 'move',
        padding: '4px',
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: element.textAlign === 'center' ? 'center' : element.textAlign === 'right' ? 'flex-end' : 'flex-start'
      }}
    >
      {element.content}
    </div>
  );
};

export default TextElement;
