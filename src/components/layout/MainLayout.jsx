/**
 * @fileoverview MainLayout — Wrapper responsivo de la aplicación con sidebar offcanvas y contenido adaptable.
 */

import { useState } from 'react';
import Sidebar from './Sidebar.jsx';
import Header from './Header.jsx';

/**
 * @param {{ children: React.ReactNode, titulo: string, subtitulo?: string }} props
 */
const MainLayout = ({ children, titulo, subtitulo }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div
      className="d-flex"
      style={{
        minHeight: '100vh',
        background: 'var(--bg-main)',
        color: 'var(--text-main)',
      }}
    >
      {/* Sidebar fijo / offcanvas móvil */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Contenido principal con margen dinámico */}
      <div
        className="app-main-content flex-grow-1 d-flex flex-column min-w-0"
        style={{ minHeight: '100vh' }}
      >
        <Header
          titulo={titulo}
          subtitulo={subtitulo}
          onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
        />
        <main className="flex-grow-1 p-3 p-md-4 min-w-0">
          {children}
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
