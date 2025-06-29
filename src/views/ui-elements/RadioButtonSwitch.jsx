import React from 'react';
import Form from 'react-bootstrap/Form';

const RadioButtonSwitch = ({ checked }) => {
  return (
    <Form>
      <Form.Check type="switch" id="custom-switch" checked={checked} readOnly />
    </Form>
  );
};

export default RadioButtonSwitch;
