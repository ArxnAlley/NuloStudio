// ================================================================
//  NULO STUDIO PREVIEW HUB  |  js/indexJS.js
// ================================================================


// =======================================
//          ELEMENT REFERENCES
// =======================================

const drawElements = [...document.querySelectorAll(".draw")];

const studioFill   = document.querySelector(".studio-fill");
const studioStroke = document.querySelector(".studio-draw");

const heroTag  = document.querySelector(".hero-tag");
const heroTag2 = document.querySelector(".hero-tag2");

const nav      = document.querySelector(".main-nav");
const navLinks = document.querySelector(".nav-links");
const navLogo  = document.querySelector(".nav-logo");

const primaryCTA   = document.querySelector(".primary-cta");
const secondaryCTA = document.querySelector(".secondary-cta");


// =======================================
//          LOGO DRAW PREP
// =======================================

function prepare(el)
{

    const length =
        el.tagName.toLowerCase() === "text"
            ? el.getComputedTextLength()
            : el.getTotalLength();

    el.style.strokeDasharray  = length;
    el.style.strokeDashoffset = length;
    el.style.opacity          = 0;

}

drawElements.forEach(prepare);


// =======================================
//          INTRO SEQUENCE
// =======================================

function animateIntro()
{

    let delay = 0;

    drawElements.forEach((el) =>
    {

        setTimeout(() =>
        {

            el.style.opacity          = 1;
            el.style.transition       = "stroke-dashoffset .9s cubic-bezier(.65,0,.35,1)";
            el.style.strokeDashoffset = 0;

        }, delay);

        delay += 650;

    });

    const fillTime = delay + 200;

    setTimeout(() =>
    {

        studioFill.style.opacity = 1;

        drawElements.forEach((el) => (el.style.transition = "none"));

        if (studioStroke) studioStroke.style.opacity = 0;

    }, fillTime);

    setTimeout(() =>
    {

        heroTag.style.opacity   = 1;
        heroTag.style.transform = "translateX(0)";

    }, fillTime + 500);

    setTimeout(() =>
    {

        heroTag2.style.opacity   = 1;
        heroTag2.style.transform = "translateX(0)";

    }, fillTime + 900);

    setTimeout(() =>
    {

        nav.style.opacity        = 1;
        nav.style.pointerEvents  = "auto";
        navLinks.style.opacity   = 1;

    }, fillTime + 1700);

    setTimeout(() =>
    {

        navLogo.style.opacity   = 1;
        navLogo.style.transform = "translateY(0)";

    }, fillTime + 2000);

    setTimeout(() => primaryCTA.classList.add("reveal"),   fillTime + 2300);
    setTimeout(() => secondaryCTA.classList.add("reveal"), fillTime + 2500);

}

setTimeout(animateIntro, 250);


// =======================================
//      BROWSE DEMOS CTA
// =======================================

const browseCTA = document.getElementById("browseDemosCTA");

if (browseCTA)
{

    browseCTA.addEventListener("click", (e) =>
    {

        e.preventDefault();

        const demoSection = document.getElementById("demoGrid");

        if (demoSection)
        {

            demoSection.scrollIntoView({ behavior: "smooth" });

        }

    });

}


// =======================================
//      MOBILE DRAWER
// =======================================

const mobileMenuBtn    = document.getElementById("mobileMenuBtn");
const mobileDrawer     = document.getElementById("mobileDrawer");
const mobileDrawerClose = document.getElementById("mobileDrawerClose");

if (mobileMenuBtn)
{

    mobileMenuBtn.addEventListener("click", () =>
    {

        mobileDrawer.classList.toggle("open");

    });

}

if (mobileDrawerClose)
{

    mobileDrawerClose.addEventListener("click", () =>
    {

        mobileDrawer.classList.remove("open");

    });

}

const mobileCatBtns = document.querySelectorAll(".mobileCatBtn");

mobileCatBtns.forEach((btn) =>
{

    btn.addEventListener("click", () =>
    {

        const parent = btn.closest(".mobileCategory");
        const isOpen = parent.classList.contains("open");

        document.querySelectorAll(".mobileCategory").forEach((c) =>
        {
            c.classList.remove("open");
        });

        if (!isOpen) parent.classList.add("open");

    });

});


// =======================================
//      DEMO GRID SCROLL REVEAL
// =======================================

const demoCards = document.querySelectorAll(".demoCard");

const cardObserver = new IntersectionObserver(

    (entries) =>
    {

        entries.forEach((entry) =>
        {

            if (entry.isIntersecting)
            {

                const card  = entry.target;
                const delay = (card.dataset.index || 0) * 80;

                setTimeout(() =>
                {

                    card.style.opacity   = "1";
                    card.style.transform = "translateY(0)";

                }, delay);

                cardObserver.unobserve(card);

            }

        });

    },

    { threshold: 0.12 }

);

demoCards.forEach((card, i) =>
{

    card.dataset.index = i;

    card.style.opacity    = "0";
    card.style.transform  = "translateY(40px)";
    card.style.transition = "opacity .7s ease, transform .7s cubic-bezier(.65,0,.35,1), box-shadow .45s ease";

    cardObserver.observe(card);

});