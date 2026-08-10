import styles from './Skeleton.module.css';

interface SkeletonProps {
    width?: string | number;
    height?: string | number;
    variant?: 'rectangular' | 'circular';
    className?: string;
}

export const Skeleton = ({
                             width,
                             height,
                             variant = 'rectangular',
                             className = ''
                         }: SkeletonProps) => {
    return (
        <div
            className={`${styles.skeleton} ${styles[variant]} ${className}`}
            style={{ width, height }}
        />
    );
};