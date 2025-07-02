import React, { useState } from 'react';
import { Card, Button, Col, Row, Spinner, Alert } from 'react-bootstrap';
import axios from 'axios';

function WhatsappInstance() {
  const [qrCode, setQrCode] = useState(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');

  const handleCreateInstance = async () => {
    setLoading(true);
    setError('');
    setStatus('');
    setQrCode(null);
    try {
      const res = await axios.post(
        'https://api.mytemplesoftware.in/api/whatsapp/create-instance',
        {},
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
            'Content-Type': 'application/json'
          }
        }
      );
      if (res.data.success && res.data.qrCode) {
        setQrCode(res.data.qrCode);
        setStatus('Scan the QR code below with your WhatsApp app to activate.');
      } else if (res.data.success && res.data.connected) {
        setStatus('WhatsApp instance is already connected.');
      } else {
        setError(res.data.message || 'Failed to create WhatsApp instance.');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    }
    setLoading(false);
  };

  return (
    <Col sm={12}>
      <Card>
        <Card.Header>
          <Card.Title as="h5" style={{ display: 'flex', justifyContent: 'center' }}>
            WhatsApp Instance Management
          </Card.Title>
        </Card.Header>
        <Card.Body>
          <Row className="mb-3">
            <Col>
              <Button variant="primary" onClick={handleCreateInstance} disabled={loading}>
                {loading ? <Spinner animation="border" size="sm" /> : 'Create/Activate WhatsApp Instance'}
              </Button>
            </Col>
          </Row>
          {status && <Alert variant="success">{status}</Alert>}
          {error && <Alert variant="danger">{error}</Alert>}
          {qrCode && (
            <div style={{ textAlign: 'center', marginTop: 20 }}>
              <img src={qrCode} alt="WhatsApp QR Code" style={{ width: 250, height: 250 }} />
              <div style={{ marginTop: 10, color: '#007bff' }}>
                <b>Scan this QR code with your WhatsApp mobile app.</b>
              </div>
            </div>
          )}
        </Card.Body>
      </Card>
    </Col>
  );
}

export default WhatsappInstance;
