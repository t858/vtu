import { Link, NavLink } from "react-router-dom";
import styles from "../styles/mobilenav.module.css";
import LightThemeToggle from "./LightThemeToggle";
import { useEffect} from "react";
import DarkThemeToggle from "./DarkThemeToggle";
import PropTypes from 'prop-types'

const MobileNav = ({ toggleMenu, isDarkMode, toggleTheme }) => {

  useEffect(() => {
    if (isDarkMode) {
      document.body.classList.add("dark");
    } else {
      document.body.classList.remove("dark");
    }
  }, [isDarkMode, toggleMenu]);



  return (
    <>
      <div className={styles.wrapper}>
        <div className={styles.overlay} onClick={toggleMenu}></div>
        <div className={styles.container}>
          <div className={styles.header}>
            {isDarkMode ? (
              <DarkThemeToggle onClick={toggleTheme} />
            ) : (
              <LightThemeToggle onClick={toggleTheme} />
            )}
            <button onClick={toggleMenu} className="menu-btn">
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
          <ul id="mobile-nav" className={styles.nav}>
            <li>
              <NavLink className="nav-link" to="/">
                Welcome
              </NavLink>
            </li>
            <li>
              <NavLink className="nav-link" to="/airtime">
                Buy Airtime
              </NavLink>
            </li>
            <li>
              <NavLink className="nav-link" to="/exam-pins">
                Exam Pins
              </NavLink>
            </li>
          </ul>
        </div>
      </div>
    </>
  );
};

MobileNav.propTypes = {
    toggleMenu: PropTypes.func.isRequired,
    isDarkMode: PropTypes.bool.isRequired,
    toggleTheme: PropTypes.func.isRequired
}

export default MobileNav;
