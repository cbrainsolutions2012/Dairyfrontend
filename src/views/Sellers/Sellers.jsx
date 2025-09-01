import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Row, Col, Card, Table, Button, Form } from 'react-bootstrap';
import PerfectScrollbar from 'react-perfect-scrollbar';
import { writeFile, utils } from 'xlsx';
import jsPDF from 'jspdf';
import axios from 'axios';
import { FaEdit, FaTrashAlt } from 'react-icons/fa';
import '../commonemp.scss';

function Sellers() {
  const tableRef = useRef(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sellersData, setSellersData] = useState([]);
  const [allSellersData, setAllSellersData] = useState([]); // Store all data for search/filter
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [isEditing, setIsEditing] = useState(false);
  const [editingSellerId, setEditingSellerId] = useState(null);
  const [isExportingExcel, setIsExportingExcel] = useState(false);
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    fullName: '',
    mobileNumber: '',
    city: ''
  });

  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');

  // Get API URL from environment
  const API_URL = import.meta.env.VITE_API_URL || 'https://dairyapi.demotest.in.net';

  // Get auth headers
  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      Authorization: `Bearer ${token || ''}`,
      'Content-Type': 'application/json'
    };
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
  };

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    setCurrentPage(1); // Reset to first page when searching

    if (value === '') {
      setSellersData(allSellersData); // Show all data if search term is empty
    } else {
      const filteredData = allSellersData.filter(
        (seller) =>
          (seller.FullName || '').toLowerCase().includes(value.toLowerCase()) ||
          (seller.MobileNumber || '').includes(value) ||
          (seller.City || '').toLowerCase().includes(value.toLowerCase())
      );
      setSellersData(filteredData);
    }
  };

  // Clear form and reset to add new seller
  const handleClearForm = () => {
    setFormData({
      fullName: '',
      mobileNumber: '',
      city: ''
    });
    setIsEditing(false);
    setEditingSellerId(null);
    setErrors({});
    setApiError('');
  };

  // Handle edit seller
  const handleEditSeller = async (sellerId) => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/api/sellers/${sellerId}`, {
        headers: getAuthHeaders()
      });

      if (res.data.success && res.data.data.seller) {
        const seller = res.data.data.seller;
        setFormData({
          fullName: seller.FullName || '',
          mobileNumber: seller.MobileNumber || '',
          city: seller.City || ''
        });
        setIsEditing(true);
        setEditingSellerId(sellerId);
        setApiError('');
      }
    } catch (error) {
      console.error('Error fetching seller for edit:', error);
      setApiError('Failed to load seller data for editing.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch sellers data
  // Replace your existing fetchSellersData function with this:
  const fetchSellersData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/api/sellers`, {
        headers: getAuthHeaders()
      });

      if (res.data.success) {
        const data = res.data.data.sellers || [];

        // For each seller, get transaction details to show outstanding
        const sellersWithOutstanding = await Promise.all(
          data.map(async (seller) => {
            try {
              const detailResponse = await axios.get(`${API_URL}/api/sellers/${seller.Id}?includeTransactions=true`, {
                headers: getAuthHeaders()
              });
              if (detailResponse.data.success) {
                return detailResponse.data.data.seller;
              }
              return { ...seller, outstandingAmount: 0, milkTransactions: null, payments: null };
            } catch (error) {
              console.error(`Error fetching details for seller ${seller.Id}:`, error);
              return { ...seller, outstandingAmount: 0, milkTransactions: null, payments: null };
            }
          })
        );

        setAllSellersData(sellersWithOutstanding);
        setSellersData(sellersWithOutstanding);
        setApiError('');
      }
    } catch (error) {
      console.error('Error fetching sellers data:', error);
      setApiError('Failed to fetch sellers data.');
      setAllSellersData([]);
      setSellersData([]);
    } finally {
      setLoading(false);
    }
  }, [API_URL]);

  useEffect(() => {
    fetchSellersData();
  }, [fetchSellersData]);

  // Validation function
  const validate = () => {
    const newErrors = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }

    if (!formData.mobileNumber.trim()) {
      newErrors.mobileNumber = 'Mobile number is required';
    } else if (!/^\d{10}$/.test(formData.mobileNumber)) {
      newErrors.mobileNumber = 'Mobile number must be exactly 10 digits';
    }

    if (!formData.city.trim()) {
      newErrors.city = 'City is required';
    }

    return newErrors;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    const formErrors = validate();

    if (Object.keys(formErrors).length === 0) {
      try {
        setLoading(true);
        setApiError('');

        const submitData = {
          fullName: formData.fullName.trim(),
          mobileNumber: formData.mobileNumber.trim(),
          city: formData.city.trim()
        };

        let response;
        if (isEditing && editingSellerId) {
          // Update existing seller
          response = await axios.put(`${API_URL}/api/sellers/${editingSellerId}`, submitData, {
            headers: getAuthHeaders()
          });
          if (response.data.success) {
            alert('Seller updated successfully!');
          }
        } else {
          // Create new seller
          response = await axios.post(`${API_URL}/api/sellers`, submitData, {
            headers: getAuthHeaders()
          });
          if (response.data.success) {
            alert('Seller added successfully!');
          }
        }

        // Reset form and refresh data
        handleClearForm();
        fetchSellersData();
      } catch (error) {
        console.error('Error submitting seller:', error);

        if (error.response?.status === 409) {
          setApiError('Mobile number already exists. Please use a different mobile number.');
        } else if (error.response?.status === 400) {
          setApiError(error.response.data.message || 'Invalid data provided. Please check all fields.');
        } else if (error.response?.data?.message) {
          setApiError(error.response.data.message);
        } else {
          setApiError('Failed to save seller. Please try again.');
        }
      } finally {
        setLoading(false);
      }
    } else {
      setErrors(formErrors);
    }
  };

  // Handle delete seller
  const confirmDelete = (id, sellerName) => {
    if (window.confirm(`Are you sure you want to delete seller "${sellerName}"?`)) {
      handleDelete(id);
    }
  };

  const handleDelete = async (id) => {
    try {
      setLoading(true);
      const response = await axios.delete(`${API_URL}/api/sellers/${id}`, {
        headers: getAuthHeaders()
      });

      if (response.data.success) {
        alert('Seller deleted successfully!');
        fetchSellersData(); // Refresh table
      }
    } catch (error) {
      console.error('Error deleting seller:', error);
      if (error.response?.data?.message) {
        alert(`Failed to delete seller: ${error.response.data.message}`);
      } else {
        alert('Failed to delete seller. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Export to Excel
  const handleExportToExcel = async () => {
    if (!Array.isArray(sellersData) || sellersData.length === 0) {
      alert('No data available to export');
      return;
    }

    setIsExportingExcel(true);
    try {
      // Prepare data for Excel export
      const excelData = sellersData.map((item, index) => ({
        'Sr. No.': index + 1,
        'Full Name': item.FullName || 'N/A',
        'Mobile Number': item.MobileNumber || 'N/A',
        City: item.City || 'N/A',
        'Total Amount': item.milkTransactions?.totalAmount || 0,
        'Paid Amount': item.payments?.totalPaid || 0,
        Outstanding: item.outstandingAmount || 0,
        'Created Date': item.CreatedAt ? new Date(item.CreatedAt).toLocaleDateString('en-IN') : 'N/A'
      }));

      // Create workbook and worksheet
      const ws = utils.json_to_sheet(excelData);
      const wb = utils.book_new();

      // Set column widths
      const colWidths = [
        { wch: 8 }, // Sr. No.
        { wch: 25 }, // Full Name
        { wch: 15 }, // Mobile Number
        { wch: 20 }, // City
        { wch: 12 }, // Total Amount
        { wch: 12 }, // Paid Amount
        { wch: 12 }, // Outstanding
        { wch: 15 } // Created Date
      ];
      ws['!cols'] = colWidths;

      utils.book_append_sheet(wb, ws, 'Sellers');

      // Generate filename with timestamp
      const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '');
      const filename = `Sellers_${timestamp}.xlsx`;

      writeFile(wb, filename);

      alert(`✅ Excel Export Successful!\n\nFile: ${filename}\nRecords: ${sellersData.length}`);
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      alert(`❌ Export Failed!\n\nError: ${error.message}`);
    } finally {
      setIsExportingExcel(false);
    }
  };

  // Export to PDF
  const handleExportToPDF = async () => {
    if (!Array.isArray(sellersData) || sellersData.length === 0) {
      alert('No data available to export');
      return;
    }

    setIsExportingPDF(true);
    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const margin = 10;
      let currentY = 20;

      // Title
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Sellers Report', pageWidth / 2, currentY, { align: 'center' });
      currentY += 10;

      // Date and total
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      const today = new Date().toLocaleDateString('en-IN');
      pdf.text(`Generated on: ${today}`, margin, currentY);
      pdf.text(`Total Records: ${sellersData.length}`, pageWidth - 50, currentY);
      currentY += 15;

      // Table headers
      const headers = ['Sr.', 'Full Name', 'Mobile', 'City', 'Created Date'];
      const colWidths = [15, 50, 30, 40, 35];
      let xPos = margin;

      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'bold');
      headers.forEach((header, index) => {
        pdf.text(header, xPos, currentY);
        xPos += colWidths[index];
      });
      currentY += 7;

      // Table data
      pdf.setFont('helvetica', 'normal');
      sellersData.forEach((seller, index) => {
        if (currentY > 270) {
          // Start new page if needed
          pdf.addPage();
          currentY = 20;
        }

        xPos = margin;
        const rowData = [
          (index + 1).toString(),
          (seller.FullName || 'N/A').substring(0, 20),
          seller.MobileNumber || 'N/A',
          (seller.City || 'N/A').substring(0, 15),
          seller.CreatedAt ? new Date(seller.CreatedAt).toLocaleDateString('en-IN') : 'N/A'
        ];

        rowData.forEach((data, colIndex) => {
          pdf.text(data, xPos, currentY);
          xPos += colWidths[colIndex];
        });
        currentY += 6;
      });

      // Generate filename and save
      const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '');
      const filename = `Sellers_${timestamp}.pdf`;
      pdf.save(filename);

      alert(`✅ PDF Export Successful!\n\nFile: ${filename}\nRecords: ${sellersData.length}`);
    } catch (error) {
      console.error('Error exporting to PDF:', error);
      alert(`❌ PDF Export Failed!\n\nError: ${error.message}`);
    } finally {
      setIsExportingPDF(false);
    }
  };

  // Pagination calculations
  const totalItems = sellersData.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentData = sellersData.slice(startIndex, endIndex);

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
              {isEditing ? 'Edit Seller' : 'Add New Seller'}
            </Card.Title>
          </Card.Header>
          <Card.Body className="p-0">
            <form onSubmit={handleSubmit} className="register-form">
              {apiError && (
                <div className="form-row">
                  <div className="alert alert-danger" role="alert">
                    {apiError}
                  </div>
                </div>
              )}

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="fullName">Full Name *</label>
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    placeholder="Enter full name"
                    disabled={loading}
                  />
                  {errors.fullName && <span className="error">{errors.fullName}</span>}
                </div>
                <div className="form-group">
                  <label htmlFor="mobileNumber">Mobile Number *</label>
                  <input
                    type="text"
                    name="mobileNumber"
                    value={formData.mobileNumber}
                    onChange={handleChange}
                    placeholder="Enter 10-digit mobile number"
                    maxLength="10"
                    disabled={loading}
                  />
                  {errors.mobileNumber && <span className="error">{errors.mobileNumber}</span>}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="city">City *</label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    placeholder="Enter city name"
                    disabled={loading}
                  />
                  {errors.city && <span className="error">{errors.city}</span>}
                </div>
                <div className="form-group">{/* Empty for layout balance */}</div>
              </div>

              <div className="form-actions">
                <Button variant="primary" type="submit" disabled={loading} style={{ marginRight: '10px' }}>
                  {loading ? 'Processing...' : isEditing ? 'Update Seller' : 'Add Seller'}
                </Button>

                {isEditing && (
                  <Button variant="secondary" type="button" onClick={handleClearForm} disabled={loading}>
                    Cancel Edit
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
              <Col md={4} className="mb-3 mb-md-0">
                <Card.Title as="h4">Sellers List</Card.Title>
                <small className="text-muted">Total: {sellersData.length} sellers</small>
              </Col>
              <Col
                md={8}
                className="d-flex flex-column flex-md-row justify-content-end align-items-stretch align-items-md-center search-filter-bar"
              >
                <Form.Control
                  type="text"
                  placeholder="Search by name, mobile, or city..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                  className="mb-2 mb-md-0 me-md-2"
                  style={{ maxWidth: '100%' }}
                />
                <div className="d-flex flex-column flex-sm-row export-buttons">
                  <Button
                    variant="success"
                    onClick={handleExportToExcel}
                    className="me-0 me-sm-2 mb-2 mb-sm-0 d-flex align-items-center justify-content-center"
                    disabled={isExportingExcel || isExportingPDF || sellersData.length === 0}
                    style={{ minWidth: '120px' }}
                  >
                    {isExportingExcel ? (
                      <>
                        <div
                          className="spinner-border spinner-border-sm me-2"
                          role="status"
                          aria-hidden="true"
                          style={{ width: '16px', height: '16px' }}
                        ></div>
                        Exporting...
                      </>
                    ) : (
                      <>📊 Excel ({sellersData.length})</>
                    )}
                  </Button>
                  <Button
                    variant="danger"
                    onClick={handleExportToPDF}
                    className="d-flex align-items-center justify-content-center"
                    disabled={isExportingExcel || isExportingPDF || sellersData.length === 0}
                    style={{ minWidth: '120px' }}
                  >
                    {isExportingPDF ? (
                      <>
                        <div
                          className="spinner-border spinner-border-sm me-2"
                          role="status"
                          aria-hidden="true"
                          style={{ width: '16px', height: '16px' }}
                        ></div>
                        Exporting...
                      </>
                    ) : (
                      <>📄 PDF ({sellersData.length})</>
                    )}
                  </Button>
                </div>
              </Col>
            </Row>
          </Card.Header>
          <Card.Body className="p-0">
            {/* Desktop Table View */}
            <div className="d-none d-lg-block">
              <div className="table-card" style={{ height: '400px' }}>
                <PerfectScrollbar>
                  <Table
                    responsive
                    ref={tableRef}
                    className="table-bordered mb-0"
                    style={{
                      border: '1px solid #dee2e6',
                      borderCollapse: 'collapse'
                    }}
                  >
                    <thead>
                      <tr>
                        <th>Sr. No.</th>
                        <th>Full Name</th>
                        <th>Mobile Number</th>
                        <th>City</th>
                        <th>Total Amount</th>
                        <th>Paid</th>
                        <th>Outstanding</th>
                        <th>Created Date</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        <tr>
                          <td colSpan="9" className="text-center py-4">
                            <div className="spinner-border" role="status">
                              <span className="sr-only">Loading...</span>
                            </div>
                          </td>
                        </tr>
                      ) : currentData.length > 0 ? (
                        currentData.map((seller, index) => (
                          <tr key={seller.Id}>
                            <td>{startIndex + index + 1}</td>
                            <td>{seller.FullName}</td>
                            <td>{seller.MobileNumber}</td>
                            <td>{seller.City}</td>
                            <td>{seller.milkTransactions?.totalAmount || 0}</td>
                            <td style={{ color: 'red', fontWeight: 'bold' }}>₹{seller.payments?.totalPaid || 0}</td>
                            <td style={{ color: seller.outstandingAmount > 0 ? 'red' : 'green', fontWeight: 'bold' }}>
                              ₹{seller.outstandingAmount || 0}
                            </td>
                            <td>{seller.CreatedAt ? new Date(seller.CreatedAt).toLocaleDateString('en-IN') : 'N/A'}</td>
                            <td>
                              <Button
                                variant="info"
                                size="sm"
                                className="me-2"
                                onClick={() => handleEditSeller(seller.Id)}
                                disabled={loading}
                                title="Edit Seller"
                              >
                                <FaEdit />
                              </Button>
                              <Button
                                variant="danger"
                                size="sm"
                                onClick={() => confirmDelete(seller.Id, seller.FullName)}
                                disabled={loading}
                                title="Delete Seller"
                              >
                                <FaTrashAlt />
                              </Button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="9" className="text-center py-4">
                            {searchTerm ? 'No sellers found matching your search.' : 'No sellers found.'}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </Table>
                </PerfectScrollbar>
              </div>
            </div>

            {/* Mobile Card View */}
            <div className="d-lg-none">
              {loading ? (
                <div className="text-center py-4">
                  <div className="spinner-border" role="status">
                    <span className="sr-only">Loading...</span>
                  </div>
                </div>
              ) : currentData.length > 0 ? (
                <div className="mobile-cards-container">
                  {currentData.map((seller, index) => (
                    <div key={seller.Id} className="mobile-card">
                      <div className="mobile-card-header">
                        <div className="mobile-card-title">{seller.FullName}</div>
                        <div className="mobile-card-number">#{startIndex + index + 1}</div>
                      </div>

                      <div className="mobile-card-body">
                        <div className="mobile-info-group">
                          <div className="mobile-info-item">
                            <div className="mobile-info-label">Mobile</div>
                            <div className="mobile-info-value">{seller.MobileNumber}</div>
                          </div>
                          <div className="mobile-info-item">
                            <div className="mobile-info-label">City</div>
                            <div className="mobile-info-value">{seller.City}</div>
                          </div>
                        </div>

                        <div className="mobile-info-group">
                          <div className="mobile-info-item">
                            <div className="mobile-info-label">Total Business</div>
                            <div className="mobile-info-value">₹{seller.milkTransactions?.totalAmount || 0}</div>
                          </div>
                          <div className="mobile-info-item">
                            <div className="mobile-info-label">Paid</div>
                            <div className="mobile-info-value" style={{ color: 'red' }}>
                              ₹{seller.payments?.totalPaid || 0}
                            </div>
                          </div>
                        </div>

                        <div className="mobile-info-group">
                          <div className="mobile-info-item">
                            <div className="mobile-info-label">Outstanding</div>
                            <div
                              className="mobile-info-value"
                              style={{
                                color: seller.outstandingAmount > 0 ? 'red' : 'green',
                                fontWeight: '600'
                              }}
                            >
                              ₹{seller.outstandingAmount || 0}
                            </div>
                          </div>
                        </div>

                        <div className="mobile-info-group">
                          <div className="mobile-info-item">
                            <div className="mobile-info-label">Created Date</div>
                            <div className="mobile-info-value">
                              {seller.CreatedAt ? new Date(seller.CreatedAt).toLocaleDateString('en-IN') : 'N/A'}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="mobile-card-actions">
                        <Button variant="info" onClick={() => handleEditSeller(seller.Id)} disabled={loading} className="mobile-action-btn">
                          <FaEdit className="me-1" /> Edit
                        </Button>
                        <Button
                          variant="danger"
                          onClick={() => confirmDelete(seller.Id, seller.FullName)}
                          disabled={loading}
                          className="mobile-action-btn"
                        >
                          <FaTrashAlt className="me-1" /> Delete
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  <div className="empty-state-icon">📋</div>
                  <div className="empty-state-message">{searchTerm ? 'No sellers found matching your search.' : 'No sellers found.'}</div>
                  {searchTerm && <div className="empty-state-suggestion">Try adjusting your search terms or add a new seller.</div>}
                </div>
              )}
            </div>

            {/* Responsive Pagination */}
            {totalPages > 1 && (
              <div className="pagination-wrapper">
                <div className="pagination-info">
                  <small className="text-muted">
                    Showing {startIndex + 1} to {Math.min(endIndex, totalItems)} of {totalItems} entries
                    {searchTerm && ` (filtered from ${allSellersData.length} total entries)`}
                  </small>
                </div>

                <div className="pagination-controls">
                  <Button variant="outline-secondary" onClick={handlePrevPage} disabled={currentPage === 1} className="pagination-btn">
                    <span className="d-none d-sm-inline">Previous</span>
                    <span className="d-sm-none">Prev</span>
                  </Button>

                  <div className="pagination-numbers">
                    {getPageNumbers().map((pageNum) => (
                      <Button
                        key={pageNum}
                        variant={pageNum === currentPage ? 'primary' : 'outline-primary'}
                        onClick={() => handlePageChange(pageNum)}
                        className="pagination-number"
                      >
                        {pageNum}
                      </Button>
                    ))}
                  </div>

                  <Button
                    variant="outline-secondary"
                    onClick={handleNextPage}
                    disabled={currentPage === totalPages}
                    className="pagination-btn"
                  >
                    <span className="d-none d-sm-inline">Next</span>
                    <span className="d-sm-none">Next</span>
                  </Button>
                </div>
              </div>
            )}
          </Card.Body>
        </Card>
      </Col>
    </React.Fragment>
  );
}

export default Sellers;
