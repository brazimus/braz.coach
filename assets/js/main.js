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

  /**
   * One-time hero intro affordances. Experience is already open by default,
   * but on most screens it's below the fold behind the hero -- a visitor
   * who never scrolls never sees it. On a first-time, cold (no deep link)
   * visit: a small scroll-cue chevron appears immediately at the bottom of
   * the hero (a plain #experience anchor -- native CSS scroll-behavior and
   * scroll-margin-top do the work, no JS needed for the scroll itself), and
   * if nothing's been scrolled or clicked after 30s, the terminal prompt
   * "types" from whoami to cat experience.log (matching the section's own
   * experience.log label) and scrolls Experience into view as a fallback.
   * Any scroll or click cancels/hides both immediately. Runs at most once
   * ever per browser (localStorage) -- after that the pattern is established.
   */
  var INTRO_DELAY_MS = 30000;
  var INTRO_KEY = "braz-coach-intro-seen";
  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function introSeen() {
    try { return localStorage.getItem(INTRO_KEY) === "1"; } catch (e) { return false; }
  }
  function markIntroSeen() {
    try { localStorage.setItem(INTRO_KEY, "1"); } catch (e) {}
  }

  if (!initialHash && initialSection === DEFAULT_SECTION && !introSeen()) {
    var cmdEl = document.querySelector(".prompt .cmd");
    var chevron = document.querySelector(".scroll-cue");
    var introTimer = null;

    if (chevron) chevron.classList.add("is-visible");

    function hideChevron() {
      if (chevron) chevron.classList.remove("is-visible");
    }

    function cancelIntro() {
      if (introTimer) { clearTimeout(introTimer); introTimer = null; }
      hideChevron();
      markIntroSeen();
    }

    function eraseText(el, speed, done) {
      (function step() {
        var text = el.textContent;
        if (text.length > 0) {
          el.textContent = text.slice(0, -1);
          setTimeout(step, speed);
        } else if (done) {
          done();
        }
      })();
    }

    function typeText(el, text, speed, done) {
      var i = 0;
      (function step() {
        el.textContent = text.slice(0, i);
        i++;
        if (i <= text.length) {
          setTimeout(step, speed);
        } else if (done) {
          done();
        }
      })();
    }

    function runIntro() {
      markIntroSeen();
      hideChevron();
      var target = document.getElementById("experience");
      if (!cmdEl || !target) return;
      if (reduceMotion) {
        cmdEl.textContent = "cat experience.log";
        target.scrollIntoView({ behavior: "auto", block: "start" });
        return;
      }
      eraseText(cmdEl, 55, function () {
        typeText(cmdEl, "cat experience.log", 55, function () {
          setTimeout(function () {
            target.scrollIntoView({ behavior: "smooth", block: "start" });
          }, 400);
        });
      });
    }

    window.addEventListener("scroll", cancelIntro, { passive: true, once: true });
    window.addEventListener("click", cancelIntro, { once: true });
    introTimer = setTimeout(runIntro, INTRO_DELAY_MS);
  }
})();
