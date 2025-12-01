
  const slider = document.querySelector('.slider');
    const slides = document.querySelectorAll('.slider img');
    let slideIndex = 0;
    let lastScroll = 0;
    let slideWidth = slides[0].clientWidth;

    function updateSlide() {
        slider.style.transform = `translateX(${-slideIndex * slideWidth}px)`;
    }

    // Auto slide dengan infinite loop
    function autoSlide() {
        slideIndex++;
        if (slideIndex >= slides.length) {
            slideIndex = 0; // kembali ke foto pertama
        }
        updateSlide();
    }

    let interval = setInterval(autoSlide, 3000);

    // Resize handler agar responsif
    window.addEventListener('resize', () => {
        slideWidth = slides[0].clientWidth;
        updateSlide();
    });

    // ---- Manual swipe (drag) ----
    let startX = 0;
    let moveX = 0;
    let isDragging = false;

    const startDrag = (x) => {
        isDragging = true;
        startX = x;
        clearInterval(interval);
    };

    const moveDrag = (x) => {
        if (!isDragging) return;
        moveX = x - startX;
        slider.style.transform = `translateX(${moveX - slideIndex * slideWidth}px)`;
    };

    const endDrag = () => {
        if (!isDragging) return;
        isDragging = false;

        if (moveX < -50) slideIndex++;      // Geser kiri → next
        else if (moveX > 50) slideIndex--;  // Geser kanan → prev

        // Infinite loop manual
        if (slideIndex < 0) slideIndex = slides.length - 1;
        if (slideIndex >= slides.length) slideIndex = 0;

        updateSlide();
        interval = setInterval(autoSlide, 3000);
    };

    // Mouse event
    slider.addEventListener('mousedown', (e) => startDrag(e.clientX));
    slider.addEventListener('mousemove', (e) => moveDrag(e.clientX));
    slider.addEventListener('mouseup', endDrag);
    slider.addEventListener('mouseleave', endDrag);

    // Touch event (HP)
    slider.addEventListener('touchstart', (e) => startDrag(e.touches[0].clientX));
    slider.addEventListener('touchmove', (e) => moveDrag(e.touches[0].clientX));
    slider.addEventListener('touchend', endDrag);

    const phrases = [
    "Rasanya auto balik lagi! 😍✨",
    "Sekali coba langsung jatuh cinta! ❤️🤤",
    "Dijamin susah berhenti! 😆🍽️",
    "Cemilan favorit semua orang! ⭐🍡",
    "Rasa viral yang wajib kamu coba! 📈🔥",
    "Bikin lidah happy seharian! 😋🎉",
    "Kenikmatan yang tidak bisa ditolak! 🤩🍴",
    "Cemilan paling dicari tahun ini! 🔎🍢",
    "Bikin mulut kamu minta lagi! 🤤👌",
    "Jajanan yang bikin ketagihan! 🔥😋"
  ];

  const textEl = document.querySelector('.phrase');
  let phraseIndex = 0;

  function updateText() {
    textEl.classList.remove("show");

    setTimeout(() => {
      textEl.textContent = phrases[phraseIndex];
      textEl.classList.add("show");
      phraseIndex = (phraseIndex + 1) % phrases.length;
    }, 400); // waktu fade-out
  }

  updateText();
  setInterval(updateText, 4000); // 2.5 detik per teks


  const footer = document.getElementById("footer");

  window.addEventListener("scroll", () => {
    let currentScroll = window.pageYOffset;

    if (currentScroll > lastScroll) {
      // Scroll ke bawah → sembunyikan footer
      footer.classList.add("hide");
    } else {
      // Scroll ke atas → tampilkan footer
      footer.classList.remove("hide");
    }

    lastScroll = currentScroll;
    });