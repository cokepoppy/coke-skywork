import React from 'react';
import { PPTElement, isTextElement, isShapeElement } from '../../types';

interface PropertyPanelProps {
  selectedElement: PPTElement | null;
  onUpdateElement: (updates: Partial<PPTElement>) => void;
}

const PropertyPanel: React.FC<PropertyPanelProps> = ({
  selectedElement,
  onUpdateElement
}) => {
  if (!selectedElement) {
    return (
      <div className="property-panel">
        <div className="property-panel-empty">
          <p>选择一个元素以编辑其属性</p>
        </div>
      </div>
    );
  }

  return (
    <div className="property-panel">
      <div className="property-panel-header">
        <h3>属性</h3>
      </div>

      <div className="property-panel-content">
        {/* Position and Size */}
        <div className="property-group">
          <div className="property-group-title">位置与尺寸</div>

          <div className="property-row">
            <div className="property-field">
              <label className="property-label">X</label>
              <input
                type="number"
                className="property-input"
                value={Math.round(selectedElement.x)}
                onChange={(e) => onUpdateElement({ x: parseInt(e.target.value) || 0 })}
              />
            </div>

            <div className="property-field">
              <label className="property-label">Y</label>
              <input
                type="number"
                className="property-input"
                value={Math.round(selectedElement.y)}
                onChange={(e) => onUpdateElement({ y: parseInt(e.target.value) || 0 })}
              />
            </div>
          </div>

          <div className="property-row">
            <div className="property-field">
              <label className="property-label">宽度</label>
              <input
                type="number"
                className="property-input"
                value={Math.round(selectedElement.width)}
                onChange={(e) => onUpdateElement({ width: parseInt(e.target.value) || 1 })}
              />
            </div>

            <div className="property-field">
              <label className="property-label">高度</label>
              <input
                type="number"
                className="property-input"
                value={Math.round(selectedElement.height)}
                onChange={(e) => onUpdateElement({ height: parseInt(e.target.value) || 1 })}
              />
            </div>
          </div>
        </div>

        {/* Text Element Properties */}
        {isTextElement(selectedElement) && (
          <>
            <div className="property-group">
              <div className="property-group-title">文本</div>

              <div className="property-field">
                <label className="property-label">内容</label>
                <textarea
                  className="property-input"
                  rows={3}
                  value={selectedElement.content}
                  onChange={(e) => onUpdateElement({ content: e.target.value })}
                />
              </div>

              <div className="property-field">
                <label className="property-label">字号</label>
                <input
                  type="number"
                  className="property-input"
                  value={selectedElement.fontSize}
                  onChange={(e) => onUpdateElement({ fontSize: parseInt(e.target.value) || 12 })}
                />
              </div>

              <div className="property-field">
                <label className="property-label">字体粗细</label>
                <select
                  className="property-select"
                  value={selectedElement.fontWeight}
                  onChange={(e) => onUpdateElement({ fontWeight: e.target.value as any })}
                >
                  <option value="normal">普通</option>
                  <option value="600">半粗</option>
                  <option value="bold">粗体</option>
                  <option value="700">加粗</option>
                </select>
              </div>

              <div className="property-field">
                <label className="property-label">对齐</label>
                <select
                  className="property-select"
                  value={selectedElement.textAlign}
                  onChange={(e) => onUpdateElement({ textAlign: e.target.value as any })}
                >
                  <option value="left">左对齐</option>
                  <option value="center">居中</option>
                  <option value="right">右对齐</option>
                </select>
              </div>

              <div className="property-field">
                <label className="property-label">颜色</label>
                <div className="property-color-picker">
                  <input
                    type="color"
                    className="property-color-preview"
                    value={selectedElement.color}
                    onChange={(e) => onUpdateElement({ color: e.target.value })}
                  />
                  <input
                    type="text"
                    className="property-input"
                    value={selectedElement.color}
                    onChange={(e) => onUpdateElement({ color: e.target.value })}
                    style={{ flex: 1 }}
                  />
                </div>
              </div>
            </div>
          </>
        )}

        {/* Shape Element Properties */}
        {isShapeElement(selectedElement) && (
          <div className="property-group">
            <div className="property-group-title">形状</div>

            <div className="property-field">
              <label className="property-label">背景色</label>
              <div className="property-color-picker">
                <input
                  type="color"
                  className="property-color-preview"
                  value={selectedElement.backgroundColor}
                  onChange={(e) => onUpdateElement({ backgroundColor: e.target.value })}
                />
                <input
                  type="text"
                  className="property-input"
                  value={selectedElement.backgroundColor}
                  onChange={(e) => onUpdateElement({ backgroundColor: e.target.value })}
                  style={{ flex: 1 }}
                />
              </div>
            </div>

            {selectedElement.borderColor && (
              <div className="property-field">
                <label className="property-label">边框色</label>
                <div className="property-color-picker">
                  <input
                    type="color"
                    className="property-color-preview"
                    value={selectedElement.borderColor}
                    onChange={(e) => onUpdateElement({ borderColor: e.target.value })}
                  />
                  <input
                    type="text"
                    className="property-input"
                    value={selectedElement.borderColor}
                    onChange={(e) => onUpdateElement({ borderColor: e.target.value })}
                    style={{ flex: 1 }}
                  />
                </div>
              </div>
            )}

            {selectedElement.borderRadius !== undefined && (
              <div className="property-field">
                <label className="property-label">圆角</label>
                <input
                  type="number"
                  className="property-input"
                  value={selectedElement.borderRadius}
                  onChange={(e) => onUpdateElement({ borderRadius: parseInt(e.target.value) || 0 })}
                />
              </div>
            )}
          </div>
        )}

        {/* Layer Order */}
        <div className="property-group">
          <div className="property-group-title">层级</div>

          <div className="property-field">
            <label className="property-label">Z-Index</label>
            <input
              type="number"
              className="property-input"
              value={selectedElement.zIndex}
              onChange={(e) => onUpdateElement({ zIndex: parseInt(e.target.value) || 0 })}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PropertyPanel;
