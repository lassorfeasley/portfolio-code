/* === Makes draggable folders mimic GUI folders === */
function initFolderDrag() {
  const containers = document.querySelectorAll('.folder-grid');
  if (!containers.length) return;

  containers.forEach((container) => {
    const draggableFolders = container.querySelectorAll('.draggable-folder');

    draggableFolders.forEach(folder => {
      if (!folder || folder.dataset.folderDragAttached === 'true') return;
      folder.dataset.folderDragAttached = 'true';
      const link = folder.querySelector('a, .link-block');
      let isDragging = false;
      let startX, startY;

      // Use click capture to prevent navigation if we just dragged
      if (link) {
        link.addEventListener('click', (e) => {
          if (isDragging) {
            e.preventDefault();
            e.stopPropagation();
          }
        }, true);
      }

      folder.addEventListener('mousedown', function (e) {
        // Only start drag on left click
        if (e.button !== 0) return;
        
        e.preventDefault();
        isDragging = false;
        startX = e.clientX;
        startY = e.clientY;

        if (getComputedStyle(container).position === 'static') {
          container.style.position = 'relative';
        }

        const containerRect = container.getBoundingClientRect();
        const folderRect = folder.getBoundingClientRect();

        const offsetX = startX - folderRect.left;
        const offsetY = startY - folderRect.top;

        // Promote to absolute ONLY when we actually start dragging
        // But for now, mimic old behavior: immediately absolute on mousedown
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

          // Clamp to container bounds? Or allow free drag?
          // For now, match old logic: free drag relative to container
          const left = moveEvent.clientX - containerRect.left - offsetX;
          const top = moveEvent.clientY - containerRect.top - offsetY;
          folder.style.left = `${left}px`;
          folder.style.top = `${top}px`;
        };

        const onMouseUp = () => {
          document.removeEventListener('mousemove', onMouseMove);
          document.removeEventListener('mouseup', onMouseUp);
          folder.style.zIndex = '';
          
          // Note: We don't reset position to static/relative, 
          // so it stays dropped where the user left it.
          
          // Reset drag state slightly later to let click handler fire first if needed
          setTimeout(() => {
             isDragging = false;
          }, 50);
        };

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp, { once: true });
      });

      folder.ondragstart = () => false;
    });
  });
}

// Run on load and also expose for re-running if needed (e.g. client nav)
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initFolderDrag);
} else {
  initFolderDrag();
}
// Also try window load to be safe
window.addEventListener('load', initFolderDrag);

// Expose globally for re-initialization
window.initFolderDrag = initFolderDrag;

// Re-run periodically to catch dynamically rendered elements (React)
let folderDragRetries = 0;
const maxFolderDragRetries = 10;
const folderDragInterval = setInterval(() => {
  folderDragRetries++;
  const folders = document.querySelectorAll('.draggable-folder:not([data-folder-drag-attached="true"])');
  if (folders.length > 0) {
    initFolderDrag();
  }
  if (folderDragRetries >= maxFolderDragRetries) {
    clearInterval(folderDragInterval);
  }
}, 500);
