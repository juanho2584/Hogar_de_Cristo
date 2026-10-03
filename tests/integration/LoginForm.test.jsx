import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import LoginPage from '../../src/pages/LoginPage.jsx';
import useAuthStore from '../../src/store/authStore.js';

describe('Integración: Formulario de Login', () => {
  beforeEach(() => {
    // Reset store state
    useAuthStore.setState({
      usuario: null,
      loading: false,
      error: null,
      lockoutRemaining: 0,
    });
  });

  it('debe renderizar el título institucional y los campos de email y password', () => {
    render(
      <BrowserRouter>
        <LoginPage />
      </BrowserRouter>
    );

    expect(screen.getByText('Hogar de Dios')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('admin@hogar.edu')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /ingresar al sistema/i })).toBeInTheDocument();
  });

  it('debe mostrar error de validación cuando el correo electrónico tiene formato inválido', async () => {
    const user = userEvent.setup();
    render(
      <BrowserRouter>
        <LoginPage />
      </BrowserRouter>
    );

    const emailInput = screen.getByPlaceholderText('admin@hogar.edu');
    await user.type(emailInput, 'correo-invalido');

    const submitBtn = screen.getByRole('button', { name: /ingresar al sistema/i });
    await user.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/ingresá un correo electrónico válido/i)).toBeInTheDocument();
    });
  });

  it('debe mostrar el botón de recuperación de contraseña y abrir el modal modal al hacer clic', async () => {
    const user = userEvent.setup();
    render(
      <BrowserRouter>
        <LoginPage />
      </BrowserRouter>
    );

    const recoveryBtn = screen.getByText(/¿olvidaste tu contraseña\?/i);
    expect(recoveryBtn).toBeInTheDocument();

    await user.click(recoveryBtn);

    expect(screen.getByText('Recuperar Contraseña')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('ejemplo@hogar.edu')).toBeInTheDocument();
  });
});
