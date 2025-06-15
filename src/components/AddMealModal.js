// src/components/AddMealModal.js
// Modal para añadir comidas directamente desde el calendario
import React, { useState } from 'react';
import { Plus, Trash2, X, Clock, ChefHat } from 'lucide-react';
import { mealService } from '../services/firebaseService';

const AddMealModal = ({ selectedSlot, pantryItems, onClose, onRefresh }) => {
  const [meal, setMeal] = useState({
    name: '',
    date: selectedSlot?.date || new Date().toISOString().split('T')[0],
    mealType: selectedSlot?.mealType || 'Almuerzo',
    description: '',
    ingredients: [],
    preparationTime: 30,
    difficulty: 'Fácil'
  });

  const [newIngredient, setNewIngredient] = useState({
    name: '',
    quantity: 1,
    unit: 'unidades'
  });

  // Prevent body scroll when modal is open
  React.useEffect(() => {
    document.body.classList.add('modal-open');
    return () => {
      document.body.classList.remove('modal-open');
    };
  }, []);

  // Handle ESC key to close modal
  React.useEffect(() => {
    const handleEsc = (event) => {
      if (event.keyCode === 27) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('keydown', handleEsc);
    };
  }, [onClose]);

  const mealTypes = ['Desayuno', 'Almuerzo', 'Cena', 'Merienda'];
  const difficulties = ['Muy Fácil', 'Fácil', 'Intermedio', 'Difícil', 'Muy Difícil'];
  const units = ['unidades', 'kg', 'g', 'l', 'ml', 'cucharadas', 'cucharaditas', 'tazas', 'pizca'];

  // Añadir ingrediente a la lista
  const handleAddIngredient = () => {
    if (newIngredient.name.trim() && newIngredient.quantity > 0) {
      setMeal({
        ...meal,
        ingredients: [...meal.ingredients, { ...newIngredient }]
      });
      setNewIngredient({
        name: '',
        quantity: 1,
        unit: 'unidades'
      });
    }
  };

  // Eliminar ingrediente
  const handleRemoveIngredient = (index) => {
    setMeal({
      ...meal,
      ingredients: meal.ingredients.filter((_, i) => i !== index)
    });
  };

  // Verificar disponibilidad de ingredientes
  const checkIngredientAvailability = (ingredient) => {
    const pantryItem = pantryItems.find(item => 
      item.name.toLowerCase() === ingredient.name.toLowerCase()
    );
    
    if (!pantryItem) return { status: 'missing', available: 0 };
    if (pantryItem.quantity >= ingredient.quantity) return { status: 'available', available: pantryItem.quantity };
    return { status: 'insufficient', available: pantryItem.quantity };
  };

  // Guardar comida
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      await mealService.addMeal(meal);
      onRefresh();
      onClose();
    } catch (error) {
      console.error('Error adding meal:', error);
      alert('Error al añadir la comida');
    }
  };

  // Autocompletar ingredientes basado en la despensa
  const getSuggestedIngredients = () => {
    return pantryItems
      .filter(item => 
        item.name.toLowerCase().includes(newIngredient.name.toLowerCase()) &&
        newIngredient.name.length > 0
      )
      .slice(0, 5);
  };

  const suggestedIngredients = getSuggestedIngredients();

  // Verificar si se puede cocinar la comida
  const canCookMeal = () => {
    if (meal.ingredients.length === 0) return true;
    return meal.ingredients.every(ingredient => {
      const availability = checkIngredientAvailability(ingredient);
      return availability.status === 'available';
    });
  };

  const missingIngredients = meal.ingredients.filter(ingredient => {
    const availability = checkIngredientAvailability(ingredient);
    return availability.status === 'missing' || availability.status === 'insufficient';
  });

  // Formatear fecha para mostrar
  const formatDateForDisplay = (dateStr) => {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('es-ES', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>
            <ChefHat size={24} />
            Añadir Comida
          </h2>
          <p>
            {formatDateForDisplay(meal.date)} - {meal.mealType}
          </p>
          <button onClick={onClose} className="modal-close-button" type="button">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          {/* Información básica */}
          <div className="form-section">
            <div className="form-row">
              <div className="form-group">
                <label>Nombre de la comida</label>
                <input
                  type="text"
                  value={meal.name}
                  onChange={(e) => setMeal({...meal, name: e.target.value})}
                  placeholder="Ej: Pasta con tomate"
                  required
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label>Fecha</label>
                <input
                  type="date"
                  value={meal.date}
                  onChange={(e) => setMeal({...meal, date: e.target.value})}
                  required
                  className="form-input"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Tipo de comida</label>
                <select
                  value={meal.mealType}
                  onChange={(e) => setMeal({...meal, mealType: e.target.value})}
                  className="form-select"
                >
                  {mealTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>
                  <Clock size={16} />
                  Tiempo (min)
                </label>
                <input
                  type="number"
                  value={meal.preparationTime}
                  onChange={(e) => setMeal({...meal, preparationTime: parseInt(e.target.value) || 0})}
                  min="1"
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label>Dificultad</label>
                <select
                  value={meal.difficulty}
                  onChange={(e) => setMeal({...meal, difficulty: e.target.value})}
                  className="form-select"
                >
                  {difficulties.map(diff => (
                    <option key={diff} value={diff}>{diff}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Descripción (opcional)</label>
              <textarea
                value={meal.description}
                onChange={(e) => setMeal({...meal, description: e.target.value})}
                placeholder="Describe la receta..."
                className="form-textarea"
                rows="2"
              />
            </div>
          </div>

          {/* Ingredientes */}
          <div className="form-section">
            <h4>Ingredientes</h4>
            
            {/* Añadir ingrediente */}
            <div className="ingredient-input-row">
              <div className="ingredient-input-group">
                <input
                  type="text"
                  value={newIngredient.name}
                  onChange={(e) => setNewIngredient({...newIngredient, name: e.target.value})}
                  placeholder="Ingrediente"
                  className="form-input"
                />
                {suggestedIngredients.length > 0 && newIngredient.name && (
                  <div className="suggestions-dropdown">
                    {suggestedIngredients.map(item => (
                      <div
                        key={item.id}
                        className="suggestion-item"
                        onClick={() => setNewIngredient({
                          ...newIngredient,
                          name: item.name,
                          unit: item.unit
                        })}
                      >
                        <span className="suggestion-name">{item.name}</span>
                        <span className="suggestion-stock">
                          ({item.quantity} {item.unit})
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <input
                type="number"
                value={newIngredient.quantity}
                onChange={(e) => setNewIngredient({...newIngredient, quantity: parseFloat(e.target.value) || 0})}
                placeholder="Cantidad"
                min="0.1"
                step="0.1"
                className="form-input"
              />
              <select
                value={newIngredient.unit}
                onChange={(e) => setNewIngredient({...newIngredient, unit: e.target.value})}
                className="form-select"
              >
                {units.map(unit => (
                  <option key={unit} value={unit}>{unit}</option>
                ))}
              </select>
              <button
                type="button"
                onClick={handleAddIngredient}
                className="add-ingredient-button"
                disabled={!newIngredient.name.trim() || newIngredient.quantity <= 0}
              >
                <Plus size={16} />
              </button>
            </div>

            {/* Lista de ingredientes */}
            {meal.ingredients.length > 0 && (
              <div className="ingredients-list">
                {meal.ingredients.map((ingredient, index) => {
                  const availability = checkIngredientAvailability(ingredient);
                  return (
                    <div key={index} className={`ingredient-item ${availability.status}`}>
                      <div className="ingredient-info">
                        <span className="ingredient-name">{ingredient.name}</span>
                        <span className="ingredient-quantity">
                          {ingredient.quantity} {ingredient.unit}
                        </span>
                        <span className={`availability-status ${availability.status}`}>
                          {availability.status === 'available' && '✅'}
                          {availability.status === 'insufficient' && '⚠️'}
                          {availability.status === 'missing' && '❌'}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveIngredient(index)}
                        className="remove-ingredient-button"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Resumen de disponibilidad */}
            {meal.ingredients.length > 0 && (
              <div className="availability-summary-modal">
                {canCookMeal() ? (
                  <div className="status-message success">
                    <span>✅ Todos los ingredientes disponibles</span>
                  </div>
                ) : (
                  <div className="status-message warning">
                    <span>⚠️ Faltan: {missingIngredients.map(ing => ing.name).join(', ')}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Botones */}
          <div className="modal-actions">
            <button 
              type="submit" 
              className="submit-button"
              disabled={!meal.name.trim()}
            >
              <ChefHat size={16} />
              Añadir Comida
            </button>
            <button 
              type="button" 
              onClick={onClose}
              className="cancel-button"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddMealModal;