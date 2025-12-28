import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import { ProjectData } from "../types";
import { calculateEstimates } from "./geminiService";

export const generateOfferPDF = async (
  offerText: string,
  projectData: ProjectData
) => {
  // 1. Calculate price range for the header
  const estimates = calculateEstimates(projectData);
  const dateStr = new Date().toLocaleDateString('bg-BG');
  const filename = `offer_${dateStr.replace(/\./g, '-')}.pdf`;

  // 2. Create a temporary container for the PDF layout
  // We render this off-screen but visible to the DOM so html2canvas can capture it
  const container = document.createElement('div');
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  container.style.top = '0';
  container.style.width = '800px'; // Approx A4 width for screen
  container.style.backgroundColor = '#ffffff';
  container.style.padding = '40px';
  container.style.fontFamily = 'Inter, sans-serif';
  container.style.color = '#18181b'; // zinc-900

  // 3. Simple Markdown Parser for the body
  const parsedContent = offerText.split('\n').map(line => {
    const trimmed = line.trim();
    if (trimmed.startsWith('## ')) {
      return `<h3 style="font-size: 18px; font-weight: 600; margin-top: 24px; margin-bottom: 12px; border-bottom: 1px solid #e4e4e7; padding-bottom: 8px;">${trimmed.replace('## ', '')}</h3>`;
    }
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      const content = trimmed.slice(2).replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      return `<div style="margin-left: 16px; margin-bottom: 6px; display: flex;"><span style="margin-right: 8px; color: #a1a1aa;">•</span><span style="font-size: 14px; color: #3f3f46; line-height: 1.5;">${content}</span></div>`;
    }
    if (trimmed === '') {
      return '<div style="height: 10px;"></div>';
    }
    const content = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    return `<p style="font-size: 14px; margin-bottom: 12px; line-height: 1.6; color: #3f3f46;">${content}</p>`;
  }).join('');

  // 4. Construct HTML Structure
  container.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 40px;">
      <div style="display: flex; align-items: center; gap: 12px;">
        <div style="width: 48px; height: 48px; background-color: #000; border-radius: 8px; display: flex; align-items: center; justify-content: center;">
            <span style="color: #fff; font-weight: bold; font-size: 20px;">R</span>
        </div>
        <div>
            <h1 style="font-size: 24px; font-weight: 700; margin: 0;">Renovivo</h1>
            <p style="font-size: 12px; color: #71717a; margin: 0;">Интериорни решения & Ремонти</p>
        </div>
      </div>
      <div style="text-align: right;">
        <p style="font-size: 12px; color: #a1a1aa; margin: 0;">Дата</p>
        <p style="font-size: 14px; font-weight: 500; margin: 0;">${dateStr}</p>
      </div>
    </div>

    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 32px; padding: 24px; background-color: #f4f4f5; border-radius: 12px;">
      <div>
        <p style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #71717a; margin-bottom: 8px; font-weight: 600;">Клиент</p>
        <p style="font-size: 15px; font-weight: 600; margin: 0 0 4px 0;">${projectData.client.name || 'Непосочено име'}</p>
        <p style="font-size: 13px; color: #52525b; margin: 0;">${projectData.client.email || ''}</p>
        <p style="font-size: 13px; color: #52525b; margin: 0;">${projectData.client.phone || ''}</p>
      </div>
      <div style="text-align: right;">
         <p style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #71717a; margin-bottom: 8px; font-weight: 600;">Обект</p>
         <p style="font-size: 14px; font-weight: 500; margin: 0 0 4px 0;">${projectData.type}, ${projectData.totalArea} м²</p>
         <p style="font-size: 13px; color: #52525b; margin: 0;">${projectData.location}</p>
         <p style="font-size: 13px; color: #52525b; margin: 0;">${projectData.level}</p>
      </div>
    </div>

    <div style="margin-bottom: 40px; border: 1px solid #e4e4e7; border-radius: 12px; padding: 20px; text-align: center;">
        <p style="font-size: 12px; color: #71717a; margin: 0 0 8px 0; text-transform: uppercase; letter-spacing: 0.05em;">Ориентировъчен Бюджет</p>
        <p style="font-size: 28px; font-weight: 700; margin: 0; letter-spacing: -0.02em;">${estimates.totalRange}</p>
        <p style="font-size: 12px; color: #a1a1aa; margin: 8px 0 0 0;">Труд и груби строителни материали</p>
    </div>

    <div style="margin-bottom: 40px;">
      ${parsedContent}
    </div>

    <div style="border-top: 1px solid #e4e4e7; padding-top: 24px; text-align: center; color: #a1a1aa; font-size: 10px;">
      <p style="margin: 0;">Renovivo • office@renovivo.bg • +359 888 123 456</p>
      <p style="margin: 4px 0 0 0;">Офертата е валидна 30 дни. Крайната цена се потвърждава след оглед.</p>
    </div>
  `;

  document.body.appendChild(container);

  try {
    const canvas = await html2canvas(container, {
      scale: 2, // Reting quality
      useCORS: true,
      logging: false
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const imgWidth = 210; // A4 width in mm
    const pageHeight = 297; // A4 height in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    // Handle multi-page (though Renovivo offers are usually succinct)
    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    pdf.save(filename);
  } catch (error) {
    console.error("PDF Export Error:", error);
    throw new Error("Възникна грешка при генерирането на PDF.");
  } finally {
    document.body.removeChild(container);
  }
};
