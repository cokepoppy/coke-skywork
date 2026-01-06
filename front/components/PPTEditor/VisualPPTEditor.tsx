import React, { useState, useRef, useEffect } from 'react';
import { Slide } from '../../types';

interface VisualPPTEditorProps {
  slide: Slide;
  onSave: (updatedHtml: string) => void;
  onCancel: () => void;
}

const VisualPPTEditor: React.FC<VisualPPTEditorProps> = ({ slide, onSave, onCancel }) => {
  const editableCountRef = useRef(0);  // Use ref instead of state to avoid re-render
  const pptContainerRef = useRef<HTMLDivElement>(null);
  const dragStateRef = useRef<{
    isDragging: boolean;
    element: HTMLElement | null;
    startX: number;
    startY: number;
    elementStartLeft: number;
    elementStartTop: number;
  }>({
    isDragging: false,
    element: null,
    startX: 0,
    startY: 0,
    elementStartLeft: 0,
    elementStartTop: 0
  });

  // Make text elements editable and draggable after HTML is rendered
  useEffect(() => {
    console.log('[VisualPPTEditor] Component mounted, slide:', slide.id);
    console.log('[VisualPPTEditor] Has htmlContent:', !!slide.htmlContent);

    if (!slide.htmlContent || !pptContainerRef.current) {
      console.log('[VisualPPTEditor] Missing requirements, aborting');
      return;
    }

    const pptContainer = pptContainerRef.current;
    console.log('[VisualPPTEditor] Setting up content edit timer');

    const timer = setTimeout(() => {
      try {
        console.log('[VisualPPTEditor] Making elements editable and draggable');

        // Find all text elements (p, h1-h6, span, div with text)
        const textElements = pptContainer.querySelectorAll('p, h1, h2, h3, h4, h5, h6, span, div');
        console.log('[VisualPPTEditor] Found', textElements.length, 'total elements');

        let count = 0;
        textElements.forEach((el) => {
          const htmlEl = el as HTMLElement;

          // Get direct text content (not from children)
          const hasDirectText = Array.from(htmlEl.childNodes).some(
            node => node.nodeType === Node.TEXT_NODE && node.textContent?.trim()
          );

          // Only make elements editable if they have direct text content
          // This avoids making container divs editable when only their children have text
          if (hasDirectText) {
            console.log('[VisualPPTEditor] Making editable:', htmlEl.tagName, htmlEl.textContent?.substring(0, 30));

            // Make the element editable
            htmlEl.contentEditable = 'true';

            // Make element positioned so it can be dragged
            const currentPosition = window.getComputedStyle(htmlEl).position;
            if (currentPosition === 'static') {
              htmlEl.style.position = 'relative';
            }

            // Add minimal visual feedback styles
            htmlEl.style.setProperty('cursor', 'move', 'important');
            htmlEl.style.setProperty('outline', 'none', 'important');
            htmlEl.style.setProperty('pointer-events', 'auto', 'important');
            htmlEl.style.setProperty('user-select', 'text', 'important');

            // Add hover effect
            const mouseEnterHandler = () => {
              console.log('[VisualPPTEditor] Mouse enter on:', htmlEl.tagName, htmlEl.textContent?.substring(0, 20));
              if (!htmlEl.classList.contains('editing')) {
                htmlEl.style.backgroundColor = 'rgba(59, 130, 246, 0.1)'; // blue-500/10
                htmlEl.style.boxShadow = '0 0 0 2px rgba(59, 130, 246, 0.3)'; // blue-500/30
                console.log('[VisualPPTEditor] Applied hover styles');
              }
            };
            htmlEl.addEventListener('mouseenter', mouseEnterHandler);
            console.log('[VisualPPTEditor] Added mouseenter listener to:', htmlEl.tagName);

            htmlEl.addEventListener('mouseleave', () => {
              if (!htmlEl.classList.contains('editing')) {
                htmlEl.style.backgroundColor = '';
                htmlEl.style.boxShadow = '';
              }
            });

            // Add focus effect (when editing text)
            htmlEl.addEventListener('focus', () => {
              htmlEl.classList.add('editing');
              htmlEl.style.cursor = 'text';
              htmlEl.style.backgroundColor = 'rgba(59, 130, 246, 0.15)'; // blue-500/15
              htmlEl.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.5)'; // blue-500/50
            });

            htmlEl.addEventListener('blur', () => {
              htmlEl.classList.remove('editing');
              htmlEl.style.cursor = 'move';
              htmlEl.style.backgroundColor = '';
              htmlEl.style.boxShadow = '';
            });

            // Add click to enter edit mode
            htmlEl.addEventListener('click', (e: MouseEvent) => {
              console.log('[VisualPPTEditor] Click on:', htmlEl.tagName);
              if (!dragStateRef.current.isDragging) {
                console.log('[VisualPPTEditor] No drag detected, focusing element for editing');
                htmlEl.focus();
              }
            });

            // Add drag functionality - but don't prevent default on mousedown
            // Let the drag start only when mouse actually moves
            let dragStartPos = { x: 0, y: 0 };
            let isDragCandidate = false;

            htmlEl.addEventListener('mousedown', (e: MouseEvent) => {
              console.log('[VisualPPTEditor] Mousedown on:', htmlEl.tagName, 'editing:', htmlEl.classList.contains('editing'));

              // If already editing, allow text selection
              if (htmlEl.classList.contains('editing')) {
                console.log('[VisualPPTEditor] Element is in editing mode, allowing text selection');
                return;
              }

              // Mark as drag candidate, but don't start dragging yet
              isDragCandidate = true;
              dragStartPos = { x: e.clientX, y: e.clientY };
              console.log('[VisualPPTEditor] Element is drag candidate at:', dragStartPos.x, dragStartPos.y);
            });

            // Start drag only when mouse moves more than 5px
            const checkDragStart = (e: MouseEvent) => {
              if (!isDragCandidate || dragStateRef.current.isDragging) return;

              const dx = Math.abs(e.clientX - dragStartPos.x);
              const dy = Math.abs(e.clientY - dragStartPos.y);

              if (dx > 5 || dy > 5) {
                console.log('[VisualPPTEditor] Drag threshold exceeded, starting drag');
                isDragCandidate = false;
                dragStateRef.current = {
                  isDragging: true,
                  element: htmlEl,
                  startX: dragStartPos.x,
                  startY: dragStartPos.y,
                  elementStartLeft: parseInt(htmlEl.style.left || '0'),
                  elementStartTop: parseInt(htmlEl.style.top || '0')
                };
                console.log('[VisualPPTEditor] Started dragging:', htmlEl.tagName, 'from position:',
                           dragStateRef.current.elementStartLeft, dragStateRef.current.elementStartTop);
              }
            };

            htmlEl.addEventListener('mousemove', checkDragStart);

            htmlEl.addEventListener('mouseup', () => {
              isDragCandidate = false;
            });

            count++;
          }
        });

        // Global mouse move handler
        const handleMouseMove = (e: MouseEvent) => {
          const dragState = dragStateRef.current;
          if (!dragState.isDragging || !dragState.element) return;

          const deltaX = e.clientX - dragState.startX;
          const deltaY = e.clientY - dragState.startY;

          const newLeft = dragState.elementStartLeft + deltaX;
          const newTop = dragState.elementStartTop + deltaY;

          dragState.element.style.left = `${newLeft}px`;
          dragState.element.style.top = `${newTop}px`;
        };

        // Global mouse up handler
        const handleMouseUp = () => {
          if (dragStateRef.current.isDragging) {
            console.log('[VisualPPTEditor] Stopped dragging');
            dragStateRef.current.isDragging = false;
            dragStateRef.current.element = null;
          }
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);

        console.log('[VisualPPTEditor] Made', count, 'elements editable and draggable');
        editableCountRef.current = count;  // Store in ref, no re-render

        // Cleanup function
        return () => {
          document.removeEventListener('mousemove', handleMouseMove);
          document.removeEventListener('mouseup', handleMouseUp);
        };
      } catch (error) {
        console.error('[VisualPPTEditor] Error making elements editable:', error);
      }
    }, 500); // Wait for HTML to render

    return () => clearTimeout(timer);
  }, [slide.htmlContent, slide.id]);

  // Save changes by getting the current HTML
  const handleSave = () => {
    if (!pptContainerRef.current) return;

    try {
      console.log('[VisualPPTEditor] Starting save process');

      // Get the updated HTML from the container (this is the BODY content only)
      const updatedBodyHtml = pptContainerRef.current.innerHTML;
      console.log('[VisualPPTEditor] Got updated body HTML, length:', updatedBodyHtml.length);

      // We need to reconstruct the full HTML document
      // The original slide.htmlContent has the complete structure
      console.log('[VisualPPTEditor] Original htmlContent length:', slide.htmlContent?.length);

      // Clean up: remove contentEditable attributes and our visual feedback styles
      const parser = new DOMParser();
      const doc = parser.parseFromString(slide.htmlContent || '', 'text/html');

      // Replace the body content with our edited version
      console.log('[VisualPPTEditor] Replacing body content with edited version');
      doc.body.innerHTML = updatedBodyHtml;

      const editableElements = doc.querySelectorAll('[contenteditable]');
      console.log('[VisualPPTEditor] Found', editableElements.length, 'editable elements to clean');

      editableElements.forEach(el => {
        const htmlEl = el as HTMLElement;

        // Remove contenteditable attribute
        htmlEl.removeAttribute('contenteditable');

        // Remove visual feedback styles we added, but KEEP position styles (left, top)
        htmlEl.style.removeProperty('cursor');
        htmlEl.style.removeProperty('outline');
        htmlEl.style.removeProperty('pointer-events');
        htmlEl.style.removeProperty('user-select');
        htmlEl.style.removeProperty('box-shadow');

        // Remove editing class
        htmlEl.classList.remove('editing');

        // KEEP left, top, position styles for drag positioning
        console.log('[VisualPPTEditor] Cleaned element:', htmlEl.tagName,
                   'position:', htmlEl.style.position,
                   'left:', htmlEl.style.left,
                   'top:', htmlEl.style.top);
      });

      // Save the COMPLETE HTML document (DOCTYPE + html + head + body)
      const serializer = new XMLSerializer();
      const cleanedHtml = '<!DOCTYPE html>\n' + serializer.serializeToString(doc.documentElement);

      console.log('[VisualPPTEditor] Cleaned HTML, length:', cleanedHtml.length);
      console.log('[VisualPPTEditor] Cleaned HTML preview (first 500 chars):', cleanedHtml.substring(0, 500));
      console.log('[VisualPPTEditor] Cleaned HTML preview (last 500 chars):', cleanedHtml.substring(cleanedHtml.length - 500));

      onSave(cleanedHtml);
      console.log('[VisualPPTEditor] Save completed, passed complete HTML document to parent');
    } catch (error) {
      console.error('[VisualPPTEditor] Error saving changes:', error);
    }
  };

  return (
    <div className="relative w-full h-full">
      {/* Background div showing the PPT HTML with editable content */}
      <div
        ref={pptContainerRef}
        className="absolute inset-0 w-full h-full overflow-hidden"
        style={{ pointerEvents: 'auto' }}
        dangerouslySetInnerHTML={{ __html: slide.htmlContent || '' }}
      />

      {/* Toolbar - Fixed positioning with high z-index */}
      <div className="absolute top-2 right-2 flex gap-2" style={{ zIndex: 9999 }}>
        <button
          onClick={handleSave}
          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg shadow-2xl transition-colors font-medium text-sm"
        >
          Save Changes
        </button>
        <button
          onClick={onCancel}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg shadow-2xl transition-colors font-medium text-sm"
        >
          Cancel
        </button>
      </div>

      {/* Info panel */}
      <div className="absolute bottom-2 left-2 bg-black/80 text-white px-3 py-2 rounded-lg text-xs backdrop-blur-sm" style={{ zIndex: 9999 }}>
        <p className="font-medium">✏️ Click to edit text • 🖱️ Drag to move • {editableCountRef.current} elements</p>
        <p className="text-blue-300 mt-1">Cursor changes: ✋ Move mode • I Text edit mode</p>
      </div>
    </div>
  );
};

export default VisualPPTEditor;
