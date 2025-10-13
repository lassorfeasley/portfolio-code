/* === Causes retro windows to be randomly positioned and  on the screen === */
  function initRandomizer() {
    // Only run the script if the screen is at least as wide as an iPad in landscape (1024px)
    if (!window.matchMedia('(min-width: 1024px)').matches) {
      return;
    }

    // Adjustable parameters
    const MIN_WIDTH = 300;              // Minimum width for each retro window (in pixels)
    const MAX_WIDTH = 475;              // Maximum width for each retro window (in pixels)
    const MAX_HORIZONTAL_SCATTER = 125; // Maximum horizontal scatter (in pixels)
    const MAX_VERTICAL_SCATTER = 50;   // Maximum vertical scatter (in pixels)

    // Find each container that should have a cluttered desktop effect
    const clutteredContainers = document.querySelectorAll('.cluttered-desktop-container');

    clutteredContainers.forEach(container => {
      // Ensure the container stays in place:
      // 1. Set its position to relative (to serve as positioning context)
      // 2. Lock in its height so that it won't collapse when children are set to absolute.
      container.style.position = 'relative';
      container.style.height = container.offsetHeight + 'px';

      // Select all retro windows inside this container.
      const windows = container.querySelectorAll('.retro-window');

      // Utility function to generate a random offset in the range [-max, max]
      const randomOffset = (max) => (Math.random() < 0.5 ? -1 : 1) * Math.floor(Math.random() * (max + 1));

      windows.forEach(win => {
        // Capture the original rendered position from the static layout.
        const originalLeft = win.offsetLeft;
        const originalTop  = win.offsetTop;

        // 1. Randomize width between MIN_WIDTH and MAX_WIDTH.
        const randomWidth = Math.floor(Math.random() * (MAX_WIDTH - MIN_WIDTH + 1)) + MIN_WIDTH;
        win.style.width = randomWidth + 'px';

        // 2. Randomize the z-index between 1 and 500.
        const randomZIndex = Math.floor(Math.random() * 500) + 1;
        win.style.zIndex = randomZIndex;

        // 3. Calculate random horizontal and vertical offsets.
        const deltaLeft = randomOffset(MAX_HORIZONTAL_SCATTER);
        const deltaTop  = randomOffset(MAX_VERTICAL_SCATTER);

        // 4. Set the window to absolute positioning and apply the adjusted positions.
        win.style.position = 'absolute';
        win.style.left = (originalLeft + deltaLeft) + 'px';
        win.style.top  = (originalTop + deltaTop) + 'px';
      });
    });
  }

  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    try { initRandomizer(); } catch (e) { console.error(e); }
  } else {
    window.addEventListener('load', initRandomizer);
  }