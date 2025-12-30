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

  // Make text elements editable after HTML is rendered
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
        console.log('[VisualPPTEditor] Making elements editable');

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

            // Add visual feedback styles with !important-like approach
            htmlEl.style.setProperty('cursor', 'text', 'important');
            htmlEl.style.setProperty('outline', 'none', 'important');
            htmlEl.style.setProperty('pointer-events', 'auto', 'important');
            htmlEl.style.setProperty('user-select', 'text', 'important');

            // Test: add a visible border to confirm elements are accessible
            htmlEl.style.setProperty('border', '2px solid red', 'important');
            htmlEl.style.setProperty('background-color', 'rgba(255, 255, 0, 0.1)', 'important');

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

            // Add focus effect
            htmlEl.addEventListener('focus', () => {
              htmlEl.classList.add('editing');
              htmlEl.style.backgroundColor = 'rgba(59, 130, 246, 0.15)'; // blue-500/15
              htmlEl.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.5)'; // blue-500/50
            });

            htmlEl.addEventListener('blur', () => {
              htmlEl.classList.remove('editing');
              htmlEl.style.backgroundColor = '';
              htmlEl.style.boxShadow = '';
            });

            count++;
          }
        });

        console.log('[VisualPPTEditor] Made', count, 'elements editable');
        editableCountRef.current = count;  // Store in ref, no re-render
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
      // Get the updated HTML from the container
      const updatedHtml = pptContainerRef.current.innerHTML;

      // Clean up: remove contentEditable attributes and inline styles we added
      const parser = new DOMParser();
      const doc = parser.parseFromString(updatedHtml, 'text/html');

      const editableElements = doc.querySelectorAll('[contenteditable]');
      editableElements.forEach(el => {
        const htmlEl = el as HTMLElement;
        htmlEl.removeAttribute('contenteditable');
        // Remove our added styles
        htmlEl.style.cursor = '';
        htmlEl.style.outline = '';
        htmlEl.classList.remove('editing');
      });

      const cleanedHtml = doc.documentElement.outerHTML;
      onSave(cleanedHtml);
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
        <p className="font-medium">Click any text to edit • {editableCountRef.current} editable elements found</p>
        <p className="text-blue-300 mt-1">Hover over text to see editable areas</p>
      </div>
    </div>
  );
};

export default VisualPPTEditor;
