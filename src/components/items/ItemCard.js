import React from 'react';

const ItemCard = ({ item, onEdit, onDelete }) => {
  return (
    <div className="item-card">
      <div className="item-card-header">
        <h3>{item.name}</h3>
        <div className="item-card-price">${item.price?.toFixed(2)}</div>
      </div>
      <div className="item-card-body">
        <p className="item-card-description">{item.description || 'No description available'}</p>
        <div className="item-card-category">Category: {item.category}</div>
      </div>
      <div className="item-card-footer">
        <button className="button button-small" onClick={() => onEdit(item)}>Edit</button>
        <button className="button button-small button-danger" onClick={() => onDelete(item.id)}>Delete</button>
      </div>
    </div>
  );
};

export default ItemCard;
