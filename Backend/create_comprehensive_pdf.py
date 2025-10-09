from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak
from reportlab.lib.units import inch

def create_comprehensive_tax_pdf():
    filename = "comprehensive_tax_guide.pdf"
    doc = SimpleDocTemplate(filename, pagesize=letter, rightMargin=72, leftMargin=72, topMargin=72, bottomMargin=18)
    
    # Container for the 'Flowable' objects
    story = []
    styles = getSampleStyleSheet()
    
    # Title
    title = Paragraph("Income Tax Act 1961 - Comprehensive Guide", styles['Title'])
    story.append(title)
    story.append(Spacer(1, 12))
    
    # Table of Contents
    toc = Paragraph("Table of Contents", styles['Heading1'])
    story.append(toc)
    story.append(Spacer(1, 12))
    
    toc_items = [
        "1. Agricultural Income - Definition and Scope",
        "2. Tax Exemptions and Benefits", 
        "3. Income Tax Calculation Methods",
        "4. Filing Requirements and Procedures",
        "5. Deductions and Allowances",
        "6. Practical Examples and Case Studies"
    ]
    
    for item in toc_items:
        story.append(Paragraph(item, styles['Normal']))
    
    story.append(PageBreak())
    
    # Section 1: Agricultural Income
    section1 = Paragraph("1. Agricultural Income - Definition and Scope", styles['Heading1'])
    story.append(section1)
    story.append(Spacer(1, 12))
    
    agri_content = [
        "Agricultural income is defined under Section 2(1A) of the Income Tax Act, 1961.",
        "",
        "Agricultural income includes:",
        "• Rent or revenue derived from land situated in India and used for agricultural purposes",
        "• Income derived from such land by agriculture operations including processing of agricultural produce",
        "• Income from farm buildings owned and occupied by the cultivator or receiver of rent-in-kind",
        "",
        "Key Points:",
        "1. The land must be situated in India",
        "2. The land must be used for agricultural purposes", 
        "3. Income must be derived from basic agricultural operations",
        "",
        "Examples of Agricultural Income:",
        "• Income from cultivation of crops like wheat, rice, sugarcane",
        "• Income from growing fruits and vegetables",
        "• Rent received from agricultural land",
        "• Income from dairy farming (with conditions)",
        "• Income from poultry farming on agricultural land",
        "",
        "Non-Agricultural Income (not exempt):",
        "• Income from sale of processed goods beyond basic processing",
        "• Income from manufacturing using agricultural produce as raw material",
        "• Rent from residential buildings on agricultural land"
    ]
    
    for content in agri_content:
        if content.startswith("•"):
            story.append(Paragraph(content, styles['Normal']))
        elif content == "":
            story.append(Spacer(1, 6))
        else:
            story.append(Paragraph(content, styles['Normal']))
    
    story.append(PageBreak())
    
    # Section 2: Tax Exemptions
    section2 = Paragraph("2. Tax Exemptions and Benefits", styles['Heading1'])
    story.append(section2)
    story.append(Spacer(1, 12))
    
    exemption_content = [
        "Agricultural income is completely exempt from income tax under Section 10(1).",
        "",
        "However, agricultural income is considered for:",
        "1. Rate calculation for other income (if agricultural income > ₹5,000)",
        "2. Determining tax slab for non-agricultural income",
        "",
        "Tax Benefits Available:",
        "• No tax on pure agricultural income",
        "• Lower tax rates when combined with other income",
        "• Deductions available under various sections",
        "",
        "Calculation Method for Mixed Income:",
        "Step 1: Calculate tax on (Agricultural Income + Other Income)",
        "Step 2: Calculate tax on Agricultural Income only", 
        "Step 3: Tax payable = Step 1 - Step 2",
        "",
        "Example Calculation:",
        "Agricultural Income: ₹3,00,000",
        "Other Income: ₹5,00,000", 
        "Total Income: ₹8,00,000",
        "",
        "Tax on ₹8,00,000 = ₹62,500",
        "Tax on ₹3,00,000 = ₹5,000", 
        "Actual Tax Payable = ₹62,500 - ₹5,000 = ₹57,500"
    ]
    
    for content in exemption_content:
        if content.startswith("•") or content.startswith("Step"):
            story.append(Paragraph(content, styles['Normal']))
        elif content == "":
            story.append(Spacer(1, 6))
        else:
            story.append(Paragraph(content, styles['Normal']))
    
    story.append(PageBreak())
    
    # Section 3: Income Tax Calculation
    section3 = Paragraph("3. Income Tax Calculation Methods", styles['Heading1'])
    story.append(section3)
    story.append(Spacer(1, 12))
    
    calc_content = [
        "Income Tax Slabs for AY 2024-25 (FY 2023-24):",
        "",
        "For Individual taxpayers (Old Regime):",
        "• Up to ₹2,50,000: Nil tax",
        "• ₹2,50,001 to ₹5,00,000: 5% tax",
        "• ₹5,00,001 to ₹10,00,000: 20% tax", 
        "• Above ₹10,00,000: 30% tax",
        "",
        "Additional Surcharge:",
        "• Income ₹50 lakh to ₹1 crore: 10% surcharge",
        "• Income above ₹1 crore: 15% surcharge",
        "",
        "Health and Education Cess: 4% on (tax + surcharge)",
        "",
        "Calculation Formula:",
        "Total Tax = Income Tax + Surcharge + Health & Education Cess",
        "",
        "Example for ₹12,00,000 income:",
        "Tax on first ₹2,50,000 = ₹0",
        "Tax on next ₹2,50,000 = ₹12,500 (5%)",
        "Tax on next ₹5,00,000 = ₹1,00,000 (20%)",
        "Tax on remaining ₹2,00,000 = ₹60,000 (30%)",
        "Total Income Tax = ₹1,72,500",
        "Health & Education Cess = ₹6,900 (4%)",
        "Total Tax Payable = ₹1,79,400"
    ]
    
    for content in calc_content:
        story.append(Paragraph(content, styles['Normal']))
        if content == "":
            story.append(Spacer(1, 6))
    
    story.append(PageBreak())
    
    # Section 4: Filing Requirements
    section4 = Paragraph("4. Filing Requirements and Procedures", styles['Heading1'])
    story.append(section4)
    story.append(Spacer(1, 12))
    
    filing_content = [
        "Who Must File ITR:",
        "• Total income exceeds basic exemption limit",
        "• Total income includes agricultural income > ₹5,000",
        "• Want to claim refund of excess tax paid",
        "• Income from foreign assets or foreign income",
        "",
        "ITR Forms for Agricultural Income:",
        "• ITR-1 (Sahaj): Not applicable if agricultural income > ₹5,000",
        "• ITR-2: For individuals with agricultural income",
        "• ITR-4 (Sugam): For presumptive income from agriculture",
        "",
        "Filing Process:",
        "Step 1: Gather all income documents",
        "Step 2: Calculate total income including agricultural income",
        "Step 3: Choose appropriate ITR form",
        "Step 4: Fill the form online or offline",
        "Step 5: Verify using Aadhaar OTP, EVC, or physical signature",
        "Step 6: Submit before due date",
        "",
        "Due Dates:",
        "• Individual taxpayers: July 31st",
        "• Audit cases: October 31st",
        "• Belated return: December 31st (with penalty)",
        "",
        "Required Documents:",
        "• Form 16 (if salaried)",
        "• Agricultural income statements",
        "• Bank statements",
        "• Investment proofs",
        "• Property documents"
    ]
    
    for content in filing_content:
        story.append(Paragraph(content, styles['Normal']))
        if content == "":
            story.append(Spacer(1, 6))
    
    story.append(PageBreak())
    
    # Section 5: Deductions
    section5 = Paragraph("5. Deductions and Allowances", styles['Heading1'])
    story.append(section5)
    story.append(Spacer(1, 12))
    
    deduction_content = [
        "Common Deductions Available:",
        "",
        "Section 80C (up to ₹1,50,000):",
        "• Life insurance premium",
        "• Employee Provident Fund (EPF)",
        "• Public Provident Fund (PPF)",
        "• Equity Linked Savings Scheme (ELSS)",
        "• Tax Saving Fixed Deposits",
        "• National Savings Certificate (NSC)",
        "",
        "Section 80D - Medical Insurance:",
        "• Self and family: up to ₹25,000",
        "• Parents (below 60): up to ₹25,000", 
        "• Parents (above 60): up to ₹50,000",
        "",
        "Section 24 - Home Loan Interest:",
        "• Self-occupied property: up to ₹2,00,000",
        "• Let-out property: No limit",
        "",
        "Agricultural Expenses (Deductible):",
        "• Seeds and fertilizers cost",
        "• Irrigation expenses",
        "• Labor charges",
        "• Equipment maintenance",
        "• Land revenue and taxes",
        "",
        "How to Claim Deductions:",
        "1. Maintain proper receipts and documents",
        "2. Report in appropriate ITR schedule",
        "3. Keep investment proofs ready",
        "4. Ensure investments made within financial year"
    ]
    
    for content in deduction_content:
        story.append(Paragraph(content, styles['Normal']))
        if content == "":
            story.append(Spacer(1, 6))
    
    story.append(PageBreak())
    
    # Section 6: Case Studies
    section6 = Paragraph("6. Practical Examples and Case Studies", styles['Heading1'])
    story.append(section6)
    story.append(Spacer(1, 12))
    
    case_content = [
        "Case Study 1: Pure Agricultural Income",
        "Mr. Sharma owns 10 acres of agricultural land.",
        "Income from wheat cultivation: ₹4,00,000",
        "Expenses: Seeds ₹50,000, Fertilizers ₹30,000, Labor ₹80,000",
        "Net Agricultural Income: ₹2,40,000",
        "Tax Liability: NIL (Agricultural income is exempt)",
        "",
        "Case Study 2: Mixed Income (Agricultural + Salary)",
        "Ms. Patel - Agricultural Income: ₹6,00,000, Salary: ₹8,00,000",
        "Step 1: Tax on ₹14,00,000 = ₹2,75,000",
        "Step 2: Tax on ₹6,00,000 = ₹25,000",
        "Final Tax: ₹2,75,000 - ₹25,000 = ₹2,50,000",
        "",
        "Case Study 3: Agricultural Processing Business",
        "Mr. Kumar grows rice and processes it into rice flour.",
        "Raw rice sale (agricultural): ₹3,00,000 - Exempt",
        "Processed rice flour sale (business): ₹5,00,000 - Taxable",
        "Tax applies only on ₹5,00,000 processing income",
        "",
        "Case Study 4: Land Rental Income",
        "Mrs. Singh rents agricultural land to tenant farmers.",
        "Rental income: ₹2,00,000 per year",
        "This is agricultural income and exempt from tax",
        "However, considered for rate purpose if other income exists",
        "",
        "Important Notes:",
        "• Keep detailed records of all agricultural activities",
        "• Separate agricultural income from business income",
        "• Consult tax advisor for complex cases",
        "• File ITR even if no tax is payable for amounts > ₹5,000"
    ]
    
    for content in case_content:
        story.append(Paragraph(content, styles['Normal']))
        if content == "":
            story.append(Spacer(1, 6))
    
    # Build PDF
    doc.build(story)
    print(f"✅ Comprehensive tax guide PDF '{filename}' created successfully!")
    return filename

if __name__ == "__main__":
    create_comprehensive_tax_pdf()