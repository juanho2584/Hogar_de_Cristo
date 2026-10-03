import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { describe, it, expect, beforeEach } from 'vitest';
import ProtectedRoute from '../../src/components/auth/ProtectedRoute.jsx';
import useAuthStore from '../../src/store/authStore.js';

describe('Integración: ProtectedRoute & Guard RBAC', () => {
  beforeEach(() => {
    useAuthStore.setState({ usuario: null });
  });

  it('debe redirigir al login si el usuario no está autenticado', () => {
    render(
      <MemoryRouter initialEntries={['/privado']}>
        <Routes>
          <Route path="/login" element={<div>Vista Login</div>} />
          <Route
            path="/privado"
            element={
              <ProtectedRoute>
                <div>Contenido Protegido</div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Vista Login')).toBeInTheDocument();
    expect(screen.queryByText('Contenido Protegido')).not.toBeInTheDocument();
  });

  it('debe renderizar el contenido protegido si el usuario está autenticado', () => {
    useAuthStore.setState({
      usuario: { id: 'usr-1', email: 'docente@hogar.edu', rol: 'user' },
    });

    render(
      <MemoryRouter initialEntries={['/privado']}>
        <Routes>
          <Route
            path="/privado"
            element={
              <ProtectedRoute>
                <div>Contenido Protegido</div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Contenido Protegido')).toBeInTheDocument();
  });

  it('debe bloquear y redirigir al dashboard si se requiere rol admin y el usuario es docente (user)', () => {
    useAuthStore.setState({
      usuario: { id: 'usr-2', email: 'docente@hogar.edu', rol: 'user' },
    });

    render(
      <MemoryRouter initialEntries={['/admin-only']}>
        <Routes>
          <Route path="/dashboard" element={<div>Vista Dashboard</div>} />
          <Route
            path="/admin-only"
            element={
              <ProtectedRoute requireAdmin>
                <div>Solo Administradores</div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Vista Dashboard')).toBeInTheDocument();
    expect(screen.queryByText('Solo Administradores')).not.toBeInTheDocument();
  });
});
