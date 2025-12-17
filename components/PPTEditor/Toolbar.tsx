import React from 'react';

interface ToolbarProps {
  scale: number;
  onScaleChange: (scale: number) => void;
  onUndo: () => void;
  onRedo: () => void;
  onExportPNG: () => void;
  onExportHTML: () => void;
  onClose: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

const Toolbar: React.FC<ToolbarProps> = ({
  scale,
  onScaleChange,
  onUndo,
  onRedo,
  onExportPNG,
  onExportHTML,
  onClose,
  canUndo,
  canRedo
}) => {
  const scaleOptions = [0.25, 0.5, 0.75, 1.0];

  return (
    <div className="ppt-editor-toolbar">
      <div className="toolbar-group">
        <button className="toolbar-button" onClick={onClose}>
          关闭
        </button>
      </div>

      <div className="toolbar-group">
        <button
          className="toolbar-button"
          onClick={onUndo}
          disabled={!canUndo}
        >
          撤销
        </button>
        <button
          className="toolbar-button"
          onClick={onRedo}
          disabled={!canRedo}
        >
          重做
        </button>
      </div>

      <div className="toolbar-group scale-controls">
        <span style={{ color: '#aaa', fontSize: '13px' }}>缩放:</span>
        {scaleOptions.map((s) => (
          <button
            key={s}
            className="scale-button"
            style={{
              background: scale === s ? '#00D2FF' : '#333',
              color: scale === s ? '#000' : '#fff'
            }}
            onClick={() => onScaleChange(s)}
          >
            {(s * 100).toFixed(0)}%
          </button>
        ))}
      </div>

      <div className="toolbar-group">
        <button className="toolbar-button primary" onClick={onExportPNG}>
          导出PNG
        </button>
        <button className="toolbar-button primary" onClick={onExportHTML}>
          导出HTML
        </button>
      </div>
    </div>
  );
};

export default Toolbar;
