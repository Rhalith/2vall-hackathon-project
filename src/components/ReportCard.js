import styles from './css/ReportCard.module.css';

export default function ReportCard({ address, victimCount, status }) {
  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>{address}</div>
      <div className={styles.cardContent}>
        <p>Tahmini mağdur sayısı: {victimCount}</p>
        <p>Durum: {status}</p>
      </div>
      <div className={styles.cardFooter}>
        <button className={`${styles.button} ${styles.buttonSuccess}`} disabled={status === 'Gidildi'}>
          Gidildi
        </button>
        <button className={`${styles.button} ${styles.buttonDanger}`} disabled={status === 'Asılsız'}>
          Asılsız
        </button>
      </div>
    </div>
  );
}