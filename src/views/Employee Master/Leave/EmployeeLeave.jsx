import React, { useState, useRef, useEffect } from 'react';
import { Row, Col, Card, Table, Button, Form, Pagination, Modal, Badge } from 'react-bootstrap';
import PerfectScrollbar from 'react-perfect-scrollbar';
import { writeFile, utils } from 'xlsx';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import axios from 'axios';
import { FaEdit, FaTrashAlt } from 'react-icons/fa';
import '../commonemp.scss';

function EmployeeLeave() {
  const tableRef = useRef(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [tableData, setTableData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState(null);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  const [formData, setFormData] = useState({
    EmployeeId: '',
    EmployeeName: '',
    StartDate: '',
    EndDate: '',
    LeaveType: 'Casual Leave',
    Reason: ''
  });

  const [editFormData, setEditFormData] = useState({
    EmployeeId: '',
    EmployeeName: '',
    StartDate: '',
    EndDate: '',
    LeaveType: 'Casual Leave',
    Reason: ''
  });

  const [errors, setErrors] = useState({});

  // Calculate pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  const renderPaginationItems = () => {
    const items = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        items.push(
          <Pagination.Item key={i} active={i === currentPage} onClick={() => setCurrentPage(i)}>
            {i}
          </Pagination.Item>
        );
      }
    } else {
      items.push(<Pagination.First key="first" onClick={() => setCurrentPage(1)} disabled={currentPage === 1} />);
      items.push(<Pagination.Prev key="prev" onClick={() => setCurrentPage(currentPage - 1)} disabled={currentPage === 1} />);

      let startPage = Math.max(1, currentPage - 2);
      let endPage = Math.min(totalPages, currentPage + 2);

      if (startPage > 1) {
        items.push(<Pagination.Ellipsis key="start-ellipsis" />);
      }

      for (let i = startPage; i <= endPage; i++) {
        items.push(
          <Pagination.Item key={i} active={i === currentPage} onClick={() => setCurrentPage(i)}>
            {i}
          </Pagination.Item>
        );
      }

      if (endPage < totalPages) {
        items.push(<Pagination.Ellipsis key="end-ellipsis" />);
      }

      items.push(<Pagination.Next key="next" onClick={() => setCurrentPage(currentPage + 1)} disabled={currentPage === totalPages} />);
      items.push(<Pagination.Last key="last" onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages} />);
    }

    return items;
  };

  useEffect(() => {
    fetchTableData();
    fetchEmployees();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      const filtered = tableData.filter(
        (item) =>
          (item.EmployeeName && item.EmployeeName.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (item.LeaveType && item.LeaveType.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (item.Reason && item.Reason.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setFilteredData(filtered);
    } else {
      setFilteredData(tableData);
    }
    setCurrentPage(1);
  }, [searchTerm, tableData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    // Auto-fill employee name when employee is selected
    if (name === 'EmployeeId') {
      const selectedEmployee = employees.find((emp) => emp.Id.toString() === value);
      if (selectedEmployee) {
        setFormData((prev) => ({
          ...prev,
          [name]: value,
          EmployeeName: selectedEmployee.FullName
        }));
      }
    }
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditFormData({ ...editFormData, [name]: value });

    // Auto-fill employee name when employee is selected
    if (name === 'EmployeeId') {
      const selectedEmployee = employees.find((emp) => emp.Id.toString() === value);
      if (selectedEmployee) {
        setEditFormData((prev) => ({
          ...prev,
          [name]: value,
          EmployeeName: selectedEmployee.FullName
        }));
      }
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.EmployeeId) newErrors.EmployeeId = 'Employee is required';
    if (!formData.StartDate) newErrors.StartDate = 'Start Date is required';
    if (!formData.EndDate) newErrors.EndDate = 'End Date is required';
    if (!formData.Reason) newErrors.Reason = 'Reason is required';

    // Validate date order
    if (formData.StartDate && formData.EndDate && new Date(formData.StartDate) > new Date(formData.EndDate)) {
      newErrors.EndDate = 'End date cannot be before start date';
    }

    return newErrors;
  };

  const validateEdit = () => {
    const newErrors = {};
    if (!editFormData.EmployeeId) newErrors.EmployeeId = 'Employee is required';
    if (!editFormData.StartDate) newErrors.StartDate = 'Start Date is required';
    if (!editFormData.EndDate) newErrors.EndDate = 'End Date is required';
    if (!editFormData.Reason) newErrors.Reason = 'Reason is required';

    // Validate date order
    if (editFormData.StartDate && editFormData.EndDate && new Date(editFormData.StartDate) > new Date(editFormData.EndDate)) {
      newErrors.EndDate = 'End date cannot be before start date';
    }

    return newErrors;
  };

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    setCurrentPage(1);
  };

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

  const fetchTableData = async () => {
    try {
      const res = await axios.get('https://api.mytemplesoftware.in/api/employee-leave', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = res.data.leaveRecords;
      if (data) {
        setTableData(data);
        setFilteredData(data);
      }
    } catch (error) {
      console.error('Error fetching leave records:', error);
      if (error.response?.status === 404) {
        setTableData([]);
        setFilteredData([]);
      }
    }
  };

  const handleExportToExcel = () => {
    const excelData = filteredData.map((item, index) => ({
      अनुक्रमांक: index + 1,
      'कर्मचारी नाव': item.EmployeeName || '',
      'रजा प्रकार': item.LeaveType || '',
      'प्रारंभ तारीख': new Date(item.StartDate).toLocaleDateString('en-IN'),
      'समाप्ती तारीख': new Date(item.EndDate).toLocaleDateString('en-IN'),
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
      { wch: 30 }, // Reason
      { wch: 15 } // Created Date
    ];
    ws['!cols'] = colWidths;

    utils.book_append_sheet(wb, ws, 'Leave Data');

    const currentDate = new Date().toISOString().split('T')[0];
    const filename = `Leave_Data_${currentDate}.xlsx`;

    writeFile(wb, filename);
  };

  const handleExportToPDF = () => {
    const table = tableRef.current;
    if (!table) return;

    const clonedTable = table.cloneNode(true);
    const headers = clonedTable.querySelectorAll('th');
    const rows = clonedTable.querySelectorAll('tr');
    const actionIndex = headers.length - 1;

    headers[actionIndex].remove();

    rows.forEach((row) => {
      const cells = row.querySelectorAll('td');
      if (cells[actionIndex]) {
        cells[actionIndex].remove();
      }
    });

    clonedTable.style.position = 'absolute';
    clonedTable.style.top = '-9999px';
    document.body.appendChild(clonedTable);

    html2canvas(clonedTable).then((canvas) => {
      document.body.removeChild(clonedTable);

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

      pdf.save(`Leave_${new Date().toLocaleDateString()}.pdf`);
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formErrors = validate();
    if (Object.keys(formErrors).length === 0) {
      try {
        const response = await axios.post('https://api.mytemplesoftware.in/api/employee-leave', formData, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.status === 201) {
          alert('Leave request created successfully');
          setFormData({
            EmployeeId: '',
            EmployeeName: '',
            StartDate: '',
            EndDate: '',
            LeaveType: 'Casual Leave',
            Reason: ''
          });
          setShowModal(false);
          fetchTableData();
        }
      } catch (error) {
        console.error('Error creating leave request:', error);
        alert(error.response?.data?.message || 'Error creating leave request');
      }
    } else {
      setErrors(formErrors);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    const formErrors = validateEdit();
    if (Object.keys(formErrors).length === 0) {
      try {
        const response = await axios.put(`https://api.mytemplesoftware.in/api/employee-leave/${selectedLeave.Id}`, editFormData, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.status === 200) {
          alert('Leave request updated successfully');
          setShowEditModal(false);
          fetchTableData();
        }
      } catch (error) {
        console.error('Error updating leave request:', error);
        alert(error.response?.data?.message || 'Error updating leave request');
      }
    } else {
      setErrors(formErrors);
    }
  };

  const confirmDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this leave request?')) {
      handleDelete(id);
    }
  };

  const handleDelete = async (id) => {
    try {
      const response = await axios.delete(`https://api.mytemplesoftware.in/api/employee-leave/${id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.status === 200) {
        alert('Leave request deleted successfully');
        setTableData((prevData) => prevData.filter((item) => item.Id !== id));
        setFilteredData((prevData) => prevData.filter((item) => item.Id !== id));
      }
    } catch (error) {
      console.error('Error deleting leave request:', error);
      alert('Error deleting leave request');
    }
  };

  const openEditModal = (leave) => {
    setSelectedLeave(leave);
    setEditFormData({
      EmployeeId: leave.EmployeeId,
      EmployeeName: leave.EmployeeName,
      StartDate: leave.StartDate.split('T')[0],
      EndDate: leave.EndDate.split('T')[0],
      LeaveType: leave.LeaveType,
      Reason: leave.Reason
    });
    setShowEditModal(true);
  };

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
      <Col sm={12}>
        <Card>
          <Card.Header>
            <Row>
              <Col md={6}>
                <Card.Title as="h4">कर्मचारी रजा व्यवस्थापन</Card.Title>
              </Col>
              <Col md={6} className="d-flex justify-content-end">
                <Button variant="primary" onClick={() => setShowModal(true)} className="me-2">
                  नवीन रजा अर्ज
                </Button>
              </Col>
            </Row>
          </Card.Header>
        </Card>
      </Col>

      <Col sm={12}>
        <Card>
          <Card.Header>
            <Row>
              <Col md={3}>
                <Card.Title as="h4">रजा नोंदी</Card.Title>
              </Col>
              <Col md={9} className="d-flex justify-content-end align-items-center">
                <Form.Control
                  type="text"
                  placeholder="Search"
                  value={searchTerm}
                  onChange={handleSearchChange}
                  className="me-2"
                  style={{ width: '200px' }}
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
            <div className="table-card" style={{ height: '500px' }}>
              <PerfectScrollbar options={{ suppressScrollX: true, wheelPropagation: false }}>
                <Table
                  responsive
                  ref={tableRef}
                  className="table-bordered"
                  style={{
                    border: '2px solid #dee2e6',
                    borderCollapse: 'collapse'
                  }}
                >
                  <thead style={{ backgroundColor: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
                    <tr>
                      <th>कर्मचारी नाव</th>
                      <th>रजा प्रकार</th>
                      <th>प्रारंभ तारीख</th>
                      <th>समाप्ती तारीख</th>
                      <th>दिवस</th>
                      <th>कारण</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentItems && currentItems.length > 0 ? (
                      currentItems.map((item) => (
                        <tr key={item.Id}>
                          <td>{item.EmployeeName}</td>
                          <td>
                            <Badge bg={getLeaveTypeBadge(item.LeaveType)}>{item.LeaveType}</Badge>
                          </td>
                          <td>{new Date(item.StartDate).toLocaleDateString('en-IN')}</td>
                          <td>{new Date(item.EndDate).toLocaleDateString('en-IN')}</td>
                          <td>{calculateDays(item.StartDate, item.EndDate)}</td>
                          <td title={item.Reason}>{item.Reason.length > 30 ? `${item.Reason.substring(0, 30)}...` : item.Reason}</td>
                          <td>
                            <Button variant="primary" size="sm" onClick={() => openEditModal(item)} className="me-1" title="Edit Leave">
                              <FaEdit />
                            </Button>
                            <Button variant="danger" size="sm" onClick={() => confirmDelete(item.Id)} title="Delete Leave">
                              <FaTrashAlt />
                            </Button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="7" className="text-center">
                          {searchTerm ? 'No matching records found' : 'No leave requests found'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </Table>
              </PerfectScrollbar>
            </div>

            {filteredData.length > 0 && (
              <div className="d-flex justify-content-between align-items-center p-3">
                <div className="text-muted">
                  Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredData.length)} of {filteredData.length} entries
                  {searchTerm && <span> (filtered from {tableData.length} total entries)</span>}
                </div>

                {totalPages > 1 && <Pagination className="mb-0">{renderPaginationItems()}</Pagination>}
              </div>
            )}
          </Card.Body>
        </Card>
      </Col>

      {/* Add Leave Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>नवीन रजा अर्ज</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleSubmit}>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>कर्मचारी *</Form.Label>
                  <Form.Select name="EmployeeId" value={formData.EmployeeId} onChange={handleChange} required>
                    <option value="">Select Employee</option>
                    {employees.map((employee) => (
                      <option key={employee.Id} value={employee.Id}>
                        {employee.FullName}
                      </option>
                    ))}
                  </Form.Select>
                  {errors.EmployeeId && <span className="text-danger">{errors.EmployeeId}</span>}
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>रजा प्रकार</Form.Label>
                  <Form.Select name="LeaveType" value={formData.LeaveType} onChange={handleChange}>
                    <option value="Casual Leave">Casual Leave</option>
                    <option value="Sick Leave">Sick Leave</option>
                    <option value="Annual Leave">Annual Leave</option>
                    <option value="Emergency Leave">Emergency Leave</option>
                    <option value="Maternity Leave">Maternity Leave</option>
                    <option value="Paternity Leave">Paternity Leave</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>प्रारंभ तारीख *</Form.Label>
                  <Form.Control type="date" name="StartDate" value={formData.StartDate} onChange={handleChange} required />
                  {errors.StartDate && <span className="text-danger">{errors.StartDate}</span>}
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>समाप्ती तारीख *</Form.Label>
                  <Form.Control type="date" name="EndDate" value={formData.EndDate} onChange={handleChange} required />
                  {errors.EndDate && <span className="text-danger">{errors.EndDate}</span>}
                </Form.Group>
              </Col>
            </Row>
            {formData.StartDate && formData.EndDate && (
              <Row>
                <Col md={12}>
                  <div className="mb-3">
                    <strong>एकूण दिवस: {calculateDays(formData.StartDate, formData.EndDate)}</strong>
                  </div>
                </Col>
              </Row>
            )}
            <Row>
              <Col md={12}>
                <Form.Group className="mb-3">
                  <Form.Label>कारण *</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    name="Reason"
                    value={formData.Reason}
                    onChange={handleChange}
                    placeholder="Enter reason for leave"
                    required
                  />
                  {errors.Reason && <span className="text-danger">{errors.Reason}</span>}
                </Form.Group>
              </Col>
            </Row>
            <div className="d-flex justify-content-end">
              <Button variant="secondary" onClick={() => setShowModal(false)} className="me-2">
                Cancel
              </Button>
              <Button type="submit" variant="primary">
                Submit
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>

      {/* Edit Leave Modal */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>रजा अर्ज संपादित करा</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleEditSubmit}>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>कर्मचारी *</Form.Label>
                  <Form.Select name="EmployeeId" value={editFormData.EmployeeId} onChange={handleEditChange} required>
                    <option value="">Select Employee</option>
                    {employees.map((employee) => (
                      <option key={employee.Id} value={employee.Id}>
                        {employee.FullName}
                      </option>
                    ))}
                  </Form.Select>
                  {errors.EmployeeId && <span className="text-danger">{errors.EmployeeId}</span>}
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>रजा प्रकार</Form.Label>
                  <Form.Select name="LeaveType" value={editFormData.LeaveType} onChange={handleEditChange}>
                    <option value="Casual Leave">Casual Leave</option>
                    <option value="Sick Leave">Sick Leave</option>
                    <option value="Annual Leave">Annual Leave</option>
                    <option value="Emergency Leave">Emergency Leave</option>
                    <option value="Maternity Leave">Maternity Leave</option>
                    <option value="Paternity Leave">Paternity Leave</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>प्रारंभ तारीख *</Form.Label>
                  <Form.Control type="date" name="StartDate" value={editFormData.StartDate} onChange={handleEditChange} required />
                  {errors.StartDate && <span className="text-danger">{errors.StartDate}</span>}
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>समाप्ती तारीख *</Form.Label>
                  <Form.Control type="date" name="EndDate" value={editFormData.EndDate} onChange={handleEditChange} required />
                  {errors.EndDate && <span className="text-danger">{errors.EndDate}</span>}
                </Form.Group>
              </Col>
            </Row>
            {editFormData.StartDate && editFormData.EndDate && (
              <Row>
                <Col md={12}>
                  <div className="mb-3">
                    <strong>एकूण दिवस: {calculateDays(editFormData.StartDate, editFormData.EndDate)}</strong>
                  </div>
                </Col>
              </Row>
            )}
            <Row>
              <Col md={12}>
                <Form.Group className="mb-3">
                  <Form.Label>कारण *</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    name="Reason"
                    value={editFormData.Reason}
                    onChange={handleEditChange}
                    placeholder="Enter reason for leave"
                    required
                  />
                  {errors.Reason && <span className="text-danger">{errors.Reason}</span>}
                </Form.Group>
              </Col>
            </Row>
            <div className="d-flex justify-content-end">
              <Button variant="secondary" onClick={() => setShowEditModal(false)} className="me-2">
                Cancel
              </Button>
              <Button type="submit" variant="primary">
                Update
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>
    </React.Fragment>
  );
}

export default EmployeeLeave;
