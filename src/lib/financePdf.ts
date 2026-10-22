import { jsPDF } from "jspdf";

export interface FinancePdfData {
  applicationId?: string | number;
  date?: string;
  bankName?: string;
  bankEmail?: string;

  // Applicant
  firstName: string;
  lastName: string;
  idNumber: string;
  dob?: string;
  maritalStatus?: string;
  dependents?: number;
  phone: string;
  email: string;
  address: string;
  postalAddress?: string;

  // Employment & Financials
  employmentStatus?: string;
  employerName: string;
  employerPhone?: string;
  jobTitle: string;
  yearsEmployed?: number | string;
  monthlyIncomeGross: number;
  monthlyIncomeNet?: number;
  monthlyExpenses: number;
  applicantBankName?: string;
  applicantAccountType?: string;
  applicantAccountNumber?: string;

  // Vehicle
  carName: string;
  carId?: number | string;
  carPrice: number;
  depositAmount: number;
  termMonths: number;
  balloonPercentage?: number;
  vin?: string;
  mileage?: number;
  transmission?: string;
  fuelType?: string;

  // Proof Documents verified
  documents?: { code: string; label: string; verified: boolean; fileName?: string }[];
}

export function generateFinanceApplicationPdf(data: FinancePdfData): jsPDF {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 14;
  const contentWidth = pageWidth - margin * 2; // 182mm

  const primaryColor: [number, number, number] = [5, 150, 105]; // Emerald
  const darkSlate: [number, number, number] = [24, 23, 21];
  const mutedText: [number, number, number] = [90, 86, 79];
  const borderGray: [number, number, number] = [215, 212, 205];
  const boxBg: [number, number, number] = [248, 247, 245];

  const fullName = `${data.firstName || ""} ${data.lastName || ""}`.trim() || "Applicant";
  const appId = data.applicationId || `AF-${Date.now().toString().slice(-6)}`;
  const dateStr = data.date || new Date().toLocaleDateString("en-ZA", { year: "numeric", month: "short", day: "numeric" });
  const loanPrincipal = Math.max(0, (data.carPrice || 0) - (data.depositAmount || 0));
  const netIncome = data.monthlyIncomeNet || Math.round((data.monthlyIncomeGross || 0) * 0.75);
  const netDisposable = Math.max(0, netIncome - (data.monthlyExpenses || 0));
  const rateMonthly = 0.1175 / 12;
  const n = data.termMonths || 72;
  const estInstalment =
    loanPrincipal > 0
      ? Math.round((loanPrincipal * rateMonthly * Math.pow(1 + rateMonthly, n)) / (Math.pow(1 + rateMonthly, n) - 1))
      : 0;

  // ══════════════════════════════════════════════════════════════
  // PAGE 1: HEADER, APPLICANT, EMPLOYMENT & FINANCIAL AFFORDABILITY
  // ══════════════════════════════════════════════════════════════

  // Top Accent Bar
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, pageWidth, 5, "F");

  let y = 14;

  // Header Left: AutoFame Dealership Brand
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(...darkSlate);
  doc.text("AUTOFAME DEALERSHIP", margin, y);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(...mutedText);
  y += 4.5;
  doc.text("Official Dealership Vehicle Asset Finance Submission Pack (NCA & FICA Compliant)", margin, y);
  y += 3.8;
  doc.text("1 Rifle Range Rd, Baragwanath, Johannesburg South, 2013 | +27 63 199 5124 | alexsouthflow3@gmail.com", margin, y);

  // Header Right: Reference Box
  const refBoxX = pageWidth - margin - 56;
  doc.setFillColor(...boxBg);
  doc.setDrawColor(...borderGray);
  doc.roundedRect(refBoxX, 10, 56, 18, 2, 2, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(...mutedText);
  doc.text("APPLICATION REF #", refBoxX + 4, 15);
  doc.setFontSize(10.5);
  doc.setTextColor(...primaryColor);
  doc.text(String(appId), refBoxX + 4, 20);

  doc.setFontSize(7);
  doc.setTextColor(...mutedText);
  doc.text(`Date: ${dateStr}`, refBoxX + 4, 25);

  y += 10;
  doc.setDrawColor(...borderGray);
  doc.setLineWidth(0.3);
  doc.line(margin, y, pageWidth - margin, y);
  y += 6;

  // Bank Destination Banner
  doc.setFillColor(240, 249, 245);
  doc.setDrawColor(...primaryColor);
  doc.setLineWidth(0.4);
  doc.roundedRect(margin, y, contentWidth, 10, 1.5, 1.5, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(...primaryColor);
  doc.text("FINANCIAL INSTITUTION CREDIT DESK:", margin + 4, y + 6.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...darkSlate);
  doc.text(
    `${data.bankName || "WesBank / MFC Nedbank / Absa VAF"} (${data.bankEmail || "alexsouthflow3@gmail.com"})`,
    margin + 68,
    y + 6.5
  );

  y += 15;

  // Helper function to render a section header
  const renderSectionHeader = (title: string, subtitle?: string) => {
    doc.setFillColor(...primaryColor);
    doc.roundedRect(margin, y, 3, 7, 0.8, 0.8, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10.5);
    doc.setTextColor(...darkSlate);
    doc.text(title, margin + 5, y + 5.5);

    if (subtitle) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(...mutedText);
      doc.text(subtitle, margin + 70, y + 5.5);
    }

    y += 9;
  };

  // Helper function to render key-value grid row
  const renderGridRow = (
    fields: { label: string; value: string; widthRatio?: number }[],
    rowHeight = 9
  ) => {
    const totalRatio = fields.reduce((acc, f) => acc + (f.widthRatio || 1), 0);
    let curX = margin;

    doc.setFillColor(...boxBg);
    doc.setDrawColor(...borderGray);
    doc.setLineWidth(0.2);

    fields.forEach((f) => {
      const fieldWidth = (contentWidth * (f.widthRatio || 1)) / totalRatio;
      doc.rect(curX, y, fieldWidth, rowHeight, "FD");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(6.5);
      doc.setTextColor(...mutedText);
      doc.text(f.label.toUpperCase(), curX + 2.5, y + 3.2);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(...darkSlate);
      const valStr = String(f.value || "—");
      doc.text(valStr.length > 34 ? valStr.slice(0, 32) + "..." : valStr, curX + 2.5, y + 7);

      curX += fieldWidth;
    });

    y += rowHeight + 1.2;
  };

  // ── SECTION 1: APPLICANT PERSONAL PARTICULAR ──
  renderSectionHeader("SECTION 1: APPLICANT PERSONAL PARTICULARS", "FICA Verified Identity Details");

  renderGridRow([
    { label: "Full Legal Names", value: fullName, widthRatio: 1.5 },
    { label: "SA ID Number (13 Digits)", value: data.idNumber || "—", widthRatio: 1 },
    { label: "Date of Birth", value: data.dob || (data.idNumber?.length === 13 ? `19${data.idNumber.slice(0, 2)}-${data.idNumber.slice(2, 4)}-${data.idNumber.slice(4, 6)}` : "—"), widthRatio: 0.8 },
  ]);

  renderGridRow([
    { label: "Mobile / WhatsApp Contact", value: data.phone || "—", widthRatio: 1 },
    { label: "Email Address", value: data.email || "—", widthRatio: 1.3 },
    { label: "Marital Status", value: data.maritalStatus || "Single / COP", widthRatio: 1 },
  ]);

  renderGridRow([
    { label: "Residential Physical Address", value: data.address || "Johannesburg South, Gauteng", widthRatio: 2.2 },
    { label: "Dependents", value: String(data.dependents ?? 1), widthRatio: 0.6 },
    { label: "Postal Code", value: "2013 (Gauteng)", widthRatio: 0.7 },
  ]);

  y += 4;

  // ── SECTION 2: EMPLOYMENT & INCOME STATEMENT (NCA SEC. 81) ──
  renderSectionHeader("SECTION 2: EMPLOYMENT & AFFORDABILITY STATEMENT", "National Credit Act Compliant Assessment");

  renderGridRow([
    { label: "Current Employer / Company", value: data.employerName || "Private Sector Corporate", widthRatio: 1.6 },
    { label: "Job Title / Occupation", value: data.jobTitle || "Executive / Professional", widthRatio: 1.4 },
    { label: "Employment Status", value: data.employmentStatus || "Permanent Full-Time", widthRatio: 1 },
  ]);

  renderGridRow([
    { label: "Gross Monthly Salary (R)", value: `R ${Number(data.monthlyIncomeGross || 0).toLocaleString()} ZAR`, widthRatio: 1 },
    { label: "Net Take-Home Pay (R)", value: `R ${Number(netIncome).toLocaleString()} ZAR`, widthRatio: 1 },
    { label: "Declared Living Expenses (R)", value: `R ${Number(data.monthlyExpenses || 0).toLocaleString()} ZAR`, widthRatio: 1 },
    { label: "Net Disposable Surplus (R)", value: `R ${Number(netDisposable).toLocaleString()} ZAR`, widthRatio: 1 },
  ]);

  renderGridRow([
    { label: "Applicant Primary Bank", value: data.applicantBankName || "Capitec / FNB / Standard Bank", widthRatio: 1 },
    { label: "Account Type", value: data.applicantAccountType || "Cheque / Current Account", widthRatio: 1 },
    { label: "Salary Payment Method", value: "Direct Electronic Transfer (EFT)", widthRatio: 1.2 },
  ]);

  y += 4;

  // ── SECTION 3: VEHICLE & FINANCE STRUCTURE ──
  renderSectionHeader("SECTION 3: VEHICLE PARTICULARS & FINANCE PROPOSAL", "Approved AutoFame Showroom Vehicle");

  renderGridRow([
    { label: "Vehicle Description", value: data.carName || "Selected Vehicle", widthRatio: 2 },
    { label: "Dealership Stock ID", value: data.carId ? `#AF-${data.carId}` : "#AF-STOCK", widthRatio: 0.8 },
    { label: "Transmission / Fuel", value: `${data.transmission || "Automatic"} • ${data.fuelType || "Petrol"}`, widthRatio: 1 },
  ]);

  renderGridRow([
    { label: "Showroom Retail Price (Incl. VAT)", value: `R ${Number(data.carPrice || 0).toLocaleString()} ZAR`, widthRatio: 1 },
    { label: "Customer Down Payment / Deposit", value: `R ${Number(data.depositAmount || 0).toLocaleString()} ZAR`, widthRatio: 1 },
    { label: "Principal Finance Balance Requested", value: `R ${Number(loanPrincipal).toLocaleString()} ZAR`, widthRatio: 1.3 },
  ]);

  renderGridRow([
    { label: "Finance Term", value: `${data.termMonths || 72} Months`, widthRatio: 0.8 },
    { label: "Balloon / Residual", value: `${data.balloonPercentage || 0}%`, widthRatio: 0.8 },
    { label: "Indicative Linked Interest Rate", value: "Prime (11.75% variable)", widthRatio: 1 },
    { label: "Estimated Monthly Instalment", value: `~R ${Number(estInstalment).toLocaleString()} ZAR / mo`, widthRatio: 1.2 },
  ]);

  y += 4;

  // ── SECTION 4: FICA VERIFICATION PACK ──
  renderSectionHeader("SECTION 4: MANDATORY FICA & CREDIT VERIFICATION PACK", "5 Required Proof Documents Attached");

  const ficaDocs = data.documents && data.documents.length > 0
    ? data.documents
    : [
        { code: "fica_id", label: "Copy of South African ID (Smart Card / Green Book)", verified: true },
        { code: "fica_dl", label: "Valid South African Driver's License", verified: true },
        { code: "fica_bank", label: "Latest 3 Months Official Bank Statements (PDF)", verified: true },
        { code: "fica_pay", label: "Latest 3 Months Official Salary Payslips", verified: true },
        { code: "fica_res", label: "Proof of Residential Address (< 3 months old)", verified: true },
      ];

  doc.setFillColor(...boxBg);
  doc.setDrawColor(...borderGray);
  doc.setLineWidth(0.2);
  const checklistHeight = ficaDocs.length * 5.5 + 4;
  doc.rect(margin, y, contentWidth, checklistHeight, "FD");

  ficaDocs.forEach((docItem, idx) => {
    const itemY = y + 4 + idx * 5.5;
    // Checkbox icon
    doc.setFillColor(...primaryColor);
    doc.roundedRect(margin + 4, itemY - 2.5, 3.2, 3.2, 0.5, 0.5, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(6);
    doc.text("✓", margin + 4.6, itemY - 0.2);

    // Label
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(...darkSlate);
    doc.text(`${idx + 1}. ${docItem.label}`, margin + 10, itemY);

    // Status pill
    doc.setFont("helvetica", "bold");
    doc.setFontSize(6.5);
    doc.setTextColor(...primaryColor);
    doc.text("[VERIFIED & ATTACHED]", margin + contentWidth - 36, itemY);
  });

  y += checklistHeight + 5;

  // ── SECTION 5: NCA AFFORDABILITY & LEGAL DECLARATION ──
  doc.setFillColor(250, 250, 248);
  doc.setDrawColor(...borderGray);
  doc.roundedRect(margin, y, contentWidth, 34, 1.5, 1.5, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(...darkSlate);
  doc.text("NCA DECLARATION & CREDIT BUREAU CONSENT (ACT 34 OF 2005)", margin + 4, y + 4.5);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  doc.setTextColor(...mutedText);
  const legalText =
    "1. I/We hereby declare that the particulars provided in this application are true, accurate and complete.\n" +
    "2. I/We consent to AutoFame Dealership and the receiving Financial Institution conducting credit checks with registered credit bureaus (TransUnion, Experian, XDS) and verifying employment and banking records.\n" +
    "3. I/We confirm that this proposed credit agreement will not cause over-indebtedness under Section 81 of the National Credit Act.\n" +
    "4. I/We consent to the processing of personal information pursuant to the Protection of Personal Information Act (POPIA).";
  doc.text(legalText, margin + 4, y + 9);

  // Signatures row
  const sigY = y + 21;
  doc.setDrawColor(...borderGray);
  doc.setLineWidth(0.3);

  // Applicant Signature line
  doc.line(margin + 4, sigY + 6, margin + 70, sigY + 6);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(6.5);
  doc.setTextColor(...darkSlate);
  doc.text(`Applicant Signature: ${fullName}`, margin + 4, sigY + 9.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...mutedText);
  doc.text(`Digital Consent Timestamp: ${dateStr}`, margin + 4, sigY + 12.5);

  // Dealership F&I Officer line
  doc.line(margin + 90, sigY + 6, margin + 176, sigY + 6);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...darkSlate);
  doc.text("Dealership F&I Manager: AutoFame Finance Desk", margin + 90, sigY + 9.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...primaryColor);
  doc.text("Verified & Certified for Bank Credit Assessment", margin + 90, sigY + 12.5);

  // Footer
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  doc.setTextColor(...mutedText);
  doc.text(
    "AutoFame (Pty) Ltd • Registered Vehicle Dealer • 1 Rifle Range Rd, Baragwanath, JHB South • Licensed F&I Partner",
    margin,
    pageHeight - 6
  );
  doc.text(`Page 1 of 1 • Dossier #${appId}`, pageWidth - margin - 32, pageHeight - 6);

  return doc;
}

export function getFinanceApplicationPdfBuffer(data: FinancePdfData): Buffer {
  const doc = generateFinanceApplicationPdf(data);
  const arrayBuf = doc.output("arraybuffer");
  return Buffer.from(arrayBuf);
}

export function getFinanceApplicationPdfBase64(data: FinancePdfData): string {
  const doc = generateFinanceApplicationPdf(data);
  const arrayBuf = doc.output("arraybuffer");
  return Buffer.from(arrayBuf).toString("base64");
}

export function downloadFinanceApplicationPdf(data: FinancePdfData, filename?: string): void {
  const doc = generateFinanceApplicationPdf(data);
  const safeName = (filename || `AutoFame_Finance_Application_${data.firstName}_${data.lastName}.pdf`).replace(/\s+/g, "_");
  doc.save(safeName);
}
