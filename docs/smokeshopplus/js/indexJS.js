/* =========================================
   GLOBAL CONSTANTS
========================================= */

 const API_KEY = "AIzaSyBzIJwWoGc5PSIjflhkmV4dzi8ZvIkUkec";
  
  const PLACE_ID = "ChIJ54IVvUbfRYgRDOkYFnkYTyY";

/* =========================================
   GLOBAL INIT
========================================= */

document.addEventListener("DOMContentLoaded", initApp);

function initApp(){

  initAgeGate();
  initMobileMenu();
  initPillVisibility();
  initFindUsForm();
  setPageField();
  initActiveNav();
  initPageHighlight();
  initReviews();

}

/* =========================================
   AGE GATE
========================================= */

function initAgeGate()
{
  const gate = document.getElementById("ageGate");
  if(!gate) return;

  const verified = sessionStorage.getItem("ageVerified");

  // Already verified this session
  if(verified)
  {
    gate.style.display = "none";
    document.body.classList.remove("ageLocked");
    return;
  }

  document.body.classList.add("ageLocked");

  document.querySelector(".ageYes")?.addEventListener("click", () =>
  {
    sessionStorage.setItem("ageVerified", "true");

    const loader = document.querySelector(".ageGateLoading");

    loader.style.display = "block";

    setTimeout(()=>{
        gate.style.display = "none";
    }, 850);

    document.body.classList.remove("ageLocked");  // ✅ this is the right unlock
  });

  document.querySelector(".ageNo")?.addEventListener("click", () =>
  {
    window.location.href = "https://www.google.com";
  });
}


/* =========================================
   MOBILE MENU (SCROLL LOCK SAFE)
========================================= */

function initMobileMenu()
{

  const hamburger = document.querySelector(".hamburgerBTN");
  
  const mobileMenu = document.getElementById("mobileMenu");

  if(!hamburger || !mobileMenu) return;

  hamburger.addEventListener("click", () => 
  {
  
    hamburger.classList.toggle("active");
  
    mobileMenu.classList.toggle("active");
  
    document.body.classList.toggle("menu-open");

    syncActiveNavToScroll(); // 🔥 THIS IS THE FIX

  });

  mobileMenu.querySelectorAll("a").forEach(link => 
  {

    link.addEventListener("click", () => 
    {

      hamburger.classList.remove("active");
      
      mobileMenu.classList.remove("active");
      
      document.body.classList.remove("menu-open");

    });

  });

}

/* =========================================
   PILL VISIBILITY (PERF SAFE)
========================================= */

function initPillVisibility()
{

  const storeSection = document.getElementById("storeHero");
  
  if(!storeSection) return;

  let storeBottom = calculateStoreBottom();

  function calculateStoreBottom()
  {
    return storeSection.offsetTop + storeSection.offsetHeight;
  }

  function checkPosition()
  {

    if(window.scrollY >= storeBottom - 200)
    {
      document.body.classList.add("pillsHidden");
    }
    else
    {
      document.body.classList.remove("pillsHidden");
    }

  }

  window.addEventListener("scroll", checkPosition, { passive:true });

  window.addEventListener("resize", () => 
  {
    storeBottom = calculateStoreBottom();
    
    checkPosition();
  });

  checkPosition();

}

/* =========================================
   FIND US AUTO SUBMIT
========================================= */

function initFindUsForm()
{

  const form = document.querySelector(".findUsForm");

  if(!form) return;

  form.querySelectorAll("input[type='radio']").forEach(radio => 
  {

    radio.addEventListener("change", () => 
    {

      setTimeout(() => form.submit(), 400);

    });

  });

}

/* =========================================
   PAGE ATTRIBUTION
========================================= */

function setPageField()
{

  const pageField = document.getElementById("pageField");
  
  if(!pageField) return;

  pageField.value = window.location.href;

}

/* =========================================
   ACTIVE NAV — INTERSECTION OBSERVER
========================================= */

function initActiveNav()
{

  const sections = document.querySelectorAll("section[id]");
  
  if(!sections.length) return;

  const navLinks = document.querySelectorAll
  (
    ".navLinks a, .mobileMenuInner a"
  );

  const observer = new IntersectionObserver((entries)=>
    {

    entries.forEach(entry=>
    {

      if(!entry.isIntersecting) return;

      navLinks.forEach(link=>{

        const href = link.getAttribute("href");
        if(!href?.startsWith("#")) return;

        link.classList.toggle(
          "active",
          href === "#" + entry.target.id
        );

      });

    });

  },{
    rootMargin:"-40% 0px -55% 0px",
    threshold:0.1
  });

  sections.forEach(section=>observer.observe(section));

}

function syncActiveNavToScroll()
{
  const sections = document.querySelectorAll("section[id]");
  const navLinks = document.querySelectorAll(".navLinks a, .mobileMenuInner a");

  let current = "";

  sections.forEach(section =>
  {
    const top = section.offsetTop - 140;
    const bottom = top + section.offsetHeight;

    if (window.scrollY >= top && window.scrollY < bottom)
    {
      current = section.id;
    }
  });

  navLinks.forEach(link =>
  {
    const href = link.getAttribute("href");
    link.classList.toggle("active", href === `#${current}`);
  });
}


/* =========================================
   ACTIVE NAV — PAGE MATCH
========================================= */

function initPageHighlight()
{

  const currentPage =
    
  location.pathname.split("/").pop() || "index.html";

  document.querySelectorAll(
    ".navLinks a, .mobileMenuInner a"
  )
  
  .forEach(link=>
  {

    const href = link.getAttribute("href");
    
    if(!href || href.startsWith("#")) return;

    if
    (
      
      href === currentPage ||
      
      (currentPage === "" && href === "index.html")

    )
    
    {
      link.classList.add("active");
    }

  });

}

/* =========================================
   GOOGLE REVIEWS
========================================= */

async function initReviews()
{

  const grid = document.getElementById("reviewsGrid");
  
  if(!grid) return;

  if(typeof API_KEY === "undefined") return;

  const score = document.getElementById("reviewScore");
  
  const ratingSub = document.querySelector(".ratingSub");
  
  const starsContainer = document.getElementById("ratingStars");

  const url =
  `https://places.googleapis.com/v1/places/${PLACE_ID}?fields=rating,userRatingCount,reviews&key=${API_KEY}`;

  try
  {

    const res = await fetch(url);
    
    if(!res.ok) return;

    const data = await res.json();

    if(score && data.rating)
    {
      score.textContent = data.rating.toFixed(1);
    }

    if(ratingSub && data.userRatingCount)
    {
      ratingSub.textContent =
        `Based on ${data.userRatingCount} Google Reviews`;
    }

    if(starsContainer && data.rating)
    {

      const fullStars = Math.floor(data.rating);
      
      const halfStar = data.rating % 1 >= 0.5;

      starsContainer.textContent =
        "★".repeat(fullStars) + (halfStar ? "½" : "");

    }

    renderGoogleReviews(data.reviews, grid);

  }

  catch
  {
    // silent fail — protects UI
  }

}

/* =========================================
   GOOGLE REVIEW RENDERER
========================================= */

function renderGoogleReviews(reviews, grid)
{

  if(!reviews?.length) return;

  grid.innerHTML = "";

  reviews.slice(0,5).forEach(review => 
  {

    const stars =
      "★".repeat(review.rating) +
      "☆".repeat(5 - review.rating);

    const text =
      review?.text?.text || "No review text provided.";

    const author =
      review?.authorAttribution?.displayName || "Google User";

    grid.insertAdjacentHTML("beforeend", `
      <div class="reviewCard">
        <div class="reviewStars">${stars}</div>
        <p class="reviewText">"${text}"</p>
        <div class="reviewAuthor">— ${author}</div>
      </div>
    `);

  });

}
