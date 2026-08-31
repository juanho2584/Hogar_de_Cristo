/**
 * @fileoverview MainLayout — Wrapper de la aplicación con sidebar + contenido.
 */

import Sidebar from './Sidebar.jsx';
import Header from './Header.jsx';

/**
 * @param {{ children: React.ReactNode, titulo: string, subtitulo?: string }} props
 */
const MainLayout = ({ children, titulo, subtitulo }) => {
  return (
    <div
      className="d-flex"
      style={{ minHeight: '100vh', background: '#0d1117' }}
    >
      {/* Sidebar fijo */}
      <Sidebar />

      {/* Contenido principal */}
      <div className="flex-grow-1 d-flex flex-column" style={{ marginLeft: '260px', minHeight: '100vh' }}>
        <Header titulo={titulo} subtitulo={subtitulo} />
        <main className="flex-grow-1 p-4">
          {children}
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
