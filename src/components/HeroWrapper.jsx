import { Link } from "react-router-dom";
import heroSvg from "../assets/hero.png";
import { ReactTyped } from "react-typed";
import style from '../styles/hero.module.css'

const HeroWrapper = () => {
  return (
    <>
      <main>
        <div className={style.container}>
          <div className={style.left}>
            <div className={style.content}>
              <p>Bill payment got easier</p>
              <h1>
                We <span className={style.mark}>offer</span>{" "} <br />
                <ReactTyped
                  strings={[
                    "cheap airtime.",
                    "WAEC Pins.",
                    "NECO Tokens.",
                    "Data plans"
                  ]}
                  typeSpeed={100}
                  backSpeed={50}
                  loop
                />
              </h1>
              <p>
                Discover the convenience of <span className="mark">QuestPay</span> today! Purchase your Airtime and Exam scratch cards instantly with our secure guest checkout.
              </p>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <Link to="/airtime">
                  <button className={style.btn}>
                    Buy Airtime <i className="fa-solid fa-phone fa-beat"></i>
                  </button>
                </Link>
                <Link to="/exam-pins">
                  <button className={style.btn} style={{ background: 'transparent', border: '1px solid var(--primary)', color: 'var(--text)' }}>
                    Exam Pins <i className="fa-solid fa-graduation-cap"></i>
                  </button>
                </Link>
              </div>
            </div>
          </div>
          <div className={style.right}>
            <div className={style.img}>
              <img src={heroSvg} alt="Hero illustration" />
            </div>
          </div>
        </div>
      </main>
    </>
  );
};

export default HeroWrapper;
