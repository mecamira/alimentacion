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
    setSelectedSlot({
      date: date.toISOString().split('T')[0],
      mealType: mealType
    });
    setShowAddMealModal(true);
  };

  // Cerrar modal
  const handleCloseModal = () => {
    setShowAddMealModal(false);
    setSelectedSlot(null);
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
        <AddMealModal
          selectedSlot={selectedSlot}
          pantryItems={pantryItems}
          onClose={handleCloseModal}
          onRefresh={onRefresh}
        />
      )}
    </div>
  );
};

export default WeeklyCalendar;