import React from 'react';
import ItemList from '../components/items/ItemList';

const ItemsPage = () => {
  return (
    <div className="items-page">
      <h1>Items Management</h1>
      <ItemList />
    </div>
  );
};

export default ItemsPage;
