import Link from 'next/link';
import type { FolderLink } from '@/lib/domain/folder-links/types';

type FooterDesktopProps = {
  folderLinks?: FolderLink[];
};

// Default fallback links
const defaultFolderLinks: FolderLink[] = [
  { id: '1', label: 'UI design', icon: '\uf245', href: '/project-types/interaction-design', external: false, displayOrder: 1 },
  { id: '2', label: 'Writing', icon: '\uf5ad', href: '/project-types/writing', external: false, displayOrder: 2 },
  { id: '3', label: 'Resume', icon: '\uf15b', href: 'https://docs.google.com/document/d/1qz8Qwrk6aoD1n1vEe5Zd7OhaEhun8UOuY0xcW2SnRmg/edit?tab=t.0', external: true, displayOrder: 3 },
  { id: '4', label: 'UX design', icon: '\uf06e', href: '/project-types/innovation', external: false, displayOrder: 4 },
  { id: '5', label: 'Walking forward', icon: '\uf54b', href: 'https://walking.lassor.com', external: true, displayOrder: 5 },
  { id: '6', label: 'LinkedIn', icon: '\uf0c1', href: 'https://www.linkedin.com/in/lassor/', external: true, displayOrder: 6 },
  { id: '7', label: 'Industrial design', icon: '\uf546', href: '/project-types/industrial-design', external: false, displayOrder: 7 },
  { id: '8', label: 'Seatback Safety', icon: '\uf072', href: 'https://www.lassor.com/projects/seatback-safety', external: true, displayOrder: 8 },
];

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
              {/* Extra "Account" link for the footer */}
              <div className="icon-placeholder">
                <div className="draggable-folder">
                  <Link href="/auth/login" className="iconlink w-inline-block">
                    <div className="folder"></div>
                    <div className="navlink foldericon">Account</div>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
