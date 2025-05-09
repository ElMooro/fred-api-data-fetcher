import React from 'react';
import { useCreateItem, useUpdateItem } from '../../hooks/useItems';

const ItemModal = ({ isOpen, onClose, item, onSuccess }) => {
  const isEditMode = !!item;
  const { mutate: createItem, isLoading: isCreating } = useCreateItem();
  const { mutate: updateItem, isLoading: isUpdating } = useUpdateItem();
  
  const isLoading = isCreating || isUpdating;
  
  const initialValues = item
    ? { ...item }
    : { name: '', description: '', price: '', category: '' };
  
  const [formValues, setFormValues] = React.useState(initialValues);
  const [errors, setErrors] = React.useState({});
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormValues(prev => ({
      ...prev,
      [name]: value,
    }));
    
    // Clear error when field is changed
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: '',
      }));
    }
  };
  
  const validateForm = () => {
    const newErrors = {};
    
    if (!formValues.name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (!formValues.price) {
      newErrors.price = 'Price is required';
    } else if (isNaN(formValues.price) || parseFloat(formValues.price) < 0) {
      newErrors.price = 'Price must be a positive number';
    }
    
    if (!formValues.category) {
      newErrors.category = 'Category is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    const data = {
      ...formValues,
      price: parseFloat(formValues.price),
    };
    
    if (isEditMode) {
      updateItem(
        { id: item.id, data },
        {
          onSuccess: () => {
            if (onSuccess) onSuccess();
          },
        }
      );
    } else {
      createItem(data, {
        onSuccess: () => {
          if (onSuccess) onSuccess();
        },
      });
    }
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="modal-overlay">
      <div className="modal-container">
        <div className="modal-header">
          <h2>{isEditMode ? 'Edit Item' : 'Add New Item'}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        
        <form onSubmit={handleSubmit} className="item-form">
          <div className="form-group">
            <label htmlFor="name">Name</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formValues.name}
              onChange={handleChange}
              className={errors.name ? 'error' : ''}
            />
            {errors.name && <div className="error-message">{errors.name}</div>}
          </div>
          
          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              value={formValues.description}
              onChange={handleChange}
              rows="3"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="price">Price</label>
            <input
              type="number"
              id="price"
              name="price"
              value={formValues.price}
              onChange={handleChange}
              step="0.01"
              min="0"
              className={errors.price ? 'error' : ''}
            />
            {errors.price && <div className="error-message">{errors.price}</div>}
          </div>
          
          <div className="form-group">
            <label htmlFor="category">Category</label>
            <select
              id="category"
              name="category"
              value={formValues.category}
              onChange={handleChange}
              className={errors.category ? 'error' : ''}
            >
              <option value="">Select a category</option>
              <option value="electronics">Electronics</option>
              <option value="furniture">Furniture</option>
              <option value="clothing">Clothing</option>
              <option value="books">Books</option>
              <option value="other">Other</option>
            </select>
            {errors.category && <div className="error-message">{errors.category}</div>}
          </div>
          
          <div className="form-actions">
            <button
              type="button"
              className="button button-secondary"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="button button-primary"
              disabled={isLoading}
            >
              {isLoading ? 'Saving...' : isEditMode ? 'Update Item' : 'Create Item'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ItemModal;
