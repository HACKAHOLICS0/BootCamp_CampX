// src/components/Footer.tsx
import React from "react";
import '../Navbar.css'; // Importons un fichier CSS pour personnaliser davantage le design

export default function Footer() {
  return (
    <footer id="footer" className="footer">
      <div className="container text-center">
        <h3>Start Your Free Trial Now!</h3>
        <form className="mc-trial row">
          <div className="form-group col-md-3 col-md-offset-2 col-sm-4">
            <div className="controls">
              <input name="name" placeholder="Enter Your Name" className="form-control" type="text" />
            </div>
          </div>
          <div className="form-group col-md-3 col-sm-4">
            <div className="controls">
              <input name="EMAIL" placeholder="Enter Your email" className="form-control" type="email" />
            </div>
          </div>
          <div className="col-md-2 col-sm-4">
            <p>
              <button name="submit" type="submit" className="btn btn-block btn-submit">
                Submit <i className="fa fa-arrow-right" />
              </button>
            </p>
          </div>
        </form>
        <ul className="social-links">
          <li><a href="#link"><i className="fa fa-twitter fa-fw" /></a></li>
          <li><a href="#link"><i className="fa fa-facebook fa-fw" /></a></li>
          <li><a href="#link"><i className="fa fa-google-plus fa-fw" /></a></li>
          <li><a href="#link"><i className="fa fa-dribbble fa-fw" /></a></li>
          <li><a href="#link"><i className="fa fa-linkedin fa-fw" /></a></li>
        </ul>
        ©2016 Mentor Theme. All rights reserved
        <div className="credits">
          Designed by <a href="https://bootstrapmade.com/">BootstrapMade.com</a>
        </div>
      </div>
    </footer>
  );
}
