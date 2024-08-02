import { useContext, useEffect, useRef } from "react";
import { ThemeContext } from "../../context/ThemeContext";
import { LIGHT_THEME } from "../../constants/themeConstants";
import LogoBlue from "../../assets/images/Logo_leaf.png"; // Correct relative path
import LogoWhite from "../../assets/images/Logo_leaf.png"; // Correct relative path

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
import { NavLink } from "react-router-dom";
import "./Sidebar.scss";
import { SidebarContext } from "../../context/SidebarContext";

const Sidebar = () => {
  const { theme } = useContext(ThemeContext);
  const { isSidebarOpen, toggleSidebar, closeSidebar } = useContext(SidebarContext);
  const navbarRef = useRef(null);

  const handleClickOutside = (event) => {
    if (
      navbarRef.current &&
      !navbarRef.current.contains(event.target) &&
      event.target.className !== "sidebar-open-btn"
    ) {
      closeSidebar();
    }
  };

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const getNavLinkClassName = ({ isActive }) =>
    isActive ? "menu-link active" : "menu-link";

  return (
    <>
      {!isSidebarOpen && (
        <button className="sidebar-open-btn" onClick={toggleSidebar}>
          <MdMenu size={24} />
        </button>
      )}
      <nav
        className={`sidebar ${isSidebarOpen ? "sidebar-show" : ""}`}
        ref={navbarRef}
      >
        <div className="sidebar-top">
          <div className="sidebar-brand">
            <img src={theme === LIGHT_THEME ? LogoBlue : LogoWhite} alt="Logo" />
            <span className="sidebar-brand-text">AGROWTEIN</span>
          </div>
          <button className="sidebar-close-btn" onClick={closeSidebar}>
            <MdOutlineClose size={24} />
          </button>
        </div>
        <div className="sidebar-body">
          <div className="sidebar-menu">
            <ul className="menu-list">
              <li className="menu-item">
                <NavLink to="/" className={getNavLinkClassName} end>
                  <span className="menu-link-icon">
                    <MdOutlineGridView size={18} />
                  </span>
                  <span className="menu-link-text">Dashboard</span>
                </NavLink>
              </li>
              <li className="menu-item">
                <NavLink to="/products" className={getNavLinkClassName}>
                  <span className="menu-link-icon">
                    <MdOutlineShoppingBag size={20} />
                  </span>
                  <span className="menu-link-text">Products</span>
                </NavLink>
              </li>
              <li className="menu-item">
                <NavLink to="/profile" className={getNavLinkClassName}>
                  <span className="menu-link-icon">
                    <MdOutlinePerson size={20} />
                  </span>
                  <span className="menu-link-text">Profile</span>
                </NavLink>
              </li>
              <li className="menu-item">
                <NavLink to="/notifications" className={getNavLinkClassName}>
                  <span className="menu-link-icon">
                    <MdOutlineNotifications size={18} />
                  </span>
                  <span className="menu-link-text">Notifications</span>
                </NavLink>
              </li>
            </ul>
          </div>

          <div className="sidebar-menu sidebar-menu2">
            <ul className="menu-list">
              <li className="menu-item">
                <NavLink to="/enquiries" className={getNavLinkClassName}>
                  <span className="menu-link-icon">
                    <MdOutlineQuestionAnswer size={20} />
                  </span>
                  <span className="menu-link-text">Enquiries</span>
                </NavLink>
              </li>
              <li className="menu-item">
                <NavLink to="/logout" className={getNavLinkClassName}>
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
