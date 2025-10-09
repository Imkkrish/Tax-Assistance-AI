from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter

def create_test_pdf():
    filename = "test_document.pdf"
    c = canvas.Canvas(filename, pagesize=letter)
    
    # Add content to the PDF
    c.drawString(100, 750, "Test Document for Tax Assistant Chatbot")
    c.drawString(100, 700, "")
    c.drawString(100, 680, "This is a sample document containing information about taxation.")
    c.drawString(100, 660, "")
    c.drawString(100, 640, "Key Topics:")
    c.drawString(120, 620, "1. Income Tax: Taxes levied on individual and corporate income")
    c.drawString(120, 600, "2. Agricultural Income: Income derived from agricultural activities")
    c.drawString(120, 580, "3. Tax Deductions: Allowable deductions from taxable income")
    c.drawString(120, 560, "4. Filing Requirements: When and how to file tax returns")
    c.drawString(100, 540, "")
    c.drawString(100, 520, "Agricultural Income Definition:")
    c.drawString(100, 500, "Agricultural income includes rent or revenue derived from land")
    c.drawString(100, 480, "which is situated in India and is used for agricultural purposes.")
    c.drawString(100, 460, "It also includes income from buildings owned and occupied by")
    c.drawString(100, 440, "the receiver of the rent or revenue of such land.")
    c.drawString(100, 420, "")
    c.drawString(100, 400, "Tax Exemptions:")
    c.drawString(100, 380, "Certain types of agricultural income are exempt from income tax")
    c.drawString(100, 360, "under the Income Tax Act.")
    
    c.save()
    print(f"Test PDF '{filename}' created successfully!")

if __name__ == "__main__":
    create_test_pdf()