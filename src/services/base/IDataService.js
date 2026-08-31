/**
 * @fileoverview Interfaz base de servicios de datos.
 * 
 * Todas las implementaciones (localStorage, Supabase, Firebase, REST API)
 * deben seguir esta interfaz para garantizar intercambiabilidad.
 * 
 * Para migrar a Supabase en Fase 2:
 * 1. Crear `services/supabase/<entidad>Service.js`
 * 2. Implementar los mismos métodos usando el cliente Supabase
 * 3. Actualizar los imports en los stores — sin cambios en componentes
 */

/**
 * @template T
 * @typedef {Object} IDataService
 * @property {() => Promise<T[]>} getAll - Obtiene todos los registros
 * @property {(id: string) => Promise<T|null>} getById - Obtiene un registro por ID
 * @property {(data: Omit<T, 'id'>) => Promise<T>} create - Crea un nuevo registro
 * @property {(id: string, data: Partial<T>) => Promise<T>} update - Actualiza un registro
 * @property {(id: string) => Promise<void>} delete - Elimina un registro
 */

export {}; // Módulo vacío — solo define la interfaz vía JSDoc
