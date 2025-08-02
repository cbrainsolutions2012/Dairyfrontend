import React from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Table, Button, Card } from 'react-bootstrap';

const TestPDFExport = () => {
  const handleExportToPDF = async () => {
    try {
      const element = document.getElementById('pdf-content');
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('l', 'mm', 'a4'); // landscape orientation

      const imgWidth = 280; // A4 landscape width minus margins
      const pageHeight = 190; // A4 landscape height minus margins
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 15;

      // Add first page
      pdf.addImage(imgData, 'PNG', 15, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      // Add more pages if needed
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight + 15;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 15, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save('test-pdf-export.pdf');
    } catch (error) {
      console.error('Error generating PDF:', error);
    }
  };

  const sampleData = [
    { name: 'राम प्रसाद', designation: 'पुजारी', attendance: '25/30', status: 'Present' },
    { name: 'श्याम सुंदर', designation: 'सहायक', attendance: '28/30', status: 'Present' },
    { name: 'गीता देवी', designation: 'सफाई कर्मी', attendance: '22/30', status: 'Absent' },
    { name: 'मोहन लाल', designation: 'चौकीदार', attendance: '30/30', status: 'Present' }
  ];

  return (
    <Card>
      <Card.Header>
        <h5>PDF Export Test</h5>
        <Button variant="primary" onClick={handleExportToPDF}>
          Export to PDF
        </Button>
      </Card.Header>
      <Card.Body>
        <div id="pdf-content">
          <h4 style={{ textAlign: 'center', marginBottom: '20px' }}>कर्मचारी रिपोर्ट टेस्ट</h4>
          <Table striped bordered hover>
            <thead>
              <tr>
                <th>कर्मचारी नाम</th>
                <th>पदनाम</th>
                <th>उपस्थिती</th>
                <th>स्थिति</th>
              </tr>
            </thead>
            <tbody>
              {sampleData.map((item, index) => (
                <tr key={index}>
                  <td>{item.name}</td>
                  <td>{item.designation}</td>
                  <td>{item.attendance}</td>
                  <td>
                    <span className={`badge ${item.status === 'Present' ? 'bg-success' : 'bg-danger'}`}>
                      {item.status === 'Present' ? 'उपस्थित' : 'अनुपस्थित'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      </Card.Body>
    </Card>
  );
};

export default TestPDFExport;
