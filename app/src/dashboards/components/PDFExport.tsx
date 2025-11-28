/**
 * PDF Export Component
 * Exports dashboard content to PDF using jsPDF and html2canvas
 */

import React, { useState, useRef } from 'react';
import { FileDown, Loader2 } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface PDFExportProps {
  contentRef: React.RefObject<HTMLDivElement | null>;
  filename?: string;
  title?: string;
  subtitle?: string;
  className?: string;
}

export function PDFExport({
  contentRef,
  filename = 'dashboard-report',
  title = 'Quest Canada Dashboard Report',
  subtitle,
  className = '',
}: PDFExportProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    if (!contentRef.current) {
      console.error('No content reference provided');
      return;
    }

    setIsExporting(true);

    try {
      // Create canvas from the content
      const canvas = await html2canvas(contentRef.current, {
        scale: 2, // Higher resolution
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
      });

      const imgData = canvas.toDataURL('image/png');

      // Calculate dimensions
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      // Create PDF
      const pdf = new jsPDF('p', 'mm', 'a4');

      // Add Quest Canada branding header
      pdf.setFillColor(0, 169, 166); // Quest teal
      pdf.rect(0, 0, 210, 25, 'F');

      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(18);
      pdf.setFont('helvetica', 'bold');
      pdf.text(title, 15, 15);

      if (subtitle) {
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        pdf.text(subtitle, 15, 21);
      }

      // Add timestamp
      pdf.setFontSize(8);
      pdf.text(`Generated: ${new Date().toLocaleString()}`, 210 - 15, 15, { align: 'right' });

      // Calculate starting position after header
      const headerHeight = 30;
      let position = headerHeight;
      let pageNumber = 1;

      // Add content
      const contentStartY = headerHeight;
      const availableHeight = pageHeight - contentStartY - 15; // Leave margin at bottom

      if (imgHeight <= availableHeight) {
        // Content fits on one page
        pdf.addImage(imgData, 'PNG', 5, contentStartY, imgWidth - 10, imgHeight);
      } else {
        // Content spans multiple pages
        let remainingHeight = imgHeight;
        let sourceY = 0;

        while (remainingHeight > 0) {
          const sliceHeight = Math.min(remainingHeight, availableHeight);
          const sliceRatio = sliceHeight / imgHeight;

          // Create a canvas for this slice
          const sliceCanvas = document.createElement('canvas');
          sliceCanvas.width = canvas.width;
          sliceCanvas.height = canvas.height * sliceRatio;

          const ctx = sliceCanvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(
              canvas,
              0, sourceY * (canvas.height / imgHeight),
              canvas.width, sliceCanvas.height,
              0, 0,
              sliceCanvas.width, sliceCanvas.height
            );

            const sliceData = sliceCanvas.toDataURL('image/png');
            pdf.addImage(sliceData, 'PNG', 5, pageNumber === 1 ? contentStartY : 10, imgWidth - 10, sliceHeight);
          }

          remainingHeight -= sliceHeight;
          sourceY += sliceHeight;

          if (remainingHeight > 0) {
            pdf.addPage();
            pageNumber++;

            // Add header to subsequent pages
            pdf.setFillColor(0, 169, 166);
            pdf.rect(0, 0, 210, 8, 'F');
          }
        }
      }

      // Add footer to last page
      pdf.setTextColor(128, 128, 128);
      pdf.setFontSize(8);
      pdf.text(
        'Quest Canada - Supporting Canadian Communities on the Pathway to Net-Zero',
        105,
        pageHeight - 8,
        { align: 'center' }
      );

      // Save PDF
      pdf.save(`${filename}-${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error('PDF export failed:', error);
      alert('Failed to export PDF. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <button
      className={`pdf-export-btn ${className}`}
      onClick={handleExport}
      disabled={isExporting}
    >
      {isExporting ? (
        <>
          <Loader2 size={18} className="spin" />
          Exporting...
        </>
      ) : (
        <>
          <FileDown size={18} />
          Export PDF
        </>
      )}

      <style>{`
        .pdf-export-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 16px;
          background: #00a9a6;
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .pdf-export-btn:hover:not(:disabled) {
          background: #008f8c;
        }

        .pdf-export-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .pdf-export-btn .spin {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </button>
  );
}

export default PDFExport;
