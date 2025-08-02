import React, { useState, useRef, useEffect } from 'react';
import { Row, Col, Card, Table, Button, Form, Alert, Badge } from 'react-bootstrap';
import PerfectScrollbar from 'react-perfect-scrollbar';
import { writeFile, utils } from 'xlsx';
import axios from 'axios';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import '../common.scss';

function LeaveReport() {
  const tableRef = useRef(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [reportData, setReportData] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    startDate: '',
    endDate: '',
    employeeId: ''
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const res = await axios.get('https://api.mytemplesoftware.in/api/employees', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (res.data.employees) {
        setEmployees(res.data.employees);
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.startDate) newErrors.startDate = 'Start Date is required';
    if (!formData.endDate) newErrors.endDate = 'End Date is required';

    if (formData.startDate && formData.endDate && new Date(formData.startDate) > new Date(formData.endDate)) {
      newErrors.endDate = 'End date cannot be before start date';
    }

    return newErrors;
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formErrors = validate();
    if (Object.keys(formErrors).length === 0) {
      setLoading(true);
      setError('');

      try {
        const params = new URLSearchParams({
          startDate: formData.startDate,
          endDate: formData.endDate
        });

        if (formData.employeeId) {
          params.append('employeeId', formData.employeeId);
        }

        const response = await axios.get(`https://api.mytemplesoftware.in/api/employee-reports/leave?${params}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });

        setReportData(response.data);
      } catch (error) {
        console.error('Error fetching leave report:', error);
        setError(error.response?.data?.message || 'Error fetching leave report');
        setReportData(null);
      } finally {
        setLoading(false);
      }
    } else {
      setErrors(formErrors);
    }
  };

  const handleExportToExcel = () => {
    if (!reportData || !reportData.records) {
      alert('No data available to export');
      return;
    }

    const excelData = filteredRecords.map((item, index) => ({
      अनुक्रमांक: index + 1,
      'कर्मचारी नाव': item.EmployeeName || '',
      'रजा प्रकार': item.LeaveType || '',
      'प्रारंभ तारीख': new Date(item.StartDate).toLocaleDateString('en-IN'),
      'समाप्ती तारीख': new Date(item.EndDate).toLocaleDateString('en-IN'),
      'एकूण दिवस': item.TotalDays || '',
      कारण: item.Reason || '',
      'अर्ज तारीख': new Date(item.CreatedAt).toLocaleDateString('en-IN')
    }));

    const wb = utils.book_new();
    const ws = utils.json_to_sheet(excelData);

    const colWidths = [
      { wch: 10 }, // Sr.No
      { wch: 20 }, // Employee Name
      { wch: 15 }, // Leave Type
      { wch: 15 }, // Start Date
      { wch: 15 }, // End Date
      { wch: 12 }, // Total Days
      { wch: 30 }, // Reason
      { wch: 15 } // Created Date
    ];
    ws['!cols'] = colWidths;

    utils.book_append_sheet(wb, ws, 'Leave Report');

    const currentDate = new Date().toISOString().split('T')[0];
    const filename = `Leave_Report_${currentDate}.xlsx`;

    writeFile(wb, filename);
  };

  const handleExportToPDF = async () => {
    if (!reportData || !reportData.records) {
      alert('No data available to export');
      return;
    }

    try {
      const element = tableRef.current;
      if (!element) {
        alert('Table not found');
        return;
      }

      // Wait for fonts to load
      await document.fonts.ready;

      // Create canvas from the table element
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        onclone: (clonedDoc) => {
          // Replace Marathi text with English in cloned document
          const tables = clonedDoc.querySelectorAll('table');
          tables.forEach((table) => {
            const headers = table.querySelectorAll('th');
            if (headers.length >= 7) {
              headers[0].textContent = 'Sr.No';
              headers[1].textContent = 'Employee Name';
              headers[2].textContent = 'Leave Type';
              headers[3].textContent = 'Start Date';
              headers[4].textContent = 'End Date';
              headers[5].textContent = 'Reason';
              headers[6].textContent = 'Created Date';
            }
          });
        }
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('l', 'mm', 'a4'); // landscape orientation

      const imgWidth = 280; // A4 landscape width in mm minus margins
      const pageHeight = 190; // A4 landscape height in mm minus margins
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 15; // top margin

      // Add title in English
      pdf.setFontSize(16);
      pdf.text('Employee Leave Report', 140, 10, { align: 'center' });

      // Add image to PDF
      pdf.addImage(imgData, 'PNG', 15, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      // Add new pages if content is longer than one page
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight + 15;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 15, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      const currentDate = new Date().toISOString().split('T')[0];
      pdf.save(`Leave_Report_${currentDate}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF. Please try again.');
    }
  };

  const filteredRecords =
    reportData?.records?.filter((record) => {
      if (!searchTerm) return true;

      return (
        (record.EmployeeName && record.EmployeeName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (record.LeaveType && record.LeaveType.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (record.Reason && record.Reason.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }) || [];

  const calculateDays = (startDate, endDate) => {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  };

  const getLeaveTypeBadge = (leaveType) => {
    const typeClasses = {
      'Sick Leave': 'info',
      'Casual Leave': 'primary',
      'Annual Leave': 'success',
      'Emergency Leave': 'warning',
      'Maternity Leave': 'secondary',
      'Paternity Leave': 'dark'
    };
    return typeClasses[leaveType] || 'light';
  };

  return (
    <React.Fragment>
      <Row>
        <Col sm={12} style={{ display: 'flex', justifyContent: 'center' }}>
          <Card style={{ width: '800px' }}>
            <Card.Header>
              <Card.Title as="h4" style={{ display: 'flex', justifyContent: 'center' }}>
                कर्मचारी रजा अहवाल
              </Card.Title>
            </Card.Header>
            <Card.Body className="p-0">
              <form onSubmit={handleSubmit} className="register-form">
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="startDate">प्रारंभ तारीख *</label>
                    <input type="date" name="startDate" value={formData.startDate} onChange={handleChange} required />
                    {errors.startDate && <span className="error">{errors.startDate}</span>}
                  </div>
                  <div className="form-group">
                    <label htmlFor="endDate">समाप्ती तारीख *</label>
                    <input type="date" name="endDate" value={formData.endDate} onChange={handleChange} required />
                    {errors.endDate && <span className="error">{errors.endDate}</span>}
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="employeeId">कर्मचारी (वैकल्पिक)</label>
                    <select name="employeeId" value={formData.employeeId} onChange={handleChange}>
                      <option value="">सर्व कर्मचारी</option>
                      {employees.map((employee) => (
                        <option key={employee.Id} value={employee.Id}>
                          {employee.FullName}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="form-actions">
                  <button type="submit" disabled={loading}>
                    {loading ? 'Loading...' : 'अहवाल तयार करा'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setFormData({ startDate: '', endDate: '', employeeId: '' });
                      setReportData(null);
                      setError('');
                    }}
                  >
                    Clear
                  </button>
                </div>
              </form>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {error && (
        <Row className="mt-3">
          <Col sm={12}>
            <Alert variant="danger">{error}</Alert>
          </Col>
        </Row>
      )}

      {/* Report Table - Always Visible */}
      <Col sm={12} className="mt-4">
        <Card>
          <Card.Header>
            <Row>
              <Col md={6}>
                <Card.Title as="h4">{reportData?.reportTitle || 'कर्मचारी रजा अहवाल'}</Card.Title>
                {reportData && (
                  <small className="text-muted">
                    तारीख: {new Date(reportData.dateRange.startDate).toLocaleDateString('en-IN')}
                    {' ते '}
                    {new Date(reportData.dateRange.endDate).toLocaleDateString('en-IN')}
                  </small>
                )}
              </Col>
              <Col md={6} className="d-flex justify-content-end align-items-center">
                <Form.Control
                  type="text"
                  value={searchTerm}
                  placeholder="Search"
                  onChange={handleSearchChange}
                  className="me-2"
                  style={{ width: '200px' }}
                />
                <Button variant="success" onClick={handleExportToExcel} className="me-2" disabled={!reportData}>
                  Excel
                </Button>
                <Button variant="primary" onClick={handleExportToPDF} disabled={!reportData}>
                  PDF
                </Button>
              </Col>
            </Row>
          </Card.Header>
          <Card.Body className="p-0">
            <div className="table-card" style={{ height: '400px' }}>
              <PerfectScrollbar>
                <Table
                  responsive
                  ref={tableRef}
                  className="table-bordered"
                  style={{
                    border: '1px solid #dee2e6',
                    borderCollapse: 'collapse'
                  }}
                >
                  <thead style={{ backgroundColor: '#f8f9fa' }}>
                    <tr>
                      <th>अनुक्रमांक</th>
                      <th>कर्मचारी नाव</th>
                      <th>रजा प्रकार</th>
                      <th>प्रारंभ तारीख</th>
                      <th>समाप्ती तारीख</th>
                      <th>एकूण दिवस</th>
                      <th>कारण</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRecords.length > 0 ? (
                      filteredRecords.map((record, index) => (
                        <tr key={index}>
                          <td>{index + 1}</td>
                          <td>{record.EmployeeName}</td>
                          <td>
                            <Badge bg={getLeaveTypeBadge(record.LeaveType)}>{record.LeaveType}</Badge>
                          </td>
                          <td>{new Date(record.StartDate).toLocaleDateString('en-IN')}</td>
                          <td>{new Date(record.EndDate).toLocaleDateString('en-IN')}</td>
                          <td>{calculateDays(record.StartDate, record.EndDate)}</td>
                          <td title={record.Reason}>
                            {record.Reason.length > 30 ? `${record.Reason.substring(0, 30)}...` : record.Reason}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="7" className="text-center">
                          {reportData
                            ? searchTerm
                              ? 'No matching records found'
                              : 'No leave records found'
                            : 'Please generate report to view data'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </Table>
              </PerfectScrollbar>
            </div>
          </Card.Body>
        </Card>
      </Col>
    </React.Fragment>
  );
}

export default LeaveReport;
