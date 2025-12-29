import React from 'react';
import { ChartElement as ChartElementType } from '../../../types';

interface ChartElementProps {
  element: ChartElementType;
}

const ChartElement: React.FC<ChartElementProps> = ({ element }) => {
  // For now, display charts as images (fallback)
  // In the future, could implement actual chart rendering with libraries like Chart.js

  if (element.fallbackImage) {
    return (
      <img
        src={element.fallbackImage}
        alt={`${element.chartType} chart`}
        className="chart-element"
        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
        draggable={false}
      />
    );
  }

  return (
    <div className="chart-element">
      <div style={{ color: '#666', fontSize: '14px' }}>
        {element.chartType.toUpperCase()} Chart
      </div>
    </div>
  );
};

export default ChartElement;
