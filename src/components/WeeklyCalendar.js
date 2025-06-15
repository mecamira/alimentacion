// src/components/WeeklyCalendar.js
import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, CheckCircle, Clock, AlertCircle, Plus } from 'lucide-react';
import { mealService, pantryService } from '../services/firebaseService';
import AddMealModal from './AddMealModal';

const WeeklyCalendar = ({ meals, pantryItems, onRefresh }) => {
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [showAddMealModal, setShowAddMealModal] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [isMobileView, setIsMobileView] = useState(false);
  
  // Estado del formulario del modal
  const [modalMeal, setModalMeal] = useState({
    name: '',
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

  // Detectar si estamos en móvil
  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobileView(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Renderizar vista móvil (lista por días)
  const renderMobileView = () => {
    return (
      <div className="mobile-calendar">
        {weekDays.map((day, dayIndex) => {
          const dayMeals = getMealsForDay(day);
          return (
            <div key={day.toISOString()} className="mobile-day">
              <div className="mobile-day-header">
                <h3>{dayNames[dayIndex]}</h3>
                <span className="mobile-day-date">{day.getDate()}</span>
              </div>
              
              <div className="mobile-meals">
                {mealTypes.map(mealType => {
                  const meal = dayMeals.find(m => m.mealType === mealType);
                  
                  return (
                    <div key={`${day.toISOString()}-${mealType}`} className="mobile-meal-row">
                      <div className="mobile-meal-type">{mealType}</div>
                      <div className="mobile-meal-content">
                        {meal ? (
                          <div className={`mobile-meal-card ${meal.completed ? 'completed' : ''}`}>
                            <div className="mobile-meal-info">
                              <span className="mobile-meal-name">{meal.name}</span>
                              {meal.completed ? (
                                <span className="mobile-status completed">
                                  <CheckCircle size={14} /> Completada
                                </span>
                              ) : canCookMeal(meal) ? (
                                <div className="mobile-meal-actions">
                                  <span className="mobile-status ready">
                                    <Clock size={14} /> Listo
                                  </span>
                                  <button 
                                    onClick={() => handleCompleteMeal(meal.id, meal)}
                                    className="mobile-complete-button"
                                  >
                                    ✓ Completar
                                  </button>
                                </div>
                              ) : (
                                <span className="mobile-status missing">
                                  <AlertCircle size={14} /> Faltan ingredientes
                                </span>
                              )}
                            </div>
                          </div>
                        ) : (
                          <button 
                            className="mobile-add-meal-button"
                            onClick={() => handleEmptySlotClick(day, mealType)}
                          >
                            <Plus size={16} />
                            Añadir {mealType.toLowerCase()}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // Obtener el lunes de la semana actual
  const getWeekStart = (date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
  };

  // Generar los 7 días de la semana
  const getWeekDays = () => {
    const weekStart = getWeekStart(currentWeek);
    const days = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(weekStart);
      day.setDate(weekStart.getDate() + i);
      days.push(day);
    }
    return days;
  };

  const weekDays = getWeekDays();
  const dayNames = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
  const mealTypes = ['Desayuno', 'Almuerzo', 'Cena'];
  const difficulties = ['Muy Fácil', 'Fácil', 'Intermedio', 'Difícil', 'Muy Difícil'];
  const units = ['unidades', 'kg', 'g', 'l', 'ml', 'cucharadas', 'cucharaditas', 'tazas', 'pizca'];

  // Navegar semanas
  const navigateWeek = (direction) => {
    const newWeek = new Date(currentWeek);
    newWeek.setDate(currentWeek.getDate() + (direction * 7));
    setCurrentWeek(newWeek);
  };

  // Obtener comidas de un día específico
  const getMealsForDay = (date) => {
    const dateStr = date.toISOString().split('T')[0];
    return meals.filter(meal => meal.date === dateStr);
  };

  // Verificar si se puede cocinar una comida
  const canCookMeal = (meal) => {
    if (!meal.ingredients || meal.ingredients.length === 0) return true;
    
    return meal.ingredients.every(ingredient => {
      const pantryItem = pantryItems.find(item => 
        item.name.toLowerCase() === ingredient.name.toLowerCase()
      );
      return pantryItem && pantryItem.quantity >= ingredient.quantity;
    });
  };

  // Manejar click en slot vacío para añadir comida
  const handleEmptySlotClick = (date, mealType) => {
    console.log('Clicked to add meal:', { date: date.toISOString().split('T')[0], mealType });
    try {
      setSelectedSlot({
        date: date.toISOString().split('T')[0],
        mealType: mealType
      });
      setShowAddMealModal(true);
      console.log('Modal should be opening...');
    } catch (error) {
      console.error('Error opening modal:', error);
    }
  };

  // Cerrar modal
  const handleCloseModal = () => {
    setShowAddMealModal(false);
    setSelectedSlot(null);
    // Resetear formulario
    setModalMeal({
      name: '',
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
  };

  // Añadir ingrediente
  const handleAddIngredient = () => {
    if (newIngredient.name.trim() && newIngredient.quantity > 0) {
      setModalMeal({
        ...modalMeal,
        ingredients: [...modalMeal.ingredients, { ...newIngredient }]
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
    setModalMeal({
      ...modalMeal,
      ingredients: modalMeal.ingredients.filter((_, i) => i !== index)
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
  const handleSaveMeal = async () => {
    if (!modalMeal.name.trim()) {
      alert('Por favor, introduce un nombre para la comida');
      return;
    }

    try {
      const mealToSave = {
        name: modalMeal.name,
        date: selectedSlot.date,
        mealType: selectedSlot.mealType,
        description: modalMeal.description,
        ingredients: modalMeal.ingredients,
        preparationTime: modalMeal.preparationTime,
        difficulty: modalMeal.difficulty
      };

      await mealService.addMeal(mealToSave);
      onRefresh();
      handleCloseModal();
    } catch (error) {
      console.error('Error saving meal:', error);
      alert('Error al guardar la comida');
    }
  };

  // Autocompletar ingredientes
  const getSuggestedIngredients = () => {
    return pantryItems
      .filter(item => 
        item.name.toLowerCase().includes(newIngredient.name.toLowerCase()) &&
        newIngredient.name.length > 0
      )
      .slice(0, 5);
  };

  // Completar comida
  const handleCompleteMeal = async (mealId, meal) => {
    try {
      // Marcar comida como completada
      await mealService.completeMeal(mealId);
      
      // Consumir ingredientes de la despensa
      if (meal.ingredients && meal.ingredients.length > 0) {
        const consumeUpdates = [];
        
        for (const ingredient of meal.ingredients) {
          const pantryItem = pantryItems.find(item => 
            item.name.toLowerCase() === ingredient.name.toLowerCase()
          );
          
          if (pantryItem) {
            const newQuantity = Math.max(0, pantryItem.quantity - ingredient.quantity);
            consumeUpdates.push({
              id: pantryItem.id,
              newQuantity: newQuantity
            });
          }
        }
        
        if (consumeUpdates.length > 0) {
          await pantryService.consumeIngredients(consumeUpdates);
        }
      }
      
      onRefresh();
    } catch (error) {
      console.error('Error completing meal:', error);
      alert('Error al completar la comida');
    }
  };

  return (
    <div className="weekly-calendar">
      <div className="calendar-header">
        <div className="week-navigation">
          <button onClick={() => navigateWeek(-1)} className="nav-button">
            <ChevronLeft size={isMobileView ? 16 : 20} />
          </button>
          <h2>
            {isMobileView 
              ? `${weekDays[0].toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })} - ${weekDays[6].toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}`
              : `Semana del ${weekDays[0].toLocaleDateString('es-ES')} al ${weekDays[6].toLocaleDateString('es-ES')}`
            }
          </h2>
          <button onClick={() => navigateWeek(1)} className="nav-button">
            <ChevronRight size={isMobileView ? 16 : 20} />
          </button>
        </div>
      </div>

      {/* Vista móvil o desktop */}
      {isMobileView ? renderMobileView() : (
        <div className="calendar-grid">
        {/* Encabezados de días */}
        <div className="time-slot"></div>
        {weekDays.map((day, index) => (
          <div key={day.toISOString()} className="day-header">
            <div className="day-name">{dayNames[index]}</div>
            <div className="day-date">{day.getDate()}</div>
          </div>
        ))}

        {/* Filas de comidas */}
        {mealTypes.map(mealType => (
          <React.Fragment key={mealType}>
            <div className="meal-type-header">
              {mealType}
            </div>
            {weekDays.map(day => {
              const dayMeals = getMealsForDay(day);
              const meal = dayMeals.find(m => m.mealType === mealType);
              
              return (
                <div key={`${day.toISOString()}-${mealType}`} className="meal-slot">
                  {meal ? (
                    <div className={`meal-card ${meal.completed ? 'completed' : ''}`}>
                      <div className="meal-name">{meal.name}</div>
                      
                      <div className="meal-status">
                        {meal.completed ? (
                          <div className="status-badge completed">
                            <CheckCircle size={isMobileView ? 10 : 14} />
                            {!isMobileView && 'Completada'}
                          </div>
                        ) : canCookMeal(meal) ? (
                          <div className="meal-actions">
                            <div className="status-badge ready">
                              <Clock size={isMobileView ? 10 : 14} />
                              {!isMobileView && 'Listo para cocinar'}
                            </div>
                            <button 
                              onClick={() => handleCompleteMeal(meal.id, meal)}
                              className="complete-button"
                            >
                              {isMobileView ? '✓' : 'Marcar como hecha'}
                            </button>
                          </div>
                        ) : (
                          <div className="status-badge missing">
                            <AlertCircle size={isMobileView ? 10 : 14} />
                            {!isMobileView && 'Faltan ingredientes'}
                          </div>
                        )}
                      </div>
                      
                      {meal.ingredients && meal.ingredients.length > 0 && !isMobileView && (
                        <div className="meal-ingredients">
                          <small>Ingredientes:</small>
                          <ul>
                            {meal.ingredients.map((ingredient, idx) => {
                              const pantryItem = pantryItems.find(item => 
                                item.name.toLowerCase() === ingredient.name.toLowerCase()
                              );
                              const hasEnough = pantryItem && pantryItem.quantity >= ingredient.quantity;
                              
                              return (
                                <li 
                                  key={idx} 
                                  className={hasEnough ? 'available' : 'missing'}
                                >
                                  {ingredient.name} ({ingredient.quantity} {ingredient.unit})
                                  {!hasEnough && ' ❌'}
                                </li>
                              );
                            })}
                          </ul>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div 
                      className="empty-meal-slot clickable" 
                      onClick={() => handleEmptySlotClick(day, mealType)}
                      title="Hacer clic para añadir comida"
                    >
                      <Plus size={isMobileView ? 12 : 16} className="add-icon" />
                      {!isMobileView && <span>Añadir comida</span>}
                    </div>
                  )}
                </div>
              );
            })}
          </React.Fragment>
        ))}
      </div>
      )}

      {/* Modal para añadir comida */}
      {showAddMealModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          zIndex: 999999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem'
        }} onClick={handleCloseModal}>
          <div style={{
            backgroundColor: 'white',
            padding: '2rem',
            borderRadius: '16px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4)',
            maxWidth: '600px',
            width: '100%',
            maxHeight: '90vh',
            overflow: 'auto',
            zIndex: 1000000
          }} onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              padding: '1.5rem',
              margin: '-2rem -2rem 1.5rem -2rem',
              borderRadius: '16px 16px 0 0',
              position: 'relative'
            }}>
              <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                🍽️ Añadir Comida
              </h2>
              <p style={{ margin: '0.5rem 0 0 0', opacity: 0.9 }}>
                {new Date(selectedSlot?.date + 'T00:00:00').toLocaleDateString('es-ES', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })} - {selectedSlot?.mealType}
              </p>
              <button 
                onClick={handleCloseModal} 
                style={{
                  position: 'absolute',
                  top: '1rem',
                  right: '1rem',
                  background: 'rgba(255, 255, 255, 0.2)',
                  border: 'none',
                  color: 'white',
                  padding: '0.5rem',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '1.2rem'
                }}
              >
                ×
              </button>
            </div>
            
            {/* Formulario completo */}
            <div>
              {/* Nombre de la comida */}
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.5rem' }}>Nombre de la comida *</label>
                <input 
                  type="text" 
                  placeholder="Ej: Pasta con tomate"
                  value={modalMeal.name}
                  onChange={(e) => setModalMeal({...modalMeal, name: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
              
              {/* Tiempo y dificultad */}
              <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.5rem' }}>⏱️ Tiempo (min)</label>
                  <input 
                    type="number" 
                    value={modalMeal.preparationTime}
                    onChange={(e) => setModalMeal({...modalMeal, preparationTime: parseInt(e.target.value) || 0})}
                    min="1"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '1rem',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.5rem' }}>Dificultad</label>
                  <select 
                    value={modalMeal.difficulty}
                    onChange={(e) => setModalMeal({...modalMeal, difficulty: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '1rem',
                      boxSizing: 'border-box'
                    }}
                  >
                    {difficulties.map(diff => (
                      <option key={diff} value={diff}>{diff}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              {/* Descripción */}
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.5rem' }}>Descripción (opcional)</label>
                <textarea 
                  placeholder="Describe la receta..."
                  value={modalMeal.description}
                  onChange={(e) => setModalMeal({...modalMeal, description: e.target.value})}
                  rows="2"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    resize: 'vertical',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
              
              {/* Ingredientes */}
              <div style={{ marginBottom: '1.5rem' }}>
                <h4 style={{ marginBottom: '1rem', color: '#2d3748' }}>🥘 Ingredientes</h4>
                
                {/* Añadir ingrediente */}
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: '0.5rem', marginBottom: '1rem', alignItems: 'end' }}>
                  <div style={{ position: 'relative' }}>
                    <input 
                      type="text"
                      placeholder="Ingrediente"
                      value={newIngredient.name}
                      onChange={(e) => setNewIngredient({...newIngredient, name: e.target.value})}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        fontSize: '1rem',
                        boxSizing: 'border-box'
                      }}
                    />
                    {/* Sugerencias */}
                    {getSuggestedIngredients().length > 0 && newIngredient.name && (
                      <div style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        right: 0,
                        background: 'white',
                        border: '1px solid #e2e8f0',
                        borderTop: 'none',
                        borderRadius: '0 0 8px 8px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                        zIndex: 10,
                        maxHeight: '200px',
                        overflowY: 'auto'
                      }}>
                        {getSuggestedIngredients().map(item => (
                          <div
                            key={item.id}
                            style={{
                              padding: '0.75rem',
                              cursor: 'pointer',
                              borderBottom: '1px solid #f1f5f9',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center'
                            }}
                            onMouseEnter={(e) => e.target.style.backgroundColor = '#f7fafc'}
                            onMouseLeave={(e) => e.target.style.backgroundColor = 'white'}
                            onClick={() => setNewIngredient({
                              ...newIngredient,
                              name: item.name,
                              unit: item.unit
                            })}
                          >
                            <span style={{ fontWeight: '500', color: '#2d3748' }}>{item.name}</span>
                            <span style={{ fontSize: '0.875rem', color: '#718096' }}>({item.quantity} {item.unit})</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <input 
                    type="number"
                    placeholder="Cantidad"
                    value={newIngredient.quantity}
                    onChange={(e) => setNewIngredient({...newIngredient, quantity: parseFloat(e.target.value) || 0})}
                    min="0.1"
                    step="0.1"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '1rem',
                      boxSizing: 'border-box'
                    }}
                  />
                  <select 
                    value={newIngredient.unit}
                    onChange={(e) => setNewIngredient({...newIngredient, unit: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '1rem',
                      boxSizing: 'border-box'
                    }}
                  >
                    {units.map(unit => (
                      <option key={unit} value={unit}>{unit}</option>
                    ))}
                  </select>
                  <button 
                    type="button"
                    onClick={handleAddIngredient}
                    disabled={!newIngredient.name.trim() || newIngredient.quantity <= 0}
                    style={{
                      background: newIngredient.name.trim() && newIngredient.quantity > 0 
                        ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' 
                        : '#e2e8f0',
                      color: newIngredient.name.trim() && newIngredient.quantity > 0 ? 'white' : '#a0aec0',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '0.75rem',
                      cursor: newIngredient.name.trim() && newIngredient.quantity > 0 ? 'pointer' : 'not-allowed',
                      fontSize: '1.2rem'
                    }}
                  >
                    +
                  </button>
                </div>
                
                {/* Lista de ingredientes */}
                {modalMeal.ingredients.length > 0 && (
                  <div>
                    <h5 style={{ marginBottom: '0.5rem', color: '#4a5568' }}>Ingredientes añadidos:</h5>
                    {modalMeal.ingredients.map((ingredient, index) => {
                      const availability = checkIngredientAvailability(ingredient);
                      return (
                        <div key={index} style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '0.5rem',
                          border: `1px solid ${
                            availability.status === 'available' ? '#9ae6b4' : 
                            availability.status === 'insufficient' ? '#fbb040' : '#fc8181'
                          }`,
                          backgroundColor: `${
                            availability.status === 'available' ? '#f0fff4' : 
                            availability.status === 'insufficient' ? '#fffbf0' : '#fff5f5'
                          }`,
                          borderRadius: '6px',
                          marginBottom: '0.5rem',
                          fontSize: '0.875rem'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <span style={{ fontWeight: '500', color: '#2d3748' }}>{ingredient.name}</span>
                            <span style={{ color: '#4a5568' }}>{ingredient.quantity} {ingredient.unit}</span>
                            <span style={{ 
                              fontSize: '0.8rem',
                              fontWeight: '500',
                              color: availability.status === 'available' ? '#22543d' : 
                                     availability.status === 'insufficient' ? '#c05621' : '#742a2a'
                            }}>
                              {availability.status === 'available' && '✅ Disponible'}
                              {availability.status === 'insufficient' && `⚠️ Insuficiente (${availability.available} ${ingredient.unit})`}
                              {availability.status === 'missing' && '❌ No disponible'}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveIngredient(index)}
                            style={{
                              background: 'none',
                              border: '1px solid #e2e8f0',
                              borderRadius: '4px',
                              padding: '0.25rem',
                              cursor: 'pointer',
                              color: '#f56565',
                              fontSize: '0.875rem'
                            }}
                          >
                            🗑️
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
              
              {/* Botones */}
              <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                <button 
                  onClick={handleSaveMeal}
                  disabled={!modalMeal.name.trim()}
                  style={{
                    background: modalMeal.name.trim() 
                      ? 'linear-gradient(135deg, #48bb78 0%, #38a169 100%)' 
                      : '#e2e8f0',
                    color: modalMeal.name.trim() ? 'white' : '#a0aec0',
                    border: 'none',
                    padding: '0.75rem 1.5rem',
                    borderRadius: '8px',
                    cursor: modalMeal.name.trim() ? 'pointer' : 'not-allowed',
                    fontWeight: 'bold',
                    flex: 1
                  }}
                >
                  🍽️ Añadir Comida
                </button>
                <button 
                  onClick={handleCloseModal}
                  style={{
                    background: '#e2e8f0',
                    color: '#4a5568',
                    border: 'none',
                    padding: '0.75rem 1.5rem',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: 'bold'
                  }}
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WeeklyCalendar;