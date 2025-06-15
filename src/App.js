// src/App.js
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { Calendar, ShoppingCart, Package, Home, Plus } from 'lucide-react';
import WeeklyCalendar from './components/WeeklyCalendar';
import Pantry from './components/Pantry';
import ShoppingList from './components/ShoppingList';
import Dashboard from './components/Dashboard';
import AddMeal from './components/AddMeal';
import { mealService, pantryService, shoppingService } from './services/firebaseService';
import './App.css';

function App() {
  const [meals, setMeals] = useState([]);
  const [pantryItems, setPantryItems] = useState([]);
  const [shoppingItems, setShoppingItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [mealsData, pantryData, shoppingData] = await Promise.all([
        mealService.getAllMeals(),
        pantryService.getAllPantryItems(),
        shoppingService.getShoppingList()
      ]);
      
      setMeals(mealsData);
      setPantryItems(pantryData);
      setShoppingItems(shoppingData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshData = () => {
    loadData();
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Cargando aplicación...</p>
      </div>
    );
  }

  return (
    <Router>
      <div className="app">
        <nav className="navbar">
          <div className="nav-brand">
            <h1>🍽️ Alimentación</h1>
          </div>
          <div className="nav-links">
            <Link to="/" className="nav-link">
              <Home size={20} />
              <span>Inicio</span>
            </Link>
            <Link to="/calendar" className="nav-link">
              <Calendar size={20} />
              <span>Calendario</span>
            </Link>
            <Link to="/pantry" className="nav-link">
              <Package size={20} />
              <span>Despensa</span>
            </Link>
            <Link to="/shopping" className="nav-link">
              <ShoppingCart size={20} />
              <span>Compras</span>
            </Link>
            <Link to="/add-meal" className="nav-link nav-link-primary">
              <Plus size={20} />
              <span>Añadir Comida</span>
            </Link>
          </div>
        </nav>

        <main className="main-content">
          <Routes>
            <Route 
              path="/" 
              element={
                <Dashboard 
                  meals={meals}
                  pantryItems={pantryItems}
                  shoppingItems={shoppingItems}
                  onRefresh={refreshData}
                />
              } 
            />
            <Route 
              path="/calendar" 
              element={
                <WeeklyCalendar 
                  meals={meals}
                  pantryItems={pantryItems}
                  onRefresh={refreshData}
                />
              } 
            />
            <Route 
              path="/pantry" 
              element={
                <Pantry 
                  pantryItems={pantryItems}
                  onRefresh={refreshData}
                />
              } 
            />
            <Route 
              path="/shopping" 
              element={
                <ShoppingList 
                  shoppingItems={shoppingItems}
                  pantryItems={pantryItems}
                  onRefresh={refreshData}
                />
              } 
            />
            <Route 
              path="/add-meal" 
              element={
                <AddMeal 
                  pantryItems={pantryItems}
                  onRefresh={refreshData}
                />
              } 
            />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;