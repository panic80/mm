import React from 'react';

    function MobileToggle({ isMobile, sidebarOpen, toggleMobileSidebar }) {
      if (!isMobile) return null;

      return (
        <button className="mobile-toggle" onClick={toggleMobileSidebar}>
          {sidebarOpen ? 'Close Menu' : 'Open Menu'}
        </button>
      );
    }

    export default MobileToggle;
