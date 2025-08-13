import React, { useState, useRef, useEffect } from 'react';
import { Row, Col, Card, Table, Button, Form } from 'react-bootstrap';
import PerfectScrollbar from 'react-perfect-scrollbar';
import { writeFile, utils } from 'xlsx';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import axios from 'axios';
import '../commonemp.scss';
import { FaEdit, FaTrashAlt } from 'react-icons/fa';

function StockManagement() {
  const tableRef = useRef(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [tabData, setTabData] = useState([]); // State to hold table data
  const [allData, setAllData] = useState([]); // Store all data for search/filter
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    ProductName: '',
    Quantity: '',
    Date: '',
    Note: ''
  });

  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    setCurrentPage(1); // Reset to first page when searching

    if (value === '') {
      setTabData(allData); // Show all data if search term is empty
    } else {
      const filteredData = allData.filter(
        (item) =>
          (item.ProductName || '').toLowerCase().includes(value.toLowerCase()) ||
          (item.Note || '').toLowerCase().includes(value.toLowerCase())
      );
      setTabData(filteredData);
    }
  };

  // Function to confirm and handle delete
  const confirmDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this stock entry?')) {
      handleDelete(id);
    }
  };

  const handleDelete = async (id) => {
    try {
      const res = await axios.delete(`https://api.mytemplesoftware.in/api/stock/${id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
          'Content-Type': 'application/json'
        }
      });
      if (res.status === 200) {
        alert('Stock entry deleted successfully');
        setTabData((prevData) => prevData.filter((item) => item.id !== id));
        setAllData((prevData) => prevData.filter((item) => item.id !== id));
      }
    } catch (error) {
      console.error('Error deleting stock entry:', error);
      alert('Failed to delete stock entry. Please try again.');
    }
  };

  const handleEdit = (item) => {
    setIsEditing(true);
    setEditingId(item.id);
    setFormData({
      ProductName: item.ProductName || '',
      Quantity: item.Quantity || '',
      Date: item.Date ? item.Date.split('T')[0] : '',
      Note: item.Note || ''
    });
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setEditingId(null);
    setFormData({
      ProductName: '',
      Quantity: '',
      Date: '',
      Note: ''
    });
    setErrors({});
  };

  const fetchTableData = async () => {
    try {
      const res = await axios.get('https://api.mytemplesoftware.in/api/stock', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
          'Content-Type': 'application/json'
        }
      });
      console.log(res.data);
      const data = res.data.data;
      setAllData(data); // Store all data for search/filter
      setTabData(data); // Set current display data
    } catch (error) {
      console.log(error);
      setAllData([]);
      setTabData([]);
    }
  };

  useEffect(() => {
    fetchTableData();
  }, []);

  const formattedDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const options = { year: 'numeric', month: '2-digit', day: '2-digit' };
    return date.toLocaleDateString('en-IN', options).replace(/\//g, '-');
  };

  const handleExportToExcel = () => {
    if (!Array.isArray(tabData) || tabData.length === 0) {
      alert('No data available to export');
      return;
    }

    // Prepare data for Excel export
    const excelData = tabData.map((item, index) => ({
      'Sr.No': index + 1,
      ID: item.id || '',
      Date: item.Date ? formattedDate(item.Date) : '',
      'Product Name': item.ProductName || '',
      Quantity: item.Quantity || '',
      Note: item.Note || '',
      'Created By': item.CreatedByName || ''
    }));

    // Create workbook and worksheet
    const wb = utils.book_new();
    const ws = utils.json_to_sheet(excelData);

    // Set column widths for better readability
    const colWidths = [
      { wch: 8 }, // Sr.No
      { wch: 10 }, // ID
      { wch: 12 }, // Date
      { wch: 20 }, // Product Name
      { wch: 12 }, // Quantity
      { wch: 30 }, // Note
      { wch: 15 } // Created By
    ];
    ws['!cols'] = colWidths;

    // Add worksheet to workbook
    utils.book_append_sheet(wb, ws, 'Stock Data');

    // Generate filename with current date
    const currentDate = new Date().toISOString().split('T')[0];
    const filename = `Stock_Data_${currentDate}.xlsx`;

    // Save the file
    writeFile(wb, filename);
  };

  const handleExportToPDF = () => {
    // get table
    const table = tableRef.current;
    if (!table) return;

    const clonedTable = table.cloneNode(true);

    // remove action field
    const headers = clonedTable.querySelectorAll('th');
    const rows = clonedTable.querySelectorAll('tr');
    const actionIndex = headers.length - 1;

    headers[actionIndex].remove(); //remove header

    rows.forEach((row) => {
      const cells = row.querySelectorAll('td');
      if (cells[actionIndex]) {
        cells[actionIndex].remove();
      }
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

      pdf.save('Stock_Data.pdf');
    });
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.ProductName) newErrors.ProductName = 'Product Name is required';
    if (!formData.Quantity) newErrors.Quantity = 'Quantity is required';
    if (!formData.Date) newErrors.Date = 'Date is required';

    if (formData.Quantity && isNaN(formData.Quantity)) {
      newErrors.Quantity = 'Quantity must be a valid number';
    }

    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formErrors = validate();
    if (Object.keys(formErrors).length === 0) {
      try {
        let response;

        if (isEditing) {
          // Update existing stock entry
          response = await axios.put(`https://api.mytemplesoftware.in/api/stock/${editingId}`, formData, {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
              'Content-Type': 'application/json'
            }
          });
          alert('Stock entry updated successfully!');
        } else {
          // Create new stock entry
          response = await axios.post('https://api.mytemplesoftware.in/api/stock', formData, {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
              'Content-Type': 'application/json'
            }
          });
          alert('Stock entry created successfully!');
        }

        console.log('Form submitted successfully:', response.data);

        // Reset form on successful submission
        setFormData({
          ProductName: '',
          Quantity: '',
          Date: '',
          Note: ''
        });

        setIsEditing(false);
        setEditingId(null);
        setErrors({});

        // Refresh table data
        fetchTableData();
      } catch (error) {
        console.error('Error submitting form:', error);
        alert(`Failed to ${isEditing ? 'update' : 'create'} stock entry. Please try again.`);
        setErrors({});
      }
    } else {
      setErrors(formErrors);
    }
  };

  // Pagination calculations
  const totalItems = tabData.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentData = tabData.slice(startIndex, endIndex);

  // Pagination controls
  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      const start = Math.max(1, currentPage - 2);
      const end = Math.min(totalPages, start + maxVisible - 1);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
    }

    return pages;
  };

  return (
    <React.Fragment>
      <Col sm={12}>
        <Card>
          <Card.Header>
            <Card.Title as="h4" style={{ display: 'flex', justifyContent: 'center' }}>
              {isEditing ? 'स्टॉक व्यवस्थापन - संपादन' : 'स्टॉक व्यवस्थापन - नोंदणी'}
            </Card.Title>
          </Card.Header>
          <Card.Body className="p-0">
            <form onSubmit={handleSubmit} className="register-form">
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="ProductName">उत्पादन नाव *</label>
                  <input
                    type="text"
                    name="ProductName"
                    value={formData.ProductName}
                    onChange={handleChange}
                    placeholder="Enter product name"
                  />
                  {errors.ProductName && <span className="error">{errors.ProductName}</span>}
                </div>
                <div className="form-group">
                  <label htmlFor="Quantity">प्रमाण *</label>
                  <input
                    type="text"
                    name="Quantity"
                    value={formData.Quantity}
                    onChange={handleChange}
                    placeholder="Enter quantity"
                    step="0.01"
                  />
                  {errors.Quantity && <span className="error">{errors.Quantity}</span>}
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="Date">दिनांक *</label>
                  <input type="date" name="Date" value={formData.Date} onChange={handleChange} />
                  {errors.Date && <span className="error">{errors.Date}</span>}
                </div>
                <div className="form-group">
                  <label htmlFor="Note">टिप्पणी</label>
                  <textarea rows={3} name="Note" value={formData.Note} onChange={handleChange} placeholder="Enter note (optional)" />
                  {errors.Note && <span className="error">{errors.Note}</span>}
                </div>
              </div>

              <div className="form-actions">
                <Button variant="primary" type="submit">
                  {isEditing ? 'Update' : 'Submit'}
                </Button>
                {isEditing && (
                  <Button variant="secondary" type="button" onClick={cancelEdit} className="ms-2">
                    Cancel
                  </Button>
                )}
              </div>
            </form>
          </Card.Body>
        </Card>
      </Col>

      <Col sm={12}>
        <Card>
          <Card.Header>
            <Row>
              <Col md={6}>
                <Card.Title as="h4">स्टॉक सूची</Card.Title>
              </Col>
              <Col md={6} className="d-flex justify-content-end">
                <Form.Control
                  type="text"
                  placeholder="Search by product name or note"
                  value={searchTerm}
                  onChange={handleSearchChange}
                  className="me-2"
                />
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
                      <th>ID</th>
                      <th>दिनांक</th>
                      <th>उत्पादन नाव</th>
                      <th>प्रमाण</th>
                      <th>टिप्पणी</th>
                      <th>तयार करणारे</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Array.isArray(currentData) &&
                      currentData.map((item) => (
                        <tr key={item.id}>
                          <td>{item.id}</td>
                          <td>{formattedDate(item.Date)}</td>
                          <td>{item.ProductName}</td>
                          <td>{item.Quantity}</td>
                          <td>{item.Note || 'N/A'}</td>
                          <td>{item.CreatedByName || 'N/A'}</td>
                          <td>
                            <Button
                              variant="info"
                              className="me-2"
                              onClick={() => handleEdit(item)}
                              disabled={isEditing && editingId === item.id}
                            >
                              <FaEdit />
                            </Button>
                            <Button variant="danger" onClick={() => confirmDelete(item.id)} disabled={isEditing}>
                              <FaTrashAlt />
                            </Button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </Table>
              </PerfectScrollbar>
            </div>

            {/* Pagination Info */}
            <div className="d-flex justify-content-between align-items-center mt-3 px-3 pb-3">
              <div className="pagination-info">
                <small className="text-muted">
                  Showing {startIndex + 1} to {Math.min(endIndex, totalItems)} of {totalItems} entries
                  {searchTerm && ` (filtered from ${allData.length} total entries)`}
                </small>
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="pagination-controls d-flex align-items-center">
                  <Button variant="outline-secondary" size="sm" onClick={handlePrevPage} disabled={currentPage === 1} className="me-2">
                    Previous
                  </Button>

                  {getPageNumbers().map((pageNum) => (
                    <Button
                      key={pageNum}
                      variant={pageNum === currentPage ? 'primary' : 'outline-primary'}
                      size="sm"
                      onClick={() => handlePageChange(pageNum)}
                      className="me-1"
                    >
                      {pageNum}
                    </Button>
                  ))}

                  <Button
                    variant="outline-secondary"
                    size="sm"
                    onClick={handleNextPage}
                    disabled={currentPage === totalPages}
                    className="ms-1"
                  >
                    Next
                  </Button>
                </div>
              )}
            </div>
          </Card.Body>
        </Card>
      </Col>
    </React.Fragment>
  );
}

export default StockManagement;
