import React from 'react';

const ColorPicker = ({ color, onChange, label }) => (
  <div style={{ margin: '0.5rem 0' }}>
    <label style={{ marginRight: '0.5rem' }}>{label}</label>
    <input type="color" value={color} onChange={e => onChange(e.target.value)} />
    <span style={{ marginLeft: '0.5rem' }}>{color}</span>
  </div>
);

export default ColorPicker; 