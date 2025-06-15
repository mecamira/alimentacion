// src/components/Dashboard.js
import React from 'react';
import { Calendar, Package, ShoppingCart, CheckCircle, AlertTriangle } from 'lucide-react';

const Dashboard = ({ meals, pantryItems, shoppingItems, onRefresh }) => {
  const today = new Date().toISOString().split('T')[0];
  
  // Estadísticas
  const todayMeals = meals.filter(meal => meal.date === today);
  const completedMeals = todayMeals.filter(meal => meal.completed);
  const lowStockItems = pantryItems.filter(item => item.quantity <= item.minQuantity || 0);
  const pendingShoppingItems = shoppingItems.filter(item => !item.purchased);

  // Próximas comidas de la semana
  const getNextWeekMeals = () => {
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    return meals
      .filter(meal => new Date(meal.date) <= nextWeek && new Date(meal.date) >= new Date())
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .slice(0, 5);
  };

  const nextMeals = getNextWeekMeals();

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h2>Panel de Control</h2>
        <p>Resumen de tu planificación alimentaria</p>
      </div>

      {/* Tarjetas de estadísticas */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">
            <Calendar size={24} />
          </div>
          <div className="stat-content">
            <h3>{todayMeals.length}</h3>
            <p>Comidas de hoy</p>
            <small>{completedMeals.length} completadas</small>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <Package size={24} />
          </div>
          <div className="stat-content">
            <h3>{pantryItems.length}</h3>
            <p>Productos en despensa</p>
            <small>{lowStockItems.length} con stock bajo</small>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <ShoppingCart size={24} />
          </div>
          <div className="stat-content">
            <h3>{pendingShoppingItems.length}</h3>
            <p>Productos por comprar</p>
            <small>Lista de compras</small>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <CheckCircle size={24} />
          </div>
          <div className="stat-content">
            <h3>{Math.round((completedMeals.length / Math.max(todayMeals.length, 1)) * 100)}%</h3>
            <p>Progreso del día</p>
            <small>Comidas completadas</small>
          </div>
        </div>
      </div>

      {/* Secciones principales */}
      <div className="dashboard-sections">
        {/* Comidas de hoy */}
        <div className="dashboard-section">
          <h3>
            <Calendar size={20} />
            Comidas de Hoy
          </h3>
          {todayMeals.length > 0 ? (
            <div className="meal-list">
              {todayMeals.map(meal => (
                <div key={meal.id} className={`meal-item ${meal.completed ? 'completed' : ''}`}>
                  <div className="meal-info">
                    <span className="meal-type">{meal.mealType}</span>
                    <span className="meal-name">{meal.name}</span>
                  </div>
                  <div className="meal-status">
                    {meal.completed ? (
                      <CheckCircle size={16} className="completed-icon" />
                    ) : (
                      <div className="pending-dot"></div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="empty-state">No hay comidas planificadas para hoy</p>
          )}
        </div>

        {/* Próximas comidas */}
        <div className="dashboard-section">
          <h3>
            <Calendar size={20} />
            Próximas Comidas
          </h3>
          {nextMeals.length > 0 ? (
            <div className="meal-list">
              {nextMeals.map(meal => (
                <div key={meal.id} className="meal-item">
                  <div className="meal-info">
                    <span className="meal-date">{new Date(meal.date).toLocaleDateString('es-ES')}</span>
                    <span className="meal-type">{meal.mealType}</span>
                    <span className="meal-name">{meal.name}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="empty-state">No hay comidas planificadas próximamente</p>
          )}
        </div>

        {/* Alertas de stock bajo */}
        {lowStockItems.length > 0 && (
          <div className="dashboard-section alert-section">
            <h3>
              <AlertTriangle size={20} />
              Stock Bajo
            </h3>
            <div className="alert-list">
              {lowStockItems.map(item => (
                <div key={item.id} className="alert-item">
                  <span className="item-name">{item.name}</span>
                  <span className="item-quantity">
                    {item.quantity} {item.unit}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Lista de compras pendientes */}
        {pendingShoppingItems.length > 0 && (
          <div className="dashboard-section">
            <h3>
              <ShoppingCart size={20} />
              Pendiente de Comprar
            </h3>
            <div className="shopping-preview">
              {pendingShoppingItems.slice(0, 5).map(item => (
                <div key={item.id} className="shopping-item">
                  <span className="item-name">{item.name}</span>
                  <span className="item-quantity">
                    {item.quantity} {item.unit}
                  </span>
                </div>
              ))}
              {pendingShoppingItems.length > 5 && (
                <p className="more-items">+{pendingShoppingItems.length - 5} más...</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;