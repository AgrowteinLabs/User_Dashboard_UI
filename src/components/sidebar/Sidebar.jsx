import { useContext, useState, useEffect, useRef } from "react";
import { NavLink } from "react-router-dom";
import { ThemeContext } from "../../context/ThemeContext";
import { SidebarContext } from "../../context/SidebarContext";
import { UserContext } from "../../context/UserContext";
import { LIGHT_THEME } from "../../constants/themeConstants";
import LogoBlue from "../../assets/images/Logo_leaf.png";
import LogoWhite from "../../assets/images/Logo_leaf.png";
import { MdOutlineClose, MdOutlineGridView, MdOutlineShoppingBag, MdOutlineLogout, MdOutlineNotifications, MdOutlinePerson, MdOutlineQuestionAnswer, MdMenu } from "react-icons/md";
import "./Sidebar.scss";

const Sidebar = () => {
  const { theme } = useContext(ThemeContext);
  const { user } = useContext(UserContext);
  const { isSidebarOpen, toggleSidebar, closeSidebar } = useContext(SidebarContext);
  const [contextMenu, setContextMenu] = useState(null);
  const navbarRef = useRef(null);

  // Handle right-click to show context menu
  const handleRightClick = (e, page) => {
    e.preventDefault();
    const menuPosition = {
      top: e.clientY,
      left: e.clientX,
    };
    setContextMenu({ page, ...menuPosition });
  };

  // Set the homepage preference
  const handleSetAsHomepage = (page) => {
    localStorage.setItem("homepagePreference", page);
    setContextMenu(null);
    window.location.reload(); // Reload to reflect changes
  };

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
              <li className="menu-item" onContextMenu={(e) => handleRightClick(e, "dashboard")}>
                <NavLink to="/" className={getNavLinkClassName} end onClick={handleNavClick}>
                  <MdOutlineGridView size={20} />
                  <span className="menu-link-text">Dashboard</span>
                </NavLink>
              </li>
              <li className="menu-item" onContextMenu={(e) => handleRightClick(e, "productsOverview")}>
                <NavLink to="/overview" className={getNavLinkClassName} onClick={handleNavClick}>
                  <MdOutlineGridView size={20} />
                  <span className="menu-link-text">Products Overview</span>
                </NavLink>
              </li>
              <li className="menu-item">
                <NavLink to="/products" className={getNavLinkClassName} onClick={handleNavClick}>
                  <MdOutlineShoppingBag size={20} />
                  <span className="menu-link-text">Products</span>
                </NavLink>
              </li>
              <li className="menu-item">
                <NavLink to="/profile" className={getNavLinkClassName} onClick={handleNavClick}>
                  <MdOutlinePerson size={20} />
                  <span className="menu-link-text">Profile</span>
                </NavLink>
              </li>
              <li className="menu-item">
                <NavLink to="/notifications" className={getNavLinkClassName} onClick={handleNavClick}>
                  <MdOutlineNotifications size={20} />
                  <span className="menu-link-text">Notifications</span>
                </NavLink>
              </li>
            </ul>
          </div>

          <div className="sidebar-menu sidebar-menu2">
            <ul className="menu-list">
              <li className="menu-item">
                <NavLink to="/enquiries" className={getNavLinkClassName} onClick={handleNavClick}>
                  <MdOutlineQuestionAnswer size={20} />
                  <span className="menu-link-text">Enquiries</span>
                </NavLink>
              </li>
              <li className="menu-item">
                <NavLink to="/logout" className={getNavLinkClassName} onClick={handleNavClick}>
                  <MdOutlineLogout size={20} />
                  <span className="menu-link-text">Logout</span>
                </NavLink>
              </li>
            </ul>
          </div>
        </div>
      </nav>

      {/* Context Menu */}
      {contextMenu && (
        <div
          className="context-menu"
          style={{
            top: contextMenu.top + "px",
            left: contextMenu.left + "px",
          }}
        >
          <ul>
            <li onClick={() => handleSetAsHomepage(contextMenu.page)}>
              Set as Homepage
            </li>
          </ul>
        </div>
      )}

      {!isSidebarOpen && (
        <button className="sidebar-open-btn" onClick={toggleSidebar}>
          <MdMenu size={32} />
        </button>
      )}
    </>
  );
};

export default Sidebar;
