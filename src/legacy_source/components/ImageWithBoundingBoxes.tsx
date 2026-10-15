
import React, { useRef, useState, useEffect, useCallback } from 'react';
import type { OralIssue } from '../types';

interface ImageWithBoundingBoxesProps {
  imageSrc: string;
  issues: OralIssue[];
  renderBoundingBoxContent: (issue: OralIssue, index: number) => React.ReactNode;
  imageClassName?: string;
  containerClassName?: string;
}

const ImageWithBoundingBoxes: React.FC<ImageWithBoundingBoxesProps> = ({
  imageSrc,
  issues,
  renderBoundingBoxContent,
  imageClassName = "object-contain w-full h-full",
  containerClassName = "relative w-full h-full flex justify-center items-center overflow-hidden bg-gray-900",
}) => {
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [imageMetrics, setImageMetrics] = useState<{
    renderedWidth: number;
    renderedHeight: number;
    offsetX: number;
    offsetY: number;
  } | null>(null);

  const calculateImageMetrics = useCallback(() => {
    const img = imgRef.current;
    const container = containerRef.current;

    if (!img || !container || !img.naturalWidth || !img.naturalHeight) {
      setImageMetrics(null);
      return;
    }

    const naturalWidth = img.naturalWidth;
    const naturalHeight = img.naturalHeight;
    const containerWidth = container.offsetWidth;
    const containerHeight = container.offsetHeight;

    const imgAspectRatio = naturalWidth / naturalHeight;
    const containerAspectRatio = containerWidth / containerHeight;

    let renderedWidth, renderedHeight, offsetX, offsetY;

    // FIX: Logika kalkulasi harus sinkron dengan CSS object-contain
    if (imgAspectRatio > containerAspectRatio) {
      // Gambar lebih lebar dari kontainer (lebar terkunci ke kontainer)
      renderedWidth = containerWidth;
      renderedHeight = containerWidth / imgAspectRatio;
      offsetX = 0;
      offsetY = (containerHeight - renderedHeight) / 2;
    } else {
      // Gambar lebih tinggi dari kontainer (tinggi terkunci ke kontainer)
      renderedHeight = containerHeight;
      renderedWidth = containerHeight * imgAspectRatio;
      offsetX = (containerWidth - renderedWidth) / 2;
      offsetY = 0;
    }

    setImageMetrics({
      renderedWidth: Math.max(0, renderedWidth),
      renderedHeight: Math.max(0, renderedHeight),
      offsetX: Math.max(0, offsetX),
      offsetY: Math.max(0, offsetY),
    });
  }, []);

  useEffect(() => {
    const img = imgRef.current;
    if (img) {
      const handleLoad = () => calculateImageMetrics();
      img.addEventListener('load', handleLoad);
      window.addEventListener('resize', calculateImageMetrics);
      if (img.complete) calculateImageMetrics();
      
      return () => {
        img.removeEventListener('load', handleLoad);
        window.removeEventListener('resize', calculateImageMetrics);
      };
    }
  }, [imageSrc, calculateImageMetrics]);

  return (
    <div ref={containerRef} className={containerClassName}>
      <img
        ref={imgRef}
        src={imageSrc}
        alt="Visual Evidence"
        className={imageClassName}
      />
      {imageMetrics && issues.map((issue, issueIndex) => {
        const { boundingBox } = issue;
        const { renderedWidth, renderedHeight, offsetX, offsetY } = imageMetrics;

        // Koordinat dari AI adalah 0-100 (persentase dari dimensi asli gambar)
        const finalLeft = offsetX + (boundingBox.x / 100) * renderedWidth;
        const finalTop = offsetY + (boundingBox.y / 100) * renderedHeight;
        const finalWidth = (boundingBox.width / 100) * renderedWidth;
        const finalHeight = (boundingBox.height / 100) * renderedHeight;

        return (
          <div
            key={issueIndex}
            style={{
              position: 'absolute',
              left: `${finalLeft}px`,
              top: `${finalTop}px`,
              width: `${finalWidth}px`,
              height: `${finalHeight}px`,
              pointerEvents: 'none',
              zIndex: 10
            }}
          >
            {renderBoundingBoxContent(issue, issueIndex)}
          </div>
        );
      })}
    </div>
  );
};

export default ImageWithBoundingBoxes;
