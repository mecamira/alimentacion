// src/components/WeeklyCalendar.js
import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { mealService, pantryService } from '../services/firebaseService';

const WeeklyCalendar = ({ meals, pantryItems, onRefresh }) => {
  const [currentWeek, setCurrentWeek] = useState(new Date());

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
            <ChevronLeft size={20} />
          </button>
          <h2>
            Semana del {weekDays[0].toLocaleDateString('es-ES')} al {weekDays[6].toLocaleDateString('es-ES')}
          </h2>
          <button onClick={() => navigateWeek(1)} className="nav-button">
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

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
                            <CheckCircle size={14} />
                            Completada
                          </div>
                        ) : canCookMeal(meal) ? (
                          <div className="meal-actions">
                            <div className="status-badge ready">
                              <Clock size={14} />
                              Listo para cocinar
                            </div>
                            <button 
                              onClick={() => handleCompleteMeal(meal.id, meal)}
                              className="complete-button"
                            >
                              Marcar como hecha
                            </button>
                          </div>
                        ) : (
                          <div className="status-badge missing">
                            <AlertCircle size={14} />
                            Faltan ingredientes
                          </div>
                        )}
                      </div>
                      
                      {meal.ingredients && meal.ingredients.length > 0 && (
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
                    <div className="empty-meal-slot">
                      <span>Sin planificar</span>
                    </div>
                  )}
                </div>
              );
            })}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

export default WeeklyCalendar;