import React, { useState, useRef, useEffect } from 'react';
import { Row, Col, Card, Table, Button, Form, Pagination } from 'react-bootstrap';
import PerfectScrollbar from 'react-perfect-scrollbar';
import { writeFile, utils } from 'xlsx';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import '../commonemp.scss';
import axios from 'axios';

function Cashbook() {
  const tableRef = useRef(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [cashbookData, setCashbookData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10); // You can make this configurable

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    setCurrentPage(1); // Reset to first page when searching

    if (value === '') {
      setFilteredData(cashbookData);
    } else {
      const filtered = cashbookData.filter((item) => item.Description && item.Description.toLowerCase().includes(value.toLowerCase()));
      setFilteredData(filtered);
    }
  };

  const fetchCashbookData = async () => {
    try {
      const res = await axios.get('https://api.mytemplesoftware.in/api/current-account/transactions', {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });

      const data = res.data.data;
      if (data && Array.isArray(data)) {
        setCashbookData(data);
        setFilteredData(data);
      } else {
        console.error('Invalid data format:', data);
        setCashbookData([]);
        setFilteredData([]);
      }
    } catch (error) {
      console.error('Error fetching cashbook data:', error);
      setCashbookData([]);
      setFilteredData([]);
    }
  };

  useEffect(() => {
    fetchCashbookData();
  }, []);

  console.log('Cashbook Data:', cashbookData);

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const renderPaginationItems = () => {
    const items = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage < maxVisiblePages - 1) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    // Previous button
    items.push(<Pagination.Prev key="prev" disabled={currentPage === 1} onClick={() => handlePageChange(currentPage - 1)} />);

    // First page
    if (startPage > 1) {
      items.push(
        <Pagination.Item key={1} onClick={() => handlePageChange(1)}>
          {1}
        </Pagination.Item>
      );
      if (startPage > 2) {
        items.push(<Pagination.Ellipsis key="ellipsis1" />);
      }
    }

    // Page numbers
    for (let i = startPage; i <= endPage; i++) {
      items.push(
        <Pagination.Item key={i} active={i === currentPage} onClick={() => handlePageChange(i)}>
          {i}
        </Pagination.Item>
      );
    }

    // Last page
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        items.push(<Pagination.Ellipsis key="ellipsis2" />);
      }
      items.push(
        <Pagination.Item key={totalPages} onClick={() => handlePageChange(totalPages)}>
          {totalPages}
        </Pagination.Item>
      );
    }

    // Next button
    items.push(<Pagination.Next key="next" disabled={currentPage === totalPages} onClick={() => handlePageChange(currentPage + 1)} />);

    return items;
  };

  const handleExportToExcel = () => {
    if (!Array.isArray(filteredData) || filteredData.length === 0) {
      alert('No data available to export');
      return;
    }

    // Prepare data for Excel export
    const excelData = filteredData.map((item, index) => ({
      'Sr.No': index + 1,
      अनुक्रमांक: item.Id || '',
      नाव: item.Description || '',
      दिनांक: item.Date ? formatDate(item.Date) : '',
      रक्कम: item.Amount ? `₹${item.Amount}` : '',
      'व्यवहार प्रकार': item.AmountType || '',
      'बँक नाव': item.BankName || ''
    }));

    // Create workbook and worksheet
    const wb = utils.book_new();
    const ws = utils.json_to_sheet(excelData);

    // Set column widths for better readability
    const colWidths = [
      { wch: 8 }, // Sr.No
      { wch: 12 }, // ID
      { wch: 25 }, // Description/Name
      { wch: 12 }, // Date
      { wch: 15 }, // Amount
      { wch: 15 }, // Amount Type
      { wch: 20 } // Bank Name
    ];
    ws['!cols'] = colWidths;

    // Add worksheet to workbook
    utils.book_append_sheet(wb, ws, 'Cashbook Data');

    // Generate filename with current date
    const currentDate = new Date().toISOString().split('T')[0];
    const filename = `Cashbook_Data_${currentDate}.xlsx`;

    // Save the file
    writeFile(wb, filename);
  };

  const handleExportToPDF = () => {
    console.log('pdf');

    // get table
    const table = tableRef.current;
    if (!table) return;

    const clonedTable = table.cloneNode(true);

    // remove action field
    const headers = clonedTable.querySelectorAll('th');
    const rows = clonedTable.querySelectorAll('tr');
    const actionIndex = headers.length - 1;

    if (headers[actionIndex]) headers[actionIndex].remove(); // remove header

    rows.forEach((row) => {
      const cells = row.querySelectorAll('td');
      if (cells[actionIndex]) cells[actionIndex].remove();
    });

    // Append cloned table in body
    clonedTable.style.position = 'absolute';
    clonedTable.style.top = '-9999px';
    document.body.appendChild(clonedTable);

    html2canvas(clonedTable).then((canvas) => {
      document.body.removeChild(clonedTable); // Remove the cloned table after capturing

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF();
      const imgWidth = 210;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save('cashbook.pdf');
    });
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const options = { year: 'numeric', month: '2-digit', day: '2-digit' };
    return date.toLocaleDateString('en-IN', options);
  };

  return (
    <Col sm={12}>
      <Card>
        <Card.Header>
          <Row>
            <Col md={6}>
              <Card.Title as="h4">रोख नोंदवही</Card.Title>
            </Col>
            <Col md={6} className="d-flex justify-content-end">
              <Form.Control type="text" value={searchTerm} placeholder="Search" onChange={handleSearchChange} className="me-2" />

              <Button variant="success" onClick={handleExportToExcel} className="me-2">
                Excel
              </Button>
              <Button variant="danger" onClick={handleExportToPDF}>
                PDF
              </Button>
            </Col>
          </Row>
        </Card.Header>
        <Card.Body className="p-0">
          <div className="table-card" style={{ height: '362px' }}>
            <PerfectScrollbar>
              <Table
                responsive
                ref={tableRef}
                className="table-bordered"
                style={{
                  border: '2px solid #dee2e6',
                  borderCollapse: 'collapse'
                }}
              >
                <thead>
                  <tr>
                    <th>अनुक्रमांक</th>
                    <th>नाव</th>
                    <th>दिनांक</th>
                    <th>रक्कम</th>
                    <th>व्यवहार प्रकार</th>
                    <th>बँक नाव</th>
                  </tr>
                </thead>
                <tbody>
                  {currentItems.map((item, index) => (
                    <tr key={index}>
                      <td>{item.Id}</td>
                      <td>{item.Description}</td>
                      <td>{formatDate(item.Date)}</td>
                      <td>₹{item.Amount}</td>
                      <td>{item.AmountType}</td>
                      <td>{item.BankName}</td>
                    </tr>
                  ))}
                  {currentItems.length === 0 && (
                    <tr>
                      <td colSpan="6" className="text-center">
                        {searchTerm ? 'No matching records found' : 'No data available'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </Table>
            </PerfectScrollbar>
          </div>

          {/* Pagination and Info */}
          {filteredData.length > 0 && (
            <div className="d-flex justify-content-between align-items-center p-3">
              <div className="text-muted">
                Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredData.length)} of {filteredData.length} entries
                {searchTerm && <span> (filtered from {cashbookData.length} total entries)</span>}
              </div>

              {totalPages > 1 && <Pagination className="mb-0">{renderPaginationItems()}</Pagination>}
            </div>
          )}
        </Card.Body>
      </Card>
    </Col>
  );
}

export default Cashbook;
