import { Link, NavLink } from "react-router-dom";
import styles from "../styles/header.module.css";
import MobileNav from "./MobileNav";
import { useEffect, useState } from "react";
const Header = () => {
  const [menu, setMenu] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  const toggleMenu = () => {
    setMenu(!menu);
  };

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  useEffect(() => {
    if (menu) {
      document.body.classList.add("active-menu")
    }
    else {
      document.body.classList.remove("active-menu")
    }
  }, [menu])


  return (
    <>
      <header className={styles.header}>
        <Link to="/">
          <h2 className={styles.brand}>QuestPay</h2>
        </Link>

        <nav className={styles.nav}>
          <ul>
            <li>
              <NavLink className="nav-link" to="/">
                Welcome
              </NavLink>
            </li>
            <li>
              <NavLink className="nav-link" to="/airtime">
                Buy Airtime/Data
              </NavLink>
            </li>
            <li>
              <NavLink className="nav-link" to="/exam-pins">
                Exam Pins
              </NavLink>
            </li>
          </ul>

          <div className={styles.btns}>
            <button onClick={toggleMenu} className="menu-btn">
              <span className="material-symbols-outlined">menu</span>
            </button>
          </div>
        </nav>
      </header>

      {menu && <MobileNav toggleMenu={toggleMenu} isDarkMode={isDarkMode} toggleTheme={toggleTheme} />}
    </>
  );
};

export default Header;
