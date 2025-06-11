import React, { useState, useRef, useCallback } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  MapPin, 
  Target, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw,
  Layers,
  Grid,
  Crosshair,
  Save,
  X
} from 'lucide-react';

interface SpatialCoordinate {
  x: number;
  y: number;
  z?: number;
}

interface DrawingReference {
  id: number;
  drawingNumber: string;
  title: string;
  thumbnailUrl?: string;
  buildGroup: string;
}

interface SpatialIssuePickerProps {
  isOpen: boolean;
  onClose: () => void;
  onLocationSelect: (coordinates: SpatialCoordinate, drawingId?: number, locationReference?: string) => void;
  drawings: DrawingReference[];
  existingCoordinates?: SpatialCoordinate;
  existingDrawingId?: number;
}

const SpatialIssuePicker: React.FC<SpatialIssuePickerProps> = ({
  isOpen,
  onClose,
  onLocationSelect,
  drawings,
  existingCoordinates,
  existingDrawingId
}) => {
  const [selectedDrawing, setSelectedDrawing] = useState<DrawingReference | null>(
    drawings.find(d => d.id === existingDrawingId) || drawings[0] || null
  );
  const [coordinates, setCoordinates] = useState<SpatialCoordinate | null>(
    existingCoordinates || null
  );
  const [isPickingMode, setIsPickingMode] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleImageClick = useCallback((event: React.MouseEvent<HTMLImageElement>) => {
    if (!isPickingMode || !imageRef.current) return;

    const rect = imageRef.current.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;

    // Clamp coordinates to 0-1 range
    const clampedX = Math.max(0, Math.min(1, x));
    const clampedY = Math.max(0, Math.min(1, y));

    setCoordinates({
      x: clampedX,
      y: clampedY,
      z: 0.5 // Default Z level (can be adjusted)
    });
    setIsPickingMode(false);
  }, [isPickingMode]);

  const handleSave = () => {
    if (coordinates) {
      const locationReference = selectedDrawing 
        ? `${selectedDrawing.drawingNumber} - ${selectedDrawing.title}`
        : 'General vessel location';
      
      onLocationSelect(coordinates, selectedDrawing?.id, locationReference);
      onClose();
    }
  };

  const resetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const getDrawingsByGroup = () => {
    const grouped = drawings.reduce((acc, drawing) => {
      if (!acc[drawing.buildGroup]) {
        acc[drawing.buildGroup] = [];
      }
      acc[drawing.buildGroup].push(drawing);
      return acc;
    }, {} as Record<string, DrawingReference[]>);
    
    return grouped;
  };

  const groupedDrawings = getDrawingsByGroup();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-6xl h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Select Issue Location
          </DialogTitle>
          <DialogDescription>
            Click on the vessel plan to pinpoint the exact location of the issue. 
            Choose a drawing and click on the specific area where the issue is located.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 h-full">
          {/* Drawing Selection */}
          <div className="lg:col-span-1 space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Select Drawing</CardTitle>
                <CardDescription>
                  Choose the appropriate vessel plan
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(groupedDrawings).map(([group, groupDrawings]) => (
                    <div key={group}>
                      <h4 className="text-sm font-medium text-muted-foreground mb-2 capitalize">
                        {group.replace('_', ' ')}
                      </h4>
                      <div className="space-y-2">
                        {groupDrawings.map((drawing) => (
                          <div
                            key={drawing.id}
                            className={`p-2 border rounded cursor-pointer transition-colors hover:bg-muted/50 ${
                              selectedDrawing?.id === drawing.id ? 'bg-muted border-primary' : ''
                            }`}
                            onClick={() => setSelectedDrawing(drawing)}
                          >
                            <div className="text-sm font-medium truncate">
                              {drawing.drawingNumber}
                            </div>
                            <div className="text-xs text-muted-foreground truncate">
                              {drawing.title}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Coordinate Display */}
            {coordinates && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Selected Location</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">X:</span>
                      <span className="font-mono">{(coordinates.x * 100).toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Y:</span>
                      <span className="font-mono">{(coordinates.y * 100).toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Level:</span>
                      <span className="font-mono">{((coordinates.z || 0) * 100).toFixed(1)}%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Controls */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">View Controls</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Button
                    variant={isPickingMode ? "default" : "outline"}
                    size="sm"
                    className="w-full"
                    onClick={() => setIsPickingMode(!isPickingMode)}
                  >
                    <Crosshair className="h-4 w-4 mr-2" />
                    {isPickingMode ? 'Cancel Picking' : 'Pick Location'}
                  </Button>
                  
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setZoom(Math.min(3, zoom * 1.2))}
                    >
                      <ZoomIn className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setZoom(Math.max(0.5, zoom / 1.2))}
                    >
                      <ZoomOut className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={resetView}
                    >
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="text-xs text-muted-foreground">
                    Zoom: {(zoom * 100).toFixed(0)}%
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Drawing Viewer */}
          <div className="lg:col-span-3">
            <Card className="h-full">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base">
                      {selectedDrawing?.drawingNumber || 'No Drawing Selected'}
                    </CardTitle>
                    {selectedDrawing && (
                      <CardDescription>
                        {selectedDrawing.title}
                      </CardDescription>
                    )}
                  </div>
                  
                  {isPickingMode && (
                    <Badge variant="secondary" className="animate-pulse">
                      <Target className="h-3 w-3 mr-1" />
                      Click to place pin
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-0 h-full">
                <div
                  ref={containerRef}
                  className={`relative h-full bg-gray-100 overflow-hidden ${
                    isPickingMode ? 'cursor-crosshair' : 'cursor-move'
                  }`}
                  style={{
                    backgroundImage: 'radial-gradient(circle, rgba(0,0,0,0.1) 1px, transparent 1px)',
                    backgroundSize: '20px 20px'
                  }}
                >
                  {selectedDrawing ? (
                    <>
                      {/* Drawing Image */}
                      <img
                        ref={imageRef}
                        src={selectedDrawing.thumbnailUrl || '/api/placeholder-drawing.svg'}
                        alt={selectedDrawing.title}
                        className="w-full h-full object-contain select-none"
                        style={{
                          transform: `scale(${zoom}) translate(${pan.x}px, ${pan.y}px)`,
                          transformOrigin: 'center center'
                        }}
                        onClick={handleImageClick}
                        onDragStart={(e) => e.preventDefault()}
                      />
                      
                      {/* Coordinate Grid Overlay */}
                      <div className="absolute inset-0 pointer-events-none">
                        <svg className="w-full h-full" style={{ opacity: 0.3 }}>
                          {/* Grid lines */}
                          {[...Array(11)].map((_, i) => (
                            <g key={i}>
                              <line
                                x1={`${i * 10}%`}
                                y1="0%"
                                x2={`${i * 10}%`}
                                y2="100%"
                                stroke="rgba(59, 130, 246, 0.3)"
                                strokeWidth="1"
                              />
                              <line
                                x1="0%"
                                y1={`${i * 10}%`}
                                x2="100%"
                                y2={`${i * 10}%`}
                                stroke="rgba(59, 130, 246, 0.3)"
                                strokeWidth="1"
                              />
                            </g>
                          ))}
                        </svg>
                      </div>
                      
                      {/* Selected Location Pin */}
                      {coordinates && (
                        <div
                          className="absolute transform -translate-x-1/2 -translate-y-full pointer-events-none z-10"
                          style={{
                            left: `${coordinates.x * 100}%`,
                            top: `${coordinates.y * 100}%`,
                          }}
                        >
                          <div className="relative">
                            <div className="w-6 h-6 bg-red-500 rounded-full border-2 border-white shadow-lg flex items-center justify-center">
                              <MapPin className="h-3 w-3 text-white" />
                            </div>
                            <div className="absolute -top-1 -left-1 w-8 h-8 bg-red-500/30 rounded-full animate-ping"></div>
                            
                            {/* Coordinate Tooltip */}
                            <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-black text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                              {(coordinates.x * 100).toFixed(1)}%, {(coordinates.y * 100).toFixed(1)}%
                            </div>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center">
                        <Layers className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-medium mb-2">No Drawing Selected</h3>
                        <p className="text-muted-foreground">
                          Choose a drawing from the list to start pinpointing the issue location
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="text-sm text-muted-foreground">
            {coordinates ? (
              <>
                Location selected at ({(coordinates.x * 100).toFixed(1)}%, {(coordinates.y * 100).toFixed(1)}%)
                {selectedDrawing && ` on ${selectedDrawing.drawingNumber}`}
              </>
            ) : (
              'Click "Pick Location" then click on the drawing to select a precise location'
            )}
          </div>
          
          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose}>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={!coordinates}
            >
              <Save className="h-4 w-4 mr-2" />
              Use This Location
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SpatialIssuePicker; 