/* ========================================
   GALLERY INIT
======================================== */

document.addEventListener("DOMContentLoaded", initGallery);

function initGallery(){

  initHeaderReveal();
  initGalleryCardReveal(); 

}

/* ========================================
   HEADER SCROLL REVEAL
======================================== */

function initHeaderReveal()
{

  const headers = document.querySelectorAll(".galleryTitle");
  if(!headers.length) return;

  const observer = new IntersectionObserver((entries, obs) => {

    entries.forEach(entry => {

      if(!entry.isIntersecting) return;

      entry.target.classList.add("reveal");
      obs.unobserve(entry.target); 

    });

  },{
    rootMargin: "0px 0px -80px 0px", 
    threshold: 0.15
  });

  headers.forEach(header => observer.observe(header));

}

/* ========================================
   CARD REVEAL (AGENCY-LEVEL POLISH)
======================================== */

function initGalleryCardReveal()
{

  const cards = document.querySelectorAll(".galleryCard");
  
  if(!cards.length) return;

  const observer = new IntersectionObserver((entries, obs) => 
  {

    entries.forEach(entry => 
    {

      if(!entry.isIntersecting) return;

      entry.target.classList.add("cardReveal");
      
      obs.unobserve(entry.target);

    });

  },
  {
    rootMargin: "0px 0px -60px 0px",
    
    threshold: 0.1
  });

  cards.forEach(card => observer.observe(card));

}
