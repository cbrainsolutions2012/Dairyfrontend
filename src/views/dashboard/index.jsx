import React, { useState, useRef, useEffect } from 'react';
import { Row, Col, Card, Table, Button, Form } from 'react-bootstrap';
import PerfectScrollbar from 'react-perfect-scrollbar';
import { writeFile, utils } from 'xlsx';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import OrderCard from '../../components/Widgets/Statistic/OrderCard';
import Chart from 'react-apexcharts';
import { Link } from 'react-router-dom';
import uniqueVisitorChart from './chart/analytics-unique-visitor-chart';
import customerChart from './chart/analytics-cuatomer-chart';
import customerChart1 from './chart/analytics-cuatomer-chart-1';
import axios from 'axios';
import { FaWhatsapp } from 'react-icons/fa';

// ==============================|| DASHBOARD ANALYTICS ||============================== //

const DashAnalytics = () => {
  const tableRef = useRef(null);
  const [searchTerm, setSearchTerm] = useState('');
  // const [tableData, setTableData] = useState([]);
  const [dashboardData, setDashboardData] = useState({});

  const [reminderData, setReminderData] = useState([]);
  const [sendingWhatsApp, setSendingWhatsApp] = useState(null);

  const [birthdayData, setBirthdayData] = useState([]);
  const [sendingBirthdayWhatsApp, setSendingBirthdayWhatsApp] = useState(null);

  const fetchBirthdayData = async () => {
    try {
      const res = await axios.get('https://api.mytemplesoftware.in/api/dengidar/birthdays/today', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
          'Content-Type': 'application/json'
        }
      });
      if (res.data.success) {
        setBirthdayData(res.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching birthday data:', error);
    }
  };
  useEffect(() => {
    fetchBirthdayData();
  }, []);

  const handleBirthdaySendWhatsapp = async (receipt) => {
    setSendingBirthdayWhatsApp(receipt.Id);
    let number = receipt.MobileNumber;
    if (!number) {
      alert('No WhatsApp number found for this donor.');
      return;
    }
    number = '91' + number;
    const payload = {
      number,
      name: receipt.FullName || 'N/A'
    };
    try {
      const res = await axios.post('https://api.mytemplesoftware.in/api/dengidar/birthdays/send-whatsapp', payload, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
          'Content-Type': 'application/json'
        }
      });
      if (res.data.success) {
        alert('WhatsApp message sent successfully!');
      } else {
        alert('Failed to send WhatsApp message.');
      }
    } catch (error) {
      console.error('Error sending WhatsApp:', error);
      alert('Error sending WhatsApp message.');
    } finally {
      setSendingBirthdayWhatsApp(null);
    }
  };

  const fetchReminders = async () => {
    try {
      const res = await axios.get('https://api.mytemplesoftware.in/api/goseva/reminder?days=7', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
          'Content-Type': 'application/json'
        }
      });
      if (res.data.success) {
        setReminderData(res.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching reminders:', error);
      setReminderData([]);
    }
  };

  useEffect(() => {
    fetchReminders();
  }, []);
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleSearch = () => {
    console.log('Search term:', searchTerm);
  };

  // const fetchTableData = async () => {
  //   try {
  //     const res = await axios.get('http://api.mytemplesoftware.in/api/admin/employee_registration/');
  //     console.log(res.data);
  //   } catch (error) {
  //     console.log(error);
  //   }
  // };
  const handleSendWhatsapp = async (receipt) => {
    setSendingWhatsApp(receipt.Id);
    let number = receipt.DengidarPhone || receipt.MobileNumber;
    if (!number) {
      alert('No WhatsApp number found for this donor.');
      return;
    }
    number = '91' + number;
    const date = receipt.EndDate ? new Date(receipt.EndDate).toISOString().split('T')[0] : '';
    const payload = {
      number,
      receipt: {
        DonarName: receipt.DonarName,
        Amount: receipt.Amount,
        DurationMonths: receipt.DurationMonths,
        StartDate: receipt.StartDate ? new Date(receipt.StartDate).toISOString().split('T')[0] : '',
        EndDate: date,
        PaymentType: receipt.PaymentType
      }
    };
    try {
      const res = await axios.post('https://api.mytemplesoftware.in/api/goseva/send-expiry-reminder-whatsapp', payload, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
          'Content-Type': 'application/json'
        }
      });
      if (res.data.success) {
        alert('WhatsApp message sent successfully!');
      } else {
        alert('Failed to send WhatsApp message.');
      }
    } catch (error) {
      console.error('Error sending WhatsApp:', error);
      alert('Error sending WhatsApp message.');
    } finally {
      setSendingWhatsApp(null);
    }
  };

  const fetchDashboardData = async () => {
    try {
      const res = await axios.get('https://api.mytemplesoftware.in/api/auth/dashboard-stats', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      console.log(res.data);
      setDashboardData(res.data.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
  };
  useEffect(() => {
    // fetchTableData();
    fetchDashboardData();
  }, []);

  const handleExportToExcel = () => {
    const table = tableRef.current;
    if (!table) return;

    const clonedTable = table.cloneNode(true);

    // Remove the "Action" column from the cloned table

    const headers = clonedTable.querySelectorAll('th');
    const rows = clonedTable.querySelectorAll('tr');
    const actionIndex = headers.length - 1;

    headers[actionIndex].remove(); // header remove

    rows.forEach((row) => {
      const cells = row.querySelectorAll('td');
      if (cells[actionIndex]) {
        cells[actionIndex].remove();
      }
    });

    // Convert the modified table to a workbook and export

    const wb = utils.table_to_book(clonedTable);
    writeFile(wb, 'data.xlsx');
  };

  const handleExportToPDF = () => {
    // get table
    const table = tableRef.current;
    if (!table) return;

    const clonedTable = table.cloneNode(true);

    // remove action feild
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

      pdf.save('data.pdf');
    });
  };

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isAdmin = user?.IsAdmin === 1;

  return (
    <React.Fragment>
      {/* Welcome Message - Show different message based on role */}
      <Row className="mb-3">
        <Col>
          <Card>
            <Card.Body>
              <h4>
                Welcome, {user?.Username}!<span className="badge bg-primary ms-2"></span>
              </h4>
              {/* {isAdmin && <p className="text-muted">You have full access to all temple operations.</p>} */}
              {/* {isEmployee && <p className="text-muted">You can manage daily operations and devotee services.</p>} */}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row>
        {/* order cards */}

        <Col md={6} xl={3}>
          <Link to={'/empmaster'}>
            <OrderCard
              params={{
                title: 'कर्मचारी',
                class: 'bg-c-blue',
                icon: 'fa-solid fa-user-tie',
                primaryText: dashboardData?.totalEmployees || '0'
              }}
            />
          </Link>
        </Col>

        <Col md={6} xl={3}>
          <Link to={'/devotee'}>
            <OrderCard
              params={{
                title: 'देणगीदार',
                class: 'bg-c-green',
                icon: 'fa-solid fa-hand-holding-dollar',
                primaryText: dashboardData?.totalDengidar || '0'
                // secondaryText: 'This Month',
                // extraText: '213'
              }}
            />
          </Link>
        </Col>
        <Col md={6} xl={3}>
          <Link to={'/income'}>
            <OrderCard
              params={{
                title: 'उत्त्पन्न',
                class: 'bg-c-yellow',
                icon: 'fa-solid fa-building-columns',
                primaryText: dashboardData?.thisMonthIncome || '0'
              }}
            />
          </Link>
        </Col>

        <Col md={6} xl={3}>
          <Link to={'/expenses'}>
            <OrderCard
              params={{
                title: 'खर्च',
                class: 'bg-c-red',
                icon: 'fa-solid fa-money-check',
                primaryText: dashboardData?.thisMonthExpense || '0'
                // secondaryText: 'This Month',
                // extraText: ''
              }}
            />
          </Link>
        </Col>

        <Col md={6} xl={3}>
          <Link to={'/pooja'}>
            <OrderCard
              params={{
                title: 'सेवेचे प्रकार',
                class: 'bg-c-purple',
                icon: 'fa-solid fa-hands-praying',
                primaryText: dashboardData?.totalSevaTypes || '0'
              }}
            />
          </Link>
        </Col>

        <Col md={6} xl={3}>
          <Link to={'/gotra'}>
            <OrderCard
              params={{
                title: 'गोत्र',
                class: 'bg-c-yellow',
                icon: 'fa-solid fa-hand-holding-dollar',
                primaryText: dashboardData?.totalGotra || '0'
                // secondaryText: 'This Month',
                // extraText: ''
              }}
            />
          </Link>
        </Col>

        <Col md={6} xl={3}>
          <Link to={'/gosevareceipt'}>
            <OrderCard
              params={{
                title: 'गोसेवा पावती',
                class: 'bg-c-green',
                icon: 'fa-solid fa-gopuram',
                primaryText: dashboardData?.totalGoSevaAmount || '0'
                // secondaryText: 'This Month',
                // extraText: ''
              }}
            />
          </Link>
        </Col>

        <Col md={6} xl={3}>
          <Link to={'/dengipawti'}>
            <OrderCard
              params={{
                title: 'देणगी पावती',
                class: 'bg-c-red',
                icon: 'feather icon-award',
                primaryText: dashboardData?.totalDReceipt || '0'
                // secondaryText: 'This Month',
                // extraText: ''
              }}
            />
          </Link>
        </Col>

        {/* Employee Master Table */}
        <Col sm={12}>
          <Card>
            <Card.Header>
              <Row>
                <Col md={6}>
                  <Card.Title as="h4">Goseva Receipt Reminder</Card.Title>
                </Col>
                <Col md={6} className="d-flex justify-content-end">
                  <Form.Control type="text" placeholder="Search" value={searchTerm} onChange={handleSearchChange} className="me-2" />
                  <Button variant="primary" onClick={handleSearch} className="me-2">
                    Search
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
                      border: '1px solid #dee2e6',
                      borderCollapse: 'collapse'
                    }}
                  >
                    <thead>
                      <tr>
                        <th>देणगीदार नाव</th>
                        <th>पावती क्रमांक</th>
                        <th>शहर</th>
                        <th>देणगीदार फोन</th>
                        <th>पावती दिनांक</th>
                        <th>रक्कम</th>
                        <th>नोंदणीकर्ता</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reminderData.length === 0 ? (
                        <tr>
                          <td colSpan="9" className="text-center">
                            No expiring receipts found
                          </td>
                        </tr>
                      ) : (
                        reminderData.map((item) => (
                          <tr key={item.Id}>
                            <td>{item.DonarName || item.DengidarName || 'N/A'}</td>
                            <td>{item.ReceiptNo}</td>
                            <td>{item.City || 'N/A'}</td>
                            <td>{item.DengidarPhone || 'N/A'}</td>
                            <td>{item.StartDate ? new Date(item.StartDate).toLocaleDateString() : 'N/A'}</td>
                            <td>₹{item.Amount}</td>
                            <td>{item.CreatedByName || 'N/A'}</td>
                            <td>
                              <Button variant="success" size="sm" className="me-2" onClick={() => handleSendWhatsapp(item)}>
                                {sendingWhatsApp === item.Id ? 'Sending...' : <FaWhatsapp />}
                              </Button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </Table>
                </PerfectScrollbar>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col sm={12}>
          <Card>
            <Card.Header>
              <Row>
                <Col md={6}>
                  <Card.Title as="h4">Birthday Reminder</Card.Title>
                </Col>
                <Col md={6} className="d-flex justify-content-end">
                  <Form.Control type="text" placeholder="Search" value={searchTerm} onChange={handleSearchChange} className="me-2" />
                  <Button variant="primary" onClick={handleSearch} className="me-2">
                    Search
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
                      border: '1px solid #dee2e6',
                      borderCollapse: 'collapse'
                    }}
                  >
                    <thead>
                      <tr>
                        <th>देणगीदार नाव</th>
                        <th>शहर</th>
                        <th>देणगीदार फोन</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {birthdayData.length === 0 ? (
                        <tr>
                          <td colSpan="9" className="text-center">
                            No Birthdays Today
                          </td>
                        </tr>
                      ) : (
                        birthdayData.map((item) => (
                          <tr key={item.Id}>
                            <td>{item.FullName || item.DengidarName || 'N/A'}</td>
                            <td>{item.City || 'N/A'}</td>
                            <td>{item.MobileNumber || 'N/A'}</td>
                            <td>
                              <Button variant="success" size="sm" className="me-2" onClick={() => handleBirthdaySendWhatsapp(item)}>
                                {sendingBirthdayWhatsApp === item.Id ? 'Sending...' : <FaWhatsapp />}
                              </Button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </Table>
                </PerfectScrollbar>
              </div>
            </Card.Body>
          </Card>
        </Col>

        {/* <Col md={12} xl={6}>
          <Card>
            <Card.Header>
              <h5>Unique Visitor</h5>
            </Card.Header>
            <Card.Body className="ps-4 pt-4 pb-0">
              <Chart {...uniqueVisitorChart} />
            </Card.Body>
          </Card>
        </Col>
        <Col md={12} xl={6}>
          <Row>
            <Col sm={6}>
              <Card>
                <Card.Body>
                  <Row>
                    <Col sm="auto">
                      <span>Customers</span>
                    </Col>
                    <Col className="text-end">
                      <h2 className="mb-0">826</h2>
                      <span className="text-c-green">
                        8.2%
                        <i className="feather icon-trending-up ms-1" />
                      </span>
                    </Col>
                  </Row>
                  <Chart {...customerChart} />
                  <Row className="mt-3 text-center">
                    <Col>
                      <h3 className="m-0">
                        <i className="fas fa-circle f-10 mx-2 text-success" />
                        674
                      </h3>
                      <span className="ms-3">New</span>
                    </Col>
                    <Col>
                      <h3 className="m-0">
                        <i className="fas fa-circle text-primary f-10 mx-2" />
                        182
                      </h3>
                      <span className="ms-3">Return</span>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>
            </Col>
            <Col sm={6}>
              <Card className="bg-primary text-white">
                <Card.Body>
                  <Row>
                    <Col sm="auto">
                      <span>Customers</span>
                    </Col>
                    <Col className="text-end">
                      <h2 className="mb-0 text-white">826</h2>
                      <span className="text-white">
                        8.2%
                        <i className="feather icon-trending-up ms-1" />
                      </span>
                    </Col>
                  </Row>
                  <Chart {...customerChart1} />
                  <Row className="mt-3 text-center">
                    <Col>
                      <h3 className="m-0 text-white">
                        <i className="fas fa-circle f-10 mx-2 text-success" />
                        674
                      </h3>
                      <span className="ms-3">New</span>
                    </Col>
                    <Col>
                      <h3 className="m-0 text-white">
                        <i className="fas fa-circle f-10 mx-2 text-white" />
                        182
                      </h3>
                      <span className="ms-3">Return</span>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Col> */}

        {/* <Col lg={4} md={12}>
          <SocialCard
            params={{
              icon: 'fa fa-envelope-open',
              class: 'blue',
              variant: 'primary',
              primaryTitle: '8.62k',
              primaryText: 'Subscribers',
              secondaryText: 'Your main list is growing',
              label: 'Manage List'
            }}
          />
          <SocialCard
            params={{
              icon: 'fab fa-twitter',
              class: 'green',
              variant: 'success',
              primaryTitle: '+40',
              primaryText: 'Followers',
              secondaryText: 'Your main list is growing',
              label: 'Check them out'
            }}
          />
        </Col>
        <Col lg={8} md={12}>
          <Card>
            <Card.Header>
              <h5>Activity Feed</h5>
            </Card.Header>
            <Card.Body className="card-body pt-4">
              <ListGroup as="ul" bsPrefix=" " className="feed-blog ps-0">
                <ListGroup.Item as="li" bsPrefix=" " className="active-feed">
                  <div className="feed-user-img">
                    <img src={avatar1} className="img-radius " alt="User-Profile" />
                  </div>
                  <h6>
                    <span className="badge bg-danger">File</span> Eddie uploaded new files:{' '}
                    <small className="text-muted">2 hours ago</small>
                  </h6>
                  <p className="m-b-15 m-t-15">
                    hii <b> @everone</b> Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the
                    industry&apos;s standard dummy text ever since the 1500s.
                  </p>
                  <Row>
                    <Col sm="auto" className="text-center">
                      <img src={imgGrid1} alt="img" className="img-fluid wid-100" />
                      <h6 className="m-t-15 m-b-0">Old Scooter</h6>
                      <p className="text-muted m-b-0">
                        <small>PNG-100KB</small>
                      </p>
                    </Col>
                    <Col sm="auto" className="text-center">
                      <img src={imgGrid2} alt="img" className="img-fluid wid-100" />
                      <h6 className="m-t-15 m-b-0">Wall Art</h6>
                      <p className="text-muted m-b-0">
                        <small>PNG-150KB</small>
                      </p>
                    </Col>
                    <Col sm="auto" className="text-center">
                      <img src={imgGrid3} alt="img" className="img-fluid wid-100" />
                      <h6 className="m-t-15 m-b-0">Microphone</h6>
                      <p className="text-muted m-b-0">
                        <small>PNG-150KB</small>
                      </p>
                    </Col>
                  </Row>
                </ListGroup.Item>
                <ListGroup.Item as="li" bsPrefix=" " className="diactive-feed">
                  <div className="feed-user-img">
                    <img src={avatar1} className="img-radius" alt="User-Profile" />
                  </div>
                  <h6>
                    <span className="badge bg-success">Task</span> Sarah marked the Pending Review:{' '}
                    <span className="text-c-green"> Trash Can Icon Design</span>
                    <small className="text-muted"> 2 hours ago</small>
                  </h6>
                </ListGroup.Item>
                <ListGroup.Item as="li" bsPrefix=" " className="diactive-feed">
                  <div className="feed-user-img">
                    <img src={avatar1} className="img-radius" alt="User-Profile" />
                  </div>
                  <h6>
                    <span className="badge bg-primary">comment</span> abc posted a task:{' '}
                    <span className="text-c-green">Design a new Homepage</span> <small className="text-muted">6 hours ago</small>
                  </h6>
                  <p className="m-b-15 m-t-15">
                    hii <b> @everone</b> Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the
                    industry&apos;s standard dummy text ever since the 1500s.
                  </p>
                </ListGroup.Item>
              </ListGroup>
            </Card.Body>
          </Card>
        </Col> */}
      </Row>
    </React.Fragment>
  );
};

export default DashAnalytics;
