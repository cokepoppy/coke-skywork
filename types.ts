export interface Message {
  role: 'user' | 'model';
  content: string;
  isError?: boolean;
  groundingMetadata?: GroundingMetadata;
}

export interface GroundingMetadata {
  groundingChunks?: {
    web?: {
      uri: string;
      title: string;
    };
  }[];
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
}

export enum ModelType {
  FLASH = 'gemini-2.5-flash',
  PRO = 'gemini-3-pro-preview', // For "Deep Thinking" simulation
}

export enum SearchMode {
  OFF = 'off',
  ON = 'on'
}

// PPT Generation Types
export interface SlideDeck {
  id?: string; // Unique ID for history tracking
  topic: string;
  theme?: string;
  generatedImage?: string; // Base64 image data
  analyzedData?: PPTPage; // Cached analysis result to avoid re-analyzing
  selectedStyle?: any; // Selected PPT style
  createdAt?: number; // Timestamp for sorting
}

// PPT History Item
export interface PPTHistoryItem {
  id: string;
  topic: string;
  thumbnail?: string; // Smaller preview image
  slideDeck: SlideDeck;
  createdAt: number;
  lastModified: number;
}

// PPT Editor Types - for converting images to editable HTML

// Base interface for all PPT elements
export interface PPTElementBase {
  id: string;
  type: 'text' | 'image' | 'shape' | 'chart';
  x: number;        // Pixel coordinate (0-1920)
  y: number;        // Pixel coordinate (0-1080)
  width: number;    // Pixel width
  height: number;   // Pixel height
  zIndex: number;   // Layer order
  rotation?: number; // Rotation angle in degrees
}

// Text element
export interface TextElement extends PPTElementBase {
  type: 'text';
  content: string;
  fontSize: number;
  fontFamily: string;
  fontWeight: 'normal' | 'bold' | '600' | '700';
  color: string;         // Hex color
  textAlign: 'left' | 'center' | 'right';
  lineHeight?: number;
  letterSpacing?: number;
}

// Shape element
export interface ShapeElement extends PPTElementBase {
  type: 'shape';
  shapeType: 'rectangle' | 'circle' | 'ellipse' | 'polygon';
  backgroundColor: string;
  borderColor?: string;
  borderWidth?: number;
  borderRadius?: number;
  opacity?: number;
}

// Image element
export interface ImageElement extends PPTElementBase {
  type: 'image';
  src: string;  // base64 or URL
  opacity?: number;
}

// Chart element
export interface ChartElement extends PPTElementBase {
  type: 'chart';
  chartType: 'bar' | 'pie' | 'line' | 'donut' | 'custom';
  // Complex charts may be kept as images
  fallbackImage?: string;
}

// Union type for all element types
export type PPTElement = TextElement | ShapeElement | ImageElement | ChartElement;

// PPT Page
export interface PPTPage {
  id: string;
  width: 1920;
  height: 1080;
  backgroundColor?: string;
  backgroundImage?: string;  // base64
  elements: PPTElement[];
}

// Edit history for undo/redo
export interface EditHistory {
  past: PPTPage[];
  present: PPTPage;
  future: PPTPage[];
}

// Type guards
export function isTextElement(element: PPTElement): element is TextElement {
  return element.type === 'text';
}

export function isShapeElement(element: PPTElement): element is ShapeElement {
  return element.type === 'shape';
}

export function isImageElement(element: PPTElement): element is ImageElement {
  return element.type === 'image';
}

export function isChartElement(element: PPTElement): element is ChartElement {
  return element.type === 'chart';
}