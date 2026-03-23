import styles from './Input.module.css';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

export default function Input({ label, error, icon, className = '', ...props }: InputProps) {
  return (
    <div className={styles.wrapper}>
      {label && <label className={styles.label}>{label}</label>}
      <div className={`${styles.inputWrapper} ${error ? styles.error : ''}`}>
        {icon && <span className={styles.icon}>{icon}</span>}
        <input className={`${styles.input} ${icon ? styles.withIcon : ''} ${className}`} {...props} />
      </div>
      {error && <span className={styles.errorText}>{error}</span>}
    </div>
  );
}