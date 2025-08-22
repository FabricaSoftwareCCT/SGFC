import React from 'react';

export const EditableList = ({ items, setItems, placeholder }) => {
  const handleChange = (idx, value) => {
    const newItems = [...items];
    newItems[idx] = value;
    setItems(newItems);
  };

  const handleAdd = () => {
    setItems([...items, '']);
  };

  const handleRemove = (idx) => {
    const newItems = items.filter((_, i) => i !== idx);
    setItems(newItems);
  };

  return (
    <div style={{ display: 'inline-block', color: '#1a1a1a' }}>
      {items.map((item, idx) => (
        <div key={idx} style={{ display: 'flex', alignItems: 'center', marginBottom: 4 }}>
          <input
            type="text"
            value={item}
            onChange={e => handleChange(idx, e.target.value)}
            placeholder={placeholder}
            className="input-solicitud-proceedings"
            style={{ width: 180, marginRight: 4, color: '#1a1a1a', background: 'white' }}
          />
          <button type="button" onClick={() => handleRemove(idx)} style={{ marginLeft: 2, color: '#1a1a1a', border: 'none', background: 'none', cursor: 'pointer', fontWeight: 'bold' }}>✕</button>
        </div>
      ))}
      <button type="button" onClick={handleAdd} style={{ color: '#00843d', border: 'none', background: 'none', cursor: 'pointer', fontWeight: 'bold' }}>+ Agregar</button>
    </div>
  );
}; 