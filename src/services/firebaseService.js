// src/services/firebaseService.js
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../firebase/config';

// Servicios para Comidas
export const mealService = {
  // Obtener todas las comidas
  async getAllMeals() {
    const querySnapshot = await getDocs(collection(db, 'meals'));
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  },

  // Obtener comidas por fecha
  async getMealsByDate(date) {
    const q = query(
      collection(db, 'meals'),
      where('date', '==', date),
      orderBy('mealType')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  },

  // Añadir nueva comida
  async addMeal(mealData) {
    return await addDoc(collection(db, 'meals'), {
      ...mealData,
      createdAt: serverTimestamp(),
      completed: false
    });
  },

  // Actualizar comida
  async updateMeal(mealId, updates) {
    const mealRef = doc(db, 'meals', mealId);
    return await updateDoc(mealRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
  },

  // Marcar comida como completada
  async completeMeal(mealId) {
    const mealRef = doc(db, 'meals', mealId);
    return await updateDoc(mealRef, {
      completed: true,
      completedAt: serverTimestamp()
    });
  },

  // Eliminar comida
  async deleteMeal(mealId) {
    return await deleteDoc(doc(db, 'meals', mealId));
  }
};

// Servicios para Despensa
export const pantryService = {
  // Obtener todos los alimentos de la despensa
  async getAllPantryItems() {
    const querySnapshot = await getDocs(collection(db, 'pantry'));
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  },

  // Añadir alimento a la despensa
  async addPantryItem(itemData) {
    return await addDoc(collection(db, 'pantry'), {
      ...itemData,
      createdAt: serverTimestamp()
    });
  },

  // Actualizar cantidad de alimento
  async updatePantryItem(itemId, updates) {
    const itemRef = doc(db, 'pantry', itemId);
    return await updateDoc(itemRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
  },

  // Consumir alimentos (reducir cantidad)
  async consumeIngredients(ingredients) {
    const batch = [];
    for (const ingredient of ingredients) {
      const itemRef = doc(db, 'pantry', ingredient.id);
      batch.push(updateDoc(itemRef, {
        quantity: ingredient.newQuantity,
        updatedAt: serverTimestamp()
      }));
    }
    return await Promise.all(batch);
  },

  // Eliminar alimento de la despensa
  async deletePantryItem(itemId) {
    return await deleteDoc(doc(db, 'pantry', itemId));
  }
};

// Servicios para Compras
export const shoppingService = {
  // Obtener lista de compras
  async getShoppingList() {
    const querySnapshot = await getDocs(collection(db, 'shopping'));
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  },

  // Añadir artículo a la lista de compras
  async addShoppingItem(itemData) {
    return await addDoc(collection(db, 'shopping'), {
      ...itemData,
      createdAt: serverTimestamp(),
      purchased: false
    });
  },

  // Marcar artículo como comprado
  async markAsPurchased(itemId, quantity) {
    const itemRef = doc(db, 'shopping', itemId);
    return await updateDoc(itemRef, {
      purchased: true,
      purchasedAt: serverTimestamp(),
      purchasedQuantity: quantity
    });
  },

  // Eliminar artículo de la lista
  async deleteShoppingItem(itemId) {
    return await deleteDoc(doc(db, 'shopping', itemId));
  }
};