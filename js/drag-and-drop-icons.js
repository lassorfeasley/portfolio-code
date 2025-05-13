/* === Makes draggable folders mimic GUI folders === */
document.addEventListener('DOMContentLoaded', function () {
  const container = document.querySelector('.folder-grid');
  if (!container) return;

  const draggableFolders = container.querySelectorAll('.draggable-folder');

  draggableFolders.forEach(folder => {
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