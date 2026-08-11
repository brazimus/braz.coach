/**
* braz.coach -- click-to-reveal section nav.
* Nav links act as disclosure buttons: clicking one shows that section and
* hides the others (one open at a time), updates aria-expanded on the
* trigger, and keeps the URL hash in sync for deep-linking. Defaults to the
* About section open on load unless a different section is hash-linked.
* The nav sits right below the hero and pins to the top of the viewport on
* scroll (CSS `position: sticky` -- no JS needed for the sticking itself).
* Two separate "Braz Brandt" brand-home links exist (hero headline + the
* ~/braz.coach prompt in the sticky nav) and both reset to the top on click.
*
* The sticky nav's prompt (~/braz.coach $ <command>) mirrors whichever
* section is open. On a section change, the command erases and retypes to
* match -- the section itself opens immediately, the typing animation runs
* alongside it rather than gating it, so switching sections never waits on
* the animation. Collapsing everything (toggling the active section closed,
* or clicking home) freezes the prompt on whatever command was last shown
* rather than resetting it.
*
* A one-time-per-session scroll-cue chevron nudges first-time, cold
* (no deep link) visitors toward scrolling past the hero; it cancels on
* the first scroll or click and won't reappear until a new session.
*
* If JS never runs, style.css's `noscript` rule forces every section visible.
*/
(function () {
  "use strict";

  var DEFAULT_SECTION = "about";
  var COMMANDS = {
    about: "whoami",
    experience: "cat experience.log",
    credentials: "jq . credentials.json",
    contact: "chmod +x contact.sh"
  };

  var navLinks = [].slice.call(document.querySelectorAll("nav.sticky-nav a[data-target]"));
  var sections = [].slice.call(document.querySelectorAll("main section[data-panel]"));
  var brands = [].slice.call(document.querySelectorAll(".brand-home"));
  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

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

  // Base +/- jitter per keystroke, so the sticky prompt's typing animation
  // doesn't look like a uniform paste. Never below 20ms.
  function keyDelay(base, jitter) {
    var min = Math.max(20, base - jitter);
    var max = base + jitter;
    return min + Math.random() * (max - min);
  }

  function eraseText(el, stillCurrent, done) {
    (function step() {
      if (!stillCurrent()) return;
      var text = el.textContent;
      if (text.length > 0) {
        el.textContent = text.slice(0, -1);
        setTimeout(step, keyDelay(70, 30));
      } else if (done) {
        done();
      }
    })();
  }

  function typeText(el, text, stillCurrent, done) {
    var i = 0;
    (function step() {
      if (!stillCurrent()) return;
      el.textContent = text.slice(0, i);
      var justTyped = i > 0 ? text.charAt(i - 1) : "";
      i++;
      if (i <= text.length) {
        var delay = keyDelay(110, 55);
        if (justTyped === " " || justTyped === ".") delay += 150; // brief pause after words/punctuation
        setTimeout(step, delay);
      } else if (done) {
        done();
      }
    })();
  }

  // Erase+retype the sticky prompt's command to match `id`. A generation
  // counter cancels a stale in-flight animation if the section changes
  // again before it finishes, so rapid clicking can't interleave two
  // animations into garbled text.
  var cmdGen = 0;
  function updateStickyCmd(id, animate) {
    var cmdEl = document.querySelector(".sticky-cmd");
    var command = COMMANDS[id];
    if (!cmdEl || !command) return;
    cmdGen++;
    var myGen = cmdGen;
    function stillCurrent() { return myGen === cmdGen; }
    if (!animate || reduceMotion) {
      cmdEl.textContent = command;
      return;
    }
    setTimeout(function () {
      if (!stillCurrent()) return;
      eraseText(cmdEl, stillCurrent, function () {
        setTimeout(function () {
          if (!stillCurrent()) return;
          typeText(cmdEl, command, stillCurrent, function () {});
        }, 350);
      });
    }, 150);
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
        updateStickyCmd(id, true);
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
  updateStickyCmd(initialSection, false);

  /**
   * One-time-per-session scroll-cue chevron. About is already open by
   * default, but on most screens it's below the fold behind the hero -- a
   * visitor who never scrolls never sees it. On a first-time, cold (no deep
   * link) visit, the chevron at the bottom of the hero lights up
   * immediately; any scroll or click hides it and marks the session seen
   * (sessionStorage), so it won't reappear until a new session.
   */
  var SEEN_KEY = "braz-coach-intro-seen";
  function introSeen() {
    try { return sessionStorage.getItem(SEEN_KEY) === "1"; } catch (e) { return false; }
  }
  function markIntroSeen() {
    try { sessionStorage.setItem(SEEN_KEY, "1"); } catch (e) {}
  }

  if (!initialHash && initialSection === DEFAULT_SECTION && !introSeen()) {
    var chevron = document.querySelector(".scroll-cue");
    if (chevron) chevron.classList.add("is-visible");

    function hideChevron() {
      if (chevron) chevron.classList.remove("is-visible");
    }
    function cancelIntro() {
      hideChevron();
      markIntroSeen();
    }
    window.addEventListener("scroll", cancelIntro, { passive: true, once: true });
    window.addEventListener("click", cancelIntro, { once: true });
  }
})();
