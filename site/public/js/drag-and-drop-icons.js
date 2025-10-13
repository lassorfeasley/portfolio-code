/* === Makes draggable folders mimic GUI folders === */
function initFolderDrags(root) {
  const isMobile = () => window.matchMedia('(pointer:coarse), (max-width: 767px)').matches;
  const containers = (root ? Array.from(root.querySelectorAll('.folder-grid')) : Array.from(document.querySelectorAll('.folder-grid')));
  if (!root && document.querySelector('.folder-grid')) {
    // also include top-level if root is not provided
    containers.unshift(document.querySelector('.folder-grid'));
  }

  containers.filter(Boolean).forEach((container) => {
    const draggableFolders = container.querySelectorAll('.draggable-folder');

    draggableFolders.forEach(folder => {
    if (isMobile()) return; // disable folder dragging on mobile
    const link = folder.querySelector('a, .link-block');
    let isDragging = false;
    let startX, startY;

    folder.addEventListener('mousedown', function (e) {
      e.preventDefault();
      isDragging = false;
      startX = e.clientX;
      startY = e.clientY;

      const containerRect = container.getBoundingClientRect();
      const folderRect = folder.getBoundingClientRect();

      const offsetX = startX - folderRect.left;
      const offsetY = startY - folderRect.top;

      folder.style.position = 'absolute';
      folder.style.left = (folderRect.left - containerRect.left) + 'px';
      folder.style.top = (folderRect.top - containerRect.top) + 'px';
      folder.style.width = folderRect.width + 'px';
      folder.style.height = folderRect.height + 'px';
      folder.style.zIndex = '9999';

      const onMouseMove = (moveEvent) => {
        const dx = moveEvent.clientX - startX;
        const dy = moveEvent.clientY - startY;
        if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
          isDragging = true;
        }

        const left = moveEvent.clientX - containerRect.left - offsetX;
        const top = moveEvent.clientY - containerRect.top - offsetY;
        folder.style.left = `${left}px`;
        folder.style.top = `${top}px`;
      };

      const onMouseUp = (upEvent) => {
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
        folder.style.zIndex = '';

        if (isDragging) {
          const preventClick = (clickEvent) => {
            clickEvent.preventDefault();
            clickEvent.stopPropagation();
            if (link) link.removeEventListener('click', preventClick, true);
          };
          if (link) link.addEventListener('click', preventClick, true);
        }
      };

      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp, { once: true });
    });

      folder.ondragstart = () => false;
    });
  });
}

// Run now if DOM is ready, otherwise wait
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => initFolderDrags());
} else {
  initFolderDrags();
}

// Observe for dynamically added folder grids
const folderObserver = new MutationObserver((mutations) => {
  for (const m of mutations) {
    m.addedNodes.forEach((n) => {
      if (!(n instanceof HTMLElement)) return;
      if (n.matches && n.matches('.folder-grid')) initFolderDrags(n);
      else if (n.querySelectorAll) {
        const grids = n.querySelectorAll('.folder-grid');
        if (grids.length) initFolderDrags(n);
      }
    });
  }
});
folderObserver.observe(document.body, { childList: true, subtree: true });