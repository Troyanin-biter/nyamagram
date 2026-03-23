import styles from './Avatar.module.css';

interface AvatarProps {
  src?: string | null;
  alt?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  online?: boolean;
  className?: string;
}

const sizeMap = { sm: 32, md: 48, lg: 96, xl: 128 };

export default function Avatar({ src, alt = '', size = 'md', online, className = '' }: AvatarProps) {
  const dimension = sizeMap[size];
  const initials = alt ? alt.charAt(0).toUpperCase() : '?';
  
  return (
    <div className={`${styles.wrapper} ${styles[size]} ${className}`}>
      {src ? (
        <img src={src} alt={alt} className={styles.image} />
      ) : (
        <div className={styles.fallback}>{initials}</div>
      )}
      {online !== undefined && (
        <span className={`${styles.status} ${online ? styles.online : styles.offline}`} />
      )}
    </div>
  );
}