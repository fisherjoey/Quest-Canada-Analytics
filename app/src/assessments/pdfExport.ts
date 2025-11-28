/**
 * PDF Export Utility for Assessment Reports
 * Professional document style aligned with Quest Canada branding
 */

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { QUEST_LOGO_BASE64 } from './questLogo';

interface AssessmentData {
  id: string;
  assessmentYear: number;
  assessorName?: string;
  assessorOrganization?: string;
  assessorEmail?: string;
  generalNotes?: string;
  overallScore?: number;
  createdAt: string;
  community?: { name: string };
  indicators?: Array<{
    indicatorNumber: number;
    indicatorName: string;
    pointsEarned: number;
    pointsPossible: number;
    percentageScore: number;
  }>;
  strengths?: Array<{
    id: string;
    description: string;
    category?: string;
  }>;
  recommendations?: Array<{
    id: string;
    indicatorNumber?: number;
    recommendationText: string;
    priorityLevel: string;
    implementationStatus: string;
    responsibleParty?: string;
  }>;
}

// Professional color palette
const COLORS = {
  black: [0, 0, 0] as [number, number, number],
  darkGray: [51, 51, 51] as [number, number, number],
  mediumGray: [102, 102, 102] as [number, number, number],
  lightGray: [153, 153, 153] as [number, number, number],
  veryLightGray: [245, 245, 245] as [number, number, number],
  white: [255, 255, 255] as [number, number, number],
  accent: [0, 128, 128] as [number, number, number], // Subtle teal for accents
  accentLight: [230, 244, 244] as [number, number, number],
};


export async function generateAssessmentPDF(
  assessment: AssessmentData
): Promise<void> {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginLeft = 25;
  const marginRight = 25;
  const contentWidth = pageWidth - marginLeft - marginRight;
  let yPos = 30;

  // Helper: Check for new page
  const checkNewPage = (requiredHeight: number): boolean => {
    if (yPos + requiredHeight > pageHeight - 25) {
      doc.addPage();
      yPos = 25;
      return true;
    }
    return false;
  };

  // Helper: Draw underlined section header
  const drawSectionHeader = (title: string) => {
    checkNewPage(20);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(...COLORS.black);
    doc.text(title, marginLeft, yPos);

    // Underline
    const textWidth = doc.getTextWidth(title);
    doc.setDrawColor(...COLORS.black);
    doc.setLineWidth(0.5);
    doc.line(marginLeft, yPos + 1, marginLeft + textWidth, yPos + 1);
    yPos += 8;
  };

  // Helper: Draw subsection header (italic)
  const drawSubsectionHeader = (title: string) => {
    checkNewPage(15);
    doc.setFont('helvetica', 'bolditalic');
    doc.setFontSize(11);
    doc.setTextColor(...COLORS.darkGray);
    doc.text(title, marginLeft, yPos);
    yPos += 6;
  };

  // Helper: Draw body text
  const drawBodyText = (text: string, indent = 0) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(...COLORS.darkGray);
    const lines = doc.splitTextToSize(text, contentWidth - indent);

    lines.forEach((line: string) => {
      checkNewPage(6);
      doc.text(line, marginLeft + indent, yPos);
      yPos += 5;
    });
  };

  // Helper: Draw labeled field
  const drawLabeledField = (label: string, value: string, indent = 0) => {
    checkNewPage(7);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...COLORS.darkGray);
    doc.text(`${label}: `, marginLeft + indent, yPos);

    const labelWidth = doc.getTextWidth(`${label}: `);
    doc.setFont('helvetica', 'normal');
    doc.text(value || 'N/A', marginLeft + indent + labelWidth, yPos);
    yPos += 6;
  };

  // Helper: Draw bullet point
  const drawBulletPoint = (text: string, indent = 5) => {
    checkNewPage(7);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(...COLORS.darkGray);

    // Bullet character
    doc.text('•', marginLeft + indent, yPos);

    // Text with wrapping
    const bulletIndent = indent + 5;
    const lines = doc.splitTextToSize(text, contentWidth - bulletIndent);
    lines.forEach((line: string, index: number) => {
      if (index > 0) checkNewPage(5);
      doc.text(line, marginLeft + bulletIndent, yPos);
      yPos += 5;
    });
  };

  // ===== TITLE PAGE HEADER WITH LOGO =====
  // Add Quest Canada logo centered at top
  const logoWidth = 60; // mm
  const logoHeight = 14.7; // maintain aspect ratio (575:141 actual dimensions)
  const logoX = (pageWidth - logoWidth) / 2;

  try {
    doc.addImage(QUEST_LOGO_BASE64, 'JPEG', logoX, yPos - 5, logoWidth, logoHeight);
    yPos += logoHeight + 8;
  } catch (e) {
    // Fallback to text if logo fails
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(...COLORS.darkGray);
    doc.text('QUEST CANADA', pageWidth / 2, yPos, { align: 'center' });
    yPos += 8;
  }

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(...COLORS.mediumGray);
  doc.text('Net-Zero Communities Accelerator Program', pageWidth / 2, yPos, { align: 'center' });
  yPos += 15;

  // Main title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(...COLORS.black);
  doc.text('Community Assessment Report', pageWidth / 2, yPos, { align: 'center' });
  yPos += 12;

  // Thin decorative line
  doc.setDrawColor(...COLORS.accent);
  doc.setLineWidth(0.75);
  doc.line(marginLeft + 40, yPos, pageWidth - marginLeft - 40, yPos);
  yPos += 15;

  // ===== ASSESSMENT INFORMATION BOX =====
  // Simple bordered box with key info
  const boxStartY = yPos;
  doc.setDrawColor(...COLORS.lightGray);
  doc.setLineWidth(0.3);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...COLORS.black);
  doc.text('Assessment Information', marginLeft, yPos);
  yPos += 8;

  // Community name
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  const communityLabel = 'Community: ';
  const communityLabelWidth = doc.getTextWidth(communityLabel);
  doc.text(communityLabel, marginLeft, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(assessment.community?.name || 'N/A', marginLeft + communityLabelWidth, yPos);
  yPos += 6;

  // Assessment year
  doc.setFont('helvetica', 'bold');
  const yearLabel = 'Assessment Year: ';
  const yearLabelWidth = doc.getTextWidth(yearLabel);
  doc.text(yearLabel, marginLeft, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(String(assessment.assessmentYear), marginLeft + yearLabelWidth, yPos);

  // Generated date (right aligned)
  const dateText = `Generated: ${new Date().toLocaleDateString('en-CA', { year: 'numeric', month: 'long', day: 'numeric' })}`;
  doc.text(dateText, pageWidth - marginRight, yPos, { align: 'right' });
  yPos += 6;

  // Direct URL to assessment
  doc.setFont('helvetica', 'bold');
  const urlLabel = 'View Online: ';
  const urlLabelWidth = doc.getTextWidth(urlLabel);
  doc.text(urlLabel, marginLeft, yPos);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLORS.accent);
  const assessmentUrl = `https://cpsc405.joeyfishertech.com/assessments/${assessment.id}`;
  const availableWidth = contentWidth - urlLabelWidth;
  const urlLines = doc.splitTextToSize(assessmentUrl, availableWidth);
  urlLines.forEach((line: string, index: number) => {
    doc.text(line, marginLeft + (index === 0 ? urlLabelWidth : 0), yPos);
    if (index < urlLines.length - 1) yPos += 5;
  });
  doc.setTextColor(...COLORS.black);
  yPos += 10;

  // Overall Score display (if available)
  if (assessment.overallScore !== undefined) {
    yPos += 5;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(...COLORS.accent);
    doc.text(`Overall Score: ${assessment.overallScore}%`, pageWidth / 2, yPos, { align: 'center' });
    doc.setTextColor(...COLORS.black);
    yPos += 5;
  }

  // Draw box around assessment info
  doc.setDrawColor(...COLORS.lightGray);
  doc.setLineWidth(0.3);
  doc.rect(marginLeft - 3, boxStartY - 5, contentWidth + 6, yPos - boxStartY + 8);
  yPos += 15;

  // ===== SUMMARY STATISTICS =====
  drawSectionHeader('Summary');
  yPos += 2;

  const indicatorCount = assessment.indicators?.length || 0;
  const strengthCount = assessment.strengths?.length || 0;
  const recCount = assessment.recommendations?.length || 0;

  drawBulletPoint(`${indicatorCount} benchmark indicators assessed`);
  drawBulletPoint(`${strengthCount} community strengths identified`);
  drawBulletPoint(`${recCount} recommendations for improvement`);
  yPos += 8;

  // ===== ASSESSOR INFORMATION =====
  drawSectionHeader('Assessor Information');
  yPos += 2;

  drawLabeledField('Name', assessment.assessorName || 'N/A');
  drawLabeledField('Organization', assessment.assessorOrganization || 'N/A');
  drawLabeledField('Email', assessment.assessorEmail || 'N/A');
  yPos += 8;

  // ===== GENERAL NOTES =====
  if (assessment.generalNotes) {
    drawSectionHeader('Notes');
    yPos += 2;
    drawBodyText(assessment.generalNotes);
    yPos += 8;
  }

  // ===== DASHBOARD VISUALIZATION =====
  doc.addPage();
  yPos = 25;

  drawSectionHeader('Dashboard Visualization');
  yPos += 5;

  try {
    const grafanaBaseUrl = 'https://cpsc405.joeyfishertech.com/grafana';
    const renderUrl = `${grafanaBaseUrl}/render/d/assessment-detail/assessment-detail-dashboard?orgId=1&var-assessment_id=${assessment.id}&width=1200&height=1600&theme=light&kiosk`;

    const response = await fetch(renderUrl);
    if (response.ok) {
      const blob = await response.blob();
      const imgData = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });

      const imgWidth = contentWidth;
      // Match Grafana render aspect ratio (1200x1600 = 3:4 portrait)
      const imgHeight = imgWidth * 1.333; // 3:4 aspect ratio

      doc.addImage(imgData, 'PNG', marginLeft, yPos, imgWidth, imgHeight);
      yPos += imgHeight + 10;
    } else {
      throw new Error('Dashboard render unavailable');
    }
  } catch (error) {
    console.error('Failed to capture dashboard:', error);

    doc.setFont('helvetica', 'italic');
    doc.setFontSize(10);
    doc.setTextColor(...COLORS.mediumGray);
    doc.text('Interactive dashboard available online:', marginLeft, yPos);
    yPos += 6;

    const dashboardUrl = `https://cpsc405.joeyfishertech.com/assessments/${assessment.id}`;
    doc.setTextColor(...COLORS.accent);
    doc.textWithLink(dashboardUrl, marginLeft, yPos, { url: dashboardUrl });
    yPos += 20;
  }

  // ===== INDICATOR SCORES =====
  doc.addPage();
  yPos = 25;

  drawSectionHeader('Benchmark Indicator Scores');
  yPos += 5;

  if (assessment.indicators && assessment.indicators.length > 0) {
    autoTable(doc, {
      startY: yPos,
      head: [['#', 'Indicator', 'Points Earned', 'Score']],
      body: assessment.indicators.map(ind => [
        ind.indicatorNumber,
        ind.indicatorName,
        `${ind.pointsEarned} / ${ind.pointsPossible}`,
        `${Math.round(ind.percentageScore)}%`,
      ]),
      headStyles: {
        fillColor: COLORS.veryLightGray,
        textColor: COLORS.black,
        fontStyle: 'bold',
        lineWidth: 0.1,
        lineColor: COLORS.lightGray,
      },
      bodyStyles: {
        textColor: COLORS.darkGray,
        lineWidth: 0.1,
        lineColor: [220, 220, 220],
      },
      alternateRowStyles: {
        fillColor: COLORS.white,
      },
      columnStyles: {
        0: { cellWidth: 12, halign: 'center' },
        1: { cellWidth: 'auto' },
        2: { cellWidth: 30, halign: 'center' },
        3: { cellWidth: 22, halign: 'center' },
      },
      margin: { left: marginLeft, right: marginRight },
      styles: {
        fontSize: 9,
        cellPadding: 3,
      },
      tableLineColor: COLORS.lightGray,
      tableLineWidth: 0.1,
    });

    yPos = (doc as any).lastAutoTable.finalY + 15;
  } else {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(10);
    doc.setTextColor(...COLORS.mediumGray);
    doc.text('No indicator scores recorded.', marginLeft, yPos);
    yPos += 15;
  }

  // ===== STRENGTHS =====
  checkNewPage(50);
  drawSectionHeader('Identified Strengths');
  yPos += 5;

  if (assessment.strengths && assessment.strengths.length > 0) {
    assessment.strengths.forEach((strength, index) => {
      checkNewPage(15);

      // Category label
      if (strength.category) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(...COLORS.mediumGray);
        doc.text(`[${strength.category}]`, marginLeft, yPos);
        yPos += 5;
      }

      // Description as bullet
      drawBulletPoint(strength.description);
      yPos += 3;
    });
  } else {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(10);
    doc.setTextColor(...COLORS.mediumGray);
    doc.text('No strengths recorded.', marginLeft, yPos);
    yPos += 10;
  }

  // ===== RECOMMENDATIONS =====
  checkNewPage(50);
  yPos += 10;
  drawSectionHeader('Recommendations');
  yPos += 5;

  if (assessment.recommendations && assessment.recommendations.length > 0) {
    autoTable(doc, {
      startY: yPos,
      head: [['Ind.', 'Recommendation', 'Priority', 'Status']],
      body: assessment.recommendations.map(rec => [
        rec.indicatorNumber ? `#${rec.indicatorNumber}` : '—',
        rec.recommendationText,
        rec.priorityLevel.charAt(0) + rec.priorityLevel.slice(1).toLowerCase(),
        rec.implementationStatus.replace('_', ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase()),
      ]),
      headStyles: {
        fillColor: COLORS.veryLightGray,
        textColor: COLORS.black,
        fontStyle: 'bold',
        lineWidth: 0.1,
        lineColor: COLORS.lightGray,
      },
      bodyStyles: {
        textColor: COLORS.darkGray,
        lineWidth: 0.1,
        lineColor: [220, 220, 220],
      },
      columnStyles: {
        0: { cellWidth: 15, halign: 'center' },
        1: { cellWidth: 'auto' },
        2: { cellWidth: 22, halign: 'center' },
        3: { cellWidth: 28, halign: 'center' },
      },
      margin: { left: marginLeft, right: marginRight },
      styles: {
        fontSize: 9,
        cellPadding: 3,
      },
      didParseCell: (data) => {
        // Subtle priority coloring
        if (data.column.index === 2 && data.section === 'body') {
          const priority = (data.cell.raw as string).toUpperCase();
          if (priority === 'HIGH') {
            data.cell.styles.textColor = [180, 60, 60];
            data.cell.styles.fontStyle = 'bold';
          } else if (priority === 'MEDIUM') {
            data.cell.styles.textColor = [150, 110, 40];
          }
        }
        // Status coloring
        if (data.column.index === 3 && data.section === 'body') {
          const status = (data.cell.raw as string).toUpperCase();
          if (status === 'COMPLETED') {
            data.cell.styles.textColor = [40, 120, 60];
          } else if (status.includes('PROGRESS')) {
            data.cell.styles.textColor = [40, 90, 140];
          }
        }
      },
    });

    yPos = (doc as any).lastAutoTable.finalY + 10;
  } else {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(10);
    doc.setTextColor(...COLORS.mediumGray);
    doc.text('No recommendations recorded.', marginLeft, yPos);
  }

  // ===== PAGE FOOTER =====
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);

    // Footer line
    doc.setDrawColor(...COLORS.lightGray);
    doc.setLineWidth(0.3);
    doc.line(marginLeft, pageHeight - 15, pageWidth - marginRight, pageHeight - 15);

    // Footer text
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...COLORS.mediumGray);
    doc.text('Quest Canada | Net-Zero Communities Accelerator', marginLeft, pageHeight - 10);
    doc.text(`Page ${i} of ${pageCount}`, pageWidth - marginRight, pageHeight - 10, { align: 'right' });
  }

  // Save the PDF
  const communityName = assessment.community?.name || 'Assessment';
  const fileName = `${communityName}_${assessment.assessmentYear}_Report.pdf`;
  doc.save(fileName.replace(/[^a-zA-Z0-9_-]/g, '_'));
}
