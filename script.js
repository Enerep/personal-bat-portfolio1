

//arrow 
document.addEventListener('DOMContentLoaded', function() {
    const arrow = document.querySelector('.arrow');

    if (arrow) {
        arrow.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);

            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth'
                });
            }
        });
    }
});

document.addEventListener('DOMContentLoaded', function() {
    // Select all anchor links with a href starting with '#'
    const scrollLinks = document.querySelectorAll('a[href^="#"]');

    scrollLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);

            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth'
                });
            }
        });
    });
});




document.addEventListener('DOMContentLoaded', function() {
    
    // --- NEW: Certificate Slider ---
    const sliderWrapper = document.querySelector('.slider-wrapper');
    const slides = document.querySelectorAll('.certificate-item');
    const prevButton = document.querySelector('.slider-arrow.prev');
    const nextButton = document.querySelector('.slider-arrow.next');
    const dotsContainer = document.querySelector('.slider-dots');
    
    if (sliderWrapper && slides.length > 0) {
        let currentIndex = 0;
        const totalSlides = slides.length;

        // Create dots
        for (let i = 0; i < totalSlides; i++) {
            const dot = document.createElement('span');
            dot.classList.add('dot');
            dot.dataset.index = i;
            dotsContainer.appendChild(dot);
        }
        
        const dots = document.querySelectorAll('.dot');
        
        function updateSlider() {
            sliderWrapper.style.transform = `translateX(-${currentIndex * 100}%)`;
            
            // Update active dot
            dots.forEach(dot => dot.classList.remove('active'));
            dots[currentIndex].classList.add('active');
        }

        function showNextSlide() {
            currentIndex = (currentIndex + 1) % totalSlides;
            updateSlider();
        }
        
        function showPrevSlide() {
            currentIndex = (currentIndex - 1 + totalSlides) % totalSlides;
            updateSlider();
        }

        nextButton.addEventListener('click', showNextSlide);
        prevButton.addEventListener('click', showPrevSlide);
        
        dots.forEach(dot => {
            dot.addEventListener('click', (e) => {
                currentIndex = parseInt(e.target.dataset.index);
                updateSlider();
            });
        });

        // Initialize slider
        updateSlider();
    }
});
