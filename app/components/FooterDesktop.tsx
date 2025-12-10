import Link from 'next/link';
import type { FolderLink } from '@/lib/domain/folder-links/types';
import { defaultFolderLinks } from '@/lib/domain/folder-links/defaults';

type FooterDesktopProps = {
  folderLinks?: FolderLink[];
};

export default function FooterDesktop({ folderLinks = defaultFolderLinks }: FooterDesktopProps) {
  // Debug: Log footer folder links
  console.log('🔍 FooterDesktop - Folder links:', folderLinks);
  folderLinks.forEach((link, index) => {
    console.log(`🔍 FooterDesktop - Link ${index}:`, {
      id: link.id,
      label: link.label,
      icon: link.icon,
      iconType: typeof link.icon,
      iconLength: link.icon?.length,
      iconCharCodes: link.icon ? Array.from(link.icon).map(c => `U+${c.charCodeAt(0).toString(16).toUpperCase().padStart(4, '0')}`) : null,
      iconJSON: JSON.stringify(link.icon),
    });
  });

  return (
    <div className="globalmargin">
      <div id="desktop" className="windowcanvas">
        <div id="w-node-d338f0d6-9d2e-be6a-b9db-22c2d03af9e7-c4a829df" className="wide">
          <div className="align-right">
            <div className="folder-grid">
              {folderLinks.map((link) => (
                <div key={link.id} className="icon-placeholder">
                  <div className="draggable-folder">
                    {link.external ? (
                      <a href={link.href} target="_blank" rel="noreferrer" className="iconlink w-inline-block">
                        <div className="folder" data-debug-icon={JSON.stringify(link.icon)} data-debug-label={link.label}>
                          {link.icon || '[NO ICON]'}
                        </div>
                        <div className="navlink foldericon">{link.label}</div>
                      </a>
                    ) : (
                      <Link href={link.href} className="iconlink w-inline-block">
                        <div className="folder" data-debug-icon={JSON.stringify(link.icon)} data-debug-label={link.label}>
                          {link.icon || '[NO ICON]'}
                        </div>
                        <div className="navlink foldericon">{link.label}</div>
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
