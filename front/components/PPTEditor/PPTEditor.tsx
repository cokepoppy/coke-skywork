import React, { useState, useRef, useEffect } from 'react';
import { PPTPage, PPTElement, EditHistory } from '../../types';
import Toolbar from './Toolbar';
import PPTCanvas from './PPTCanvas';
import PropertyPanel from './PropertyPanel';
import { exportToPNG, exportToHTML } from '../../utils/export';
import './PPTEditor.css';

interface PPTEditorProps {
  initialData: PPTPage;
  onClose: (updatedData?: PPTPage) => void;
}

const PPTEditor: React.FC<PPTEditorProps> = ({ initialData, onClose }) => {
  const [pptData, setPptData] = useState<PPTPage>(initialData);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [scale, setScale] = useState(0.5);
  const [history, setHistory] = useState<EditHistory>({
    past: [],
    present: initialData,
    future: []
  });

  const canvasRef = useRef<HTMLDivElement>(null);

  // Sync pptData with history.present
  useEffect(() => {
    setPptData(history.present);
  }, [history.present]);

  const updateElement = (id: string, updates: Partial<PPTElement>) => {
    const newData = {
      ...pptData,
      elements: pptData.elements.map(el =>
        el.id === id ? { ...el, ...updates } : el
      )
    };

    // Save to history
    setHistory(h => ({
      past: [...h.past, h.present],
      present: newData,
      future: []
    }));
  };

  const undo = () => {
    setHistory(h => {
      if (h.past.length === 0) return h;
      const previous = h.past[h.past.length - 1];
      return {
        past: h.past.slice(0, -1),
        present: previous,
        future: [h.present, ...h.future]
      };
    });
  };

  const redo = () => {
    setHistory(h => {
      if (h.future.length === 0) return h;
      const next = h.future[0];
      return {
        past: [...h.past, h.present],
        present: next,
        future: h.future.slice(1)
      };
    });
  };

  const handleExportPNG = async () => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current.querySelector('.ppt-canvas') as HTMLElement;
    if (!canvas) return;

    try {
      await exportToPNG(canvas);
      alert('PNG导出成功！');
    } catch (error) {
      console.error('Export failed:', error);
      alert('PNG导出失败，请查看控制台错误信息');
    }
  };

  const handleExportHTML = () => {
    try {
      exportToHTML(pptData);
      alert('HTML导出成功！');
    } catch (error) {
      console.error('Export failed:', error);
      alert('HTML导出失败，请查看控制台错误信息');
    }
  };

  const selectedElement = selectedElementId
    ? pptData.elements.find(el => el.id === selectedElementId) || null
    : null;

  const handleClose = () => {
    // Save current state when closing
    onClose(pptData);
  };

  return (
    <div className="ppt-editor-overlay" onClick={handleClose}>
      <div className="ppt-editor-container" onClick={(e) => e.stopPropagation()}>
        <Toolbar
          scale={scale}
          onScaleChange={setScale}
          onUndo={undo}
          onRedo={redo}
          onExportPNG={handleExportPNG}
          onExportHTML={handleExportHTML}
          onClose={handleClose}
          canUndo={history.past.length > 0}
          canRedo={history.future.length > 0}
        />

        <div className="ppt-editor-content">
          <div className="ppt-canvas-area">
            <div className="ppt-canvas-wrapper" ref={canvasRef}>
              <PPTCanvas
                pptData={pptData}
                selectedElementId={selectedElementId}
                onSelectElement={setSelectedElementId}
                onUpdateElement={updateElement}
                scale={scale}
              />
            </div>
          </div>

          <PropertyPanel
            selectedElement={selectedElement}
            onUpdateElement={(updates) => {
              if (selectedElementId) {
                updateElement(selectedElementId, updates);
              }
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default PPTEditor;
