import { useContext, useEffect, useRef } from "react";
import { ThemeContext } from "../../context/ThemeContext";
import { UserContext } from "../../context/UserContext";
import { SidebarContext } from "../../context/SidebarContext";
import { LIGHT_THEME } from "../../constants/themeConstants";
import { NavLink } from "react-router-dom";

import {
  MdOutlineClose,
  MdOutlineGridView,
  MdOutlineLogout,
  MdOutlineNotifications,
  MdOutlinePerson,
  MdOutlineQuestionAnswer,
  MdOutlineShoppingBag,
  MdMenu,
} from "react-icons/md";

import LogoBlue from "../../assets/images/Logo_leaf.png";
import LogoWhite from "../../assets/images/Logo_leaf.png";
import "./Sidebar.scss";

const Sidebar = () => {
  const { theme } = useContext(ThemeContext);
  const { user } = useContext(UserContext);
  const { isSidebarOpen, toggleSidebar, closeSidebar } = useContext(SidebarContext);
  const navbarRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        navbarRef.current &&
        !navbarRef.current.contains(event.target) &&
        !event.target.closest(".sidebar-open-btn")
      ) {
        closeSidebar();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [closeSidebar]);

  const handleNavClick = () => {
    if (window.innerWidth <= 768) {
      closeSidebar();
    }
  };

  const getNavLinkClassName = ({ isActive }) => `menu-link ${isActive ? "active" : ""}`;

  if (!user) return <div className="loading-spinner">Loading...</div>;

  return (
    <>
      {!isSidebarOpen && (
        <button className="sidebar-open-btn" onClick={toggleSidebar}>
          <MdMenu size={32} />
        </button>
      )}

      <nav className={`sidebar ${isSidebarOpen ? "sidebar-show" : ""}`} ref={navbarRef}>
        <div className="sidebar-top">
          <div className="sidebar-brand">
            <img
              src={theme === LIGHT_THEME ? LogoBlue : LogoWhite}
              alt="AGROWTRACK"
              className="sidebar-logo"
            />
            <span className="sidebar-brand-text">AGROWTRACK</span>
          </div>
          <button className="sidebar-close-btn" onClick={closeSidebar}>
            <MdOutlineClose size={22} />
          </button>
        </div>

        <div className="sidebar-body">
          <div className="sidebar-menu">
            <ul className="menu-list">
              <li className="menu-item">
                <NavLink to="/" className={getNavLinkClassName} end onClick={handleNavClick}>
                  <span className="menu-link-icon">
                    <MdOutlineGridView size={20} />
                  </span>
                  <span className="menu-link-text">Dashboard</span>
                </NavLink>
              </li>
              <li className="menu-item">
                <NavLink to="/products" className={getNavLinkClassName} onClick={handleNavClick}>
                  <span className="menu-link-icon">
                    <MdOutlineShoppingBag size={20} />
                  </span>
                  <span className="menu-link-text">Products</span>
                </NavLink>
              </li>
              <li className="menu-item">
                <NavLink to="/profile" className={getNavLinkClassName} onClick={handleNavClick}>
                  <span className="menu-link-icon">
                    <MdOutlinePerson size={20} />
                  </span>
                  <span className="menu-link-text">Profile</span>
                </NavLink>
              </li>
              <li className="menu-item">
                <NavLink to="/notifications" className={getNavLinkClassName} onClick={handleNavClick}>
                  <span className="menu-link-icon">
                    <MdOutlineNotifications size={20} />
                  </span>
                  <span className="menu-link-text">Notifications</span>
                </NavLink>
              </li>
            </ul>
          </div>

          <div className="sidebar-menu sidebar-menu2">
            <ul className="menu-list">
              <li className="menu-item">
                <NavLink to="/enquiries" className={getNavLinkClassName} onClick={handleNavClick}>
                  <span className="menu-link-icon">
                    <MdOutlineQuestionAnswer size={20} />
                  </span>
                  <span className="menu-link-text">Enquiries</span>
                </NavLink>
              </li>
              <li className="menu-item">
                <NavLink to="/logout" className={getNavLinkClassName} onClick={handleNavClick}>
                  <span className="menu-link-icon">
                    <MdOutlineLogout size={20} />
                  </span>
                  <span className="menu-link-text">Logout</span>
                </NavLink>
              </li>
            </ul>
          </div>
        </div>
      </nav>
    </>
  );
};

export default Sidebar;
