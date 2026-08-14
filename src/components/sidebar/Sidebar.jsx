import { useContext, useEffect, useRef, useState } from "react";
import { ThemeContext } from "../../context/ThemeContext";
import { UserContext } from "../../context/UserContext";
import { SidebarContext } from "../../context/SidebarContext";
import { LIGHT_THEME } from "../../constants/themeConstants";
import { NavLink } from "react-router-dom";
import {
  MdOutlineClose,
  MdOutlineNotifications,
  MdMenu,
  MdHome,
  MdDashboard,
  MdWidgets,
  MdCategory,
  MdAccountCircle,
  MdExitToApp,
  MdForum,
  MdGetApp,
} from "react-icons/md";
import { MdSmartToy } from "react-icons/md";
import LogoBlue from "../../assets/images/Logo_leaf.png";
import LogoWhite from "../../assets/images/Logo_leaf.png";
import "./Sidebar.scss";

const Sidebar = () => {
  const { theme } = useContext(ThemeContext);
  const { user } = useContext(UserContext);
  const { isSidebarOpen, toggleSidebar, closeSidebar } =
    useContext(SidebarContext);
  const navbarRef = useRef(null);

  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [canInstall, setCanInstall] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setCanInstall(true);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  useEffect(() => {
    const isStandalone = window.matchMedia(
      "(display-mode: standalone)"
    ).matches;
    if (isStandalone) setCanInstall(false);
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      console.log("Install outcome:", outcome);
      setDeferredPrompt(null);
      setCanInstall(false);
    } else {
      alert("Install prompt is not available.");
    }
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
    if (window.innerWidth <= 768) closeSidebar();
  };

  const getNavLinkClassName = ({ isActive }) =>
    `menu-link ${isActive ? "active" : ""}`;

  if (!user) return <div className="loading-spinner">Loading...</div>;

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
            <img
              src={theme === LIGHT_THEME ? LogoBlue : LogoWhite}
              alt="AGROWTRACK"
              className="sidebar-logo"
            />
            <span className="sidebar-brand-text">AGROWTRACK</span>
          </div>
          <button className="sidebar-close-btn" onClick={closeSidebar}>
            <MdOutlineClose size={20} />
          </button>
        </div>

        <div className="sidebar-body">
          <div className="sidebar-menu">
            <ul className="menu-list">
              <li className="menu-item">
                <NavLink
                  to="/"
                  className={getNavLinkClassName}
                  end
                  onClick={handleNavClick}
                >
                  <span className="menu-link-icon">
                    <MdHome size={20} />
                  </span>
                  <span className="menu-link-text">Home</span>
                </NavLink>
              </li>
              <li className="menu-item">
                <NavLink
                  to="/dashboard"
                  className={getNavLinkClassName}
                  end
                  onClick={handleNavClick}
                >
                  <span className="menu-link-icon">
                    <MdDashboard size={20} />
                  </span>
                  <span className="menu-link-text">Dashboard</span>
                </NavLink>
              </li>
              <li className="menu-item">
                <NavLink
                  to="/productsOverview"
                  className={getNavLinkClassName}
                  onClick={handleNavClick}
                >
                  <span className="menu-link-icon">
                    <MdWidgets size={20} />
                  </span>
                  <span className="menu-link-text">Products Overview</span>
                </NavLink>
              </li>
              <li className="menu-item">
                <NavLink
                  to="/products"
                  className={getNavLinkClassName}
                  onClick={handleNavClick}
                >
                  <span className="menu-link-icon">
                    <MdCategory size={20} />
                  </span>
                  <span className="menu-link-text">Products</span>
                </NavLink>
              </li>
              <li className="menu-item">
                <NavLink
                  to="/profile"
                  className={getNavLinkClassName}
                  onClick={handleNavClick}
                >
                  <span className="menu-link-icon">
                    <MdAccountCircle size={20} />
                  </span>
                  <span className="menu-link-text">Profile</span>
                </NavLink>
              </li>
              <li className="menu-item">
                <NavLink
                  to="/notifications"
                  className={getNavLinkClassName}
                  onClick={handleNavClick}
                >
                  <span className="menu-link-icon">
                    <MdOutlineNotifications size={20} />
                  </span>
                  <span className="menu-link-text">Notifications</span>
                </NavLink>
              </li>
              <li className="menu-item">
                <NavLink
                  to="/ai-assistant"
                  className={getNavLinkClassName}
                  onClick={handleNavClick}
                >
                  <span className="menu-link-icon">
                    <MdSmartToy size={20} />
                  </span>
                  <span className="menu-link-text">Grobo – AI Assistant</span>
                </NavLink>
              </li>
            </ul>
          </div>

          <div className="sidebar-menu sidebar-menu2">
            <ul className="menu-list">
              <li className="menu-item">
                <NavLink
                  to="/enquiries"
                  className={getNavLinkClassName}
                  onClick={handleNavClick}
                >
                  <span className="menu-link-icon">
                    <MdForum size={20} />
                  </span>
                  <span className="menu-link-text">Enquiries</span>
                </NavLink>
              </li>
              {canInstall && (
                <li className="menu-item">
                  <button className="menu-link" onClick={handleInstallClick}>
                    <span className="menu-link-icon">
                      <MdGetApp size={20} />
                    </span>
                    <span className="menu-link-text">Install App</span>
                  </button>
                </li>
              )}
              <li className="menu-item">
                <NavLink
                  to="/logout"
                  className={getNavLinkClassName}
                  onClick={handleNavClick}
                >
                  <span className="menu-link-icon">
                    <MdExitToApp size={20} />
                  </span>
                  <span className="menu-link-text">Logout</span>
                </NavLink>
              </li>
            </ul>

            {/* Premium user card widget */}
            <div className="sidebar-user-profile">
              <div className="user-avatar">
                {(user.name || user.email || "U")[0].toUpperCase()}
              </div>
              <div className="user-profile-info">
                <div className="profile-name">{user.name || user.email?.split("@")[0] || "User"}</div>
                <div className="profile-email">{user.email || ""}</div>
              </div>
            </div>
          </div>
        </div>
      </nav>
    </>
  );
};

export default Sidebar;
