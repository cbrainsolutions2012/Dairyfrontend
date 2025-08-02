import React, { useState, useRef, useEffect } from 'react';
import { Row, Col, Card, Table, Button, Form, Pagination, Modal } from 'react-bootstrap';
import PerfectScrollbar from 'react-perfect-scrollbar';
import { writeFile, utils } from 'xlsx';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import axios from 'axios';
import { FaEdit, FaTrashAlt, FaClock } from 'react-icons/fa';
import '../commonemp.scss';

function EmployeeAttendance() {
  const tableRef = useRef(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [tableData, setTableData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showClockOutModal, setShowClockOutModal] = useState(false);
  const [selectedAttendance, setSelectedAttendance] = useState(null);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  const [formData, setFormData] = useState({
    Date: new Date().toISOString().split('T')[0],
    EmployeeId: '',
    EmployeeName: '',
    StartingHour: '',
    EndingHour: '',
    Status: 'Present',
    Notes: ''
  });

  const [editFormData, setEditFormData] = useState({
    Date: '',
    EmployeeId: '',
    EmployeeName: '',
    StartingHour: '',
    EndingHour: '',
    Status: 'Present',
    Notes: ''
  });

  const [clockOutData, setClockOutData] = useState({
    EndingHour: ''
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

  const handleClockOutChange = (e) => {
    const { name, value } = e.target;
    setClockOutData({ ...clockOutData, [name]: value });
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.Date) newErrors.Date = 'Date is required';
    if (!formData.EmployeeId) newErrors.EmployeeId = 'Employee is required';
    if (!formData.StartingHour) newErrors.StartingHour = 'Starting Hour is required';
    return newErrors;
  };

  const validateEdit = () => {
    const newErrors = {};
    if (!editFormData.Date) newErrors.Date = 'Date is required';
    if (!editFormData.EmployeeId) newErrors.EmployeeId = 'Employee is required';
    if (!editFormData.StartingHour) newErrors.StartingHour = 'Starting Hour is required';
    return newErrors;
  };

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    setCurrentPage(1);

    if (value === '') {
      setFilteredData(tableData);
    } else {
      const filtered = tableData.filter(
        (item) =>
          (item.EmployeeName && item.EmployeeName.toLowerCase().includes(value.toLowerCase())) ||
          (item.Status && item.Status.toLowerCase().includes(value.toLowerCase())) ||
          (item.Date && item.Date.includes(value)) ||
          (item.StartingHour && item.StartingHour.includes(value)) ||
          (item.EndingHour && item.EndingHour && item.EndingHour.includes(value))
      );
      setFilteredData(filtered);
    }
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
      const res = await axios.get('https://api.mytemplesoftware.in/api/employee-attendance', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = res.data.attendanceRecords;
      if (data) {
        setTableData(data);
        setFilteredData(data);
      }
    } catch (error) {
      console.error('Error fetching attendance records:', error);
      if (error.response?.status === 404) {
        setTableData([]);
        setFilteredData([]);
      }
    }
  };

  const handleExportToExcel = () => {
    const excelData = filteredData.map((item, index) => ({
      अनुक्रमांक: index + 1,
      तारीख: new Date(item.Date).toLocaleDateString('en-IN'),
      'कर्मचारी नाव': item.EmployeeName || '',
      'प्रारंभ वेळ': item.StartingHour || '',
      'समाप्ती वेळ': item.EndingHour || '',
      स्थिती: item.Status || '',
      टिप्पणी: item.Notes || ''
    }));

    const wb = utils.book_new();
    const ws = utils.json_to_sheet(excelData);

    const colWidths = [
      { wch: 10 }, // Sr.No
      { wch: 15 }, // Date
      { wch: 20 }, // Employee Name
      { wch: 15 }, // Starting Hour
      { wch: 15 }, // Ending Hour
      { wch: 12 }, // Status
      { wch: 30 } // Notes
    ];
    ws['!cols'] = colWidths;

    utils.book_append_sheet(wb, ws, 'Attendance Data');

    const currentDate = new Date().toISOString().split('T')[0];
    const filename = `Attendance_Data_${currentDate}.xlsx`;

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

      pdf.save(`Attendance_${new Date().toLocaleDateString()}.pdf`);
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formErrors = validate();
    if (Object.keys(formErrors).length === 0) {
      try {
        const response = await axios.post('https://api.mytemplesoftware.in/api/employee-attendance', formData, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.status === 201) {
          alert('Attendance record created successfully');
          setFormData({
            Date: new Date().toISOString().split('T')[0],
            EmployeeId: '',
            EmployeeName: '',
            StartingHour: '',
            EndingHour: '',
            Status: 'Present',
            Notes: ''
          });
          setShowModal(false);
          fetchTableData();
        }
      } catch (error) {
        console.error('Error creating attendance record:', error);
        alert(error.response?.data?.message || 'Error creating attendance record');
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
        const response = await axios.put(`https://api.mytemplesoftware.in/api/employee-attendance/${selectedAttendance.Id}`, editFormData, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.status === 200) {
          alert('Attendance record updated successfully');
          setShowEditModal(false);
          fetchTableData();
        }
      } catch (error) {
        console.error('Error updating attendance record:', error);
        alert(error.response?.data?.message || 'Error updating attendance record');
      }
    } else {
      setErrors(formErrors);
    }
  };

  const handleClockOutSubmit = async (e) => {
    e.preventDefault();
    if (!clockOutData.EndingHour) {
      alert('Ending hour is required');
      return;
    }

    try {
      const response = await axios.patch(
        `https://api.mytemplesoftware.in/api/employee-attendance/${selectedAttendance.Id}/clock-out`,
        clockOutData,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.status === 200) {
        alert('Clock out time updated successfully');
        setShowClockOutModal(false);
        setClockOutData({ EndingHour: '' });
        fetchTableData();
      }
    } catch (error) {
      console.error('Error updating clock out time:', error);
      alert(error.response?.data?.message || 'Error updating clock out time');
    }
  };

  const confirmDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this attendance record?')) {
      handleDelete(id);
    }
  };

  const handleDelete = async (id) => {
    try {
      const response = await axios.delete(`https://api.mytemplesoftware.in/api/employee-attendance/${id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.status === 200) {
        alert('Attendance record deleted successfully');
        setTableData((prevData) => prevData.filter((item) => item.Id !== id));
        setFilteredData((prevData) => prevData.filter((item) => item.Id !== id));
      }
    } catch (error) {
      console.error('Error deleting attendance record:', error);
      alert('Error deleting attendance record');
    }
  };

  const openEditModal = (attendance) => {
    setSelectedAttendance(attendance);
    setEditFormData({
      Date: attendance.Date.split('T')[0],
      EmployeeId: attendance.EmployeeId,
      EmployeeName: attendance.EmployeeName,
      StartingHour: attendance.StartingHour,
      EndingHour: attendance.EndingHour || '',
      Status: attendance.Status,
      Notes: attendance.Notes || ''
    });
    setShowEditModal(true);
  };

  const openClockOutModal = (attendance) => {
    setSelectedAttendance(attendance);
    setClockOutData({ EndingHour: '' });
    setShowClockOutModal(true);
  };

  const formatTime = (timeString) => {
    if (!timeString) return '';
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const getStatusBadge = (status) => {
    const statusClasses = {
      Present: 'badge bg-success',
      Absent: 'badge bg-danger',
      'Half Day': 'badge bg-warning',
      Late: 'badge bg-info',
      'Early Leave': 'badge bg-secondary'
    };
    return statusClasses[status] || 'badge bg-primary';
  };

  return (
    <React.Fragment>
      <Col sm={12}>
        <Card>
          <Card.Header>
            <Row>
              <Col md={6}>
                <Card.Title as="h4">कर्मचारी उपस्थिती व्यवस्थापन</Card.Title>
              </Col>
              <Col md={6} className="d-flex justify-content-end">
                <Button variant="primary" onClick={() => setShowModal(true)} className="me-2">
                  नवीन उपस्थिती नोंदणी
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
              <Col md={6}>
                <Card.Title as="h4">उपस्थिती नोंदी</Card.Title>
              </Col>
              <Col md={6} className="d-flex justify-content-end">
                <Form.Control type="text" placeholder="Search" value={searchTerm} onChange={handleSearchChange} className="me-2" />
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
                      <th>तारीख</th>
                      <th>कर्मचारी नाव</th>
                      <th>प्रारंभ वेळ</th>
                      <th>समाप्ती वेळ</th>
                      <th>स्थिती</th>
                      <th>टिप्पणी</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentItems && currentItems.length > 0 ? (
                      currentItems.map((item) => (
                        <tr key={item.Id}>
                          <td>{new Date(item.Date).toLocaleDateString('en-IN')}</td>
                          <td>{item.EmployeeName}</td>
                          <td>{formatTime(item.StartingHour)}</td>
                          <td>{item.EndingHour ? formatTime(item.EndingHour) : '-'}</td>
                          <td>
                            <span className={getStatusBadge(item.Status)}>{item.Status}</span>
                          </td>
                          <td>{item.Notes || '-'}</td>
                          <td>
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => openEditModal(item)}
                              className="me-1"
                              title="Edit Attendance"
                            >
                              <FaEdit />
                            </Button>
                            {!item.EndingHour && (
                              <Button
                                variant="warning"
                                size="sm"
                                onClick={() => openClockOutModal(item)}
                                className="me-1"
                                title="Clock Out"
                              >
                                <FaClock />
                              </Button>
                            )}
                            <Button variant="danger" size="sm" onClick={() => confirmDelete(item.Id)} title="Delete Attendance">
                              <FaTrashAlt />
                            </Button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="7" className="text-center">
                          {searchTerm ? 'No matching records found' : 'No attendance records found'}
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

      {/* Add Attendance Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>नवीन उपस्थिती नोंदणी</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleSubmit}>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>तारीख *</Form.Label>
                  <Form.Control type="date" name="Date" value={formData.Date} onChange={handleChange} required />
                  {errors.Date && <span className="text-danger">{errors.Date}</span>}
                </Form.Group>
              </Col>
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
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>प्रारंभ वेळ *</Form.Label>
                  <Form.Control type="time" name="StartingHour" value={formData.StartingHour} onChange={handleChange} required />
                  {errors.StartingHour && <span className="text-danger">{errors.StartingHour}</span>}
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>समाप्ती वेळ</Form.Label>
                  <Form.Control type="time" name="EndingHour" value={formData.EndingHour} onChange={handleChange} />
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>स्थिती</Form.Label>
                  <Form.Select name="Status" value={formData.Status} onChange={handleChange}>
                    <option value="Present">Present</option>
                    <option value="Absent">Absent</option>
                    <option value="Half Day">Half Day</option>
                    <option value="Late">Late</option>
                    <option value="Early Leave">Early Leave</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>टिप्पणी</Form.Label>
                  <Form.Control as="textarea" rows={2} name="Notes" value={formData.Notes} onChange={handleChange} />
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

      {/* Edit Attendance Modal */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>उपस्थिती संपादित करा</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleEditSubmit}>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>तारीख *</Form.Label>
                  <Form.Control type="date" name="Date" value={editFormData.Date} onChange={handleEditChange} required />
                  {errors.Date && <span className="text-danger">{errors.Date}</span>}
                </Form.Group>
              </Col>
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
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>प्रारंभ वेळ *</Form.Label>
                  <Form.Control type="time" name="StartingHour" value={editFormData.StartingHour} onChange={handleEditChange} required />
                  {errors.StartingHour && <span className="text-danger">{errors.StartingHour}</span>}
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>समाप्ती वेळ</Form.Label>
                  <Form.Control type="time" name="EndingHour" value={editFormData.EndingHour} onChange={handleEditChange} />
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>स्थिती</Form.Label>
                  <Form.Select name="Status" value={editFormData.Status} onChange={handleEditChange}>
                    <option value="Present">Present</option>
                    <option value="Absent">Absent</option>
                    <option value="Half Day">Half Day</option>
                    <option value="Late">Late</option>
                    <option value="Early Leave">Early Leave</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>टिप्पणी</Form.Label>
                  <Form.Control as="textarea" rows={2} name="Notes" value={editFormData.Notes} onChange={handleEditChange} />
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

      {/* Clock Out Modal */}
      <Modal show={showClockOutModal} onHide={() => setShowClockOutModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Clock Out</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleClockOutSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>समाप्ती वेळ *</Form.Label>
              <Form.Control type="time" name="EndingHour" value={clockOutData.EndingHour} onChange={handleClockOutChange} required />
            </Form.Group>
            <div className="d-flex justify-content-end">
              <Button variant="secondary" onClick={() => setShowClockOutModal(false)} className="me-2">
                Cancel
              </Button>
              <Button type="submit" variant="primary">
                Clock Out
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>
    </React.Fragment>
  );
}

export default EmployeeAttendance;
