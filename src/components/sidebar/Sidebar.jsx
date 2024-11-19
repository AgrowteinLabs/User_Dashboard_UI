import React, { useContext, useEffect, useRef } from "react";
import { ThemeContext } from "../../context/ThemeContext";
import { UserContext } from '../../context/UserContext'; // Import UserContext
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
  const { user } = useContext(UserContext); // Fetch user from UserContext
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

  if (!user) {
    return <div>Loading...</div>; // Optional: handle loading state when user is null
  }

  return (
    <>
      {!isSidebarOpen && (
        <button className="sidebar-open-btn" onClick={toggleSidebar}>
          <MdMenu size={35} />
        </button>
      )}
      <nav
        className={`sidebar ${isSidebarOpen ? "sidebar-show" : ""}`}
        ref={navbarRef}
      >
        <div className="sidebar-top">
          <div className="sidebar-brand">
            <img src={theme === LIGHT_THEME ? LogoBlue : LogoWhite} alt="Logo" />
            <span className="sidebar-brand-text">AGROwTRACK</span>
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
                  <span className="menu-link-text">Products & Services</span>
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
                  {/* {user.notifications.some(notification => !notification.read) && (
                    <span className="notification-dot"></span>
                  )} */}
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
