// src/components/Pantry.js
import React, { useState } from 'react';
import { Plus, Package, Edit, Trash2, Save, X, AlertTriangle } from 'lucide-react';
import { pantryService } from '../services/firebaseService';

const Pantry = ({ pantryItems, onRefresh }) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all'); // all, low-stock, out-of-stock
  
  const [newItem, setNewItem] = useState({
    name: '',
    quantity: 0,
    unit: 'unidades',
    minQuantity: 1,
    category: 'Otros'
  });

  const categories = [
    'Verduras y Hortalizas',
    'Frutas',
    'Carnes',
    'Pescados y Mariscos',
    'Lácteos',
    'Cereales y Legumbres',
    'Condimentos y Especias',
    'Bebidas',
    'Conservas',
    'Congelados',
    'Otros'
  ];

  const units = [
    'unidades',
    'kg',
    'g',
    'l',
    'ml',
    'paquetes',
    'latas',
    'cajas'
  ];

  // Filtrar elementos
  const filteredItems = pantryItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filter === 'low-stock') {
      return matchesSearch && item.quantity <= (item.minQuantity || 1);
    }
    if (filter === 'out-of-stock') {
      return matchesSearch && item.quantity === 0;
    }
    return matchesSearch;
  });

  // Añadir nuevo elemento
  const handleAddItem = async (e) => {
    e.preventDefault();
    try {
      await pantryService.addPantryItem(newItem);
      setNewItem({
        name: '',
        quantity: 0,
        unit: 'unidades',
        minQuantity: 1,
        category: 'Otros'
      });
      setShowAddForm(false);
      onRefresh();
    } catch (error) {
      console.error('Error adding item:', error);
      alert('Error al añadir el producto');
    }
  };

  // Actualizar elemento
  const handleUpdateItem = async (itemId, updates) => {
    try {
      await pantryService.updatePantryItem(itemId, updates);
      setEditingItem(null);
      onRefresh();
    } catch (error) {
      console.error('Error updating item:', error);
      alert('Error al actualizar el producto');
    }
  };

  // Eliminar elemento
  const handleDeleteItem = async (itemId) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este producto?')) {
      try {
        await pantryService.deletePantryItem(itemId);
        onRefresh();
      } catch (error) {
        console.error('Error deleting item:', error);
        alert('Error al eliminar el producto');
      }
    }
  };

  // Componente de edición inline
  const EditItemForm = ({ item, onSave, onCancel }) => {
    const [editData, setEditData] = useState({
      name: item.name,
      quantity: item.quantity,
      unit: item.unit,
      minQuantity: item.minQuantity || 1,
      category: item.category || 'Otros'
    });

    const handleSave = () => {
      onSave(item.id, editData);
    };

    return (
      <div className="edit-form">
        <input
          type="text"
          value={editData.name}
          onChange={(e) => setEditData({...editData, name: e.target.value})}
          className="edit-input"
        />
        <input
          type="number"
          value={editData.quantity}
          onChange={(e) => setEditData({...editData, quantity: parseFloat(e.target.value) || 0})}
          className="edit-input quantity-input"
          min="0"
          step="0.1"
        />
        <select
          value={editData.unit}
          onChange={(e) => setEditData({...editData, unit: e.target.value})}
          className="edit-select"
        >
          {units.map(unit => (
            <option key={unit} value={unit}>{unit}</option>
          ))}
        </select>
        <input
          type="number"
          value={editData.minQuantity}
          onChange={(e) => setEditData({...editData, minQuantity: parseInt(e.target.value) || 1})}
          className="edit-input min-quantity-input"
          min="0"
          placeholder="Stock mín."
        />
        <select
          value={editData.category}
          onChange={(e) => setEditData({...editData, category: e.target.value})}
          className="edit-select"
        >
          {categories.map(category => (
            <option key={category} value={category}>{category}</option>
          ))}
        </select>
        <div className="edit-actions">
          <button onClick={handleSave} className="save-button">
            <Save size={16} />
          </button>
          <button onClick={onCancel} className="cancel-button">
            <X size={16} />
          </button>
        </div>
      </div>
    );
  };

  // Agrupar por categoría
  const groupedItems = filteredItems.reduce((groups, item) => {
    const category = item.category || 'Otros';
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(item);
    return groups;
  }, {});

  const lowStockCount = pantryItems.filter(item => item.quantity <= (item.minQuantity || 1)).length;
  const outOfStockCount = pantryItems.filter(item => item.quantity === 0).length;

  return (
    <div className="pantry">
      <div className="pantry-header">
        <h2>
          <Package size={24} />
          Despensa
        </h2>
        <button 
          onClick={() => setShowAddForm(true)}
          className="add-button"
        >
          <Plus size={20} />
          Añadir Producto
        </button>
      </div>

      {/* Estadísticas rápidas */}
      <div className="pantry-stats">
        <div className="stat-item">
          <span className="stat-number">{pantryItems.length}</span>
          <span className="stat-label">Total productos</span>
        </div>
        <div className="stat-item warning">
          <span className="stat-number">{lowStockCount}</span>
          <span className="stat-label">Stock bajo</span>
        </div>
        <div className="stat-item danger">
          <span className="stat-number">{outOfStockCount}</span>
          <span className="stat-label">Sin stock</span>
        </div>
      </div>

      {/* Controles de filtro y búsqueda */}
      <div className="pantry-controls">
        <input
          type="text"
          placeholder="Buscar productos..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
        <div className="filter-buttons">
          <button 
            onClick={() => setFilter('all')}
            className={`filter-button ${filter === 'all' ? 'active' : ''}`}
          >
            Todos
          </button>
          <button 
            onClick={() => setFilter('low-stock')}
            className={`filter-button ${filter === 'low-stock' ? 'active' : ''}`}
          >
            Stock Bajo
          </button>
          <button 
            onClick={() => setFilter('out-of-stock')}
            className={`filter-button ${filter === 'out-of-stock' ? 'active' : ''}`}
          >
            Sin Stock
          </button>
        </div>
      </div>

      {/* Formulario para añadir producto */}
      {showAddForm && (
        <div className="add-form-container">
          <form onSubmit={handleAddItem} className="add-form">
            <h3>Añadir Nuevo Producto</h3>
            <div className="form-row">
              <input
                type="text"
                placeholder="Nombre del producto"
                value={newItem.name}
                onChange={(e) => setNewItem({...newItem, name: e.target.value})}
                required
                className="form-input"
              />
              <input
                type="number"
                placeholder="Cantidad"
                value={newItem.quantity}
                onChange={(e) => setNewItem({...newItem, quantity: parseFloat(e.target.value) || 0})}
                min="0"
                step="0.1"
                required
                className="form-input"
              />
              <select
                value={newItem.unit}
                onChange={(e) => setNewItem({...newItem, unit: e.target.value})}
                className="form-select"
              >
                {units.map(unit => (
                  <option key={unit} value={unit}>{unit}</option>
                ))}
              </select>
            </div>
            <div className="form-row">
              <input
                type="number"
                placeholder="Stock mínimo"
                value={newItem.minQuantity}
                onChange={(e) => setNewItem({...newItem, minQuantity: parseInt(e.target.value) || 1})}
                min="0"
                className="form-input"
              />
              <select
                value={newItem.category}
                onChange={(e) => setNewItem({...newItem, category: e.target.value})}
                className="form-select"
              >
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
            <div className="form-actions">
              <button type="submit" className="submit-button">
                Añadir Producto
              </button>
              <button 
                type="button" 
                onClick={() => setShowAddForm(false)}
                className="cancel-button"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Lista de productos agrupados por categoría */}
      <div className="pantry-content">
        {Object.keys(groupedItems).length === 0 ? (
          <div className="empty-state">
            <Package size={48} />
            <h3>Despensa vacía</h3>
            <p>Añade productos para empezar a gestionar tu despensa</p>
          </div>
        ) : (
          Object.entries(groupedItems).map(([category, items]) => (
            <div key={category} className="category-section">
              <h3 className="category-title">{category}</h3>
              <div className="items-grid">
                {items.map(item => (
                  <div key={item.id} className={`item-card ${item.quantity === 0 ? 'out-of-stock' : item.quantity <= (item.minQuantity || 1) ? 'low-stock' : ''}`}>
                    {editingItem === item.id ? (
                      <EditItemForm
                        item={item}
                        onSave={handleUpdateItem}
                        onCancel={() => setEditingItem(null)}
                      />
                    ) : (
                      <>
                        <div className="item-header">
                          <h4 className="item-name">{item.name}</h4>
                          <div className="item-actions">
                            <button
                              onClick={() => setEditingItem(item.id)}
                              className="action-button edit"
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              onClick={() => handleDeleteItem(item.id)}
                              className="action-button delete"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                        <div className="item-details">
                          <div className="quantity-info">
                            <span className="quantity">{item.quantity} {item.unit}</span>
                            {item.quantity <= (item.minQuantity || 1) && (
                              <AlertTriangle size={16} className="warning-icon" />
                            )}
                          </div>
                          <div className="stock-info">
                            <small>Stock mínimo: {item.minQuantity || 1} {item.unit}</small>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Pantry;