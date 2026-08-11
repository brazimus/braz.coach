/**
* braz.coach -- click-to-reveal section nav.
* Nav links act as disclosure buttons: clicking one shows that section and
* hides the others (one open at a time), updates aria-expanded on the
* trigger, and keeps the URL hash in sync for deep-linking. Defaults to the
* Experience section open on load unless a different section is hash-linked.
* The nav sits right below the hero and pins to the top of the viewport on
* scroll (CSS `position: sticky` -- no JS needed for the sticking itself).
* Two separate "Braz Brandt" brand-home links exist (hero headline + nav
* bar) and both reset to the top on click.
* If JS never runs, style.css's `noscript` rule forces every section visible.
*/
(function () {
  "use strict";

  var DEFAULT_SECTION = "experience";

  var navLinks = [].slice.call(document.querySelectorAll("nav.sticky-nav a[data-target]"));
  var sections = [].slice.call(document.querySelectorAll("main section[data-panel]"));
  var brands = [].slice.call(document.querySelectorAll(".brand-home"));

  function showPanel(id, scroll) {
    sections.forEach(function (s) {
      s.classList.toggle("is-open", s.id === id);
    });
    navLinks.forEach(function (a) {
      var isActive = a.getAttribute("data-target") === id;
      a.classList.toggle("is-active", isActive);
      a.setAttribute("aria-expanded", isActive ? "true" : "false");
    });
    document.body.classList.add("panel-open");
    if (scroll) {
      var target = document.getElementById(id);
      if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  function hideAll() {
    sections.forEach(function (s) { s.classList.remove("is-open"); });
    navLinks.forEach(function (a) {
      a.classList.remove("is-active");
      a.setAttribute("aria-expanded", "false");
    });
    document.body.classList.remove("panel-open");
  }

  navLinks.forEach(function (a) {
    a.addEventListener("click", function (e) {
      e.preventDefault();
      var id = a.getAttribute("data-target");
      if (a.classList.contains("is-active")) {
        hideAll();
        history.replaceState(null, "", location.pathname + location.search);
      } else {
        showPanel(id, true);
        history.replaceState(null, "", "#" + id);
      }
    });
  });

  brands.forEach(function (brand) {
    brand.addEventListener("click", function (e) {
      e.preventDefault();
      hideAll();
      window.scrollTo({ top: 0, behavior: "smooth" });
      history.replaceState(null, "", location.pathname + location.search);
    });
  });

  var initialHash = window.location.hash.replace("#", "");
  var initialSection = (initialHash && document.getElementById(initialHash)) ? initialHash : DEFAULT_SECTION;
  showPanel(initialSection, false);
})();
