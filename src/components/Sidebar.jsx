import React from 'react';
import { Link } from 'react-router-dom';

function Sidebar({ theme, toggleTheme, sidebarCollapsed, toggleSidebar, isMobile, sidebarOpen, manualMobileToggle, toggleManualMobile }) {
  return (
    <div className={`sidebar ${sidebarCollapsed ? 'collapsed' : ''} ${isMobile && sidebarOpen ? 'open' : ''}`}>
      <button
        className={`sidebar-toggle ${sidebarCollapsed ? 'collapsed' : ''}`}
        onClick={toggleSidebar}
        aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="toggle-icon"
        >
          <path
            d="M10 12L6 8L10 4"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      <div className="sidebar-content" style={{ paddingTop: '2rem' }}>
        <Link to="/" className="tooltip-button w-full flex items-center gap-3 px-2 py-2 text-base font-medium rounded-md hover:bg-[var(--primary)] hover:text-white transition-colors duration-200">
          <span className="tooltip">Ask Question</span>
          <svg
            className="menu-icon"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M12 19V12M12 12V5M12 12H19M12 12H5"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
          <span className="menu-text">Ask Question</span>
        </Link>
        <Link to="/report" className="tooltip-button w-full flex items-center gap-3 px-2 py-2 text-base font-medium rounded-md hover:bg-[var(--primary)] hover:text-white transition-colors duration-200">
          <span className="tooltip">Report Problems</span>
          <svg
            className="menu-icon"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M12 8V12M12 16H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
          <span className="menu-text">Report Problems</span>
        </Link>
        <Link to="/faq" className="tooltip-button w-full flex items-center gap-3 px-2 py-2 text-base font-medium rounded-md hover:bg-[var(--primary)] hover:text-white transition-colors duration-200">
          <span className="tooltip">FAQ</span>
          <svg
            className="menu-icon"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M9.87891 7.51884C11.0505 6.49372 12.95 6.49372 14.1215 7.51884C15.2931 8.54397 15.2931 10.2063 14.1215 11.2314L12.0002 13.0752/L9.87891 11.2314C8.70734 10.2063 8.70734 8.54397 9.87891 7.51884Z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <path
              d="M12 13V17M12 21H12.01"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
          <span className="menu-text">FAQ</span>
        </Link>
        <Link to="/contact" className="tooltip-button w-full flex items-center gap-3 px-2 py-2 text-base font-medium rounded-md hover:bg-[var(--primary)] hover:text-white transition-colors duration-200">
          <span className="tooltip">Contact</span>
          <svg
            className="menu-icon"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M3 8L10.8906 13.2604C11.5624 13.7083 12.4376 13.7083 13.1094 13.2604L21 8M5 19H19C20.1046 19 21 18.1046 21 17V7C21 5.89543 20.1046 5 19 5H5C3.89543 5 3 5.89543 3 7V17C3 18.1046 3.89543 19 5 19Z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span className="menu-text">Contact</span>
        </Link>
        <div className="mt-auto">
          <div
            className="tooltip-button w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md hover:bg-[var(--primary)] hover:text-white transition-colors duration-200 cursor-pointer"
            onClick={toggleManualMobile}
          >
            <span className="tooltip">{manualMobileToggle ? 'Disable Mobile' : 'Enable Mobile'}</span>
            <svg
              className="menu-icon"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M10.5 1.5H8.25C7.65326 1.5 7.08097 1.73705 6.65901 2.15901C6.23705 2.58097 6 3.15326 6 3.75V20.25C6 20.8467 6.23705 21.419 6.65901 21.841C7.08097 22.2629 7.65326 22.5 8.25 22.5H15.75C16.3467 22.5 16.919 22.2629 17.341 21.841C17.7629 21.419 18 20.8467 18 20.25V3.75C18 3.15326 17.7629 2.58097 17.341 2.15901C16.919 1.73705 16.3467 1.5 15.75 1.5H13.5"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span className="menu-text">{manualMobileToggle ? 'Disable Mobile Mode' : 'Enable Mobile Mode'}</span>
          </div>
          <div
            className="tooltip-button w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md hover:bg-[var(--primary)] hover:text-white transition-colors duration-200 cursor-pointer"
            onClick={toggleTheme}
          >
            <span className="tooltip">{theme === 'light' ? 'Dark Mode' : 'Light Mode'}</span>
            <svg
              className="menu-icon"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {theme === 'light' ? (
                <path
                  d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              ) : (
                <path
                  d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}
            </svg>
            <span className="menu-text">{theme === 'light' ? 'Dark Mode' : 'Light Mode'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Sidebar;
