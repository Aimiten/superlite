// Utility function to read a file as text
export const readFileAsText = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => resolve(event.target?.result as string);
    reader.onerror = (error) => reject(error);
    reader.readAsText(file);
  });
};

// Utility function to read a file as binary and convert to base64
export const readFileAsBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        // Convert ArrayBuffer to Base64 if needed
        if (event.target.result instanceof ArrayBuffer) {
          const bytes = new Uint8Array(event.target.result);
          let binary = '';
          for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i]);
          }
          resolve(btoa(binary));
        } else {
          // If the result is already a base64 string (readAsDataURL)
          const base64 = event.target.result.toString().split(',')[1];
          resolve(base64);
        }
      } else {
        reject(new Error("Failed to read file"));
      }
    };
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
};

// Function to generate PDF from assessment results
export const generateAssessmentPDF = async (
  analysisResults: any,
  companyName?: string
): Promise<Blob> => {
  // Dynamically import jsPDF to avoid SSR issues
  const { jsPDF } = await import('jspdf');
  const autoTable = (await import('jspdf-autotable')).default;
  
  // Create a new PDF document
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Set company name or default
  const company = companyName || "Yrityksesi";
  
  // Add title
  doc.setFontSize(20);
  doc.setTextColor(85, 51, 255);
  const title = "Myyntikuntoisuuden arviointi";
  const titleWidth = doc.getStringUnitWidth(title) * doc.getFontSize() / doc.internal.scaleFactor;
  doc.text(title, (pageWidth - titleWidth) / 2, 20);
  
  // Add company name
  doc.setFontSize(16);
  doc.setTextColor(60, 60, 60);
  const companyText = `Yritys: ${company}`;
  const companyWidth = doc.getStringUnitWidth(companyText) * doc.getFontSize() / doc.internal.scaleFactor;
  doc.text(companyText, (pageWidth - companyWidth) / 2, 30);
  
  // Add date
  const today = new Date().toLocaleDateString('fi-FI');
  doc.setFontSize(12);
  doc.setTextColor(100, 100, 100);
  doc.text(`Päivämäärä: ${today}`, 14, 40);
  
  // Add total score
  doc.setFontSize(14);
  doc.setTextColor(50, 50, 50);
  doc.text("Kokonaisarvio", 14, 55);
  
  // Color based on score
  const totalScore = analysisResults?.totalScore || 0;
  let scoreColor;
  if (totalScore >= 80) scoreColor = [46, 204, 113]; // green
  else if (totalScore >= 60) scoreColor = [241, 196, 15]; // yellow
  else scoreColor = [231, 76, 60]; // red
  
  doc.setFontSize(24);
  doc.setTextColor(scoreColor[0], scoreColor[1], scoreColor[2]);
  doc.text(`${totalScore}%`, 14, 65);
  
  // Add category scores
  doc.setFontSize(14);
  doc.setTextColor(50, 50, 50);
  doc.text("Osa-alueiden arvioinnit", 14, 80);
  
  // Prepare data for category scores table
  const scores = analysisResults?.scores || {
    documentation: 0,
    process: 0,
    financial: 0,
    customers: 0
  };
  
  const categoryLabels = {
    documentation: "Dokumentaatio",
    process: "Prosessit",
    financial: "Talous",
    customers: "Asiakkaat"
  };
  
  const categoryData = Object.entries(scores).map(([key, value]) => [
    categoryLabels[key as keyof typeof categoryLabels],
    `${value}%`
  ]);
  
  // Add table for category scores
  let finalY = 85;
  autoTable(doc, {
    startY: finalY,
    head: [['Osa-alue', 'Tulos']],
    body: categoryData,
    theme: 'striped',
    headStyles: {
      fillColor: [147, 51, 234],
      textColor: [255, 255, 255]
    },
    alternateRowStyles: {
      fillColor: [240, 240, 250]
    },
    didDrawPage: function(data) {
      finalY = data.cursor.y;
    }
  });
  
  // Add recommendations
  const recommendations = analysisResults?.recommendations || [];
  if (recommendations.length > 0) {
    // Add some spacing after the previous table
    finalY += 15;
    
    doc.setFontSize(14);
    doc.setTextColor(50, 50, 50);
    doc.text("Kehitysehdotukset", 14, finalY);
    
    finalY += 10;
    
    // Create table for recommendations
    const recommendationData = recommendations.map((rec, index) => [
      `${index + 1}.`,
      rec.title,
      rec.description
    ]);
    
    autoTable(doc, {
      startY: finalY,
      head: [['#', 'Ehdotus', 'Kuvaus']],
      body: recommendationData,
      theme: 'grid',
      headStyles: {
        fillColor: [147, 51, 234],
        textColor: [255, 255, 255]
      },
      columnStyles: {
        0: { cellWidth: 10 },
        1: { cellWidth: 50 },
        2: { cellWidth: 'auto' }
      },
      styles: {
        overflow: 'linebreak',
        cellPadding: 4
      }
    });
  }
  
  // Add footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(10);
    doc.setTextColor(150, 150, 150);
    
    // Footer text
    const footerText = "© 2025 Myyntikuntoisuuden arviointi | Luotu tekoälyavusteisesti";
    const footerWidth = doc.getStringUnitWidth(footerText) * doc.getFontSize() / doc.internal.scaleFactor;
    const footerX = (pageWidth - footerWidth) / 2;
    
    doc.text(
      footerText,
      footerX,
      doc.internal.pageSize.getHeight() - 10
    );
    
    // Page numbers
    doc.text(
      `Sivu ${i} / ${pageCount}`,
      pageWidth - 20,
      doc.internal.pageSize.getHeight() - 10
    );
  }
  
  // Generate and return the PDF as a blob
  return doc.output('blob');
};

// Function to generate master PDF with more detailed information
export const generateMasterPDF = async (
  analysisResults: any,
  companyData: any = {},
  companyName?: string
): Promise<Blob> => {
  // Dynamically import jsPDF to avoid SSR issues
  const { jsPDF } = await import('jspdf');
  const autoTable = (await import('jspdf-autotable')).default;
  
  // Create a new PDF document
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Set company name or default
  const company = companyName || "Yrityksesi";
  
  // Add cover page
  doc.setFillColor(147, 51, 234); // Purple background
  doc.rect(0, 0, pageWidth, doc.internal.pageSize.getHeight(), 'F');
  
  // Add white title text
  doc.setFontSize(28);
  doc.setTextColor(255, 255, 255);
  const title = "MASTER RAPORTTI";
  const titleWidth = doc.getStringUnitWidth(title) * doc.getFontSize() / doc.internal.scaleFactor;
  doc.text(title, (pageWidth - titleWidth) / 2, 80);
  
  // Add subtitle
  doc.setFontSize(20);
  const subtitle = "Myyntikuntoisuuden kokonaisarvio";
  const subtitleWidth = doc.getStringUnitWidth(subtitle) * doc.getFontSize() / doc.internal.scaleFactor;
  doc.text(subtitle, (pageWidth - subtitleWidth) / 2, 95);
  
  // Add company name
  doc.setFontSize(24);
  const companyText = company;
  const companyWidth = doc.getStringUnitWidth(companyText) * doc.getFontSize() / doc.internal.scaleFactor;
  doc.text(companyText, (pageWidth - companyWidth) / 2, 120);
  
  // Add date
  const today = new Date().toLocaleDateString('fi-FI');
  doc.setFontSize(14);
  const dateText = `Luotu: ${today}`;
  const dateWidth = doc.getStringUnitWidth(dateText) * doc.getFontSize() / doc.internal.scaleFactor;
  doc.text(dateText, (pageWidth - dateWidth) / 2, 135);
  
  // Add "Premium" watermark
  doc.setFontSize(14);
  doc.setTextColor(255, 255, 255, 0.7); // Semi-transparent white
  const premiumText = "PREMIUM MASTER RAPORTTI";
  const premiumWidth = doc.getStringUnitWidth(premiumText) * doc.getFontSize() / doc.internal.scaleFactor;
  doc.text(premiumText, (pageWidth - premiumWidth) / 2, 200);
  
  // Add new page for content
  doc.addPage();
  
  // Table of contents
  doc.setFontSize(20);
  doc.setTextColor(50, 50, 50);
  doc.text("Sisällysluettelo", 14, 20);
  
  doc.setFontSize(12);
  doc.setTextColor(100, 100, 100);
  const tocItems = [
    { title: "1. Yritysanalyysi", page: 3 },
    { title: "2. Myyntikuntoisuuden arviointi", page: 4 },
    { title: "3. Kehitysehdotukset", page: 5 },
    { title: "4. Potentiaaliset ostajaprofiilit", page: 6 },
    { title: "5. Dokumentaation tarkistuslista", page: 7 },
    { title: "6. Myyntiprosessin suunnitelma", page: 8 }
  ];
  
  let tocY = 30;
  tocItems.forEach(item => {
    doc.text(item.title, 14, tocY);
    doc.text(`${item.page}`, pageWidth - 20, tocY);
    // Add a dotted line
    const lineStart = 14 + doc.getStringUnitWidth(item.title) * doc.getFontSize() / doc.internal.scaleFactor + 2;
    const lineEnd = pageWidth - 20 - doc.getStringUnitWidth(`${item.page}`) * doc.getFontSize() / doc.internal.scaleFactor - 2;
    const lineWidth = lineEnd - lineStart;
    const dotCount = Math.floor(lineWidth / 2);
    
    for (let i = 0; i < dotCount; i++) {
      doc.text(".", lineStart + i * 2, tocY);
    }
    
    tocY += 10;
  });
  
  // Company analysis page
  doc.addPage();
  doc.setFontSize(20);
  doc.setTextColor(147, 51, 234);
  doc.text("1. Yritysanalyysi", 14, 20);
  
  // Add company data
  doc.setFontSize(12);
  doc.setTextColor(50, 50, 50);
  let dataY = 40;
  
  if (companyData) {
    // Basic company info
    const companyInfo = [
      ["Yrityksen nimi", companyData.company_name || company],
      ["Y-tunnus", companyData.business_id || ""],
      ["Toimiala", companyData.industry || ""],
      ["Perustamisvuosi", companyData.founded || ""],
      ["Henkilöstömäärä", companyData.employees || ""],
      ["Liikevaihto", companyData.revenue ? `${companyData.revenue}€` : ""]
    ];
    
    autoTable(doc, {
      startY: 30,
      head: [['Tieto', 'Arvo']],
      body: companyInfo,
      theme: 'striped',
      headStyles: {
        fillColor: [147, 51, 234],
        textColor: [255, 255, 255]
      },
      alternateRowStyles: {
        fillColor: [240, 240, 250]
      }
    });
    
    dataY = (doc as any).lastAutoTable.finalY + 15;
  }
  
  // Add company description
  doc.setFontSize(14);
  doc.setTextColor(60, 60, 60);
  doc.text("Yrityksen kuvaus", 14, dataY);
  
  doc.setFontSize(12);
  doc.setTextColor(80, 80, 80);
  dataY += 10;
  
  const description = companyData?.description || "Ei kuvausta saatavilla.";
  const splitDescription = doc.splitTextToSize(description, pageWidth - 28);
  doc.text(splitDescription, 14, dataY);
  
  // Move to the next page - Myyntikuntoisuuden arviointi
  doc.addPage();
  doc.setFontSize(20);
  doc.setTextColor(147, 51, 234);
  doc.text("2. Myyntikuntoisuuden arviointi", 14, 20);
  
  // Add total score with visual representation
  doc.setFontSize(14);
  doc.setTextColor(50, 50, 50);
  doc.text("Kokonaisarvio", 14, 35);
  
  // Color based on score
  const totalScore = analysisResults?.totalScore || 0;
  let scoreColor;
  if (totalScore >= 80) scoreColor = [46, 204, 113]; // green
  else if (totalScore >= 60) scoreColor = [241, 196, 15]; // yellow
  else scoreColor = [231, 76, 60]; // red
  
  doc.setFontSize(24);
  doc.setTextColor(scoreColor[0], scoreColor[1], scoreColor[2]);
  doc.text(`${totalScore}%`, 14, 45);
  
  // Draw progress bar
  const barWidth = 100;
  const barHeight = 10;
  const barX = 14;
  const barY = 55;
  
  // Draw background bar
  doc.setFillColor(230, 230, 230);
  doc.rect(barX, barY, barWidth, barHeight, 'F');
  
  // Draw progress
  doc.setFillColor(scoreColor[0], scoreColor[1], scoreColor[2]);
  doc.rect(barX, barY, barWidth * (totalScore / 100), barHeight, 'F');
  
  // Add category scores
  doc.setFontSize(14);
  doc.setTextColor(50, 50, 50);
  doc.text("Osa-alueiden arvioinnit", 14, 80);
  
  // Prepare data for category scores table
  const scores = analysisResults?.scores || {
    documentation: 0,
    process: 0,
    financial: 0,
    customers: 0
  };
  
  const categoryLabels = {
    documentation: "Dokumentaatio",
    process: "Prosessit",
    financial: "Talous",
    customers: "Asiakkaat"
  };
  
  const categoryData = Object.entries(scores).map(([key, value]) => [
    categoryLabels[key as keyof typeof categoryLabels],
    `${value}%`
  ]);
  
  // Add table for category scores
  autoTable(doc, {
    startY: 85,
    head: [['Osa-alue', 'Tulos']],
    body: categoryData,
    theme: 'striped',
    headStyles: {
      fillColor: [147, 51, 234],
      textColor: [255, 255, 255]
    },
    alternateRowStyles: {
      fillColor: [240, 240, 250]
    }
  });
  
  // Recommendations page
  doc.addPage();
  doc.setFontSize(20);
  doc.setTextColor(147, 51, 234);
  doc.text("3. Kehitysehdotukset", 14, 20);
  
  // Add recommendations
  const recommendations = analysisResults?.recommendations || [];
  if (recommendations.length > 0) {
    // Create table for recommendations
    const recommendationData = recommendations.map((rec, index) => [
      `${index + 1}.`,
      rec.category,
      rec.title,
      rec.description
    ]);
    
    autoTable(doc, {
      startY: 30,
      head: [['#', 'Kategoria', 'Ehdotus', 'Kuvaus']],
      body: recommendationData,
      theme: 'grid',
      headStyles: {
        fillColor: [147, 51, 234],
        textColor: [255, 255, 255]
      },
      columnStyles: {
        0: { cellWidth: 8 },
        1: { cellWidth: 25 },
        2: { cellWidth: 40 },
        3: { cellWidth: 'auto' }
      },
      styles: {
        overflow: 'linebreak',
        cellPadding: 4
      }
    });
  } else {
    doc.setFontSize(12);
    doc.setTextColor(80, 80, 80);
    doc.text("Ei kehitysehdotuksia. Yrityksesi myyntikuntoisuus on erinomaisella tasolla!", 14, 40);
  }
  
  // Potential buyers page
  doc.addPage();
  doc.setFontSize(20);
  doc.setTextColor(147, 51, 234);
  doc.text("4. Potentiaaliset ostajaprofiilit", 14, 20);
  
  doc.setFontSize(12);
  doc.setTextColor(80, 80, 80);
  
  // Sample buyer profiles
  const buyerProfiles = [
    {
      type: "Strateginen ostaja",
      description: "Yritykset, jotka etsivät synergiaa oman liiketoimintansa kanssa.",
      suitability: 85
    },
    {
      type: "Pääomasijoittaja",
      description: "Sijoittajat, jotka etsivät skaalautuvaa liiketoimintaa.",
      suitability: 70
    },
    {
      type: "Yrittäjävetoinen ostaja",
      description: "Yksittäiset yrittäjät, jotka haluavat ottaa haltuun olemassa olevan liiketoiminnan.",
      suitability: 65
    }
  ];
  
  const buyerProfileData = buyerProfiles.map(profile => [
    profile.type,
    profile.description,
    `${profile.suitability}%`
  ]);
  
  autoTable(doc, {
    startY: 30,
    head: [['Ostajatyyppi', 'Kuvaus', 'Soveltuvuus']],
    body: buyerProfileData,
    theme: 'striped',
    headStyles: {
      fillColor: [147, 51, 234],
      textColor: [255, 255, 255]
    },
    alternateRowStyles: {
      fillColor: [240, 240, 250]
    }
  });
  
  // Documentation checklist page
  doc.addPage();
  doc.setFontSize(20);
  doc.setTextColor(147, 51, 234);
  doc.text("5. Dokumentaation tarkistuslista", 14, 20);
  
  const documentationItems = [
    ["Tilinpäätöstiedot (3-5 vuotta)", "Kriittinen", "Varmistaa taloudellisen läpinäkyvyyden"],
    ["Osakassopimukset", "Kriittinen", "Määrittelee omistussuhteet ja -ehdot"],
    ["Liiketoimintasuunnitelma", "Tärkeä", "Antaa kokonaiskuvan liiketoiminnasta"],
    ["Asiakassopimukset", "Kriittinen", "Osoittaa asiakassuhteiden stabiiliuden"],
    ["Työntekijäsopimukset", "Tärkeä", "Avainhenkilöiden sitouttaminen"],
    ["Immateriaalioikeudet", "Tärkeä", "IP-oikeuksien dokumentointi"],
    ["Kiinteistö- ja vuokrasopimukset", "Keskitaso", "Toimitilojen jatkuvuuden varmistaminen"],
    ["Ympäristövastuuraportit", "Matala", "Osoittaa vastuullisuuden"]
  ];
  
  autoTable(doc, {
    startY: 30,
    head: [['Dokumentti', 'Prioriteetti', 'Merkitys']],
    body: documentationItems,
    theme: 'grid',
    headStyles: {
      fillColor: [147, 51, 234],
      textColor: [255, 255, 255]
    }
  });
  
  // Sales process plan page
  doc.addPage();
  doc.setFontSize(20);
  doc.setTextColor(147, 51, 234);
  doc.text("6. Myyntiprosessin suunnitelma", 14, 20);
  
  const salesProcessSteps = [
    ["1", "Valmistelu", "Dokumentaation kokoaminen, arvonmääritys, myyntiesitteen laatiminen"],
    ["2", "Potentiaalisten ostajien kartoitus", "Strategisten, taloudellisten ja yrittäjäostajien tunnistaminen"],
    ["3", "Kontaktointi", "Ensikontakti potentiaalisiin ostajiin"],
    ["4", "Salassapitosopimukset", "NDA:n allekirjoittaminen kiinnostuneiden ostajien kanssa"],
    ["5", "Tietohuone", "Due diligence -materiaalien jakaminen"],
    ["6", "Tarjoukset", "Sitovien tarjousten vastaanottaminen"],
    ["7", "Neuvottelut", "Sopimusneuvottelut parhaiden tarjousten pohjalta"],
    ["8", "Kaupan toteutus", "Sopimuksen allekirjoitus ja maksun varmistus"]
  ];
  
  autoTable(doc, {
    startY: 30,
    head: [['Vaihe', 'Toimenpide', 'Kuvaus']],
    body: salesProcessSteps,
    theme: 'grid',
    headStyles: {
      fillColor: [147, 51, 234],
      textColor: [255, 255, 255]
    },
    columnStyles: {
      0: { cellWidth: 10 },
      1: { cellWidth: 40 },
      2: { cellWidth: 'auto' }
    },
    styles: {
      overflow: 'linebreak',
      cellPadding: 4
    }
  });
  
  // Add footer to all pages except cover
  const pageCount = doc.getNumberOfPages();
  for (let i = 2; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(10);
    doc.setTextColor(150, 150, 150);
    
    // Footer text
    const footerText = "© 2025 Myyntikuntoisuuden arviointi | Premium Master Raportti";
    const footerWidth = doc.getStringUnitWidth(footerText) * doc.getFontSize() / doc.internal.scaleFactor;
    const footerX = (pageWidth - footerWidth) / 2;
    
    doc.text(
      footerText,
      footerX,
      doc.internal.pageSize.getHeight() - 10
    );
    
    // Page numbers
    doc.text(
      `Sivu ${i-1} / ${pageCount-1}`,
      pageWidth - 20,
      doc.internal.pageSize.getHeight() - 10
    );
  }
  
  // Generate and return the PDF as a blob
  return doc.output('blob');
};
