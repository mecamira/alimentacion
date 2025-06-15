// src/components/AddMeal.js
import React, { useState } from 'react';
import { Plus, Trash2, Calendar, Clock, ChefHat } from 'lucide-react';
import { mealService } from '../services/firebaseService';

const AddMeal = ({ pantryItems, onRefresh }) => {
  const [meal, setMeal] = useState({
    name: '',
    date: new Date().toISOString().split('T')[0],
    mealType: 'Almuerzo',
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
      
      // Resetear formulario
      setMeal({
        name: '',
        date: new Date().toISOString().split('T')[0],
        mealType: 'Almuerzo',
        description: '',
        ingredients: [],
        preparationTime: 30,
        difficulty: 'Fácil'
      });
      
      onRefresh();
      alert('Comida añadida correctamente');
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

  return (
    <div className="add-meal">
      <div className="add-meal-header">
        <h2>
          <ChefHat size={24} />
          Añadir Nueva Comida
        </h2>
        <p>Planifica tus comidas y gestiona los ingredientes necesarios</p>
      </div>

      <form onSubmit={handleSubmit} className="meal-form">
        {/* Información básica */}
        <div className="form-section">
          <h3>
            <Calendar size={20} />
            Información Básica
          </h3>
          
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
                Tiempo de preparación (minutos)
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
              placeholder="Describe la receta, instrucciones especiales..."
              className="form-textarea"
              rows="3"
            />
          </div>
        </div>

        {/* Ingredientes */}
        <div className="form-section">
          <h3>Ingredientes</h3>
          
          {/* Añadir ingrediente */}
          <div className="ingredient-input-section">
            <div className="ingredient-input-row">
              <div className="ingredient-input-group">
                <input
                  type="text"
                  value={newIngredient.name}
                  onChange={(e) => setNewIngredient({...newIngredient, name: e.target.value})}
                  placeholder="Nombre del ingrediente"
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
                          ({item.quantity} {item.unit} disponibles)
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
                className="form-input quantity-input"
              />
              <select
                value={newIngredient.unit}
                onChange={(e) => setNewIngredient({...newIngredient, unit: e.target.value})}
                className="form-select unit-select"
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
          </div>

          {/* Lista de ingredientes */}
          {meal.ingredients.length > 0 && (
            <div className="ingredients-list">
              <h4>Ingredientes añadidos:</h4>
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
                        {availability.status === 'available' && '✅ Disponible'}
                        {availability.status === 'insufficient' && `⚠️ Insuficiente (${availability.available} ${ingredient.unit})`}
                        {availability.status === 'missing' && '❌ No disponible'}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveIngredient(index)}
                      className="remove-ingredient-button"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Resumen de disponibilidad */}
        {meal.ingredients.length > 0 && (
          <div className="availability-summary">
            <h4>Resumen de Disponibilidad</h4>
            {canCookMeal() ? (
              <div className="status-message success">
                <span className="status-icon">✅</span>
                <span>Todos los ingredientes están disponibles. ¡Puedes cocinar esta comida!</span>
              </div>
            ) : (
              <div className="status-message warning">
                <span className="status-icon">⚠️</span>
                <div>
                  <span>Faltan algunos ingredientes:</span>
                  <ul className="missing-ingredients">
                    {missingIngredients.map((ingredient, index) => {
                      const availability = checkIngredientAvailability(ingredient);
                      return (
                        <li key={index}>
                          {ingredient.name}: necesitas {ingredient.quantity} {ingredient.unit}
                          {availability.status === 'insufficient' && 
                            ` (tienes ${availability.available} ${ingredient.unit})`
                          }
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Botones de acción */}
        <div className="form-actions">
          <button 
            type="submit" 
            className="submit-button"
            disabled={!meal.name.trim()}
          >
            <ChefHat size={20} />
            Añadir Comida
          </button>
          <button 
            type="button" 
            onClick={() => {
              setMeal({
                name: '',
                date: new Date().toISOString().split('T')[0],
                mealType: 'Almuerzo',
                description: '',
                ingredients: [],
                preparationTime: 30,
                difficulty: 'Fácil'
              });
              setNewIngredient({
                name: '',
                quantity: 1,
                unit: 'unidades'
              });
            }}
            className="reset-button"
          >
            Limpiar Formulario
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddMeal;