"use strict";

const siteHeader = document.querySelector("#siteHeader");
const menuToggle = document.querySelector("#menuToggle");
const mainNav = document.querySelector("#mainNav");
const navLinks = [...document.querySelectorAll(".nav-link")];
const movieSearch = document.querySelector("#movieSearch");
const movieCarousel = document.querySelector("#movieCarousel");
const movieCards = [...document.querySelectorAll(".movie-card")];
const categoryCards = [...document.querySelectorAll(".category-card")];
const searchStatus = document.querySelector("#searchStatus");
const clearFilters = document.querySelector("#clearFilters");
const emptyState = document.querySelector("#emptyState");
const movieModal = document.querySelector("#movieModal");
const modalClose = document.querySelector("#modalClose");
const toast = document.querySelector("#toast");

let activeCategory = "";
let toastTimer;

const platform = navigator.userAgentData?.platform || navigator.platform;
document.querySelector(".search-wrap kbd").textContent =
  /mac|iphone|ipad/i.test(platform) ? "⌘ K" : "Ctrl K";

// Remove the opening screen once all visual assets have had a moment to settle.
window.addEventListener("load", () => {
  window.setTimeout(() => {
    document.querySelector(".page-loader").classList.add("loaded");
  }, 450);
});

// Compact the navigation after the hero begins to leave the viewport.
const updateHeader = () => {
  siteHeader.classList.toggle("scrolled", window.scrollY > 30);
};

window.addEventListener("scroll", updateHeader, { passive: true });
updateHeader();

// Mobile navigation.
const closeMenu = () => {
  menuToggle.classList.remove("active");
  mainNav.classList.remove("open");
  menuToggle.setAttribute("aria-expanded", "false");
  menuToggle.setAttribute("aria-label", "Open navigation");
  document.body.classList.remove("nav-open");
};

menuToggle.addEventListener("click", () => {
  const isOpen = mainNav.classList.toggle("open");
  menuToggle.classList.toggle("active", isOpen);
  menuToggle.setAttribute("aria-expanded", String(isOpen));
  menuToggle.setAttribute("aria-label", isOpen ? "Close navigation" : "Open navigation");
  document.body.classList.toggle("nav-open", isOpen);
});

navLinks.forEach((link) => {
  link.addEventListener("click", closeMenu);
});

document.addEventListener("click", (event) => {
  if (
    mainNav.classList.contains("open") &&
    !mainNav.contains(event.target) &&
    !menuToggle.contains(event.target)
  ) {
    closeMenu();
  }
});

// Keep the current section highlighted, including short sections between viewports.
const observedSections = [...document.querySelectorAll("main section[id]")];
const updateActiveNavigation = () => {
  const viewportMarker = window.scrollY + window.innerHeight * 0.18;
  let activeSection = observedSections[0].id;

  observedSections.forEach((section) => {
    if (section.offsetTop <= viewportMarker) activeSection = section.id;
  });

  const isAtPageEnd =
    window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 4;
  if (isAtPageEnd) activeSection = observedSections.at(-1).id;

  navLinks.forEach((link) => {
    const linkTarget = link.getAttribute("href").slice(1);
    link.classList.toggle("active", linkTarget === activeSection);
  });
};

window.addEventListener("scroll", updateActiveNavigation, { passive: true });
window.addEventListener("resize", updateActiveNavigation);
updateActiveNavigation();

// Reveal sections only when they approach the viewport.
const revealObserver = new IntersectionObserver(
  (entries, observer) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("visible");
      observer.unobserve(entry.target);
    });
  },
  { threshold: 0.12 }
);

document.querySelectorAll(".reveal").forEach((element, index) => {
  element.style.transitionDelay = `${Math.min(index % 5, 4) * 70}ms`;
  revealObserver.observe(element);
});

// Search and category filtering share one predictable filtering pass.
const filterMovies = () => {
  const query = movieSearch.value.trim().toLowerCase();
  let visibleCount = 0;

  movieCards.forEach((card) => {
    const searchableText = `${card.dataset.title} ${card.dataset.genre}`.toLowerCase();
    const matchesSearch = searchableText.includes(query);
    const matchesCategory = !activeCategory ||
      card.dataset.genre.toLowerCase().includes(activeCategory.toLowerCase());
    const shouldShow = matchesSearch && matchesCategory;

    card.hidden = !shouldShow;
    visibleCount += Number(shouldShow);
  });

  const filterParts = [];
  if (query) filterParts.push(`matching "${movieSearch.value.trim()}"`);
  if (activeCategory) filterParts.push(`in ${activeCategory}`);

  searchStatus.textContent = filterParts.length
    ? `${visibleCount} ${visibleCount === 1 ? "movie" : "movies"} ${filterParts.join(" ")}`
    : "Showing all movies";

  clearFilters.hidden = !query && !activeCategory;
  emptyState.hidden = visibleCount > 0;
  movieCarousel.hidden = visibleCount === 0;
  document.querySelector(".carousel-actions").hidden = visibleCount === 0;
};

movieSearch.addEventListener("input", filterMovies);

categoryCards.forEach((card) => {
  card.addEventListener("click", () => {
    activeCategory = card.dataset.category;
    filterMovies();
    document.querySelector("#movies").scrollIntoView({ behavior: "smooth" });
  });
});

clearFilters.addEventListener("click", () => {
  activeCategory = "";
  movieSearch.value = "";
  filterMovies();
  movieSearch.focus();
});

document.querySelector(".header-search-button").addEventListener("click", () => {
  document.querySelector("#discover").scrollIntoView({ behavior: "smooth" });
  window.setTimeout(() => movieSearch.focus(), 600);
});

// Support the familiar search shortcut on both macOS and Windows.
document.addEventListener("keydown", (event) => {
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
    event.preventDefault();
    document.querySelector("#discover").scrollIntoView({ behavior: "smooth" });
    window.setTimeout(() => movieSearch.focus(), 450);
  }

  if (event.key === "Escape" && mainNav.classList.contains("open")) {
    closeMenu();
  }
});

// Carousel controls move by roughly one viewport of cards.
const scrollMovieCarousel = (direction) => {
  const distance = Math.max(movieCarousel.clientWidth * 0.78, 280);
  movieCarousel.scrollBy({ left: distance * direction, behavior: "smooth" });
};

document.querySelector("#previousMovies").addEventListener("click", () => scrollMovieCarousel(-1));
document.querySelector("#nextMovies").addEventListener("click", () => scrollMovieCarousel(1));

// Populate one reusable details dialog from each movie button.
const openMovieModal = (button) => {
  const { title, genre, rating, image } = button.dataset;
  const modalImage = document.querySelector("#modalImage");

  document.querySelector("#modalTitle").textContent = title;
  document.querySelector("#modalGenre").textContent = genre;
  document.querySelector("#modalRating").textContent = rating;
  modalImage.style.backgroundImage =
    `linear-gradient(0deg, rgba(17, 18, 23, 0.28), transparent), url("${image}")`;
  modalImage.setAttribute("aria-label", `${title} preview artwork`);

  movieModal.showModal();
  document.body.classList.add("modal-open");
};

document.querySelectorAll(".watch-button").forEach((button) => {
  button.addEventListener("click", () => openMovieModal(button));
});

const closeMovieModal = () => {
  movieModal.close();
  document.body.classList.remove("modal-open");
};

modalClose.addEventListener("click", closeMovieModal);

movieModal.addEventListener("click", (event) => {
  if (event.target === movieModal) closeMovieModal();
});

movieModal.addEventListener("close", () => {
  document.body.classList.remove("modal-open");
});

document.querySelector(".modal-play").addEventListener("click", () => {
  closeMovieModal();
  showToast("Playback demo started");
});

// Lightweight feedback for non-streaming demo actions.
function showToast(message) {
  window.clearTimeout(toastTimer);
  toast.textContent = message;
  toast.classList.add("show");
  toastTimer = window.setTimeout(() => toast.classList.remove("show"), 2600);
}

document.querySelector(".list-button").addEventListener("click", (event) => {
  const button = event.currentTarget;
  const isAdded = button.classList.toggle("added");
  button.lastChild.textContent = isAdded ? " Added" : " My List";
  showToast(isAdded ? "Added to My List" : "Removed from My List");
});

document.querySelector("#emailForm").addEventListener("submit", (event) => {
  event.preventDefault();
  const email = document.querySelector("#emailAddress");
  document.querySelector("#formMessage").textContent =
    `You're on the list. We'll reach you at ${email.value}.`;
  email.value = "";
});

// Convert broken remote artwork into a subtle local-looking placeholder.
document.querySelectorAll("img").forEach((image) => {
  image.addEventListener("error", () => {
    image.removeAttribute("src");
    image.style.background = "linear-gradient(145deg, #2a2b33, #111218)";
    image.alt = "Artwork unavailable";
  });
});
