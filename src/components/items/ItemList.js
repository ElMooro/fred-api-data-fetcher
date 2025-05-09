import React, { useState } from 'react';
import { useGetItems, useDeleteItem } from '../../hooks/useItems';
import ItemCard from './ItemCard';
import ItemModal from './ItemModal';

const ItemList = () => {
  const [filters, setFilters] = useState({
    page: 1,
    limit: 10,
    sort: 'name',
    order: 'asc',
    search: '',
  });
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState(null);
  
  const { data, isLoading, error, refetch } = useGetItems(filters);
  const { mutate: deleteItem } = useDeleteItem();
  
  const handleOpenModal = (item = null) => {
    setCurrentItem(item);
    setIsModalOpen(true);
  };
  
  const handleCloseModal = () => {
    setCurrentItem(null);
    setIsModalOpen(false);
  };
  
  const handleDeleteItem = (id) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      deleteItem(id);
    }
  };
  
  const handleSearch = (e) => {
    setFilters(prev => ({
      ...prev,
      search: e.target.value,
      page: 1, // Reset to first page when searching
    }));
  };
  
  const handleSortChange = (e) => {
    const [sort, order] = e.target.value.split('-');
    setFilters(prev => ({
      ...prev,
      sort,
      order,
    }));
  };
  
  const handlePageChange = (newPage) => {
    setFilters(prev => ({
      ...prev,
      page: newPage,
    }));
  };
  
  if (isLoading) {
    return <div className="loading">Loading items...</div>;
  }
  
  if (error) {
    return <div className="error">Error: {error.message}</div>;
  }
  
  const { data: items, pagination } = data || { data: [], pagination: { page: 1, totalPages: 1 } };
  
  return (
    <div className="items-container">
      <div className="items-header">
        <h2>Items List</h2>
        <button className="button button-primary" onClick={() => handleOpenModal()}>
          Add New Item
        </button>
      </div>
      
      <div className="items-filters">
        <div className="search-container">
          <input
            type="text"
            placeholder="Search items..."
            value={filters.search}
            onChange={handleSearch}
            className="search-input"
          />
        </div>
        
        <div className="sort-container">
          <label htmlFor="sort">Sort by:</label>
          <select
            id="sort"
            value={`${filters.sort}-${filters.order}`}
            onChange={handleSortChange}
            className="sort-select"
          >
            <option value="name-asc">Name (A-Z)</option>
            <option value="name-desc">Name (Z-A)</option>
            <option value="price-asc">Price (Low to High)</option>
            <option value="price-desc">Price (High to Low)</option>
            <option value="category-asc">Category (A-Z)</option>
            <option value="category-desc">Category (Z-A)</option>
          </select>
        </div>
      </div>
      
      {items.length === 0 ? (
        <div className="no-items">
          <p>No items found. {filters.search ? 'Try clearing your search.' : 'Click "Add New Item" to create one.'}</p>
        </div>
      ) : (
        <div className="items-grid">
          {items.map(item => (
            <ItemCard
              key={item.id}
              item={item}
              onEdit={() => handleOpenModal(item)}
              onDelete={handleDeleteItem}
            />
          ))}
        </div>
      )}
      
      {pagination.totalPages > 1 && (
        <div className="pagination">
          <button
            disabled={pagination.page === 1}
            onClick={() => handlePageChange(pagination.page - 1)}
            className="pagination-button"
          >
            Previous
          </button>
          
          <span className="pagination-info">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          
          <button
            disabled={pagination.page === pagination.totalPages}
            onClick={() => handlePageChange(pagination.page + 1)}
            className="pagination-button"
          >
            Next
          </button>
        </div>
      )}
      
      {isModalOpen && (
        <ItemModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          item={currentItem}
          onSuccess={() => {
            handleCloseModal();
            refetch();
          }}
        />
      )}
    </div>
  );
};

export default ItemList;
